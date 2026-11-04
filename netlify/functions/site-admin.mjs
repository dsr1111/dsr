// 위키 메인 페이지 관리 API (관리자 전용 쓰기) — 쿠폰 / 이벤트 캘린더 / 레이드 타이머.
// 읽기는 브라우저가 Supabase에서 직접 하므로 이 함수는 로그인/등록/수정/삭제 때만 실행됩니다.
//
// Netlify 환경 변수:
//   SUPABASE_URL               예) https://xxxx.supabase.co
//   SUPABASE_SECRET_KEY        secret 키(sb_secret_...) — 절대 브라우저에 노출 금지
//                              (예전 이름 SUPABASE_SERVICE_ROLE_KEY 도 인식)
//   COUPON_ADMIN_PASSWORD      관리자 비밀번호 (바꾸면 기존 로그인은 모두 만료)
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12시간
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

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
  return { url: url.replace(/\/+$/, '').replace(/\/rest\/v1$/, ''), key, password };
}

// ---------- 로그인 토큰 ----------
// 비밀번호 + secret 키로 서명 키를 만들어 비밀번호를 바꾸면 기존 토큰이 무효가 됩니다.
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

// ---------- 입력 검증 도우미 ----------
function str(value, max) {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  return s.length >= 1 && s.length <= max ? s : null;
}

/** 빈 값이면 null, 아니면 ISO 문자열, 형식이 틀리면 undefined */
function optionalDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function readTimes(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) return null;
  const times = [...new Set(value.map((t) => (typeof t === 'string' ? t.trim() : '')))];
  return times.every((t) => TIME_RE.test(t)) ? times.sort() : null;
}

/** 비어 있으면 null, 길이 초과면 undefined */
function optionalStr(value, max) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return undefined;
  const s = value.trim();
  if (!s) return null;
  return s.length <= max ? s : undefined;
}

