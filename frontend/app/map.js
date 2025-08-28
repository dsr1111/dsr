const selectElement = document.getElementById("con-dropdown");
const selectContainer = document.querySelector(".dropdown-con");

const mapSelectElement = document.getElementById("map-dropdown");
const mapSelectContainer = document.querySelector(".dropdown-map");

selectElement.addEventListener("click", function () {
  selectContainer.classList.toggle("open");
});

selectElement.addEventListener("blur", function () {
  selectContainer.classList.remove("open");
});

mapSelectElement.addEventListener("click", function () {
  mapSelectContainer.classList.toggle("open");
});

mapSelectElement.addEventListener("blur", function () {
  mapSelectContainer.classList.remove("open");
});

const conDropdown = document.getElementById("con-dropdown");
const mapDropdown = document.getElementById("map-dropdown");
const mapSelect = document.getElementById("map-dropdown");

// 각 지역에 대한 맵 옵션 데이터
const mapOptions = {
  파일섬: ["용의 눈 호수", "기어 사바나", "시작의 마을", "무한 산"],
  서버대륙: [
    "사막 지대",
    "어둠성 계곡",
    "개굴몬 성 1F",
    "개굴몬 성 2F",
    "어둠성 내부",
  ],
  "현실 세계": [
    "캠핑장",
    "빛의 언덕",
    "지하철 역",
    "오다이바 입구",
    "오다이바 북부",
    "시부야",
    "오다이바 남부",
    "국제 전시장",
  ],
  "스파이럴 마운틴": [
    "네트워크 바다",
    "수목 지구",
    "강철 도시",
    "강철 도시 지하",
    "어둠의 권역",
    "스파이럴 마운틴 정상",
    "???",
  ],
  "데이터 세계": [
    "테이머의 집",
    "빛의 언덕 과거(밤)",
    "네트워크"
  ],
};

// 이미지 업데이트 함수
function updateImage(selectedMap) {
  let imagePath;
  if (selectedMap === "???.webp") {
    imagePath = "https://media.dsrwiki.com/dsrwiki/map/ApocalymonArea.webp";
  } else {
    imagePath = `https://media.dsrwiki.com/dsrwiki/map/${selectedMap.replace(/\s+/g,)}.webp`;
  }

  // 이미지 요소를 700x700 크기로 업데이트
  imageContainer.innerHTML = `<img src="${imagePath}"  alt="${selectedMap}" width="700" height="700">`;
}

// 지역 선택 시 map-dropdown 옵션 업데이트 및 첫 번째 값으로 이미지 설정
conDropdown.addEventListener("change", function () {
  const selectedRegion = conDropdown.value;
  const options = mapOptions[selectedRegion];

  // map-dropdown 옵션을 업데이트
  mapSelect.innerHTML = "";
  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option;
    mapSelect.appendChild(opt);
  });

  // 첫 번째 옵션 선택 및 이미지 업데이트
  mapSelect.value = options[0];
  updateImage(options[0]);
});

// map-dropdown 선택 변경 시 이미지 업데이트
mapSelect.addEventListener("change", function () {
  updateImage(mapSelect.value);
});

// 페이지 로드 시 초기 이미지 설정
window.onload = function () {
  conDropdown.dispatchEvent(new Event("change"));
};

let maps = {};
let digimonData = {};

// JSON 데이터 처리
Promise.all([
  fetch("https://media.dsrwiki.com/data/csv/map.json").then(response => response.json()),
  fetch("https://media.dsrwiki.com/data/csv/digimon.json").then(response => response.json())
])
  .then(([mapData, digimonData]) => {
    maps = mapData;
    window.digimonData = digimonData; // 전역 변수로 저장
    initializeDropdownOptions(); // 드롭다운 옵션 초기화
  })
  .catch((error) => console.error("Error loading JSON data:", error));

function initializeDropdownOptions() {
  conDropdown.addEventListener("change", function () {
    const selectedRegion = conDropdown.value;
    const options = mapOptions[selectedRegion];

    // map-dropdown 옵션을 업데이트
    mapDropdown.innerHTML = "";
    options.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      mapDropdown.appendChild(opt);
    });

    // 첫 번째 옵션 선택 후 initMap 호출
    mapDropdown.value = options[0];
    initMap(); // 첫 번째 값에 대해 아이콘 표시
  });

  // 초기 설정
  conDropdown.dispatchEvent(new Event("change"));
}

const imageContainer = document.getElementById("image-container");
const dropdownContent = document.querySelector(".dropdown-content");

let currentPortals = [];
let currentWarps = [];
let currentShops = [];
let currentOverflows = [];
let currentDatacube = [];
let currentMobs = [];

