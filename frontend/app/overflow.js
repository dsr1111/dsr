const buttons = document.querySelectorAll(".stage-btn");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
  });
});

const mapDropdown = document.getElementById("map-dropdown");
const selectPage = document.querySelector(".select-page");

mapDropdown.addEventListener("change", function () {
  const selectedMap = mapDropdown.value;
  if (selectedMap !== "default") {
    selectPage.style.backgroundImage = `url('https://media.dsrwiki.com/dsrwiki/overflow/${selectedMap}.webp')`;
  } else {
    selectPage.style.backgroundImage = `url('https://media.dsrwiki.com/dsrwiki/overflow/무한 산.webp')`;
  }
});

const dayElements = document.querySelectorAll(".day p");
const mapDays = {
  "무한 산": ["수요일", "금요일", "일요일"],
  "사막 지대": ["화요일", "목요일", "토요일"],
  "어둠성 계곡": ["월요일", "금요일", "일요일"],
  "현실 세계": ["월요일", "수요일", "토요일"],
  "스파이럴 마운틴": ["월요일", "목요일", "일요일"],
  "데이터 세계": ["화요일", "목요일", "토요일"],
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

setActiveDays("무한 산");

mapDropdown.addEventListener("change", function () {
  const selectedMap = mapDropdown.value;
  setActiveDays(selectedMap);
});

const stageButtons = document.querySelectorAll(".stage-btn");
const mobContainer = document.querySelector(".mob");

async function fetchCSV() {
  const response = await fetch("/data/csv/overflow.csv");
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
  const defaultMap = "무한 산";
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

    mobContainer.innerHTML = "<p>등장</p>";

    if (matchingRow) {
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

          const sanitizedFileName = mob.name.replace(/:/g, "_");

          const img = document.createElement("img");
          img.src = `https://media.dsrwiki.com/dsrwiki/digimon/${sanitizedFileName}/${sanitizedFileName}.webp`;
          img.alt = mob.name;

          const transformedAttribute =
            attributeMapping[mob.attribute] || mob.attribute;

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
      updateRepeatRewards(matchingRow);
    }
  });
}

function updateRepeatRewards(matchingRow) {
  const repeatContainer = document.querySelector(".repeat-item");

  repeatContainer.innerHTML = "<p>반복 클리어 보상</p>";

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
      img.src = `https://media.dsrwiki.com/dsrwiki/item/${fileName}.webp`;
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

  firstContainer.innerHTML = "<p>최초 클리어 보상</p>";

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
      img.src = `https://media.dsrwiki.com/dsrwiki/item/${fileName}.webp`;
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
      firstContainer.appendChild(itemContainer);
    }
  });
}

mapDropdown.addEventListener("change", () => {
  const selectedMap = mapDropdown.value;
  const activeStage = document.querySelector(".stage-btn.active").textContent;
  if (selectedMap !== "default") {
    updateMobImages(selectedMap, activeStage);
  }
});

stageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    stageButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    const selectedMap = mapDropdown.value;
    const selectedStage = button.textContent;

    if (selectedMap !== "default") {
      updateMobImages(selectedMap, selectedStage);
    }
  });
});

const selectElement = document.getElementById("map-dropdown");
const selectContainer = document.querySelector(".map-select");

selectElement.addEventListener("click", function () {
  selectContainer.classList.toggle("open");
});

selectElement.addEventListener("blur", function () {
  selectContainer.classList.remove("open");
});

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedMap = urlParams.get("map") || "무한 산";

  const mapDropdown = document.getElementById("map-dropdown");
  mapDropdown.value = selectedMap;

  const selectPage = document.querySelector(".select-page");
  selectPage.style.backgroundImage = `url('https://media.dsrwiki.com/dsrwiki/overflow/${selectedMap}.webp')`;

  setActiveDays(selectedMap);

  const defaultStage =
    document.querySelector(".stage-btn.active")?.textContent || "1 Stage";
  updateMobImages(selectedMap, defaultStage);
});