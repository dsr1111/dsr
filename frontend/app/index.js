document.addEventListener("DOMContentLoaded", function () {
  var calendarEl = document.getElementById("calendar");
  var tooltipEl = document.getElementById("tooltip");
  calendarEl.style.width = "65%";
  calendarEl.style.margin = "0 auto";

  var calendar = new FullCalendar.Calendar(calendarEl, {
    locale: "ko",
    contentHeight: "auto",
    aspectRatio: 1,
    initialView: "dayGrid",
    dayHeaders: true,
    dayMaxEventRows: 7,
    headerToolbar: {
      left: "currentMonth",
      center: "customText",
      right: "",
    },
    customButtons: {
      currentMonth: {
        text: "",
        click: function () {},
      },
      customText: {
        text: "디지몬 슈퍼럼블 일정",
        click: function () {},
      },
    },
    visibleRange: function () {
      let start = new Date();
      start.setDate(start.getDate() - start.getDay());
      let end = new Date(start);
      end.setDate(start.getDate() + 27);
      return { start: start, end: end };
    },
    dayCellContent: function (info) {
      return { html: `<span>${info.date.getDate()}</span>` };
    },
    events: [
      {
        title: "디지패스 2025 시즌4",
        start: "2025-04-10T00:00:00",
        end: "2025-05-08T23:59:59", // 시간을 포함한 종료일 (5월 8일 23시 59분 59초)
        backgroundColor: "gray",
      },
      {
        title: "5월 연휴 월드 버프",
        start: "2025-05-01T00:00:00",
        end: "2025-05-06T23:59:59", // 시간을 포함한 종료일 (5월 6일 23시 59분 59초)
        backgroundColor: "#ffcccc",
        textColor: "#990000",
      },
      {
        title: "나도 진화할래 이벤트",
        start: "2025-04-24T00:00:00",
        end: "2025-05-08T23:59:59", // 시간을 포함한 종료일
        backgroundColor: "skyblue",
        textColor: "black",
      },
      {
        title: "잃어버린 동심 이벤트",
        start: "2025-04-24T00:00:00",
        end: "2025-05-08T23:59:59", // 시간을 포함한 종료일
        backgroundColor: "green",
        textColor: "black",
      },
      {
        title: "보코몬의 서신 이벤트",
        start: "2025-04-24T00:00:00",
        end: "2025-05-31T23:59:59", // 시간을 포함한 종료일
        backgroundColor: "purple",
        textColor: "white",
      }
    ],
    datesSet: function (info) {
      const currentMonthText = info.view.currentStart.toLocaleString("ko", {
        month: "long",
        year: "numeric",
      });
      document.querySelector(".fc-currentMonth-button").innerHTML =
        currentMonthText;
    },

    eventDidMount: function (info) {
      // 시작일과 종료일 포맷팅 (시간 제외)
      const startDate = info.event.start.toLocaleDateString();
      const endDate = info.event.end ? info.event.end.toLocaleDateString() : startDate;
      
      // 툴팁 텍스트
      const tooltipText = `${info.event.title}<br>${startDate} ~ ${endDate}`;

      info.el.addEventListener("mouseover", function () {
        tooltipEl.style.display = "block";
        tooltipEl.innerHTML = tooltipText;
      });

      info.el.addEventListener("mousemove", function (event) {
        tooltipEl.style.left = event.pageX + 10 + "px";
        tooltipEl.style.top = event.pageY + 10 + "px";
      });

      info.el.addEventListener("mouseout", function () {
        tooltipEl.style.display = "none";
      });
    },
  });

  calendar.render();
});

