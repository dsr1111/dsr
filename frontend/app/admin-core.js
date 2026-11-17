// 관리자 도구 공통 코드 — 메인(쿠폰·레이드·이벤트) / 디지몬 / 탐지기 / 진화 관리자가 같이 씁니다.
// 각 페이지의 관리자 파일보다 먼저 불러와집니다 (일반 방문자는 다운로드하지 않음).
// 로그인 토큰, 서버 요청, 화면 요소 만들기, 모달 창, 로그인 창, 이미지 줄이기가 들어 있습니다.
(function () {
  if (window.DSRAdminCore) return;

  const TOKEN_KEY = "dsrCouponAdminToken";
  const LOGIN_API = "/.netlify/functions/site-admin";
  const ADMIN_HASHES = ["#admin", "#coupon-admin"];

  // ---------- 화면 요소 ----------
  /** el("div", { class, text, style: {...}, onclick, 그 밖의 속성 }, [자식들]) */
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
  const input = (value, attrs = {}) => el("input", { type: "text", value: value ?? "", ...attrs });

  // ---------- 로그인 토큰 ----------
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

  // ---------- 서버 요청 ----------
  /** JSON 요청. 실패하면 { message, status } 를 가진 Error 를 던집니다 (로그인 만료 401 이면 토큰도 지움) */
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

  /** 주소 끝의 #admin / #coupon-admin 지우기 */
  function clearHash() {
    if (ADMIN_HASHES.includes(location.hash)) history.replaceState(null, "", location.pathname + location.search);
  }
  const wantsAdmin = () => ADMIN_HASHES.includes(location.hash);

  // ---------- 이미지 ----------
  /** 파일 → 최대 크기(max px)에 맞춰 줄인 webp data URL (브라우저가 webp를 못 만들면 png) */
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

  // ---------- 모달 창 ----------
  const modalStack = [];
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalStack.length) modalStack[modalStack.length - 1].tryClose();
  });
  const closeAllModals = () => [...modalStack].reverse().forEach((m) => m.close());

  /**
   * 페이지별 디자인(CSS 클래스 접두어)에 맞춘 도구 모음.
   * prefix "dga" → dga-modal, dga-overlay, dga-field, dga-label, dga-hint, dga-btn, dga-primary, dga-error, dga-footer
   */
  function ui(prefix) {
    const c = (name) => `${prefix}-${name}`;

    function field(label, control, hint) {
      return el("div", { class: c("field") }, [
        el("span", { class: c("label"), text: label }),
        control,
        hint ? el("p", { class: c("hint"), text: hint }) : null,
      ]);
    }

    function openModal(title, body, { onRequestClose, wide } = {}) {
      const heading = el("h2", { text: title });
      const modal = el("div", { class: `${c("modal")}${wide ? ` ${c("wide")}` : ""}`, role: "dialog", "aria-modal": "true", "aria-label": title }, [heading, body]);
      const overlay = el("div", { class: c("overlay") }, modal);
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

    /** 비밀번호 로그인 창. 성공하면 토큰을 저장하고 onSuccess() */
    function showLogin(title, onSuccess) {
      const pw = el("input", { type: "password", autocomplete: "current-password", placeholder: "관리자 비밀번호" });
      const error = el("p", { class: c("error") });
      const submit = el("button", { type: "submit", class: `${c("btn")} ${c("primary")}`, text: "로그인" });
      const cancel = el("button", { type: "button", class: c("btn"), text: "취소" });
      const form = el("form", {}, [field("비밀번호", pw), error, el("div", { class: c("footer") }, [cancel, submit])]);
      const modal = openModal(title, form, { onRequestClose(close) { close(); clearHash(); } });
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
          await onSuccess();
        } catch (err) {
          error.textContent = err.message;
          pw.select();
        } finally {
          submit.disabled = false;
        }
      });
      setTimeout(() => pw.focus(), 0);
      return modal;
    }

    return { field, openModal, showLogin };
  }

  window.DSRAdminCore = {
    TOKEN_KEY, LOGIN_API,
    el, input, getToken, setToken, clearToken, request, clearHash, wantsAdmin,
    fileToDataUrl, closeAllModals, ui,
  };
})();