function addTooltipToImage(imageElement, tooltipText) {
  imageElement.addEventListener("mouseenter", function (event) {
    // 데이터 큐브인 경우 특별한 툴팁 표시
    if (imageElement.classList.contains("datacube-image")) {
      showDatacubeTooltip(event, imageElement, tooltipText);
    } else {
      showTooltipAtImageBottomRight(event, imageElement, tooltipText);
    }
  });
  imageElement.addEventListener("mouseleave", hideTooltip);
}

function showTooltipAtImageBottomRight(event, imageElement, text) {
  let tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.innerHTML = text;

  const rect = imageElement.getBoundingClientRect();
  const imageBottomRightX = rect.right + window.pageXOffset;
  const imageBottomRightY = rect.bottom + window.pageYOffset;

  tooltip.style.position = "absolute";
  tooltip.style.left = `${imageBottomRightX - 10}px`;
  tooltip.style.top = `${imageBottomRightY}px`;

  document.body.appendChild(tooltip);
}

function hideTooltip() {
  const tooltip = document.querySelector(".tooltip");
  const imageContainer = document.querySelector(".datacube-image-container");
  if (tooltip) {
    tooltip.remove();
  }
  if (imageContainer) {
    imageContainer.remove();
  }
}

function preloadDatacubeImages(datacubeItems) {
  datacubeItems.forEach(item => {
    const tooltipText = item.tooltip;
    const imageName = tooltipText.startsWith('#') ? tooltipText.substring(1) : tooltipText;
    const datacubeImagePath = `https://media.dsrwiki.com/dsrwiki/map/datacube/${encodeURIComponent(imageName)}.webp`;
    const img = new Image();
    img.src = datacubeImagePath;
  });
}

function initMap() {
  mapDropdown.addEventListener("change", function () {
    const selectedMap = maps[mapDropdown.value];
    if (selectedMap) {
      // 배경 이미지 설정 및 현재 아이콘 목록 초기화
      imageContainer.style.backgroundImage = `url(${selectedMap.backgroundImage})`;
      imageContainer.innerHTML = "";
      currentPortals = [];
      currentWarps = [];
      currentShops = [];
      currentOverflows = [];
      currentDatacube = [];
      currentMobs = [];
      dropdownContent.innerHTML = "";

      if (selectedMap.datacube && selectedMap.datacube.length > 0) {
        preloadDatacubeImages(selectedMap.datacube);
      }

      // 카테고리별로 체크박스를 생성
      if (selectedMap.portals && selectedMap.portals.length > 0) {
        createCheckbox(
          "포탈",
          "toggle-portals",
          "포탈 아이콘",
          selectedMap.portals,
          currentPortals
        );
      }

      if (selectedMap.warps && selectedMap.warps.length > 0) {
        createCheckbox(
          "워프 포인트",
          "toggle-warps",
          "워프포인트 아이콘",
          selectedMap.warps,
          currentWarps
        );
      }

      if (selectedMap.shops && selectedMap.shops.length > 0) {
        createCheckbox(
          "상점",
          "toggle-shops",
          "상점 아이콘",
          selectedMap.shops,
          currentShops
        );
      }

      if (selectedMap.overflows && selectedMap.overflows.length > 0) {
        createCheckbox(
          "오버플로우",
          "toggle-overflows",
          "오버플로우 아이콘",
          selectedMap.overflows,
          currentOverflows
        );
      }

      if (selectedMap.datacube && selectedMap.datacube.length > 0) {
        createCheckbox(
          "데이터 큐브",
          "toggle-datacube",
          "데이터큐브 아이콘",
          selectedMap.datacube,
          currentDatacube
        );
      }

      if (selectedMap.mobs && selectedMap.mobs.length > 0) {
        createCheckbox(
          "악역 디지몬",
          "toggle-mob",
          "몬스터 아이콘",
          selectedMap.mobs,
          currentMobs
        );
      }
    }
  });

  // 페이지 로드 시 초기 맵 설정
  mapDropdown.dispatchEvent(new Event("change"));
}

