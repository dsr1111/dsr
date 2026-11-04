// 디지몬 페이지 관리자 도구 — 디지몬 추가/수정/삭제 + 이미지 업로드(R2).
// dsrwiki.com/digimon#admin 으로 들어오면 불러와집니다. 로그인은 메인 페이지 관리자와 같습니다.
(function () {
  if (window.DSRDigimonAdmin) return;

  const LOGIN_API = "/.netlify/functions/site-admin";
  const API = "/.netlify/functions/digimon-admin";
  const TOKEN_KEY = "dsrCouponAdminToken";
  const MEDIA = "https://media.dsrwiki.com/dsrwiki/digimon/";

  const STAGES = ["성장기", "성숙기", "완전체", "궁극체"];
  const TYPES = ["백신", "데이터", "바이러스", "프리", "언노운", "NO DATA"];
  const ATTRS = ["물리", "어둠", "불", "빛", "강철", "바람", "천둥", "얼음", "나무", "흙", "물"];
  const FIELDS = ["NSp", "NSo", "ME", "WG", "VB", "UK", "DR", "DS", "DA", "JT"];
  const STRONG_EFFECTS = ["내성", "회피", "반사"];
  const WEAK_EFFECTS = ["약점", "회피불가", "효과확률"];
  const RANGES = ["근거리", "원거리", "자신"];
  const TARGETS = ["단일", "전체", "자신", "아군"];
  const STATS = [["level", "레벨"], ["hp", "HP"], ["sp", "SP"], ["STR", "힘"], ["INT", "지능"], ["DEF", "수비"], ["RES", "저항"], ["SPD", "속도"]];
  const IMAGE_MAX = { portrait: 512, skill1: 256, skill2: 256, skill3: 256, stack: 256 };

  // ---------- 스타일 ----------
  const style = document.createElement("style");
  style.textContent = `
    .dga-toolbar { display: flex; gap: 6px; justify-content: flex-end; margin: 0 0 8px; flex-wrap: wrap; }
    .dga-btn { font: inherit; font-size: 12px; line-height: 1.2; padding: 5px 9px; border-radius: 5px; border: 1px solid #c0c0c0;
      background: #fff; color: #2c3e50; cursor: pointer; }
    .dga-btn:hover { background: #e8ebef; }
    .dga-btn:disabled { opacity: .5; cursor: default; }
    .dga-btn.dga-primary { background: #2c3e50; border-color: #2c3e50; color: #fff; }
    .dga-btn.dga-primary:hover { background: #1d2a36; }
    .dga-btn.dga-danger { color: #c0392b; border-color: #e3b5b0; }
    .dga-btn.dga-danger:hover { background: #fbeceb; }
    .dga-edit { display: block; margin: 4px auto 0; padding: 2px 8px; font-size: 11px; }

    .dga-overlay { position: fixed; inset: 0; background: rgba(15, 20, 30, .55); z-index: 3000; display: flex;
      align-items: flex-start; justify-content: center; padding: 30px 16px; overflow-y: auto; box-sizing: border-box; }
    .dga-modal { background: #fff; color: #222; width: 100%; max-width: 420px; border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.3);
      padding: 18px 18px 16px; box-sizing: border-box; text-align: left; font-size: 14px; }
    .dga-modal.dga-wide { max-width: 820px; }
    .dga-modal [hidden] { display: none !important; }
    .dga-modal h2 { margin: 0 0 14px; font-size: 17px; }
    .dga-modal h3 { margin: 16px 0 8px; font-size: 14px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    .dga-modal .dga-field { margin-bottom: 10px; min-width: 0; }
    .dga-modal .dga-label { display: block; margin: 0 0 3px; font-size: 12px; font-weight: bold; color: #555; }
    .dga-modal input[type="text"], .dga-modal input[type="password"], .dga-modal input[type="number"], .dga-modal select {
      width: 100%; box-sizing: border-box; margin: 0; padding: 6px 7px; font: inherit; font-size: 13px;
      border: 1px solid #ccc; border-radius: 5px; background: #fff; color: #222; }
    .dga-grid { display: grid; gap: 8px 10px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .dga-grid.dga-g2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .dga-grid.dga-g3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .dga-grid.dga-g5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .dga-checks { display: flex; flex-wrap: wrap; gap: 4px 12px; }
    .dga-check { display: inline-flex !important; align-items: center; gap: 4px; margin: 0 !important; font-size: 13px; white-space: nowrap; cursor: pointer; }
    .dga-skill { border: 1px solid #e3e3e3; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; background: #fafbfc; }
    .dga-skill-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-weight: bold; }
    .dga-mults { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 4px; }
    .dga-modal .dga-mults input { padding: 5px 3px; font-size: 12px; text-align: center; }
    .dga-mult-tools { display: flex; gap: 6px; align-items: center; margin-top: 6px; font-size: 12px; color: #666; flex-wrap: wrap; }
    .dga-modal .dga-mult-tools input { width: 70px; padding: 4px 5px; font-size: 12px; }
    .dga-img { display: flex; align-items: center; gap: 10px; }
    .dga-preview { width: 56px; height: 56px; border-radius: 6px; background: #0b0e1a center / contain no-repeat; flex: none; border: 1px solid #ddd; }
    .dga-preview.dga-small { width: 40px; height: 40px; }
    .dga-img-info { font-size: 11px; color: #888; }
    .dga-img-info.dga-new { color: #27ae60; font-weight: bold; }
    .dga-hint { font-size: 12px; color: #888; margin: 4px 0 0; }
    .dga-error { color: #c0392b; font-size: 13px; margin: 10px 0 0; min-height: 1em; white-space: pre-line; }
    .dga-footer { display: flex; justify-content: flex-end; gap: 6px; margin-top: 14px; align-items: center; }
    .dga-footer .dga-btn { font-size: 13px; padding: 7px 14px; }
    .dga-footer .dga-spacer { flex: 1; }
    @media (max-width: 640px) {
      .dga-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .dga-grid.dga-g5 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .dga-mults { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    }
  `;
  document.head.appendChild(style);

  // ---------- 공통 ----------
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, "");
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach((c) => c && node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  }
  const field = (label, control, hint) => el("div", { class: "dga-field" }, [
    el("span", { class: "dga-label", text: label }), control, hint ? el("p", { class: "dga-hint", text: hint }) : null,
  ]);
  const input = (value, attrs = {}) => el("input", { type: "text", value: value ?? "", ...attrs });
  let listSeq = 0;
  /** 자유 입력 + 추천 목록 */
  function suggestInput(value, options, attrs = {}) {
    const id = `dga-list-${++listSeq}`;
    const wrap = el("span", { style: { display: "contents" } }, [
      input(value, { list: id, ...attrs }),
      el("datalist", { id }, options.map((o) => el("option", { value: o }))),
    ]);
    return { node: wrap, input: wrap.firstChild };
  }
  function select(value, options, attrs = {}) {
    const opts = options.includes(value) || value === undefined || value === "" ? options : [value, ...options];
    const s = el("select", attrs, opts.map((o) => el("option", { value: o, text: o === "" ? "(없음)" : o })));
    s.value = value ?? options[0];
    return s;
  }
  function checks(selected, options) {
    const all = [...options, ...(selected || []).filter((x) => !options.includes(x))];
    const boxes = all.map((o) => {
      const b = el("input", { type: "checkbox", value: o });
      b.checked = (selected || []).includes(o);
      return el("label", { class: "dga-check" }, [b, o]);
    });
    // 원래 있던 값은 원래 순서 그대로, 새로 체크한 값은 뒤에 (JSON 변경을 최소화)
    const rank = (v) => ((selected || []).includes(v) ? (selected || []).indexOf(v) : 1000 + all.indexOf(v));
    const read = () => boxes.map((l) => l.firstChild).filter((b) => b.checked).map((b) => b.value).sort((a, b) => rank(a) - rank(b));
    return { node: el("div", { class: "dga-checks" }, boxes), read };
  }

  const modalStack = [];
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalStack.length) modalStack[modalStack.length - 1].tryClose();
  });
  function openModal(title, body, { onRequestClose, wide } = {}) {
    const modal = el("div", { class: `dga-modal${wide ? " dga-wide" : ""}`, role: "dialog", "aria-modal": "true", "aria-label": title }, [el("h2", { text: title }), body]);
    const overlay = el("div", { class: "dga-overlay" }, modal);
    const entry = {
      close() { overlay.remove(); const i = modalStack.indexOf(entry); if (i >= 0) modalStack.splice(i, 1); },
      tryClose() { return onRequestClose ? onRequestClose(entry.close) : entry.close(); },
    };
    overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) entry.tryClose(); });
    document.body.appendChild(overlay);
    modalStack.push(entry);
    return entry;
  }

  // ---------- 토큰 / API ----------
  function getToken() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || "null");
      if (saved && saved.token && saved.expiresAt > Date.now()) return saved.token;
    } catch (e) { /* 무시 */ }
    clearToken();
    return null;
  }
  function setToken(data) { try { sessionStorage.setItem(TOKEN_KEY, JSON.stringify(data)); } catch (e) { /* 무시 */ } }
  function clearToken() { try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* 무시 */ } }

  async function request(url, method, body) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let res;
    try {
      res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    } catch (e) {
      throw Object.assign(new Error("서버에 연결하지 못했습니다."), { status: 0 });
    }
    let json = {};
    try { json = await res.json(); } catch (e) { /* 무시 */ }
    if (!res.ok) {
      if (res.status === 401 && body?.action !== "login") clearToken();
      const msg = res.status === 413 ? "이미지가 너무 큽니다. 더 작은 이미지로 다시 시도해주세요." : json.error || "요청을 처리하지 못했습니다.";
      throw Object.assign(new Error(msg), { status: res.status });
    }
    return json;
  }

  function clearHash() {
    if (location.hash === "#admin" || location.hash === "#coupon-admin") history.replaceState(null, "", location.pathname + location.search);
  }

  // ---------- 로그인 ----------
  function showLogin() {
    const pw = el("input", { type: "password", autocomplete: "current-password", placeholder: "관리자 비밀번호" });
    const error = el("p", { class: "dga-error" });
    const submit = el("button", { type: "submit", class: "dga-btn dga-primary", text: "로그인" });
    const cancel = el("button", { type: "button", class: "dga-btn", text: "취소" });
    const form = el("form", {}, [field("비밀번호", pw), error, el("div", { class: "dga-footer" }, [cancel, submit])]);
    const modal = openModal("디지몬 관리자 로그인", form, { onRequestClose(close) { close(); clearHash(); } });
    cancel.addEventListener("click", () => modal.tryClose());
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!pw.value) return;
      submit.disabled = true;
      error.textContent = "";
      try {
        setToken(await request(LOGIN_API, "POST", { action: "login", password: pw.value }));
        modal.close();
        clearHash();
        enterAdmin();
      } catch (err) {
        error.textContent = err.message;
        pw.select();
      } finally {
        submit.disabled = false;
      }
    });
    setTimeout(() => pw.focus(), 0);
  }

  // ---------- 관리 모드 ----------
  let active = false;

  function decorateRows() {
    if (!active) return;
    document.querySelectorAll("#characterTable tr").forEach((tr) => {
      const cell = tr.cells[0];
      if (!cell || cell.querySelector(".dga-edit")) return;
      cell.appendChild(el("button", { type: "button", class: "dga-btn dga-edit", text: "수정", onclick: (e) => { e.stopPropagation(); showEditor(tr.dataset.name); } }));
    });
  }

  function enterAdmin() {
    active = true;
    if (!document.querySelector(".dga-toolbar")) {
      const results = document.querySelector(".results");
      results?.parentNode.insertBefore(el("div", { class: "dga-toolbar" }, [
        el("span", { text: "관리자 모드", style: { fontSize: "12px", color: "#888", marginRight: "auto", alignSelf: "center" } }),
        el("button", { type: "button", class: "dga-btn dga-primary", text: "+ 디지몬 추가", onclick: () => showEditor(null) }),
        el("button", { type: "button", class: "dga-btn", text: "관리 종료", onclick: exitAdmin }),
      ]), results);
    }
    decorateRows();
  }

  function exitAdmin(expired) {
    active = false;
    clearToken();
    document.querySelector(".dga-toolbar")?.remove();
    document.querySelectorAll(".dga-edit").forEach((b) => b.remove());
    if (expired === true) alert("관리자 로그인이 만료되었습니다. 다시 로그인하려면 주소 끝에 #admin 을 붙여 접속하세요.");
  }

  document.addEventListener("digimon:rendered", decorateRows);

  // ---------- 이미지 ----------
  const folderOf = (name) => (name === "폼몬" ? "포무몬" : name).replace(/:/g, "_");
  const imageUrl = (name, slot) => `${MEDIA}${folderOf(name)}/${slot === "portrait" ? folderOf(name) : slot}.webp`;

  /** 파일 → 최대 크기에 맞춰 줄인 webp data URL (브라우저가 webp를 못 만들면 png) */
  async function fileToDataUrl(file, max) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    const out = blob && blob.type === "image/webp" ? blob : await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    return { dataUrl: await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(out); }), w, h, bytes: out.size };
  }

  /** 이미지 선택칸. read()는 새로 고른 이미지 data URL 또는 undefined */
  function imagePicker(label, slot, currentUrl, small) {
    const preview = el("div", { class: `dga-preview${small ? " dga-small" : ""}` });
    const info = el("span", { class: "dga-img-info", text: currentUrl ? "현재 이미지" : "이미지 없음" });
    if (currentUrl) {
      const probe = new Image();
      probe.onload = () => { preview.style.backgroundImage = `url("${currentUrl}")`; };
      probe.onerror = () => { info.textContent = "이미지 없음"; };
      probe.src = currentUrl;
    }
    let picked;
    const fileInput = el("input", { type: "file", accept: "image/webp,image/png,image/jpeg,image/gif", style: { display: "none" } });
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try {
        const r = await fileToDataUrl(file, IMAGE_MAX[slot]);
        picked = r.dataUrl;
        preview.style.backgroundImage = `url("${r.dataUrl}")`;
        info.textContent = `새 이미지 ${r.w}×${r.h} · ${Math.round(r.bytes / 1024)}KB (저장 시 업로드)`;
        info.className = "dga-img-info dga-new";
      } catch (e) {
        alert("이미지를 읽지 못했습니다.");
      }
      fileInput.value = "";
    });
    const node = field(label, el("div", { class: "dga-img" }, [
      preview,
      el("div", {}, [
        el("button", { type: "button", class: "dga-btn", text: "파일 선택", onclick: () => fileInput.click() }),
        el("div", {}, info),
      ]),
      fileInput,
    ]));
    return { node, read: () => picked, hasNew: () => !!picked };
  }

  // ---------- 편집기 ----------
  function collectEffects() {
    const set = new Set();
    Object.values(window.DSRDigimon?.data || {}).forEach((d) => (d.skills || []).forEach((s) => s.effect && set.add(s.effect)));
    return [...set].sort((a, b) => a.localeCompare(b, "ko"));
  }

  function skillEditor(index, skill, digimonName) {
    const s = skill || { name: "", hits: 1, range: "원거리", attribute: "물리", target_count: "단일", multipliers: [], change: [] };
    const name = input(s.name, { maxlength: "40", placeholder: "스킬 이름" });
    const hits = suggestInput(String(s.hits ?? ""), ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "보조"], { placeholder: "숫자 또는 보조" });
    const range = suggestInput(s.range ?? "", RANGES);
    const attribute = select(s.attribute, ATTRS);
    const target = suggestInput(s.target_count ?? "", TARGETS);
    const effect = suggestInput(s.effect ?? "", collectEffects(), { placeholder: "없으면 비움" });
    const addTurn = el("input", { type: "number", step: "any", min: "0", max: "10", value: s.additionalTurn ?? "", placeholder: "없으면 비움" });
    const hpCost = el("input", { type: "checkbox" });
    hpCost.checked = s.hpCost === true;
    const change = checks(s.change || [], ATTRS);

    const mults = Array.from({ length: 10 }, (_, i) => el("input", { type: "number", step: "any", min: "0", value: s.multipliers?.[i] ?? "", "aria-label": `Lv${i + 1} 계수`, title: `Lv${i + 1}` }));
    const startIn = el("input", { type: "number", step: "any", placeholder: "Lv1 값" });
    const stepIn = el("input", { type: "number", step: "any", placeholder: "증가량" });
    const fill = () => {
      const a = Number(startIn.value), d = Number(stepIn.value);
      if (!startIn.value || !stepIn.value || !Number.isFinite(a) || !Number.isFinite(d)) return alert("Lv1 값과 증가량을 입력해주세요.");
      mults.forEach((m, i) => { m.value = String(Math.round((a + d * i) * 10000) / 10000); });
    };

    const icon = imagePicker("스킬 아이콘", `skill${index + 1}`, digimonName ? imageUrl(digimonName, `skill${index + 1}`) : null, true);

    const node = el("div", { class: "dga-skill" }, [
      el("div", { class: "dga-skill-head", text: `${index + 1}스킬` }),
      el("div", { class: "dga-grid" }, [
        el("div", { style: { gridColumn: "span 2" } }, field("이름", name)),
        field("타수", hits.node),
        field("속성", attribute),
        field("사거리", range.node),
        field("대상", target.node),
        field("효과", effect.node),
        field("추가 턴", addTurn),
      ]),
      field("레벨별 계수 (Lv1 ~ Lv10)", el("div", {}, [
        el("div", { class: "dga-mults" }, mults),
        el("div", { class: "dga-mult-tools" }, ["자동 채우기:", startIn, "부터", stepIn, "씩", el("button", { type: "button", class: "dga-btn", text: "채우기", onclick: fill })]),
      ])),
      field("변환 가능 속성", change.node),
      el("div", { class: "dga-grid dga-g2" }, [
        field("HP 소모", el("label", { class: "dga-check" }, [hpCost, "HP를 소모하는 스킬"])),
        icon.node,
      ]),
    ]);

    function read() {
      const hitsVal = hits.input.value.trim();
      const multVals = mults.map((m) => m.value.trim());
      const lastFilled = multVals.reduce((acc, v, i) => (v !== "" ? i : acc), -1);
      const filled = multVals.slice(0, lastFilled + 1);
      const out = {
        name: name.value.trim(),
        hits: hitsVal === "보조" ? "보조" : hitsVal === "" ? "" : Number(hitsVal),
        range: range.input.value.trim(),
        attribute: attribute.value,
        target_count: target.input.value.trim(),
        effect: effect.input.value.trim() || undefined,
        additionalTurn: addTurn.value === "" ? undefined : Number(addTurn.value),
        multipliers: filled.map(Number),
        hpCost: hpCost.checked || undefined,
        change: change.read(),
        _gap: filled.includes(""),
      };
      return out;
    }
    return { node, read, icon };
  }

  async function showEditor(originalName) {
    const isNew = !originalName;
    // 다른 관리자가 바꿨을 수 있으니 최신 데이터로 편집 시작
    let base = null;
    if (!isNew) {
      try {
        const fresh = await request(API, "GET");
        base = fresh.data[originalName];
        if (!base) { alert("이미 삭제된 디지몬입니다. 페이지를 새로고침해주세요."); return; }
      } catch (err) {
        if (err.status === 401) { exitAdmin(true); return; }
        alert(err.message);
        return;
      }
    }
    const d = base || {
      evolution_stage: "성장기", type: "백신",
      stats: { level: 1, hp: 0, sp: 0, STR: 0, INT: 0, DEF: 0, RES: 0, SPD: 0 },
      strengths: { attribute: "", effect: "" }, weaknesses: { attribute: "", effect: "" }, fields: [], skills: [],
    };

    const name = input(originalName || "", { maxlength: "40", placeholder: "예) 오메가몬" });
    const stage = suggestInput(d.evolution_stage, STAGES);
    const type = suggestInput(d.type, TYPES);
    const stats = STATS.map(([k, label]) => [k, label, el("input", { type: "number", min: "0", step: "1", value: d.stats?.[k] ?? 0 })]);
    const strongAttr = select(d.strengths?.attribute ?? "", ["", ...ATTRS]);
    const strongEff = select(d.strengths?.effect ?? "", ["", ...STRONG_EFFECTS]);
    const weakAttr = select(d.weaknesses?.attribute ?? "", ["", ...ATTRS]);
    const weakEff = select(d.weaknesses?.effect ?? "", ["", ...WEAK_EFFECTS]);
    const fields = checks(d.fields || [], FIELDS);

    const portrait = imagePicker("디지몬 이미지", "portrait", originalName ? imageUrl(originalName, "portrait") : null);
    const stack = imagePicker("스택 이미지 (선택)", "stack", originalName ? imageUrl(originalName, "stack") : null, true);

    const skillCount = select(String((d.skills || []).length || (isNew ? 3 : 0)), ["0", "1", "2", "3"]);
    const skillEditors = [0, 1, 2].map((i) => skillEditor(i, d.skills?.[i], originalName));
    const syncSkills = () => skillEditors.forEach((s, i) => { s.node.hidden = i >= Number(skillCount.value); });
    skillCount.addEventListener("change", syncSkills);
    syncSkills();

    const readForm = () => ({
      name: name.value.trim(),
      entry: {
        evolution_stage: stage.input.value.trim(),
        type: type.input.value.trim(),
        stats: Object.fromEntries(stats.map(([k, , inp]) => [k, inp.value === "" ? NaN : Number(inp.value)])),
        strengths: { attribute: strongAttr.value, effect: strongEff.value },
        weaknesses: { attribute: weakAttr.value, effect: weakEff.value },
        fields: fields.read(),
        skills: skillEditors.slice(0, Number(skillCount.value)).map((s) => s.read()),
      },
    });
    const imagesChanged = () => [portrait, stack, ...skillEditors.map((s) => s.icon)].some((p) => p.hasNew());
    const initial = JSON.stringify(readForm());

    function validate({ name: n, entry }) {
      if (!n) return "디지몬 이름을 입력해주세요.";
      if (/[\/\\]/.test(n)) return "이름에 / 나 \\ 는 쓸 수 없습니다.";
      if (!isNew || n !== originalName) {
        if (n !== originalName && window.DSRDigimon?.data && Object.prototype.hasOwnProperty.call(window.DSRDigimon.data, n)) return `"${n}" 디지몬이 이미 있습니다.`;
      }
      if (!entry.evolution_stage || !entry.type) return "진화 단계와 타입을 입력해주세요.";
      for (const [k, label] of STATS) if (!Number.isInteger(entry.stats[k]) || entry.stats[k] < 0) return `${label} 값을 확인해주세요.`;
      for (let i = 0; i < entry.skills.length; i++) {
        const s = entry.skills[i];
        if (!s.name) return `${i + 1}스킬 이름을 입력해주세요.`;
        if (!(s.hits === "보조" || (Number.isInteger(s.hits) && s.hits >= 1))) return `${i + 1}스킬 타수는 숫자 또는 "보조"입니다.`;
        if (s._gap) return `${i + 1}스킬 계수 중간에 빈칸이 있습니다.`;
      }
      return null;
    }

    const error = el("p", { class: "dga-error" });
    const save = el("button", { type: "submit", class: "dga-btn dga-primary", text: isNew ? "추가" : "저장" });
    const cancel = el("button", { type: "button", class: "dga-btn", text: "취소" });
    const del = isNew ? null : el("button", { type: "button", class: "dga-btn dga-danger", text: "삭제" });

    const form = el("form", { novalidate: true }, [
      el("h3", { text: "기본 정보" }),
      el("div", { class: "dga-grid" }, [
        el("div", { style: { gridColumn: "span 2" } }, field("이름", name, isNew ? null : "이름을 바꾸면 기존 이미지도 새 이름 폴더로 복사됩니다.")),
        field("진화 단계", stage.node),
        field("타입", type.node),
      ]),
      el("h3", { text: "능력치" }),
      el("div", { class: "dga-grid" }, stats.map(([, label, inp]) => field(label, inp))),
      el("h3", { text: "강점 / 약점 / 필드" }),
      el("div", { class: "dga-grid" }, [
        field("강점 속성", strongAttr), field("강점 효과", strongEff),
        field("약점 속성", weakAttr), field("약점 효과", weakEff),
      ]),
      field("필드", fields.node),
      el("h3", { text: "이미지" }),
      el("div", { class: "dga-grid dga-g2" }, [portrait.node, stack.node]),
      el("p", { class: "dga-hint", text: "디지몬 이미지는 최대 512px, 아이콘은 최대 256px로 줄여서 webp로 올립니다. 새로 고르지 않은 이미지는 그대로 둡니다." }),
      el("h3", { text: "스킬" }),
      field("스킬 개수", el("div", { style: { maxWidth: "120px" } }, skillCount)),
      ...skillEditors.map((s) => s.node),
      error,
      el("div", { class: "dga-footer" }, [del, el("span", { class: "dga-spacer" }), cancel, save]),
    ]);

    let saving = false;
    const modal = openModal(isNew ? "디지몬 추가" : `디지몬 수정 — ${originalName}`, form, {
      wide: true,
      onRequestClose(close) {
        if (saving) return;
        if ((JSON.stringify(readForm()) !== initial || imagesChanged()) && !confirm("저장하지 않은 변경 내용이 있습니다. 닫을까요?")) return;
        close();
      },
    });
    cancel.addEventListener("click", () => modal.tryClose());

    const lock = (on) => { saving = on; [save, cancel, del].forEach((b) => b && (b.disabled = on)); };
    const fail = (err) => {
      if (err.status === 401) { modal.close(); exitAdmin(true); return; }
      error.textContent = err.message;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = readForm();
      const problem = validate(data);
      if (problem) { error.textContent = problem; return; }
      data.entry.skills.forEach((s) => { delete s._gap; });
      const images = {};
      if (portrait.read()) images.portrait = portrait.read();
      if (stack.read()) images.stack = stack.read();
      skillEditors.forEach((s, i) => { if (s.icon.read()) images[`skill${i + 1}`] = s.icon.read(); });
      lock(true);
      error.textContent = "";
      save.textContent = "저장 중...";
      try {
        await request(API, "POST", { action: "save", originalName: originalName || null, name: data.name, entry: data.entry, base, images });
        modal.close();
        await window.DSRDigimon.reload();
      } catch (err) {
        fail(err);
      } finally {
        lock(false);
        save.textContent = isNew ? "추가" : "저장";
      }
    });

    del?.addEventListener("click", async () => {
      if (!confirm(`"${originalName}" 디지몬을 삭제할까요?\n(이미지는 지우지 않고, 저장 전 데이터는 백업됩니다)`)) return;
      lock(true);
      try {
        await request(API, "POST", { action: "delete", name: originalName, base });
        modal.close();
        await window.DSRDigimon.reload();
      } catch (err) {
        fail(err);
      } finally {
        lock(false);
      }
    });
    setTimeout(() => name.focus(), 0);
  }

  // ---------- 시작 ----------
  function open() {
    if (active) return clearHash();
    if (getToken()) { clearHash(); enterAdmin(); } else if (location.hash === "#admin" || location.hash === "#coupon-admin") showLogin();
  }
  window.DSRDigimonAdmin = { open };
  open();
})();
