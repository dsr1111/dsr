// R2 데이터 파일(digimon.json / detector.json / 진화 CSV) 편집 함수들이 같이 쓰는 도우미.

/** 저장 전에 원본을 복사해 두는 폴더 */
export const BACKUP_PREFIX = 'data/csv/backup/';

/** 한국 시간 yyyymmdd-hhmmss-mmm (같은 초에 여러 번 저장해도 백업 이름이 겹치지 않게 밀리초까지) */
export function stamp() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace(/[-:]/g, '').replace('T', '-').replace('.', '-').slice(0, 19);
}

/** 백업 파일 경로: data/csv/backup/<이름>-<stamp>.<확장자> */
export const backupKey = (name, ext, time = stamp()) => `${BACKUP_PREFIX}${name}-${time}.${ext}`;

/** 키 순서와 상관없이 같은 값이면 같은 문자열 (동시 수정 비교용) */
export function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}

// ---------- 화면을 깨뜨리는 글자 막기 ----------
// 위키 페이지는 이 데이터를 HTML 과 인라인 이벤트(onmouseenter="...('값')") 안에 그대로 넣습니다.
// 그래서 < > " ' ` \ & 가 들어가면 화면이 깨지거나 스크립트가 끼어들 수 있어 저장 단계에서 막습니다.
// (지금 데이터에는 이 글자가 하나도 없어서 기존 항목 수정에는 영향이 없습니다.)
export const UNSAFE_CHARS = /[<>"'`\\&]/;
export const UNSAFE_MESSAGE = '< > " \' ` \\ & 글자는 쓸 수 없습니다.';

/** 값(과 객체 키) 안에서 위험한 글자가 들어간 첫 문자열. 없으면 null */
export function findUnsafeText(value) {
  if (typeof value === 'string') return UNSAFE_CHARS.test(value) ? value : null;
  if (Array.isArray(value)) {
    for (const v of value) { const hit = findUnsafeText(v); if (hit !== null) return hit; }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (UNSAFE_CHARS.test(k)) return k;
      const hit = findUnsafeText(v);
      if (hit !== null) return hit;
    }
  }
  return null;
}

/** 위험한 글자가 있으면 에러 메시지, 없으면 null */
export function unsafeTextError(value) {
  const hit = findUnsafeText(value);
  return hit === null ? null : `"${hit.length > 30 ? `${hit.slice(0, 30)}…` : hit}"에 ${UNSAFE_MESSAGE}`;
}
