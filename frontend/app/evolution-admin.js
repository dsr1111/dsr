// 진화 페이지 관리자 도구 — 디지몬 하나 단위로 진화 대상/확률/재료/조건/조그레스를 편집.
// dsrwiki.com/evolution#admin 으로 들어오면 불러와집니다. 로그인은 메인 페이지 관리자와 같습니다.
//
// 화면은 진화 갈래를 "목록"으로 다룹니다(암흑/특수/버스트/조그레스도 여러 개 추가 가능한 구조).
// 다만 지금 CSV 형식은 이 네 가지를 디지몬마다 1개씩만 담을 수 있어서, 2개 이상이면 저장 전에 알려줍니다.
(function () {
  if (window.DSREvolutionAdmin) return;

  const LOGIN_API = "/.netlify/functions/site-admin";
  const API = "/.netlify/functions/evolution-admin";
  const TOKEN_KEY = "dsrCouponAdminToken";
  const MEDIA = "https://media.dsrwiki.com/dsrwiki/";
  const STAGES = [["1", "유년기1"], ["2", "유년기2"], ["3", "성장기"], ["4", "성숙기"], ["5", "완전체"], ["6", "궁극체"]];
  const stageName = (s) => (STAGES.find(([v]) => v === String(s)) || [null, `단계 ${s}`])[1];
  // 진화 갈래 종류: evolution.csv 칸 / condition.csv 진화타입·재료 칸
  const KINDS = [
    { key: "암흑진화", label: "암흑 진화", pct: "percent13", mat: "암흑진화재료", condMat: "암흑진화재료" },
    { key: "특수진화", label: "특수 진화", pct: "percent14", mat: "특수진화재료", condMat: "특수진화재료" },
    { key: "버스트진화", label: "버스트 진화", pct: "percent15", mat: "버스트진화재료", condMat: "버스트진화재료" },
  ];
  const STATS = [["힘", "힘%"], ["지능", "지능%"], ["수비", "수비%"], ["저항", "저항%"], ["속도", "속도%"]];
  const JOG_STATS = [["str", "힘"], ["int", "지능"], ["def", "수비"], ["res", "저항"], ["spd", "속도"]];
  const MAX_NORMAL = 11;

  // ---------- 스타일 ----------
  const style = document.createElement("style");
  style.textContent = `
    .eva-toolbar { display: flex; gap: 6px; justify-content: flex-end; align-items: center; margin: 0 0 10px; flex-wrap: wrap; }
    .eva-btn { font: inherit; font-size: 12px; line-height: 1.2; padding: 5px 9px; border-radius: 5px; border: 1px solid #c0c0c0; background: #fff; color: #2c3e50; cursor: pointer; }
    .eva-btn:hover { background: #e8ebef; }
    .eva-btn:disabled { opacity: .5; cursor: default; }
    .eva-btn.eva-primary { background: #2c3e50; border-color: #2c3e50; color: #fff; }
    .eva-btn.eva-primary:hover { background: #1d2a36; }
    .eva-btn.eva-danger { color: #c0392b; border-color: #e3b5b0; }
    .eva-overlay { position: fixed; inset: 0; background: rgba(15,20,30,.55); z-index: 3000; display: flex; align-items: flex-start; justify-content: center;
      padding: 30px 16px; overflow-y: auto; box-sizing: border-box; }
    .eva-modal { background: #fff; color: #222; width: 100%; max-width: 420px; border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.3);
      padding: 18px 18px 16px; box-sizing: border-box; text-align: left; font-size: 14px; }
    .eva-modal.eva-wide { max-width: 880px; }
    .eva-modal [hidden] { display: none !important; }
    .eva-modal h2 { margin: 0 0 14px; font-size: 17px; }
    .eva-modal h3 { margin: 0; font-size: 14px; color: #2c3e50; }
    .eva-field { min-width: 0; }
    .eva-label { display: block; margin: 0 0 3px; font-size: 12px; font-weight: bold; color: #555; }
    .eva-modal input[type="text"], .eva-modal input[type="password"], .eva-modal select {
      width: 100%; box-sizing: border-box; margin: 0; padding: 6px 7px; font: inherit; font-size: 13px; border: 1px solid #ccc; border-radius: 5px; background: #fff; color: #222; }
    .eva-grid { display: grid; gap: 8px 10px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .eva-grid.eva-g2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .eva-grid.eva-g3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .eva-hint { font-size: 12px; color: #888; margin: 4px 0 0; }
    .eva-warn { font-size: 12px; color: #d35400; margin: 4px 0 0; }
    .eva-error { color: #c0392b; font-size: 13px; margin: 10px 0 0; min-height: 1em; white-space: pre-line; }
    .eva-footer { display: flex; justify-content: flex-end; gap: 6px; margin-top: 14px; align-items: center; }
    .eva-footer .eva-btn { font-size: 13px; padding: 7px 14px; }
    .eva-spacer { flex: 1; }
    .eva-card { border: 1px solid #e3e3e3; border-radius: 8px; padding: 10px 12px; margin-top: 12px; background: #fafbfc; }
    .eva-card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .eva-card-head .eva-spacer { flex: 1; }
    .eva-sub { border-top: 1px dashed #dde2e8; margin-top: 8px; padding-top: 8px; }
    .eva-sub > b { display: block; font-size: 12px; color: #555; margin-bottom: 6px; }
    .eva-targets { display: flex; flex-direction: column; gap: 6px; }
    .eva-target { display: grid; grid-template-columns: 34px minmax(0, 1fr) 90px 28px; gap: 6px; align-items: center; }
    .eva-thumb { width: 34px; height: 34px; border-radius: 6px; background: #0b0e1a center / contain no-repeat; }
    .eva-remove { width: 28px; height: 28px; padding: 0; border: none; background: none; color: #999; font-size: 18px; cursor: pointer; border-radius: 4px; }
    .eva-remove:hover { background: #f2f2f2; color: #c0392b; }
    .eva-stat { display: grid; grid-template-columns: 1fr 56px; gap: 4px; }
    .eva-list { border: 1px solid #e3e3e3; border-radius: 8px; max-height: 60vh; overflow-y: auto; }
    .eva-row { display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-top: 1px solid #eee; cursor: pointer; background: none; border-left: 0; border-right: 0; border-bottom: 0; width: 100%; text-align: left; font: inherit; color: inherit; }
    .eva-row:first-child { border-top: none; }
    .eva-row:hover { background: #f6f8fa; }
    .eva-row-main { flex: 1; min-width: 0; }
    .eva-row-title { font-weight: bold; }
    .eva-row-sub { font-size: 12px; color: #777; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .eva-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .eva-chip { font: inherit; font-size: 12px; padding: 2px 8px; border-radius: 999px; border: 1px solid #d5dae1; background: #fff; cursor: pointer; }
    .eva-chip:hover { background: #eef1f5; }
    .eva-sum { font-size: 12px; color: #555; margin-left: auto; }
    .eva-sum.bad { color: #d35400; font-weight: bold; }
    @media (max-width: 680px) {
      .eva-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .eva-grid.eva-g3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
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
  const field = (label, control, hint) => el("div", { class: "eva-field" }, [el("span", { class: "eva-label", text: label }), control, hint ? el("p", { class: "eva-hint", text: hint }) : null]);
  const input = (value, attrs = {}) => el("input", { type: "text", value: value ?? "", ...attrs });
  const numInput = (value, placeholder = "") => input(value, { inputmode: "decimal", placeholder });
  const folder = (n) => (n === "폼몬" ? "포무몬" : String(n)).replace(/:/g, "_");
  const digiImg = (n) => `${MEDIA}digimon/${folder(n)}/${folder(n)}.webp`;
  const thumb = (name) => { const t = el("div", { class: "eva-thumb" }); if (name) t.style.backgroundImage = `url("${digiImg(name)}")`; return t; };

  const modalStack = [];
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modalStack.length) modalStack[modalStack.length - 1].tryClose(); });
  function openModal(title, body, { onRequestClose, wide } = {}) {
    const heading = el("h2", { text: title });
    const modal = el("div", { class: `eva-modal${wide ? " eva-wide" : ""}`, role: "dialog", "aria-modal": "true", "aria-label": title }, [heading, body]);
    const overlay = el("div", { class: "eva-overlay" }, modal);
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
    try { sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token: data.token, expiresAt: Date.now() + ttl - 60 * 1000 })); } catch (e) { /* 무시 */ }
  }
  function clearToken() { try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* 무시 */ } }
  async function request(url, method, body) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let res;
    try { res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" }); } catch (e) {
      throw Object.assign(new Error("서버에 연결하지 못했습니다."), { status: 0 });
    }
    let json = {};
    try { json = await res.json(); } catch (e) { /* 무시 */ }
    if (!res.ok) {
      if (res.status === 401 && body?.action !== "login") clearToken();
      throw Object.assign(new Error(json.error || "요청을 처리하지 못했습니다."), { status: res.status });
    }
    return json;
  }
  function expired(err) {
    if (err.status !== 401) return false;
    closeAllModals();
    exitAdmin(true);
    return true;
  }
  function clearHash() {
    if (location.hash === "#admin" || location.hash === "#coupon-admin") history.replaceState(null, "", location.pathname + location.search);
  }

  // ---------- CSV (진화 페이지와 같은 규칙) ----------
  function splitLine(line) {
    const out = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (ch === "," && !q) { out.push(cur); cur = ""; } else cur += ch;
    }
    out.push(cur);
    return out;
  }
  function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    const header = splitLine(lines[0]).map((h) => h.trim());
    const rows = lines.slice(1).map((l) => {
      const v = splitLine(l.trim());
      const o = {};
      header.forEach((h, i) => { const x = (v[i] ?? "").trim(); if (x !== "") o[h] = x; });
      return o;
    });
    return { header, rows };
  }

  // ---------- 로그인 / 관리 모드 ----------
  function showLogin() {
    const pw = el("input", { type: "password", autocomplete: "current-password", placeholder: "관리자 비밀번호" });
    const error = el("p", { class: "eva-error" });
    const submit = el("button", { type: "submit", class: "eva-btn eva-primary", text: "로그인" });
    const cancel = el("button", { type: "button", class: "eva-btn", text: "취소" });
    const form = el("form", {}, [field("비밀번호", pw), error, el("div", { class: "eva-footer" }, [cancel, submit])]);
    const modal = openModal("진화 관리자 로그인", form, { onRequestClose(close) { close(); clearHash(); } });
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
      } catch (err) { error.textContent = err.message; pw.select(); } finally { submit.disabled = false; }
    });
    setTimeout(() => pw.focus(), 0);
  }

  let active = false;
  function enterAdmin() {
    active = true;
    if (document.querySelector(".eva-toolbar")) return;
    const anchor = document.querySelector(".search-container");
    anchor?.parentNode.insertBefore(el("div", { class: "eva-toolbar" }, [
      el("span", { text: "관리자 모드", style: { fontSize: "12px", color: "#888", marginRight: "auto" } }),
      el("button", { type: "button", class: "eva-btn eva-primary", text: "진화 데이터 관리", onclick: openManager }),
      el("button", { type: "button", class: "eva-btn", text: "관리 종료", onclick: () => exitAdmin() }),
    ]), anchor);
  }
  function exitAdmin(isExpired) {
    active = false;
    clearToken();
    document.querySelector(".eva-toolbar")?.remove();
    if (isExpired === true) alert("관리자 로그인이 만료되었습니다. 다시 로그인하려면 주소 끝에 #admin 을 붙여 접속하세요.");
  }

  // ---------- 데이터 ----------
  let db = null; // { evolution: {header, rows}, condition: {...}, jogress: {...} }
  async function loadDb() {
    const res = await request(API, "GET");
    db = { evolution: parseCsv(res.files.evolution), condition: parseCsv(res.files.condition), jogress: parseCsv(res.files.jogress) };
    return db;
  }
  const evoOf = (name) => db.evolution.rows.find((r) => r.name === name) || null;
  const condsOf = (name) => db.condition.rows.filter((r) => r.name === name);
  const jogOf = (name) => db.jogress.rows.find((r) => r.name === name) || null;
  const REF_COLS = [...Array.from({ length: 11 }, (_, i) => `evol${i + 1}`), "조그레스", "암흑진화", "특수진화", "버스트진화"];
  /** 이 디지몬으로 진화해 오는 디지몬들 */
  const incomingOf = (name) => db.evolution.rows.filter((r) => r.name !== name && REF_COLS.some((c) => r[c] === name)).map((r) => r.name);
  const outSummary = (r) => {
    const parts = [];
    const normal = Array.from({ length: 11 }, (_, i) => r[`evol${i + 1}`]).filter(Boolean);
    if (normal.length) parts.push(normal.join(" · "));
    if (r["조그레스"]) parts.push(`조그레스 ${r["조그레스"]}`);
    KINDS.forEach((k) => { if (r[k.key]) parts.push(`${k.label} ${r[k.key]}`); });
    return parts.join(" / ") || "진화 없음";
  };

  // ======================================================================
  // 목록
  // ======================================================================
  async function openManager() {
    const search = input("", { placeholder: "디지몬 이름으로 찾기" });
    const stage = el("select", {}, [el("option", { value: "", text: "전체 단계" }), ...STAGES.map(([v, t]) => el("option", { value: v, text: t }))]);
    const list = el("div", { class: "eva-list" }, el("p", { class: "eva-hint", text: "불러오는 중...", style: { padding: "12px" } }));
    const body = el("div", {}, [
      el("div", { class: "eva-grid", style: { gridTemplateColumns: "1fr 140px auto" } }, [search, stage,
        el("button", { type: "button", class: "eva-btn eva-primary", text: "+ 디지몬 추가", onclick: () => openEditor(null, render) })]),
      el("div", { style: { height: "10px" } }),
      list,
      el("div", { class: "eva-footer" }, [el("button", { type: "button", class: "eva-btn", text: "닫기", onclick: () => modal.close() })]),
    ]);
    const modal = openModal("진화 데이터 관리", body, { wide: true });
    function render() {
      const q = search.value.trim();
      const rows = db.evolution.rows.filter((r) => (!q || r.name.includes(q)) && (!stage.value || r.evolution_stage === stage.value));
      list.replaceChildren(...rows.slice(0, 300).map((r) => el("button", { type: "button", class: "eva-row", onclick: () => openEditor(r.name, render) }, [
        thumb(r.name),
        el("div", { class: "eva-row-main" }, [
          el("div", { class: "eva-row-title", text: `${r.name} ` }, el("span", { text: stageName(r.evolution_stage), style: { fontWeight: "normal", color: "#888", fontSize: "12px" } })),
          el("div", { class: "eva-row-sub", text: outSummary(r) }),
        ]),
      ])));
      if (!rows.length) list.appendChild(el("p", { class: "eva-hint", text: "찾는 디지몬이 없습니다.", style: { padding: "12px" } }));
      else if (rows.length > 300) list.appendChild(el("p", { class: "eva-hint", text: `${rows.length}마리 중 300마리만 보입니다. 이름으로 찾아주세요.`, style: { padding: "12px" } }));
    }
    search.addEventListener("input", render);
    stage.addEventListener("change", render);
    try { await loadDb(); render(); setTimeout(() => search.focus(), 0); } catch (err) {
      if (!expired(err)) list.replaceChildren(el("p", { class: "eva-error", text: `불러오지 못했습니다: ${err.message}`, style: { padding: "12px" } }));
    }
  }

  // ======================================================================
  // 편집
  // ======================================================================
  /** 조건 칸 묶음 (레벨, 능력치 5개 + %, 유대감, 재료). 값 읽기/쓰기 */
  function conditionBlock(row, materialKey, materialLabel = "진화 재료") {
    const level = numInput(row?.["레벨"]);
    const bond = numInput(row?.["유대감"], "%");
    const stats = STATS.map(([k, p]) => [k, p, numInput(row?.[k]), numInput(row?.[p], "%")]);
    const material = input(materialKey ? row?.[materialKey] : "", { placeholder: "예) 그린 마카라이트*50 (여러 개는 / 로)" });
    const node = el("div", {}, [
      el("div", { class: "eva-grid" }, [
        field("레벨", level),
        ...stats.map(([k, , v, pc]) => field(`${k} (값 / %)`, el("div", { class: "eva-stat" }, [v, pc]))),
        field("유대감 (%)", bond),
      ]),
      materialKey ? el("div", { style: { marginTop: "8px" } }, field(materialLabel, material)) : null,
    ]);
    const read = () => {
      const o = { 레벨: level.value.trim(), 유대감: bond.value.trim() };
      stats.forEach(([k, p, v, pc]) => { o[k] = v.value.trim(); o[p] = pc.value.trim(); });
      if (materialKey) o[materialKey] = material.value.trim();
      return o;
    };
    return { node, read, material };
  }

  async function openEditor(originalName, onChanged) {
    // 다른 관리자가 바꿨을 수 있으니 열 때마다 최신 데이터로
    try { await loadDb(); } catch (err) { if (!expired(err)) alert(err.message); return; }
    if (originalName && !evoOf(originalName)) { alert("이미 삭제된 디지몬입니다."); onChanged?.(); return; }
    const isNew = !originalName;
    const nameList = el("datalist", { id: `eva-names-${Date.now()}` }, db.evolution.rows.map((r) => el("option", { value: r.name })));
    const listId = nameList.id;
    const baseEvo = originalName ? { ...evoOf(originalName) } : null;
    const baseConds = originalName ? condsOf(originalName).map((r) => ({ ...r })) : [];
    const baseJogTargets = baseEvo?.["조그레스"] ? [baseEvo["조그레스"]] : [];
    const baseJogs = baseJogTargets.map(jogOf).filter(Boolean).map((r) => ({ ...r }));
    const condOfType = (t) => baseConds.find((r) => (r["진화타입"] || "") === t) || null;

    // ----- 기본 -----
    const name = input(originalName || "", { maxlength: "40", placeholder: "예) 아구몬" });
    const stage = el("select", {}, STAGES.map(([v, t]) => el("option", { value: v, text: t })));
    stage.value = baseEvo?.evolution_stage || "3";
    const incoming = originalName ? incomingOf(originalName) : [];

    // ----- 일반 진화 -----
    const targets = el("div", { class: "eva-targets" });
    const sum = el("span", { class: "eva-sum" });
    const updateSum = () => {
      const vals = [...targets.children].map((r) => Number(r.querySelector("input[inputmode]").value) || 0);
      const total = Math.round(vals.reduce((a, b) => a + b, 0) * 100) / 100;
      sum.textContent = vals.length ? `확률 합계 ${total}%` : "";
      sum.className = `eva-sum${vals.length && ![95, 100].includes(total) ? " bad" : ""}`;
      addTarget.disabled = targets.children.length >= MAX_NORMAL;
    };
    function addTargetRow(t = "", p = "") {
      const tb = thumb(t);
      const ti = input(t, { list: listId, placeholder: "진화 대상 디지몬" });
      ti.addEventListener("input", () => { tb.style.backgroundImage = ti.value.trim() ? `url("${digiImg(ti.value.trim())}")` : ""; });
      const pi = numInput(p, "%");
      pi.addEventListener("input", updateSum);
      const row = el("div", { class: "eva-target" }, [tb, ti, pi,
        el("button", { type: "button", class: "eva-remove", text: "×", title: "삭제", "aria-label": "삭제", onclick: () => { row.remove(); updateSum(); } })]);
      targets.appendChild(row);
      updateSum();
      return ti;
    }
    const addTarget = el("button", { type: "button", class: "eva-btn", text: "+ 진화 대상 추가", onclick: () => addTargetRow().focus() });
    for (let i = 1; i <= 11; i++) if (baseEvo?.[`evol${i}`] || baseEvo?.[`percent${i}`]) addTargetRow(baseEvo[`evol${i}`] || "", baseEvo[`percent${i}`] || "");
    const normalCond = conditionBlock(condOfType(""), "진화재료");

    // ----- 암흑 / 특수 / 버스트 (갈래 목록) -----
    const kindLists = {};
    const kindSections = KINDS.map((k) => {
      const wrap = el("div");
      const warn = el("p", { class: "eva-warn", hidden: true, text: `지금 파일 형식은 ${k.label}을 디지몬마다 1개만 저장할 수 있습니다. 2개 이상은 파일 형식을 바꾼 뒤 지원됩니다.` });
      const cards = [];
      const refresh = () => { warn.hidden = cards.length <= 1; };
      function addCard(target = "", pct = "", mat = "", condRow = null) {
        const ti = input(target, { list: listId, placeholder: `${k.label} 대상 디지몬` });
        const tb = thumb(target);
        ti.addEventListener("input", () => { tb.style.backgroundImage = ti.value.trim() ? `url("${digiImg(ti.value.trim())}")` : ""; });
        const pi = numInput(pct, "%");
        const cond = conditionBlock(condRow ? { ...condRow, [k.condMat]: condRow[k.condMat] || mat } : { [k.condMat]: mat }, k.condMat, `${k.label} 재료`);
        const card = el("div", { class: "eva-card" }, [
          el("div", { class: "eva-card-head" }, [tb, el("h3", { text: k.label }), el("span", { class: "eva-spacer" }),
            el("button", { type: "button", class: "eva-btn eva-danger", text: "이 갈래 삭제", onclick: () => { card.remove(); cards.splice(cards.indexOf(api), 1); refresh(); } })]),
          el("div", { class: "eva-grid eva-g2" }, [field("대상", ti), field("확률 (%)", pi)]),
          el("div", { class: "eva-sub" }, [el("b", { text: "진화 조건" }), cond.node]),
        ]);
        const baseCondMat = condRow?.[k.condMat] || "";
        const api = {
          read: () => {
            const c = cond.read();
            const material = c[k.condMat] || "";
            delete c[k.condMat];
            return { target: ti.value.trim(), pct: pi.value.trim(), cond: c, material, hadCond: !!condRow, baseEvoMat: mat || "", baseCondMat };
          },
        };
        cards.push(api);
        wrap.appendChild(card);
        refresh();
        return ti;
      }
      const condRow = condOfType(k.key);
      if (baseEvo?.[k.key] || baseEvo?.[k.pct] || baseEvo?.[k.mat] || condRow) addCard(baseEvo?.[k.key] || "", baseEvo?.[k.pct] || "", baseEvo?.[k.mat] || "", condRow);
      kindLists[k.key] = cards;
      return el("div", {}, [wrap, warn,
        el("div", { style: { marginTop: "8px" } }, el("button", { type: "button", class: "eva-btn", text: `+ ${k.label} 추가`, onclick: () => addCard().focus() }))]);
    });

    // ----- 조그레스 (갈래 목록) -----
    const jogWrap = el("div");
    const jogWarn = el("p", { class: "eva-warn", hidden: true, text: "지금 파일 형식은 조그레스를 디지몬마다 1개만 저장할 수 있습니다." });
    const jogCards = [];
    function jogSide(row, n, who) {
      const lv = numInput(row?.[`level${n}`]);
      const bond = numInput(row?.[`bond${n}`], "%");
      const stats = JOG_STATS.map(([k, label]) => [k, label, numInput(row?.[`${k}${n}`]), numInput(row?.[`${k}${n}%`], "%")]);
      const node = el("div", { class: "eva-sub" }, [el("b", { text: `${who || `재료 디지몬 ${n}`} 조건` }),
        el("div", { class: "eva-grid" }, [field("레벨", lv), ...stats.map(([, label, v, pc]) => field(`${label} (값 / %)`, el("div", { class: "eva-stat" }, [v, pc]))), field("유대감 (%)", bond)])]);
      const read = () => {
        const o = { [`level${n}`]: lv.value.trim(), [`bond${n}`]: bond.value.trim() };
        stats.forEach(([k, , v, pc]) => { o[`${k}${n}`] = v.value.trim(); o[`${k}${n}%`] = pc.value.trim(); });
        return o;
      };
      return { node, read };
    }
    /** jogress.csv 의 digimon1/digimon2: 이 디지몬과 상대. 원래 줄에서 이 디지몬이 2번 자리였으면 그대로 */
    function jogPair(baseRow, self, partner) {
      if (baseRow && baseRow.digimon2 === (originalName || self) && baseRow.digimon1 !== (originalName || self)) return { digimon1: partner, digimon2: self };
      return { digimon1: self, digimon2: partner };
    }
    function addJogCard(target = "", pct = "", partner = "") {
      const baseRow = target ? jogOf(target) : null;
      const ti = input(target, { list: listId, placeholder: "조그레스 결과 디지몬" });
      const pi = numInput(pct, "%");
      const pa = input(partner, { list: listId, placeholder: "함께 조그레스하는 상대 디지몬" });
      const self = () => name.value.trim() || "이 디지몬";
      const d1 = baseRow?.digimon1, d2 = baseRow?.digimon2;
      const side1 = jogSide(baseRow, 1, d1 || self());
      const side2 = jogSide(baseRow, 2, d2 || partner || "상대 디지몬");
      const ing1 = input(baseRow?.ingredient1, { placeholder: "예) 홀리 링" });
      const ing2 = input(baseRow?.ingredient2, { placeholder: "없으면 비움" });
      const card = el("div", { class: "eva-card" }, [
        el("div", { class: "eva-card-head" }, [el("h3", { text: "조그레스" }), el("span", { class: "eva-spacer" }),
          el("button", { type: "button", class: "eva-btn eva-danger", text: "이 갈래 삭제", onclick: () => { card.remove(); jogCards.splice(jogCards.indexOf(api), 1); jogWarn.hidden = jogCards.length <= 1; } })]),
        el("div", { class: "eva-grid eva-g3" }, [field("결과 디지몬", ti), field("확률 (%)", pi), field("상대 디지몬", pa)]),
        side1.node, side2.node,
        el("div", { class: "eva-sub" }, [el("b", { text: "조그레스 재료 아이템" }), el("div", { class: "eva-grid eva-g2" }, [field("재료 1", ing1), field("재료 2", ing2)])]),
        el("p", { class: "eva-hint", text: "저장하면 상대 디지몬 쪽에도 같은 조그레스가 자동으로 들어갑니다(상대 칸이 비어 있을 때)." }),
      ]);
      const api = {
        read: () => ({
          target: ti.value.trim(), pct: pi.value.trim(), partner: pa.value.trim(),
          row: { ...(baseRow || {}), name: ti.value.trim(), ...jogPair(baseRow, name.value.trim(), pa.value.trim()),
            ...side1.read(), ...side2.read(), ingredient1: ing1.value.trim(), ingredient2: ing2.value.trim() },
          baseRow,
        }),
      };
      jogCards.push(api);
      jogWrap.appendChild(card);
      jogWarn.hidden = jogCards.length <= 1;
      return ti;
    }
    if (baseEvo?.["조그레스"] || baseEvo?.["조그레스재료"] || baseEvo?.percent12) addJogCard(baseEvo["조그레스"] || "", baseEvo.percent12 || "", baseEvo["조그레스재료"] || "");

    // ----- 저장할 데이터 만들기 -----
    const nonEmpty = (o, keys) => keys.some((k) => String(o[k] ?? "").trim() !== "");
    const COND_KEYS = ["레벨", "유대감", ...STATS.flat(), "진화재료", ...KINDS.map((k) => k.condMat)];
    function build() {
      const n = name.value.trim();
      const evo = { ...(baseEvo || {}), name: n, evolution_stage: stage.value };
      for (let i = 1; i <= 11; i++) { delete evo[`evol${i}`]; delete evo[`percent${i}`]; }
      [...targets.children].forEach((r, i) => {
        const [t, p] = r.querySelectorAll("input");
        if (t.value.trim() || p.value.trim()) { evo[`evol${i + 1}`] = t.value.trim(); evo[`percent${i + 1}`] = p.value.trim(); }
      });
      const conds = [];
      const nc = { ...(condOfType("") || {}), ...normalCond.read() };
      // 원래 있던 줄은 조건이 비어 있어도(이름·단계만 있는 줄) 그대로 유지
      if (condOfType("") || nonEmpty(nc, COND_KEYS)) conds.push(nc);
      KINDS.forEach((k) => {
        delete evo[k.key]; delete evo[k.pct]; delete evo[k.mat];
        const first = kindLists[k.key][0]?.read();
        if (!first) return;
        if (first.target) evo[k.key] = first.target;
        if (first.pct) evo[k.pct] = first.pct;
        // 재료는 evolution.csv 와 condition.csv 양쪽에 같이 저장. 단, 원래 한쪽에만 있던 값은 바꾸지 않았으면 그대로 둠
        const mEvo = first.material === first.baseCondMat && !first.baseEvoMat ? "" : first.material;
        const mCond = first.material === first.baseEvoMat && !first.baseCondMat && first.hadCond ? "" : first.material;
        if (mEvo) evo[k.mat] = mEvo;
        const c = { ...(condOfType(k.key) || {}), ...first.cond, [k.condMat]: mCond, 진화타입: k.key };
        const filled = nonEmpty(first.cond, COND_KEYS);
        if (first.hadCond || filled || (mCond && mCond !== first.baseEvoMat)) conds.push(c);
      });
      delete evo["조그레스"]; delete evo.percent12; delete evo["조그레스재료"];
      const jogs = [];
      const firstJ = jogCards[0]?.read();
      if (firstJ) {
        if (firstJ.target) evo["조그레스"] = firstJ.target;
        if (firstJ.pct) evo.percent12 = firstJ.pct;
        if (firstJ.partner) evo["조그레스재료"] = firstJ.partner;
        const jogKeys = Object.keys(firstJ.row).filter((k) => !["name", "digimon1", "digimon2"].includes(k));
        if (firstJ.target && (firstJ.baseRow || nonEmpty(firstJ.row, jogKeys))) jogs.push(firstJ.row);
      }
      // 빈 칸 정리
      const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => String(v ?? "").trim() !== "").map(([k, v]) => [k, String(v).trim()]));
      return {
        evolution: clean(evo),
        condition: conds.map(clean),
        jogress: jogs.map(clean),
        branchCounts: { 일반: [...targets.children].length, 조그레스: jogCards.length, ...Object.fromEntries(KINDS.map((k) => [k.key, kindLists[k.key].length])) },
      };
    }

    // ----- 화면 -----
    const error = el("p", { class: "eva-error" });
    const notes = el("p", { class: "eva-hint" });
    const save = el("button", { type: "submit", class: "eva-btn eva-primary", text: isNew ? "추가" : "저장" });
    const cancel = el("button", { type: "button", class: "eva-btn", text: "취소" });
    const del = isNew ? null : el("button", { type: "button", class: "eva-btn eva-danger", text: "디지몬 삭제" });
    const form = el("form", { novalidate: true }, [
      nameList,
      el("div", { class: "eva-grid", style: { gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" } }, [
        field("이름", name, isNew ? null : "이름을 바꾸면 다른 디지몬이 가리키는 이름도 같이 바꿀지 묻습니다."),
        field("진화 단계", stage),
      ]),
      incoming.length ? field("이 디지몬으로 진화해 오는 디지몬", el("div", { class: "eva-chips" },
        incoming.map((n) => el("button", { type: "button", class: "eva-chip", text: n, onclick: () => switchTo(n) })))) : null,
      el("div", { class: "eva-card" }, [
        el("div", { class: "eva-card-head" }, [el("h3", { text: "일반 진화" }), sum]),
        targets,
        el("div", { style: { marginTop: "8px" } }, addTarget),
        el("div", { class: "eva-sub" }, [el("b", { text: "일반 진화 조건 (모든 일반 진화 대상 공통)" }), normalCond.node]),
      ]),
      ...kindSections,
      el("div", { style: { marginTop: "12px" } }, [jogWrap, jogWarn,
        el("div", { style: { marginTop: "8px" } }, el("button", { type: "button", class: "eva-btn", text: "+ 조그레스 추가", onclick: () => addJogCard().focus() }))]),
      el("p", { class: "eva-hint", text: "값에는 쉼표(,)와 따옴표를 쓸 수 없습니다. 재료 여러 개는 / 로 구분하고 수량은 *숫자로 적습니다." }),
      error, notes,
      el("div", { class: "eva-footer" }, [del, el("span", { class: "eva-spacer" }), cancel, save]),
    ]);

    const initial = JSON.stringify(build());
    let saving = false;
    const modal = openModal(isNew ? "진화 정보 추가" : `진화 정보 — ${originalName}`, form, {
      wide: true,
      onRequestClose(close) {
        if (saving) return;
        if (JSON.stringify(build()) !== initial && !confirm("저장하지 않은 변경 내용이 있습니다. 닫을까요?")) return;
        close();
      },
    });
    cancel.addEventListener("click", () => modal.tryClose());
    function switchTo(n) {
      if (JSON.stringify(build()) !== initial && !confirm("저장하지 않은 변경 내용이 있습니다. 이동할까요?")) return;
      modal.close();
      openEditor(n, onChanged);
    }

    const lock = (on) => { saving = on; [save, cancel, del].forEach((b) => b && (b.disabled = on)); };
    const base = { evolution: baseEvo, condition: baseConds, jogress: baseJogs };

    async function afterSave(res) {
      await loadDb();
      window.DSREvolution?.reload();
      onChanged?.();
      if (res?.notes?.length) alert(res.notes.join("\n"));
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = build();
      const n = data.evolution.name;
      error.textContent = "";
      if (!n) { error.textContent = "디지몬 이름을 입력해주세요."; return name.focus(); }
      if (n !== originalName && evoOf(n)) { error.textContent = `"${n}" 디지몬이 이미 있습니다.`; return; }
      const over = Object.entries(data.branchCounts).find(([k, v]) => (k === "일반" ? v > MAX_NORMAL : v > 1));
      if (over) {
        error.textContent = over[0] === "일반"
          ? "일반 진화는 최대 11개입니다."
          : `${over[0]}은(는) 지금 파일 형식상 디지몬마다 1개만 저장할 수 있습니다. 2개 이상은 파일 형식을 바꾼 뒤 지원됩니다.`;
        return;
      }
      let renameRefs = false;
      if (originalName && n !== originalName) {
        const refs = incomingOf(originalName).length + db.jogress.rows.filter((r) => [r.digimon1, r.digimon2].includes(originalName)).length;
        renameRefs = refs ? confirm(`다른 디지몬 ${refs}곳이 "${originalName}"을(를) 가리키고 있습니다.\n그곳의 이름도 "${n}"(으)로 같이 바꿀까요?`) : false;
      }
      lock(true);
      save.textContent = "저장 중...";
      try {
        const res = await request(API, "POST", { action: "save", originalName: originalName || null, ...data, base, renameRefs });
        modal.close();
        await afterSave(res);
      } catch (err) {
        if (!expired(err)) error.textContent = err.message;
      } finally {
        lock(false);
        save.textContent = isNew ? "추가" : "저장";
      }
    });

    del?.addEventListener("click", async () => {
      const refs = incomingOf(originalName);
      const msg = refs.length
        ? `"${originalName}"을(를) 삭제할까요?\n\n이 디지몬으로 진화해 오는 디지몬이 있습니다: ${refs.join(", ")}\n(그 디지몬들의 진화 대상 칸은 그대로 남습니다)`
        : `"${originalName}"을(를) 삭제할까요?`;
      if (!confirm(msg)) return;
      lock(true);
      try {
        const res = await request(API, "POST", { action: "delete", originalName, base });
        modal.close();
        await afterSave(res);
      } catch (err) {
        if (!expired(err)) error.textContent = err.message;
      } finally { lock(false); }
    });
    setTimeout(() => (isNew ? name : addTarget).focus(), 0);
  }

  // ---------- 시작 ----------
  function open() {
    if (active) return clearHash();
    if (getToken()) { clearHash(); enterAdmin(); } else if (location.hash === "#admin" || location.hash === "#coupon-admin") showLogin();
  }
  window.DSREvolutionAdmin = { open };
  if (document.querySelector(".search-container")) open();
  else document.addEventListener("DOMContentLoaded", open);
})();
