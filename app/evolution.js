let allData = [];
let conditionData = [];
let jogressData = [];
let charactersData = [];

async function loadCharactersCSV() {
  const response = await fetch("../data/csv/characters.csv");
  const data = await response.text();
  charactersData = parseCSV(data);
}

async function loadJogressCSV() {
  const response = await fetch("../data/csv/jogress.csv");
  const data = await response.text();
  jogressData = parseCSV(data);
}

async function loadCSV() {
  const response = await fetch("../data/csv/evolution.csv");
  const data = await response.text();
  allData = parseCSV(data);
  createDigimonImageList(allData);
}

async function loadConditionCSV() {
  const response = await fetch("../data/csv/condition.csv");
  const data = await response.text();
  conditionData = parseCSV(data);
}

function parseCSV(csv) {
  const lines = csv.split("\n");
  const result = [];
  const headers = lines[0].split(",");

  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentLine = lines[i].split(",");

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j].trim()] = currentLine[j] ? currentLine[j].trim() : null;
    }

    result.push(obj);
  }
  return result;
}

function filterDigimonByStage(stage) {
  let filteredData;

  if (stage === "all") {
    filteredData = allData;
  } else {
    filteredData = allData.filter(
      (digimon) => digimon.evolution_stage == stage
    );
  }

  createDigimonImageList(filteredData);
}

let selectedDigimon = null;

function createDigimonImageList(data) {
  const imageListContainer = document.getElementById("digimon-image-list");
  imageListContainer.innerHTML = "";

  data.forEach((digimon) => {
    const digimonName = digimon.name.replace(":", "_");

    const imgContainer = document.createElement("div");
    imgContainer.classList.add("digimon-image-container");

    const img = document.createElement("img");
    img.src = `../image/digimon/${digimonName}/${digimonName}.webp`;
    img.alt = digimon.name;
    img.width = 100;
    img.height = 100;

    img.addEventListener("mouseover", (event) => {
      showNameTooltip(event, digimon.name);
    });

    img.addEventListener("mouseout", hideNameTooltip);

    img.addEventListener("click", () => {
      if (selectedDigimon) {
        selectedDigimon.classList.remove("selected");
      }

      imgContainer.classList.add("selected");
      selectedDigimon = imgContainer;
      showEvolutionTreeForDigimon(digimon.name);
    });

    imgContainer.appendChild(img);
    imageListContainer.appendChild(imgContainer);
  });
}

function showNameTooltip(event, digimonName) {
  const nameTooltip = document.getElementById("name-tooltip");
  nameTooltip.textContent = digimonName;

  const imgRect = event.target.getBoundingClientRect();
  nameTooltip.style.left = `${imgRect.left}px`;
  nameTooltip.style.top = `${imgRect.bottom + window.scrollY - 195}px`;

  nameTooltip.classList.add("visible-tooltip");
}

function hideNameTooltip() {
  const nameTooltip = document.getElementById("name-tooltip");
  nameTooltip.classList.remove("visible-tooltip");
}

function showEvolutionTooltip(event, digimonName) {
  const evolutionTooltip = document.getElementById("evolution-tooltip");
  evolutionTooltip.textContent = digimonName;

  const imgRect = event.target.getBoundingClientRect();
  evolutionTooltip.style.left = `${imgRect.left + window.scrollX - 2}px`;
  evolutionTooltip.style.top = `${imgRect.bottom + window.scrollY - 190}px`;

  evolutionTooltip.classList.add("visible-tooltip");
}

function hideEvolutionTooltip() {
  const evolutionTooltip = document.getElementById("evolution-tooltip");
  evolutionTooltip.classList.remove("visible-tooltip");
}

let selectedDigimonName = null;

function showEvolutionTreeForDigimon(digimonName) {
  selectedDigimonName = digimonName;

  const lowerEvolutions = findAllLowerEvolutions(digimonName);
  const filteredData = filterTreeByDigimonName(digimonName);
  if (filteredData.length > 0) {
    createEvolutionTree(filteredData, lowerEvolutions);
  } else {
    alert("해당 디지몬의 진화트리를 찾을 수 없습니다.");
  }
}

function findAllLowerEvolutions(digimonName) {
  const lowerEvolutions = [];

  lowerEvolutions.push(digimonName);

  const directLowerEvolutions = allData.filter((digimon) => {
    return [
      digimon.evol1,
      digimon.evol2,
      digimon.evol3,
      digimon.evol4,
      digimon.evol5,
      digimon.evol6,
      digimon.evol7,
      digimon.evol8,
      digimon.evol9,
      digimon.evol10,
      digimon.evol11,
      digimon.조그레스,
    ].includes(digimonName);
  });

  directLowerEvolutions.forEach((digimon) => {
    lowerEvolutions.push(...findAllLowerEvolutions(digimon.name));
  });

  return lowerEvolutions;
}

