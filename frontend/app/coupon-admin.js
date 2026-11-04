// 메인 페이지 쿠폰 관리자 도구.
// dsrwiki.com/#coupon-admin 으로 들어오면 불러와지며, 로그인 후 12시간 동안 쿠폰을 등록/수정/삭제할 수 있습니다.
(function () {
  const C = window.DSRCoupons;
  if (!C || window.DSRCouponAdmin) return;

  const API = "/.netlify/functions/coupons";
  const GRADES = [1, 2, 3, 4];

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

    .cpa-overlay { position: fixed; inset: 0; background: rgba(15, 20, 30, .55); z-index: 3000; display: flex;
      align-items: flex-start; justify-content: center; padding: 40px 16px; overflow-y: auto; box-sizing: border-box; }
    .cpa-modal { background: #fff; color: #222; width: 100%; max-width: 520px; border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.3);
      padding: 18px 18px 16px; box-sizing: border-box; text-align: left; font-size: 14px; }
    .cpa-modal h2 { margin: 0 0 14px; font-size: 17px; }
    .cpa-modal .cpa-field { margin-bottom: 12px; }
    .cpa-modal .cpa-label { display: block; margin: 0 0 4px; font-size: 13px; font-weight: bold; color: #444; }
    .cpa-modal input[type="text"], .cpa-modal input[type="password"], .cpa-modal input[type="number"],
    .cpa-modal input[type="datetime-local"], .cpa-modal select, .cpa-modal textarea {
      width: 100%; box-sizing: border-box; margin: 0; padding: 7px 8px; font: inherit; font-size: 14px;
      border: 1px solid #ccc; border-radius: 5px; background: #fff; color: #222; }
    .cpa-modal textarea { min-height: 120px; resize: vertical; font-size: 13px; }
    .cpa-inline { display: flex; align-items: center; gap: 8px; }
    .cpa-inline input[type="datetime-local"] { flex: 1; }
    .cpa-check { display: inline-flex; align-items: center; gap: 4px; margin: 0; font-size: 13px; white-space: nowrap; cursor: pointer; }
    .cpa-items { display: flex; flex-direction: column; gap: 6px; }
    .cpa-item { display: grid; grid-template-columns: 36px 1fr 70px 64px 28px; gap: 6px; align-items: center; }
    .cpa-modal .cpa-item select, .cpa-modal .cpa-item input { padding: 6px; }
    .cpa-thumb { width: 36px; height: 36px; border-radius: 4px; background-color: #0a0e1a; background-repeat: no-repeat;
      background-position: top left, center; background-size: 100% 100%, contain; }
    .cpa-remove { width: 28px; height: 28px; padding: 0; border: none; background: none; color: #999; font-size: 18px; cursor: pointer; border-radius: 4px; }
    .cpa-remove:hover { background: #f2f2f2; color: #c0392b; }
    .cpa-item-head { display: grid; grid-template-columns: 36px 1fr 70px 64px 28px; gap: 6px; font-size: 11px; color: #888; margin-bottom: 2px; }
    .cpa-hint { font-size: 12px; color: #888; margin: 4px 0 0; }
    .cpa-error { color: #c0392b; font-size: 13px; margin: 8px 0 0; min-height: 1em; }
    .cpa-footer { display: flex; justify-content: flex-end; gap: 6px; margin-top: 14px; }
    .cpa-footer .cpa-btn { font-size: 13px; padding: 7px 14px; }
    @media (max-width: 480px) {
      .cpa-item, .cpa-item-head { grid-template-columns: 32px 1fr 56px 56px 26px; gap: 4px; }
      .cpa-thumb { width: 32px; height: 32px; }
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

  async function api(method, body) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let res;
    try {
      res = await fetch(API, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
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

  // ---------- 모달 ----------
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, "");
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach((c) => c && node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  }

  function openModal(title, body, { onRequestClose } = {}) {
    const modal = el("div", { class: "cpa-modal", role: "dialog", "aria-modal": "true", "aria-label": title }, [el("h2", { text: title }), body]);
    const overlay = el("div", { class: "cpa-overlay" }, modal);
    const close = () => { overlay.remove(); document.removeEventListener("keydown", onKey); };
    const tryClose = () => (onRequestClose ? onRequestClose(close) : close());
    const onKey = (e) => { if (e.key === "Escape") tryClose(); };
    overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) tryClose(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    return { close, tryClose };
  }

  // ---------- 로그인 ----------
  function showLogin() {
    const input = el("input", { type: "password", autocomplete: "current-password", placeholder: "관리자 비밀번호" });
    const error = el("p", { class: "cpa-error" });
    const submit = el("button", { type: "submit", class: "cpa-btn cpa-primary", text: "로그인" });
    const cancel = el("button", { type: "button", class: "cpa-btn", text: "취소" });
    const form = el("form", {}, [
      el("div", { class: "cpa-field" }, [el("span", { class: "cpa-label", text: "비밀번호" }), input]),
      error,
      el("div", { class: "cpa-footer" }, [cancel, submit]),
    ]);
    const modal = openModal("쿠폰 관리자 로그인", form);
    cancel.addEventListener("click", () => { modal.close(); clearHash(); });
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
    if (location.hash === C.adminHash) history.replaceState(null, "", location.pathname + location.search);
  }

  // ---------- 관리자 목록 ----------
  let coupons = [];

  function toolbar() {
    let bar = document.querySelector(".cpa-toolbar");
    if (bar) return bar;
    const container = document.querySelector(".coupon-container");
    if (!container) return null;
    bar = el("div", { class: "cpa-toolbar" }, [
      el("button", { type: "button", class: "cpa-btn cpa-primary", text: "+ 쿠폰 등록", onclick: () => showEditor(null) }),
      el("button", { type: "button", class: "cpa-btn", text: "관리 종료", onclick: exitAdmin }),
    ]);
    container.parentNode.insertBefore(bar, container);
    return bar;
  }

  function render() {
    C.renderCoupons(coupons, {
      emptyText: "등록된 쿠폰이 없습니다.",
      decorate(node, coupon) {
        if (!C.isCouponActive(coupon)) {
          node.classList.add("cpa-expired");
          node.querySelector(".coupon-period")?.appendChild(el("span", { class: "cpa-badge", text: "만료됨 · 공개 목록에서 숨김" }));
        }
        node.appendChild(el("div", { class: "cpa-row-actions" }, [
          el("button", { type: "button", class: "cpa-btn", text: "수정", onclick: () => showEditor(coupon) }),
          el("button", { type: "button", class: "cpa-btn cpa-danger", text: "삭제", onclick: () => remove(coupon) }),
        ]));
      },
    });
  }

  async function reload() {
    try {
      const json = await api("GET");
      coupons = json.coupons.map(C.normalizeDbCoupon);
      render();
    } catch (err) {
      if (err.status === 401) return exitAdmin(true);
      C.showCouponMessage(`관리자 목록을 불러오지 못했습니다: ${err.message}`);
    }
  }

  async function enterAdmin() {
    C.adminActive = true;
    toolbar();
    C.showCouponMessage("불러오는 중...");
    await reload();
  }

  async function exitAdmin(expired) {
    clearToken();
    C.adminActive = false;
    document.querySelector(".cpa-toolbar")?.remove();
    if (expired === true) alert("관리자 로그인이 만료되었습니다. 다시 로그인하려면 주소 끝에 #coupon-admin 을 붙여 접속하세요.");
    try { C.renderCoupons(await C.fetchPublicCoupons()); } catch (e) { C.showCouponMessage("쿠폰 정보를 불러올 수 없습니다."); }
  }

  async function remove(coupon) {
    if (!confirm(`"${coupon.name}" 쿠폰을 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`)) return;
    try {
      await api("DELETE", { id: coupon.id, version: coupon.version });
      await reload();
    } catch (err) {
      if (err.status === 401) return exitAdmin(true);
      alert(err.message);
      if (err.status === 409) await reload();
    }
  }

  // ---------- 편집기 ----------
  /** Date → datetime-local 값 (한국 시간) */
  function toKstInput(date) {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(date).map((x) => [x.type, x.value]));
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
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

  function showEditor(coupon) {
    const isNew = !coupon;
    const name = el("input", { type: "text", maxlength: "60", value: coupon?.name || "", placeholder: "예) 개발 팀 노트 #35" });
    const code = el("input", { type: "text", maxlength: "40", value: coupon?.code || "", placeholder: "예) 0LEUN98G", autocomplete: "off", spellcheck: "false" });

    const defaultEnd = new Date(Date.now() + 7 * 864e5);
    const ends = el("input", { type: "datetime-local", value: toKstInput(coupon?.endsAt || defaultEnd) });
    if (!coupon?.endsAt && isNew) ends.value = toKstInput(defaultEnd).slice(0, 11) + "23:59";
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
      const updateThumb = () => {
        thumb.style.backgroundImage = `url("${C.itemFrameUrl(grade.value)}"), url("${C.itemImageUrl(iname.value)}")`;
      };
      iname.addEventListener("input", updateThumb);
      grade.addEventListener("change", updateThumb);
      updateThumb();
      const row = el("div", { class: "cpa-item" }, [
        thumb, iname, qty, grade,
        el("button", { type: "button", class: "cpa-remove", title: "구성품 삭제", "aria-label": "구성품 삭제", text: "×", onclick: () => row.remove() }),
      ]);
      list.appendChild(row);
      return iname;
    }
    (coupon?.items?.length ? coupon.items : [undefined]).forEach((it) => addItemRow(it));

    const bulk = el("textarea", { placeholder: "한 줄에 하나씩: 이름x수량x등급\n예) 궁극체 스킬 강화석x5x4" });
    const bulkBox = el("div", { class: "cpa-field", hidden: true }, [
      bulk,
      el("div", { class: "cpa-toolbar", style: "justify-content:flex-end;margin:6px 0 0" }, [
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

    const error = el("p", { class: "cpa-error" });
    const save = el("button", { type: "submit", class: "cpa-btn cpa-primary", text: isNew ? "등록" : "저장" });
    const cancel = el("button", { type: "button", class: "cpa-btn", text: "취소" });

    const readForm = () => ({
      name: name.value.trim(),
      code: code.value.trim(),
      ends_at: noEnd.checked || !ends.value ? null : `${ends.value}:00+09:00`,
      items: [...list.children].map((r) => {
        const [n, q] = r.querySelectorAll("input");
        return { name: n.value.trim(), qty: Number(q.value), grade: Number(r.querySelector("select").value) };
      }).filter((it) => it.name),
    });
    const initial = JSON.stringify(readForm());

    const form = el("form", {}, [
      el("div", { class: "cpa-field" }, [el("span", { class: "cpa-label", text: "쿠폰 이름" }), name]),
      el("div", { class: "cpa-field" }, [el("span", { class: "cpa-label", text: "쿠폰 번호" }), code]),
      el("div", { class: "cpa-field" }, [
        el("span", { class: "cpa-label", text: "마감 일시 (한국 시간)" }),
        el("div", { class: "cpa-inline" }, [ends, el("label", { class: "cpa-check" }, [noEnd, "기한 미정"])]),
        el("p", { class: "cpa-hint", text: "마감 일시가 지나면 메인 페이지에서 자동으로 숨겨집니다." }),
      ]),
      el("div", { class: "cpa-field" }, [
        el("span", { class: "cpa-label", text: "구성품" }),
        el("div", { class: "cpa-item-head" }, [el("span"), el("span", { text: "이름" }), el("span", { text: "수량" }), el("span", { text: "등급" }), el("span")]),
        list,
        el("div", { class: "cpa-toolbar", style: "justify-content:flex-start;margin:8px 0 0" }, [
          el("button", { type: "button", class: "cpa-btn", text: "+ 구성품 추가", onclick: () => addItemRow().focus() }),
          el("button", { type: "button", class: "cpa-btn", text: "한꺼번에 입력", onclick: () => { bulkBox.hidden = !bulkBox.hidden; if (!bulkBox.hidden) bulk.focus(); } }),
        ]),
      ]),
      bulkBox,
      error,
      el("div", { class: "cpa-footer" }, [cancel, save]),
    ]);

    let saving = false;
    const modal = openModal(isNew ? "쿠폰 등록" : "쿠폰 수정", form, {
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
      if (!data.name) { error.textContent = "쿠폰 이름을 입력해주세요."; return name.focus(); }
      if (!data.code) { error.textContent = "쿠폰 번호를 입력해주세요."; return code.focus(); }
      if (!noEnd.checked && !ends.value) { error.textContent = "마감 일시를 입력하거나 '기한 미정'을 선택해주세요."; return ends.focus(); }
      saving = true;
      save.disabled = cancel.disabled = true;
      error.textContent = "";
      try {
        if (isNew) await api("POST", data);
        else await api("PUT", { ...data, id: coupon.id, version: coupon.version });
        modal.close();
        await reload();
      } catch (err) {
        if (err.status === 401) { modal.close(); return exitAdmin(true); }
        error.textContent = err.message;
      } finally {
        saving = false;
        save.disabled = cancel.disabled = false;
      }
    });
    setTimeout(() => name.focus(), 0);
  }

  // ---------- 시작 ----------
  function open() {
    if (C.adminActive) return clearHash();
    if (getToken()) { clearHash(); enterAdmin(); } else if (location.hash === C.adminHash) showLogin();
  }

  window.DSRCouponAdmin = { open };
  open();
})();