// ---------- 리소스별 검증 ----------
function readCoupon(body) {
  const name = str(body?.name, 60);
  if (!name) return { error: '쿠폰 이름을 입력해주세요. (최대 60자)' };
  const code = str(body?.code, 40);
  if (!code) return { error: '쿠폰 번호를 입력해주세요. (최대 40자)' };
  const ends_at = optionalDate(body.ends_at);
  if (ends_at === undefined) return { error: '마감 일시가 올바르지 않습니다.' };

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

function readEvent(body) {
  const title = str(body?.title, 80);
  if (!title) return { error: '이벤트 제목을 입력해주세요. (최대 80자)' };
  const starts_at = optionalDate(body.starts_at);
  if (!starts_at) return { error: '시작 일시를 입력해주세요.' };
  const ends_at = optionalDate(body.ends_at);
  if (ends_at === undefined) return { error: '종료 일시가 올바르지 않습니다.' };
  if (ends_at && ends_at < starts_at) return { error: '종료 일시가 시작 일시보다 빠릅니다.' };
  const color = (v) => (v === null || v === undefined || v === '' ? null : COLOR_RE.test(v) ? v.toLowerCase() : undefined);
  const background_color = color(body.background_color);
  const text_color = color(body.text_color);
  if (background_color === undefined || text_color === undefined) return { error: '색상 형식이 올바르지 않습니다.' };
  return { value: { title, starts_at, ends_at, background_color, text_color } };
}

function readSchedule(s) {
  const type = s?.type;
  if (type === 'daily') {
    const times = readTimes(s.times);
    return times ? { type, times } : { error: '시간을 HH:MM 형식으로 입력해주세요.' };
  }
  if (type === 'weekly') {
    const times = readTimes(s.times);
    if (!times) return { error: '시간을 HH:MM 형식으로 입력해주세요.' };
    const days = Array.isArray(s.days) ? [...new Set(s.days.map(Number))].sort() : [];
    if (!days.length || !days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) return { error: '요일을 하나 이상 선택해주세요.' };
    return { type, times, days };
  }
  if (type === 'biweekly') {
    const times = readTimes(s.times);
    if (!times) return { error: '시간을 HH:MM 형식으로 입력해주세요.' };
    if (!validDate(s.baseDate)) return { error: '기준 날짜를 입력해주세요.' };
    return { type, times, baseDate: s.baseDate };
  }
  if (type === 'custom_weekly') {
    if (!Array.isArray(s.schedules) || s.schedules.length < 1 || s.schedules.length > 30) {
      return { error: '요일별 시간을 하나 이상 입력해주세요. (최대 30개)' };
    }
    const schedules = [];
    for (const row of s.schedules) {
      const day = Number(row?.day);
      const time = typeof row?.time === 'string' ? row.time.trim() : '';
      if (!Number.isInteger(day) || day < 0 || day > 6 || !TIME_RE.test(time)) return { error: '요일별 시간 형식이 올바르지 않습니다.' };
      schedules.push({ day, time });
    }
    return { type, schedules };
  }
  if (type === 'rotation') {
    const baseTime = typeof s.baseTime === 'string' ? s.baseTime.trim() : '';
    if (!TIME_RE.test(baseTime)) return { error: '기준 시간을 HH:MM 형식으로 입력해주세요.' };
    if (!validDate(s.baseDate)) return { error: '기준 날짜를 입력해주세요.' };
    const stepMinutes = Number(s.stepMinutes);
    if (!Number.isInteger(stepMinutes) || stepMinutes < 0 || stepMinutes > 720) return { error: '하루마다 밀리는 시간(분)은 0~720 사이로 입력해주세요.' };
    return { type, baseTime, baseDate: s.baseDate, stepMinutes };
  }
  return { error: '일정 종류를 선택해주세요.' };
}

function readRaid(body) {
  const name = str(body?.name, 40);
  if (!name) return { error: '레이드 이름을 입력해주세요. (최대 40자)' };
  const image_name = optionalStr(body.image_name, 60);
  if (image_name === undefined) return { error: '이미지 이름이 너무 깁니다. (최대 60자)' };
  const map_image = optionalStr(body.map_image, 60);
  if (map_image === undefined) return { error: '맵 이미지 이름이 너무 깁니다. (최대 60자)' };
  const map = optionalStr(body.map, 40);
  if (map === undefined) return { error: '맵 이름이 너무 깁니다. (최대 40자)' };
  const schedule = readSchedule(body.schedule);
  if (schedule.error) return schedule;
  const active_from = optionalDate(body.active_from);
  const active_until = optionalDate(body.active_until);
  if (active_from === undefined || active_until === undefined) return { error: '기간 형식이 올바르지 않습니다.' };
  if (active_from && active_until && active_until <= active_from) return { error: '종료 일시가 시작 일시보다 빠릅니다.' };
  return { value: { name, image_name, map: map || '', map_image, schedule, active_from, active_until } };
}

const RESOURCES = {
  coupons: {
    table: 'site_coupons',
    columns: 'id,name,code,ends_at,items,version,created_at,updated_at',
    order: 'ends_at.asc.nullsfirst,created_at.asc',
    read: readCoupon,
  },
  events: {
    table: 'site_events',
    columns: 'id,title,starts_at,ends_at,background_color,text_color,version,created_at,updated_at',
    order: 'starts_at.desc',
    read: readEvent,
  },
  raids: {
    table: 'site_raids',
    columns: 'id,name,image_name,map,map_image,schedule,active_from,active_until,version,created_at,updated_at',
    order: 'created_at.asc',
    read: readRaid,
  },
};

async function db(cfg, method, table, query, body) {
  const res = await fetch(`${cfg.url}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: cfg.key,
      // 예전 JWT 형식 service_role 키만 Authorization이 필요 (새 sb_secret_ 키는 apikey만)
      ...(cfg.key.startsWith('eyJ') ? { Authorization: `Bearer ${cfg.key}` } : {}),
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

  const resourceName = request.method === 'GET'
    ? new URL(request.url).searchParams.get('resource') || 'coupons'
    : body.resource || 'coupons';
  const resource = Object.hasOwn(RESOURCES, resourceName) ? RESOURCES[resourceName] : null;
  if (!resource) return json({ error: '알 수 없는 항목입니다.' }, 400);
  const { table, columns } = resource;

  try {
    if (request.method === 'GET') {
      // 관리자용: 지난 항목까지 전부
      const rows = await db(cfg, 'GET', table, `?select=${columns}&order=${resource.order}`);
      return json({ rows });
    }

    if (request.method === 'POST') {
      const parsed = resource.read(body);
      if (parsed.error) return json({ error: parsed.error }, 400);
      const [row] = await db(cfg, 'POST', table, `?select=${columns}`, parsed.value);
      return json({ row }, 201);
    }

    if (request.method === 'PUT' || request.method === 'DELETE') {
      const id = typeof body.id === 'string' && UUID_RE.test(body.id) ? body.id : null;
      const version = Number(body.version);
      if (!id || !Number.isInteger(version) || version < 1) return json({ error: '항목 정보를 확인해주세요.' }, 400);
      const match = `?id=eq.${id}&version=eq.${version}&select=${columns}`;

      if (request.method === 'DELETE') {
        const rows = await db(cfg, 'DELETE', table, match);
        if (!rows.length) return json({ error: '다른 관리자가 먼저 수정했거나 이미 삭제된 항목입니다. 새로고침 후 다시 시도해주세요.' }, 409);
        return json({ ok: true });
      }

      const parsed = resource.read(body);
      if (parsed.error) return json({ error: parsed.error }, 400);
      // 버전이 일치할 때만 저장 (다른 관리자가 먼저 수정했으면 덮어쓰지 않음)
      const rows = await db(cfg, 'PATCH', table, match, { ...parsed.value, version: version + 1, updated_at: new Date().toISOString() });
      if (!rows.length) return json({ error: '다른 관리자가 먼저 수정했습니다. 새로고침 후 다시 시도해주세요.' }, 409);
      return json({ row: rows[0] });
    }

    return json({ error: '지원하지 않는 요청입니다.' }, 405);
  } catch (error) {
    console.error('Site admin API failed:', error);
    return json({ error: '저장하지 못했습니다. 잠시 후 다시 시도해주세요.' }, 503);
  }
};
