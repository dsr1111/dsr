document.addEventListener("DOMContentLoaded", function () {
  initCouponSystem();
  initLocationSchedule();
  initCalculator();
});

// ===== 위키 Supabase (쿠폰 / 이벤트 캘린더 / 레이드 타이머 공용) =====
// 데이터는 위키 전용 Supabase에서 읽습니다.
// 아래 두 값은 Supabase Dashboard → Project Settings → API 에서 복사합니다.
// (Project URL, 그리고 publishable 키 또는 anon 키 — 공개용 읽기 키라 노출되어도 괜찮습니다)
// 비워두면 DB 대신 예전 JSON 파일을 보여줍니다. 쓰기는 /.netlify/functions/site-admin (관리자 로그인 필요)만 가능합니다.
const COUPON_SUPABASE_URL = "https://mkytwqzrznusjwmcgpgw.supabase.co";
const COUPON_SUPABASE_ANON_KEY = "sb_publishable_DTiYb2mYuQCeJalBTlT_aA_9aukhrHV";
const COUPON_FALLBACK_URL = "https://media.dsrwiki.com/data/csv/coupon.json";
const COUPON_ADMIN_HASH = "#coupon-admin"; // "#admin" 도 가능
const COUPON_ADMIN_TOKEN_KEY = "dsrCouponAdminToken";

/** DB 행 → 화면용 쿠폰 { id, version, name, code, endsAt: Date|null, items: [{name, qty, grade}] } */
function normalizeDbCoupon(row) {
  return {
    id: row.id,
    version: row.version,
    name: row.name,
    code: row.code,
    endsAt: row.ends_at ? new Date(row.ends_at) : null,
    items: Array.isArray(row.items) ? row.items : [],
  };
}

/** 예전 coupon.json 형식 → 화면용 쿠폰 (DB를 못 불러왔을 때만 사용) */
function normalizeJsonCoupons(data) {
  return Object.entries(data).map(([name, c]) => {
    const endStr = String(c.period || "").split("~")[1]?.trim() || "";
    const [datePart, timePart = "23:59"] = endStr.replace(/\./g, "/").split(" ");
    const end = new Date(`${datePart} ${timePart}`);
    const unknown = /\?/.test(endStr) || isNaN(end.getTime());
    return {
      name,
      code: c.number,
      endsAt: unknown ? null : end,
      items: (c.items || []).map((s) => {
        const parts = String(s).split("x");
        const grade = Number(parts.pop());
        const qty = Number(parts.pop());
        return { name: parts.join("x").trim(), qty, grade };
      }),
    };
  });
}

function isCouponActive(coupon, now = new Date()) {
  return !coupon.endsAt || now <= coupon.endsAt;
}

/** 한국 시간 기준 "~2026.11.05 10:00" */
function formatCouponPeriod(endsAt) {
  if (!endsAt) return "~기한 미정";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(endsAt).map((x) => [x.type, x.value])
  );
  return `~${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}`;
}

/** 예전 JWT 형식 anon 키는 Authorization도 필요하고, 새 sb_publishable_ 키는 apikey만 보냅니다. */
function supabaseHeaders(key) {
  return key.startsWith("eyJ") ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
}

