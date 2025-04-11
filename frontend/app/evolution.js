(() => {
  // ===============================
  // DataModule: CSV 데이터 로드 및 저장
  // ===============================
  const DataModule = {
    allData: [],
    conditionData: [],
    jogressData: [],
    charactersData: [],

    async loadCSVFiles() {
      await Promise.all([
        this.loadCSV("../data/csv/evolution.csv", "allData"),
        this.loadCSV("../data/csv/condition.csv", "conditionData"),
        this.loadCSV("../data/csv/jogress.csv", "jogressData"),
        this.loadCSV("../data/csv/characters.csv", "charactersData")
      ]);
      // CSV 로드 후 전체 데이터의 이미지 리스트를 생성
      UIManager.createDigimonImageList(this.allData);
    },

    async loadCSV(url, targetProperty) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        const data = await response.text();
        this[targetProperty] = parseCSV(data);
      } catch (error) {
        console.error(error);
      }
    }
  };

  // CSV 파싱 유틸리티 함수
  function parseCSV(csv) {
    const lines = csv.split("\n").filter(line => line.trim() !== "");
    const headers = lines[0].split(",").map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(",").map(val => (val.trim() === "" ? null : val.trim()));
      return headers.reduce((obj, header, idx) => {
        obj[header] = values[idx] || null;
        return obj;
      }, {});
    });
  }

  // ===============================
  // UIManager: UI 이벤트 및 이미지 리스트 처리
  // ===============================
  const UIManager = {
    selectedDigimon: null,

    init() {
      console.log("UIManager init 호출됨");

      // 검색 이벤트 등록 (인라인 이벤트 대신 혹은 병행 사용)
      const searchInput = document.getElementById("search-input");
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          this.searchDigimonByName();
        });
      }
      // (메뉴 버튼은 인라인 onclick 이벤트로 처리하므로 별도 이벤트 등록은 하지 않습니다.)
    },

    createDigimonImageList(data) {
      const container = document.getElementById("digimon-image-list");
      container.innerHTML = "";
      data.forEach(digimon => {
        const safeName = digimon.name.replace(":", "_");
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("digimon-image-container");

        const img = document.createElement("img");
        img.src = `../image/digimon/${safeName}/${safeName}.webp`;
        img.alt = digimon.name;
        img.dataset.evoType = "normal";
        img.width = 100;
        img.height = 100;

        // 이름 툴팁 표시
        img.addEventListener("mouseover", (event) => {
          TooltipManager.showNameTooltip(event, digimon.name);
        });
        img.addEventListener("mouseout", TooltipManager.hideNameTooltip);

        // 클릭 시 진화 트리 표시
        img.addEventListener("click", () => {
          if (this.selectedDigimon) {
            this.selectedDigimon.classList.remove("selected");
          }
          imgContainer.classList.add("selected");
          this.selectedDigimon = imgContainer;
          EvolutionTreeManager.showEvolutionTreeForDigimon(digimon.name);
        });

        imgContainer.appendChild(img);
        container.appendChild(imgContainer);
      });
    },

    // 인라인 이벤트로 호출될 전역 함수로 노출할 함수
    filterDigimonByStage(stage) {
      // stage가 'all'이면 전체, 그렇지 않으면 stage와 일치하는 데이터로 필터링
      const filtered = stage === "all"
        ? DataModule.allData
        : DataModule.allData.filter(d => d.evolution_stage == stage);
      this.createDigimonImageList(filtered);
    },

    searchDigimonByName() {
      const query = document.getElementById("search-input").value.toLowerCase();
      const terms = query.split(",").map(term => term.trim());
      const filtered = DataModule.allData.filter(d =>
        terms.some(term => d.name.toLowerCase().includes(term))
      );
      this.createDigimonImageList(filtered);
    },

    updateAllVerticalLinesAndHorizontalConnectors() {
      const treeContainer = document.getElementById("evolution-tree");
      const containers = treeContainer.querySelectorAll(".digimon-container");
      containers.forEach(container => {
        const verticalLine = container.querySelector(".vertical-line");
        const childrenContainer = container.querySelector(".children-container");
        if (childrenContainer && childrenContainer.children.length > 0) {
          const firstChild = childrenContainer.firstChild;
          const lastChild = childrenContainer.lastChild;
          if (firstChild && lastChild) {
            const firstRect = firstChild.getBoundingClientRect();
            const lastRect = lastChild.getBoundingClientRect();
            const containerRect = childrenContainer.getBoundingClientRect();
            const lineLength = (lastRect.top + lastRect.height / 2) - (firstRect.top + firstRect.height / 2);
            const lineTop = (firstRect.top + firstRect.height / 2) - containerRect.top;
            verticalLine.style.height = `${lineLength}px`;
            verticalLine.style.top = `${lineTop}px`;
            verticalLine.style.display = "block";

            [...childrenContainer.children].forEach(child => {
              let horizontalConnector = child.querySelector(".horizontal-connector");
              if (!horizontalConnector) {
                horizontalConnector = document.createElement("div");
                horizontalConnector.classList.add("horizontal-connector");
                child.appendChild(horizontalConnector);
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
    },

    activateHighlightedChildPlusButtons(parentNode) {
      const highlightedNodes = parentNode.querySelectorAll(".children-container .digimon.highlighted");
      highlightedNodes.forEach(node => {
        const img = Array.from(node.querySelectorAll("img")).find(img => !img.classList.contains("type-image"));
        const name = img ? img.alt : "";
        if (name !== EvolutionTreeManager.selectedDigimonName) {
          const plusBtn = node.querySelector(".plus-btn");
          if (plusBtn && plusBtn.textContent === "+") {
            plusBtn.click();
          }
        }
      });
    }
  };

  // ===============================
  // TooltipManager: 툴팁 처리
  // ===============================
  const TooltipManager = {
    showNameTooltip(event, digimonName) {
      const tooltip = document.getElementById("name-tooltip");
      tooltip.textContent = digimonName;
      const rect = event.target.getBoundingClientRect();
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.bottom + window.scrollY - 195}px`;
      tooltip.classList.add("visible-tooltip");
    },
    hideNameTooltip() {
      document.getElementById("name-tooltip").classList.remove("visible-tooltip");
    },
    showEvolutionTooltip(event, digimonName) {
      const tooltip = document.getElementById("evolution-tooltip");
      tooltip.textContent = digimonName;
      const rect = event.target.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX - 2}px`;
      tooltip.style.top = `${rect.bottom + window.scrollY - 190}px`;
      tooltip.classList.add("visible-tooltip");
    },
    hideEvolutionTooltip() {
      document.getElementById("evolution-tooltip").classList.remove("visible-tooltip");
    },
    showDigimonTooltip(event, digimonName, evoType = "normal") {
      const currentDigimon = DataModule.allData.find(d => d.name === digimonName);
      if (!currentDigimon) return;
      const parentNode = event.target.closest(".digimon-container")?.parentElement
                        ?.closest(".digimon-container");
      let parentName = parentNode ? parentNode.querySelector("img:not(.type-image)")?.alt : null;
      const parentData = DataModule.allData.find(d => d.name === parentName);
      if (!parentData) return;
      if (DataModule.allData.some(d => d.조그레스 === digimonName)) {
        const jogressEntry = DataModule.jogressData.find(j => j.name === digimonName);
        if (jogressEntry) {
          this.showJogressTooltip(event.target, jogressEntry);
        }
        return;
      }
      const digimonInfo = DataModule.conditionData.find(d => d.name === parentData.name);
      if (!digimonInfo) return;
      let tableHtml = `<table class="tooltip-table">
                         <tr><th colspan="2">진화 조건</th></tr>`;
      if (digimonInfo["name"]) {
        tableHtml += `<tr><th>디지몬</th><td>${digimonInfo["name"]}</td></tr>`;
      }
      if (digimonInfo["레벨"]) {
        tableHtml += `<tr><th>레벨</th><td>${digimonInfo["레벨"]}</td></tr>`;
      }
      if (digimonInfo["유대감"]) {
        tableHtml += `<tr><th>유대감</th><td>${digimonInfo["유대감"]}%</td></tr>`;
      }
      const stats = [
        { stat: "힘", percent: "힘%" },
        { stat: "지능", percent: "지능%" },
        { stat: "수비", percent: "수비%" },
        { stat: "저항", percent: "저항%" },
        { stat: "속도", percent: "속도%" }
      ];
      stats.forEach(s => {
        if (digimonInfo[s.stat]) {
          tableHtml += `<tr><th>${s.stat}</th><td>${digimonInfo[s.stat]}${digimonInfo[s.percent] ? ` (${digimonInfo[s.percent]}%)` : ""}</td></tr>`;
        }
      });
      if (evoType === "normal" && digimonInfo["진화재료"]?.trim()) {
        tableHtml += `<tr><th>진화 재료</th><td>${digimonInfo["진화재료"]}</td></tr>`;
      } else if (evoType === "dark" && digimonInfo["암흑진화재료"]?.trim()) {
        tableHtml += `<tr><th>진화 재료</th><td>${digimonInfo["암흑진화재료"]}</td></tr>`;
      } else if (evoType === "special" && digimonInfo["특수진화재료"]?.trim()) {
        tableHtml += `<tr><th>진화 재료</th><td>${digimonInfo["특수진화재료"]}</td></tr>`;
      }
      tableHtml += `</table>`;
      const tooltip = document.getElementById("tooltip");
      tooltip.innerHTML = tableHtml;
      tooltip.classList.add("visible-tooltip");
      this.updateTooltipPosition(event.target, tooltip);
      this.observeNodeChanges(event.target, tooltip);
    },
    showJogressTooltip(target, jogressEntry) {
      const tooltip = document.getElementById("tooltip");
      let tableHtml = `<table class="jogress-tooltip-table">
                         <tr><th colspan="3">조그레스 진화 조건</th></tr>`;
      if (jogressEntry.digimon1 || jogressEntry.digimon2) {
        tableHtml += `<tr><th>디지몬</th><th>${jogressEntry.digimon1 || ""}</th><th>${jogressEntry.digimon2 || ""}</th></tr>`;
      }
      const rows = [
        { label: "레벨", key1: "level1", key2: "level2" },
        { label: "유대감", key1: "bond1", key2: "bond2", suffix: "%" },
        { label: "힘", key1: "str1", key2: "str2", percentKey1: "str1%", percentKey2: "str2%" },
        { label: "지능", key1: "int1", key2: "int2", percentKey1: "int1%", percentKey2: "int2%" },
        { label: "수비", key1: "def1", key2: "def2", percentKey1: "def1%", percentKey2: "def2%" },
        { label: "저항", key1: "res1", key2: "res2", percentKey1: "res1%", percentKey2: "res2%" },
        { label: "속도", key1: "spd1", key2: "spd2", percentKey1: "spd1%", percentKey2: "spd2%" }
      ];
      rows.forEach(row => {
        const value1 = jogressEntry[row.key1];
        const value2 = jogressEntry[row.key2];
        if (value1 || value2) {
          let rowHtml = `<tr><th>${row.label}</th>`;
          if (row.suffix) {
            rowHtml += `<td>${value1 ? value1 + row.suffix : ""}</td><td>${value2 ? value2 + row.suffix : ""}</td>`;
          } else {
            const percent1 = jogressEntry[row.percentKey1];
            const percent2 = jogressEntry[row.percentKey2];
            rowHtml += `<td>${value1 ? value1 + (percent1 ? ` (${percent1}%)` : "") : ""}</td><td>${value2 ? value2 + (percent2 ? ` (${percent2}%)` : "") : ""}</td>`;
          }
          rowHtml += `</tr>`;
          tableHtml += rowHtml;
        }
      });
      if (jogressEntry.ingredient1 || jogressEntry.ingredient2) {
        const ingredients = jogressEntry.ingredient1
          ? `${jogressEntry.ingredient1}${jogressEntry.ingredient2 ? `, ${jogressEntry.ingredient2}` : ""}`
          : jogressEntry.ingredient2 || "";
        tableHtml += `<tr><th>진화 재료</th><td colspan="2">${ingredients}</td></tr>`;
      }
      tableHtml += `</table>`;
      tooltip.innerHTML = tableHtml;
      const rect = target.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX}px`;
      tooltip.style.top = `${rect.bottom + window.scrollY - 130}px`;
      tooltip.classList.add("visible-tooltip");
    },
    updateTooltipPosition(target, tooltip) {
      const rect = target.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX - 2}px`;
      tooltip.style.top = `${rect.top + window.scrollY - 80}px`;
    },
    observeNodeChanges(target, tooltip) {
      const container = target.closest(".digimon-container");
      const plusBtn = container ? container.querySelector(".plus-btn") : null;
      if (plusBtn) {
        plusBtn.addEventListener("click", () => {
          setTimeout(() => {
            this.updateTooltipPosition(target, tooltip);
          }, 300);
        });
      }
    },
    hideTooltip() {
      document.getElementById("tooltip").classList.remove("visible-tooltip");
    }
  };

  // ===============================
  // EvolutionTreeManager: 진화 트리 처리
  // ===============================
  const EvolutionTreeManager = {
    selectedDigimonName: null,
    showEvolutionTreeForDigimon(digimonName) {
      this.selectedDigimonName = digimonName;
      const lowerEvolutions = this.findAllLowerEvolutions(digimonName);
      const treeData = this.filterTreeByDigimonName(digimonName);
      if (treeData.length > 0) {
        this.createEvolutionTree(treeData, lowerEvolutions);
      } else {
        alert("해당 디지몬의 진화트리를 찾을 수 없습니다.");
      }
    },
    findAllLowerEvolutions(digimonName) {
      const lower = [digimonName];
      const direct = DataModule.allData.filter(d =>
        [
          d.evol1, d.evol2, d.evol3, d.evol4, d.evol5,
          d.evol6, d.evol7, d.evol8, d.evol9, d.evol10,
          d.evol11, d.조그레스, d.암흑진화, d.특수진화
        ].includes(digimonName)
      );
      direct.forEach(d => {
        lower.push(...this.findAllLowerEvolutions(d.name));
      });
      return lower;
    },
    filterTreeByDigimonName(digimonName) {
      const selected = DataModule.allData.find(d => d.name === digimonName);
      if (!selected) return [];
      const stage = parseInt(selected.evolution_stage, 10);
      let stageFilter = null;
      if (stage === 1) stageFilter = "1";
      else if (stage >= 2 && stage <= 3) stageFilter = "2";
      else if (stage >= 4 && stage <= 6) stageFilter = "3";
      if (!stageFilter) return [];
      const candidates = DataModule.allData.filter(d => d.evolution_stage === stageFilter);
      return candidates.filter(d => this.isDigimonInTree(d, digimonName));
    },
    isDigimonInTree(digimon, searchName) {
      if (digimon.name === searchName) return true;
      const evolutions = [
        digimon.evol1, digimon.evol2, digimon.evol3, digimon.evol4, digimon.evol5,
        digimon.evol6, digimon.evol7, digimon.evol8, digimon.evol9, digimon.evol10,
        digimon.evol11, digimon.조그레스, digimon.암흑진화, digimon.특수진화
      ].filter(e => e);
      for (const evo of evolutions) {
        const next = DataModule.allData.find(d => d.name === evo);
        if (next && this.isDigimonInTree(next, searchName)) return true;
      }
      return false;
    },
    createEvolutionTree(data, lowerEvolutions) {
      const treeContainer = document.getElementById("evolution-tree");
      treeContainer.innerHTML = "";
      const stageContainer = this.createStageContainer(data, lowerEvolutions);
      treeContainer.appendChild(stageContainer);
    },
    createStageContainer(digimons, lowerEvolutions) {
      const stageContainer = document.createElement("div");
      stageContainer.classList.add("stage-container");
      digimons.forEach(d => {
        const node = this.createDigimonNode(d, lowerEvolutions);
        stageContainer.appendChild(node);
      });
      return stageContainer;
    },
    createDigimonNode(digimon, lowerEvolutions, evoType = "normal") {
      const container = document.createElement("div");
      container.classList.add("digimon-container");
      const digimonDiv = document.createElement("div");
      digimonDiv.classList.add("digimon");
      const safeName = digimon.name.replace(":", "_");
      const img = document.createElement("img");
      img.src = `../image/digimon/${safeName}/${safeName}.webp`;
      img.alt = digimon.name;
      img.dataset.evoType = evoType;
      const characterInfo = DataModule.charactersData.find(c => c.name === digimon.name);
      if (characterInfo && characterInfo.type) {
        const typeImg = document.createElement("img");
        typeImg.src = `../image/${characterInfo.type}.webp`;
        typeImg.alt = characterInfo.type;
        typeImg.classList.add("type-image");
        digimonDiv.appendChild(typeImg);
      }
      img.addEventListener("mouseover", (event) => {
        TooltipManager.showEvolutionTooltip(event, digimon.name);
        TooltipManager.showDigimonTooltip(event, digimon.name, evoType);
      });
      img.addEventListener("mouseout", () => {
        TooltipManager.hideEvolutionTooltip();
        TooltipManager.hideTooltip();
      });
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
        { name: digimon.조그레스, percent: digimon.percent12 },
        { name: digimon.암흑진화, percent: digimon.percent13, evoType: "dark" },
        { name: digimon.특수진화, percent: digimon.percent14, evoType: "special" }
      ].filter(e => e.name);
      const hasEvolution = evolutions.length > 0;
      if (hasEvolution) {
        const plusBtn = document.createElement("button");
        plusBtn.classList.add("plus-btn");
        plusBtn.textContent = "+";
        plusBtn.addEventListener("click", () => {
          if (!childrenContainer.children.length) {
            evolutions.forEach(evo => {
              const nextDigimon = DataModule.allData.find(d => d.name === evo.name);
              if (nextDigimon) {
                const nextNode = this.createDigimonNode(nextDigimon, lowerEvolutions, evo.evoType || "normal");
                const percentageText = document.createElement("span");
                percentageText.classList.add("percentage-text");
                percentageText.textContent = `${evo.percent}%`;
                let horizontalConnector = nextNode.querySelector(".horizontal-connector");
                if (!horizontalConnector) {
                  horizontalConnector = document.createElement("div");
                  horizontalConnector.classList.add("horizontal-connector");
                  nextNode.appendChild(horizontalConnector);
                }
                horizontalConnector.style.display = "block";
                horizontalConnector.appendChild(percentageText);
                if (evo.name === digimon.조그레스) {
                  const jogressImageName = digimon[Object.keys(digimon)[26]];
                  const jogressImagePath = `../image/digimon/${jogressImageName}/${jogressImageName}.webp`;
                  const jogressImg = document.createElement("img");
                  jogressImg.src = jogressImagePath;
                  jogressImg.classList.add("jogress-image");
                  horizontalConnector.appendChild(jogressImg);
                }
                if (evo.evoType === "dark") {
                  horizontalConnector.classList.add("dark-evo");
                } else if (evo.evoType === "special") {
                  horizontalConnector.classList.add("special-evo");
                }
                childrenContainer.appendChild(nextNode);
              }
            });
          }
          childrenContainer.classList.toggle("visible");
          UIManager.updateAllVerticalLinesAndHorizontalConnectors();
          if (childrenContainer.classList.contains("visible")) {
            plusBtn.textContent = "−";
            horizontalLine.style.display = "block";
            verticalLine.style.display = "block";
            UIManager.activateHighlightedChildPlusButtons(container);
            setTimeout(() => {
              if (evoType === "dark" || evoType === "special") {
                const intersection = this.getIntersectionPercentage(verticalLine, horizontalLine);
                verticalLine.style.setProperty("--intersection-percent", intersection + "%");
                verticalLine.classList.add(evoType === "dark" ? "dark-evo" : "special-evo");
                console.log("Intersection percent for", evoType, ":", intersection + "%");
              }
            }, 200);
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
      if (evoType === "dark" || evoType === "special") {
        setTimeout(() => {
          const intersection = this.getIntersectionPercentage(verticalLine, horizontalLine);
          console.log("Intersection percent for", evoType, ":", intersection + "%");
          verticalLine.style.setProperty("--intersection-percent", intersection + "%");
          verticalLine.classList.add(evoType === "dark" ? "dark-evo" : "special-evo");
        }, 300);
      }
      return container;
    },
    getIntersectionPercentage(verticalLine, horizontalLine) {
      const vRect = verticalLine.getBoundingClientRect();
      if (!vRect.height) {
        console.warn("verticalLine의 높이가 0입니다. 교차 지점을 계산할 수 없습니다.");
        return 0;
      }
      const hRect = horizontalLine.getBoundingClientRect();
      const intersectionY = hRect.top + (hRect.height / 2);
      const relativePosition = intersectionY - vRect.top;
      return (relativePosition / vRect.height) * 100;
    }
  };

  // ===============================
  // DOMContentLoaded 이후 초기화
  // ===============================
  document.addEventListener("DOMContentLoaded", () => {
    UIManager.init();
    DataModule.loadCSVFiles();
  });

  // 인라인 이벤트(HTML onclick)를 사용할 수 있도록 전역 함수 노출
  window.filterDigimonByStage = UIManager.filterDigimonByStage.bind(UIManager);
  window.searchDigimonByName = UIManager.searchDigimonByName.bind(UIManager);
})();
