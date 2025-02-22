async function fetchDetectorData() {
  try {
    const response = await fetch("../data/csv/detector.json");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching detector data:", error);
  }
}

async function fetchCSVData(filename) {
  const response = await fetch(filename);
  const text = await response.text();
  const rows = text.split("\n").map((row) => row.split(","));
  return rows;
}

async function loadCSVData() {
  const skill1Data = await fetchCSVData("../data/csv/skill1.csv");
  const skill2Data = await fetchCSVData("../data/csv/skill2.csv");
  const skill3Data = await fetchCSVData("../data/csv/skill3.csv");
  return { skill1Data, skill2Data, skill3Data };
}

document.addEventListener("DOMContentLoaded", async function () {
  const detectorData = await fetchDetectorData();
  const csvData = await loadCSVData();

  const detectorButtons = document.querySelectorAll(".detector-button");

  detectorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      detectorButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      const detector = button.getAttribute("data-detector");
      displayMobButtons(detectorData, detector, csvData);
    });
  });
});

function displayMobButtons(detectorData, detector, csvData) {
  const mobButtonsContainer = document.querySelector(".mob-buttons");
  mobButtonsContainer.innerHTML = "";
  const digimons = detectorData[detector]?.["악역 디지몬"];

  if (!digimons) {
    console.error("No digimon data found for the selected detector");
    return;
  }

  Object.keys(digimons).forEach((digimonName) => {
    const digimon = digimons[digimonName];
    if (digimonName === "베놈묘티스몬") return;

    const button = document.createElement("button");
    button.className = "mob-button";
    button.innerText = digimonName;

    button.addEventListener("click", () => {
      document
        .querySelectorAll(".mob-button")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      showDigimonInfo(detector, digimonName, digimon, csvData, detectorData);
      if (digimonName === "묘티스몬") {
        createVenomMyotismonButton(detectorData, detector, csvData);
      } else {
        removeVenomMyotismonButton();
      }
    });

    mobButtonsContainer.appendChild(button);
  });
}

// 베놈묘티스몬 버튼 추가 함수
function createVenomMyotismonButton(detectorData, detector, csvData) {
  const mobButtonsContainer = document.querySelector(".mob-buttons");

  // 베놈묘티스몬 버튼이 이미 있는지 확인
  if (document.querySelector(".venom-myotismon-button")) return;

  const venomButton = document.createElement("button");
  venomButton.className = "mob-button venom-myotismon-button";
  venomButton.innerText = "베놈묘티스몬";

  venomButton.addEventListener("click", () => {
    document
      .querySelectorAll(".mob-button")
      .forEach((btn) => btn.classList.remove("active"));
    venomButton.classList.add("active");

    const venomDigimon = detectorData[detector]["악역 디지몬"]["베놈묘티스몬"];
    showDigimonInfo(
      detector,
      "베놈묘티스몬",
      venomDigimon,
      csvData,
      detectorData
    );
  });

  mobButtonsContainer.appendChild(venomButton);
}

// 베놈묘티스몬 버튼 삭제 함수
function removeVenomMyotismonButton() {
  const venomButton = document.querySelector(".venom-myotismon-button");
  if (venomButton) {
    venomButton.remove();
  }
}

function showDigimonInfo(
  detector,
  digimonName,
  digimon,
  csvData,
  detectorData
) {
  const mapName = digimon.map;
  const coordinates = digimon.coordinates;
  displayMapImage(mapName, digimonName, coordinates);
  showDigimonDetails(digimonName, digimon, detectorData, csvData);
}