function filterTreeByDigimonName(digimonName) {
  const selectedDigimon = allData.find(
    (digimon) => digimon.name === digimonName
  );

  if (!selectedDigimon) {
    return [];
  }

  const selectedEvolutionStage = parseInt(selectedDigimon.evolution_stage, 10);

  let evolutionStageToFilter;
  if (selectedEvolutionStage == 1) {
    evolutionStageToFilter = "1";
  } else if (selectedEvolutionStage >= 2 && selectedEvolutionStage <= 3) {
    evolutionStageToFilter = "2";
  } else if (selectedEvolutionStage >= 4 && selectedEvolutionStage <= 6) {
    evolutionStageToFilter = "3";
  }

  const filteredDigimons = allData.filter(
    (digimon) => digimon.evolution_stage === evolutionStageToFilter
  );

  const treeWithSearchedDigimon = filteredDigimons.filter((digimon) =>
    isDigimonInTree(digimon, digimonName)
  );
  return treeWithSearchedDigimon;
}

function isDigimonInTree(digimon, searchName) {
  if (digimon.name === searchName) {
    return true;
  }

  const evolutions = [
    digimon.evol1,
    digimon.evol2,
    digimon.evol3,
    digimon.evol4,
    digimon.evol5,
    digimon.evol6,
    digimon.evol7,
    digimon.evol8,
    digimon.evol9,
    digimon.evol10,
    digimon.evol11,
    digimon.조그레스,
  ].filter((e) => e);
  for (const evolution of evolutions) {
    const nextDigimon = allData.find((d) => d.name === evolution);
    if (nextDigimon && isDigimonInTree(nextDigimon, searchName)) {
      return true;
    }
  }

  return false;
}

function activateHighlightedChildPlusButtons(parentNode) {
  const highlightedChildNodes = parentNode.querySelectorAll(
    ".children-container .digimon.highlighted"
  );

  highlightedChildNodes.forEach((node) => {
    const digimonImage = Array.from(node.querySelectorAll("img")).find(
      (img) => !img.classList.contains("type-image")
    );
    const digimonName = digimonImage ? digimonImage.alt : "";

    if (digimonName !== selectedDigimonName) {
      const plusBtn = node.querySelector(".plus-btn");
      if (plusBtn && plusBtn.textContent === "+") {
        plusBtn.click();
      }
    }
  });
}

