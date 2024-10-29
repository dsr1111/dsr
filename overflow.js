const buttons = document.querySelectorAll(".stage-btn");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    // 모든 버튼에서 active 클래스 제거
    buttons.forEach((btn) => btn.classList.remove("active"));
    // 클릭한 버튼에 active 클래스 추가
    button.classList.add("active");
  });
});

const mapDropdown = document.getElementById("map-dropdown");
const selectPage = document.querySelector(".select-page");

mapDropdown.addEventListener("change", function () {
  const selectedMap = mapDropdown.value;
  if (selectedMap !== "default") {
    selectPage.style.backgroundImage = `url('image/overflow/${selectedMap}.png')`;
  } else {
    selectPage.style.backgroundImage = `url('image/overflow/기어 사바나.png')`;
  }
});

const dayElements = document.querySelectorAll(".day p");
const mapDays = {
  "기어 사바나": ["화요일", "목요일", "토요일"],
  "무한 산": ["수요일", "금요일", "일요일"],
  "사막 지대": ["화요일", "목요일", "토요일"],
  "어둠성 계곡": ["월요일", "금요일", "일요일"],
  "현실 세계": ["월요일", "수요일", "토요일"],
  "스파이럴 마운틴": ["월요일", "목요일", "일요일"],
};

function setActiveDays(mapName) {
  dayElements.forEach((day) => day.classList.remove("active"));

  if (mapDays[mapName]) {
    mapDays[mapName].forEach((dayName) => {
      dayElements.forEach((dayElement) => {
        if (dayElement.textContent === dayName) {
          dayElement.classList.add("active");
        }
      });
    });
  }
}

setActiveDays("기어 사바나");

mapDropdown.addEventListener("change", function () {
  const selectedMap = mapDropdown.value;
  setActiveDays(selectedMap);
});

const stageButtons = document.querySelectorAll(".stage-btn");
const mobContainer = document.querySelector(".mob");

async function fetchCSV() {
  const response = await fetch("overflow.csv");
  const data = await response.text();
  return parseCSV(data);
}

