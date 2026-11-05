// 관리자 로그인 토큰 / 공통 응답 — site-admin, digimon-admin 함수가 같이 사용합니다.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12시간

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' },
  });
}

/** 로그인에 필요한 환경 변수. 하나라도 없으면 null */
export function authEnv() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const password = process.env.COUPON_ADMIN_PASSWORD;
  if (!key || !password) return null;
  return { key, password };
}

// 비밀번호 + secret 키로 서명 키를 만들어 비밀번호를 바꾸면 기존 토큰이 무효가 됩니다.
function signingKey(cfg) {
  return createHash('sha256').update(`coupon-admin:${cfg.password}:${cfg.key}`).digest();
}

function sign(cfg, payload) {
  return createHmac('sha256', signingKey(cfg)).update(payload).digest('base64url');
}

export function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export function issueToken(cfg) {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `v1.${exp}`;
  // ttl: 브라우저는 자기 시계 대신 "지금부터 몇 ms" 로 만료를 계산 (PC 시계가 틀려도 동작)
  return { token: `${payload}.${sign(cfg, payload)}`, expiresAt: exp, ttl: TOKEN_TTL_MS };
}

export function verifyToken(cfg, header) {
  const token = (header || '').replace(/^Bearer\s+/i, '');
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return safeEqual(parts[2], sign(cfg, `${parts[0]}.${parts[1]}`));
}

/** 같은 사이트에서 보낸 JSON 요청인지 (GET은 content-type 검사 생략) */
export function sameSiteJson(request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  if (request.method === 'GET') return true;
  return request.headers.get('content-type')?.split(';')[0].trim() === 'application/json';
}