function createDigimonNode(digimon, data, lowerEvolutions) {
  const container = document.createElement("div");
  container.classList.add("digimon-container");

  const digimonDiv = document.createElement("div");
  digimonDiv.classList.add("digimon");

  const digimonName = digimon.name.replace(":", "_");

  const img = document.createElement("img");
  img.src = `../image/digimon/${digimonName}/${digimonName}.webp`;
  img.alt = digimon.name;

  const characterInfo = charactersData.find(
    (character) => character.name === digimon.name
  );
  if (characterInfo && characterInfo.type) {
    const typeImg = document.createElement("img");
    typeImg.src = `../image/${characterInfo.type}.webp`;
    typeImg.alt = characterInfo.type;
    typeImg.classList.add("type-image");
    digimonDiv.appendChild(typeImg);
  }

  img.addEventListener("mouseover", (event) =>
    showEvolutionTooltip(event, digimon.name)
  );
  img.addEventListener("mouseout", hideEvolutionTooltip);
  img.addEventListener("mouseover", (event) =>
    showTooltip(event, digimon.name)
  );
  img.addEventListener("mouseout", hideTooltip);

  if (lowerEvolutions.includes(digimon.name)) {
    digimonDiv.classList.add("highlighted");
  }

  const horizontalLine = document.createElement("div");
  horizontalLine.classList.add("horizontal-line");

  const verticalLine = document.createElement("div");
  verticalLine.classList.add("vertical-line");

  const childrenContainer = document.createElement("div");
  childrenContainer.classList.add("children-container");

  const evolutions = [
    { name: digimon.evol1, percent: digimon.percent1 },
    { name: digimon.evol2, percent: digimon.percent2 },
    { name: digimon.evol3, percent: digimon.percent3 },
    { name: digimon.evol4, percent: digimon.percent4 },
    { name: digimon.evol5, percent: digimon.percent5 },
    { name: digimon.evol6, percent: digimon.percent6 },
    { name: digimon.evol7, percent: digimon.percent7 },
    { name: digimon.evol8, percent: digimon.percent8 },
    { name: digimon.evol9, percent: digimon.percent9 },
    { name: digimon.evol10, percent: digimon.percent10 },
    { name: digimon.evol11, percent: digimon.percent11 },
    { name: digimon.조그레스, percent: digimon.percent },
  ].filter((e) => e.name);

  const hasEvolution = evolutions.length > 0;

  if (hasEvolution) {
    const plusBtn = document.createElement("button");
    plusBtn.classList.add("plus-btn");
    plusBtn.textContent = "+";

    plusBtn.addEventListener("click", () => {
      if (!childrenContainer.children.length) {
        evolutions.forEach((evolution) => {
          const nextDigimon = data.find((d) => d.name === evolution.name);
          if (nextDigimon) {
            const nextNode = createDigimonNode(
              nextDigimon,
              data,
              lowerEvolutions
            );

            const percentageText = document.createElement("span");
            percentageText.classList.add("percentage-text");
            percentageText.textContent = `${evolution.percent}%`;

            let horizontalConnector = nextNode.querySelector(
              ".horizontal-connector"
            );
            if (!horizontalConnector) {
              horizontalConnector = document.createElement("div");
              horizontalConnector.classList.add("horizontal-connector");
              nextNode.appendChild(horizontalConnector);
            }
            horizontalConnector.style.display = "block";
            horizontalConnector.appendChild(percentageText);

            if (evolution.name === digimon.조그레스) {
              const jogressImageName = digimon[Object.keys(digimon)[26]];

              const jogressImagePath = `../image/digimon/${jogressImageName}/${jogressImageName}.webp`;

              const jogressImage = document.createElement("img");
              jogressImage.src = jogressImagePath;
              jogressImage.classList.add("jogress-image");
              horizontalConnector.appendChild(jogressImage);
            }

            childrenContainer.appendChild(nextNode);
          }
        });
      }

      childrenContainer.classList.toggle("visible");

      updateAllVerticalLinesAndHorizontalConnectors();

      if (childrenContainer.classList.contains("visible")) {
        plusBtn.textContent = "−";
        horizontalLine.style.display = "block";
        verticalLine.style.display = "block";

        activateHighlightedChildPlusButtons(container);
      } else {
        plusBtn.textContent = "+";
        horizontalLine.style.display = "none";
        verticalLine.style.display = "none";
        verticalLine.style.height = "0";
        verticalLine.style.top = "0";
      }
    });

    digimonDiv.appendChild(plusBtn);
  }

  digimonDiv.appendChild(img);
  container.appendChild(digimonDiv);
  container.appendChild(horizontalLine);
  container.appendChild(verticalLine);
  container.appendChild(childrenContainer);

  return container;
}

