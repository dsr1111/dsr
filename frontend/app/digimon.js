(() => {
  // ====================================================
  // 1. 전역 변수 및 필터 상태
  // ====================================================
  const filters = {
    evolution: [],
    type: [],
    skill: [],
    strong: [],
    weak: [],
    field: [],
  };
  let currentSortState = {
    column: -1,
    direction: 'none' // 'none', 'asc', 'desc'
  };
  let originalRows = []; // 원래 순서를 저장할 배열

  // 커스텀 툴팁 표시 함수
  function showCustomTooltip(e, text) {
    const tooltip = document.getElementById('custom-tooltip');
    const tooltipSpan = tooltip.querySelector('span');
    tooltipSpan.textContent = text;
    tooltip.style.display = 'block';
    
    // 이미지의 위치 정보 가져오기
    const rect = e.target.getBoundingClientRect();
    
    // 툴팁의 크기 정보 가져오기
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // 툴팁을 이미지 중앙에 맞추기
    const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${rect.bottom + 5}px`;
    
    // 툴팁이 화면 오른쪽 끝을 벗어나는 경우
    if (left + tooltipRect.width > window.innerWidth) {
      tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
    }
    
    // 툴팁이 화면 왼쪽 끝을 벗어나는 경우
    if (left < 0) {
      tooltip.style.left = '10px';
    }
  }

  function hideCustomTooltip() {
    const tooltip = document.getElementById('custom-tooltip');
    tooltip.style.display = 'none';
  }

  // ====================================================
  // 2. CSV Loader Module (CSV 파일 로드 및 파싱)
  // ====================================================
  const CSVLoader = {
    async loadCSV(url) {
      const response = await fetch(url);
      const text = await response.text();
      // 첫 줄(헤더) 제외 후 각 줄을 객체화
      const rows = text.split("\n").slice(1).filter((row) => row.trim() !== "");
      return rows.map((row) => {
        const columns = row.split(",");
        return {
          name: columns[10],
          타수: columns[13],
          범위: columns[14],
          속성: columns[15],
          targetCount: columns[17],
          effect: columns[18],
          additionalTurn: columns[19],
        };
      });
    }
  };

  // ====================================================
  // 3. TableDataManager Module (CSV 읽고 테이블 생성)
  // ====================================================
  const TableDataManager = {
    async fetchCSV() {
      // skill 파일 3종 로드
      const [skill1Data, skill2Data, skill3Data] = await Promise.all([
        CSVLoader.loadCSV("../data/csv/skill1.csv"),
        CSVLoader.loadCSV("../data/csv/skill2.csv"),
        CSVLoader.loadCSV("../data/csv/skill3.csv"),
      ]);

      // characters.csv 로드
      const response = await fetch("../data/csv/characters.csv");
      const text = await response.text();
      const rows = text.split("\n").slice(1).filter((row) => row.trim() !== "");
      const tableBody = document.getElementById("characterTable");
      tableBody.innerHTML = "";

      rows.forEach((row) => {
        const columns = row.split(",");
        const name = columns[0];
        const evolution = columns[1];
        const type = columns[2];
        const level = columns[3];
        const HP = columns[4];
        const SP = columns[5];
        const 힘 = columns[6];
        const 지능 = columns[7];
        const 수비 = columns[8];
        const 저항 = columns[9];
        const 속도 = columns[10];
        const 강점 = columns[11];
        const 강점효과 = columns[12];
        const 약점 = columns[13];
        const 약점효과 = columns[14];
        const 필드 = columns[15];

        const typeImagePath = `../image/${type}.webp`;
        const typeImgHtml = `<img src="${typeImagePath}" alt="${type}" 
          style="width:23px;height:23px;display:block;margin:0 auto;cursor:pointer;"
          onmouseenter="showCustomTooltip(event, '${type}')"
          onmousemove="showCustomTooltip(event, '${type}')"
          onmouseleave="hideCustomTooltip()"
        >`;

        const strongHtml = 강점
          ? `<img src="../image/${강점}.webp" alt="${강점}" 
              style="width:25px;height:25px;vertical-align:middle;background-image:url('../image/strongbackground.webp');background-size:120%;background-position:center;cursor:pointer;"
              onmouseenter="showCustomTooltip(event, '${강점}')"
              onmousemove="showCustomTooltip(event, '${강점}')"
              onmouseleave="hideCustomTooltip()"
            > <span>${강점효과 ? 강점효과 : ""}</span>`
          : "";

        const weakHtml = 약점
          ? `<img src="../image/${약점}.webp" alt="${약점}" 
              style="width:25px;height:25px;vertical-align:middle;background-image:url('../image/weakbackground.webp');background-size:120%;background-position:center;cursor:pointer;"
              onmouseenter="showCustomTooltip(event, '${약점}')"
              onmousemove="showCustomTooltip(event, '${약점}')"
              onmouseleave="hideCustomTooltip()"
            > <span>${약점효과 ? 약점효과 : ""}</span>`
          : "";

        const fieldsHtml = 필드
          ? 필드
              .split(";")
              .map(field => field.trim()) // 공백 제거
              .filter(field => field !== "") // 빈 문자열 제거
              .map(
                (field) =>
                  `<img src="../image/field/${field}.webp" alt="${field}" 
                    style="width:25px;height:25px;cursor:pointer;"
                    onmouseenter="showCustomTooltip(event, '${field}')"
                    onmousemove="showCustomTooltip(event, '${field}')"
                    onmouseleave="hideCustomTooltip()"
                  >`
              )
              .join("")
          : "";

        // 각 스킬 데이터 찾기 (이름 기준)
        const skill1 = skill1Data.find((skill) => skill.name === name);
        const skill2 = skill2Data.find((skill) => skill.name === name);
        const skill3 = skill3Data.find((skill) => skill.name === name);

        const format타수 = (타수) => {
          return isNaN(타수) || 타수 === "" ? 타수 : `${타수}타`;
        };

        // 스킬 셀 생성 함수
        const createSkillHtml = (skill, skillNumber, digimonName) => {
          if (!skill) return "<td></td>";
          let backgroundColor = "";
          if (skill.additionalTurn) {
            backgroundColor = "background-color: rgb(255,234,234);";
          }
          if (skill.targetCount && skill.targetCount.trim() === "전체") {
            backgroundColor = "background-color: rgb(220,248,248);";
          }

          // 스킬 효과 설명 매핑 (소문자로 비교)
          const effectDescriptions = {
            출혈: "* 출혈<br>공격 시 65% 확률로 발생됩니다.<br>턴마다 지속 피해를 입힙니다.<br>물리속성에 취약해집니다.<br>힐 받을 경우 해제됩니다.",
            화상: "* 화상<br>공격 시 65% 확률로 발생됩니다.<br>턴마다 지속 피해를 입힙니다.<br>바람속성에 취약해집니다.<br>물속성 피격 시 해제됩니다.",
            중독: "* 중독<br>공격 시 65% 확률로 발생됩니다.<br>턴마다 지속 피해를 입힙니다.<br>어둠속성에 취약해집니다.<br>불속성 피격 시 해제됩니다.",
            감전: "* 감전<br>공격 시 65% 확률로 발생됩니다.<br>턴마다 지속 피해를 입힙니다.<br>물속성에 취약해집니다.<br>나무속성 피격 시 해제됩니다.",
            빙결: "* 빙결<br>공격 시 x% 확률로 발생됩니다.<br>일정 턴 동안 행동 불가.<br>천둥속성에 취약해집니다.<br>천둥속성 피격 시 해제됩니다.",
            석화: "* 석화<br>공격 시 x% 확률로 발생됩니다.<br>일정 턴 동안 행동 불가.<br>강철속성에 취약해집니다.<br>강철속성 피격 시 해제됩니다.",
            격리: "* 격리<br>공격 시 x% 확률로 발생됩니다.<br>일정 턴 동안 행동 불가.<br>빛속성에 취약해집니다.<br>빛속성 피격 시 해제됩니다.",
            스턴: "* 스턴<br>공격 시 x% 확률로 발생됩니다.<br>일정 턴 동안 행동 불가.",
            연소: "* 연소<br>공격 시 65% 확률로 발생됩니다.<br>턴마다 대상의 SP 추가 소모.<br>스킬 레벨에 따라 소모량 증가.",
            매료: "* 매료<br>공격 시 29.5% 확률로 발생됩니다.<br>일정 턴 동안 명령 불가.<br>피아식별 없이 행동.",
            "방어력 감소": "* 방어력 감소<br>공격 시 65% 확률로 발생됩니다.<br>일정 턴 동안 DEF x% 감소",
            "방어력 증가": "* 방어력 증가<br>일정 턴 동안 DEF x% 증가",
            "공격력 증가": "* 공격력 증가<br>일정 턴 동안 STR x% 증가",
            "속도 감소": "* 속도 감소<br>공격 시 65% 확률로 발생됩니다.<br>일정 턴 동안 SPD x% 감소",
            "속도 증가": "* 속도 증가<br>일정 턴 동안 SPD x% 증가",
            "치명타율 증가": "* 치명타율 증가<br>일정 턴 동안 치명타율 x% 증가",
            "회피율 증가": "* 회피율 증가<br>일정 턴 동안 회피율 x% 증가",
            회복: "* 회복",
            혼란: "* 혼란<br>공격 시 29.5% 확률로 발생됩니다.<br>일정 턴 동안 명령 불가.<br>피아식별 없이 행동.",
          };

          const normalizedEffect = skill.effect
            ? skill.effect.trim().toLowerCase()
            : "";
          const effectDescriptionsLower = Object.keys(effectDescriptions).reduce(
            (acc, key) => {
              acc[key.toLowerCase()] = effectDescriptions[key];
              return acc;
            },
            {}
          );
          const effectDescription =
            normalizedEffect && effectDescriptionsLower[normalizedEffect]
              ? effectDescriptionsLower[normalizedEffect]
              : "효과 설명을 찾을 수 없습니다.";
          let effectImagePath = skill.effect
            ? `../image/debuff/${skill.effect}.webp`
            : "";
          if (normalizedEffect === "회복") {
            effectImagePath = `../image/digimon/${digimonName}/skill${skillNumber}.webp`;
          }
          const effectTooltipHtml =
            skill.effect && effectDescription
              ? `<div class="tooltip">
                   <img src="${effectImagePath}" alt="${skill.effect}" style="width:23px;height:23px;vertical-align:middle;border-radius:50%;">
                   <div class="tooltiptext">
                     <div class="tooltip-content">
                       <img src="${effectImagePath}" alt="${skill.effect} 이미지" style="width:30px;height:30px;border-radius:50%;">
                       <div class="tooltip-description">${effectDescription}</div>
                     </div>
                   </div>
                 </div>`
              : "";
          return `
            <td style="${backgroundColor}">
              <img src="../image/${skill.속성}.webp" alt="${skill.속성}" 
                style="width:25px;height:25px;vertical-align:middle;background-image:url('../image/background.webp');background-size:120%;background-position:center;cursor:pointer;"
                onmouseenter="showCustomTooltip(event, '${skill.속성}')"
                onmousemove="showCustomTooltip(event, '${skill.속성}')"
                onmouseleave="hideCustomTooltip()"
              >
              ${effectTooltipHtml}
              <span>${format타수(skill.타수)} / ${skill.범위}</span>
            </td>
          `;
        };

        // 이미지 경로 (특수문자 ':' 은 '_'로 변경)
        const sanitizedName = name.replace(/[:]/g, "_");
        const characterImagePath = `../image/digimon/${sanitizedName}/${sanitizedName}.webp`;

        // 행 생성 및 데이터 속성 저장 (필터링 용)
        const newRow = document.createElement("tr");
        newRow.dataset.name = name;
        newRow.dataset.evolution = evolution;
        newRow.dataset.type = type;
        newRow.dataset.level = level;
        newRow.dataset.hp = HP;
        newRow.dataset.sp = SP;
        newRow.dataset.힘 = 힘;
        newRow.dataset.지능 = 지능;
        newRow.dataset.수비 = 수비;
        newRow.dataset.저항 = 저항;
        newRow.dataset.속도 = 속도;
        newRow.dataset.강점 = 강점;
        newRow.dataset.강점효과 = 강점효과;
        newRow.dataset.약점 = 약점;
        newRow.dataset.약점효과 = 약점효과;
        newRow.dataset.fields = 필드;

        newRow.innerHTML = `
          <td>
            <div style="width:25px;height:25px;background-color:black;display:inline-block;vertical-align:middle;">
              <img src="${characterImagePath}" alt="${name}" style="width:100%;height:100%;" onerror="this.src='../image/digimon/default.webp';">
            </div>
            <a href="detail.html?name=${encodeURIComponent(name)}" style="text-decoration:none;color:black;">${name}</a>
          </td>
          <td style="text-align:center;vertical-align:middle;">${level}</td>
          <td style="text-align:center;vertical-align:middle;">${evolution}</td>
          <td style="text-align:center;vertical-align:middle;">
            ${typeImgHtml}
          </td>
          <td style="text-align:center;vertical-align:middle;border-left:2px solid darkgrey;">${HP}</td>
          <td style="text-align:center;vertical-align:middle;">${SP}</td>
          <td style="text-align:center;vertical-align:middle;">${힘}</td>
          <td style="text-align:center;vertical-align:middle;">${지능}</td>
          <td style="text-align:center;vertical-align:middle;">${수비}</td>
          <td style="text-align:center;vertical-align:middle;">${저항}</td>
          <td style="text-align:center;vertical-align:middle;">${속도}</td>
          <td style="border-left:2px solid darkgrey;">${strongHtml}</td>
          <td style="border-right:2px solid darkgrey;">${weakHtml}</td>
          ${createSkillHtml(skill1, 1, name)}
          ${createSkillHtml(skill2, 2, name)}
          ${createSkillHtml(skill3, 3, name)}
          <td style="border-left:2px solid darkgrey;">${fieldsHtml}</td>
        `;
        // 기본적으로 행은 숨김
        newRow.style.display = "none";
        tableBody.appendChild(newRow);
      });
      // 원래 순서 저장
      originalRows = Array.from(tableBody.rows);
    }
  };

  // ====================================================
  // 4. FilterModule Module (필터 토글 및 테이블 필터링)
  // ====================================================
  const FilterModule = {
    toggleAllEvolution() {
      const evolutions = ["성장기", "성숙기", "완전체", "궁극체"];
      const checkBox = document.getElementById("select-all-evolution");
      if (checkBox.checked) {
        evolutions.forEach((evo) => {
          if (!filters.evolution.includes(evo)) {
            filters.evolution.push(evo);
            document.getElementById(evo).classList.add("active");
          }
        });
      } else {
        evolutions.forEach((evo) => {
          filters.evolution = filters.evolution.filter((item) => item !== evo);
          document.getElementById(evo).classList.remove("active");
        });
      }
      this.filterTable();
    },
    toggleEvolution(evolution) {
      const index = filters.evolution.indexOf(evolution);
      if (index > -1) {
        filters.evolution.splice(index, 1);
        document.getElementById(evolution).classList.remove("active");
      } else {
        filters.evolution.push(evolution);
        document.getElementById(evolution).classList.add("active");
      }
      this.filterTable();
    },
    toggleAllType() {
      const types = ["백신", "데이터", "바이러스", "프리", "언노운", "NO DATA"];
      const checkBox = document.getElementById("select-all-type");
      if (checkBox.checked) {
        types.forEach((type) => {
          if (!filters.type.includes(type)) {
            filters.type.push(type);
            document.getElementById(type).classList.add("active");
          }
        });
      } else {
        types.forEach((type) => {
          filters.type = filters.type.filter((item) => item !== type);
          document.getElementById(type).classList.remove("active");
        });
      }
      this.filterTable();
    },
    toggleType(type) {
      const index = filters.type.indexOf(type);
      if (index > -1) {
        filters.type.splice(index, 1);
        document.getElementById(type).classList.remove("active");
      } else {
        filters.type.push(type);
        document.getElementById(type).classList.add("active");
      }
      this.filterTable();
    },
    toggleAllSkill() {
      const skills = ["강철", "나무", "흙", "물", "물리", "바람", "불", "빛", "어둠", "얼음", "천둥"];
      const checkBox = document.getElementById("select-all-skill");
      if (checkBox.checked) {
        skills.forEach((skill) => {
          if (!filters.skill.includes(skill)) {
            filters.skill.push(skill);
            document.getElementById(skill).classList.add("active");
          }
        });
      } else {
        skills.forEach((skill) => {
          filters.skill = filters.skill.filter((item) => item !== skill);
          document.getElementById(skill).classList.remove("active");
        });
      }
      this.filterTable();
    },
    toggleSkill(skill) {
      const index = filters.skill.indexOf(skill);
      if (index > -1) {
        filters.skill.splice(index, 1);
        document.getElementById(skill).classList.remove("active");
      } else {
        filters.skill.push(skill);
        document.getElementById(skill).classList.add("active");
      }
      this.filterTable();
    },
    toggleAllStrong() {
      const strongs = ["강철", "나무", "흙", "물", "물리", "바람", "불", "빛", "어둠", "얼음", "천둥"];
      const checkBox = document.getElementById("select-all-strong");
      if (checkBox.checked) {
        strongs.forEach((strong) => {
          if (!filters.strong.includes(strong)) {
            filters.strong.push(strong);
            document.getElementById(`strong_${strong}`).classList.add("active");
          }
        });
      } else {
        strongs.forEach((strong) => {
          filters.strong = filters.strong.filter((item) => item !== strong);
          document.getElementById(`strong_${strong}`).classList.remove("active");
        });
      }
      this.filterTable();
    },
    toggleSkillStrong(skillstrong) {
      const strength = skillstrong.replace("strong_", "");
      const index = filters.strong.indexOf(strength);
      if (index > -1) {
        filters.strong.splice(index, 1);
        document.getElementById(skillstrong).classList.remove("active");
      } else {
        filters.strong.push(strength);
        document.getElementById(skillstrong).classList.add("active");
      }
      this.filterTable();
    },
    toggleAllWeak() {
      const weaks = ["강철", "나무", "흙", "물", "물리", "바람", "불", "빛", "어둠", "얼음", "천둥"];
      const checkBox = document.getElementById("select-all-weak");
      if (checkBox.checked) {
        weaks.forEach((weak) => {
          if (!filters.weak.includes(weak)) {
            filters.weak.push(weak);
            document.getElementById(`weak_${weak}`).classList.add("active");
          }
        });
      } else {
        weaks.forEach((weak) => {
          filters.weak = filters.weak.filter((item) => item !== weak);
          document.getElementById(`weak_${weak}`).classList.remove("active");
        });
      }
      this.filterTable();
    },
    toggleSkillWeak(skillweak) {
      const weakness = skillweak.replace("weak_", "");
      const index = filters.weak.indexOf(weakness);
      if (index > -1) {
        filters.weak.splice(index, 1);
        document.getElementById(skillweak).classList.remove("active");
      } else {
        filters.weak.push(weakness);
        document.getElementById(skillweak).classList.add("active");
      }
      this.filterTable();
    },
    toggleAllField() {
      const fieldsArray = ["DA", "UK", "DR", "DS", "JT", "ME", "NSo", "NSp", "VB", "WG"];
      const allSelected = fieldsArray.every((field) => filters.field.includes(field));
      fieldsArray.forEach((field) => {
        if (allSelected) {
          filters.field = [];
          document.getElementById(field).classList.remove("active");
        } else {
          if (!filters.field.includes(field)) {
            filters.field.push(field);
            document.getElementById(field).classList.add("active");
          }
        }
      });
      this.filterTable();
    },
    toggleField(field) {
      const index = filters.field.indexOf(field);
      if (index > -1) {
        filters.field.splice(index, 1);
        document.getElementById(field).classList.remove("active");
      } else {
        filters.field.push(field);
        document.getElementById(field).classList.add("active");
      }
      this.filterTable();
    },
    filterTable() {
      const tableBody = document.getElementById("characterTable");
      const rows = tableBody.querySelectorAll("tr");
      const hasFilter = Object.values(filters).some((filter) => filter.length > 0);
      rows.forEach((row) => {
        const evolutionMatches =
          filters.evolution.length === 0 ||
          filters.evolution.includes(row.dataset.evolution);
        const typeMatches =
          filters.type.length === 0 || filters.type.includes(row.dataset.type);
        const fieldData = row.dataset.fields
          ? row.dataset.fields
              .split(";")
              .map((field) => field.trim())
              .filter(Boolean)
          : [];
        const fieldMatches =
          filters.field.length === 0 ||
          fieldData.some((field) => filters.field.includes(field));
        const strength = row.dataset.강점
          ? row.dataset.강점.trim().toLowerCase()
          : "";
        const weakness = row.dataset.약점
          ? row.dataset.약점.trim().toLowerCase()
          : "";
        const strengthsMatch =
          filters.strong.length === 0 ||
          filters.strong.some((filter) => filter.toLowerCase() === strength);
        const weaknessesMatch =
          filters.weak.length === 0 ||
          filters.weak.some((filter) => filter.toLowerCase() === weakness);
        const skill1Image = row.cells[13].querySelector("img");
        const skill1 = skill1Image ? skill1Image.alt : "";
        const skill2Image = row.cells[14].querySelector("img");
        const skill2 = skill2Image ? skill2Image.alt : "";
        const skill3Image = row.cells[15].querySelector("img");
        const skill3 = skill3Image ? skill3Image.alt : "";
        const skillsMatch =
          filters.skill.length === 0 ||
          filters.skill.includes(skill1) ||
          filters.skill.includes(skill2) ||
          filters.skill.includes(skill3);
        if (
          hasFilter &&
          evolutionMatches &&
          typeMatches &&
          skillsMatch &&
          fieldMatches &&
          strengthsMatch &&
          weaknessesMatch
        ) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    },
    resetFilters() {
      filters.evolution = [];
      filters.type = [];
      filters.skill = [];
      filters.strong = [];
      filters.weak = [];
      filters.field = [];
      const filterButtons = document.querySelectorAll(
        ".button-group button, .button-group-field button"
      );
      filterButtons.forEach((button) => {
        button.classList.remove("active");
      });
      document.getElementById("select-all-evolution").checked = false;
      document.getElementById("select-all-type").checked = false;
      document.getElementById("select-all-skill").checked = false;
      document.getElementById("select-all-strong").checked = false;
      document.getElementById("select-all-weak").checked = false;
      this.filterTable();
    }
  };

  // ====================================================
  // 5. Sorting Module (테이블 정렬 및 정렬 표시)
  // ====================================================
  function sortTable(column) {
    const table = document.getElementById("characterTable");
    const rows = Array.from(table.rows);
    const typeOrder = ["백신", "데이터", "바이러스", "프리", "언노운", "노데이터"];

    // 같은 열을 클릭한 경우 정렬 상태 변경
    if (currentSortState.column === column) {
      if (currentSortState.direction === 'none') {
        currentSortState.direction = 'asc';
      } else if (currentSortState.direction === 'asc') {
        currentSortState.direction = 'desc';
      } else {
        currentSortState.direction = 'none';
      }
    } else {
      // 다른 열을 클릭한 경우 오름차순으로 시작
      currentSortState.column = column;
      currentSortState.direction = 'asc';
    }

    // 정렬 방향에 따라 정렬
    if (currentSortState.direction !== 'none') {
      rows.sort((a, b) => {
        let cellA = a.cells[column].innerText.trim();
        let cellB = b.cells[column].innerText.trim();
        
        if (column === 0) { // 이름 열
          cellA = a.cells[column].querySelector("a")?.innerText.trim() || cellA;
          cellB = b.cells[column].querySelector("a")?.innerText.trim() || cellB;
          return currentSortState.direction === 'asc' ? 
            cellA.localeCompare(cellB) : 
            cellB.localeCompare(cellA);
        } else if (column === 3) { // 타입 열
          cellA = a.cells[column].querySelector("img").alt.trim();
          cellB = b.cells[column].querySelector("img").alt.trim();
          const indexA = typeOrder.indexOf(cellA);
          const indexB = typeOrder.indexOf(cellB);
          const orderA = indexA === -1 ? typeOrder.length : indexA;
          const orderB = indexB === -1 ? typeOrder.length : indexB;
          return currentSortState.direction === 'asc' ? 
            orderA - orderB : 
            orderB - orderA;
        } else {
          const aValue = isNaN(cellA) ? cellA : parseFloat(cellA);
          const bValue = isNaN(cellB) ? 0 : parseFloat(cellB);
          if (aValue < bValue) return currentSortState.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return currentSortState.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
      rows.forEach((row) => table.appendChild(row));
    } else {
      // 기본 정렬로 돌아갈 때는 저장된 원래 순서로 복원
      table.innerHTML = '';
      originalRows.forEach(row => table.appendChild(row));
    }

    updateSortIndicator(column);
  }

  function updateSortIndicator(column) {
    // 모든 정렬 표시 초기화
    const sortSpans = document.querySelectorAll('[id^="sort-"]');
    sortSpans.forEach(span => {
      span.className = '';
    });

    // 현재 정렬된 열에 대한 표시 업데이트
    if (currentSortState.column === column && currentSortState.direction !== 'none') {
      const sortSpan = document.getElementById(`sort-${getColumnId(column)}`);
      if (sortSpan) {
        sortSpan.className = currentSortState.direction === 'asc' ? 'ascending' : 'descending';
      }
    }
  }

  function getColumnId(column) {
    const columnIds = [
      'name', 'level', 'evolution', 'type', 'hp', 'sp', 
      'power', 'intelligence', 'defense', 'resistance', 'speed'
    ];
    return columnIds[column] || '';
  }

  function initSortableColumns() {
    // 스타일은 digimon.css로 이동됨
  }

  // ====================================================
  // 6. Search Module (검색 입력 이벤트)
  // ====================================================
  function initSearchListener() {
    const searchInput = document.getElementById("search");
    searchInput.addEventListener("input", function () {
      const searchInputArray = this.value
        .toLowerCase()
        .split(",")
        .map((term) => term.trim());
      const rows = document.querySelectorAll("#characterTable tr");
      rows.forEach((row) => {
        const name = row.dataset.name ? row.dataset.name.toLowerCase() : "";
        const hasFilter = Object.values(filters).some(
          (filter) => filter.length > 0
        );
        if (!hasFilter && searchInputArray.length === 1 && searchInputArray[0] === "") {
          row.style.display = "none";
        } else if (searchInputArray.length === 1 && searchInputArray[0] === "") {
          FilterModule.filterTable();
        } else {
          const nameMatches = searchInputArray.some((term) => name.includes(term));
          row.style.display = nameMatches ? "" : "none";
        }
      });
    });
  }

  // ====================================================
  // 7. Tooltip Module (툴팁 열기/닫기)
  // ====================================================
  let openTooltip = null;
  function showTooltip(tooltipId) {
    const tooltip = document.getElementById(tooltipId);
    if (openTooltip && openTooltip !== tooltip) {
      openTooltip.classList.remove("show");
    }
    tooltip.classList.add("show");
    openTooltip = tooltip;
  }

  function hideTooltip(tooltipId) {
    const tooltip = document.getElementById(tooltipId);
    if (tooltip) {
      tooltip.classList.remove("show");
    }
  }

  // close 버튼 이벤트 (툴팁 닫기)
  function initTooltipCloseBtns() {
    const closeBtns = document.querySelectorAll(".close-btn");
    closeBtns.forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        const tooltip = btn.closest(".tooltip-skill, .tooltip-field");
        if (tooltip) {
          hideTooltip(tooltip.id);
        }
      });
    });
    document.querySelectorAll(".tooltip-skill, .tooltip-field").forEach((tooltip) => {
      tooltip.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    });
  }

  // ====================================================
  // 8. 초기화 및 전역 함수 노출
  // ====================================================
  window.onload = () => {
    TableDataManager.fetchCSV();
    FilterModule.filterTable();
    initSearchListener();
    initTooltipCloseBtns();
  };

  // 전역 인라인 이벤트에서 사용할 함수들
  window.resetFilters = FilterModule.resetFilters.bind(FilterModule);
  window.toggleAllEvolution = FilterModule.toggleAllEvolution.bind(FilterModule);
  window.toggleEvolution = FilterModule.toggleEvolution.bind(FilterModule);
  window.toggleAllType = FilterModule.toggleAllType.bind(FilterModule);
  window.toggleType = FilterModule.toggleType.bind(FilterModule);
  window.toggleAllSkill = FilterModule.toggleAllSkill.bind(FilterModule);
  window.toggleSkill = FilterModule.toggleSkill.bind(FilterModule);
  window.toggleAllStrong = FilterModule.toggleAllStrong.bind(FilterModule);
  window.toggleSkillStrong = FilterModule.toggleSkillStrong.bind(FilterModule);
  window.toggleAllWeak = FilterModule.toggleAllWeak.bind(FilterModule);
  window.toggleSkillWeak = FilterModule.toggleSkillWeak.bind(FilterModule);
  window.toggleAllField = FilterModule.toggleAllField.bind(FilterModule);
  window.toggleField = FilterModule.toggleField.bind(FilterModule);
  window.sortTable = sortTable;
  window.showTooltip = showTooltip;
  window.hideTooltip = hideTooltip;
  window.showCustomTooltip = showCustomTooltip;
  window.hideCustomTooltip = hideCustomTooltip;
})();