// 탐지기 페이지 관리 API (관리자 전용) — R2의 data/csv/detector.json 을 직접 수정합니다.
// 탐지기(악역 디지몬 목록)와 상자·꾸러미(구성품 목록)를 항목 단위로 저장하고,
// 탐지기/상자 아이콘과 맵 이미지 업로드도 처리합니다.
//
// Netlify 환경 변수: digimon-admin 과 같음 (COUPON_ADMIN_PASSWORD, SUPABASE_SECRET_KEY, R2_*)
import { json, authEnv, verifyToken, sameSiteJson } from '../lib/admin-auth.mjs';
import { r2Env, createR2 } from '../lib/r2.mjs';

const DATA_KEY = 'data/csv/detector.json';
const BACKUP_PREFIX = 'data/csv/backup/';
const MONSTERS = '악역 디지몬';
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const TRADE = ['거래가능', '거래불가'];
const DROP = ['확정', '확률'];
const CONFLICT = '다른 관리자가 이 항목을 먼저 수정했습니다. 새로고침 후 다시 시도해주세요.';
const WRITE_RACE = '저장하는 순간 detector.json이 다른 저장으로 바뀌었습니다. 한 번 더 저장해주세요.';

// ---------- 공통 도우미 ----------
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

function text(value, max, { allowEmpty = false } = {}) {
  if (typeof value !== 'string') return undefined;
  const s = value.trim();
  if (!allowEmpty && !s) return undefined;
  return s.length <= max ? s : undefined;
}
const safeName = (s) => s && !/[\/\\\u0000-\u001f]/.test(s);

/** 키 순서와 상관없이 같은 데이터인지 */
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (isObj(value)) return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}

/** base 의 키 순서를 따르고, base 에만 있던 (편집 화면이 모르는) 키는 그대로 남김 */
function mergeShape(next, base, removable = []) {
  if (!isObj(base)) return next;
  const out = {};
  for (const k of Object.keys(base)) {
    if (has(next, k)) out[k] = next[k];
    else if (!removable.includes(k)) out[k] = base[k];
  }
  for (const k of Object.keys(next)) if (!has(out, k)) out[k] = next[k];
  return out;
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

function stamp() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace(/[-:]/g, '').replace('T', '-').replace('.', '-').slice(0, 19);
}

// ---------- 검증 ----------
function readMonster(name, m, base) {
  const label = `"${name}"`;
  const map = text(m?.map, 30);
  if (!map) return { error: `${label} 맵을 입력해주세요.` };
  // 레벨/HP: 숫자, 또는 모를 때 "?" (기존 데이터와 같은 값이면 원래 표기(문자/숫자) 그대로 유지)
  const numOrUnknown = (v, max, prev) => {
    const s = String(v ?? '').trim();
    if (s === '?') return '?';
    if (!/^\d+$/.test(s) || Number(s) > max) return undefined;
    return prev !== undefined && String(prev).trim() === s ? prev : Number(s);
  };
  const level = numOrUnknown(m.level, 1000, base?.level);
  const HP = numOrUnknown(m.HP, 1e10, base?.HP);
  if (level === undefined) return { error: `${label} 레벨은 숫자 또는 ? 로 입력해주세요.` };
  if (HP === undefined) return { error: `${label} HP는 숫자 또는 ? 로 입력해주세요.` };
  if (!Array.isArray(m.item) || m.item.length > 60) return { error: `${label} 드롭 아이템은 최대 60개입니다.` };
  const item = [];
  for (const raw of m.item) {
    const parts = typeof raw === 'string' ? raw.split(',') : [];
    const [itemName, trade, drop] = [parts.slice(0, -2).join(','), parts.at(-2), parts.at(-1)].map((v) => (v ?? '').trim());
    if (!itemName || itemName.length > 60 || !TRADE.includes(trade) || !DROP.includes(drop)) {
      return { error: `${label} 드롭 아이템 형식이 올바르지 않습니다. (이름,거래가능|거래불가,확정|확률)` };
    }
    item.push(`${itemName},${trade},${drop}`);
  }
  const out = { map, level, HP, item };
  const blank = (v) => v === null || v === undefined || String(v).trim() === '';
  const c = m.coordinates;
  if (c && !(blank(c.x) && blank(c.y))) {
    const x = Number(c.x), y = Number(c.y);
    if (blank(c.x) || blank(c.y) || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 400 || y < 0 || y > 400) {
      return { error: `${label} 위치(좌표)는 0~400 사이여야 합니다.` };
    }
    const bc = base?.coordinates;
    // 기존과 같은 위치면 원래 표기 그대로
    out.coordinates = bc && Number(bc.x) === Math.round(x) && Number(bc.y) === Math.round(y) && !blank(bc.x) ? bc : { x: Math.round(x), y: Math.round(y) };
  } else if (base?.coordinates && blank(base.coordinates.x) && blank(base.coordinates.y)) {
    out.coordinates = base.coordinates; // 기존에도 "위치 없음"(빈 값)이었으면 그대로
  }
  for (const [k, max] of [['gimmick', 500], ['evol', 20]]) {
    if (m[k] === undefined || m[k] === null || String(m[k]).trim() === '') continue;
    const v = text(m[k], max);
    if (v === undefined) return { error: `${label} ${k === 'gimmick' ? '패턴 설명' : '진화 단계'}이 너무 깁니다.` };
    out[k] = v;
  }
  // 편집 화면이 비운 선택 항목(좌표/패턴/진화)은 지우고, 모르는 키는 유지
  return { value: mergeShape(out, base, ['coordinates', 'gimmick', 'evol']) };
}