function showJogressTooltip(jogressImage, jogressDataEntry) {
  const tooltip = document.getElementById("tooltip");

  if (!jogressDataEntry) {
    tooltip.textContent = "조그레스 데이터 없음";
  } else {
    let tableHtml = `<table class="jogress-tooltip-table">`;

    tableHtml += `
            <tr>
                <th colspan="3">조그레스 진화 조건</th>
            </tr>
        `;

    if (jogressDataEntry.digimon1 || jogressDataEntry.digimon2) {
      tableHtml += `
                <tr>
                    <th>디지몬</th>
                    <th>${jogressDataEntry.digimon1 || ""}</th>
                    <th>${jogressDataEntry.digimon2 || ""}</th>
                </tr>`;
    }

    const rows = [
      { label: "레벨", key1: "level1", key2: "level2" },
      { label: "유대감", key1: "bond1", key2: "bond2", suffix: "%" },
      {
        label: "힘",
        key1: "str1",
        key2: "str2",
        percentKey1: "str1%",
        percentKey2: "str2%",
      },
      {
        label: "지능",
        key1: "int1",
        key2: "int2",
        percentKey1: "int1%",
        percentKey2: "int2%",
      },
      {
        label: "수비",
        key1: "def1",
        key2: "def2",
        percentKey1: "def1%",
        percentKey2: "def2%",
      },
      {
        label: "저항",
        key1: "res1",
        key2: "res2",
        percentKey1: "res1%",
        percentKey2: "res2%",
      },
      {
        label: "속도",
        key1: "spd1",
        key2: "spd2",
        percentKey1: "spd1%",
        percentKey2: "spd2%",
      },
    ];

    rows.forEach((row) => {
      const value1 = jogressDataEntry[row.key1];
      const value2 = jogressDataEntry[row.key2];
      let rowHtml = `<tr><th>${row.label}</th>`;

      if (value1 || value2) {
        if (row.suffix) {
          rowHtml += `<td>${value1 ? value1 + row.suffix : ""}</td>`;
          rowHtml += `<td>${value2 ? value2 + row.suffix : ""}</td>`;
        } else {
          const percent1 = jogressDataEntry[row.percentKey1];
          const percent2 = jogressDataEntry[row.percentKey2];
          rowHtml += `<td>${
            value1 ? value1 + (percent1 ? ` (${percent1}%)` : "") : ""
          }</td>`;
          rowHtml += `<td>${
            value2 ? value2 + (percent2 ? ` (${percent2}%)` : "") : ""
          }</td>`;
        }
        rowHtml += `</tr>`;
        tableHtml += rowHtml;
      }
    });

    if (jogressDataEntry.ingredient1 || jogressDataEntry.ingredient2) {
      const ingredients = jogressDataEntry.ingredient1
        ? jogressDataEntry.ingredient1 +
          (jogressDataEntry.ingredient2
            ? `, ${jogressDataEntry.ingredient2}`
            : "")
        : jogressDataEntry.ingredient2 || "";

      tableHtml += `
                    <tr>
                        <th>진화 재료</th>
                        <td colspan="2">${ingredients}</td>
                    </tr>`;
    }

    tableHtml += `</table>`;
    tooltip.innerHTML = tableHtml;
  }

  const imgRect = jogressImage.getBoundingClientRect();
  tooltip.style.left = `${imgRect.left + window.scrollX}px`;
  tooltip.style.top = `${imgRect.bottom + window.scrollY - 130}px`;

  tooltip.classList.add("visible-tooltip");
}

function hideJogressTooltip() {
  const tooltip = document.getElementById("tooltip");
  tooltip.classList.remove("visible-tooltip");
}

function showTooltip(event, digimonName) {
  const tooltip = document.getElementById("tooltip");
  const currentDigimon = allData.find((d) => d.name === digimonName);

  if (!currentDigimon) {
    return;
  }

  const parentNode = event.target
    .closest(".digimon-container")
    .parentElement.closest(".digimon-container");

  let parentDigimonName = null;

  if (parentNode) {
    const parentImg = parentNode.querySelector(".digimon img:not(.type-image)");
    if (parentImg) {
      parentDigimonName = parentImg.alt;
    }
  }

  const parentDigimon = allData.find((d) => d.name === parentDigimonName);

  if (!parentDigimon) {
    return;
  }

  const jogressTarget = allData.some(
    (digimon) => digimon.조그레스 === digimonName
  );

  if (jogressTarget) {
    const jogressDataEntry = jogressData.find(
      (jogress) => jogress.name === digimonName
    );
    if (jogressDataEntry) {
      showJogressTooltip(event.target, jogressDataEntry);
    }
    return;
  }

  const digimonInfo = conditionData.find((d) => d.name === parentDigimon.name);
  if (digimonInfo) {
    const thirdColumnValue = digimonInfo[Object.keys(digimonInfo)[2]];
    if (!thirdColumnValue) {
      return;
    }

    let tableHtml = `
        <table class="tooltip-table">
            <tr>
                <th colspan="2">진화 조건</th>
            </tr>`;

    if (digimonInfo["name"]) {
      tableHtml += `
            <tr>
                <th>디지몬</th>
                <td>${digimonInfo["name"]}</td>
            </tr>`;
    }

    if (digimonInfo["레벨"]) {
      tableHtml += `
            <tr>
                <th>레벨</th>
                <td>${digimonInfo["레벨"]}</td>
            </tr>`;
    }

    if (digimonInfo["유대감"]) {
      tableHtml += `
            <tr>
                <th>유대감</th>
                <td>${digimonInfo["유대감"]}%</td>
            </tr>`;
    }

    const statPairs = [
      { stat: "힘", percent: "힘%" },
      { stat: "지능", percent: "지능%" },
      { stat: "수비", percent: "수비%" },
      { stat: "저항", percent: "저항%" },
      { stat: "속도", percent: "속도%" },
    ];

    statPairs.forEach((pair) => {
      const statValue = digimonInfo[pair.stat];
      const percentValue = digimonInfo[pair.percent];
      if (statValue) {
        tableHtml += `
                <tr>
                    <th>${pair.stat}</th>
                    <td>${statValue}${
          percentValue ? ` (${digimonInfo[pair.percent]}%)` : ""
        }</td>
                </tr>`;
      }
    });

    if (digimonInfo["진화재료"]) {
      tableHtml += `
            <tr>
                <th>진화 재료</th>
                <td colspan="2">${digimonInfo["진화재료"]}</td>
            </tr>`;
    }

    tableHtml += `</table>`;

    tooltip.innerHTML = tableHtml;
    tooltip.classList.add("visible-tooltip");

    updateTooltipPosition(event.target, tooltip);
    observeNodeChanges(event.target, tooltip);
  }
}

