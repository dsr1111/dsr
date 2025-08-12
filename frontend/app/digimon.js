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
    
    const rect = e.target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${rect.bottom + 5}px`;
    
    if (left + tooltipRect.width > window.innerWidth) {
      tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
    }
    
    if (left < 0) {
      tooltip.style.left = '10px';
    }
  }

  function hideCustomTooltip() {
    const tooltip = document.getElementById('custom-tooltip');
    tooltip.style.display = 'none';
  }

  // ====================================================
  // 2. JSON Loader Module
  // ====================================================
  const JSONLoader = {
    async loadJSON(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error loading JSON:', error);
        return null;
      }
    }
  };

  // ====================================================
  // 3. TableDataManager Module
  // ====================================================
  const TableDataManager = {
    async fetchData() {
      try {
        const digimonData = await JSONLoader.loadJSON("/data/csv/digimon.json");
        if (!digimonData) return;

        const tableBody = document.getElementById("characterTable");
        tableBody.innerHTML = "";

        Object.entries(digimonData).forEach(([name, digimon]) => {
          try {
            const evolution = digimon.evolution_stage;
            const type = digimon.type;
            const stats = digimon.stats;
            const strengths = digimon.strengths;
            const weaknesses = digimon.weaknesses;
            const fields = digimon.fields.join(";");

            const typeImagePath = `https://media.dsrwiki.com/dsrwiki/image/${type}.webp`;
            const typeImgHtml = `<img src="${typeImagePath}" alt="${type}" 
              style="width:23px;height:23px;display:block;margin:0 auto;cursor:pointer;"
              onmouseenter="showCustomTooltip(event, '${type}')"
              onmousemove="showCustomTooltip(event, '${type}')"
              onmouseleave="hideCustomTooltip()"
            >`;

            const strongHtml = strengths.attribute
              ? `<img src="https://media.dsrwiki.com/dsrwiki/image/${strengths.attribute}.webp" alt="${strengths.attribute}" 
                  style="width:25px;height:25px;vertical-align:middle;background-image:url('https://media.dsrwiki.com/dsrwiki/image/strongbackground.webp');background-size:120%;background-position:center;cursor:pointer;"
                  onmouseenter="showCustomTooltip(event, '${strengths.attribute}')"
                  onmousemove="showCustomTooltip(event, '${strengths.attribute}')"
                  onmouseleave="hideCustomTooltip()"
                > <span>${strengths.effect || ""}</span>`
              : "";

            const weakHtml = weaknesses.attribute
              ? `<img src="https://media.dsrwiki.com/dsrwiki/image/${weaknesses.attribute}.webp" alt="${weaknesses.attribute}" 
                  style="width:25px;height:25px;vertical-align:middle;background-image:url('https://media.dsrwiki.com/dsrwiki/image/weakbackground.webp');background-size:120%;background-position:center;cursor:pointer;"
                  onmouseenter="showCustomTooltip(event, '${weaknesses.attribute}')"
                  onmousemove="showCustomTooltip(event, '${weaknesses.attribute}')"
                  onmouseleave="hideCustomTooltip()"
                > <span>${weaknesses.effect || ""}</span>`
              : "";

            const fieldsHtml = fields
              ? fields
                  .split(";")
                  .map(field => field.trim())
                  .filter(field => field !== "")
                  .map(
                    (field) =>
                      `<img src="https://media.dsrwiki.com/dsrwiki/image/field/${field}.webp" alt="${field}" 
                        style="width:25px;height:25px;cursor:pointer;"
                        onmouseenter="showCustomTooltip(event, '${field}')"
                        onmousemove="showCustomTooltip(event, '${field}')"
                        onmouseleave="hideCustomTooltip()"
                      >`
                  )
                  .join("")
              : "";

            const createSkillHtml = (skill, skillNumber, digimonName) => {
              if (!skill) return "<td></td>";
              let backgroundColor = "";
              if (skill.additionalTurn) {
                backgroundColor = "background-color: rgb(255,234,234);";
              }
              if (skill.target_count === "전체") {
                backgroundColor = "background-color: rgb(220,248,248);";
              }

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

              const normalizedEffect = (skill.effect || '').trim().toLowerCase();
              const effectDescriptionsLower = Object.keys(effectDescriptions).reduce(
                (acc, key) => {
                  acc[key.toLowerCase()] = effectDescriptions[key];
                  return acc;
                },
                {}
              );
              const effectDescription = effectDescriptionsLower[normalizedEffect] || "효과 설명을 찾을 수 없습니다.";
              let effectImagePath = skill.effect ? `https://media.dsrwiki.com/dsrwiki/image/debuff/${skill.effect}.webp` : "";
              if (normalizedEffect === "회복") {
                effectImagePath = `https://media.dsrwiki.com/dsrwiki/image/digimon/${digimonName}/skill${skillNumber}.webp`;
              }
              const effectTooltipHtml = skill.effect && effectDescription
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
                  <img src="https://media.dsrwiki.com/dsrwiki/image/${skill.attribute}.webp" alt="${skill.attribute}" 
                    style="width:25px;height:25px;vertical-align:middle;background-image:url('https://media.dsrwiki.com/dsrwiki/image/background.webp');background-size:120%;background-position:center;cursor:pointer;"
                    onmouseenter="showCustomTooltip(event, '${skill.attribute}')"
                    onmousemove="showCustomTooltip(event, '${skill.attribute}')"
                    onmouseleave="hideCustomTooltip()"
                  >
                  ${effectTooltipHtml}
                  <span>${`${skill.hits}타`} / ${skill.range}</span>
                </td>
              `;
            };

            const sanitizedName = name.replace(/[:]/g, "_");
            const characterImagePath = `https://media.dsrwiki.com/dsrwiki/image/digimon/${sanitizedName}/${sanitizedName}.webp`;

            const newRow = document.createElement("tr");
            newRow.dataset.name = name;
            newRow.dataset.evolution = evolution;
            newRow.dataset.type = type;
            newRow.dataset.level = stats.level;
            newRow.dataset.hp = stats.hp;
            newRow.dataset.sp = stats.sp;
            newRow.dataset.힘 = stats.STR;
            newRow.dataset.지능 = stats.INT;
            newRow.dataset.수비 = stats.DEF;
            newRow.dataset.저항 = stats.RES;
            newRow.dataset.속도 = stats.SPD;
            newRow.dataset.강점 = strengths.attribute;
            newRow.dataset.강점효과 = strengths.effect;
            newRow.dataset.약점 = weaknesses.attribute;
            newRow.dataset.약점효과 = weaknesses.effect;
            newRow.dataset.fields = fields;

            newRow.innerHTML = `
              <td>
                <div style="width:25px;height:25px;background-color:black;display:inline-block;vertical-align:middle;">
                  <img src="${characterImagePath}" alt="${name}" style="width:100%;height:100%;" onerror="this.src='https://media.dsrwiki.com/dsrwiki/image/digimon/default.webp';">
                </div>
                <a href="detail.html?name=${encodeURIComponent(name)}" style="text-decoration:none;color:black;">${name}</a>
              </td>
              <td style="text-align:center;vertical-align:middle;">${stats.level}</td>
              <td style="text-align:center;vertical-align:middle;">${evolution}</td>
              <td style="text-align:center;vertical-align:middle;">
                ${typeImgHtml}
              </td>
              <td style="text-align:center;vertical-align:middle;border-left:2px solid darkgrey;">${stats.hp}</td>
              <td style="text-align:center;vertical-align:middle;">${stats.sp}</td>
              <td style="text-align:center;vertical-align:middle;">${stats.STR}</td>
              <td style="text-align:center;vertical-align:middle;">${stats.INT}</td>
              <td style="text-align:center;vertical-align:middle;">${stats.DEF}</td>
              <td style="text-align:center;vertical-align:middle;">${stats.RES}</td>
              <td style="text-align:center;vertical-align:middle;">${stats.SPD}</td>
              <td style="border-left:2px solid darkgrey;">${strongHtml}</td>
              <td style="border-right:2px solid darkgrey;">${weakHtml}</td>
              ${createSkillHtml(digimon.skills[0], 1, name)}
              ${createSkillHtml(digimon.skills[1], 2, name)}
              ${createSkillHtml(digimon.skills[2], 3, name)}
              <td style="border-left:2px solid darkgrey;">${fieldsHtml}</td>
            `;
            newRow.style.display = "none";
            tableBody.appendChild(newRow);
          } catch (error) {
            console.error('Error processing digimon:', error, name, digimon);
          }
        });

        originalRows = Array.from(tableBody.rows);
      } catch (error) {
        console.error('Error in fetchData:', error);
      }
    }
  };

  // ... (The rest of the code remains the same) ...

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
        filters.evolution = [];
        evolutions.forEach((evo) => {
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
      
      if (!hasFilter) {
        rows.forEach(row => {
          row.style.display = "none";
        });
        return;
      }

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
        const strength = row.dataset.강점 ? row.dataset.강점.trim() : "";
        const weakness = row.dataset.약점 ? row.dataset.약점.trim() : "";
        const strengthsMatch =
          filters.strong.length === 0 ||
          filters.strong.some((filter) => filter === strength);
        const weaknessesMatch =
          filters.weak.length === 0 ||
          filters.weak.some((filter) => filter === weakness);
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
      
      const tableBody = document.getElementById("characterTable");
      const rows = tableBody.querySelectorAll("tr");
      rows.forEach(row => {
        row.style.display = "";
      });
      
      console.log('Filters reset, showing all rows:', rows.length);
    }
  };

  // ====================================================
  // 5. Sorting Module
  // ====================================================
  function sortTable(column) {
    const table = document.getElementById("characterTable");
    const rows = Array.from(table.rows);
    const typeOrder = ["백신", "데이터", "바이러스", "프리", "언노운", "노데이터"];

    if (currentSortState.column === column) {
      if (currentSortState.direction === 'none') {
        currentSortState.direction = 'asc';
      } else if (currentSortState.direction === 'asc') {
        currentSortState.direction = 'desc';
      } else {
        currentSortState.direction = 'none';
      }
    } else {
      currentSortState.column = column;
      currentSortState.direction = 'asc';
    }

    if (currentSortState.direction !== 'none') {
      rows.sort((a, b) => {
        let cellA = a.cells[column].innerText.trim();
        let cellB = b.cells[column].innerText.trim();
        
        if (column === 0) {
          cellA = a.cells[column].querySelector("a")?.innerText.trim() || cellA;
          cellB = b.cells[column].querySelector("a")?.innerText.trim() || cellB;
          return currentSortState.direction === 'asc' ? 
            cellA.localeCompare(cellB) : 
            cellB.localeCompare(cellA);
        } else if (column === 3) {
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
          const aValue = isNaN(parseFloat(cellA)) ? cellA : parseFloat(cellA);
          const bValue = isNaN(parseFloat(cellB)) ? 0 : parseFloat(cellB);
          if (aValue < bValue) return currentSortState.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return currentSortState.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
      rows.forEach((row) => table.appendChild(row));
    } else {
      table.innerHTML = '';
      originalRows.forEach(row => table.appendChild(row));
    }

    updateSortIndicator(column);
  }

  function updateSortIndicator(column) {
    const sortSpans = document.querySelectorAll('[id^="sort-"]');
    sortSpans.forEach(span => {
      span.className = '';
    });

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
      'STR', 'INT', 'DEF', 'RES', 'SPD'
    ];
    return columnIds[column] || '';
  }

  // ====================================================
  // 6. Search Module
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
  // 7. Tooltip Module
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
    TableDataManager.fetchData();
    initSearchListener();
    initTooltipCloseBtns();
  };

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