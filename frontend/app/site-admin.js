// 메인 페이지 관리자 도구 — 쿠폰 / 레이드 타이머 / 이벤트 캘린더.
// dsrwiki.com/#coupon-admin (또는 #admin) 으로 들어오면 불러와지며, 로그인 후 12시간 동안 수정할 수 있습니다.
(function () {
  const C = window.DSRCoupons;
  if (!C || window.DSRSiteAdmin) return;

  const API = "/.netlify/functions/site-admin";
  const GRADES = [1, 2, 3, 4];
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
  const RAID_TYPES = [
    ["daily", "매일"],
    ["weekly", "매주 (요일 선택)"],
    ["biweekly", "2주마다"],
    ["custom_weekly", "요일별 시간 지정"],
    ["rotation", "순환 (매일 시간이 밀림)"],
  ];

  // ---------- 스타일 ----------
  const style = document.createElement("style");
  style.textContent = `
    .cpa-toolbar { display: flex; gap: 6px; justify-content: center; margin: 0 0 10px; flex-wrap: wrap; }
    .cpa-btn { font: inherit; font-size: 12px; line-height: 1.2; padding: 5px 9px; border-radius: 5px; border: 1px solid #c0c0c0;
      background: #fff; color: #2c3e50; cursor: pointer; }
    .cpa-btn:hover { background: #e8ebef; }
    .cpa-btn:disabled { opacity: .5; cursor: default; }
    .cpa-btn.cpa-primary { background: #2c3e50; border-color: #2c3e50; color: #fff; }
    .cpa-btn.cpa-primary:hover { background: #1d2a36; }
    .cpa-btn.cpa-danger { color: #c0392b; border-color: #e3b5b0; }
    .cpa-btn.cpa-danger:hover { background: #fbeceb; }
    .cpa-row-actions { display: flex; gap: 4px; justify-content: center; margin-top: 6px; }
    .cpa-row-actions .cpa-btn { padding: 3px 7px; font-size: 11px; }
    .cpa-expired { opacity: .55; }
    .cpa-badge { display: inline-block; font-size: 11px; padding: 1px 5px; border-radius: 4px; background: #7f8c8d; color: #fff; margin-top: 4px; }
    .cpa-section-bar { margin: 6px 0 8px; }

    .cpa-overlay { position: fixed; inset: 0; background: rgba(15, 20, 30, .55); z-index: 3000; display: flex;
      align-items: flex-start; justify-content: center; padding: 40px 16px; overflow-y: auto; box-sizing: border-box; }
    .cpa-modal { background: #fff; color: #222; width: 100%; max-width: 520px; border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.3);
      padding: 18px 18px 16px; box-sizing: border-box; text-align: left; font-size: 14px; }
    .cpa-modal.cpa-wide { max-width: 640px; }
    .cpa-modal [hidden] { display: none !important; }
    .cpa-modal h2 { margin: 0 0 14px; font-size: 17px; }
    .cpa-modal .cpa-field { margin-bottom: 12px; }
    .cpa-modal .cpa-label { display: block; margin: 0 0 4px; font-size: 13px; font-weight: bold; color: #444; }
    .cpa-modal input[type="text"], .cpa-modal input[type="password"], .cpa-modal input[type="number"],
    .cpa-modal input[type="datetime-local"], .cpa-modal input[type="date"], .cpa-modal input[type="time"],
    .cpa-modal select, .cpa-modal textarea {
      width: 100%; box-sizing: border-box; margin: 0; padding: 7px 8px; font: inherit; font-size: 14px;
      border: 1px solid #ccc; border-radius: 5px; background: #fff; color: #222; }
    .cpa-modal input[type="color"] { width: 44px; height: 32px; padding: 2px; border: 1px solid #ccc; border-radius: 5px; background: #fff; cursor: pointer; }
    .cpa-modal textarea { min-height: 120px; resize: vertical; font-size: 13px; }
    .cpa-inline { display: flex; align-items: center; gap: 8px; }
    .cpa-inline > input[type="datetime-local"], .cpa-inline > input[type="text"] { flex: 1; }
    .cpa-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .cpa-check { display: inline-flex !important; align-items: center; gap: 4px; margin: 0 !important; font-size: 13px; white-space: nowrap; cursor: pointer; }
    .cpa-days { display: flex; flex-wrap: wrap; gap: 6px 10px; }
    .cpa-items { display: flex; flex-direction: column; gap: 6px; }
    .cpa-item { display: grid; grid-template-columns: 36px 1fr 70px 64px 28px; gap: 6px; align-items: center; }
    .cpa-item-note { display: flex; align-items: center; gap: 6px; margin: 2px 0 4px 42px; font-size: 11px; color: #d35400; flex-wrap: wrap; }
    .cpa-item-note.cpa-ok { color: #27ae60; }
    .cpa-item-note .cpa-btn { padding: 2px 7px; font-size: 11px; }
    .cpa-modal .cpa-item select, .cpa-modal .cpa-item input { padding: 6px; }
    .cpa-slot { display: grid; grid-template-columns: 90px 1fr 28px; gap: 6px; align-items: center; }
    .cpa-thumb { width: 36px; height: 36px; border-radius: 4px; background-color: #0a0e1a; background-repeat: no-repeat;
      background-position: top left, center; background-size: 100% 100%, contain; flex: none; }
    .cpa-thumb.cpa-digimon { background-size: contain; background-position: center; }
    .cpa-remove { width: 28px; height: 28px; padding: 0; border: none; background: none; color: #999; font-size: 18px; cursor: pointer; border-radius: 4px; }
    .cpa-remove:hover { background: #f2f2f2; color: #c0392b; }
    .cpa-item-head { display: grid; grid-template-columns: 36px 1fr 70px 64px 28px; gap: 6px; font-size: 11px; color: #888; margin-bottom: 2px; }
    .cpa-hint { font-size: 12px; color: #888; margin: 4px 0 0; }
    .cpa-error { color: #c0392b; font-size: 13px; margin: 8px 0 0; min-height: 1em; }
    .cpa-footer { display: flex; justify-content: flex-end; gap: 6px; margin-top: 14px; }
    .cpa-footer .cpa-btn { font-size: 13px; padding: 7px 14px; }
    .cpa-list { display: flex; flex-direction: column; border: 1px solid #e3e3e3; border-radius: 8px; overflow: hidden; }
    .cpa-list-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-top: 1px solid #eee; }
    .cpa-list-row:first-child { border-top: none; }
    .cpa-list-row.cpa-expired { opacity: .55; }
    .cpa-list-main { flex: 1; min-width: 0; }
    .cpa-list-title { font-weight: bold; font-size: 14px; overflow-wrap: anywhere; }
    .cpa-list-sub { font-size: 12px; color: #777; margin-top: 2px; overflow-wrap: anywhere; }
    .cpa-list-row .cpa-btn { padding: 4px 8px; font-size: 12px; flex: none; }
    .cpa-chip { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cpa-empty { padding: 16px; text-align: center; color: #888; font-size: 13px; }
    @media (max-width: 480px) {
      .cpa-item, .cpa-item-head { grid-template-columns: 32px 1fr 56px 56px 26px; gap: 4px; }
      .cpa-thumb { width: 32px; height: 32px; }
      .cpa-grid2 { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);

  // ---------- 토큰 ----------
  function getToken() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(C.tokenKey) || "null");
      if (saved && saved.token && saved.expiresAt > Date.now()) return saved.token;
    } catch (e) { /* 무시 */ }
    clearToken();
    return null;
  }
  function setToken(data) {
    try { sessionStorage.setItem(C.tokenKey, JSON.stringify(data)); } catch (e) { /* 무시 */ }
  }
  function clearToken() {
    try { sessionStorage.removeItem(C.tokenKey); } catch (e) { /* 무시 */ }
  }

  /** resource: "coupons" | "events" | "raids" */
  async function api(method, body, resource) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = method === "GET" ? `${API}?resource=${encodeURIComponent(resource)}` : API;
    const payload = body ? JSON.stringify(resource ? { ...body, resource } : body) : undefined;
    let res;
    try {
      res = await fetch(url, { method, headers, body: payload, cache: "no-store" });
    } catch (e) {
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

  /** 로그인 만료면 관리 모드 종료, 아니면 메시지 표시. 처리했으면 true */
  function handleError(err, show) {
    if (err.status === 401) { closeAllModals(); exitAdmin(true); return true; }
    show(err.message);
    return false;
  }

  // ---------- DOM / 모달 ----------
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

  const modalStack = [];
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalStack.length) modalStack[modalStack.length - 1].tryClose();
  });

  function openModal(title, body, { onRequestClose, wide } = {}) {
    const modal = el("div", { class: `cpa-modal${wide ? " cpa-wide" : ""}`, role: "dialog", "aria-modal": "true", "aria-label": title }, [el("h2", { text: title }), body]);
    const overlay = el("div", { class: "cpa-overlay" }, modal);
    const entry = {
      close() {
        overlay.remove();
        const i = modalStack.indexOf(entry);
        if (i >= 0) modalStack.splice(i, 1);
      },
      tryClose() { return onRequestClose ? onRequestClose(entry.close) : entry.close(); },
    };
    overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) entry.tryClose(); });
    document.body.appendChild(overlay);
    modalStack.push(entry);
    return entry;
  }

  function closeAllModals() {
    [...modalStack].reverse().forEach((m) => m.close());
  }

  function field(label, control, hint) {
    return el("div", { class: "cpa-field" }, [
      el("span", { class: "cpa-label", text: label }),
      control,
      hint ? el("p", { class: "cpa-hint", text: hint }) : null,
    ]);
  }

  /** 편집 폼 공통: 저장/취소 버튼, 닫을 때 변경 확인, 저장 중 잠금 */
  function openEditor({ title, fields, readForm, validate, submit, wide, saveLabel = "저장", focus }) {
    const error = el("p", { class: "cpa-error" });
    const save = el("button", { type: "submit", class: "cpa-btn cpa-primary", text: saveLabel });
    const cancel = el("button", { type: "button", class: "cpa-btn", text: "취소" });
    const form = el("form", {}, [...fields, error, el("div", { class: "cpa-footer" }, [cancel, save])]);
    const initial = JSON.stringify(readForm());
    let saving = false;
    const modal = openModal(title, form, {
      wide,
      onRequestClose(close) {
        if (saving) return;
        if (JSON.stringify(readForm()) !== initial && !confirm("저장하지 않은 변경 내용이 있습니다. 닫을까요?")) return;
        close();
      },
    });
    cancel.addEventListener("click", () => modal.tryClose());
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = readForm();
      const problem = validate ? validate(data) : null;
      if (problem) { error.textContent = problem; return; }
      saving = true;
      save.disabled = cancel.disabled = true;
      error.textContent = "";
      try {
        await submit(data);
        modal.close();
      } catch (err) {
        handleError(err, (m) => { error.textContent = m; });
      } finally {
        saving = false;
        save.disabled = cancel.disabled = false;
      }
    });
    if (focus) setTimeout(() => focus.focus(), 0);
    return modal;
  }

  // ---------- 아이템 이미지 ----------
  const ITEM_IMAGE_API = "/.netlify/functions/item-image";
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
  async function uploadItemImage(name, image) {
    const token = getToken();
    let res;
    try {
      res = await fetch(ITEM_IMAGE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name, image }),
      });
    } catch (e) {
      throw Object.assign(new Error("이미지 서버에 연결하지 못했습니다."), { status: 0 });
    }
    let json = {};
    try { json = await res.json(); } catch (e) { /* 무시 */ }
    if (res.status === 409 && json.exists) return; // 그 사이 누가 올렸으면 그대로 사용
    if (!res.ok) {
      if (res.status === 401) clearToken();
      throw Object.assign(new Error(`"${name}" 이미지 업로드 실패: ${json.error || res.status}`), { status: res.status });
    }
  }

  // ---------- 시간 ----------
  /** Date → datetime-local 값 (한국 시간) */
  function toKstInput(date) {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(d).map((x) => [x.type, x.value]));
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }
  const fromKstInput = (v) => (v ? `${v}:00+09:00` : null);
  const formatKst = (v) => (v ? toKstInput(v).replace("T", " ").replace(/-/g, ".") : "");

  // ---------- 로그인 ----------
  function showLogin() {
    const input = el("input", { type: "password", autocomplete: "current-password", placeholder: "관리자 비밀번호" });
    const error = el("p", { class: "cpa-error" });
    const submit = el("button", { type: "submit", class: "cpa-btn cpa-primary", text: "로그인" });
    const cancel = el("button", { type: "button", class: "cpa-btn", text: "취소" });
    const form = el("form", {}, [field("비밀번호", input), error, el("div", { class: "cpa-footer" }, [cancel, submit])]);
    const modal = openModal("메인 페이지 관리자 로그인", form, { onRequestClose(close) { close(); clearHash(); } });
    cancel.addEventListener("click", () => modal.tryClose());
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!input.value) return;
      submit.disabled = true;
      error.textContent = "";
      try {
        setToken(await api("POST", { action: "login", password: input.value }));
        modal.close();
        clearHash();
        await enterAdmin();
      } catch (err) {
        error.textContent = err.message;
        input.select();
      } finally {
        submit.disabled = false;
      }
    });
    setTimeout(() => input.focus(), 0);
  }

  function clearHash() {
    if (location.hash === C.adminHash || location.hash === "#admin") {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  // ---------- 관리 모드 ----------
  function addToolbar(beforeEl, buttons, extraClass = "") {
    if (!beforeEl || !beforeEl.parentNode) return;
    beforeEl.parentNode.insertBefore(el("div", { class: `cpa-toolbar ${extraClass}`.trim() }, buttons), beforeEl);
  }

  function installToolbars() {
    if (document.querySelector(".cpa-toolbar")) return;
    addToolbar(document.querySelector(".coupon-container"), [
      el("button", { type: "button", class: "cpa-btn cpa-primary", text: "+ 쿠폰 등록", onclick: () => showCouponEditor(null) }),
      el("button", { type: "button", class: "cpa-btn", text: "관리 종료", onclick: () => exitAdmin() }),
    ]);
    addToolbar(document.getElementById("raid-timers"), [
      el("button", { type: "button", class: "cpa-btn cpa-primary", text: "레이드 관리", onclick: openRaidManager }),
    ], "cpa-section-bar");
    addToolbar(document.getElementById("event-calendar"), [
      el("button", { type: "button", class: "cpa-btn cpa-primary", text: "이벤트 관리", onclick: openEventManager }),
    ], "cpa-section-bar");
  }

  async function enterAdmin() {
    C.adminActive = true;
    installToolbars();
    C.showCouponMessage("불러오는 중...");
    await reloadCoupons();
  }

  async function exitAdmin(expired) {
    clearToken();
    C.adminActive = false;
    document.querySelectorAll(".cpa-toolbar").forEach((n) => n.remove());
    if (expired === true) alert("관리자 로그인이 만료되었습니다. 다시 로그인하려면 주소 끝에 #admin 을 붙여 접속하세요.");
    try { C.renderCoupons(await C.fetchPublicCoupons()); } catch (e) { C.showCouponMessage("쿠폰 정보를 불러올 수 없습니다."); }
  }

  /** 삭제 공통 */
  async function removeRow(resource, row, label, after) {
    if (!confirm(`"${label}" 항목을 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`)) return;
    try {
      await api("DELETE", { id: row.id, version: row.version }, resource);
    } catch (err) {
      if (handleError(err, alert)) return;
    }
    await after();
  }

  /** 목록 관리 창 공통 (레이드 / 이벤트) */
  function openListManager({ title, resource, newLabel, describe, onNew, onEdit, afterChange }) {
    const list = el("div", { class: "cpa-list" }, el("div", { class: "cpa-empty", text: "불러오는 중..." }));
    const body = el("div", {}, [
      el("div", { class: "cpa-toolbar", style: { justifyContent: "flex-start" } }, [
        el("button", { type: "button", class: "cpa-btn cpa-primary", text: newLabel, onclick: () => onNew(refresh) }),
      ]),
      list,
      el("div", { class: "cpa-footer" }, [el("button", { type: "button", class: "cpa-btn", text: "닫기", onclick: () => modal.close() })]),
    ]);
    const modal = openModal(title, body, { wide: true });

    async function refresh(changed) {
      if (changed) { try { await afterChange(); } catch (e) { console.warn(e); } }
      try {
        const { rows } = await api("GET", null, resource);
        list.replaceChildren();
        if (!rows.length) list.appendChild(el("div", { class: "cpa-empty", text: "등록된 항목이 없습니다." }));
        rows.forEach((row) => {
          const d = describe(row);
          list.appendChild(el("div", { class: `cpa-list-row${d.inactive ? " cpa-expired" : ""}` }, [
            d.lead || null,
            el("div", { class: "cpa-list-main" }, [
              el("div", { class: "cpa-list-title", text: d.title }),
              el("div", { class: "cpa-list-sub", text: d.sub }),
            ]),
            el("button", { type: "button", class: "cpa-btn", text: "수정", onclick: () => onEdit(row, refresh) }),
            el("button", { type: "button", class: "cpa-btn cpa-danger", text: "삭제",
              onclick: () => removeRow(resource, row, d.title, () => refresh(true)) }),
          ]));
        });
      } catch (err) {
        handleError(err, (m) => list.replaceChildren(el("div", { class: "cpa-empty", text: `불러오지 못했습니다: ${m}` })));
      }
    }
    refresh(false);
  }

  // ======================================================================
  // 쿠폰
  // ======================================================================
  let coupons = [];

  function renderCouponsAdmin() {
    C.renderCoupons(coupons, {
      emptyText: "등록된 쿠폰이 없습니다.",
      decorate(node, coupon) {
        if (!C.isCouponActive(coupon)) {
          node.classList.add("cpa-expired");
          node.querySelector(".coupon-period")?.appendChild(el("span", { class: "cpa-badge", text: "만료됨 · 공개 목록에서 숨김" }));
        }
        node.appendChild(el("div", { class: "cpa-row-actions" }, [
          el("button", { type: "button", class: "cpa-btn", text: "수정", onclick: () => showCouponEditor(coupon) }),
          el("button", { type: "button", class: "cpa-btn cpa-danger", text: "삭제", onclick: () => removeRow("coupons", coupon, coupon.name, reloadCoupons) }),
        ]));
      },
    });
  }

  async function reloadCoupons() {
    try {
      const { rows } = await api("GET", null, "coupons");
      coupons = rows.map(C.normalizeDbCoupon);
      renderCouponsAdmin();
    } catch (err) {
      handleError(err, (m) => C.showCouponMessage(`관리자 목록을 불러오지 못했습니다: ${m}`));
    }
  }

  /** "이름x수량x등급" 줄 단위 텍스트 → 구성품 목록 (예전 coupon.json 형식) */
  function parseItemLines(text) {
    return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
      const parts = line.split(/\s*[xX×]\s*/);
      if (parts.length < 3) return { name: line, qty: 1, grade: 1 };
      const grade = Number(parts.pop());
      const qty = Number(parts.pop());
      return { name: parts.join("x").trim(), qty: qty || 1, grade: GRADES.includes(grade) ? grade : 1 };
    });
  }

  function showCouponEditor(coupon) {
    const isNew = !coupon;
    const name = el("input", { type: "text", maxlength: "60", value: coupon?.name || "", placeholder: "예) 개발 팀 노트 #35" });
    const code = el("input", { type: "text", maxlength: "40", value: coupon?.code || "", placeholder: "예) 0LEUN98G", autocomplete: "off", spellcheck: "false" });

    const defaultEnd = toKstInput(new Date(Date.now() + 7 * 864e5)).slice(0, 11) + "23:59";
    const ends = el("input", { type: "datetime-local", value: coupon?.endsAt ? toKstInput(coupon.endsAt) : defaultEnd });
    const noEnd = el("input", { type: "checkbox" });
    noEnd.checked = !!coupon && !coupon.endsAt;
    ends.disabled = noEnd.checked;
    noEnd.addEventListener("change", () => { ends.disabled = noEnd.checked; });

    const list = el("div", { class: "cpa-items" });
    function addItemRow(item = { name: "", qty: 1, grade: 1 }) {
      const thumb = el("div", { class: "cpa-thumb", "aria-hidden": "true" });
      const iname = el("input", { type: "text", maxlength: "60", value: item.name, placeholder: "아이템 이름" });
      const qty = el("input", { type: "number", min: "1", max: "999999", step: "1", value: String(item.qty || 1), "aria-label": "수량" });
      const grade = el("select", { "aria-label": "등급" }, GRADES.map((g) => el("option", { value: String(g), text: `${g}등급` })));
      grade.value = String(GRADES.includes(Number(item.grade)) ? item.grade : 1);

      // CDN에 아이템 이미지가 없으면 여기서 올릴 수 있음 (쿠폰 저장 때 같이 업로드)
      const note = el("div", { class: "cpa-item-note", hidden: true });
      const fileInput = el("input", { type: "file", accept: "image/webp,image/png,image/jpeg,image/gif", style: { display: "none" } });
      let pending = null; // { name, dataUrl }
      let probeSeq = 0;
      const imageOf = () => (pending && pending.name === iname.value.trim() ? pending.dataUrl : C.itemImageUrl(iname.value));
      const updateThumb = () => {
        thumb.style.backgroundImage = `url("${C.itemFrameUrl(grade.value)}"), url("${imageOf()}")`;
      };
      const showNote = (state, info) => {
        note.replaceChildren();
        note.className = "cpa-item-note";
        if (state === "none") { note.hidden = true; return; }
        note.hidden = false;
        if (state === "missing") {
          note.append("CDN에 이 아이템 이미지가 없습니다.",
            el("button", { type: "button", class: "cpa-btn", text: "이미지 올리기", onclick: () => fileInput.click() }));
        } else if (state === "pending") {
          note.className = "cpa-item-note cpa-ok";
          note.append(`새 이미지 ${info} · 쿠폰 저장 시 업로드됩니다.`,
            el("button", { type: "button", class: "cpa-btn", text: "다시 고르기", onclick: () => fileInput.click() }),
            el("button", { type: "button", class: "cpa-btn", text: "취소", onclick: () => { pending = null; updateThumb(); probe(); } }));
        }
      };
      const probe = () => {
        const seq = ++probeSeq;
        const n = iname.value.trim();
        if (!n) return showNote("none");
        if (pending && pending.name === n) return;
        const img = new Image();
        img.onload = () => { if (seq === probeSeq) showNote("none"); };
        img.onerror = () => { if (seq === probeSeq) showNote("missing"); };
        img.src = C.itemImageUrl(n);
      };
      let probeTimer = null;
      iname.addEventListener("input", () => {
        updateThumb();
        clearTimeout(probeTimer);
        probeTimer = setTimeout(probe, 400);
      });
      grade.addEventListener("change", updateThumb);
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        fileInput.value = "";
        if (!file) return;
        try {
          const r = await fileToDataUrl(file, 256); // 기존 아이템 이미지는 256×256
          pending = { name: iname.value.trim(), dataUrl: r.dataUrl };
          updateThumb();
          showNote("pending", `${r.w}×${r.h} · ${Math.round(r.bytes / 1024)}KB`);
        } catch (e) {
          alert("이미지를 읽지 못했습니다.");
        }
      });
      updateThumb();
      probe();

      const row = el("div", { class: "cpa-item-wrap" }, [
        el("div", { class: "cpa-item" }, [
          thumb, iname, qty, grade,
          el("button", { type: "button", class: "cpa-remove", title: "구성품 삭제", "aria-label": "구성품 삭제", text: "×", onclick: () => row.remove() }),
        ]),
        note,
        fileInput,
      ]);
      row.pendingImage = () => (pending && pending.name === iname.value.trim() && iname.value.trim() ? pending : null);
      list.appendChild(row);
      return iname;
    }
    (coupon?.items?.length ? coupon.items : [undefined]).forEach((it) => addItemRow(it));

    const bulk = el("textarea", { placeholder: "한 줄에 하나씩: 이름x수량x등급\n예) 궁극체 스킬 강화석x5x4" });
    const bulkBox = el("div", { class: "cpa-field", hidden: true }, [
      bulk,
      el("div", { class: "cpa-toolbar", style: { justifyContent: "flex-end", margin: "6px 0 0" } }, [
        el("button", { type: "button", class: "cpa-btn", text: "목록에 추가", onclick: () => {
          const items = parseItemLines(bulk.value);
          if (!items.length) return;
          [...list.children].forEach((r) => { if (!r.querySelector("input").value.trim()) r.remove(); });
          items.forEach((it) => addItemRow(it));
          bulk.value = "";
          bulkBox.hidden = true;
        } }),
      ]),
    ]);

    openEditor({
      title: isNew ? "쿠폰 등록" : "쿠폰 수정",
      saveLabel: isNew ? "등록" : "저장",
      focus: name,
      fields: [
        field("쿠폰 이름", name),
        field("쿠폰 번호", code),
        field("마감 일시 (한국 시간)",
          el("div", { class: "cpa-inline" }, [ends, el("label", { class: "cpa-check" }, [noEnd, "기한 미정"])]),
          "마감 일시가 지나면 메인 페이지에서 자동으로 숨겨집니다."),
        el("div", { class: "cpa-field" }, [
          el("span", { class: "cpa-label", text: "구성품" }),
          el("div", { class: "cpa-item-head" }, [el("span"), el("span", { text: "이름" }), el("span", { text: "수량" }), el("span", { text: "등급" }), el("span")]),
          list,
          el("div", { class: "cpa-toolbar", style: { justifyContent: "flex-start", margin: "8px 0 0" } }, [
            el("button", { type: "button", class: "cpa-btn", text: "+ 구성품 추가", onclick: () => addItemRow().focus() }),
            el("button", { type: "button", class: "cpa-btn", text: "한꺼번에 입력", onclick: () => { bulkBox.hidden = !bulkBox.hidden; if (!bulkBox.hidden) bulk.focus(); } }),
          ]),
        ]),
        bulkBox,
      ],
      readForm: () => ({
        name: name.value.trim(),
        code: code.value.trim(),
        ends_at: noEnd.checked || !ends.value ? null : fromKstInput(ends.value),
        items: [...list.children].map((r) => {
          const [n, q] = r.querySelectorAll("input");
          return { name: n.value.trim(), qty: Number(q.value), grade: Number(r.querySelector("select").value) };
        }).filter((it) => it.name),
      }),
      validate: (d) => {
        if (!d.name) return "쿠폰 이름을 입력해주세요.";
        if (!d.code) return "쿠폰 번호를 입력해주세요.";
        if (!noEnd.checked && !ends.value) return "마감 일시를 입력하거나 '기한 미정'을 선택해주세요.";
        return null;
      },
      submit: async (d) => {
        // CDN에 없던 아이템 이미지를 먼저 올림
        for (const r of [...list.children]) {
          const p = r.pendingImage?.();
          if (p) await uploadItemImage(p.name, p.dataUrl);
        }
        if (isNew) await api("POST", d, "coupons");
        else await api("PUT", { ...d, id: coupon.id, version: coupon.version }, "coupons");
        await reloadCoupons();
      },
    });
  }

  // ======================================================================
  // 이벤트 캘린더
  // ======================================================================
  function openEventManager() {
    openListManager({
      title: "이벤트 캘린더 관리",
      resource: "events",
      newLabel: "+ 이벤트 등록",
      describe: (row) => ({
        title: row.title,
        sub: `${formatKst(row.starts_at)} ~ ${row.ends_at ? formatKst(row.ends_at) : "종료 미정"}`,
        inactive: !!row.ends_at && new Date(row.ends_at) < new Date(),
        lead: el("span", { class: "cpa-chip", text: "■", style: { background: row.background_color || "#3788d8", color: row.background_color || "#3788d8", width: "14px", padding: "3px 0" } }),
      }),
      onNew: (refresh) => showEventEditor(null, refresh),
      onEdit: (row, refresh) => showEventEditor(row, refresh),
      afterChange: () => window.DSRCalendar?.reload(),
    });
  }

  function showEventEditor(row, refresh) {
    const isNew = !row;
    const title = el("input", { type: "text", maxlength: "80", value: row?.title || "", placeholder: "예) 할로윈 이벤트" });
    const today = toKstInput(new Date()).slice(0, 11);
    const starts = el("input", { type: "datetime-local", value: row ? toKstInput(row.starts_at) : `${today}10:00` });
    const ends = el("input", { type: "datetime-local", value: row?.ends_at ? toKstInput(row.ends_at) : "" });
    const bg = el("input", { type: "color", value: row?.background_color || "#3788d8", "aria-label": "배경색" });
    const fg = el("input", { type: "color", value: row?.text_color || "#ffffff", "aria-label": "글자색" });
    const preview = el("span", { class: "cpa-chip" });
    const updatePreview = () => {
      preview.textContent = title.value.trim() || "이벤트 제목";
      preview.style.background = bg.value;
      preview.style.color = fg.value;
    };
    [title, bg, fg].forEach((n) => n.addEventListener("input", updatePreview));
    updatePreview();

    openEditor({
      title: isNew ? "이벤트 등록" : "이벤트 수정",
      saveLabel: isNew ? "등록" : "저장",
      focus: title,
      fields: [
        field("이벤트 제목", title),
        el("div", { class: "cpa-grid2" }, [
          field("시작 (한국 시간)", starts),
          field("종료 (한국 시간)", ends, "비워두면 시작 시점에만 표시됩니다."),
        ]),
        field("색상", el("div", { class: "cpa-inline" }, [
          el("span", { class: "cpa-hint", text: "배경", style: { margin: "0" } }), bg,
          el("span", { class: "cpa-hint", text: "글자", style: { margin: "0" } }), fg,
          preview,
        ])),
      ],
      readForm: () => ({
        title: title.value.trim(),
        starts_at: fromKstInput(starts.value),
        ends_at: fromKstInput(ends.value),
        background_color: bg.value,
        text_color: fg.value,
      }),
      validate: (d) => {
        if (!d.title) return "이벤트 제목을 입력해주세요.";
        if (!d.starts_at) return "시작 일시를 입력해주세요.";
        if (d.ends_at && new Date(d.ends_at) < new Date(d.starts_at)) return "종료 일시가 시작 일시보다 빠릅니다.";
        return null;
      },
      submit: async (d) => {
        if (isNew) await api("POST", d, "events");
        else await api("PUT", { ...d, id: row.id, version: row.version }, "events");
        await refresh(true);
      },
    });
  }

  // ======================================================================
  // 레이드 타이머
  // ======================================================================
  const imagePath = (name) => (window.DSRRaids?.getImagePath
    ? window.DSRRaids.getImagePath(name)
    : `https://media.dsrwiki.com/dsrwiki/digimon/${String(name).replace(/:/g, "_")}/${String(name).replace(/:/g, "_")}.webp`);

  function describeSchedule(s = {}) {
    const times = (s.times || []).join(", ");
    switch (s.type) {
      case "daily": return `매일 ${times}`;
      case "weekly": return `매주 ${(s.days || []).map((d) => DAY_NAMES[d]).join("·")} ${times}`;
      case "biweekly": return `2주마다 ${times} (기준 ${s.baseDate})`;
      case "custom_weekly": return `요일별: ${(s.schedules || []).map((x) => `${DAY_NAMES[x.day]} ${x.time}`).join(", ")}`;
      case "rotation": return `순환: ${s.baseDate} ${s.baseTime}부터 하루 +${s.stepMinutes}분`;
      default: return "일정 없음";
    }
  }

  function openRaidManager() {
    openListManager({
      title: "레이드 타이머 관리",
      resource: "raids",
      newLabel: "+ 레이드 등록",
      describe: (row) => {
        const now = new Date();
        const ended = row.active_until && new Date(row.active_until) <= now;
        const notYet = row.active_from && new Date(row.active_from) > now;
        const period = row.active_from || row.active_until
          ? ` · 기간 ${row.active_from ? formatKst(row.active_from) : ""} ~ ${row.active_until ? formatKst(row.active_until) : ""}`
          : "";
        return {
          title: row.name + (ended ? " (기간 종료 · 숨김)" : notYet ? " (시작 전)" : ""),
          sub: `${describeSchedule(row.schedule)} · ${row.map || "맵 없음"}${period}`,
          inactive: ended,
          lead: el("div", { class: "cpa-thumb cpa-digimon", style: { backgroundImage: `url("${imagePath(row.image_name || row.name)}")` } }),
        };
      },
      onNew: (refresh) => showRaidEditor(null, refresh),
      onEdit: (row, refresh) => showRaidEditor(row, refresh),
      afterChange: () => window.DSRRaids?.reload(),
    });
  }

  function showRaidEditor(row, refresh) {
    const isNew = !row;
    const s = row?.schedule || { type: "daily", times: ["22:00"] };

    const name = el("input", { type: "text", maxlength: "40", value: row?.name || "", placeholder: "예) 오메가몬" });
    const imageName = el("input", { type: "text", maxlength: "60", value: row?.image_name || "", placeholder: "비우면 레이드 이름 사용" });
    const thumb = el("div", { class: "cpa-thumb cpa-digimon", "aria-hidden": "true" });
    const updateThumb = () => { thumb.style.backgroundImage = `url("${imagePath(imageName.value.trim() || name.value.trim() || "default")}")`; };
    [name, imageName].forEach((n) => n.addEventListener("input", updateThumb));
    updateThumb();
    const map = el("input", { type: "text", maxlength: "40", value: row?.map || "", placeholder: "예) 어둠성 계곡" });
    const mapImage = el("input", { type: "text", maxlength: "60", value: row?.map_image || "", placeholder: "예) omega (비우면 지도 버튼 없음)" });

    // 일정 종류별 입력
    const type = el("select", {}, RAID_TYPES.map(([v, t]) => el("option", { value: v, text: t })));
    type.value = s.type || "daily";
    const times = el("input", { type: "text", value: (s.times || []).join(", "), placeholder: "예) 19:30 또는 09:00, 21:00" });
    const dayBoxes = DAY_NAMES.map((d, i) => {
      const box = el("input", { type: "checkbox", value: String(i) });
      box.checked = (s.days || []).includes(i);
      return el("label", { class: "cpa-check" }, [box, d]);
    });
    const baseDate = el("input", { type: "date", value: s.baseDate || toKstInput(new Date()).slice(0, 10) });
    const baseTime = el("input", { type: "time", value: s.baseTime || "19:00" });
    const step = el("input", { type: "number", min: "0", max: "720", step: "1", value: String(s.stepMinutes ?? 25) });

    const slots = el("div", { class: "cpa-items" });
    function addSlot(slot = { day: 5, time: "21:00" }) {
      const day = el("select", { "aria-label": "요일" }, DAY_NAMES.map((d, i) => el("option", { value: String(i), text: `${d}요일` })));
      day.value = String(slot.day);
      const time = el("input", { type: "time", value: slot.time, "aria-label": "시간" });
      const r = el("div", { class: "cpa-slot" }, [day, time,
        el("button", { type: "button", class: "cpa-remove", title: "삭제", "aria-label": "삭제", text: "×", onclick: () => r.remove() })]);
      slots.appendChild(r);
    }
    (s.type === "custom_weekly" && s.schedules?.length ? s.schedules : [undefined]).forEach((x) => addSlot(x));

    const timesField = field("시간 (한국 시간)", times, "여러 개면 쉼표로 구분합니다.");
    const daysField = field("요일", el("div", { class: "cpa-days" }, dayBoxes));
    const baseDateField = field("기준 날짜", baseDate);
    const baseDateHint = baseDateField.querySelector(".cpa-hint") || baseDateField.appendChild(el("p", { class: "cpa-hint" }));
    const slotsField = el("div", { class: "cpa-field" }, [
      el("span", { class: "cpa-label", text: "요일별 시간" }),
      slots,
      el("div", { class: "cpa-toolbar", style: { justifyContent: "flex-start", margin: "8px 0 0" } }, [
        el("button", { type: "button", class: "cpa-btn", text: "+ 시간 추가", onclick: () => addSlot() }),
      ]),
    ]);
    const rotationField = el("div", { class: "cpa-grid2" }, [
      field("기준 시간", baseTime),
      field("하루마다 밀리는 시간 (분)", step),
    ]);

    function syncType() {
      const t = type.value;
      timesField.hidden = !["daily", "weekly", "biweekly"].includes(t);
      daysField.hidden = t !== "weekly";
      baseDateField.hidden = !["biweekly", "rotation"].includes(t);
      baseDateHint.textContent = t === "biweekly" ? "이 날짜부터 14일마다 열립니다." : "이 날짜의 기준 시간부터 하루마다 시간이 밀립니다.";
      slotsField.hidden = t !== "custom_weekly";
      rotationField.hidden = t !== "rotation";
    }
    type.addEventListener("change", syncType);
    syncType();

    const activeFrom = el("input", { type: "datetime-local", value: toKstInput(row?.active_from) });
    const activeUntil = el("input", { type: "datetime-local", value: toKstInput(row?.active_until) });

    const parseTimes = () => times.value.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean)
      .map((t) => (/^\d:\d{2}$/.test(t) ? `0${t}` : t));

    function readSchedule() {
      const t = type.value;
      if (t === "daily") return { type: t, times: parseTimes() };
      if (t === "weekly") return { type: t, times: parseTimes(), days: dayBoxes.map((l) => l.querySelector("input")).filter((b) => b.checked).map((b) => Number(b.value)) };
      if (t === "biweekly") return { type: t, times: parseTimes(), baseDate: baseDate.value };
      if (t === "custom_weekly") return { type: t, schedules: [...slots.children].map((r) => ({ day: Number(r.querySelector("select").value), time: r.querySelector("input").value })).filter((x) => x.time) };
      return { type: t, baseTime: baseTime.value, baseDate: baseDate.value, stepMinutes: Number(step.value) };
    }

    openEditor({
      title: isNew ? "레이드 등록" : "레이드 수정",
      saveLabel: isNew ? "등록" : "저장",
      wide: true,
      focus: name,
      fields: [
        el("div", { class: "cpa-field" }, [
          el("span", { class: "cpa-label", text: "레이드 이름" }),
          el("div", { class: "cpa-inline" }, [thumb, name]),
        ]),
        el("div", { class: "cpa-grid2" }, [
          field("이미지 이름", imageName, "디지몬 폴더 이름이 레이드 이름과 다를 때만 입력합니다."),
          field("맵", map),
        ]),
        field("맵 이미지", mapImage, "media.dsrwiki.com/dsrwiki/map/[이름].png 의 이름입니다."),
        field("일정 종류", type),
        timesField,
        daysField,
        baseDateField,
        slotsField,
        rotationField,
        el("div", { class: "cpa-grid2" }, [
          field("표시 시작 (선택)", activeFrom),
          field("표시 종료 (선택)", activeUntil, "기간 한정 레이드만 입력합니다. 종료 후에는 목록에서 숨겨집니다."),
        ]),
      ],
      readForm: () => ({
        name: name.value.trim(),
        image_name: imageName.value.trim() || null,
        map: map.value.trim(),
        map_image: mapImage.value.trim() || null,
        schedule: readSchedule(),
        active_from: fromKstInput(activeFrom.value),
        active_until: fromKstInput(activeUntil.value),
      }),
      validate: (d) => {
        if (!d.name) return "레이드 이름을 입력해주세요.";
        const sc = d.schedule;
        const timeOk = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
        if (["daily", "weekly", "biweekly"].includes(sc.type) && (!sc.times.length || !sc.times.every(timeOk))) return "시간을 HH:MM 형식으로 입력해주세요. (예: 19:30)";
        if (sc.type === "weekly" && !sc.days.length) return "요일을 하나 이상 선택해주세요.";
        if (["biweekly", "rotation"].includes(sc.type) && !sc.baseDate) return "기준 날짜를 입력해주세요.";
        if (sc.type === "custom_weekly" && !sc.schedules.length) return "요일별 시간을 하나 이상 입력해주세요.";
        if (sc.type === "rotation" && !timeOk(sc.baseTime)) return "기준 시간을 입력해주세요.";
        if (d.active_from && d.active_until && new Date(d.active_until) <= new Date(d.active_from)) return "표시 종료가 표시 시작보다 빠릅니다.";
        return null;
      },
      submit: async (d) => {
        if (isNew) await api("POST", d, "raids");
        else await api("PUT", { ...d, id: row.id, version: row.version }, "raids");
        await refresh(true);
      },
    });
  }

  // ---------- 시작 ----------
  function open() {
    if (C.adminActive) return clearHash();
    if (getToken()) { clearHash(); enterAdmin(); } else if (location.hash === C.adminHash || location.hash === "#admin") showLogin();
  }

  window.DSRSiteAdmin = { open };
  open();
})();
