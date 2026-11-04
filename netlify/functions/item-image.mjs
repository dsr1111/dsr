// 아이템 이미지 업로드 (관리자 전용) — CDN(R2)에 없는 아이템 이미지를 dsrwiki/item/[이름].webp 로 올립니다.
// 이미 있는 이미지는 replace: true 일 때만 덮어씁니다.
//
// Netlify 환경 변수: digimon-admin 과 같음 (COUPON_ADMIN_PASSWORD, SUPABASE_SECRET_KEY, R2_*)
import { json, authEnv, verifyToken, sameSiteJson } from '../lib/admin-auth.mjs';
import { r2Env, createR2 } from '../lib/r2.mjs';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** 쿠폰 화면(index.js couponItemImageUrl)과 같은 규칙으로 파일 이름을 만듭니다 */
function itemFileName(name) {
  const clean = String(name).trim().replace(/\s*\(\d+(일|시간)\)$/, '').replace(/^\[기간제\]\s*/, '');
  return clean.replace(/%/g, '^').replace(/["\\]/g, '');
}

function decodeImage(dataUrl) {
  const m = typeof dataUrl === 'string' && dataUrl.match(/^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const bytes = Buffer.from(m[2], 'base64');
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return null;
  const isWebp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  const isPng = bytes[0] === 0x89 && bytes.toString('ascii', 1, 4) === 'PNG';
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const contentType = isWebp ? 'image/webp' : isPng ? 'image/png' : isJpeg ? 'image/jpeg' : null;
  return contentType ? { bytes, contentType } : null;
}

export default async (request) => {
  const auth = authEnv();
  const r2cfg = r2Env();
  if (!auth || !r2cfg) return json({ error: '서버 설정이 완료되지 않았습니다. (R2 / 관리자 환경 변수 확인)' }, 500);
  if (!sameSiteJson(request)) return json({ error: '허용되지 않은 요청입니다.' }, 403);
  if (!verifyToken(auth, request.headers.get('authorization'))) {
    return json({ error: '관리자 로그인이 만료되었습니다. 다시 로그인해주세요.' }, 401);
  }
  if (request.method !== 'POST') return json({ error: '지원하지 않는 요청입니다.' }, 405);

  let body;
  try { body = await request.json(); } catch { return json({ error: '요청 형식을 확인해주세요.' }, 400); }
  const file = itemFileName(body?.name ?? '');
  if (!file || file.length > 80 || /[\/\u0000-\u001f]/.test(file) || file === '.' || file === '..') {
    return json({ error: '아이템 이름을 확인해주세요.' }, 400);
  }
  const img = decodeImage(body.image);
  if (!img) return json({ error: '이미지는 2MB 이하의 webp/png/jpg만 가능합니다.' }, 400);

  const key = `dsrwiki/item/${file}.webp`;
  try {
    const r2 = createR2(r2cfg);
    if (body.replace !== true && await r2.exists(key)) {
      return json({ error: `"${file}" 이미지가 이미 있습니다.`, exists: true }, 409);
    }
    await r2.put(key, img.bytes, img.contentType);
    return json({ ok: true, key, url: `https://media.dsrwiki.com/${key}` });
  } catch (error) {
    console.error('Item image upload failed:', error);
    return json({ error: '이미지를 올리지 못했습니다. 잠시 후 다시 시도해주세요.' }, 503);
  }
};
