// 진화 페이지 관리 API (관리자 전용) — R2의 evolution.csv / condition.csv / jogress.csv 를 디지몬 단위로 수정합니다.
//
// - 수정하지 않은 줄은 원래 글자 그대로 둡니다 (빈 칸 개수, 끝의 쉼표까지).
// - 디지몬 하나를 저장하면 그 디지몬의 evolution 줄, condition 줄들, 관련 jogress 줄을 함께 바꿉니다.
// - 값에는 쉼표/따옴표/줄바꿈을 쓸 수 없습니다 (진화 페이지가 쉼표로 칸을 나눔). 재료 여러 개는 "/" 로 구분.
// - 지금 파일 형식은 조그레스/암흑/특수/버스트 진화를 디지몬마다 1개씩만 담을 수 있어 화면에서 2개 이상이면 거부합니다.
//
// Netlify 환경 변수: digimon-admin 과 같음 (COUPON_ADMIN_PASSWORD, SUPABASE_SECRET_KEY, R2_*)
import { json, authEnv, verifyToken, sameSiteJson } from '../lib/admin-auth.mjs';
import { r2Env, createR2 } from '../lib/r2.mjs';

const FILES = {
  evolution: 'data/csv/evolution.csv',
  condition: 'data/csv/condition.csv',
  jogress: 'data/csv/jogress.csv',
};
const BACKUP_PREFIX = 'data/csv/backup/';
const COND_TYPES = ['', '암흑진화', '특수진화', '버스트진화'];
const CONFLICT = '다른 관리자가 이 디지몬의 진화 정보를 먼저 수정했습니다. 새로고침 후 다시 시도해주세요.';
const WRITE_RACE = '저장하는 순간 진화 파일이 다른 저장으로 바뀌었습니다. 한 번 더 저장해주세요.';

// ---------- CSV ----------
/** 진화 페이지(evolution.js)와 같은 규칙으로 한 줄 나누기 */
function splitLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
    } else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** 파일 → { header, eol, trailingNewline, rows: [{ raw, obj }] } */
function parseFile(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const trailingNewline = /\r?\n$/.test(text);
  const lines = text.replace(/\r?\n$/, '').split(/\r?\n/);
  const header = splitLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((raw) => ({ raw, obj: toObj(header, raw) }));
  return { header, eol, trailingNewline, headerLine: lines[0], rows };
}
function toObj(header, raw) {
  if (!raw.trim()) return null;
  const v = splitLine(raw.trim());
  const o = {};
  header.forEach((h, i) => { const x = (v[i] ?? '').trim(); if (x !== '') o[h] = x; });
  return o;
}
function serialize(file) {
  const body = [file.headerLine, ...file.rows.map((r) => r.raw)].join(file.eol);
  return file.trailingNewline ? body + file.eol : body;
}
/** 객체 → 줄 (뒤쪽 빈 칸은 생략, 이 파일들의 대부분 줄과 같은 모양) */
function toLine(header, obj) {
  const vals = header.map((h) => obj[h] ?? '');
  while (vals.length > 1 && vals[vals.length - 1] === '') vals.pop();
  return vals.join(',');
}
/** 바뀐 내용이 없으면 원래 줄 글자 그대로 유지 */
function rowFor(header, obj, prev) {
  if (prev && same(prev.obj, obj)) return prev;
  return { raw: toLine(header, obj), obj };
}
function same(a, b) {
  const ka = Object.keys(a || {}).filter((k) => a[k] !== '').sort();
  const kb = Object.keys(b || {}).filter((k) => b[k] !== '').sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && String(a[k]) === String(b[k]));
}
const sameList = (a, b) => a.length === b.length && a.every((x, i) => same(x, b[i]));

// ---------- 검증 ----------
const BAD_CHARS = /[,"\r\n]/;
const NUM_RE = /^\d+(\.\d+)?$/;
const EVO_NUM_COLS = new Set(['evolution_stage', ...Array.from({ length: 15 }, (_, i) => `percent${i + 1}`)]);
// 조건 값은 "95 / 100", "31% / 26" 처럼 여러 경우를 한 칸에 적기도 해서 숫자로 제한하지 않음
const COND_NUM_COLS = new Set(['evolution_stage']);

/** 헤더에 있는 칸만, 형식 검사 후 정리. 문제가 있으면 { error } */
function cleanRow(header, obj, numCols, label) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { error: `${label} 형식이 올바르지 않습니다.` };
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!header.includes(k)) return { error: `${label}: 알 수 없는 칸 "${k}"` };
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (!s) continue;
    if (s.length > 80) return { error: `${label} "${k}" 값이 너무 깁니다.` };
    if (BAD_CHARS.test(s)) return { error: `${label} "${k}"에 쉼표·따옴표·줄바꿈은 쓸 수 없습니다. 재료 여러 개는 "/"로 구분해주세요.` };
    if (numCols.has(k) && !NUM_RE.test(s)) return { error: `${label} "${k}"은(는) 숫자여야 합니다.` };
    out[k] = s;
  }
  return { value: out };
}

