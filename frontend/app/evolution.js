(() => {
  let jogressResultImgTarget = null;
  // ===============================
  // DataModule: CSV 데이터 로드 및 저장
  // ===============================
  const DataModule = {
    allData: [],
    conditionData: [],
    jogressData: [],
    charactersData: [],
    materialIndex: new Map(),

    async loadCSVFiles() {
      await Promise.all([
        this.loadCSV(`https://media.dsrwiki.com/data/csv/evolution.csv`, "allData"),
        this.loadCSV(`https://media.dsrwiki.com/data/csv/condition.csv`, "conditionData"),
        this.loadCSV(`https://media.dsrwiki.com/data/csv/jogress.csv`, "jogressData"),
      ]);
      
      console.log('CSV 로드 완료. allData 개수:', this.allData.length);
      const papimon = this.allData.find(d => d.name === '파피몬-우정의유대-');
      const chirin = this.allData.find(d => d.name === '치린몬');
      console.log('파피몬-우정의유대-:', papimon);
      console.log('치린몬:', chirin);
      
      // 재료 인덱스 빌드 후 기본 디지몬 이미지 리스트 생성
      this.buildMaterialIndex();
      console.log('createDigimonImageList 호출 전, 데이터 개수:', this.allData.length);
      UIManager.createDigimonImageList(this.allData);
    },

    async loadCSV(url, targetProperty) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        const data = await response.text();
        const parsed = parseCSV(data);
        this[targetProperty] = parsed;
        
        // 디버깅: 파피몬-우정의유대- 확인
        if (targetProperty === 'allData') {
          const papimon = parsed.find(d => d.name && d.name.includes('파피몬-우정의유대'));
          console.log(`[${targetProperty}] Loaded ${parsed.length} items`);
          console.log(`[${targetProperty}] 파피몬-우정의유대- found:`, papimon);
        }
      } catch (error) {
        console.error(`Error loading ${url}:`, error);
      }
    }
  };

  // 문자열에서 재료 배열 추출: "이름*5, 재료B" -> [{name: "이름"}, {name:"재료B"}]
  function parseMaterials(materialStr) {
    if (!materialStr) return [];
    return materialStr
      .split("/") // 일부 데이터 구분자 예방
      .join(",")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(token => {
        const name = token.split("*")[0].trim();
        return { name };
      });
  }

  // 재료 인덱스 생성: materialName -> [{ type, parent, child, parents (for jogress) }]
  DataModule.buildMaterialIndex = function() {
    this.materialIndex = new Map();

    // parent -> evolution row 맵
    const nameToEvo = new Map();
    this.allData.forEach(row => nameToEvo.set(row.name, row));

    // condition.csv: 일반/암흑/특수/버스트
    const typeMap = [
      { key: "진화재료", type: "normal" },
      { key: "암흑진화재료", type: "dark" },
      { key: "특수진화재료", type: "special" },
      { key: "버스트진화재료", type: "burst" },
    ];

    this.conditionData.forEach(cond => {
      const parent = cond.name;
      const evoRow = nameToEvo.get(parent);
      if (!evoRow) return;
      typeMap.forEach(({ key, type }) => {
        const mats = parseMaterials(cond[key]);
        if (!mats.length) return;
        let children = [];
        if (type === "normal") {
          children = [
            evoRow.evol1, evoRow.evol2, evoRow.evol3, evoRow.evol4, evoRow.evol5,
            evoRow.evol6, evoRow.evol7, evoRow.evol8, evoRow.evol9, evoRow.evol10,
            evoRow.evol11
          ].filter(Boolean);
        } else if (type === "dark") {
          if (evoRow.암흑진화) children = [evoRow.암흑진화];
        } else if (type === "special") {
          if (evoRow.특수진화) children = [evoRow.특수진화];
        } else if (type === "burst") {
          if (evoRow.버스트진화) children = [evoRow.버스트진화];
        }
        if (!children.length) return;
        mats.forEach(m => {
          const arr = this.materialIndex.get(m.name) || [];
          children.forEach(child => arr.push({ type, parent, child }));
          this.materialIndex.set(m.name, arr);
        });
      });
    });

    // jogress.csv: ingredient1/ingredient2 -> child = name, parents = [digimon1,digimon2]
    this.jogressData.forEach(j => {
      [j.ingredient1, j.ingredient2].filter(Boolean).forEach(raw => {
        parseMaterials(raw).forEach(m => {
          const arr = this.materialIndex.get(m.name) || [];
          arr.push({ type: "jogress", parent: j.digimon1, child: j.name, parents: [j.digimon1, j.digimon2] });
          this.materialIndex.set(m.name, arr);
        });
      });
    });
  };

  // CSV 파싱 유틸리티 함수
  function parseCSV(csv) {
    const lines = csv.split("\n").filter(line => line.trim() !== "");
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(",").map(h => h.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      const obj = {};
      
      headers.forEach((header, idx) => {
        const value = values[idx];
        obj[header] = (value === undefined || value === null || value.trim() === "") ? null : value.trim();
      });
      
      // name 필드가 있어야만 추가
      if (obj.name) {
        result.push(obj);
      }
    }
    
    return result;
  }
  
  // CSV 라인 파싱 (따옴표 처리 포함)
  function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // 이스케이프된 따옴표
          current += '"';
          i++;
        } else {
          // 따옴표 시작/끝
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // 쉼표로 값 구분
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // 마지막 값 추가
    values.push(current);
    
    return values;
  }

  // ===============================
  // UIManager: UI 이벤트 및 이미지 리스트 처리
  // ===============================
  const UIManager = {
    selectedDigimon: null,
    mode: "digimon", // 'digimon' | 'materials'
    selectedMaterial: null,

    init() {
      console.log("UIManager init 호출됨");

      // 메뉴 버튼 이벤트 등록
      const menuItems = document.querySelectorAll('.menu-item');
      menuItems.forEach(item => {
        item.addEventListener('click', () => {
          // 모든 버튼에서 active 클래스 제거
          menuItems.forEach(btn => btn.classList.remove('active'));
          // 클릭된 버튼에 active 클래스 추가
          item.classList.add('active');
          // 해당 단계의 디지몬 필터링
          const stage = item.dataset.stage;
          if (item.id === 'material-toggle') {
            this.toggleMaterialMode();
          } else {
            this.mode = 'digimon';
            this.filterDigimonByStage(stage);
          }
        });
      });

      // 검색 이벤트 등록
      const searchInput = document.getElementById("search-input");
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          this.searchDigimonByName();
        });
      }
    },

    createDigimonImageList(data) {
      const container = document.getElementById("digimon-image-list");
      if (!container) {
        console.error('digimon-image-list 컨테이너를 찾을 수 없습니다!');
        return;
      }
      container.innerHTML = "";
      console.log('createDigimonImageList: 표시할 디지몬 개수:', data.length);
      
      const papimon = data.find(d => d.name === '파피몬-우정의유대-');
      const chirin = data.find(d => d.name === '치린몬');
      console.log('createDigimonImageList 내부 - 파피몬-우정의유대-:', papimon);
      console.log('createDigimonImageList 내부 - 치린몬:', chirin);
      
      data.forEach(digimon => {
        const safeName = digimon.name.replace(":", "_");
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("digimon-image-container");

        const img = document.createElement("img");
        img.src = `https://media.dsrwiki.com/dsrwiki/digimon/${safeName}/${safeName}.webp`;
        img.alt = digimon.name;
        img.dataset.evoType = "normal";
        img.width = 100;
        img.height = 100;

        // 이름 툴팁 표시
        img.addEventListener("mouseover", (event) => {
          TooltipManager.showNameTooltip(event, digimon.name);
        });
        img.addEventListener("mousemove", (event) => {
          TooltipManager.showNameTooltip(event, digimon.name);
        });
        img.addEventListener("mouseout", (event) => {
          TooltipManager.hideNameTooltip();
        });

        // 클릭 시 진화 트리 표시
        img.addEventListener("click", () => {
          if (this.selectedDigimon) {
            this.selectedDigimon.classList.remove("selected");
          }
          imgContainer.classList.add("selected");
          this.selectedDigimon = imgContainer;
          EvolutionTreeManager.showEvolutionTreeForDigimon(digimon.name);
        });

        // 조그레스 결과물(조그레스로 등장하는 디지몬)일 때만 툴팁 이벤트 등록
        if (digimon.조그레스) {
          const jogressEntry = DataModule.jogressData.find(j => j.name === digimon.name);
          if (jogressEntry) {
            img.addEventListener("mouseenter", (event) => {
              TooltipManager.showJogressTooltip(event, jogressEntry);
            });
            img.addEventListener("mousemove", (event) => {
              TooltipManager.showJogressTooltip(event, jogressEntry);
            });
            img.addEventListener("mouseleave", () => {
              TooltipManager.hideJogressTooltip();
            });
          }
        }

        imgContainer.appendChild(img);
        container.appendChild(imgContainer);
      });
    },

    createMaterialImageList() {
      const container = document.getElementById("digimon-image-list");
      container.innerHTML = "";
      const materialNames = Array.from(DataModule.materialIndex.keys()).sort((a,b)=>a.localeCompare(b));
      materialNames.forEach(name => {
        const safeName = name.replace(":", "_");
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("digimon-image-container");
        const img = document.createElement("img");
        img.src = `https://media.dsrwiki.com/dsrwiki/item/${safeName}.webp`;
        img.alt = name;
        img.width = 100;
        img.height = 100;
        img.addEventListener("mouseover", (event) => {
          TooltipManager.showNameTooltip(event, name);
        });
        img.addEventListener("mousemove", (event) => {
          TooltipManager.showNameTooltip(event, name);
        });
        img.addEventListener("mouseout", () => {
          TooltipManager.hideNameTooltip();
        });
        img.addEventListener("click", () => {
          this.selectedMaterial = name;
          EvolutionTreeManager.showTreesForMaterial(name);
        });
        imgContainer.appendChild(img);
        container.appendChild(imgContainer);
      });
    },

    toggleMaterialMode() {
      if (this.mode === 'materials') {
        this.mode = 'digimon';
        this.createDigimonImageList(DataModule.allData);
        const treeContainer = document.getElementById("evolution-tree");
        treeContainer.innerHTML = "";
        treeContainer.classList.remove('materials-mode');
      } else {
        this.mode = 'materials';
        this.createMaterialImageList();
        const treeContainer = document.getElementById("evolution-tree");
        treeContainer.innerHTML = "";
        treeContainer.classList.add('materials-mode');
      }
    },

    // 인라인 이벤트로 호출될 전역 함수로 노출할 함수
    filterDigimonByStage(stage) {
      // stage가 'all'이면 전체, 그렇지 않으면 stage와 일치하는 데이터로 필터링
      const filtered = stage === "all"
        ? DataModule.allData
        : DataModule.allData.filter(d => d.evolution_stage == stage);
      
      // 필터링된 데이터로 이미지 리스트 업데이트
      this.createDigimonImageList(filtered);
      
      // 선택된 디지몬이 있다면 해당 디지몬의 진화 트리도 업데이트
      if (this.selectedDigimon) {
        const digimonName = this.selectedDigimon.querySelector('img').alt;
        EvolutionTreeManager.showEvolutionTreeForDigimon(digimonName);
      }
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
    showNameTooltip(event, name) {
      let tooltip = document.querySelector('.name-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'name-tooltip';
        document.body.appendChild(tooltip);
      }
      tooltip.textContent = name;
      tooltip.classList.add('visible-tooltip');

      // 툴팁 위치 계산
      const tooltipRect = tooltip.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      let tooltipTop;

      if (window.innerWidth > 1024) {
        tooltipTop = event.clientY - 20;

        // 툴팁이 화면 아래로 넘어가는지 확인
        if (tooltipTop + tooltipRect.height > windowHeight) {
          tooltipTop = windowHeight - tooltipRect.height - 10; // 10px 여백
        }

        tooltip.style.left = `${event.clientX + 12}px`;
        tooltip.style.top = `${tooltipTop}px`;
        tooltip.style.bottom = '';
        tooltip.style.transform = '';
      } else {
        tooltip.style.left = '50%';
        tooltip.style.top = '20px';
        tooltip.style.bottom = 'auto';
        tooltip.style.transform = 'translateX(-50%)';
      }
    },
    hideNameTooltip() {
      const tooltip = document.querySelector('.name-tooltip');
      if (tooltip) {
        tooltip.classList.remove('visible-tooltip');
      }
    },
    showEvolutionTooltip(event, digimonName) {
      let tooltip = document.querySelector('.tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        document.body.appendChild(tooltip);
      }
      tooltip.textContent = digimonName;
      tooltip.classList.add('visible-tooltip');
      if (window.innerWidth > 1024) {
        tooltip.style.left = `${event.clientX + 12}px`;
        tooltip.style.top = `${event.clientY - 20}px`;
        tooltip.style.bottom = '';
        tooltip.style.transform = '';
      } else {
        tooltip.style.left = '50%';
        tooltip.style.top = 'auto';
        tooltip.style.bottom = '20px';
        tooltip.style.transform = 'translateX(-50%)';
      }
    },
    hideEvolutionTooltip() {
      const tooltip = document.querySelector('.tooltip');
      if (tooltip) {
        tooltip.classList.remove('visible-tooltip');
      }
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
          this.showJogressTooltip(event, jogressEntry);
        }
        return;
      }

      // 진화 조건 데이터 찾기
      let digimonInfo = null;
      const allConditions = DataModule.conditionData.filter(d => d.name === parentData.name);
      
      // 진화타입 컬럼만으로 분기 (진화재료 유무와 무관)
      if (evoType === "dark") {
        digimonInfo = allConditions.find(d => (d["진화타입"] || "").trim() === "암흑진화");
      } else if (evoType === "special") {
        digimonInfo = allConditions.find(d => (d["진화타입"] || "").trim() === "특수진화");
      } else if (evoType === "burst") {
        digimonInfo = allConditions.find(d => (d["진화타입"] || "").trim() === "버스트진화");
      } else {
        // 일반진화: 진화타입 컬럼이 비어있는 row
        digimonInfo = allConditions.find(d => !d["진화타입"] || d["진화타입"].trim() === "");
      }

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
      } else if (evoType === "burst" && digimonInfo["버스트진화재료"]?.trim()) {
        tableHtml += `<tr><th>진화 재료</th><td>${digimonInfo["버스트진화재료"]}</td></tr>`;
      }
      tableHtml += `</table>`;
      let tooltip = document.querySelector('.tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        document.body.appendChild(tooltip);
      }
      tooltip.innerHTML = tableHtml;
      tooltip.classList.add('visible-tooltip');

      // 툴팁 위치 계산
      const tooltipRect = tooltip.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const nameTooltip = document.querySelector('.name-tooltip');
      let tooltipTop;

      if (window.innerWidth > 1024) {
        if (nameTooltip && nameTooltip.classList.contains('visible-tooltip')) {
          const nameTooltipRect = nameTooltip.getBoundingClientRect();
          tooltipTop = nameTooltipRect.bottom + 5;

          // 이름 툴팁이 화면 아래쪽에 있는 경우, 이름 툴팁을 위로 이동
          if (nameTooltipRect.bottom + tooltipRect.height > windowHeight) {
            const newNameTooltipTop = windowHeight - nameTooltipRect.height - tooltipRect.height - 15; // 15px 여백
            nameTooltip.style.top = `${newNameTooltipTop}px`;
            tooltipTop = newNameTooltipTop + nameTooltipRect.height + 5;
          }
        } else {
          tooltipTop = event.clientY - 20;
        }

        // 툴팁이 화면 아래로 넘어가는지 확인
        if (tooltipTop + tooltipRect.height > windowHeight) {
          tooltipTop = windowHeight - tooltipRect.height - 10; // 10px 여백
        }

        tooltip.style.left = `${event.clientX + 12}px`;
        tooltip.style.top = `${tooltipTop}px`;
        tooltip.style.bottom = '';
        tooltip.style.transform = '';
      } else {
        tooltip.style.left = '50%';
        tooltip.style.top = 'auto';
        tooltip.style.bottom = '20px';
        tooltip.style.transform = 'translateX(-50%)';
      }

      this.observeNodeChanges(event.target, tooltip);
    },
    showJogressTooltip(event, jogressEntry) {
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

      // 툴팁 위치 계산
      const tooltipRect = tooltip.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const nameTooltip = document.querySelector('.name-tooltip');
      let tooltipTop;

      if (window.innerWidth > 1024) {
        if (nameTooltip && nameTooltip.classList.contains('visible-tooltip')) {
          const nameTooltipRect = nameTooltip.getBoundingClientRect();
          tooltipTop = nameTooltipRect.bottom + 5;

          // 이름 툴팁이 화면 아래쪽에 있는 경우, 이름 툴팁을 위로 이동
          if (nameTooltipRect.bottom + tooltipRect.height > windowHeight) {
            const newNameTooltipTop = windowHeight - nameTooltipRect.height - tooltipRect.height - 15; // 15px 여백
            nameTooltip.style.top = `${newNameTooltipTop}px`;
            tooltipTop = newNameTooltipTop + nameTooltipRect.height + 5;
          }
        } else {
          tooltipTop = event.clientY - 20;
        }

        // 툴팁이 화면 아래로 넘어가는지 확인
        if (tooltipTop + tooltipRect.height > windowHeight) {
          tooltipTop = windowHeight - tooltipRect.height - 10; // 10px 여백
        }

        tooltip.style.left = `${event.clientX + 12}px`;
        tooltip.style.top = `${tooltipTop}px`;
        tooltip.style.bottom = '';
        tooltip.style.transform = '';
      } else {
        tooltip.style.left = '50%';
        tooltip.style.top = 'auto';
        tooltip.style.bottom = '20px';
        tooltip.style.transform = 'translateX(-50%)';
      }

      tooltip.classList.add("visible-tooltip");
      tooltip.classList.add("jogress-tooltip");
    },
    hideJogressTooltip() {
      const tooltip = document.querySelector('.jogress-tooltip');
      if (tooltip) {
        tooltip.classList.remove('visible-tooltip');
        tooltip.style.left = '-9999px';
        tooltip.style.top = '-9999px';
      }
    },
    updateTooltipPosition(target, tooltip) {
      const rect = target.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX - 2}px`;
      tooltip.style.top = `${rect.top + window.scrollY - 95}px`;
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
      document.querySelector('.tooltip').classList.remove('visible-tooltip');
    }
  };

  // ===============================
  // EvolutionTreeManager: 진화 트리 처리
  // ===============================
  const EvolutionTreeManager = {
    selectedDigimonName: null,
    // name 기준으로 하위 자손 디지몬 이름 전체 집합을 반환
    getAllDescendants(startName, visited = new Set()) {
      if (visited.has(startName)) return [];
      visited.add(startName);
      const start = DataModule.allData.find(d => d.name === startName);
      if (!start) return [];
      const nextNames = [
        start.evol1, start.evol2, start.evol3, start.evol4, start.evol5,
        start.evol6, start.evol7, start.evol8, start.evol9, start.evol10,
        start.evol11, start.조그레스, start.암흑진화, start.특수진화, start.버스트진화
      ].filter(Boolean);
      let results = [];
      nextNames.forEach(n => {
        results.push(n);
        results.push(...this.getAllDescendants(n, visited));
      });
      return Array.from(new Set(results));
    },
    showTreesForMaterial(materialName) {
      const entries = DataModule.materialIndex.get(materialName) || [];
      const parents = Array.from(new Set(entries.map(e => e.parent).filter(Boolean)));
      const treeContainer = document.getElementById("evolution-tree");
      treeContainer.innerHTML = "";
      parents.forEach(parentName => {
        const lowerEvolutions = this.findAllLowerEvolutions(parentName);
        const treeData = this.filterTreeByDigimonName(parentName);
        if (treeData.length > 0) {
          const stageContainer = this.createStageContainer(treeData, lowerEvolutions);
          treeContainer.appendChild(stageContainer);
          // 자동 펼치기: 각 부모 노드의 + 버튼 클릭
          const plusButtons = stageContainer.querySelectorAll('.plus-btn');
          plusButtons.forEach(btn => btn.click());
          // 하이라이트: 해당 재료 사용으로 이어지는 모든 자손까지 표시
          const directTargets = entries
            .filter(e => e.parent === parentName)
            .map(e => e.child)
            .filter(Boolean);
          const highlightSet = new Set(directTargets);
          directTargets.forEach(child => {
            this.getAllDescendants(child).forEach(n => highlightSet.add(n));
          });
          // 부모 노드 하이라이트 (연결선은 하이라이트하지 않음)
          const parentImg = stageContainer.querySelector(`img[alt="${CSS.escape(parentName)}"]:not(.type-image)`);
          if (parentImg) {
            const parentNode = parentImg.closest('.digimon');
            if (parentNode) parentNode.classList.add('highlighted');
          }
          // 노드 및 커넥터 하이라이트 적용
          const nodes = stageContainer.querySelectorAll('.digimon-container .digimon');
          nodes.forEach(node => {
            const img = Array.from(node.querySelectorAll('img')).find(i => !i.classList.contains('type-image'));
            if (!img) return;
            if (highlightSet.has(img.alt)) {
              node.classList.add('highlighted');
            }
          });
        }
      });
    },
    showEvolutionTreeForDigimon(digimonName) {
      this.selectedDigimonName = digimonName;
      const lowerEvolutions = this.findAllLowerEvolutions(digimonName);
      const treeData = this.filterTreeByDigimonName(digimonName);
      
      if (treeData.length > 0) {
        this.createEvolutionTree(treeData, lowerEvolutions);
        // 선택한 디지몬으로 이어지는 경로에 한해 자동으로 펼치기
        const treeContainer = document.getElementById("evolution-tree");
        const expandToSelectedOnly = () => {
          const digimonNodes = treeContainer.querySelectorAll('.digimon');
          let clicked = 0;
          digimonNodes.forEach(node => {
            const img = Array.from(node.querySelectorAll('img')).find(i => !i.classList.contains('type-image'));
            if (!img) return;
            const name = img.alt;
            const plus = node.querySelector('.plus-btn');
            if (!plus || plus.textContent !== '+') return;
            const data = DataModule.allData.find(d => d.name === name);
            if (data && name !== digimonName && EvolutionTreeManager.isDigimonInTree(data, digimonName)) {
              plus.click();
              clicked++;
            }
          });
          if (clicked > 0) {
            setTimeout(expandToSelectedOnly, 0);
          } else {
            UIManager.updateAllVerticalLinesAndHorizontalConnectors();
          }
        };
        setTimeout(expandToSelectedOnly, 0);
      } else {
        // 특수한 진화 조건을 가진 디지몬의 경우 해당 디지몬의 정보를 직접 보여줌
        const selectedDigimon = DataModule.allData.find(d => d.name === digimonName);
        if (selectedDigimon) {
          this.createSpecialEvolutionTree(selectedDigimon);
        } else {
          alert("해당 디지몬의 진화트리를 찾을 수 없습니다.");
        }
      }
    },
    findAllLowerEvolutions(digimonName, visited = new Set()) {
      if (visited.has(digimonName)) return [];
      visited.add(digimonName);
      const lower = [digimonName];
      const direct = DataModule.allData.filter(d =>
        [
          d.evol1, d.evol2, d.evol3, d.evol4, d.evol5,
          d.evol6, d.evol7, d.evol8, d.evol9, d.evol10,
          d.evol11, d.조그레스, d.암흑진화, d.특수진화, d.버스트진화
        ].includes(digimonName)
      );
      direct.forEach(d => {
        lower.push(...this.findAllLowerEvolutions(d.name, visited));
      });
      return lower;
    },
    filterTreeByDigimonName(digimonName) {
      const selected = DataModule.allData.find(d => d.name === digimonName);
      if (!selected) return [];
      const stage = parseInt(selected.evolution_stage, 10);
      
      let stageFilters = [];
      if (stage === 1) {
        stageFilters = ["1"];
      } else if (stage === 2) {
        stageFilters = ["2"];
      } else if (stage === 3) {
        // 성장기 디지몬의 경우 먼저 유년기2에서 검색
        const candidatesFromStage2 = DataModule.allData.filter(d => d.evolution_stage === "2");
        const hasEvolutionFromStage2 = candidatesFromStage2.some(d => this.isDigimonInTree(d, digimonName));
        
        if (hasEvolutionFromStage2) {
          // 유년기2에서 진화할 수 있는 경우
          stageFilters = ["2"];
        } else {
          // 유년기2에서 진화할 수 없는 경우, 다른 성장기에서 진화하는지 확인
          const candidatesFromStage3 = DataModule.allData.filter(d => d.evolution_stage === "3");
          const hasEvolutionFromStage3 = candidatesFromStage3.some(d => this.isDigimonInTree(d, digimonName));
          
          if (hasEvolutionFromStage3) {
            // 다른 성장기에서 진화하는 경우, 해당 성장기들을 보여줌
            // 아구몬(S):버스트모드 같은 경우는 아구몬(S)만 보여줘야 함
            const parentDigimons = candidatesFromStage3.filter(d => this.isDigimonEvolvedFrom(digimonName, d.name));
            if (parentDigimons.length > 0) {
              // 부모 디지몬들만 보여줌
              return parentDigimons;
            } else {
              stageFilters = ["3"];
            }
          } else {
            // 진화 경로가 없는 경우 성장기 단계 자체를 보여줌
            stageFilters = ["3"];
          }
        }
      } else if (stage >= 4 && stage <= 6) {
        // 성숙기~궁극체 디지몬의 경우 성장기에서 검색
        stageFilters = ["3"];
      }
      
      if (stageFilters.length === 0) return [];
      
      // 여러 단계에서 후보를 찾기
      let allCandidates = [];
      stageFilters.forEach(filter => {
        const candidates = DataModule.allData.filter(d => d.evolution_stage === filter);
        allCandidates.push(...candidates);
      });
      
      return allCandidates.filter(d => this.isDigimonInTree(d, digimonName));
    },
    isDigimonInTree(digimon, searchName, visited = new Set()) {
      if (!digimon || visited.has(digimon.name)) {
        return false;
      }
      visited.add(digimon.name);
      if (digimon.name === searchName) return true;
      const evolutions = [
        digimon.evol1, digimon.evol2, digimon.evol3, digimon.evol4, digimon.evol5,
        digimon.evol6, digimon.evol7, digimon.evol8, digimon.evol9, digimon.evol10,
        digimon.evol11, digimon.조그레스, digimon.암흑진화, digimon.특수진화, digimon.버스트진화
      ].filter(e => e);
      for (const evo of evolutions) {
        const next = DataModule.allData.find(d => d.name === evo);
        if (next && this.isDigimonInTree(next, searchName, visited)) return true;
      }
      return false;
    },

    // 특정 디지몬이 다른 디지몬의 진화 결과인지 확인하는 함수
    isDigimonEvolvedFrom(digimonName, fromDigimonName) {
      const fromDigimon = DataModule.allData.find(d => d.name === fromDigimonName);
      if (!fromDigimon) return false;
      
      const evolutions = [
        fromDigimon.evol1, fromDigimon.evol2, fromDigimon.evol3, fromDigimon.evol4, fromDigimon.evol5,
        fromDigimon.evol6, fromDigimon.evol7, fromDigimon.evol8, fromDigimon.evol9, fromDigimon.evol10,
        fromDigimon.evol11, fromDigimon.조그레스, fromDigimon.암흑진화, fromDigimon.특수진화, fromDigimon.버스트진화
      ];
      
      return evolutions.includes(digimonName);
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

    createSpecialEvolutionTree(digimon) {
      const treeContainer = document.getElementById("evolution-tree");
      treeContainer.innerHTML = "";
      
      const specialContainer = document.createElement("div");
      specialContainer.classList.add("special-evolution-container");
      
      const title = document.createElement("h3");
      title.textContent = `${digimon.name} - 특수 진화 조건`;
      title.style.textAlign = "center";
      title.style.marginBottom = "20px";
      title.style.color = "#333";
      
      const infoContainer = document.createElement("div");
      infoContainer.classList.add("special-info");
      infoContainer.style.padding = "20px";
      infoContainer.style.backgroundColor = "#f5f5f5";
      infoContainer.style.borderRadius = "8px";
      infoContainer.style.marginBottom = "20px";
      
      // 진화 단계 정보
      const stageInfo = document.createElement("p");
      stageInfo.innerHTML = `<strong>진화 단계:</strong> ${this.getStageName(digimon.evolution_stage)}`;
      stageInfo.style.marginBottom = "10px";
      
      // 진화 가능한 디지몬들
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
        { name: digimon.특수진화, percent: digimon.percent14, evoType: "special" },
        { name: digimon.버스트진화, percent: digimon.percent15, evoType: "burst" }
      ].filter(e => e.name);
      
      if (evolutions.length > 0) {
        const evoTitle = document.createElement("h4");
        evoTitle.textContent = "진화 가능한 디지몬:";
        evoTitle.style.marginBottom = "10px";
        evoTitle.style.color = "#555";
        
        const evoList = document.createElement("div");
        evoList.style.display = "flex";
        evoList.style.flexWrap = "wrap";
        evoList.style.gap = "10px";
        
        evolutions.forEach(evo => {
          const evoItem = document.createElement("div");
          evoItem.style.padding = "8px 12px";
          evoItem.style.backgroundColor = "#fff";
          evoItem.style.border = "1px solid #ddd";
          evoItem.style.borderRadius = "4px";
          evoItem.style.fontSize = "14px";
          
          let evoText = evo.name;
          if (evo.evoType === "dark") evoText += " (암흑진화)";
          else if (evo.evoType === "special") evoText += " (특수진화)";
          else if (evo.evoType === "burst") evoText += " (버스트진화)";
          
          evoText += ` - ${evo.percent}%`;
          evoItem.textContent = evoText;
          
          evoList.appendChild(evoItem);
        });
        
        infoContainer.appendChild(evoTitle);
        infoContainer.appendChild(evoList);
      }
      
      // 특수 진화 조건 정보 (condition.csv에서 가져오기)
      const conditionInfo = DataModule.conditionData.find(c => c.name === digimon.name);
      if (conditionInfo) {
        const conditionTitle = document.createElement("h4");
        conditionTitle.textContent = "진화 조건:";
        conditionTitle.style.marginBottom = "10px";
        conditionTitle.style.color = "#555";
        conditionTitle.style.marginTop = "20px";
        
        const conditionList = document.createElement("div");
        conditionList.style.display = "flex";
        conditionList.style.flexDirection = "column";
        conditionList.style.gap = "5px";
        
        if (conditionInfo.레벨) {
          const levelItem = document.createElement("div");
          levelItem.innerHTML = `<strong>레벨:</strong> ${conditionInfo.레벨}`;
          conditionList.appendChild(levelItem);
        }
        
        if (conditionInfo.유대감) {
          const bondItem = document.createElement("div");
          bondItem.innerHTML = `<strong>유대감:</strong> ${conditionInfo.유대감}%`;
          conditionList.appendChild(bondItem);
        }
        
        if (conditionInfo.진화재료) {
          const materialItem = document.createElement("div");
          materialItem.innerHTML = `<strong>진화 재료:</strong> ${conditionInfo.진화재료}`;
          conditionList.appendChild(materialItem);
        }
        
        if (conditionInfo.버스트진화재료) {
          const burstMaterialItem = document.createElement("div");
          burstMaterialItem.innerHTML = `<strong>버스트진화 재료:</strong> ${conditionInfo.버스트진화재료}`;
          conditionList.appendChild(burstMaterialItem);
        }
        
        if (conditionInfo.특수진화재료) {
          const specialMaterialItem = document.createElement("div");
          specialMaterialItem.innerHTML = `<strong>특수진화 재료:</strong> ${conditionInfo.특수진화재료}`;
          conditionList.appendChild(specialMaterialItem);
        }
        
        if (conditionInfo.암흑진화재료) {
          const darkMaterialItem = document.createElement("div");
          darkMaterialItem.innerHTML = `<strong>암흑진화 재료:</strong> ${conditionInfo.암흑진화재료}`;
          conditionList.appendChild(darkMaterialItem);
        }
        
        if (conditionInfo.진화타입) {
          const typeItem = document.createElement("div");
          typeItem.innerHTML = `<strong>진화 타입:</strong> ${conditionInfo.진화타입}`;
          conditionList.appendChild(typeItem);
        }
        
        if (conditionList.children.length > 0) {
          infoContainer.appendChild(conditionTitle);
          infoContainer.appendChild(conditionList);
        }
      }
      
      specialContainer.appendChild(title);
      specialContainer.appendChild(infoContainer);
      treeContainer.appendChild(specialContainer);
    },

    getStageName(stage) {
      const stageNames = {
        "1": "유년기1",
        "2": "유년기2", 
        "3": "성장기",
        "4": "성숙기",
        "5": "완전체",
        "6": "궁극체"
      };
      return stageNames[stage] || `단계 ${stage}`;
    },
    createDigimonNode(digimon, lowerEvolutions, evoType = "normal") {
      const container = document.createElement("div");
      container.classList.add("digimon-container");
      const digimonDiv = document.createElement("div");
      digimonDiv.classList.add("digimon");
      const safeName = digimon.name.replace(":", "_");
      const img = document.createElement("img");
      img.src = `https://media.dsrwiki.com/dsrwiki/digimon/${safeName}/${safeName}.webp`;
      img.alt = digimon.name;
      img.dataset.evoType = evoType;
      const characterInfo = DataModule.charactersData.find(c => c.name === digimon.name);
      if (characterInfo && characterInfo.type) {
        const typeImg = document.createElement("img");
        typeImg.src = `https://media.dsrwiki.com/dsrwiki/${characterInfo.type}.webp`;
        typeImg.alt = characterInfo.type;
        typeImg.classList.add("type-image");
        digimonDiv.appendChild(typeImg);
      }
      img.addEventListener("mouseover", (event) => {
        TooltipManager.showNameTooltip(event, digimon.name);
        TooltipManager.showDigimonTooltip(event, digimon.name, evoType);
      });
      img.addEventListener("mousemove", (event) => {
        TooltipManager.showNameTooltip(event, digimon.name);
        TooltipManager.showDigimonTooltip(event, digimon.name, evoType);
      });
      img.addEventListener("mouseout", () => {
        TooltipManager.hideNameTooltip();
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
        { name: digimon.특수진화, percent: digimon.percent14, evoType: "special" },
        { name: digimon.버스트진화, percent: digimon.percent15, evoType: "burst" }
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

                if (evo.evoType === "dark" || evo.evoType === "special") {
                  const evoLabel = document.createElement("div");
                  evoLabel.classList.add("evo-label");
                  evoLabel.setAttribute("data-evo-type", evo.evoType);
                  evoLabel.textContent = evo.evoType === "dark" ? "암흑진화" : "특수진화";
                  horizontalConnector.appendChild(evoLabel);
                }

                // 버스트진화 텍스트 추가
                if (evo.evoType === "burst") {
                  const evoLabel = document.createElement("div");
                  evoLabel.classList.add("evo-label");
                  evoLabel.setAttribute("data-evo-type", evo.evoType);
                  evoLabel.textContent = "버스트진화";
                  horizontalConnector.appendChild(evoLabel);
                }

                // jogress-image(중간 작은 이미지)는 forEach 내부에서만 생성
                if (evo.name === digimon.조그레스) {
                  const jogressImageName = digimon[Object.keys(digimon)[26]];
                  const jogressImagePath = `https://media.dsrwiki.com/dsrwiki/digimon/${jogressImageName}/${jogressImageName}.webp`;
                  const jogressImg = document.createElement("img");
                  jogressImg.src = jogressImagePath;
                  jogressImg.classList.add("jogress-image");
                  horizontalConnector.appendChild(jogressImg);
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
      return container;
    },
    getIntersectionPercentage(verticalLine, horizontalLine) {
      const vRect = verticalLine.getBoundingClientRect();
      if (!vRect.height) {
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

    const feedbackPopup = document.getElementById('feedback-popup');
    const closeButton = document.getElementById('close-feedback-popup');
    const hideTodayButton = document.getElementById('hide-feedback-popup-today');

    const FEEDBACK_POPUP_HIDDEN_COOKIE = 'feedbackPopupHidden';

    // 쿠키 가져오기 함수
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // 쿠키 설정 함수 (만료 시간을 하루로 설정)
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    // 페이지 로드 시 팝업 표시 여부 결정
    if (!getCookie(FEEDBACK_POPUP_HIDDEN_COOKIE)) {
        if (feedbackPopup) {
            feedbackPopup.style.display = 'block';
        }
    }

    // 닫기 버튼 이벤트 리스너
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (feedbackPopup) {
                feedbackPopup.style.display = 'none';
            }
        });
    }

    // 하루 동안 보지 않기 버튼 이벤트 리스너
    if (hideTodayButton) {
        hideTodayButton.addEventListener('click', () => {
            setCookie(FEEDBACK_POPUP_HIDDEN_COOKIE, 'true', 1);
            if (feedbackPopup) {
                feedbackPopup.style.display = 'none';
            }
        });
    }
  });

  // 인라인 이벤트(HTML onclick)를 사용할 수 있도록 전역 함수 노출
  window.filterDigimonByStage = UIManager.filterDigimonByStage.bind(UIManager);
  window.searchDigimonByName = UIManager.searchDigimonByName.bind(UIManager);

  // document 레벨에서 마우스가 jogressResultImgTarget 밖으로 나가면 툴팁 숨김
  document.addEventListener("mousemove", (event) => {
    if (
      jogressResultImgTarget &&
      !jogressResultImgTarget.contains(event.target)
    ) {
      TooltipManager.hideJogressTooltip();
      jogressResultImgTarget = null;
    }
  });
})();