function createCheckbox(
  labelText,
  checkboxId,
  iconName,
  mapData,
  currentArray
) {
  const div = document.createElement("div");
  const input = document.createElement("input");
  const label = document.createElement("label");

  input.type = "checkbox";
  input.id = checkboxId;

  // 기본 체크 상태 설정
  if (checkboxId === "toggle-warps" || checkboxId === "toggle-portals" || checkboxId === "toggle-shops" || checkboxId  === "toggle-overflows" || checkboxId  === "toggle-mob") {
    input.checked = true; // 워프포인트는 체크된 상태로 로드
  } else {
    input.checked = false; // 나머지는 체크 해제된 상태로 로드
  }

  label.htmlFor = checkboxId;
  label.textContent = labelText;

  div.appendChild(input);
  div.appendChild(label);
  dropdownContent.appendChild(div);

  input.addEventListener("change", function () {
    const displayStyle = this.checked ? "block" : "none";
    currentArray.forEach((item) => {
      if (item.mobImage) {
        item.mobImage.style.display = displayStyle;
        item.typeImage.style.display = displayStyle;
        if (item.evolIcon) {
          item.evolIcon.style.display = displayStyle;
        }
      } else {
        item.style.display = displayStyle;
      }
    });
  });

  mapData.forEach((item) => {
    const imgElement = document.createElement("img");
    imgElement.src = item.src;
    imgElement.style.position = "absolute";
    imgElement.style.top = `${item.top}px`;
    imgElement.style.left = `${item.left}px`;
    imgElement.style.display = input.checked ? "block" : "none";

    if (item.isAggressive) {
      imgElement.style.border = "2px solid red";
    }

    let evolIcon = null;
    if (item.evol) {
      evolIcon = document.createElement("img");
      evolIcon.src = "https://media.dsrwiki.com/dsrwiki/icon.webp";
      evolIcon.style.position = "absolute";
      evolIcon.style.top = `${item.top + 20}px`;
      evolIcon.style.left = `${item.left + 5}px`;
      evolIcon.style.width = "20px";
      evolIcon.style.height = "20px";
      evolIcon.style.zIndex = "1001";
      evolIcon.style.display = input.checked ? "block" : "none";
      imageContainer.appendChild(evolIcon);
    }

    if (checkboxId === "toggle-portals") {
      imgElement.classList.add("portal-image");
    } else if (checkboxId === "toggle-warps") {
      imgElement.classList.add("warp-image");
    } else if (checkboxId === "toggle-shops") {
      imgElement.classList.add("shop-image");
    } else if (checkboxId === "toggle-overflows") {
      imgElement.classList.add("overflows-image");
    } else if (checkboxId === "toggle-datacube") {
      imgElement.classList.add("datacube-image");
    }

    if (checkboxId === "toggle-mob") {
      imgElement.classList.add("mob-image");

      const typeElement = document.createElement("img");
      typeElement.src = `https://media.dsrwiki.com/dsrwiki/${item.type}.webp`;
      typeElement.style.position = "absolute";
      typeElement.style.top = `${item.top - 5}px`;
      typeElement.style.left = `${item.left - 5}px`;
      typeElement.style.width = `18px`;
      typeElement.style.height = `19px`;
      typeElement.style.zIndex = `1000`;
      typeElement.style.display = input.checked ? "block" : "none";

      addSpecialTooltipToMobs(
        imgElement,
        item.name,
        item.src,
        item.level,
        item.hp,
        item.강점,
        item.약점,
        item.items,
        item.evol
      );

      imageContainer.appendChild(imgElement);
      imageContainer.appendChild(typeElement);

      currentArray.push({
        mobImage: imgElement,
        typeImage: typeElement,
        evolIcon: evolIcon,
      });
    } else {
      addTooltipToImage(imgElement, item.tooltip);
      imageContainer.appendChild(imgElement);
      currentArray.push(imgElement);
    }
  });
}

function addSpecialTooltipToMobs(
  imageElement,
  name,
  src,
  level,
  hp,
  강점,
  약점,
  items,
  evol
) {
  let tooltip = null;

  imageElement.addEventListener("mouseenter", function (event) {
    // 이전 툴팁이 있다면 제거
    if (tooltip) {
      tooltip.remove();
    }
    tooltip = showSpecialTooltipAtImage(
      event,
      imageElement,
      name,
      src,
      level,
      hp,
      강점,
      약점,
      items,
      evol
    );
  });

  imageElement.addEventListener("mouseleave", function () {
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
  });
}

