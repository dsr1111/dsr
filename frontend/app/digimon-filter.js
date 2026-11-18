// 기존 위키용 — dsr-astro/src/scripts/digimon-filter.js 와 같은 내용 (Astro 쪽 모듈을 일반 스크립트로 감쌈).
// digimon.html 에서 app/digimon.js 다음에 defer 로 불러옴. 고칠 땐 두 파일을 같이 고칠 것.
(function () {
// 도감 필터 — 필터 화면만 새로 만들고, 걸러내는 판단은 기존 도감 코드(digimon.js)를 그대로 씀.
//
// 기존 필터 버튼들은 페이지에 숨겨 둔 채로 두고(목록·켜짐 상태의 원본), 새 화면은 그 버튼들을 읽어서 만든다.
// → 나중에 아이콘이 늘어나도 기존 HTML 만 고치면 새 필터도 따라감.
//
// 구성
//  - 늘 보이는 줄: 이름 검색 + 진화 단계 + 타입 + [상세 필터 (n)]
//  - 선택된 조건 칩 줄 + 전체 해제 (아무것도 안 고르면 숨김)
//  - 상세 필터: 속성(스킬/강점/약점 탭, 스킬은 아무/1/2/3스킬), 스킬(전체 공격·캐스팅·HP 소모·스택),
//               효과([도트][CC][회복] + 버프/디버프 아이콘), 필드 — 여러 개 고르면 조합 방식 선택
//  - 모바일: 검색 + [필터 (n)] 버튼만, 누르면 아래에서 올라오는 창
//  - 기존 위키(dsr/frontend/app/digimon-filter.js)에도 같은 내용이 들어 있음 → 고칠 땐 둘 다

function initFilter(signal) {
  const old = document.querySelector('.filters');
  const D = window.DSRDigimon;
  if (!old || !D) return;

  // ---------- 기존 버튼 읽기 ----------
  const parseCall = (s) => {
    const m = /(\w+)\('([^']*)'\)/.exec(s || '');
    return m ? { fn: m[1], arg: m[2] } : null;
  };
  const items = [...old.querySelectorAll('button[onclick^="toggle"]')]
    .map((btn) => {
      const call = parseCall(btn.getAttribute('onclick'));
      if (!call || call.fn === 'toggleFilters') return null;
      const label = parseCall(btn.getAttribute('onmouseenter'))?.arg
        || /showCustomTooltip\(event,\s*'([^']*)'/.exec(btn.getAttribute('onmouseenter') || '')?.[1]
        || btn.querySelector('img')?.alt || call.arg;
      const group = btn.closest('.effect-subgroup')?.querySelector('span')?.textContent.trim() || '';
      return { btn, ...call, label, img: btn.querySelector('img')?.getAttribute('src') || '', group };
    })
    .filter(Boolean);
  const byFn = (fn) => items.filter((i) => i.fn === fn);
  const evolutions = byFn('toggleEvolution');
  const types = byFn('toggleType');
  const attrs = byFn('toggleSkill1').map((i) => i.arg); // 11개 속성 이름
  const attrImg = (fn, attr) => {
    const map = { skill: 'toggleSkill1', strong: 'toggleSkillStrong', weak: 'toggleSkillWeak' };
    const hit = items.find((i) => i.fn === map[fn] && (i.arg === attr || i.arg.endsWith(`_${attr}`)));
    return hit?.img || `https://media.dsrwiki.com/dsrwiki/${attr}.webp`;
  };
  // 도트·CC 는 위 "스킬" 줄의 [도트] [CC] 버튼 하나로 모든 도트·CC 를 찾음 → 여기엔 버프·디버프만
  const effects = byFn('toggleEffect')
    .map((i) => ({ ...i, name: i.arg.replace(/^effect_/, ''), group: i.group || '기타' }))
    .filter((e) => e.group !== '도트' && e.group !== 'CC');
  const effectGroups = [...new Set(effects.map((e) => e.group))];
  const fields = byFn('toggleField');

  // ---------- 상태 읽기/바꾸기 (기존 함수를 그대로 부름 → 기존 버튼 켜짐 표시도 같이 맞음) ----------
  const F = D.filters;
  const call = (fn, arg) => window[fn]?.(arg);
  const slotFn = { 1: 'toggleSkill1', 2: 'toggleSkill2', 3: 'toggleSkill3' };
  const ui = {
    open: false, // 상세 필터 펼침
    attrTab: 'skill', // skill | strong | weak
    slot: 'any', // any | 1 | 2 | 3
    effectTab: effectGroups[0],
  };
  const attrSelected = (tab, slot, attr) => {
    if (tab === 'strong') return F.strong.includes(attr);
    if (tab === 'weak') return F.weak.includes(attr);
    return slot === 'any' ? F.skillAny.includes(attr) : F[`skill${slot}`].includes(attr);
  };
  const toggleAttr = (tab, slot, attr) => {
    if (tab === 'strong') return call('toggleSkillStrong', `strong_${attr}`);
    if (tab === 'weak') return call('toggleSkillWeak', `weak_${attr}`);
    if (slot === 'any') return D.toggleSkillAny(attr);
    return call(slotFn[slot], attr);
  };
  const skillCount = () => F.skillAny.length + F.skill1.length + F.skill2.length + F.skill3.length;
  // 스킬 종류 — 표의 스킬 칸 배경색(전체 공격·캐스팅·HP 소모)과 같은 색 견본을 씀
  const KINDS = [
    ['aoe', '전체 공격', 'rgb(220, 248, 248)'],
    ['cast', '캐스팅', 'rgb(255, 234, 234)'],
    ['hp', 'HP 소모', 'rgb(230, 255, 230)'],
    ['stack', '스택', null, 'https://media.dsrwiki.com/dsrwiki/debuff/스택.webp'],
    ['dot', '도트'],
    ['cc', 'CC'],
    ['heal', '회복'],
  ];
  const kindName = (k) => KINDS.find((x) => x[0] === k)?.[1] || k;
  const detailCount = () => skillCount() + F.skillKind.length + F.strong.length + F.weak.length + F.effect.length + F.field.length;
  const totalCount = () => detailCount() + F.evolution.length + F.type.length;

  // ---------- 화면 요소 도우미 ----------
  const h = (tag, attrs = {}, kids = []) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k, '');
      else if (v !== false && v != null) n.setAttribute(k, v);
    }
    (Array.isArray(kids) ? kids : [kids]).forEach((c) => c != null && n.append(c));
    return n;
  };
  const tip = (el, label) => {
    el.addEventListener('mouseenter', (e) => window.showCustomTooltip?.(e, label));
    el.addEventListener('mousemove', (e) => window.showCustomTooltip?.(e, label));
    el.addEventListener('mouseleave', () => window.hideCustomTooltip?.());
    el.setAttribute('aria-label', label);
  };
  // kind: 기존 버튼 모양을 그대로 따름 (skill/strong/weak = 배경 이미지, effect = 동그란 아이콘)
  const iconBtn = ({ img, label, active, onClick, size = 'md', showLabel = false, kind = 'plain' }) => {
    const b = h('button', { type: 'button', class: `fv-icon fv-${size} fv-k-${kind}${active ? ' is-on' : ''}`, 'aria-pressed': String(!!active), onclick: onClick }, [
      h('img', { src: img, alt: '', loading: 'lazy', decoding: 'async' }),
      showLabel ? h('span', { class: 'fv-icon-label', text: label }) : null,
    ]);
    if (!showLabel) tip(b, label);
    return b;
  };
  const segmented = (options, value, onPick, { small = false, label } = {}) =>
    h('div', { class: `fv-seg${small ? ' fv-seg-sm' : ''}`, role: 'group', 'aria-label': label }, options.map(([v, text, badge]) =>
      h('button', { type: 'button', class: v === value ? 'is-on' : '', 'aria-pressed': String(v === value), onclick: () => onPick(v) }, [
        text, badge ? h('span', { class: 'fv-badge', text: String(badge) }) : null,
      ])));

  // ---------- 틀 ----------
  const root = h('section', { class: 'fv', 'aria-label': '도감 필터' });
  old.before(root);
  const backdrop = h('div', { class: 'fv-backdrop', onclick: () => setOpen(false) });
  document.body.append(backdrop);
  signal.addEventListener('abort', () => { root.remove(); backdrop.remove(); document.documentElement.classList.remove('fv-lock'); });

  const oldSearch = document.getElementById('search');
  const search = h('input', { type: 'search', class: 'fv-search', placeholder: '디지몬 이름 (쉼표로 여러 개)', 'aria-label': '디지몬 이름 검색', value: oldSearch?.value || '' });
  search.addEventListener('input', () => {
    if (!oldSearch) return;
    oldSearch.value = search.value;
    oldSearch.dispatchEvent(new Event('input', { bubbles: true }));
    renderStatus();
  });

  const quick = h('div', { class: 'fv-quick' });
  const toggleBtn = h('button', { type: 'button', class: 'fv-more', 'aria-expanded': 'false', onclick: () => setOpen(!ui.open) });
  const bar = h('div', { class: 'fv-bar' }, [search, quick, toggleBtn]);
  const status = h('div', { class: 'fv-status' });
  const panel = h('div', { class: 'fv-panel', id: 'fv-panel' });
  toggleBtn.setAttribute('aria-controls', 'fv-panel');
  root.append(bar, status, panel);

  function setOpen(v) {
    ui.open = v;
    root.classList.toggle('is-open', v);
    backdrop.classList.toggle('is-open', v);
    toggleBtn.setAttribute('aria-expanded', String(v));
    // 모바일에서 아래 창이 열려 있을 땐 뒤 페이지가 스크롤되지 않게
    document.documentElement.classList.toggle('fv-lock', v && matchMedia('(max-width: 768px)').matches);
    renderBar();
    updateApply();
  }

  // ---------- 그리기 ----------
  const quickGroup = (title, list) => h('div', { class: 'fv-quick-group' }, [
    h('span', { class: 'fv-quick-title', text: title }),
    h('div', { class: 'fv-icons' }, list.map((i) => iconBtn({ img: i.img, label: i.label, active: i.btn.classList.contains('active'), onClick: () => { call(i.fn, i.arg); render(); } }))),
  ]);

  function renderBar() {
    quick.replaceChildren(quickGroup('진화', evolutions), quickGroup('타입', types));
    const n = detailCount();
    const nAll = totalCount();
    toggleBtn.replaceChildren(
      h('span', { class: 'fv-more-pc', text: ui.open ? '상세 필터 접기' : '상세 필터' }),
      h('span', { class: 'fv-more-mo', text: '필터' }),
      h('span', { class: 'fv-badge fv-more-pc', text: n ? String(n) : '' }),
      h('span', { class: 'fv-badge fv-more-mo', text: nAll ? String(nAll) : '' }),
      h('span', { class: 'fv-chevron', 'aria-hidden': 'true' }),
    );
  }

  function visibleRows() {
    const rows = document.querySelectorAll('#characterTable tr');
    let shown = 0;
    rows.forEach((r) => { if (r.style.display !== 'none') shown++; });
    return { shown, total: rows.length };
  }

  function chipsList() {
    const chips = [];
    const add = (text, img, remove, kind = 'plain') => chips.push({ text, img, remove, kind });
    evolutions.filter((i) => F.evolution.includes(i.arg)).forEach((i) => add(i.label, i.img, () => call(i.fn, i.arg)));
    types.filter((i) => F.type.includes(i.arg)).forEach((i) => add(i.label, i.img, () => call(i.fn, i.arg)));
    F.skillAny.forEach((a) => add(`${a} 스킬`, attrImg('skill', a), () => D.toggleSkillAny(a), 'skill'));
    [1, 2, 3].forEach((s) => F[`skill${s}`].forEach((a) => add(`${s}스킬 ${a}`, attrImg('skill', a), () => call(slotFn[s], a), 'skill')));
    F.strong.forEach((a) => add(`강점 ${a}`, attrImg('strong', a), () => call('toggleSkillStrong', `strong_${a}`), 'strong'));
    F.weak.forEach((a) => add(`약점 ${a}`, attrImg('weak', a), () => call('toggleSkillWeak', `weak_${a}`), 'weak'));
    F.skillKind.forEach((k) => add(`${kindName(k)} 스킬`, KINDS.find((x) => x[0] === k)?.[3] || null, () => D.toggleSkillKind(k)));
    effects.filter((e) => e.btn.classList.contains('active')).forEach((e) => add(e.label, e.img, () => call(e.fn, e.arg), 'effect'));
    fields.filter((f) => f.btn.classList.contains('active')).forEach((f) => add(f.label, f.img, () => call(f.fn, f.arg)));
    return chips;
  }

  function renderStatus() {
    const chips = chipsList();
    const searching = search.value.trim() !== '';
    status.replaceChildren(
      h('div', { class: 'fv-chips' }, [
        ...chips.map((c) => h('button', { type: 'button', class: 'fv-chip', onclick: () => { c.remove(); render(); }, 'aria-label': `${c.text} 조건 빼기` }, [
          c.img ? h('img', { src: c.img, alt: '', class: `fv-k-${c.kind}` }) : h('span', { class: 'fv-chip-dot', 'aria-hidden': 'true' }), c.text, h('span', { class: 'fv-x', 'aria-hidden': 'true', text: '×' }),
        ])),
        searching && chips.length ? h('span', { class: 'fv-note', text: '이름 검색 중에는 조건이 잠시 꺼집니다' }) : null,
      ]),
      h('div', { class: 'fv-count' }, [
        chips.length || searching ? h('button', { type: 'button', class: 'fv-clear', text: '전체 해제', onclick: () => { window.resetFilters?.(); D.setEffectMatchAll(false); search.value = ''; if (oldSearch) { oldSearch.value = ''; } D.filterTable(); render(); } }) : null,
      ]),
    );
    status.hidden = !chips.length && !searching;
  }

  function renderPanel() {
    // 모바일 아래 창에서는 진화·타입도 이 안에 보여 줌 (위 줄에는 검색과 버튼만)
    const mobileQuick = h('div', { class: 'fv-row fv-only-mo' }, [
      h('div', { class: 'fv-row-head' }, [h('h4', { text: '진화 · 타입' })]),
      h('div', { class: 'fv-quick fv-quick-in' }, [quickGroup('진화', evolutions), quickGroup('타입', types)]),
    ]);

    // 속성
    const tabCount = { skill: skillCount(), strong: F.strong.length, weak: F.weak.length };
    const slotCount = { any: F.skillAny.length, 1: F.skill1.length, 2: F.skill2.length, 3: F.skill3.length };
    const attrRow = h('div', { class: 'fv-row' }, [
      h('div', { class: 'fv-row-head' }, [
        h('h4', { text: '속성' }),
        segmented([['skill', '스킬', tabCount.skill], ['strong', '강점', tabCount.strong], ['weak', '약점', tabCount.weak]], ui.attrTab, (v) => { ui.attrTab = v; renderPanel(); }, { label: '속성 종류' }),
        ui.attrTab === 'skill'
          ? segmented([['any', '아무 스킬', slotCount.any], ['1', '1스킬', slotCount[1]], ['2', '2스킬', slotCount[2]], ['3', '3스킬', slotCount[3]]], ui.slot, (v) => { ui.slot = v; renderPanel(); }, { small: true, label: '스킬 위치' })
          : null,
      ]),
      h('div', { class: `fv-icons fv-attr fv-attr-${ui.attrTab}` }, attrs.map((a) => iconBtn({
        img: attrImg(ui.attrTab, a), label: a, kind: ui.attrTab, showLabel: true, size: 'sm',
        active: attrSelected(ui.attrTab, ui.slot, a),
        onClick: () => { toggleAttr(ui.attrTab, ui.slot, a); render(); },
      }))),
      h('p', { class: 'fv-hint', text: ui.attrTab === 'skill'
        ? (ui.slot === 'any' ? '그 속성 스킬이 하나라도 있는 디지몬 (변환 가능한 속성 포함)' : `${ui.slot}번째 스킬이 그 속성인 디지몬 (변환 가능한 속성 포함)`)
        : ui.attrTab === 'strong' ? '그 속성에 강한 디지몬' : '그 속성에 약한 디지몬' }),
    ]);

    // 스킬 종류
    const kindHint = () => {
      const scope = skillCount() ? ' (위에서 고른 속성 스킬 중에서)' : '';
      if (F.skillKind.length < 2 || !skillRowPicked) return `그런 스킬이 하나라도 있는 디지몬${scope}`;
      const mode = D.getSkillKindMode();
      if (mode === 'same') return `스킬 하나가 고른 종류를 모두 가진 디지몬${scope}`;
      if (mode === 'any') return `고른 종류 중 하나라도 있는 디지몬${scope}`;
      return `고른 종류가 1·2·3스킬에 나눠서라도 모두 있는 디지몬${scope}`;
    };
    // 조합 방식 앞에 무엇을 골랐는지 이름으로 보여 줌: [전체 공격] + [도트]
    const pickedNames = (names) => h('span', { class: 'fv-picked' }, names.flatMap((n, i) => [
      i ? h('span', { class: 'fv-plus', text: '+', 'aria-hidden': 'true' }) : null,
      h('b', { text: n }),
    ]));
    // 버튼 묶음: 스킬 줄(전체 공격·캐스팅·HP 소모·스택) / 효과 줄(도트·CC·회복) — 판단은 같은 "스킬 종류" 조건
    const EFFECT_KINDS = ['dot', 'cc', 'heal'];
    const kindButtons = (list) => h('div', { class: 'fv-kinds' }, list.map(([k, label, color, img]) => {
      const on = F.skillKind.includes(k);
      return h('button', { type: 'button', class: `fv-kind${on ? ' is-on' : ''}`, 'aria-pressed': String(on), onclick: () => { D.toggleSkillKind(k); render(); } }, [
        img ? h('img', { src: img, alt: '', class: 'fv-kind-img' }) : color ? h('span', { class: 'fv-kind-swatch', style: `background:${color}` }) : null,
        label,
      ]);
    }));
    // 여러 개 고르면 조합 방식 (두 줄에서 고른 것을 합쳐서 셈). 스킬 줄에 고른 게 있으면 스킬 줄에, 아니면 효과 줄에 보여 줌
    const skillRowPicked = F.skillKind.some((k) => !EFFECT_KINDS.includes(k));
    const kindMode = () => F.skillKind.length > 1 ? h('div', { class: 'fv-mode' }, [
      pickedNames(F.skillKind.map(kindName)),
      segmented([['all', '모두 가진 디지몬'], ['same', '한 스킬이 모두 가진 디지몬'], ['any', '하나라도 있으면']], D.getSkillKindMode(), (v) => { D.setSkillKindMode(v); render(); }, { small: true, label: '스킬 조건 조합 방식' }),
    ]) : null;
    const kindRow = h('div', { class: 'fv-row' }, [
      h('div', { class: 'fv-row-head' }, [h('h4', { text: '스킬' })]),
      kindButtons(KINDS.filter(([k]) => !EFFECT_KINDS.includes(k))),
      skillRowPicked ? kindMode() : null,
      h('p', { class: 'fv-hint', text: kindHint() }),
    ]);

    // 효과
    const effCount = (g) => effects.filter((e) => e.group === g && e.btn.classList.contains('active')).length;
    const shownEffects = effects.filter((e) => e.group === ui.effectTab);
    const all = D.getEffectMatchAll();
    const effectRow = h('div', { class: 'fv-row' }, [
      h('div', { class: 'fv-row-head' }, [
        h('h4', { text: '효과' }),
        kindButtons(KINDS.filter(([k]) => EFFECT_KINDS.includes(k))),
      ]),
      skillRowPicked ? null : kindMode(),
      h('div', { class: 'fv-row-head fv-sub-head' }, [
        segmented(effectGroups.map((g) => [g, g, effCount(g)]), ui.effectTab, (v) => { ui.effectTab = v; renderPanel(); }, { label: '효과 분류' }),
      ]),
      h('div', { class: 'fv-icons fv-effects' }, shownEffects.map((e) => iconBtn({ img: e.img, label: e.label, active: e.btn.classList.contains('active'), showLabel: true, size: 'sm', kind: 'effect', onClick: () => { call(e.fn, e.arg); render(); } }))),
      F.effect.length > 1 ? h('div', { class: 'fv-mode' }, [
        pickedNames(effects.filter((e) => e.btn.classList.contains('active')).map((e) => e.label)),
        segmented([['any', '하나라도 있으면'], ['all', '모두 가진 디지몬만']], all ? 'all' : 'any', (v) => { D.setEffectMatchAll(v === 'all'); render(); }, { small: true, label: '효과 조합 방식' }),
      ]) : null,
    ]);

    // 필드
    const fieldRow = h('div', { class: 'fv-row' }, [
      h('div', { class: 'fv-row-head' }, [h('h4', { text: '필드' })]),
      h('div', { class: 'fv-icons' }, fields.map((f) => iconBtn({ img: f.img, label: f.label, active: f.btn.classList.contains('active'), showLabel: true, size: 'sm', onClick: () => { call(f.fn, f.arg); render(); } }))),
      F.field.length > 1 ? h('div', { class: 'fv-mode' }, [
        pickedNames(fields.filter((f) => f.btn.classList.contains('active')).map((f) => f.label)),
        segmented([['any', '하나라도 있으면'], ['all', '모두 가진 디지몬만']], D.getFieldMatchAll() ? 'all' : 'any', (v) => { D.setFieldMatchAll(v === 'all'); render(); }, { small: true, label: '필드 조합 방식' }),
      ]) : null,
    ]);

    const sheetHead = h('div', { class: 'fv-sheet-head fv-only-mo' }, [
      h('h3', { text: '필터' }),
      h('button', { type: 'button', class: 'fv-sheet-close', 'aria-label': '닫기', text: '×', onclick: () => setOpen(false) }),
    ]);
    const sheetFoot = h('div', { class: 'fv-sheet-foot fv-only-mo' }, [
      h('button', { type: 'button', class: 'fv-clear', text: '전체 해제', onclick: () => { window.resetFilters?.(); D.setEffectMatchAll(false); render(); } }),
      h('button', { type: 'button', class: 'fv-apply', onclick: () => setOpen(false) }),
    ]);
    panel.replaceChildren(sheetHead, h('div', { class: 'fv-panel-body' }, [mobileQuick, attrRow, kindRow, effectRow, fieldRow]), sheetFoot);
    updateApply();
  }

  /** 모바일 창 아래 "N개 보기" — 표가 늦게 그려져도 맞는 숫자가 되게 따로 갱신 */
  function updateApply() {
    const btn = panel.querySelector('.fv-apply');
    if (btn) btn.textContent = `${visibleRows().shown}개 보기`;
  }

  function render() {
    renderBar();
    renderStatus();
    renderPanel();
  }

  render();
  // 표가 그려지거나 다시 그려질 때 개수 갱신
  document.addEventListener('digimon:rendered', () => { renderStatus(); updateApply(); }, { signal });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.open && matchMedia('(max-width: 768px)').matches) setOpen(false); }, { signal });
}

  const run = () => initFilter(new AbortController().signal);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