function showDigimonDetails(digimonName, digimon, detectorData, csvData) {
  const detailContainer = document.querySelector(".detail");
  detailContainer.innerHTML = "";

  const formattedDigimonName = digimonName
    .replace(/\s/g, "_")
    .replace(/:/g, "_");
  const typeImagePath = `../image/${digimon.type}.webp`;

  const level = digimon.level || "정보 없음";

  const strongParts = digimon.strong ? digimon.strong.split(",") : ["없음"];
  const strongImage = strongParts[0]
    ? `../image/${strongParts[0].trim()}.webp`
    : null;
  const strongText = strongParts[1] ? strongParts[1].trim() : "";

  const weakParts = digimon.weak ? digimon.weak.split(",") : ["없음"];
  const weakImage = weakParts[0] ? `../image/${weakParts[0].trim()}.webp` : null;
  const weakText = weakParts[1] ? weakParts[1].trim() : "";

  const digimonImage = `
    <img src="../image/digimon/${formattedDigimonName}/${formattedDigimonName}.webp" 
         alt="${digimonName}" 
         style="width: 60%; border-radius: 10px; margin-bottom: 10px; background-color: #343434;"
         onerror="this.src='../image/digimon/default.webp';" >
  `;

  function cleanFileName(itemName) {
    return itemName
      .replace(/\s*x\s*\d+$/, "")  // 문자열 끝에 있는 "x 숫자" 제거
      .replace(/\s*x\s*\d+/g, "")  // 중간에 있는 "x 숫자" 제거
      .trim();
  }
  
  
  const itemRewards = digimon.item
    ? digimon.item
        .map((item) => {
          const [name, tradeStatus, dropType] = item.split(",");
          let imageName;

          if (name.includes("Data : ")) {
            imageName = name.replace(/\s/g, "").replace(":", "");
          } else {
            imageName = name.trim();
          }

          const finalImageName = imageName.includes("균열 데이터 상자") ? "균열 데이터 상자" : imageName;
          const imagePath = `../image/item/${finalImageName}.webp`;
          const tradeStatusColor =
            tradeStatus.trim() === "거래가능" ? "green" : "#D32F2F";
          const dropTypeColor =
            dropType.trim() === "확률" ? "green" : "#D32F2F";

          const itemsList = detectorData[name]?.items || {};

          const tooltipContent = Object.entries(itemsList)
            .map(([itemName, itemData]) => {
              const cleanName = cleanFileName(itemName); // 공백 및 괄호 유지하면서 변환
              const imagePath = `../image/item/${cleanName}.webp`;

              console.log(`${imageName}`);

              // 거래 상태 설정
              const tradeStatusText = itemData.tradeStatus === "거래가능" ? "(거래가능)" : "(거래불가)";
              const tradeStatusColor = itemData.tradeStatus === "거래가능" ? "green" : "red";

              return `
                <div style="display: flex; align-items: center;">
                  <img src="${imagePath}" 
                      style="width: 30px; height: 30px; margin: 5px; background-color: #343434; border-radius: 3px; border: 1px solid grey; vertical-align: middle;"
                      onerror="this.onerror=null; this.src='../image/item/default.webp';">
                  <span style="color: ${tradeStatusColor};">${tradeStatusText}</span>
                  <span>${itemName}</span>
                </div>`;
            })
            .join("");

          const extraInfo = name.includes("균열 데이터 상자")
            ? `<span style="background-color: #FFC107; color: white; border-radius: 5px; padding: 2px 4px; font-size: 13px; cursor: pointer; margin-left: 5px; position: relative;" onmouseover="showTooltip(this)" onmouseout="hideTooltip(this)">
                구성품 확인
                <div class="custom-tooltip" style="display: none; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-10px); background-color: rgba(0, 0, 0, 0.9); border: 1px solid #ccc; border-radius: 5px; padding: 5px; box-shadow: 0px 4px 8px rgba(0,0,0,0.1); white-space: nowrap; z-index: 10;">
                    ${tooltipContent}
                </div>
             </span>`
            : "";

          return `
        <div style="color: black; font-size: 14px; display: flex; align-items: center;">
          <img src="${imagePath}"  alt="${name.trim()}" style="width: 30px; height: 30px; margin-right: 5px; margin-top: 5px; background-color: #343434; border-radius: 3px; border: 1px solid grey; vertical-align: middle;">
          <span style="font-weight: bold;">${name.trim()}</span>
          <span style="background-color: ${tradeStatusColor}; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; font-weight:display: inline-block; text-align: center; vertical-align: middle; margin-left: 5px;">${tradeStatus.trim()}</span>
          <span style="background-color: ${dropTypeColor}; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; vertical-align: middle; margin-left: 5px;">${dropType.trim()}</span>
          ${extraInfo}
          </div>`;
        })
        .join("")
    : "<div style='color: black; font-size: 14px;'>정보 없음</div>";

  const gimmickText = digimon.gimmick
    ? `<p style="width: 150%; margin-left: 25px; color: black; font-size: 14px; font-weight: bold;">${digimon.gimmick}</p>`
    : "<p style='margin-left: 25px; color: black; font-size: 14px;'></p>";

  const skills =
    digimon.evol === "성장기"
      ? [
          {
            ...getSkillValue(csvData.skill1Data, digimonName),
            image: `../image/digimon/${formattedDigimonName}/skill1.webp`,
          },
          {
            ...getSkillValue(csvData.skill2Data, digimonName),
            image: `../image/digimon/${formattedDigimonName}/skill2.webp`,
          },
        ]
      : [
          {
            ...getSkillValue(csvData.skill1Data, digimonName),
            image: `../image/digimon/${formattedDigimonName}/skill1.webp`,
          },
          {
            ...getSkillValue(csvData.skill2Data, digimonName),
            image: `../image/digimon/${formattedDigimonName}/skill2.webp`,
          },
          {
            ...getSkillValue(csvData.skill3Data, digimonName),
            image: `../image/digimon/${formattedDigimonName}/skill3.webp`,
          },
        ];

  // 스킬 테이블 HTML
  let skillTableHtml = "<table style='width: 150%; margin-top: 10px;'>";
  skills.forEach((skill) => {
    const attributeImagePath = `../image/${skill.속성}.webp`;
    skillTableHtml += `
      <tr>
        <td rowspan="2" style="width: 40px;">
          <img src="${
            skill.image
          }"  alt="스킬 아이콘" style="width: 40px; border-radius: 50%; margin-top: 7px; margin-right: -25px; border: 0.1px solid grey; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);">
        </td>
        <td colspan="3" style="vertical-align: middle;">
          <div style="font-size: 14px; color: black; display: flex; align-items: center; margin-top: 0px; margin-left: 5px; font-weight: bold;">
            <span>${skill.skillName || "정보 없음"}</span> <!-- 스킬 이름 -->
            <img src="${attributeImagePath}"  alt="속성" style="width: 20px; margin-left: 5px; background-image: url('../image/background.webp'); background-size: 120%; background-position: center;"> <!-- 속성 이미지 -->
          </div>
        </td>
      </tr>
      <tr>
        <td style="background-color: ${
          skill.범위 === "원거리" ? "green" : "#D32F2F"
        }; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; vertical-align: middle; margin-left: 5px;">
          ${skill.범위 || "정보 없음"} <!-- 범위 -->
        </td>
        <td style="background-color: #D32F2F; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; vertical-align: middle; margin-left: 5px;">
          ${skill.targetCount || "정보 없음"} <!-- 타겟 수 -->
        </td>
        <td style="background-color: green; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; vertical-align: middle; margin-left: 5px;">
          ${
            isNaN(skill.타수) ? skill.타수 || "정보 없음" : `${skill.타수}타`
          } <!-- 타수 -->
        </td>
        ${
          skill.effect
            ? `<td style="background-color: #D32F2F; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; vertical-align: middle; margin-left: 5px;">
                ${skill.effect} <!-- 효과 -->
               </td>`
            : ""
        }
        ${
          skill.castingTurns
            ? `<td style="background-color: grey; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; margin-left: 5px;">
                추가 시전 턴 : ${skill.castingTurns}턴 <!-- 캐스팅 턴 -->
               </td>`
            : ""
        }
      </tr>
    `;
  });
  skillTableHtml += "</table>";

  const digimonInfo = `
  <div style="width: 60%; height: 65px; background: rgba(0, 0, 0, 0.5); border-radius: 10px; color: white; padding: 10px; position: relative; margin-bottom: 15px;">
    <img src="${typeImagePath}"  alt="${digimon.type}" 
         style="width: 25px; height: 25px; position: absolute; left: 15px; top: 30%; transform: translateY(-50%);"
         onerror="this.src='../image/default-type.webp';">
    <p class="font-applied2" style="text-align: center; margin: 0; line-height: 20px;">${digimonName}</p>
    <div style="position: relative; width: 100%; margin-top: 10px;">
      <img src="../image/map/hp.webp"  alt="HP Bar" style="width: 100%; height: 20px; display: block;">
      <p class="font-applied2" style="position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%); color: white;">
        ${digimon.HP}
      </p>
    </div>
    <div style="position: absolute; top: 0px; right: -220px; width: 200px;">
      <div style="display: flex; align-items: center; margin-top: 10px;">
        <p class="font-applied" style="color: black; font-weight: bold;">* 레벨 :</p>
        <p class="font-applied" style="color: black; margin-left: 5px; font-weight: bold;">${level}</p>
      </div>
      <div style="display: flex; align-items: center; width: 150%;">
        <div style="display: flex; align-items: center; margin-right: 15px;">
          <p class="font-applied" style="color: black; font-weight: bold;">* 강점 :</p>
          ${
            strongImage
              ? `<img src="${strongImage}"  alt="강점" style="width: 20px; margin: 0 5px; background-image: url('../image/strongbackground.webp'); background-size: 120%; background-position: center;">`
              : ""
          }
          <p class="font-applied" style="color: black; font-weight: bold;">${strongText}</p>
        </div>
        <div style="display: flex; align-items: center;">
          <p class="font-applied" style="color: black; font-weight: bold;">* 약점 :</p>
          ${
            weakImage
              ? `<img src="${weakImage}"  alt="약점" style="width: 20px; margin: 0 5px; background-image: url('../image/weakbackground.webp'); background-size: 120%; background-position: center;">`
              : ""
          }
          <p class="font-applied" style="color: black; font-weight: bold;">${weakText}</p>
        </div>
      </div>
      <div style="margin-top: 20px;">
        ${skillTableHtml} <!-- 스킬 테이블 삽입 -->
      </div>
    </div>
  </div>
`;

  const detailContent = `
  ${digimonInfo}
  ${digimonImage}
  <div style="display: flex; align-items: center; gap: 5px;">
    <img src="../image/info.svg"  alt="Info Icon" style="width: 20px; height: 20px;">
    <p class="font-applied" style="color: black; font-weight: bold; font-size: 16px;">패턴</p>
  </div>
    ${gimmickText}
  <div style="display: flex; align-items: center; gap: 5px; padding: 5px 0 0 0;">
    <img src="../image/info.svg"  alt="Info Icon" style="width: 20px; height: 20px;" >
    <p class="font-applied" style="color: black; font-weight: bold; font-size: 16px;">보상</p>
  </div>
  <div style="width: 150%; margin-left: 25px;">
    ${itemRewards}
  </div>
`;

  detailContainer.innerHTML = detailContent;
}

