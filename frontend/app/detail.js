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
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    tooltip.style.left = (rect.left + scrollLeft + (rect.width / 2)) + 'px';
    tooltip.style.top = (rect.bottom + scrollTop + 5) + 'px';
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

  // 디지몬 데이터 가져오기
  fetch("/data/csv/digimon.json")
    .then((response) => response.json())
    .then((data) => {
      const character = data.find((digimon) => digimon.name[0] === characterName);

      if (character) {
        const characterImgPath = `/image/digimon/${sanitizedCharacterName}/${sanitizedCharacterName}.webp`;
        const evolutionStage = character.evolution_stage[0];
        const type = character.type[0];
        const fields = character.필드 || [];

        // 필드 이미지 설정
        for (let i = 1; i <= 3; i++) {
          const fieldImgElement = document.getElementById(`field-img${i}`);
          if (fields[i - 1]) {
            fieldImgElement.src = `/image/field/${fields[i - 1]}.webp`;
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
        evolutionImg.src = `/image/${evolutionStage}.webp`;
        addTooltipToElement(evolutionImg, evolutionStage);
        
        const typeImg = document.getElementById("type-img");
        typeImg.src = `/image/${type}.webp`;
        addTooltipToElement(typeImg, type);

        // 디지코어화 정보 가져오기
        fetch("/data/csv/digicore.json")
          .then(response => response.json())
          .then(digicoreData => {
            const digicoreContainer = document.getElementById("digicore-container");
            const characterDigicore = digicoreData.digicore[characterName];

            // 진화 단계에 따른 기본 디지코어 꾸러미 추가
            let defaultDigicore = null;

            switch(evolutionStage) {
              case "성장기":
                defaultDigicore = [
                  {
                    name: "성장기 디지코어 꾸러미",
                    probability: "확정",
                    tradeable: true,
                    count: 1
                  },
                  {
                    name: "유년기1 디지타마",
                    probability: "확률",
                    tradeable: true,
                    count: 1
                  },
                  {
                    name: "포텐셜 조각",
                    probability: "확률",
                    tradeable: true,
                    count: 1
                  }
                ];
                break;
              case "성숙기":
                defaultDigicore = [
                  {
                    name: "성숙기 디지코어 꾸러미",
                    probability: "확정",
                    tradeable: true,
                    count: 1
                  },
                  {
                    name: "유년기1 디지타마",
                    probability: "확률",
                    tradeable: true,
                    count: 1
                  },
                  {
                    name: "포텐셜 조각",
                    probability: "확률",
                    tradeable: true,
                    count: 1
                  },
                  {
                    name: "돌연변이 치료제",
                    probability: "확률",
                    tradeable: true,
                    count: 1
                  }
                ];
                break;
              case "완전체":
                defaultDigicore = [
                  {
                    name: "완전체 디지코어 꾸러미",
                    probability: "확정",
                    tradeable: true,
                    count: 1
                  },
                  {
                    name: "유년기1 디지타마",
                    probability: "확률",
                    tradeable: true,
                    count: 1
                  },
                  {
                    name: "포텐셜 조각",
                    probability: "확률",
                    tradeable: true,
                    count: 1
                  },
                  {
                    name: "돌연변이 치료제",
                    probability: "확률",
                    tradeable: true,
                    count: 1
                  }
                ];
                break;
              case "궁극체":
                defaultDigicore = [
                  {
                    name: "궁극체 디지코어 꾸러미",
                    probability: "확정",
                    tradeable: true,
                    count: 1
                  },
                  {
                    name: "유년기1 디지타마",
                    probability: "확률",
                    tradeable: true,
                    count: 1
                  },
                  {
                    name: "포텐셜 조각",
                    probability: "확률",
                    tradeable: true,
                    count: 1
                  },
                  {
                    name: "돌연변이 치료제",
                    probability: "확률",
                    tradeable: true,
                    count: 1
                  }
                ];
                break;
            }

            // 기본 디지코어 꾸러미와 특별 아이템 합치기
            const allItems = defaultDigicore ? 
              (Array.isArray(defaultDigicore) ? [...defaultDigicore, ...(characterDigicore?.items || [])] : [defaultDigicore, ...(characterDigicore?.items || [])]) : 
              (characterDigicore?.items || []);

            if (allItems.length > 0) {
              const itemsHTML = `
                <div class="digicore-items">
                  ${allItems.map(item => `
                    <div class="digicore-item">
                      <div class="digicore-item-main">
                        <div class="digicore-item-image">
                          <img src="/image/item/${item.name}.webp" alt="${item.name}" title="${item.name}">
                        </div>
                        <div class="digicore-item-info">
                          <div class="digicore-item-name">${item.name}${item.count ? ` <span class=\"item-count\">x${item.count}</span>` : ''}</div>
                          <div class="digicore-item-badges">
                            <div class="digicore-item-probability ${item.probability === '확정' ? 'guaranteed' : 'probability'}">${item.probability}</div>
                            ${item.tradeable !== undefined ? `
                              <div class="digicore-item-tradeable ${item.tradeable ? 'tradeable' : 'untradeable'}">${item.tradeable ? '거래가능' : '거래불가'}</div>
                            ` : ''}
                          </div>
                        </div>
                      </div>
                      ${item.possible_items ? `
                        <div class="digicore-item-expanded">
                          <div class="digicore-item-description">${item.description}</div>
                          <div class="possible-items-title">획득 가능한 아이템</div>
                          <div class="possible-items-list">
                            ${item.possible_items.map(possibleItem => `
                              <div class="possible-item">
                                <div class="possible-item-row">
                                  <div class="possible-item-image">
                                    <img src="/image/item/${possibleItem.name}.webp" alt="${possibleItem.name}" title="${possibleItem.name}">
                                  </div>
                                  <div class="possible-item-info">
                                    <div class="possible-item-name">${possibleItem.name}${possibleItem.count ? ` <span class=\"item-count\">x${possibleItem.count}</span>` : ''}</div>
                                    <div class="digicore-item-badges">
                                      <div class="possible-item-probability ${possibleItem.probability === '확정' ? 'guaranteed' : 'probability'}">${possibleItem.probability}</div>
                                      ${possibleItem.tradeable !== undefined ? `
                                        <div class="digicore-item-tradeable ${possibleItem.tradeable ? 'tradeable' : 'untradeable'}">${possibleItem.tradeable ? '거래가능' : '거래불가'}</div>
                                      ` : ''}
                                    </div>
                                  </div>
                                </div>
                                ${possibleItem.possible_items ? `
                                  <div class="digicore-item-expanded">
                                    <div class="digicore-item-description">${possibleItem.description}</div>
                                    <div class="possible-items-title">획득 가능한 아이템</div>
                                    <div class="possible-items-list">
                                      ${possibleItem.possible_items.map(subItem => `
                                        <div class="possible-item">
                                          <div class="possible-item-row">
                                            <div class="possible-item-image">
                                              <img src="/image/item/${subItem.name}.webp" alt="${subItem.name}" title="${subItem.name}">
                                            </div>
                                            <div class="possible-item-info">
                                              <div class="possible-item-name">${subItem.name}${subItem.count ? ` <span class=\"item-count\">x${subItem.count}</span>` : ''}</div>
                                              <div class="digicore-item-badges">
                                                <div class="possible-item-probability ${subItem.probability === '확정' ? 'guaranteed' : 'probability'}">${subItem.probability}</div>
                                                ${subItem.tradeable !== undefined ? `
                                                  <div class="digicore-item-tradeable ${subItem.tradeable ? 'tradeable' : 'untradeable'}">${subItem.tradeable ? '거래가능' : '거래불가'}</div>
                                                ` : ''}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      `).join('')}
                                    </div>
                                  </div>
                                ` : ''}
                              </div>
                            `).join('')}
                          </div>
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              `;
              digicoreContainer.innerHTML = itemsHTML;
            } else {
              digicoreContainer.innerHTML = '<p class="no-digicore-message">이 디지몬의 디지코어화 정보가 없습니다.</p>';
            }
          })
          .catch(error => {
            console.error("디지코어화 데이터를 불러오는 중 오류가 발생했습니다:", error);
            document.getElementById("digicore-container").innerHTML = 
              '<p class="error-message">디지코어화 정보를 불러오는 중 오류가 발생했습니다.</p>';
          });

        // 스탯 설정
        document.getElementById("stat-level").textContent = character.레벨;
        document.getElementById("stat-hp").textContent = character.HP;
        document.getElementById("stat-sp").textContent = character.SP;
        document.getElementById("stat-power").textContent = character.힘;
        document.getElementById("stat-intelligence").textContent = character.지능;
        document.getElementById("stat-defense").textContent = character.수비;
        document.getElementById("stat-resistance").textContent = character.저항;
        document.getElementById("stat-speed").textContent = character.속도;

        // 강점과 약점 정보
        const strengths = character.강점 || [];
        const strengthsDesc = character.강점효과 || [];
        const weaknesses = character.약점 || [];
        const weaknessesDesc = character.약점효과 || [];

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
                <div class=\"sw-icon-container\" style=\"background-image: url('/image/strongbackground.webp');\">
                  <img src=\"/image/${str}.webp\" alt=\"${str} 이미지\" title=\"${str}\">
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
                <div class=\"sw-icon-container\" style=\"background-image: url('/image/weakbackground.webp');\">
                  <img src=\"/image/${weak}.webp\" alt=\"${weak} 이미지\" title=\"${weak}\">
                </div>
              </td>
              <td class=\"sw-description\">${descText}</td>
              <td class=\"sw-description-detail\">${additionalText ? additionalText : ''}</td>
            </tr>
          `;
        });
        
        // 테이블에 HTML 추가
        swTableBody.innerHTML = strengthsHTML + weaknessesHTML;

        // 스킬 정보 표시
        const skillDetailsTable = document.getElementById("skill-details");
        skillDetailsTable.innerHTML = "";

        let isAdultStage = false;
        const skills = character.skills;

        Object.entries(skills).forEach(([skillKey, skillData], index) => {
          if (skillData.evolution_stage[0] === "성장기") {
            isAdultStage = true;
          }
          if (index === 2 && isAdultStage) {
            return;
          }

          const skillImgPath = `/image/digimon/${sanitizedCharacterName}/skill${index + 1}.webp`;
          const skill1ImgPath = `/image/${skillData.속성[0]}.webp`;

          const levelData = Object.entries(skillData)
            .filter(([key]) => !isNaN(key))
            .map(([_, value]) => {
              let percentage = isNaN(parseFloat(value)) ? 0 : parseFloat(value) * 100;
              return `${parseFloat(percentage.toFixed(2))}%`;
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
                      <span class="skill-name">${skillData.skillName[0]}</span>
                      <img src="${skill1ImgPath}" alt="속성" class="skill-attribute">
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="skill-tags-cell">
                    <div class="skill-tags">
                      <span class="skill-tag tag-range ${skillData.범위[0] === '원거리' ? 'long-range' : ''}">${skillData.범위[0]}</span>
                      <span class="skill-tag tag-target"> ${skillData.targetCount[0]}</span>
                      <span class="skill-tag tag-hit">${isNaN(skillData.타수) ? skillData.타수 : `${skillData.타수}타`}</span>
                      ${skillData.effect ? `<span class="skill-tag tag-effect">${skillData.effect[0]}</span>` : ''}
                      ${skillData.additionalTurn ? `<span class="skill-tag tag-cast">추가 시전 턴 : ${skillData.additionalTurn}턴</span>` : ''}
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
  fetch("/data/csv/deck.json")
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
                    <img src="/image/digimon/${d.name.replace(/:/g, '_')}/${d.name.replace(/:/g, '_')}.webp" 
                         alt="${d.name}" 
                         onerror="this.src='/image/digimon/default.webp'">
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
              tt.style.position = 'fixed';
              tt.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              tt.style.color = 'white';
              tt.style.padding = '5px 10px';
              tt.style.borderRadius = '4px';
              tt.style.fontSize = '12px';
              tt.style.zIndex = '1000';
              tt.style.pointerEvents = 'none';
              tt.style.whiteSpace = 'nowrap';
              tt.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
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