/** 탐지기 또는 상자 항목 전체 검증 */
function readEntry(entry, base) {
  if (!isObj(entry)) return { error: '항목 형식이 올바르지 않습니다.' };
  const isDetector = has(entry, MONSTERS);
  const isBox = has(entry, 'items');
  if (isDetector === isBox) return { error: '탐지기(악역 디지몬) 또는 상자(구성품) 중 하나여야 합니다.' };

  const out = {};
  if (isDetector) {
    if (!isObj(entry[MONSTERS])) return { error: '악역 디지몬 목록 형식이 올바르지 않습니다.' };
    const names = Object.keys(entry[MONSTERS]);
    if (names.length > 60) return { error: '악역 디지몬은 최대 60마리입니다.' };
    const monsters = {};
    for (const n of names) {
      const clean = text(n, 40);
      if (!clean || !safeName(clean)) return { error: `디지몬 이름 "${n}"을 확인해주세요.` };
      const r = readMonster(clean, entry[MONSTERS][n], base?.[MONSTERS]?.[n]);
      if (r.error) return r;
      monsters[clean] = r.value;
    }
    out[MONSTERS] = monsters;
    if (entry.acquisition !== undefined && entry.acquisition !== null && String(entry.acquisition).trim() !== '') {
      const v = text(entry.acquisition, 1000);
      if (v === undefined) return { error: '획득 방법이 너무 깁니다.' };
      out.acquisition = v;
    }
    if (Array.isArray(entry.rewardNotes) && entry.rewardNotes.some((s) => String(s).trim())) {
      const notes = entry.rewardNotes.map((s) => text(String(s), 500)).filter((s) => s);
      if (notes.length > 20) return { error: '드롭 안내 문구는 최대 20줄입니다.' };
      out.rewardNotes = notes;
    }
  } else {
    if (!isObj(entry.items)) return { error: '구성품 형식이 올바르지 않습니다.' };
    const keys = Object.keys(entry.items);
    if (keys.length > 100) return { error: '구성품은 최대 100개입니다.' };
    const items = {};
    for (const k of keys) {
      const clean = text(k, 80);
      if (!clean) return { error: '구성품 이름을 확인해주세요.' };
      const it = entry.items[k];
      if (!isObj(it) || !TRADE.includes(it.tradeStatus)) return { error: `"${clean}" 거래 여부를 선택해주세요.` };
      items[clean] = mergeShape({ tradeStatus: it.tradeStatus }, base?.items?.[k]);
    }
    out.items = items;
  }
  return { value: mergeShape(out, base, ['acquisition', 'rewardNotes']) };
}

/** 이미지 저장 위치 */
const iconKey = (name) => `dsrwiki/item/${name.replace(/:/g, '_')}.webp`;
const mapKey = (map) => `dsrwiki/map/${map.replace(/\s+/g, '')}.webp`;