function getSkillValue(skillData, digimonName) {
  const row = skillData.find((row) => row[10].trim() === digimonName);
  if (row) {
    return {
      skillName: row[12] || "정보 없음", // 스킬 이름
      타수: row[13] || "정보 없음", // 타수
      범위: row[14] || "정보 없음", // 범위
      속성: row[15] || "정보 없음", // 속성
      target: row[16] || "정보 없음", // 타겟
      targetCount: row[17] || "", // 타겟 수
      effect: row[18] || "", // 효과
      castingTurns: row[19] || "", // 추가 시전 턴
    };
  }
  return null;
}

function displayMapImage(mapName, digimonName, coordinates) {
  const mapContainer = document.getElementById("map-container");
  mapContainer.innerHTML = "";

  let imageName =
    mapName === "???"
      ? "ApocalymonArea.webp"
      : `${mapName.replace(/\s/g, "")}.webp`;

  const img = document.createElement("img");
  img.src = `../image/map/detector/${imageName}`;
  img.alt = mapName;
  img.style.width = "500px";
  img.style.height = "500px";
  img.style.position = "relative";

  img.onerror = function () {
    console.error(`Failed to load image: ${img.src}`);
  };

  const formattedDigimonName = digimonName
    .replace(/\s/g, "_")
    .replace(/:/g, "_");

  const digimonImage = document.createElement("img");
  digimonImage.src = `../image/digimon/${formattedDigimonName}/${formattedDigimonName}.webp`;
  digimonImage.alt = digimonName;
  digimonImage.style.width = "30px";
  digimonImage.style.height = "30px";
  digimonImage.style.position = "absolute";
  digimonImage.style.backgroundColor = "#343434";
  digimonImage.style.borderRadius = "3px";

  const x = coordinates && coordinates.x ? coordinates.x : 0;
  const y = coordinates && coordinates.y ? coordinates.y : 0;

  digimonImage.style.left = `${x}px`;
  digimonImage.style.top = `${y}px`;

  digimonImage.classList.add("blinking");

  digimonImage.onerror = function () {
    console.error(`Failed to load digimon image: ${digimonImage.src}`);
  };

  mapContainer.appendChild(img);
  mapContainer.appendChild(digimonImage);
}

function showTooltip(element) {
  const tooltip = element.querySelector(".custom-tooltip");
  tooltip.style.display = "block";
}

function hideTooltip(element) {
  const tooltip = element.querySelector(".custom-tooltip");
  tooltip.style.display = "none";
}