/** 공개 읽기 — calendar.js, raid-timer.js 에서도 사용합니다. query 예) "select=*&order=name.asc" */
window.DSRSupabase = {
  async select(table, query) {
    if (!COUPON_SUPABASE_URL || !COUPON_SUPABASE_ANON_KEY) throw new Error("Supabase 설정 없음");
    const res = await fetch(`${COUPON_SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: supabaseHeaders(COUPON_SUPABASE_ANON_KEY),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};

async function fetchPublicCoupons() {
  try {
    const nowIso = new Date().toISOString();
    const rows = await window.DSRSupabase.select("site_coupons",
      "select=id,name,code,ends_at,items,version"
      + `&or=(ends_at.is.null,ends_at.gte.${encodeURIComponent(nowIso)})`
      + "&order=ends_at.asc.nullsfirst,created_at.asc");
    return rows.map(normalizeDbCoupon);
  } catch (error) {
    console.warn("쿠폰 DB를 불러오지 못해 coupon.json을 사용합니다:", error);
    const res = await fetch(COUPON_FALLBACK_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return normalizeJsonCoupons(await res.json()).filter((c) => isCouponActive(c));
  }
}

let couponTooltips = [];

/**
 * 쿠폰 목록을 그립니다.
 * options.decorate(el, coupon): 관리자 모드에서 버튼 등을 붙일 때 사용
 * options.emptyText: 목록이 비었을 때 문구
 */
function renderCoupons(coupons, options = {}) {
  const container = document.querySelector(".coupon-container");
  if (!container) return;
  couponTooltips.forEach((t) => t.remove());
  couponTooltips = [];
  container.replaceChildren();

  if (!coupons.length) {
    const empty = document.createElement("p");
    empty.textContent = options.emptyText || "현재 사용 가능한 쿠폰이 없습니다.";
    empty.style.fontSize = "13px";
    container.appendChild(empty);
    return;
  }
  coupons.forEach((coupon) => {
    const el = createCouponElement(coupon, container);
    if (options.decorate) options.decorate(el, coupon);
  });
}

function showCouponMessage(text) {
  const container = document.querySelector(".coupon-container");
  if (!container) return;
  container.replaceChildren();
  const el = document.createElement("p");
  el.textContent = text;
  el.style.fontSize = "13px";
  container.appendChild(el);
}

async function initCouponSystem() {
  // 관리자 도구는 필요할 때만 불러옵니다 (일반 방문자는 다운로드하지 않음)
  let hasToken = false;
  try { hasToken = !!sessionStorage.getItem(COUPON_ADMIN_TOKEN_KEY); } catch (e) { /* 저장소 차단 */ }
  const wantsAdmin = () => location.hash === COUPON_ADMIN_HASH || location.hash === "#admin";
  const loadAdmin = () => {
    if (window.DSRSiteAdmin) return window.DSRSiteAdmin.open();
    if (document.querySelector("script[data-site-admin]")) return;
    const script = document.createElement("script");
    script.src = "app/site-admin.js?v=20261104";
    script.dataset.siteAdmin = "1";
    script.defer = true;
    document.head.appendChild(script);
  };
  window.addEventListener("hashchange", () => { if (wantsAdmin()) loadAdmin(); });
  if (wantsAdmin() || hasToken) loadAdmin();

  try {
    const coupons = await fetchPublicCoupons();
    if (window.DSRCoupons.adminActive) return; // 관리자 모드가 이미 목록을 그림
    renderCoupons(coupons);
  } catch (error) {
    if (window.DSRCoupons.adminActive) return;
    console.error("Error loading coupon data:", error);
    showCouponMessage("쿠폰 정보를 불러올 수 없습니다.");
  }
}

window.DSRCoupons = {
  supabaseUrl: COUPON_SUPABASE_URL,
  tokenKey: COUPON_ADMIN_TOKEN_KEY,
  adminHash: COUPON_ADMIN_HASH,
  normalizeDbCoupon,
  isCouponActive,
  formatCouponPeriod,
  fetchPublicCoupons,
  renderCoupons,
  showCouponMessage,
  itemImageUrl: couponItemImageUrl,
  itemFrameUrl: couponItemFrameUrl,
};

function createCouponElement(coupon, container) {
  const couponEl = document.createElement("div");
  couponEl.classList.add("coupon-list");

  const nameEl = document.createElement("div");
  nameEl.classList.add("coupon-name");
  const nameP = document.createElement("p");
  nameP.textContent = coupon.name;
  nameEl.appendChild(nameP);

  const periodEl = document.createElement("div");
  periodEl.classList.add("coupon-period");
  const periodP = document.createElement("p");
  periodP.textContent = formatCouponPeriod(coupon.endsAt);
  periodEl.appendChild(periodP);

  const showItemsText = document.createElement("span");
  showItemsText.classList.add("show-items");
  showItemsText.textContent = "구성품 확인";

  const numberEl = document.createElement("div");
  numberEl.classList.add("coupon-number");
  const numberP = document.createElement("p");
  numberP.textContent = coupon.code;
  numberEl.appendChild(numberP);

  const tooltip = createTooltip(coupon.items);
  document.body.appendChild(tooltip);
  couponTooltips.push(tooltip);
  setupTooltipEvents(showItemsText, tooltip);

  couponEl.appendChild(nameEl);
  couponEl.appendChild(periodEl);
  if (coupon.items.length) couponEl.appendChild(showItemsText);
  couponEl.appendChild(numberEl);

  container.appendChild(couponEl);

  numberEl.addEventListener("click", function () {
    navigator.clipboard
      .writeText(coupon.code)
      .then(() => alert(`쿠폰 번호가 복사되었습니다.`))
      .catch((err) => console.error("복사 실패:", err));
  });
  return couponEl;
}

function couponItemImageUrl(name) {
  const clean = String(name).trim().replace(/\s*\(\d+(일|시간)\)$/, "").replace(/^\[기간제\]\s*/, "");
  return `https://media.dsrwiki.com/dsrwiki/item/${clean.replace(/%/g, "^").replace(/["\\]/g, "")}.webp`;
}

function couponItemFrameUrl(grade) {
  return `https://media.dsrwiki.com/dsrwiki/item/item${Number(grade) || 1}.webp`;
}

function createTooltip(items) {
  const tooltip = document.createElement("div");
  tooltip.classList.add("tooltip-coupon");

  items.forEach((item) => {
    const itemElement = document.createElement("div");
    itemElement.className = "tooltip-item";
    itemElement.style.cssText = "display: flex; align-items: center; gap: 10px; margin-bottom: 10px;";

    const icon = document.createElement("div");
    icon.style.cssText = `
      position: relative; display: inline-block; width: 45px; height: 45px;
      background-color: #0a0e1a;
      background-image: url("${couponItemFrameUrl(item.grade)}"), url("${couponItemImageUrl(item.name)}");
      background-position: top left, center; background-repeat: no-repeat;
      background-size: auto, contain; border-radius: 5px;`;

    const qty = document.createElement("span");
    qty.style.cssText = "position: absolute; bottom: 0px; right: 0px; color: white; font-size: 11px; padding: 1px 3px; text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black;";
    qty.textContent = item.qty ?? "";
    icon.appendChild(qty);

    const label = document.createElement("span");
    label.textContent = item.name;

    itemElement.appendChild(icon);
    itemElement.appendChild(label);
    tooltip.appendChild(itemElement);
  });
  return tooltip;
}

function setupTooltipEvents(trigger, tooltip) {
  trigger.addEventListener("mouseover", (e) => {
    tooltip.style.display = "block";
    moveTooltip(e, tooltip);
  });

  trigger.addEventListener("mousemove", (e) => {
    moveTooltip(e, tooltip);
  });

  trigger.addEventListener("mouseout", () => {
    tooltip.style.display = "none";
  });
}

function moveTooltip(event, tooltip) {
  const tooltipHeight = tooltip.offsetHeight;
  const viewportHeight = window.innerHeight;
  const tooltipWidth = tooltip.offsetWidth;
  const viewportWidth = window.innerWidth;

  let topPosition = event.pageY + 10;

  // Check if tooltip goes below viewport
  if (event.clientY + tooltipHeight + 20 > viewportHeight) {
    topPosition = event.pageY - tooltipHeight - 10;
  }

  let leftPosition = event.pageX + 10;

  // Check if tooltip goes right of viewport
  if (event.clientX + tooltipWidth + 20 > viewportWidth) {
    leftPosition = event.pageX - tooltipWidth - 10;
  }

  tooltip.style.top = `${Math.max(10, topPosition)}px`;
  tooltip.style.left = `${Math.max(10, leftPosition)}px`;
}

function initLocationSchedule() {
  const schedule = {
    "무한 산": ["수요일", "금요일", "일요일"],
    "사막 지대": ["화요일", "목요일", "토요일"],
    "어둠성 계곡": ["월요일", "금요일", "일요일"],
    "현실 세계": ["월요일", "수요일", "토요일"],
    "스파이럴 마운틴": ["월요일", "목요일", "일요일"],
    "데이터 세계": ["화요일", "목요일", "토요일"]
  };

  const locationLinks = {
    "무한 산": "/overflow?map=무한 산",
    "사막 지대": "/overflow?map=사막 지대",
    "어둠성 계곡": "/overflow?map=어둠성 계곡",
    "현실 세계": "/overflow?map=현실 세계",
    "스파이럴 마운틴": "/overflow?map=스파이럴 마운틴",
    "데이터 세계": "/overflow?map=데이터 세계"
  };

  const today = new Date();
  const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const todayDay = days[today.getDay()];

  const locationsToday = [];
  for (const location in schedule) {
    if (schedule[location].includes(todayDay)) {
      locationsToday.push(`<a href="${locationLinks[location]}">${location}</a>`);
    }
  }

  const overflowContainer = document.querySelector(".overflow");
  if (overflowContainer) {
    const locationDiv = document.createElement("div");
    locationDiv.classList.add("locations-today");
    locationDiv.innerHTML = locationsToday.join("<br>");
    overflowContainer.appendChild(locationDiv);
  }
}

function initCalculator() {
  const currencyInput = document.getElementById("currency-input");
  const currencyType = document.getElementById("currency-type");
  const exchangeRate = document.getElementById("exchange-rate");
  const conversionResult = document.getElementById("conversion-result");

  if (!currencyInput || !currencyType || !exchangeRate || !conversionResult) return;

  function updateConversion() {
    const rateInput = parseFloat(exchangeRate.value);
    const inputValue = parseFloat(currencyInput.value);
    const conversionTypeValue = currencyType.value;

    if (isNaN(rateInput) || isNaN(inputValue)) {
      conversionResult.textContent = "0";
      return;
    }

    let result;
    let unit;

    if (conversionTypeValue === "crown-to-bit") {
      result = inputValue * (rateInput / 100) * 10000;
      unit = " 비트";
    } else {
      result = inputValue / ((rateInput * 10000) / 100);
      unit = " 크라운";
    }

    conversionResult.textContent = Math.round(result).toLocaleString() + unit;
  }

  currencyInput.addEventListener("input", updateConversion);
  currencyType.addEventListener("change", updateConversion);
  exchangeRate.addEventListener("input", updateConversion);
}