function stageOf(o) { return Number(o?.evolution_stage) || 99; }
/** 새 줄 위치: 같은 단계 안 가나다 자리, 같은 단계가 없으면 단계 순서 자리, 그래도 없으면 맨 뒤 */
function insertIndex(rows, obj) {
  const stage = stageOf(obj);
  const same = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.obj && stageOf(r.obj) === stage);
  if (same.length) {
    const after = same.find(({ r }) => r.obj.name.localeCompare(obj.name, 'ko') > 0);
    return after ? after.i : same[same.length - 1].i + 1;
  }
  const i = rows.findIndex((r) => r.obj && stageOf(r.obj) > stage);
  return i < 0 ? rows.length : i;
}

const EVO_REF_COLS = [...Array.from({ length: 11 }, (_, i) => `evol${i + 1}`), '조그레스', '조그레스재료', '암흑진화', '특수진화', '버스트진화'];

/** 이 파일 형식에서 디지몬 하나가 가질 수 있는 갈래 수 검사 (화면은 목록 구조라 미리 막음) */
function checkBranchLimits(branches) {
  const limits = { 조그레스: 1, 암흑진화: 1, 특수진화: 1, 버스트진화: 1 };
  for (const [k, max] of Object.entries(limits)) {
    const n = Number(branches?.[k] ?? 0);
    if (n > max) return `지금 파일 형식은 ${k}을(를) 디지몬마다 ${max}개만 담을 수 있습니다. (2개 이상 지원은 파일 형식 변경이 필요합니다)`;
  }
  if (Number(branches?.일반 ?? 0) > 11) return '일반 진화는 최대 11개입니다.';
  return null;
}