export default async (request) => {
  const auth = authEnv();
  const r2cfg = r2Env();
  if (!auth || !r2cfg) {
    const missing = [
      ['COUPON_ADMIN_PASSWORD', process.env.COUPON_ADMIN_PASSWORD],
      ['SUPABASE_SECRET_KEY', process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY],
      ['R2_ACCOUNT_ID', process.env.R2_ACCOUNT_ID || process.env.R2_ENDPOINT],
      ['R2_ACCESS_KEY_ID', process.env.R2_ACCESS_KEY_ID],
      ['R2_SECRET_ACCESS_KEY', process.env.R2_SECRET_ACCESS_KEY],
      ['R2_BUCKET', process.env.R2_BUCKET],
    ].filter(([, v]) => !v).map(([k]) => k);
    return json({ error: `서버 설정이 완료되지 않았습니다.\n비어 있는 Netlify 환경 변수: ${missing.join(', ')}` }, 500);
  }
  if (!sameSiteJson(request)) return json({ error: '허용되지 않은 요청입니다.' }, 403);
  if (!verifyToken(auth, request.headers.get('authorization'))) {
    return json({ error: '관리자 로그인이 만료되었습니다. 다시 로그인해주세요.' }, 401);
  }
  const r2 = createR2(r2cfg);

  try {
    const cur = await r2.getText(DATA_KEY);
    if (cur.status !== 200) return json({ error: `detector.json을 읽지 못했습니다. (${cur.status})` }, 502);
    const data = JSON.parse(cur.text);
    if (request.method === 'GET') return json({ data, etag: cur.etag });
    if (request.method !== 'POST') return json({ error: '지원하지 않는 요청입니다.' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ error: '요청 형식을 확인해주세요.' }, 400); }

    let next;
    let savedName = null;
    if (body.action === 'delete') {
      const name = typeof body.name === 'string' ? body.name : '';
      if (!has(data, name)) return json({ error: '이미 삭제된 항목입니다. 새로고침해주세요.' }, 409);
      if (stable(data[name]) !== stable(body.base)) return json({ error: CONFLICT }, 409);
      next = Object.fromEntries(Object.entries(data).filter(([k]) => k !== name));
    } else if (body.action === 'save') {
      const name = text(body.name, 60);
      if (!name || !safeName(name)) return json({ error: '이름을 확인해주세요. (최대 60자, / \\ 사용 불가)' }, 400);
      const originalName = typeof body.originalName === 'string' && body.originalName ? body.originalName : null;
      if (originalName) {
        if (!has(data, originalName)) return json({ error: '수정하려는 항목이 삭제되었습니다. 새로고침해주세요.' }, 409);
        if (stable(data[originalName]) !== stable(body.base)) return json({ error: CONFLICT }, 409);
        if (name !== originalName && has(data, name)) return json({ error: `"${name}" 항목이 이미 있습니다.` }, 409);
      } else if (has(data, name)) {
        return json({ error: `"${name}" 항목이 이미 있습니다.` }, 409);
      }
      const parsed = readEntry(body.entry, originalName ? data[originalName] : null);
      if (parsed.error) return json({ error: parsed.error }, 400);

      // 이미지 (아이콘: dsrwiki/item/이름.webp, 맵: dsrwiki/map/맵이름.webp)
      const uploads = [];
      if (body.icon) {
        const img = decodeImage(body.icon);
        if (!img) return json({ error: '아이콘은 3MB 이하의 webp/png/jpg만 가능합니다.' }, 400);
        uploads.push([iconKey(name), img]);
      }
      if (isObj(body.maps)) {
        for (const [mapName, dataUrl] of Object.entries(body.maps).slice(0, 5)) {
          const m = text(mapName, 30);
          const img = decodeImage(dataUrl);
          if (!m || !img) return json({ error: '맵 이미지는 3MB 이하의 webp/png/jpg만 가능합니다.' }, 400);
          uploads.push([mapKey(m), img]);
        }
      }
      for (const [key, img] of uploads) await r2.put(key, img.bytes, img.contentType);
      // 이름을 바꿨고 새 아이콘이 없으면 기존 아이콘 복사
      if (originalName && name !== originalName && !body.icon && await r2.exists(iconKey(originalName))) {
        await r2.copy(iconKey(originalName), iconKey(name));
      }

      next = {};
      for (const [k, v] of Object.entries(data)) next[k === originalName ? name : k] = k === originalName ? parsed.value : v;
      if (!originalName) next[name] = parsed.value;
      savedName = name;
    } else {
      return json({ error: '지원하지 않는 요청입니다.' }, 400);
    }

    await r2.copy(DATA_KEY, `${BACKUP_PREFIX}detector-${stamp()}.json`);
    const eol = cur.text.includes('\r\n') ? '\r\n' : '\n'; // 기존 줄바꿈 방식 유지
    try {
      const { etag } = await r2.put(DATA_KEY, `${JSON.stringify(next, null, 2)}\n`.replace(/\n/g, eol), 'application/json', { ifMatch: cur.etag });
      return json({ ok: true, name: savedName, entry: savedName ? next[savedName] : null, etag });
    } catch (err) {
      if (err.status === 412) return json({ error: WRITE_RACE }, 409);
      throw err;
    }
  } catch (error) {
    console.error('Detector admin failed:', error);
    return json({ error: '저장하지 못했습니다. 잠시 후 다시 시도해주세요.' }, 503);
  }
};
