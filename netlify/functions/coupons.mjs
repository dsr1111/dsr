// 위키 메인 페이지 쿠폰 관리 API (관리자 전용 쓰기).
// 읽기는 브라우저가 Supabase에서 직접 하므로 이 함수는 로그인/등록/수정/삭제 때만 실행됩니다.
//
// Netlify 환경 변수:
//   SUPABASE_URL               예) https://xxxx.supabase.co
//   SUPABASE_SECRET_KEY        secret 키(sb_secret_...) — 절대 브라우저에 노출 금지
//                              (예전 이름 SUPABASE_SERVICE_ROLE_KEY 도 인식)
//   COUPON_ADMIN_PASSWORD      관리자 비밀번호 (바꾸면 기존 로그인은 모두 만료)
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12시간
const COLUMNS = 'id,name,code,ends_at,items,version,created_at,updated_at';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' },
  });
}

function env() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const password = process.env.COUPON_ADMIN_PASSWORD;
  if (!url || !key || !password) return null;
  return { url: url.replace(/\/+$/, ''), key, password };
}

// 비밀번호 + service key로 서명 키를 만들어 비밀번호를 바꾸면 기존 토큰이 무효가 됩니다.
function signingKey(cfg) {
  return createHash('sha256').update(`coupon-admin:${cfg.password}:${cfg.key}`).digest();
}

function sign(cfg, payload) {
  return createHmac('sha256', signingKey(cfg)).update(payload).digest('base64url');
}

function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

function issueToken(cfg) {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `v1.${exp}`;
  return { token: `${payload}.${sign(cfg, payload)}`, expiresAt: exp };
}

function verifyToken(cfg, header) {
  const token = (header || '').replace(/^Bearer\s+/i, '');
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return safeEqual(parts[2], sign(cfg, `${parts[0]}.${parts[1]}`));
}

function str(value, max) {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  return s.length >= 1 && s.length <= max ? s : null;
}

/** 입력 검증 — 통과하면 DB에 넣을 값, 아니면 { error } */
function readCoupon(body) {
  const name = str(body?.name, 60);
  if (!name) return { error: '쿠폰 이름을 입력해주세요. (최대 60자)' };
  const code = str(body?.code, 40);
  if (!code) return { error: '쿠폰 번호를 입력해주세요. (최대 40자)' };

  let ends_at = null;
  if (body.ends_at !== null && body.ends_at !== undefined && body.ends_at !== '') {
    const d = new Date(body.ends_at);
    if (typeof body.ends_at !== 'string' || Number.isNaN(d.getTime())) return { error: '마감 일시가 올바르지 않습니다.' };
    ends_at = d.toISOString();
  }

  if (!Array.isArray(body.items) || body.items.length > 30) return { error: '구성품은 최대 30개까지 입력할 수 있습니다.' };
  const items = [];
  for (const raw of body.items) {
    const itemName = str(raw?.name, 60);
    const qty = Number(raw?.qty);
    const grade = Number(raw?.grade);
    if (!itemName) return { error: '구성품 이름을 입력해주세요. (최대 60자)' };
    if (!Number.isInteger(qty) || qty < 1 || qty > 999999) return { error: `"${itemName}" 수량이 올바르지 않습니다.` };
    if (!Number.isInteger(grade) || grade < 1 || grade > 4) return { error: `"${itemName}" 등급이 올바르지 않습니다.` };
    items.push({ name: itemName, qty, grade });
  }
  return { value: { name, code, ends_at, items } };
}

async function db(cfg, method, query, body) {
  const res = await fetch(`${cfg.url}/rest/v1/site_coupons${query}`, {
    method,
    headers: {
      apikey: cfg.key,
      // 예전 JWT 형식 service_role 키만 Authorization이 필요 (새 sb_secret_ 키는 apikey만)
      ...(cfg.key.startsWith("eyJ") ? { Authorization: `Bearer ${cfg.key}` } : {}),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : [];
}

export default async (request) => {
  const cfg = env();
  if (!cfg) return json({ error: '서버 설정이 완료되지 않았습니다. (환경 변수 확인)' }, 500);

  // 같은 사이트에서 보낸 JSON 요청만 허용
  if (request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: '허용되지 않은 요청입니다.' }, 403);
  if (request.method !== 'GET' && request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    return json({ error: '요청 형식을 확인해주세요.' }, 400);
  }

  let body = {};
  if (request.method !== 'GET') {
    try { body = await request.json(); } catch { return json({ error: '요청 형식을 확인해주세요.' }, 400); }
  }

  // 로그인: 비밀번호 → 12시간짜리 토큰
  if (request.method === 'POST' && body?.action === 'login') {
    if (typeof body.password !== 'string' || !safeEqual(body.password, cfg.password)) {
      await new Promise((r) => setTimeout(r, 800)); // 무차별 대입 속도 늦추기
      return json({ error: '비밀번호가 올바르지 않습니다.' }, 401);
    }
    return json(issueToken(cfg));
  }

  if (!verifyToken(cfg, request.headers.get('authorization'))) {
    return json({ error: '관리자 로그인이 만료되었습니다. 다시 로그인해주세요.' }, 401);
  }

  try {
    if (request.method === 'GET') {
      // 관리자용: 지난 쿠폰까지 전부
      const rows = await db(cfg, 'GET', `?select=${COLUMNS}&order=ends_at.asc.nullsfirst,created_at.asc`);
      return json({ coupons: rows });
    }

    if (request.method === 'POST') {
      const parsed = readCoupon(body);
      if (parsed.error) return json({ error: parsed.error }, 400);
      const [row] = await db(cfg, 'POST', `?select=${COLUMNS}`, parsed.value);
      return json({ coupon: row }, 201);
    }

    if (request.method === 'PUT' || request.method === 'DELETE') {
      const id = typeof body.id === 'string' && UUID_RE.test(body.id) ? body.id : null;
      const version = Number(body.version);
      if (!id || !Number.isInteger(version) || version < 1) return json({ error: '쿠폰 정보를 확인해주세요.' }, 400);
      const match = `?id=eq.${id}&version=eq.${version}&select=${COLUMNS}`;

      if (request.method === 'DELETE') {
        const rows = await db(cfg, 'DELETE', match);
        if (!rows.length) return json({ error: '다른 관리자가 먼저 수정했거나 이미 삭제된 쿠폰입니다. 새로고침 후 다시 시도해주세요.' }, 409);
        return json({ ok: true });
      }

      const parsed = readCoupon(body);
      if (parsed.error) return json({ error: parsed.error }, 400);
      // 버전이 일치할 때만 저장 (다른 관리자가 먼저 수정했으면 덮어쓰지 않음)
      const rows = await db(cfg, 'PATCH', match, { ...parsed.value, version: version + 1, updated_at: new Date().toISOString() });
      if (!rows.length) return json({ error: '다른 관리자가 먼저 수정했습니다. 새로고침 후 다시 시도해주세요.' }, 409);
      return json({ coupon: rows[0] });
    }

    return json({ error: '지원하지 않는 요청입니다.' }, 405);
  } catch (error) {
    console.error('Coupon API failed:', error);
    return json({ error: '쿠폰을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.' }, 503);
  }
};