function stamp() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace(/[-:]/g, '').replace('T', '-').replace('.', '-').slice(0, 19);
}

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
    // 세 파일 읽기
    const cur = {};
    for (const [k, key] of Object.entries(FILES)) {
      const r = await r2.getText(key);
      if (r.status !== 200) return json({ error: `${key}를 읽지 못했습니다. (${r.status})` }, 502);
      cur[k] = { ...r, file: parseFile(r.text) };
    }
    if (request.method === 'GET') {
      return json({ files: Object.fromEntries(Object.entries(cur).map(([k, v]) => [k, v.text])) });
    }
    if (request.method !== 'POST') return json({ error: '지원하지 않는 요청입니다.' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ error: '요청 형식을 확인해주세요.' }, 400); }

    const E = cur.evolution.file, C = cur.condition.file, J = cur.jogress.file;
    const originalName = typeof body.originalName === 'string' && body.originalName ? body.originalName : null;
    const base = body.base || {};

    // ----- 충돌 확인: 이 디지몬의 현재 줄들이 편집을 시작할 때와 같은지 -----
    const evoNow = originalName ? E.rows.find((r) => r.obj?.name === originalName) : null;
    if (originalName && !evoNow) return json({ error: '수정하려는 디지몬이 삭제되었습니다. 새로고침해주세요.' }, 409);
    if (originalName) {
      if (!same(evoNow.obj, base.evolution)) return json({ error: CONFLICT }, 409);
      const condNow = C.rows.filter((r) => r.obj?.name === originalName).map((r) => r.obj);
      if (!sameList(condNow, base.condition || [])) return json({ error: CONFLICT }, 409);
    }
    for (const b of base.jogress || []) {
      const now = J.rows.find((r) => r.obj?.name === b.name);
      if (!now || !same(now.obj, b)) return json({ error: CONFLICT }, 409);
    }

    const changed = { evolution: false, condition: false, jogress: false };

    if (body.action === 'delete') {
      if (!originalName) return json({ error: '삭제할 디지몬을 확인해주세요.' }, 400);
      E.rows = E.rows.filter((r) => r.obj?.name !== originalName);
      const cBefore = C.rows.length;
      C.rows = C.rows.filter((r) => r.obj?.name !== originalName);
      const jBefore = J.rows.length;
      J.rows = J.rows.filter((r) => r.obj?.name !== originalName); // 이 디지몬이 조그레스 결과인 줄
      changed.evolution = true;
      changed.condition = C.rows.length !== cBefore;
      changed.jogress = J.rows.length !== jBefore;
    } else if (body.action === 'save') {
      const limitErr = checkBranchLimits(body.branchCounts);
      if (limitErr) return json({ error: limitErr }, 400);

      // evolution 줄
      const evo = cleanRow(E.header, body.evolution, EVO_NUM_COLS, '진화');
      if (evo.error) return json({ error: evo.error }, 400);
      const name = evo.value.name;
      if (!name) return json({ error: '디지몬 이름을 입력해주세요.' }, 400);
      if (!/^[1-6]$/.test(evo.value.evolution_stage || '')) return json({ error: '진화 단계를 선택해주세요.' }, 400);
      if (name !== originalName && E.rows.some((r) => r.obj?.name === name)) return json({ error: `"${name}" 디지몬이 이미 있습니다.` }, 409);

      // condition 줄들 (이 디지몬이 진화하는 조건, 진화타입별 최대 1줄)
      const conds = [];
      for (const [i, raw] of (Array.isArray(body.condition) ? body.condition : []).entries()) {
        const c = cleanRow(C.header, raw, COND_NUM_COLS, `진화 조건 ${i + 1}`);
        if (c.error) return json({ error: c.error }, 400);
        c.value.name = name;
        c.value.evolution_stage = evo.value.evolution_stage;
        if (!COND_TYPES.includes(c.value['진화타입'] || '')) return json({ error: '진화타입 값이 올바르지 않습니다.' }, 400);
        if (conds.some((x) => (x['진화타입'] || '') === (c.value['진화타입'] || ''))) return json({ error: '같은 진화 종류의 조건이 두 번 들어 있습니다.' }, 400);
        conds.push(c.value);
      }

      // jogress 줄들 (이 디지몬의 조그레스 결과 디지몬 기준)
      const jogs = [];
      for (const [i, raw] of (Array.isArray(body.jogress) ? body.jogress : []).entries()) {
        const j = cleanRow(J.header, raw, new Set(), `조그레스 ${i + 1}`);
        if (j.error) return json({ error: j.error }, 400);
        if (!j.value.name) return json({ error: '조그레스 결과 디지몬을 입력해주세요.' }, 400);
        jogs.push(j.value);
      }

      // ----- evolution.csv -----
      const evoPrevIdx = originalName ? E.rows.findIndex((r) => r.obj?.name === originalName) : -1;
      if (evoPrevIdx >= 0) {
        const prev = E.rows[evoPrevIdx];
        const next = rowFor(E.header, evo.value, prev);
        // 단계나 이름이 바뀌면 알맞은 자리로 옮김
        if (prev.obj.name !== name || stageOf(prev.obj) !== stageOf(evo.value)) {
          E.rows.splice(evoPrevIdx, 1);
          E.rows.splice(insertIndex(E.rows, evo.value), 0, next);
        } else {
          E.rows[evoPrevIdx] = next;
        }
        changed.evolution = next !== prev || evoPrevIdx !== E.rows.indexOf(next);
      } else {
        E.rows.splice(insertIndex(E.rows, evo.value), 0, { raw: toLine(E.header, evo.value), obj: evo.value });
        changed.evolution = true;
      }

      // ----- 조그레스 상대 디지몬 줄도 맞춤 (상대의 조그레스 칸이 비었거나 같은 결과일 때만) -----
      const partnerNotes = [];
      const jt = evo.value['조그레스'];
      const jp = evo.value['조그레스재료'];
      if (jt && jp && jp !== name) {
        const pi = E.rows.findIndex((r) => r.obj?.name === jp);
        if (pi < 0) {
          partnerNotes.push(`조그레스 상대 "${jp}"가 진화 목록에 없어 상대 쪽은 바꾸지 않았습니다.`);
        } else {
          const p = E.rows[pi].obj;
          if (p['조그레스'] && p['조그레스'] !== jt) {
            partnerNotes.push(`"${jp}"에는 이미 다른 조그레스(${p['조그레스']})가 있어 상대 쪽은 바꾸지 않았습니다.`);
          } else if (p['조그레스'] !== jt || p['조그레스재료'] !== name) {
            const o = { ...p, 조그레스: jt, 조그레스재료: name };
            if (!o.percent12 && evo.value.percent12) o.percent12 = evo.value.percent12;
            E.rows[pi] = { raw: toLine(E.header, o), obj: o };
            changed.evolution = true;
            partnerNotes.push(`조그레스 상대 "${jp}"에도 ${jt} 조그레스를 넣었습니다.`);
          }
        }
      }
      body.__notes = partnerNotes;

      // ----- condition.csv: 이 디지몬의 줄들을 원래 자리에서 바꿈 -----
      const prevConds = C.rows.map((r, i) => ({ r, i })).filter(({ r }) => r.obj?.name === originalName);
      const byType = (o) => o['진화타입'] || '';
      const nextCondRows = conds.map((o) => rowFor(C.header, o, prevConds.find(({ r }) => byType(r.obj) === byType(o))?.r));
      // 원래 줄 순서(진화타입 순서)를 유지하고, 새 진화타입은 뒤에
      nextCondRows.sort((a, b) => {
        const ia = prevConds.findIndex(({ r }) => byType(r.obj) === byType(a.obj));
        const ib = prevConds.findIndex(({ r }) => byType(r.obj) === byType(b.obj));
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      });
      const condUnchanged = prevConds.length === nextCondRows.length && prevConds.every(({ r }, k) => r === nextCondRows[k]);
      if (!condUnchanged) {
        const at = prevConds.length ? prevConds[0].i : insertIndex(C.rows, { name, evolution_stage: evo.value.evolution_stage });
        C.rows = C.rows.filter((r) => r.obj?.name !== originalName);
        const insertAt = prevConds.length ? Math.min(at, C.rows.length) : insertIndex(C.rows, { name, evolution_stage: evo.value.evolution_stage });
        C.rows.splice(insertAt, 0, ...nextCondRows);
        changed.condition = true;
      }

      // ----- jogress.csv: 결과 디지몬 줄 수정/추가 (기존 자리 유지, 새 줄은 맨 뒤) -----
      for (const o of jogs) {
        const idx = J.rows.findIndex((r) => r.obj?.name === o.name);
        if (idx >= 0) {
          const next = rowFor(J.header, o, J.rows[idx]);
          if (next !== J.rows[idx]) { J.rows[idx] = next; changed.jogress = true; }
        } else {
          J.rows.push({ raw: toLine(J.header, o), obj: o });
          changed.jogress = true;
        }
      }

      // ----- 이름 변경 시 다른 디지몬이 가리키던 이름도 바꿈 (선택) -----
      if (originalName && name !== originalName && body.renameRefs) {
        E.rows = E.rows.map((r) => {
          if (!r.obj || r.obj.name === name) return r;
          if (!EVO_REF_COLS.some((c) => r.obj[c] === originalName)) return r;
          const o = { ...r.obj };
          for (const c of EVO_REF_COLS) if (o[c] === originalName) o[c] = name;
          changed.evolution = true;
          return { raw: toLine(E.header, o), obj: o };
        });
        J.rows = J.rows.map((r) => {
          if (!r.obj || !['name', 'digimon1', 'digimon2'].some((c) => r.obj[c] === originalName)) return r;
          const o = { ...r.obj };
          for (const c of ['name', 'digimon1', 'digimon2']) if (o[c] === originalName) o[c] = name;
          changed.jogress = true;
          return { raw: toLine(J.header, o), obj: o };
        });
      }
    } else {
      return json({ error: '지원하지 않는 요청입니다.' }, 400);
    }

    // ----- 백업 후 바뀐 파일만 저장 (읽은 뒤 다른 저장이 끼어들면 R2가 412로 거부) -----
    const toWrite = Object.keys(FILES).filter((k) => changed[k]);
    const time = stamp();
    for (const k of toWrite) await r2.copy(FILES[k], `${BACKUP_PREFIX}${k}-${time}.csv`);
    const written = [];
    try {
      for (const k of toWrite) {
        await r2.put(FILES[k], serialize(cur[k].file), 'text/csv; charset=utf-8', { ifMatch: cur[k].etag });
        written.push(k);
      }
    } catch (err) {
      if (err.status === 412) {
        return json({ error: written.length ? `${WRITE_RACE} (일부 파일만 저장됨: ${written.join(', ')} — 백업: ${time})` : WRITE_RACE }, 409);
      }
      throw err;
    }
    return json({ ok: true, written, notes: body.__notes || [] });
  } catch (error) {
    console.error('Evolution admin failed:', error);
    return json({ error: '저장하지 못했습니다. 잠시 후 다시 시도해주세요.' }, 503);
  }
};