function showSpecialTooltipAtImage(
  event,
  imageElement,
  name,
  src,
  level,
  hp,
  강점,
  약점,
  items,
  evol
) {
  let tooltip = document.createElement("div");
  tooltip.className = "special-tooltip";

  // map.json의 mobs 데이터에서 해당 몹 정보 찾기
  const selectedMap = maps[mapDropdown.value];
  // src를 포함하여 정확한 몹 정보 찾기
  const mobData = selectedMap.mobs.find(m => m.name === name && m.src === src);
  
  // 강점과 약점 정보 가져오기 (콤마 앞은 이미지, 뒤는 텍스트)
  const 강점Parts = typeof mobData?.강점 === "string"
    ? mobData.강점.split(',').map(s => s.trim()).filter(Boolean)
    : Array.isArray(mobData?.강점) ? mobData.강점 : [];
  const 약점Parts = typeof mobData?.약점 === "string"
    ? mobData.약점.split(',').map(s => s.trim()).filter(Boolean)
    : Array.isArray(mobData?.약점) ? mobData.약점 : [];

  const 드랍아이템목록 = Array.isArray(items) ? items : [];

  tooltip.innerHTML = `
        <div style="text-align: center; font-size: 20px; color: rgb(0,183,255); font-weight: bold;">${name}</div>
        <div style="display: flex; align-items: center;">
            <img src="${src}" alt="${name}" style="width: 100px; height: 100px; margin-top: 5px; background-color: #000000; border-radius: 5px; border: 1px solid white;">
            <div style="margin-left: 5px;">
                <div style="margin-bottom: 5px; margin-top: 5px; color: white;"><span>레벨 :</span> ${level}</div>
                <div style="margin-bottom: 5px; color: white;"><span>체력 :</span> ${hp}</div>
                <div style="color: white;"><span>강점 :</span>
                  ${ 
                    강점Parts.length ? `
                      <div style=\"background-image: url('https://media.dsrwiki.com/dsrwiki/strongbackground.webp'); background-size: cover; width: 25px; height: 25px; display: inline-block; vertical-align: middle; margin-right: 5px;">
                        <img src=\"https://media.dsrwiki.com/dsrwiki/${강점Parts[0]}.webp\" alt=\" ${강점Parts[0]}\" style=\"width: 24px; height: 24px;\">
                      </div>
                      <span>${강점Parts[1] ? 강점Parts[1] : ''}</span>
                    ` : ''
                  }
                </div>
                <div style="color: white;"><span>약점 :</span>
                  ${ 
                    약점Parts.length ? `
                      <div style=\"background-image: url('https://media.dsrwiki.com/dsrwiki/weakbackground.webp'); background-size: cover; width: 25px; height: 25px; display: inline-block; vertical-align: middle; margin-right: 5px;">
                        <img src=\"https://media.dsrwiki.com/dsrwiki/${약점Parts[0]}.webp\" alt=\" ${약점Parts[0]}\" style=\"width: 24px; height: 24px;\">
                      </div>
                      <span>${약점Parts[1] ? 약점Parts[1] : ''}</span>
                    ` : ''
                  }
                </div>
            </div>
        </div>
        <div style="text-align: center; font-size: 20px; margin-top: 10px; color: rgb(0,183,255);"><strong>드랍 아이템</strong> 
            <ul style="margin-top: 5px; list-style-type: none; padding-left: 0; font-size: 14px; text-align: left; color: white;">
                ${드랍아이템목록
                  .map((item) => {
                    const itemImageSrc = item.includes("조합법")
                      ? "https://media.dsrwiki.com/dsrwiki/item/조합법.webp"
                      : `https://media.dsrwiki.com/dsrwiki/item/${item.trim()}.webp`;
                    return `
                        <li style=\"display: flex; align-items: center; justify-content: flex-start; margin-bottom: 5px; margin-left: 5px;">
                            <img src=\"${itemImageSrc}\"  alt=\" ${item.trim()}\" style=\"width: 25px; height: 25px; margin-right: 5px; background-color: black; border-radius: 5px; border: 1px solid grey; vertical-align: middle;\">
                            ${item.trim()}
                        </li>`;
                  })
                  .join("")}
            </ul>
        </div>
        ${ 
          evol
            ? `
        <div style=\"text-align: center; font-size: 20px; margin-top: 10px; color: rgb(0,183,255);\"><strong>조건 진화</strong></div>
        <div style=\"display: flex; justify-content: center; align-items: center; margin-top: 10px;\">
        <img src=\"https://media.dsrwiki.com/dsrwiki/digimon/${evol}/${evol}.webp\"  alt=\" ${evol}\" style=\"width: 50px; height: 50px; background-color: black; border-radius: 5px; border: 1px solid white;\">
         </div>
        `
            : ""
        }
    `;

  document.body.appendChild(tooltip);

  const rect = imageElement.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const imageBottomRightX = rect.right + window.pageXOffset;
  const imageBottomRightY = rect.bottom + window.pageYOffset;

  const containerRect = imageContainer.getBoundingClientRect();

  let tooltipTop = imageBottomRightY;
  if (
    tooltipTop + tooltipRect.height >
    containerRect.bottom + window.pageYOffset
  ) {
    tooltipTop =
      containerRect.bottom + window.pageYOffset - tooltipRect.height - 10;
  }
  tooltip.style.position = "absolute";
  tooltip.style.left = `${imageBottomRightX + 10}px`;
  tooltip.style.top = `${tooltipTop}px`;

  return tooltip;
}

function showDatacubeTooltip(event, imageElement, tooltipText) {
  // 툴팁 생성
  let tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.innerHTML = `<div style="color: white;">${tooltipText}</div>`;
  tooltip.style.pointerEvents = "none";

  // 데이터 큐브 이미지를 위한 별도의 컨테이너 생성
  let imageContainer = document.createElement("div");
  imageContainer.className = "datacube-image-container";
  imageContainer.style.position = "absolute";
  imageContainer.style.zIndex = "1000";
  imageContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  imageContainer.style.padding = "10px";
  imageContainer.style.borderRadius = "5px";
  imageContainer.style.border = "1px solid white";
  imageContainer.style.pointerEvents = "none";
  
  // 초기에 화면 밖에 위치시켜 로딩 중 보이지 않게 함
  imageContainer.style.left = "-9999px";
  imageContainer.style.top = "-9999px";


  // 데이터 큐브 이미지 경로 생성
  const imageName = tooltipText.startsWith('#') ? tooltipText.substring(1) : tooltipText;
  const datacubeImagePath = `https://media.dsrwiki.com/dsrwiki/map/datacube/${encodeURIComponent(imageName)}.webp`;

  // Create the image element
  const datacubeImage = document.createElement('img');
  datacubeImage.src = datacubeImagePath;
  datacubeImage.alt = tooltipText;
  datacubeImage.style.maxWidth = '540px';
  datacubeImage.style.maxHeight = '400px';
  datacubeImage.style.objectFit = 'contain';

  // Append the image to the image container
  imageContainer.appendChild(datacubeImage);

  // Append tooltip and imageContainer to body immediately for initial positioning and size calculation
  document.body.appendChild(tooltip);
  document.body.appendChild(imageContainer);

  // Initial tooltip positioning (relative to the imageElement)
  const rect = imageElement.getBoundingClientRect();
  // Use rect.left and rect.top directly for viewport coordinates
  // Then add window.pageXOffset/pageYOffset when setting style.left/top for document coordinates
  const tooltipLeft = rect.right - 10; // 10px left from image right edge
  const tooltipTop = rect.bottom; // At the bottom of the image element

  tooltip.style.position = "absolute";
  tooltip.style.left = `${tooltipLeft + window.pageXOffset}px`;
  tooltip.style.top = `${tooltipTop + window.pageYOffset}px`;

  // Wait for the image to load before calculating final position
  datacubeImage.onload = () => {
    requestAnimationFrame(() => {
      const tooltipRect = tooltip.getBoundingClientRect(); // Get current viewport position of tooltip

      // Set imageContainer dimensions based on loaded image dimensions + padding
      imageContainer.style.width = `${datacubeImage.offsetWidth + 20}px`; // image width + 10px padding left/right
      imageContainer.style.height = `${datacubeImage.offsetHeight + 20}px`; // image height + 10px padding top/bottom

      const imageContainerRect = imageContainer.getBoundingClientRect(); // Recalculate after setting dimensions

      let finalImageContainerViewportTop; // This will be a viewport coordinate

      // Check if the image container would go off the bottom of the viewport
      if (tooltipRect.bottom + 5 + imageContainerRect.height > window.innerHeight) {
        // If it goes off, position it above the tooltip
        finalImageContainerViewportTop = tooltipRect.top - imageContainerRect.height - 5;
      } else {
        // Otherwise, position it below the tooltip
        finalImageContainerViewportTop = tooltipRect.bottom + 5;
      }

      // Set the final position using document coordinates
      imageContainer.style.left = `${tooltipRect.left + window.pageXOffset}px`; // Same X as tooltip
      imageContainer.style.top = `${finalImageContainerViewportTop + window.pageYOffset}px`;
    });
  };

  // If image is already loaded (e.g., from cache), call onload manually
  if (datacubeImage.complete) {
    datacubeImage.onload();
  }
}

function updateActiveButton(activeButton) {
  mapButtons.forEach((button) => {
    button.classList.remove("active");
  });
  activeButton.classList.add("active");
}

const dropdownButton = document.querySelector(".dropdown-icon");
const arrow = document.querySelector(".arrow");

dropdownButton.addEventListener("click", function () {
  dropdownContent.classList.toggle("show");

  arrow.classList.toggle("rotate");
});