document.addEventListener("DOMContentLoaded", function () {
  const today = new Date();

  fetch("../data/csv/coupon.json")
    .then((response) => response.json())
    .then((data) => {
      const couponContainer = document.querySelector(".coupon-container");
      let availableCoupons = 0;

      for (let couponName in data) {
        const couponData = data[couponName];

        const endDateStr = couponData.period.split("~")[1].trim().replace(/\./g, "/");
        const parts = endDateStr.split(" ");
        const datePart = parts[0];
        const timePart = parts.length > 1 ? parts[1] : "23:59";

        const endDateWithTime = `${datePart} ${timePart}`;
        const endDate = new Date(endDateWithTime);
        
        // 오늘 날짜의 시간 부분을 제거하고 비교
        const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
        // 디버깅용 로그 추가 (실제 배포 전 제거)
        console.log(`쿠폰: ${couponName}, 종료일: ${endDateWithTime}, 파싱된 날짜: ${endDate}, 오늘: ${today}`);

        if (today <= endDate) {
          availableCoupons++;
          const couponEl = document.createElement("div");
          couponEl.classList.add("coupon-list");

          const nameEl = document.createElement("div");
          nameEl.classList.add("coupon-name");
          nameEl.innerHTML = `<p>${couponName}</p>`;

          const periodEl = document.createElement("div");
          periodEl.classList.add("coupon-period");
          periodEl.innerHTML = `<p>${couponData.period}</p>`;

          const showItemsText = document.createElement("span");
          showItemsText.classList.add("show-items");
          showItemsText.textContent = "구성품 확인";

          const tooltip = document.createElement("div");
          tooltip.classList.add("tooltip-coupon");

          couponData.items.forEach((item) => {
            const [itemName, itemQty, itemGrade] = item.split("x");
            let cleanItemName = itemName.trim().replace(/\s*\(\d+일\)$/, "");
            const sanitizedName = cleanItemName.replace(/%/g, "^");
            const imgPath = `../image/item/${sanitizedName}.webp`;
            const backgroundPath = `../image/item/item${itemGrade.trim()}.webp`;

            const itemElement = document.createElement("div");
            itemElement.classList.add("tooltip-item");
            itemElement.style.display = "flex";
            itemElement.style.alignItems = "center";
            itemElement.style.gap = "10px";
            itemElement.style.marginBottom = "10px";

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

          document.body.appendChild(tooltip);

          showItemsText.addEventListener("mouseover", function (event) {
            tooltip.style.display = "block";
            tooltip.style.left = `${event.pageX + 10}px`;
            tooltip.style.top = `${event.pageY + 10}px`;
          });

          showItemsText.addEventListener("mousemove", function (event) {
            positionTooltip(event);
          });
          
          showItemsText.addEventListener("mouseout", function () {
            tooltip.style.display = "none";
          });
          
          function positionTooltip(event) {
            const tooltipHeight = tooltip.offsetHeight;
            const viewportHeight = window.innerHeight;
            const cursorY = event.clientY;
            
            if (cursorY > viewportHeight / 2) {
              tooltip.style.top = `${event.pageY - tooltipHeight - 10}px`;
            } else {
              tooltip.style.top = `${event.pageY + 10}px`;
            }
          
            tooltip.style.left = `${event.pageX + 10}px`;
          }

          const numberEl = document.createElement("div");
          numberEl.classList.add("coupon-number");
          numberEl.innerHTML = `<p>${couponData.number}</p>`;

          couponEl.appendChild(nameEl);
          couponEl.appendChild(periodEl);
          couponEl.appendChild(showItemsText);
          couponEl.appendChild(numberEl);

          couponContainer.appendChild(couponEl);

          numberEl.addEventListener("click", function () {
            navigator.clipboard
              .writeText(couponData.number)
              .then(() => alert(`쿠폰 번호가 복사되었습니다.`))
              .catch((err) => console.error("복사 실패:", err));
          });
        }
      }
      if (availableCoupons === 0) {
        const noCouponsEl = document.createElement("p");
        noCouponsEl.textContent = "현재 사용 가능한 쿠폰이 없습니다.";
        noCouponsEl.style.fontSize = "13px";
        couponContainer.appendChild(noCouponsEl);
      }
    })
    .catch((error) => console.error("Error loading coupon data:", error));
});

document.addEventListener("DOMContentLoaded", function () {
  const today = new Date();
  const days = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ];
  const todayDay = days[today.getDay()];

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

  const locationsToday = [];
  for (const location in schedule) {
    if (schedule[location].includes(todayDay)) {
      const link = locationLinks[location];
      locationsToday.push(`<a href="${link}">${location}</a>`);
    }
  }

  const locationDiv = document.createElement("div");
  locationDiv.classList.add("locations-today");
  locationDiv.innerHTML = locationsToday.join("<br>");

  document.querySelector(".overflow").appendChild(locationDiv);
});

document
  .getElementById("currency-input")
  .addEventListener("input", updateConversion);
document
  .getElementById("currency-type")
  .addEventListener("change", updateConversion);
document
  .getElementById("exchange-rate")
  .addEventListener("input", updateConversion);

function updateConversion() {
  const rateInput = parseFloat(document.getElementById("exchange-rate").value);
  const inputValue = parseFloat(
    document.getElementById("currency-input").value
  );
  const conversionType = document.getElementById("currency-type").value;
  const resultElement = document.getElementById("conversion-result");

  // Ensure valid rate and input values
  if (isNaN(rateInput) || isNaN(inputValue)) {
    resultElement.textContent = "0";
    return;
  }

  let result;

  if (conversionType === "crown-to-bit") {
    result = inputValue * (rateInput / 100) * 10000; // Convert 크라운 to 비트
    unit = " 비트";
  } else {
    result = inputValue / ((rateInput * 10000) / 100);
    unit = " 크라운";
  }

  resultElement.textContent = Math.round(result).toLocaleString() + unit;
}
