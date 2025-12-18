document.addEventListener("DOMContentLoaded", function () {
  initCouponSystem();
  initLocationSchedule();
  initCalculator();
});

function initCouponSystem() {
  const today = new Date();

  fetch("https://media.dsrwiki.com/data/csv/coupon.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const couponContainer = document.querySelector(".coupon-container");
      if (!couponContainer) return;

      let availableCoupons = 0;

      for (let couponName in data) {
        const couponData = data[couponName];

        const endDateStr = couponData.period.split("~")[1].trim().replace(/\./g, "/");
        const parts = endDateStr.split(" ");
        const datePart = parts[0];
        const timePart = parts.length > 1 ? parts[1] : "23:59";

        const endDateWithTime = `${datePart} ${timePart}`;
        const endDate = new Date(endDateWithTime);
        const isUnknownEnd = /\?\?/.test(endDateStr);
        const isValidEnd = !isNaN(endDate.getTime());

        // 오늘 날짜의 시간 부분을 제거하고 비교
        // const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (isUnknownEnd || (isValidEnd && today <= endDate)) {
          availableCoupons++;
          createCouponElement(couponName, couponData, couponContainer);
        }
      }

      if (availableCoupons === 0) {
        const noCouponsEl = document.createElement("p");
        noCouponsEl.textContent = "현재 사용 가능한 쿠폰이 없습니다.";
        noCouponsEl.style.fontSize = "13px";
        couponContainer.appendChild(noCouponsEl);
      }
    })
    .catch((error) => {
      console.error("Error loading coupon data:", error);
      const couponContainer = document.querySelector(".coupon-container");
      if (couponContainer) {
        couponContainer.innerHTML = '';
        const errorEl = document.createElement("p");
        errorEl.textContent = "쿠폰 정보를 불러올 수 없습니다.";
        errorEl.style.fontSize = "13px";
        couponContainer.appendChild(errorEl);
      }
    });
}

function createCouponElement(name, data, container) {
  const couponEl = document.createElement("div");
  couponEl.classList.add("coupon-list");

  const nameEl = document.createElement("div");
  nameEl.classList.add("coupon-name");
  nameEl.innerHTML = `<p>${name}</p>`;

  const periodEl = document.createElement("div");
  periodEl.classList.add("coupon-period");
  periodEl.innerHTML = `<p>${data.period}</p>`;

  const showItemsText = document.createElement("span");
  showItemsText.classList.add("show-items");
  showItemsText.textContent = "구성품 확인";

  const numberEl = document.createElement("div");
  numberEl.classList.add("coupon-number");
  numberEl.innerHTML = `<p>${data.number}</p>`;

  // Tooltip logic
  const tooltip = createTooltip(data.items);
  document.body.appendChild(tooltip);

  setupTooltipEvents(showItemsText, tooltip);

  couponEl.appendChild(nameEl);
  couponEl.appendChild(periodEl);
  couponEl.appendChild(showItemsText);
  couponEl.appendChild(numberEl);

  container.appendChild(couponEl);

  numberEl.addEventListener("click", function () {
    navigator.clipboard
      .writeText(data.number)
      .then(() => alert(`쿠폰 번호가 복사되었습니다.`))
      .catch((err) => console.error("복사 실패:", err));
  });
}

function createTooltip(items) {
  const tooltip = document.createElement("div");
  tooltip.classList.add("tooltip-coupon");

  items.forEach((item) => {
    const [itemName, itemQty, itemGrade] = item.split("x");
    let cleanItemName = itemName.trim().replace(/\s*\(\d+(일|시간)\)$/, "").replace(/^\[기간제\]\s*/, "");
    const sanitizedName = cleanItemName.replace(/%/g, "^");
    const imgPath = `https://media.dsrwiki.com/dsrwiki/item/${sanitizedName}.webp`;
    const backgroundPath = `https://media.dsrwiki.com/dsrwiki/item/item${itemGrade.trim()}.webp`;

    const itemElement = document.createElement("div");
    itemElement.className = "tooltip-item";
    itemElement.style.cssText = "display: flex; align-items: center; gap: 10px; margin-bottom: 10px;";

    itemElement.innerHTML = `
        <div style="
            position: relative; 
            display: inline-block; 
            width: 45px; 
            height: 45px; 
            background-color: #0a0e1a;
            background-image: url('${backgroundPath}'), url('${imgPath}'); 
            background-position: top left, center;
            background-repeat: no-repeat;
            background-size: auto, contain;
            border-radius: 5px;">
            <span style="position: absolute; bottom: 0px; right: 0px; color: white; font-size: 11px; padding: 1px 3px; text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black;">
            ${itemQty ? itemQty.trim() : ""}
            </span>
        </div>
        <span>${itemName.trim()}</span>
        `;
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
    "무한 산": "overflow.html?map=무한 산",
    "사막 지대": "overflow.html?map=사막 지대",
    "어둠성 계곡": "overflow.html?map=어둠성 계곡",
    "현실 세계": "overflow.html?map=현실 세계",
    "스파이럴 마운틴": "overflow.html?map=스파이럴 마운틴",
    "데이터 세계": "overflow.html?map=데이터 세계"
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