function updateTooltipPosition(targetElement, tooltipElement) {
  const rect = targetElement.getBoundingClientRect();

  tooltipElement.style.left = `${rect.left + window.scrollX - 2}px`;
  tooltipElement.style.top = `${rect.top + window.scrollY - 80}px`;
}

function observeNodeChanges(nodeElement, tooltipElement) {
  const plusBtn = nodeElement.querySelector(".plus-btn");
  if (plusBtn) {
    plusBtn.addEventListener("click", () => {
      setTimeout(() => {
        updateTooltipPosition(nodeElement, tooltipElement);
      }, 300);
    });
  }
}

function hideTooltip() {
  const tooltip = document.getElementById("tooltip");
  tooltip.classList.remove("visible-tooltip");
}

function updateAllVerticalLinesAndHorizontalConnectors() {
  const treeContainer = document.getElementById("evolution-tree");
  const allContainers = treeContainer.querySelectorAll(".digimon-container");

  allContainers.forEach((container) => {
    const verticalLine = container.querySelector(".vertical-line");
    const childrenContainer = container.querySelector(".children-container");

    if (childrenContainer && childrenContainer.children.length > 0) {
      const firstChild = childrenContainer.firstChild;
      const lastChild = childrenContainer.lastChild;

      if (firstChild && lastChild) {
        const firstChildRect = firstChild.getBoundingClientRect();
        const lastChildRect = lastChild.getBoundingClientRect();
        const containerRect = childrenContainer.getBoundingClientRect();

        const lineLength =
          lastChildRect.top +
          lastChildRect.height / 2 -
          (firstChildRect.top + firstChildRect.height / 2);
        const lineTop =
          firstChildRect.top + firstChildRect.height / 2 - containerRect.top;

        verticalLine.style.height = `${lineLength}px`;
        verticalLine.style.top = `${lineTop}px`;
        verticalLine.style.display = "block";

        [...childrenContainer.children].forEach((childNode) => {
          const childRect = childNode.getBoundingClientRect();
          const childTop =
            childRect.top + childRect.height / 2 - containerRect.top;

          let horizontalConnector = childNode.querySelector(
            ".horizontal-connector"
          );
          if (!horizontalConnector) {
            horizontalConnector = document.createElement("div");
            horizontalConnector.classList.add("horizontal-connector");
            childNode.appendChild(horizontalConnector);
          }
          horizontalConnector.style.top = "50%";
          horizontalConnector.style.left = "-50px";
          horizontalConnector.style.display = "block";
        });
      }
    } else {
      verticalLine.style.display = "none";
    }
  });
}

function createStageContainer(digimons, data, lowerEvolutions) {
  const stageContainer = document.createElement("div");
  stageContainer.classList.add("stage-container");

  digimons.forEach((digimon) => {
    const digimonNode = createDigimonNode(digimon, data, lowerEvolutions);
    stageContainer.appendChild(digimonNode);
  });

  return stageContainer;
}

function createEvolutionTree(data, lowerEvolutions) {
  const treeContainer = document.getElementById("evolution-tree");
  treeContainer.innerHTML = "";
  const stageContainer = createStageContainer(data, allData, lowerEvolutions);
  treeContainer.appendChild(stageContainer);
}

const menuButtons = document.querySelectorAll(".menu-container button");

menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    menuButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
  });
});

function searchDigimonByName() {
  const searchQuery = document
    .getElementById("search-input")
    .value.toLowerCase();

  const searchTerms = searchQuery.split(",").map((term) => term.trim());

  const filteredData = allData.filter((digimon) => {
    return searchTerms.some((term) =>
      digimon.name.toLowerCase().includes(term)
    );
  });

  createDigimonImageList(filteredData);
}

loadCSV().then(() => {
  loadConditionCSV();
  loadJogressCSV();
  loadCharactersCSV();
});
