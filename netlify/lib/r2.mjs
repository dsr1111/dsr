// Cloudflare R2 (S3 호환 API) 최소 클라이언트 — 외부 패키지 없이 AWS Signature V4로 서명합니다.
//
// Netlify 환경 변수:
//   R2_ACCOUNT_ID         Cloudflare 계정 ID
//   R2_ACCESS_KEY_ID      R2 API 토큰의 Access Key ID
//   R2_SECRET_ACCESS_KEY  R2 API 토큰의 Secret Access Key (절대 브라우저에 노출 금지)
//   R2_BUCKET             media.dsrwiki.com 이 연결된 버킷 이름
//   R2_ENDPOINT           (선택) 기본값 https://<계정 ID>.r2.cloudflarestorage.com
import { createHash, createHmac } from 'node:crypto';

const sha256Hex = (data) => createHash('sha256').update(data).digest('hex');
const hmac = (key, data) => createHmac('sha256', key).update(data).digest();

/** S3 경로 인코딩: 각 구간을 RFC 3986 방식으로 인코딩하고 "/"는 유지 */
export function encodeKey(key) {
  return key.split('/').map((seg) => encodeURIComponent(seg).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)).join('/');
}

/**
 * AWS SigV4 서명 헤더 생성.
 * headers에 들어 있는 모든 헤더(+ host, x-amz-date, x-amz-content-sha256)를 서명합니다.
 */
export function signRequest({ method, url, headers = {}, body, accessKeyId, secretAccessKey, region = 'auto', service = 's3', date = new Date() }) {
  const u = new URL(url);
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = amzDate.slice(0, 8);
  const payloadHash = headers['x-amz-content-sha256'] || sha256Hex(body ?? '');

  const all = { ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()])) };
  all.host = u.host;
  all['x-amz-date'] = amzDate;
  all['x-amz-content-sha256'] = payloadHash;
  const names = Object.keys(all).sort();
  const canonicalHeaders = names.map((n) => `${n}:${all[n]}\n`).join('');
  const signedHeaders = names.join(';');

  const query = [...u.searchParams.entries()]
    .map(([k, v]) => [encodeURIComponent(k), encodeURIComponent(v)])
    .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`).join('&');

  const canonicalRequest = [method, u.pathname, query, canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${day}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n');
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, day), region), service), 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  delete all.host; // fetch가 URL에서 자동으로 넣음
  return {
    ...all,
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

export function r2Env() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accessKeyId || !secretAccessKey || !bucket || (!accountId && !process.env.R2_ENDPOINT)) return null;
  const endpoint = (process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`).replace(/\/+$/, '');
  return { endpoint, bucket, accessKeyId, secretAccessKey };
}

/** W/"abc" → "abc" */
export function strongEtag(etag) {
  return etag ? etag.replace(/^W\//i, '') : etag;
}

export function createR2(cfg) {
  const objectUrl = (key) => `${cfg.endpoint}/${encodeURIComponent(cfg.bucket)}/${encodeKey(key)}`;

  async function send(method, key, { body, headers = {} } = {}) {
    const url = objectUrl(key);
    const signed = signRequest({ method, url, headers, body, accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey });
    return fetch(url, { method, headers: signed, body });
  }

  return {
    /** { status, etag, text } — 없으면 status 404 */
    async getText(key) {
      // 압축 전송되면 Cloudflare가 ETag를 약한 형식(W/"...")으로 바꿔서 If-Match에 쓸 수 없으므로
      // 압축 없이 받고, 혹시 W/ 가 붙어 있으면 떼어냅니다.
      const res = await send('GET', key, { headers: { 'accept-encoding': 'identity' } });
      return { status: res.status, etag: strongEtag(res.headers.get('etag')), text: res.status === 200 ? await res.text() : null };
    },
    /** 존재 여부 */
    async exists(key) {
      const res = await send('HEAD', key);
      return res.status === 200;
    },
    /** 업로드. ifMatch를 주면 그 ETag일 때만 덮어씀 (아니면 412) */
    async put(key, body, contentType, { ifMatch } = {}) {
      const headers = { 'content-type': contentType };
      if (ifMatch) headers['if-match'] = ifMatch;
      const res = await send('PUT', key, { body, headers });
      if (!res.ok) {
        const err = new Error(`R2 PUT ${key} ${res.status}: ${(await res.text()).slice(0, 200)}`);
        err.status = res.status;
        throw err;
      }
      return { etag: res.headers.get('etag') };
    },
    /** 버킷 안에서 복사 (백업 / 이름 변경 시 이미지 이동) */
    async copy(fromKey, toKey) {
      const res = await send('PUT', toKey, { headers: { 'x-amz-copy-source': `/${encodeURIComponent(cfg.bucket)}/${encodeKey(fromKey)}` } });
      if (!res.ok) throw new Error(`R2 COPY ${fromKey} -> ${toKey} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    },
  };
}
