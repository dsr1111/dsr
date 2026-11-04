// 디지몬 페이지 관리 API (관리자 전용) — R2의 data/csv/digimon.json 을 직접 수정하고 이미지를 올립니다.
// digimon.json 을 읽는 다른 페이지(상세, 계산기, 탐지기, 맵 등)는 그대로 동작합니다.
//
// Netlify 환경 변수: COUPON_ADMIN_PASSWORD, SUPABASE_SECRET_KEY (로그인용, site-admin과 공용)
//                    R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
import { json, authEnv, verifyToken, sameSiteJson } from '../lib/admin-auth.mjs';
import { r2Env, createR2 } from '../lib/r2.mjs';

const DATA_KEY = 'data/csv/digimon.json';
const BACKUP_PREFIX = 'data/csv/backup/';
const IMAGE_SLOTS = ['portrait', 'skill1', 'skill2', 'skill3', 'stack'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** 이미지 폴더 이름 — digimon.js 와 같은 규칙 (폼몬은 예전 이름 폴더 사용) */
function folderOf(name) {
  return (name === '폼몬' ? '포무몬' : name).replace(/:/g, '_');
}

function imageKey(name, slot) {
  const folder = folderOf(name);
  return `dsrwiki/digimon/${folder}/${slot === 'portrait' ? folder : slot}.webp`;
}

// ---------- 입력 검증 ----------
function text(value, max, { allowEmpty = false } = {}) {
  if (typeof value !== 'string') return undefined;
  const s = value.trim();
  if (!allowEmpty && !s) return undefined;
  return s.length <= max ? s : undefined;
}

function int(value, min, max) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
}

