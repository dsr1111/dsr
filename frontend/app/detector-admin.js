// 탐지기 페이지 관리자 도구 — 탐지기/악역 디지몬(맵 위치 찍기)과 상자·꾸러미 구성품 편집.
// dsrwiki.com/detector#admin 으로 들어오면 불러와집니다. 로그인은 메인 페이지 관리자와 같습니다.
(function () {
  if (window.DSRDetectorAdmin) return;

  const LOGIN_API = "/.netlify/functions/site-admin";
  const API = "/.netlify/functions/detector-admin";
  const TOKEN_KEY = "dsrCouponAdminToken";
  const MEDIA = "https://media.dsrwiki.com/dsrwiki/";
  const MONSTERS = "악역 디지몬";
  const TRADE = ["거래가능", "거래불가"];
  const DROP = ["확정", "확률"];
  const COORD_BASE = 400; // detector.json 좌표 기준 크기 (페이지는 500px/350px로 늘여서 표시)

  // ---------- 스타일 ----------
  const style = document.createElement("style");
  style.textContent = `
    .dta-toolbar { display: flex; gap: 6px; justify-content: flex-end; align-items: center; margin: 0 0 10px; flex-wrap: wrap; }
    .dta-btn { font: inherit; font-size: 12px; line-height: 1.2; padding: 5px 9px; border-radius: 5px; border: 1px solid #c0c0c0;
      background: #fff; color: #2c3e50; cursor: pointer; }
    .dta-btn:hover { background: #e8ebef; }
    .dta-btn:disabled { opacity: .5; cursor: default; }
    .dta-btn.dta-primary { background: #2c3e50; border-color: #2c3e50; color: #fff; }
    .dta-btn.dta-primary:hover { background: #1d2a36; }
    .dta-btn.dta-danger { color: #c0392b; border-color: #e3b5b0; }
    .dta-btn.dta-danger:hover { background: #fbeceb; }

    .dta-overlay { position: fixed; inset: 0; background: rgba(15, 20, 30, .55); z-index: 3000; display: flex;
      align-items: flex-start; justify-content: center; padding: 30px 16px; overflow-y: auto; box-sizing: border-box; }
    .dta-modal { background: #fff; color: #222; width: 100%; max-width: 420px; border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.3);
      padding: 18px 18px 16px; box-sizing: border-box; text-align: left; font-size: 14px; }
    .dta-modal.dta-wide { max-width: 860px; }
    .dta-modal [hidden] { display: none !important; }
    .dta-modal h2 { margin: 0 0 14px; font-size: 17px; }
    .dta-modal h3 { margin: 16px 0 8px; font-size: 14px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    .dta-field { margin-bottom: 10px; min-width: 0; }
    .dta-label { display: block; margin: 0 0 3px; font-size: 12px; font-weight: bold; color: #555; }
    .dta-modal input[type="text"], .dta-modal input[type="password"], .dta-modal input[type="number"], .dta-modal select, .dta-modal textarea {
      width: 100%; box-sizing: border-box; margin: 0; padding: 6px 7px; font: inherit; font-size: 13px;
      border: 1px solid #ccc; border-radius: 5px; background: #fff; color: #222; }
    .dta-modal textarea { min-height: 70px; resize: vertical; }
    .dta-grid { display: grid; gap: 8px 10px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .dta-grid.dta-g2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .dta-hint { font-size: 12px; color: #888; margin: 4px 0 0; }
    .dta-error { color: #c0392b; font-size: 13px; margin: 10px 0 0; min-height: 1em; white-space: pre-line; }
    .dta-footer { display: flex; justify-content: flex-end; gap: 6px; margin-top: 14px; align-items: center; }
    .dta-footer .dta-btn { font-size: 13px; padding: 7px 14px; }
    .dta-spacer { flex: 1; }

    .dta-list { border: 1px solid #e3e3e3; border-radius: 8px; overflow: hidden; }
    .dta-row { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-top: 1px solid #eee; }
    .dta-row:first-child { border-top: none; }
    .dta-row-main { flex: 1; min-width: 0; }
    .dta-row-title { font-weight: bold; overflow-wrap: anywhere; }
    .dta-row-sub { font-size: 12px; color: #777; overflow-wrap: anywhere; }
    .dta-row .dta-btn { flex: none; }
    .dta-thumb { width: 36px; height: 36px; border-radius: 5px; background: #0b0e1a center / contain no-repeat; flex: none; }
    .dta-empty { padding: 14px; text-align: center; color: #888; font-size: 13px; }

    .dta-items { display: flex; flex-direction: column; gap: 5px; }
    .dta-item { display: grid; grid-template-columns: 30px 1fr 96px 80px 28px; gap: 6px; align-items: center; }
    .dta-item.dta-box { grid-template-columns: 30px 1fr 96px 28px; }
    .dta-item .dta-thumb { width: 30px; height: 30px; }
    .dta-remove { width: 28px; height: 28px; padding: 0; border: none; background: none; color: #999; font-size: 18px; cursor: pointer; border-radius: 4px; }
    .dta-remove:hover { background: #f2f2f2; color: #c0392b; }

    .dta-map-layout { display: grid; grid-template-columns: minmax(0, 420px) minmax(0, 1fr); gap: 16px; align-items: start; }
    .dta-map { position: relative; width: 100%; aspect-ratio: 1 / 1; background: #0b0e1a; border-radius: 8px; overflow: hidden;
      cursor: crosshair; user-select: none; touch-action: none; }
    .dta-map img.dta-map-img { width: 100%; height: 100%; object-fit: contain; display: block; pointer-events: none; }
    .dta-map-missing { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 13px; text-align: center; padding: 20px; }
    .dta-pin { position: absolute; width: 28px; height: 28px; transform: translate(-50%, -50%); background: rgb(52,52,52); border-radius: 3px;
      box-shadow: 0 0 0 2px #f1c40f, 0 2px 8px rgba(0,0,0,.6); cursor: grab; }
    .dta-pin img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
    .dta-pin:active { cursor: grabbing; }
    .dta-coords { display: flex; gap: 6px; align-items: center; margin-top: 6px; font-size: 12px; color: #555; flex-wrap: wrap; }
    .dta-modal .dta-coords input { width: 70px; }
    @media (max-width: 720px) {
      .dta-map-layout { grid-template-columns: 1fr; }
      .dta-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .dta-item { grid-template-columns: 26px 1fr 84px 70px 26px; gap: 4px; }
      .dta-item.dta-box { grid-template-columns: 26px 1fr 84px 26px; }
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
  const field = (label, control, hint) => el("div", { class: "dta-field" }, [
    el("span", { class: "dta-label", text: label }), control, hint ? el("p", { class: "dta-hint", text: hint }) : null,
  ]);
  const input = (value, attrs = {}) => el("input", { type: "text", value: value ?? "", ...attrs });
  const select = (value, options, attrs = {}) => {
    const s = el("select", attrs, options.map((o) => el("option", { value: o, text: o })));
    s.value = options.includes(value) ? value : options[0];
    return s;
  };
  let listSeq = 0;
  function datalist(options) {
    const id = `dta-list-${++listSeq}`;
    return { id, node: el("datalist", { id }, options.map((o) => el("option", { value: o }))) };
  }
  const clone = (v) => JSON.parse(JSON.stringify(v ?? null));
  const folderOf = (name) => (name === "폼몬" ? "포무몬" : name).replace(/:/g, "_");
  const digimonImage = (name) => `${MEDIA}digimon/${folderOf(name)}/${folderOf(name)}.webp`;
  const iconUrl = (name) => (name.includes("균열 데이터 상자") ? `${MEDIA}item/균열 데이터 상자.webp`
    : name.replace(/\s/g, "") === "변조된스파이럴탐지기" ? `${MEDIA}item/스파이럴 탐지기.webp`
    : `${MEDIA}item/${name.replace(/:/g, "_")}.webp`);
  const itemImage = (name) => {
    const n = name.includes("Data : ") ? name.replace(/\s/g, "").replace(":", "") : name.trim();
    return `${MEDIA}item/${n.includes("균열 데이터 상자") ? "균열 데이터 상자" : n.replace(/\s*x\s*\d+$/, "").trim()}.webp`;
  };
  /** detector.js 와 같은 규칙 */
  const mapFile = (map, detector, digimon) => {
    let m = String(map || "").replace(/\s+/g, "");
    if (String(detector).replace(/\s/g, "") === "변조된스파이럴탐지기" && digimon === "아포카리몬" && m === "???") m = "ApocalymonArea";
    return m;
  };
  const mapUrl = (map, detector, digimon) => `${MEDIA}map/${encodeURIComponent(mapFile(map, detector, digimon))}.webp`;
  const thumb = (url) => {
    const t = el("div", { class: "dta-thumb" });
    if (url) t.style.backgroundImage = `url("${url}")`;
    return t;
  };

  const modalStack = [];
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalStack.length) modalStack[modalStack.length - 1].tryClose();
  });
  function openModal(title, body, { onRequestClose, wide } = {}) {
    const heading = el("h2", { text: title });
    const modal = el("div", { class: `dta-modal${wide ? " dta-wide" : ""}`, role: "dialog", "aria-modal": "true", "aria-label": title }, [heading, body]);
    const overlay = el("div", { class: "dta-overlay" }, modal);
    const entry = {
      heading,
      close() { overlay.remove(); const i = modalStack.indexOf(entry); if (i >= 0) modalStack.splice(i, 1); },
      tryClose() { return onRequestClose ? onRequestClose(entry.close) : entry.close(); },
    };
    overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) entry.tryClose(); });
    document.body.appendChild(overlay);
    modalStack.push(entry);
    return entry;
  }
  const closeAllModals = () => [...modalStack].reverse().forEach((m) => m.close());

  // ---------- 토큰 / API ----------
  function getToken() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || "null");
      if (saved && saved.token && saved.expiresAt > Date.now()) return saved.token;
    } catch (e) { /* 무시 */ }
    clearToken();
    return null;
  }
  function setToken(data) {
    // 만료 시각을 이 PC 시계 기준으로 다시 계산 (PC 시계가 틀려도 로그인 직후 만료되지 않게)
    const ttl = Number(data.ttl) || 12 * 60 * 60 * 1000;
    const saved = { token: data.token, expiresAt: Date.now() + ttl - 60 * 1000 };
    try { sessionStorage.setItem(TOKEN_KEY, JSON.stringify(saved)); } catch (e) { /* 무시 */ }
  }
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
  /** 로그인 만료면 관리 모드 종료 후 true */
  function expired(err) {
    if (err.status !== 401) return false;
    closeAllModals();
    exitAdmin(true);
    return true;
  }

  function clearHash() {
    if (location.hash === "#admin" || location.hash === "#coupon-admin") history.replaceState(null, "", location.pathname + location.search);
  }

  // ---------- 이미지 ----------
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
  /** 파일 선택 버튼. onPick(dataUrl, info) */
  function filePicker(label, max, onPick) {
    const fileInput = el("input", { type: "file", accept: "image/webp,image/png,image/jpeg,image/gif", style: { display: "none" } });
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try {
        const r = await fileToDataUrl(file, max);
        onPick(r.dataUrl, `${r.w}×${r.h} · ${Math.round(r.bytes / 1024)}KB`);
      } catch (e) {
        alert("이미지를 읽지 못했습니다.");
      }
      fileInput.value = "";
    });
    return el("span", {}, [el("button", { type: "button", class: "dta-btn", text: label, onclick: () => fileInput.click() }), fileInput]);
  }

  // ---------- 로그인 / 관리 모드 ----------
  function showLogin() {
    const pw = el("input", { type: "password", autocomplete: "current-password", placeholder: "관리자 비밀번호" });
    const error = el("p", { class: "dta-error" });
    const submit = el("button", { type: "submit", class: "dta-btn dta-primary", text: "로그인" });
    const cancel = el("button", { type: "button", class: "dta-btn", text: "취소" });
    const form = el("form", {}, [field("비밀번호", pw), error, el("div", { class: "dta-footer" }, [cancel, submit])]);
    const modal = openModal("탐지기 관리자 로그인", form, { onRequestClose(close) { close(); clearHash(); } });
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

  let active = false;
  function enterAdmin() {
    active = true;
    if (document.querySelector(".dta-toolbar")) return;
    const anchor = document.getElementById("detectorGrid");
    anchor?.parentNode.insertBefore(el("div", { class: "dta-toolbar" }, [
      el("span", { text: "관리자 모드", style: { fontSize: "12px", color: "#888", marginRight: "auto" } }),
      el("button", { type: "button", class: "dta-btn dta-primary", text: "탐지기·상자 관리", onclick: openManager }),
      el("button", { type: "button", class: "dta-btn", text: "관리 종료", onclick: () => exitAdmin() }),
    ]), anchor);
  }
  function exitAdmin(isExpired) {
    active = false;
    clearToken();
    document.querySelector(".dta-toolbar")?.remove();
    if (isExpired === true) alert("관리자 로그인이 만료되었습니다. 다시 로그인하려면 주소 끝에 #admin 을 붙여 접속하세요.");
  }

  // ---------- 최신 데이터 ----------
  let latest = null; // 서버에서 받은 detector.json 전체
  async function loadLatest() {
    const res = await request(API, "GET");
    latest = res.data;
    return latest;
  }
  const kindOf = (entry) => (entry && Object.prototype.hasOwnProperty.call(entry, MONSTERS) ? "detector" : "box");
  function allMaps() {
    const s = new Set();
    Object.values(latest || {}).forEach((e) => Object.values(e[MONSTERS] || {}).forEach((m) => m.map && s.add(m.map)));
    return [...s].sort((a, b) => a.localeCompare(b, "ko"));
  }
  function allItemNames() {
    const s = new Set();
    Object.entries(latest || {}).forEach(([name, e]) => {
      if (kindOf(e) === "box") s.add(name);
      Object.values(e[MONSTERS] || {}).forEach((m) => (m.item || []).forEach((it) => s.add(it.split(",").slice(0, -2).join(",").trim())));
    });
    return [...s].filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
  }
  function allBoxItemNames() {
    const s = new Set();
    Object.values(latest || {}).forEach((e) => Object.keys(e.items || {}).forEach((k) => s.add(k)));
    return [...s].sort((a, b) => a.localeCompare(b, "ko"));
  }

  /** 항목 저장 공통. 성공하면 서버의 최신 항목을 돌려줌 */
  async function saveEntry({ originalName, name, entry, base, icon, maps }) {
    const res = await request(API, "POST", { action: "save", originalName: originalName || null, name, entry, base, icon, maps });
    if (latest) {
      const next = {};
      for (const [k, v] of Object.entries(latest)) next[k === originalName ? name : k] = k === originalName ? res.entry : v;
      if (!originalName) next[name] = res.entry;
      latest = next;
    }
    window.DSRDetector?.reload().catch(() => {});
    return res.entry;
  }

  // ======================================================================
  // 목록 관리
  // ======================================================================
  async function openManager() {
    const detList = el("div", { class: "dta-list" }, el("div", { class: "dta-empty", text: "불러오는 중..." }));
    const boxList = el("div", { class: "dta-list" });
    const body = el("div", {}, [
      el("div", { class: "dta-toolbar", style: { justifyContent: "flex-start" } }, [
        el("button", { type: "button", class: "dta-btn dta-primary", text: "+ 탐지기 추가", onclick: () => openEntryEditor(null, "detector", render) }),
        el("button", { type: "button", class: "dta-btn dta-primary", text: "+ 상자·꾸러미 추가", onclick: () => openEntryEditor(null, "box", render) }),
      ]),
      el("h3", { text: "탐지기" }), detList,
      el("h3", { text: "상자 · 꾸러미 (구성품)" }), boxList,
      el("div", { class: "dta-footer" }, [el("button", { type: "button", class: "dta-btn", text: "닫기", onclick: () => modal.close() })]),
    ]);
    const modal = openModal("탐지기 · 상자 관리", body, { wide: true });

    function render() {
      detList.replaceChildren();
      boxList.replaceChildren();
      Object.entries(latest).forEach(([name, entry]) => {
        const isDet = kindOf(entry) === "detector";
        const sub = isDet
          ? `악역 디지몬 ${Object.keys(entry[MONSTERS]).length}마리 · ${Object.keys(entry[MONSTERS]).join(", ")}`
          : `구성품 ${Object.keys(entry.items || {}).length}개`;
        (isDet ? detList : boxList).appendChild(el("div", { class: "dta-row" }, [
          thumb(iconUrl(name)),
          el("div", { class: "dta-row-main" }, [el("div", { class: "dta-row-title", text: name }), el("div", { class: "dta-row-sub", text: sub })]),
          el("button", { type: "button", class: "dta-btn", text: "편집", onclick: () => openEntryEditor(name, null, render) }),
          el("button", { type: "button", class: "dta-btn dta-danger", text: "삭제", onclick: () => removeEntry(name, render) }),
        ]));
      });
      if (!detList.children.length) detList.appendChild(el("div", { class: "dta-empty", text: "탐지기가 없습니다." }));
      if (!boxList.children.length) boxList.appendChild(el("div", { class: "dta-empty", text: "상자가 없습니다." }));
    }
    try {
      await loadLatest();
      render();
    } catch (err) {
      if (!expired(err)) detList.replaceChildren(el("div", { class: "dta-empty", text: `불러오지 못했습니다: ${err.message}` }));
    }
  }

  async function removeEntry(name, after) {
    if (!confirm(`"${name}" 항목을 통째로 삭제할까요?\n(저장 전 detector.json은 백업됩니다)`)) return;
    try {
      await request(API, "POST", { action: "delete", name, base: latest[name] });
      delete latest[name];
      window.DSRDetector?.reload().catch(() => {});
      after();
    } catch (err) {
      if (!expired(err)) alert(err.message);
    }
  }

  // ======================================================================
  // 탐지기 / 상자 편집
  // ======================================================================
  function openEntryEditor(originalName, newKind, onChanged) {
    let base = originalName ? clone(latest[originalName]) : null; // 서버에 저장된 상태
    const kind = base ? kindOf(base) : newKind;
    const draft = base ? clone(base) : kind === "detector" ? { [MONSTERS]: {} } : { items: {} };
    let currentName = originalName;

    const name = input(originalName || "", { maxlength: "60", placeholder: kind === "detector" ? "예) 알파몬 탐지기" : "예) 심연의 악마 꾸러미" });
    const iconBox = thumb(originalName ? iconUrl(originalName) : null);
    iconBox.style.width = iconBox.style.height = "48px";
    let iconData = null;
    const iconInfo = el("span", { class: "dta-hint", text: originalName ? "현재 아이콘" : "아이콘 없음", style: { margin: "0 0 0 6px" } });
    const iconPick = filePicker("아이콘 선택", 256, (dataUrl, info) => {
      iconData = dataUrl;
      iconBox.style.backgroundImage = `url("${dataUrl}")`;
      iconInfo.textContent = `새 아이콘 ${info} (저장 시 업로드)`;
    });

    const error = el("p", { class: "dta-error" });
    const save = el("button", { type: "submit", class: "dta-btn dta-primary", text: originalName ? "저장" : "추가" });
    const cancel = el("button", { type: "button", class: "dta-btn", text: "닫기" });
    const sections = [];
    let readExtra = () => ({});

    // ----- 탐지기: 악역 디지몬 목록 + 획득 방법 / 드롭 안내 -----
    const monsterList = el("div", { class: "dta-list" });
    function renderMonsters() {
      monsterList.replaceChildren();
      const monsters = draft[MONSTERS] || {};
      Object.entries(monsters).forEach(([mName, m]) => {
        monsterList.appendChild(el("div", { class: "dta-row" }, [
          thumb(digimonImage(mName)),
          el("div", { class: "dta-row-main" }, [
            el("div", { class: "dta-row-title", text: mName }),
            el("div", { class: "dta-row-sub", text: `${m.map} · Lv.${m.level} · HP ${Number.isFinite(Number(m.HP)) ? Number(m.HP).toLocaleString() : m.HP} · 드롭 ${(m.item || []).length}개${m.coordinates && String(m.coordinates.x).trim() !== "" ? ` · 위치 (${m.coordinates.x}, ${m.coordinates.y})` : " · 위치 없음"}` }),
          ]),
          el("button", { type: "button", class: "dta-btn dta-primary", text: "수정 · 맵 위치", onclick: () => openMonsterEditor(mName) }),
          el("button", { type: "button", class: "dta-btn dta-danger", text: "삭제", onclick: () => removeMonster(mName) }),
        ]));
      });
      if (!monsterList.children.length) monsterList.appendChild(el("div", { class: "dta-empty", text: "악역 디지몬이 없습니다." }));
    }

    if (kind === "detector") {
      const acquisition = el("textarea", { placeholder: "비워두면 표시하지 않습니다." });
      acquisition.value = draft.acquisition || "";
      const notes = el("textarea", { placeholder: "한 줄에 하나씩. 비워두면 표시하지 않습니다." });
      notes.value = (draft.rewardNotes || []).join("\n");
      readExtra = () => ({ acquisition: acquisition.value.trim() || undefined, rewardNotes: notes.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) });
      sections.push(
        el("h3", { text: "악역 디지몬" }),
        el("div", { class: "dta-toolbar", style: { justifyContent: "flex-start" } }, [
          el("button", { type: "button", class: "dta-btn dta-primary", text: "+ 디지몬 추가 (맵 위치 포함)", onclick: () => openMonsterEditor(null) }),
          el("span", { class: "dta-hint", text: "맵 위치는 각 디지몬의 \"수정 · 맵 위치\" 창에서 맵을 클릭해 찍습니다. 그 창에서 저장하면 바로 반영됩니다.", style: { margin: "0" } }),
        ]),
        monsterList,
        el("h3", { text: "추가 정보 (선택)" }),
        el("div", { class: "dta-grid dta-g2" }, [field("획득 방법", acquisition), field("드롭 안내 문구", notes)]),
      );
      renderMonsters();
    }

    // ----- 상자: 구성품 목록 -----
    const itemRows = el("div", { class: "dta-items" });
    const boxNames = datalist(allBoxItemNames());
    function addBoxItem(itemName = "", trade = "거래불가") {
      const t = thumb(itemName ? itemImage(itemName) : null);
      const n = input(itemName, { maxlength: "80", placeholder: "예) 포텐셜 조각x 1", list: boxNames.id });
      n.addEventListener("input", () => { t.style.backgroundImage = n.value.trim() ? `url("${itemImage(n.value)}")` : ""; });
      const s = select(trade, TRADE);
      const row = el("div", { class: "dta-item dta-box" }, [t, n, s,
        el("button", { type: "button", class: "dta-remove", title: "삭제", "aria-label": "삭제", text: "×", onclick: () => row.remove() })]);
      itemRows.appendChild(row);
      return n;
    }
    if (kind === "box") {
      Object.entries(draft.items || {}).forEach(([k, v]) => addBoxItem(k, v.tradeStatus));
      if (!itemRows.children.length) addBoxItem();
      const bulk = el("textarea", { placeholder: "한 줄에 하나씩: 이름,거래가능|거래불가\n예) 제로유니트x 1,거래불가" });
      const bulkBox = el("div", { hidden: true }, [bulk,
        el("div", { class: "dta-toolbar", style: { justifyContent: "flex-end", margin: "6px 0 0" } }, [
          el("button", { type: "button", class: "dta-btn", text: "목록에 추가", onclick: () => {
            const lines = bulk.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            if (!lines.length) return;
            [...itemRows.children].forEach((r) => { if (!r.querySelector("input").value.trim()) r.remove(); });
            lines.forEach((l) => {
              const parts = l.split(",");
              const trade = TRADE.includes(parts.at(-1)?.trim()) ? parts.pop().trim() : "거래불가";
              addBoxItem(parts.join(",").trim(), trade);
            });
            bulk.value = "";
            bulkBox.hidden = true;
          } }),
        ])]);
      sections.push(
        el("h3", { text: "구성품" }),
        boxNames.node,
        itemRows,
        el("div", { class: "dta-toolbar", style: { justifyContent: "flex-start", margin: "8px 0 0" } }, [
          el("button", { type: "button", class: "dta-btn", text: "+ 구성품 추가", onclick: () => addBoxItem().focus() }),
          el("button", { type: "button", class: "dta-btn", text: "한꺼번에 입력", onclick: () => { bulkBox.hidden = !bulkBox.hidden; if (!bulkBox.hidden) bulk.focus(); } }),
        ]),
        bulkBox,
        el("p", { class: "dta-hint", text: "개수는 이름 끝에 \"x 개수\"로 적습니다 (기존 데이터와 같은 형식). 이 상자를 드롭하는 디지몬이 있으면 탐지기 페이지에서 \"구성품 확인\"으로 보입니다." }),
      );
    }

    function readEntry() {
      const entry = clone(draft);
      if (kind === "detector") {
        const extra = readExtra();
        if (extra.acquisition) entry.acquisition = extra.acquisition; else delete entry.acquisition;
        if (extra.rewardNotes.length) entry.rewardNotes = extra.rewardNotes; else delete entry.rewardNotes;
      } else {
        const items = {};
        [...itemRows.children].forEach((r) => {
          const n = r.querySelector("input").value.trim();
          if (!n) return;
          const prev = draft.items?.[n] || {};
          items[n] = { ...prev, tradeStatus: r.querySelector("select").value };
        });
        entry.items = items;
      }
      return entry;
    }

    const form = el("form", { novalidate: true }, [
      el("div", { class: "dta-grid dta-g2" }, [
        field(kind === "detector" ? "탐지기 이름" : "상자·꾸러미 이름", name,
          kind === "box" ? "디지몬 드롭 아이템 이름과 똑같아야 \"구성품 확인\"이 연결됩니다." : null),
        field("아이콘", el("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, [iconBox, iconPick, iconInfo]),
          "저장 위치: dsrwiki/item/[이름].webp"),
      ]),
      ...sections,
      error,
      el("div", { class: "dta-footer" }, [el("span", { class: "dta-spacer" }), cancel, save]),
    ]);

    let initial = JSON.stringify([name.value, readEntry()]);
    let saving = false;
    const modal = openModal(originalName ? `편집 — ${originalName}` : kind === "detector" ? "탐지기 추가" : "상자·꾸러미 추가", form, {
      wide: true,
      onRequestClose(close) {
        if (saving) return;
        if ((JSON.stringify([name.value, readEntry()]) !== initial || iconData) && !confirm("저장하지 않은 변경 내용이 있습니다. 닫을까요?")) return;
        close();
      },
    });
    cancel.addEventListener("click", () => modal.tryClose());

    /** 서버에 항목 전체 저장 (디지몬 수정 창도 이 함수를 사용) */
    async function commit(entry, { maps } = {}) {
      const n = name.value.trim();
      if (!n) throw new Error(kind === "detector" ? "탐지기 이름을 먼저 입력해주세요." : "상자 이름을 먼저 입력해주세요.");
      if (n !== currentName && latest && Object.prototype.hasOwnProperty.call(latest, n)) throw new Error(`"${n}" 항목이 이미 있습니다.`);
      const saved = await saveEntry({ originalName: currentName, name: n, entry, base, icon: iconData, maps });
      base = clone(saved);
      Object.keys(draft).forEach((k) => delete draft[k]);
      Object.assign(draft, clone(saved));
      currentName = n;
      iconData = null;
      iconInfo.textContent = "현재 아이콘";
      modal.heading.textContent = `편집 — ${n}`;
      save.textContent = "저장";
      initial = JSON.stringify([name.value, readEntry()]);
      if (kind === "detector") renderMonsters();
      onChanged?.();
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (kind === "box" && ![...itemRows.children].some((r) => r.querySelector("input").value.trim())) {
        error.textContent = "구성품을 하나 이상 입력해주세요.";
        return;
      }
      saving = true;
      save.disabled = cancel.disabled = true;
      error.textContent = "";
      try {
        await commit(readEntry());
        modal.close();
      } catch (err) {
        if (!expired(err)) error.textContent = err.message;
      } finally {
        saving = false;
        save.disabled = cancel.disabled = false;
      }
    });

    async function removeMonster(mName) {
      if (!confirm(`"${mName}"을(를) 이 탐지기에서 삭제할까요?`)) return;
      const entry = readEntry();
      delete entry[MONSTERS][mName];
      try {
        await commit(entry);
      } catch (err) {
        if (!expired(err)) alert(err.message);
      }
    }

    // ----- 악역 디지몬 편집 (맵 위치 찍기) -----
    function openMonsterEditor(originalMonster) {
      const m = originalMonster ? clone(draft[MONSTERS][originalMonster]) : { map: "", level: 1, HP: 0, item: [] };
      const digimonNames = datalist(Object.keys(window.DSRDetector?.digimon || {}).sort((a, b) => a.localeCompare(b, "ko")));
      const mapNames = datalist(allMaps());
      const itemNames = datalist(allItemNames());

      const mName = input(originalMonster || "", { maxlength: "40", list: digimonNames.id, placeholder: "예) 오메가몬" });
      const evol = input(m.evol || "", { maxlength: "20", placeholder: "보통 비움" });
      const map = input(m.map || "", { maxlength: "30", list: mapNames.id, placeholder: "예) 어둠성 계곡" });
      const level = input(String(m.level ?? ""), { maxlength: "6", inputmode: "numeric", placeholder: "숫자 또는 ?" });
      const hp = input(String(m.HP ?? ""), { maxlength: "12", inputmode: "numeric", placeholder: "숫자 또는 ?" });
      const gimmick = el("textarea", { placeholder: "예) 첫 피격 시 특정 확률로 크레니엄몬으로 진화 (없으면 비움)" });
      gimmick.value = m.gimmick || "";

      // 맵 + 핀
      const blank = (v) => v === null || v === undefined || String(v).trim() === "";
      let coords = m.coordinates && !blank(m.coordinates.x) && !blank(m.coordinates.y) ? { x: Number(m.coordinates.x), y: Number(m.coordinates.y) } : null;
      const mapImg = el("img", { class: "dta-map-img", alt: "맵" });
      const missing = el("div", { class: "dta-map-missing", text: "맵 이름을 입력하면 맵 이미지가 나옵니다." });
      const pinImg = el("img", { alt: "" });
      const pin = el("div", { class: "dta-pin", title: "드래그해서 옮길 수 있습니다" }, pinImg);
      const mapBox = el("div", { class: "dta-map" }, [mapImg, missing, pin]);
      const xIn = el("input", { type: "number", min: "0", max: String(COORD_BASE), step: "1" });
      const yIn = el("input", { type: "number", min: "0", max: String(COORD_BASE), step: "1" });
      let newMapData = null;
      const mapUpload = filePicker("맵 이미지 올리기", 700, (dataUrl, info) => {
        newMapData = dataUrl;
        mapImg.src = dataUrl;
        mapImg.hidden = false;
        missing.hidden = true;
        mapUploadInfo.textContent = `새 맵 이미지 ${info} (저장 시 dsrwiki/map/${mapFile(map.value, currentName, mName.value)}.webp 로 업로드)`;
      });
      const mapUploadInfo = el("p", { class: "dta-hint", text: "맵 이미지가 없거나 바뀌었을 때만 올리세요. 기존 맵은 700×700입니다." });

      const refreshMap = () => {
        if (newMapData) return;
        const file = mapFile(map.value, currentName, mName.value.trim());
        if (!file) { mapImg.hidden = true; missing.hidden = false; missing.textContent = "맵 이름을 입력하면 맵 이미지가 나옵니다."; return; }
        mapImg.hidden = false;
        missing.hidden = true;
        mapImg.onerror = () => { mapImg.hidden = true; missing.hidden = false; missing.textContent = `맵 이미지가 없습니다 (map/${file}.webp). 아래에서 올릴 수 있습니다.`; };
        mapImg.src = mapUrl(map.value, currentName, mName.value.trim());
      };
      const refreshPin = () => {
        pinImg.src = mName.value.trim() ? digimonImage(mName.value.trim()) : "";
        if (!coords) { pin.hidden = true; xIn.value = ""; yIn.value = ""; return; }
        pin.hidden = false;
        pin.style.left = `${(coords.x / COORD_BASE) * 100}%`;
        pin.style.top = `${(coords.y / COORD_BASE) * 100}%`;
        xIn.value = coords.x;
        yIn.value = coords.y;
      };
      const pointToCoords = (evt) => {
        const r = mapBox.getBoundingClientRect();
        const clamp = (v) => Math.max(0, Math.min(COORD_BASE, Math.round(v)));
        return { x: clamp(((evt.clientX - r.left) / r.width) * COORD_BASE), y: clamp(((evt.clientY - r.top) / r.height) * COORD_BASE) };
      };
      let dragging = false;
      mapBox.addEventListener("pointerdown", (evt) => {
        if (evt.button !== 0) return;
        evt.preventDefault();
        dragging = true;
        try { mapBox.setPointerCapture(evt.pointerId); } catch (e) { /* 일부 환경에서는 지원 안 함 */ }
        coords = pointToCoords(evt);
        refreshPin();
      });
      mapBox.addEventListener("pointermove", (evt) => { if (dragging) { coords = pointToCoords(evt); refreshPin(); } });
      const stop = () => { dragging = false; };
      mapBox.addEventListener("pointerup", stop);
      mapBox.addEventListener("pointercancel", stop);
      [xIn, yIn].forEach((inp) => inp.addEventListener("input", () => {
        if (xIn.value === "" || yIn.value === "") return;
        const clamp = (v) => Math.max(0, Math.min(COORD_BASE, Math.round(Number(v) || 0)));
        coords = { x: clamp(xIn.value), y: clamp(yIn.value) };
        refreshPin();
      }));
      map.addEventListener("input", () => { newMapData = null; mapUploadInfo.textContent = "맵 이미지가 없거나 바뀌었을 때만 올리세요. 기존 맵은 700×700입니다."; refreshMap(); });
      mName.addEventListener("input", () => { refreshPin(); refreshMap(); });
      refreshMap();
      refreshPin();

      // 드롭 아이템
      const drops = el("div", { class: "dta-items" });
      function addDrop(raw = ",거래불가,확률") {
        const parts = raw.split(",");
        const dropType = parts.pop();
        const trade = parts.pop();
        const itemName = parts.join(",").trim();
        const t = thumb(itemName ? itemImage(itemName) : null);
        const n = input(itemName, { maxlength: "60", list: itemNames.id, placeholder: "아이템 이름" });
        n.addEventListener("input", () => { t.style.backgroundImage = n.value.trim() ? `url("${itemImage(n.value)}")` : ""; });
        const row = el("div", { class: "dta-item" }, [t, n, select(trade?.trim(), TRADE), select(dropType?.trim(), DROP),
          el("button", { type: "button", class: "dta-remove", title: "삭제", "aria-label": "삭제", text: "×", onclick: () => row.remove() })]);
        drops.appendChild(row);
        return n;
      }
      (m.item?.length ? m.item : []).forEach((it) => addDrop(it));
      if (!drops.children.length) addDrop();
      const bulk = el("textarea", { placeholder: "한 줄에 하나씩: 이름,거래가능|거래불가,확정|확률\n예) 성숙기 스킬 강화석,거래가능,확정" });
      const bulkBox = el("div", { hidden: true }, [bulk,
        el("div", { class: "dta-toolbar", style: { justifyContent: "flex-end", margin: "6px 0 0" } }, [
          el("button", { type: "button", class: "dta-btn", text: "목록에 추가", onclick: () => {
            const lines = bulk.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            if (!lines.length) return;
            [...drops.children].forEach((r) => { if (!r.querySelector("input").value.trim()) r.remove(); });
            lines.forEach((l) => {
              const parts = l.split(",").map((p) => p.trim());
              const drop = DROP.includes(parts.at(-1)) ? parts.pop() : "확률";
              const trade = TRADE.includes(parts.at(-1)) ? parts.pop() : "거래불가";
              addDrop(`${parts.join(",")},${trade},${drop}`);
            });
            bulk.value = "";
            bulkBox.hidden = true;
          } }),
        ])]);

      const readMonster = () => {
        const out = clone(m);
        out.map = map.value.trim();
        const numOrUnknown = (v) => { const t = v.trim(); return t === "?" ? "?" : /^\d+$/.test(t) ? Number(t) : t; };
        out.level = numOrUnknown(level.value);
        out.HP = numOrUnknown(hp.value);
        out.item = [...drops.children].map((r) => {
          const n = r.querySelector("input").value.trim();
          const [trade, drop] = [...r.querySelectorAll("select")].map((s) => s.value);
          return n ? `${n},${trade},${drop}` : null;
        }).filter(Boolean);
        if (coords) out.coordinates = { x: coords.x, y: coords.y };
        else if (m.coordinates && blank(m.coordinates.x) && blank(m.coordinates.y)) out.coordinates = m.coordinates; // 원래도 "위치 없음"
        else delete out.coordinates;
        if (gimmick.value.trim()) out.gimmick = gimmick.value.trim(); else delete out.gimmick;
        if (evol.value.trim()) out.evol = evol.value.trim(); else delete out.evol;
        return out;
      };

      const err = el("p", { class: "dta-error" });
      const mSave = el("button", { type: "submit", class: "dta-btn dta-primary", text: "저장" });
      const mCancel = el("button", { type: "button", class: "dta-btn", text: "취소" });
      const mForm = el("form", { novalidate: true }, [
        digimonNames.node, mapNames.node, itemNames.node,
        el("div", { class: "dta-map-layout" }, [
          el("div", {}, [
            field("맵 위치 — 맵을 클릭하면 핀이 찍히고, 드래그로 옮길 수 있습니다", mapBox),
            el("div", { class: "dta-coords" }, ["x", xIn, "y", yIn, `(0~${COORD_BASE} 기준)`,
              el("button", { type: "button", class: "dta-btn", text: "위치 지우기", onclick: () => { coords = null; refreshPin(); } })]),
            el("div", { class: "dta-coords" }, [mapUpload]),
            mapUploadInfo,
          ]),
          el("div", {}, [
            el("div", { class: "dta-grid dta-g2" }, [field("디지몬 이름", mName), field("맵", map), field("레벨", level), field("HP", hp)]),
            field("진화 단계 (선택)", evol),
            field("패턴 설명 (선택)", gimmick),
          ]),
        ]),
        el("h3", { text: "드롭 아이템" }),
        drops,
        el("div", { class: "dta-toolbar", style: { justifyContent: "flex-start", margin: "8px 0 0" } }, [
          el("button", { type: "button", class: "dta-btn", text: "+ 아이템 추가", onclick: () => addDrop().focus() }),
          el("button", { type: "button", class: "dta-btn", text: "한꺼번에 입력", onclick: () => { bulkBox.hidden = !bulkBox.hidden; if (!bulkBox.hidden) bulk.focus(); } }),
        ]),
        bulkBox,
        err,
        el("div", { class: "dta-footer" }, [mCancel, mSave]),
      ]);

      const mInitial = JSON.stringify([mName.value, readMonster()]);
      let mSaving = false;
      const mModal = openModal(originalMonster ? `악역 디지몬 수정 — ${originalMonster}` : "악역 디지몬 추가", mForm, {
        wide: true,
        onRequestClose(close) {
          if (mSaving) return;
          if ((JSON.stringify([mName.value, readMonster()]) !== mInitial || newMapData) && !confirm("저장하지 않은 변경 내용이 있습니다. 닫을까요?")) return;
          close();
        },
      });
      mCancel.addEventListener("click", () => mModal.tryClose());

      mForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const n = mName.value.trim();
        const data = readMonster();
        const problem = !n ? "디지몬 이름을 입력해주세요."
          : n !== originalMonster && draft[MONSTERS][n] ? `"${n}"은(는) 이미 이 탐지기에 있습니다.`
          : !data.map ? "맵을 입력해주세요."
          : !(data.level === "?" || Number.isInteger(data.level)) ? "레벨은 숫자 또는 ? 로 입력해주세요."
          : !(data.HP === "?" || Number.isInteger(data.HP)) ? "HP는 숫자 또는 ? 로 입력해주세요."
          : null;
        if (problem) { err.textContent = problem; return; }
        if (!coords && !confirm("맵 위치를 찍지 않았습니다. 위치 없이 저장할까요? (페이지에서 마커가 보이지 않습니다)")) return;

        // 기존 순서 유지 (이름 변경 시 같은 자리, 새 디지몬은 맨 뒤)
        const entry = readEntry();
        const monsters = {};
        for (const [k, v] of Object.entries(entry[MONSTERS])) monsters[k === originalMonster ? n : k] = k === originalMonster ? data : v;
        if (!originalMonster) monsters[n] = data;
        entry[MONSTERS] = monsters;

        mSaving = true;
        mSave.disabled = mCancel.disabled = true;
        mSave.textContent = "저장 중...";
        err.textContent = "";
        try {
          await commit(entry, { maps: newMapData ? { [mapFile(data.map, currentName, n)]: newMapData } : undefined });
          mModal.close();
        } catch (e2) {
          if (!expired(e2)) err.textContent = e2.message;
        } finally {
          mSaving = false;
          mSave.disabled = mCancel.disabled = false;
          mSave.textContent = "저장";
        }
      });
      setTimeout(() => (originalMonster ? map : mName).focus(), 0);
    }
  }

  // ---------- 시작 ----------
  function open() {
    if (active) return clearHash();
    if (getToken()) { clearHash(); enterAdmin(); } else if (location.hash === "#admin" || location.hash === "#coupon-admin") showLogin();
  }
  window.DSRDetectorAdmin = { open };
  if (document.getElementById("detectorGrid")) open();
  else document.addEventListener("DOMContentLoaded", open);
})();