function parseCSV(data) {
  const rows = data
    .trim()
    .split("\n")
    .map((row) => row.split(","));
  const headers = rows[0];
  const rowsData = rows.slice(1);
  return rowsData.map((row) => {
    return headers.reduce((acc, header, idx) => {
      acc[header] = row[idx];
      return acc;
    }, {});
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const defaultMap = "기어 사바나";
  const defaultStage = "1 Stage";

  updateMobImages(defaultMap, defaultStage);
});

const attributeMapping = {
  데: "DATA",
  바: "VIRUS",
  백: "VACCINE",
  언: "UNKNOWN",
  프: "FREE",
};

function updateMobImages(map, stage) {
  fetchCSV().then((data) => {
    const stageNumber = stage.replace(/\D/g, "");
    const matchingRow = data.find(
      (row) => row["맵"] === map && row["층"] === stageNumber
    );

    // 기존 몹 이미지 초기화
    mobContainer.innerHTML = "<p>등장</p>";

    if (matchingRow) {
      // 몹 데이터 설정 및 이미지 추가
      const mobData = [
        {
          name: matchingRow["몹1"],
          level: matchingRow["레벨1"],
          attribute: matchingRow["속성1"],
          hp: matchingRow["체력1"],
        },
        {
          name: matchingRow["몹2"],
          level: matchingRow["레벨2"],
          attribute: matchingRow["속성2"],
          hp: matchingRow["체력2"],
        },
        {
          name: matchingRow["몹3"],
          level: matchingRow["레벨3"],
          attribute: matchingRow["속성3"],
          hp: matchingRow["체력3"],
        },
      ];

      mobData.forEach((mob) => {
        if (mob.name) {
          const container = document.createElement("div");
          container.classList.add("image-container");

          const img = document.createElement("img");
          img.src = `image/digimon/${mob.name}/${mob.name}.webp`;
          img.alt = mob.name;

          const transformedAttribute =
            attributeMapping[mob.attribute] || mob.attribute;

          // 툴팁 생성 및 내용 추가
          const tooltip = document.createElement("div");
          tooltip.classList.add("tooltip");
          tooltip.innerHTML = `
            레벨 : ${mob.level}<br><br>
            이름 : ${mob.name}<br><br>
            속성 : ${transformedAttribute}<br><br>
            HP: ${mob.hp}
          `;

          const overlay = document.createElement("div");
          overlay.classList.add("overlay");
          overlay.textContent = `${mob.level}`;

          container.appendChild(img);
          container.appendChild(overlay);
          container.appendChild(tooltip);
          mobContainer.appendChild(container);
        }
      });
      updateFirstClearRewards(matchingRow);
      // 반복 보상 업데이트 호출
      updateRepeatRewards(matchingRow);
    }
  });
}

// 반복 보상 업데이트 함수
function updateRepeatRewards(matchingRow) {
  const repeatContainer = document.querySelector(".repeat-item");

  // 기존 내용 초기화
  repeatContainer.innerHTML = "<p>반복 클리어 보상</p>";

  // 반복 보상 아이템과 개수를 배열로 저장
  const repeatRewards = [
    { name: matchingRow["반복1"], count: matchingRow["반복갯수1"] },
    { name: matchingRow["반복2"], count: matchingRow["반복갯수2"] },
    { name: matchingRow["반복3"], count: matchingRow["반복갯수3"] },
    { name: matchingRow["반복4"], count: matchingRow["반복갯수4"] },
  ];

  repeatRewards.forEach((reward) => {
    if (reward.name) {
      let fileName = reward.name;
      if (fileName === "Data : 미허가") {
        fileName = "Data미허가";
      }

      const itemContainer = document.createElement("div");
      itemContainer.classList.add("item-container");

      const img = document.createElement("img");
      img.src = `image/item/${fileName}.png`;
      img.alt = reward.name;
      img.classList.add("item-image");

      const tooltip = document.createElement("div");
      tooltip.classList.add("custom-tooltip");
      tooltip.textContent = reward.name;

      const count = document.createElement("span");
      count.classList.add("item-count");
      count.textContent = `x ${reward.count}`;

      itemContainer.appendChild(img);
      itemContainer.appendChild(count);
      itemContainer.appendChild(tooltip);
      repeatContainer.appendChild(itemContainer);
    }
  });
}

function updateFirstClearRewards(matchingRow) {
  const firstContainer = document.querySelector(".first-item");

  // 기존 내용 초기화
  firstContainer.innerHTML = "<p>최초 클리어 보상</p>";

  // 최초 보상 아이템과 개수를 배열로 저장
  const firstRewards = [
    { name: matchingRow["최초1"], count: matchingRow["최초갯수1"] },
    { name: matchingRow["최초2"], count: matchingRow["최초갯수2"] },
    { name: matchingRow["최초3"], count: matchingRow["최초갯수3"] },
    { name: matchingRow["최초4"], count: matchingRow["최초갯수4"] },
  ];

  firstRewards.forEach((reward) => {
    if (reward.name) {
      let fileName = reward.name;
      if (fileName === "Data : 미허가") {
        fileName = "Data미허가";
      }

      fileName = fileName.replace(/%/g, "^");

      const itemContainer = document.createElement("div");
      itemContainer.classList.add("item-container");

      const img = document.createElement("img");
      img.src = `image/item/${fileName}.png`;
      img.alt = reward.name;
      img.classList.add("item-image");

      const tooltip = document.createElement("div");
      tooltip.classList.add("custom-tooltip");
      tooltip.textContent = reward.name;

      const count = document.createElement("span");
      count.classList.add("item-count");
      count.textContent = `x${reward.count}`;

      itemContainer.appendChild(img);
      itemContainer.appendChild(count);
      itemContainer.appendChild(tooltip);
      firstContainer.appendChild(itemContainer);
    }
  });
}

// 드롭다운 변경 시 이벤트 처리
mapDropdown.addEventListener("change", () => {
  const selectedMap = mapDropdown.value;
  const activeStage = document.querySelector(".stage-btn.active").textContent;
  if (selectedMap !== "default") {
    updateMobImages(selectedMap, activeStage);
  }
});

// Stage 버튼 클릭 시 이벤트 처리
stageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // 현재 활성화된 버튼만 active 클래스 유지
    stageButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    const selectedMap = mapDropdown.value;
    const selectedStage = button.textContent;

    if (selectedMap !== "default") {
      updateMobImages(selectedMap, selectedStage);
    }
  });
});