function textList(value, maxItems, maxLen) {
  if (!Array.isArray(value) || value.length > maxItems) return undefined;
  const out = [];
  for (const v of value) {
    const s = text(v, maxLen);
    if (s === undefined) return undefined;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

const STAT_KEYS = ['level', 'hp', 'sp', 'STR', 'INT', 'DEF', 'RES', 'SPD'];

function readSkill(s, i) {
  const label = `${i + 1}스킬`;
  const name = text(s?.name, 40);
  if (name === undefined) return { error: `${label} 이름을 입력해주세요.` };
  const hits = s.hits === '보조' ? '보조' : int(s.hits, 1, 99);
  if (hits === undefined) return { error: `${label} 타수는 1~99 또는 "보조"입니다.` };
  const range = text(s.range, 10, { allowEmpty: true });
  const attribute = text(s.attribute, 10);
  const target_count = text(s.target_count, 10, { allowEmpty: true });
  if (range === undefined || attribute === undefined || target_count === undefined) return { error: `${label} 사거리/속성/대상을 확인해주세요.` };
  if (!Array.isArray(s.multipliers) || s.multipliers.length > 20 || !s.multipliers.every((m) => typeof m === 'number' && Number.isFinite(m) && m >= 0 && m <= 1000)) {
    return { error: `${label} 계수를 확인해주세요.` };
  }
  const skill = { name, hits, range, attribute, target_count };
  if (s.effect !== undefined && s.effect !== null && String(s.effect).trim() !== '') {
    const effect = text(s.effect, 40);
    if (effect === undefined) return { error: `${label} 효과가 너무 깁니다.` };
    skill.effect = effect;
  }
  if (s.additionalTurn !== undefined && s.additionalTurn !== null && s.additionalTurn !== '') {
    const t = Number(s.additionalTurn);
    if (!Number.isFinite(t) || t < 0 || t > 10) return { error: `${label} 추가 턴 값을 확인해주세요.` };
    skill.additionalTurn = t;
  }
  skill.multipliers = s.multipliers;
  if (s.hpCost === true) skill.hpCost = true;
  if (s.change !== undefined && s.change !== null) {
    const change = textList(s.change, 12, 10);
    if (change === undefined) return { error: `${label} 변환 속성을 확인해주세요.` };
    skill.change = change;
  }
  return { value: skill };
}

/** 디지몬 이름 + 데이터 검증 → 기존 JSON과 같은 키 순서로 정리 */
function readDigimon(name, e, base) {
  const cleanName = text(name, 40);
  if (!cleanName || /[\/\\\u0000-\u001f]/.test(cleanName)) return { error: '디지몬 이름을 확인해주세요. (최대 40자, / \\ 사용 불가)' };
  const evolution_stage = text(e?.evolution_stage, 20);
  const type = text(e?.type, 20);
  if (!evolution_stage || !type) return { error: '진화 단계와 타입을 입력해주세요.' };
  const stats = {};
  for (const k of STAT_KEYS) {
    const v = int(e.stats?.[k], 0, 100000000);
    if (v === undefined) return { error: `능력치 ${k} 값을 확인해주세요.` };
    stats[k] = v;
  }
  const pair = (p, label) => {
    const attribute = text(p?.attribute, 20, { allowEmpty: true });
    const effect = text(p?.effect, 20, { allowEmpty: true });
    return attribute === undefined || effect === undefined ? { error: `${label}을 확인해주세요.` } : { value: { attribute, effect } };
  };
  const strengths = pair(e.strengths, '강점');
  const weaknesses = pair(e.weaknesses, '약점');
  if (strengths.error) return strengths;
  if (weaknesses.error) return weaknesses;
  const fields = textList(e.fields || [], 12, 10);
  if (fields === undefined) return { error: '필드를 확인해주세요.' };
  if (!Array.isArray(e.skills) || e.skills.length > 3) return { error: '스킬은 최대 3개입니다.' };
  const skills = [];
  for (let i = 0; i < e.skills.length; i++) {
    const r = readSkill(e.skills[i], i);
    if (r.error) return r;
    skills.push(matchShape(r.value, base?.skills?.[i]));
  }
  return { name: cleanName, value: { evolution_stage, type, stats, strengths: strengths.value, weaknesses: weaknesses.value, fields, skills } };
}

/**
 * 수정 전 스킬과 같은 키 순서로 맞추고, 원래 없던 빈 change 는 넣지 않습니다.
 * (값이 그대로면 digimon.json 내용도 그대로 남도록)
 */
function matchShape(skill, before) {
  if (!before || typeof before !== 'object') return skill;
  if (Array.isArray(skill.change) && !skill.change.length && !('change' in before)) delete skill.change;
  const ordered = {};
  for (const k of Object.keys(before)) if (k in skill) ordered[k] = skill[k];
  for (const k of Object.keys(skill)) if (!(k in ordered)) ordered[k] = skill[k];
  return ordered;
}

/** data URL → { bytes, contentType } (webp / png / jpeg만 허용) */
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

/** 키 순서와 상관없이 같은 데이터인지 */
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}

function stamp() {
  // KST yyyymmdd-hhmmss-mmm (같은 초에 여러 번 저장해도 백업이 겹치지 않게)
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace(/[-:]/g, '').replace('T', '-').replace('.', '-').slice(0, 19);
}

const CONFLICT = '다른 관리자가 먼저 수정했습니다. 새로고침 후 다시 시도해주세요.';

export default async (request) => {
  const auth = authEnv();
  const r2cfg = r2Env();
  if (!auth || !r2cfg) return json({ error: '서버 설정이 완료되지 않았습니다. (R2 / 관리자 환경 변수 확인)' }, 500);
  if (!sameSiteJson(request)) return json({ error: '허용되지 않은 요청입니다.' }, 403);
  if (!verifyToken(auth, request.headers.get('authorization'))) {
    return json({ error: '관리자 로그인이 만료되었습니다. 다시 로그인해주세요.' }, 401);
  }
  const r2 = createR2(r2cfg);

  try {
    // 관리자용 최신 데이터 (편집 시작 시점 비교용)
    if (request.method === 'GET') {
      const cur = await r2.getText(DATA_KEY);
      if (cur.status !== 200) return json({ error: `digimon.json을 읽지 못했습니다. (${cur.status})` }, 502);
      return json({ data: JSON.parse(cur.text), etag: cur.etag });
    }
    if (request.method !== 'POST') return json({ error: '지원하지 않는 요청입니다.' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ error: '요청 형식을 확인해주세요.' }, 400); }

    const cur = await r2.getText(DATA_KEY);
    if (cur.status !== 200) return json({ error: `digimon.json을 읽지 못했습니다. (${cur.status})` }, 502);
    const data = JSON.parse(cur.text);
    const has = (n) => Object.prototype.hasOwnProperty.call(data, n);

    let next;
    let savedName = null;

    if (body.action === 'delete') {
      const name = typeof body.name === 'string' ? body.name : '';
      if (!has(name)) return json({ error: '이미 삭제된 디지몬입니다. 새로고침해주세요.' }, 409);
      if (stable(data[name]) !== stable(body.base)) return json({ error: CONFLICT }, 409);
      next = Object.fromEntries(Object.entries(data).filter(([k]) => k !== name));
    } else if (body.action === 'save') {
      const originalName = typeof body.originalName === 'string' && body.originalName ? body.originalName : null;
      const parsed = readDigimon(body.name, body.entry, originalName && has(originalName) ? data[originalName] : null);
      if (parsed.error) return json({ error: parsed.error }, 400);
      const name = parsed.name;

      if (originalName) {
        if (!has(originalName)) return json({ error: '수정하려는 디지몬이 삭제되었습니다. 새로고침해주세요.' }, 409);
        if (stable(data[originalName]) !== stable(body.base)) return json({ error: CONFLICT }, 409);
        if (name !== originalName && has(name)) return json({ error: `"${name}" 디지몬이 이미 있습니다.` }, 409);
      } else if (has(name)) {
        return json({ error: `"${name}" 디지몬이 이미 있습니다.` }, 409);
      }

      // 이미지 검사 후 업로드 (JSON보다 먼저 올려서 새 디지몬이 이미지 없이 보이지 않게)
      const images = body.images && typeof body.images === 'object' ? body.images : {};
      const uploads = [];
      for (const slot of IMAGE_SLOTS) {
        if (images[slot] === undefined || images[slot] === null) continue;
        const img = decodeImage(images[slot]);
        if (!img) return json({ error: `이미지(${slot})는 2MB 이하의 webp/png/jpg만 가능합니다.` }, 400);
        uploads.push([slot, img]);
      }
      for (const [slot, img] of uploads) await r2.put(imageKey(name, slot), img.bytes, img.contentType);

      // 이름이 바뀌면 새로 올리지 않은 기존 이미지를 새 폴더로 복사 (기존 폴더는 그대로 둠)
      if (originalName && folderOf(originalName) !== folderOf(name)) {
        for (const slot of IMAGE_SLOTS) {
          if (uploads.some(([s]) => s === slot)) continue;
          const from = imageKey(originalName, slot);
          if (await r2.exists(from)) await r2.copy(from, imageKey(name, slot));
        }
      }

      // 기존 순서 유지 (이름 변경 시 같은 자리, 새 디지몬은 맨 뒤)
      next = {};
      for (const [k, v] of Object.entries(data)) {
        if (k === originalName) next[name] = parsed.value;
        else next[k] = v;
      }
      if (!originalName) next[name] = parsed.value;
      savedName = name;
    } else {
      return json({ error: '지원하지 않는 요청입니다.' }, 400);
    }

    // 덮어쓰기 전에 백업 (data/csv/backup/digimon-YYYYMMDD-HHMMSS.json)
    await r2.copy(DATA_KEY, `${BACKUP_PREFIX}digimon-${stamp()}.json`);
    try {
      // 읽은 뒤 다른 저장이 끼어들었으면 R2가 412로 거부
      const { etag } = await r2.put(DATA_KEY, `${JSON.stringify(next, null, 2)}\n`, 'application/json', { ifMatch: cur.etag });
      return json({ ok: true, name: savedName, etag });
    } catch (err) {
      if (err.status === 412) return json({ error: CONFLICT }, 409);
      throw err;
    }
  } catch (error) {
    console.error('Digimon admin failed:', error);
    return json({ error: '저장하지 못했습니다. 잠시 후 다시 시도해주세요.' }, 503);
  }
};
