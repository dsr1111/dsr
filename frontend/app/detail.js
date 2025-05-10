function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener("DOMContentLoaded", () => {
  const characterName = decodeURIComponent(getQueryParam("name"));
  if (!characterName) {
    document.getElementById("character-name").textContent = "캐릭터 정보를 찾을 수 없습니다.";
    return;
  }

  // 툴팁 기능 추가
  function createTooltip(text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = text;
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '4px 8px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '9999';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function showTooltip(element, text) {
    const tooltip = createTooltip(text);
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) + 'px';
    tooltip.style.top = rect.bottom + 5 + 'px';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.display = 'block';
    return tooltip;
  }

  function addTooltipToElement(element, text) {
    let tooltip = null;
    element.addEventListener('mouseenter', () => {
      tooltip = showTooltip(element, text);
    });
    element.addEventListener('mouseleave', () => {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    });
  }

  document.getElementById("character-name").textContent = characterName;
  document.title = `${characterName} | DSRWIKI`;
  const sanitizedCharacterName = characterName.replace(/:/g, "_");

  fetch("../data/csv/characters.csv")
    .then((response) => response.text())
    .then((data) => {
      const rows = data.split("\n").slice(1);
      const character = rows.find((row) => row.includes(characterName));

      if (character) {
        const columns = character.split(",");
        const characterImgPath = `../image/digimon/${sanitizedCharacterName}/${sanitizedCharacterName}.webp`;
        const evolutionStage = columns[1];
        const type = columns[2];
        const fields = columns[15]
          ? columns[15].split(";").map((field) => field.trim())
          : [];

        // 필드 이미지 설정
        for (let i = 1; i <= 3; i++) {
          const fieldImgElement = document.getElementById(`field-img${i}`);
          if (fields[i - 1]) {
            fieldImgElement.src = `../image/field/${fields[i - 1]}.webp`;
            fieldImgElement.alt = `${fields[i - 1]} 이미지`;
            addTooltipToElement(fieldImgElement, fields[i - 1]);
            fieldImgElement.style.display = "inline";
          } else {
            fieldImgElement.style.display = "none";
          }
        }

        // 기본 정보 설정
        const characterImg = document.getElementById("character-img");
        characterImg.src = characterImgPath;
        addTooltipToElement(characterImg, characterName);
        
        const evolutionImg = document.getElementById("evolution-img");
        evolutionImg.src = `../image/${evolutionStage}.webp`;
        addTooltipToElement(evolutionImg, evolutionStage);
        
        const typeImg = document.getElementById("type-img");
        typeImg.src = `../image/${type}.webp`;
        addTooltipToElement(typeImg, type);
        
        // 스탯 설정
        document.getElementById("stat-level").textContent = columns[3];
        document.getElementById("stat-hp").textContent = columns[4];
        document.getElementById("stat-sp").textContent = columns[5];
        document.getElementById("stat-power").textContent = columns[6];
        document.getElementById("stat-intelligence").textContent = columns[7];
        document.getElementById("stat-defense").textContent = columns[8];
        document.getElementById("stat-resistance").textContent = columns[9];
        document.getElementById("stat-speed").textContent = columns[10];

        // 강점과 약점 정보 추출
        const strengths = columns[11]
          ? columns[11].split(";").map((str) => str.trim())
          : [];
        const strengthsDesc = columns[12]
          ? columns[12].split(";").map((desc) => desc.trim())
          : [];
        const weaknesses = columns[13]
          ? columns[13].split(";").map((weak) => weak.trim())
          : [];
        const weaknessesDesc = columns[14]
          ? columns[14].split(";").map((desc) => desc.trim())
          : [];

                  // 강약점 테이블 생성
        const swTableBody = document.getElementById("sw").querySelector("tbody");
        
        // 강점 행 생성
        let strengthsHTML = '';
        strengths.forEach((str, index) => {
          const descText = strengthsDesc[index] || "";
          let additionalText = "";
          
          if (descText === "반사") {
            additionalText = '해당 속성의 공격을 받으면 <span class="highlight">피해량의 25%</span>를 되돌려 줍니다.';
          } else if (descText === "회피") {
            additionalText = '해당 속성 공격에 대해 <span class="highlight">회피율이 2배</span>로 적용됩니다.';
          } else if (descText === "내성") {
            additionalText = '해당 속성의 공격으로 받는 데미지는 <span class="highlight">25% 감소</span>합니다.';
          }
          
          strengthsHTML += `
            <tr>
              <td class=\"sw-icon\">
                <div class=\"sw-icon-container\" style=\"background-image: url('../image/strongbackground.webp');\">
                  <img src=\"../image/${str}.webp\" alt=\"${str} 이미지\" title=\"${str}\">
                </div>
              </td>
              <td class=\"sw-description\">${descText}</td>
              <td class=\"sw-description-detail\">${additionalText ? additionalText : ''}</td>
            </tr>
          `;
        });
        
        // 약점 행 생성
        let weaknessesHTML = '';
        weaknesses.forEach((weak, index) => {
          const descText = weaknessesDesc[index] || "";
          let additionalText = "";
          
          if (descText === "약점") {
            additionalText = '해당 속성의 공격으로 <span class="highlight">25% 증가된 데미지</span>를 입습니다.';
          } else if (descText === "회피불가") {
            additionalText = '해당 속성의 공격은 <span class="highlight">회피가 불가</span>합니다.';
          } else if (descText === "효과확률") {
            additionalText = '해당 속성의 공격에 효과가 있을 경우, <span class="highlight">효과에 걸릴 확률</span>이 증가합니다.';
          }
          
          weaknessesHTML += `
            <tr>
              <td class=\"sw-icon\">
                <div class=\"sw-icon-container\" style=\"background-image: url('../image/weakbackground.webp');\">
                  <img src=\"../image/${weak}.webp\" alt=\"${weak} 이미지\" title=\"${weak}\">
                </div>
              </td>
              <td class=\"sw-description\">${descText}</td>
              <td class=\"sw-description-detail\">${additionalText ? additionalText : ''}</td>
            </tr>
          `;
        });
        
        // 테이블에 HTML 추가
        swTableBody.innerHTML = strengthsHTML + weaknessesHTML;

        // 스킬 정보 가져오기
        Promise.all([
          fetch("../data/csv/skill1.csv").then((res) => res.text()),
          fetch("../data/csv/skill2.csv").then((res) => res.text()),
          fetch("../data/csv/skill3.csv").then((res) => res.text()),
        ]).then(([skill1Data, skill2Data, skill3Data]) => {
          const skills = [skill1Data, skill2Data, skill3Data];
          const skillDetailsTable = document.getElementById("skill-details");
          skillDetailsTable.innerHTML = "";

          let isAdultStage = false;

          skills.forEach((skillData, index) => {
            const skillRows = skillData.split("\n").slice(1);
            const skill = skillRows.find((row) => {
              const columns = row.split(",");
              return columns[10].trim() === characterName;
            });

            if (skill) {
              const skillColumns = skill.split(",");
              if (skillColumns[11] === "성장기") {
                isAdultStage = true;
              }
              if (index === 2 && isAdultStage) {
                return;
              }

              const skillImgPath = `../image/digimon/${sanitizedCharacterName}/skill${index + 1}.webp`;
              const skill1ImgPath = `../image/${skillColumns[15]}.webp`;

              const hitCount = isNaN(parseFloat(skillColumns[13]))
                ? 1
                : parseFloat(skillColumns[13]);

              const levelData = skillColumns.slice(0, 10).map((value) => {
                let percentage = isNaN(parseFloat(value))
                  ? 0
                  : parseFloat(value) * 100;
                const totalDamage = percentage * hitCount;
                return `${parseFloat(totalDamage.toFixed(2))}%`;
              });

              // 각 스킬 행 생성
              const skillRow = document.createElement('tr');
              
              // 스킬 정보 셀 생성
              const skillCell = document.createElement('td');
              skillCell.innerHTML = `
                <div class="skill-row">
                  <table class="skill-header-table">
                    <tr>
                      <td rowspan="2" class="skill-icon-cell">
                        <img src="${skillImgPath}" alt="스킬 아이콘" class="skill-icon">
                      </td>
                      <td class="skill-name-cell">
                        <div class="skill-name-container">
                          <span class="skill-name">${skillColumns[12]}</span>
                          <img src="${skill1ImgPath}" alt="속성" class="skill-attribute">
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td class="skill-tags-cell">
                        <div class="skill-tags">
                          <span class="skill-tag tag-range ${skillColumns[14] === '원거리' ? 'long-range' : ''}">${skillColumns[14]}</span>
                          <span class="skill-tag tag-target">${skillColumns[16]} ${skillColumns[17]}</span>
                          <span class="skill-tag tag-hit">${isNaN(skillColumns[13]) ? skillColumns[13] : `${skillColumns[13]}타`}</span>
                          ${skillColumns[18] ? `<span class="skill-tag tag-effect">${skillColumns[18]}</span>` : ''}
                          ${skillColumns[19] ? `<span class="skill-tag tag-cast">추가 시전 턴 : ${skillColumns[19]}턴</span>` : ''}
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <div class="level-table-container">
                    <table class="level-table">
                      <tr>
                        <th>1레벨</th>
                        <th>2레벨</th>
                        <th>3레벨</th>
                        <th>4레벨</th>
                        <th>5레벨</th>
                        <th>6레벨</th>
                        <th>7레벨</th>
                        <th>8레벨</th>
                        <th>9레벨</th>
                        <th>10레벨</th>
                      </tr>
                      <tr>
                        ${levelData.map(level => `<td title="${level}">${level}</td>`).join('')}
                      </tr>
                    </table>
                  </div>
                </div>
              `;
              
              skillRow.appendChild(skillCell);
              skillDetailsTable.appendChild(skillRow);
            }
          });
        });
      } else {
        document.getElementById("character-name").textContent = "캐릭터 정보를 찾을 수 없습니다.";
      }
    })
    .catch(error => {
      console.error("데이터를 불러오는 중 오류가 발생했습니다:", error);
      document.getElementById("character-name").textContent = "데이터를 불러오는 중 오류가 발생했습니다.";
    });

  // 덱 정보 가져오기
  fetch("../data/csv/deck.json")
    .then(response => response.json())
    .then(deckData => {
      const deckContainer = document.getElementById("deck-container");
      deckContainer.innerHTML = "";

      // 해당 디지몬이 포함된 덱 찾기
      const matchingDecks = Object.entries(deckData).filter(([_, deck]) => 
        deck.digimon.some(d => d.name === characterName)
      );

      if (matchingDecks.length > 0) {
        matchingDecks.forEach(([deckName, deck]) => {
          const deckCard = document.createElement("div");
          deckCard.className = "deck-card";
          
          // 덱 카드 HTML 생성
          deckCard.innerHTML = `
            <div class="deck-header">
              <h3 class="deck-title">${deckName}</h3>
              <p class="deck-description">${deck.description}</p>
            </div>
            <div class="deck-content">
              <div class="digimon-container">
                ${deck.digimon.map(d => `
                  <div class="digimon-avatar ${d.name === characterName ? 'highlight' : ''}">
                    <img src="../image/digimon/${d.name.replace(/:/g, '_')}/${d.name.replace(/:/g, '_')}.webp" 
                         alt="${d.name}" 
                         onerror="this.src='../image/digimon/default.webp'">
                    <div class="digimon-tooltip">Lv.${d.level} ${d.name}</div>
                  </div>
                `).join('')}
              </div>
              <div class="effects-container">
                ${deck.effects.map(effect => {
                  // 숫자 강조
                  const html = effect.replace(/(\+\s*[\d\.]+%?)/g, '<span class="effect-value">$1</span>');
                  return html;
                }).join(' / ')}
              </div>
            </div>
          `;
          
          deckContainer.appendChild(deckCard);

          // 툴팁 기능 추가
          deckCard.querySelectorAll('.digimon-avatar').forEach(avatar => {
            const tooltip = avatar.querySelector('.digimon-tooltip');
            
            avatar.addEventListener('mouseover', () => {
              document.querySelectorAll('.digimon-tooltip').forEach(t => t.remove());
              const tt = document.createElement('div');
              tt.className = 'digimon-tooltip';
              tt.textContent = tooltip.textContent;
              document.body.appendChild(tt);
              const r = avatar.getBoundingClientRect();
              tt.style.left = r.left + r.width/2 + 'px';
              tt.style.top = r.bottom + 10 + 'px';
              tt.style.transform = 'translateX(-50%)';
              tt.style.opacity = '1';
            });

            avatar.addEventListener('mouseout', () => {
              document.querySelectorAll('.digimon-tooltip').forEach(t => t.remove());
            });
          });
        });
      } else {
        deckContainer.innerHTML = '<p class="no-deck-message">이 디지몬이 포함된 덱이 없습니다.</p>';
      }
    })
    .catch(error => {
      console.error("덱 데이터를 불러오는 중 오류가 발생했습니다:", error);
      document.getElementById("deck-container").innerHTML = 
        '<p class="error-message">덱 정보를 불러오는 중 오류가 발생했습니다.</p>';
    });
});