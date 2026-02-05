async function fetchJSONData(fileName) {
  try {
    const response = await fetch(fileName);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error loading ${fileName}:`, error);
    return null;
  }
}

async function fetchCSVData(fileName) {
  try {
    const response = await fetch(fileName);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();
    const rows = data.split("\n").map((row) => row.split(","));
    return rows;
  } catch (error) {
    console.error(`Error loading ${fileName}:`, error);
    return [];
  }
}

document.getElementById("skill-select").addEventListener("change", function () {
  const characterName = document.getElementById("character-select").value;
  displaySkillImage(characterName);
});

document
  .getElementById("stage-select")
  .addEventListener("change", async function () {
    const stage = this.value;
    const digimonData = await fetchJSONData("https://media.dsrwiki.com/data/csv/digimon.json");
    if (digimonData) {
      populateCharacterDropdown(digimonData, stage);
    }
  });

document
  .getElementById("character-select")
  .addEventListener("change", async function () {
    const characterName = this.value;
    const digimonData = await fetchJSONData("https://media.dsrwiki.com/data/csv/digimon.json");
    if (digimonData) {
      displayCharacterType(digimonData, characterName);
      displayCharacterImage(characterName);
      displayCharacterLevelAndPower(digimonData, characterName);
    }

    const skillSelect = document.getElementById("skill-select");
    skillSelect.value = "skill1";
    skillSelect.dispatchEvent(new Event("change"));

    const skillLevelSelect = document.getElementById("skilllevel-select");
    skillLevelSelect.value = "1레벨";
    skillLevelSelect.dispatchEvent(new Event("change"));

    displaySkillImage(characterName);
  });

function populateCharacterDropdown(digimonData, stage) {
  const characterSelect = document.getElementById("character-select");
  characterSelect.innerHTML = "";

  const filteredCharacters = Object.entries(digimonData).filter(
    ([name, digimon]) => digimon.evolution_stage === stage
  );

  filteredCharacters.forEach(([name, digimon]) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    characterSelect.appendChild(option);
  });

  if (filteredCharacters.length > 0) {
    const firstCharacterName = filteredCharacters[0][0];
    characterSelect.value = firstCharacterName;
    displayCharacterType(digimonData, firstCharacterName);
    displayCharacterImage(firstCharacterName);
    displayCharacterLevelAndPower(digimonData, firstCharacterName);
    displaySkillImage(firstCharacterName);
  }
}

function displayCharacterType(digimonData, characterName) {
  const digimon = digimonData[characterName];
  if (digimon) {
    const type = digimon.type;
    const imagePath = `https://media.dsrwiki.com/dsrwiki/${type}.webp`;
    const typeImageCell = document.getElementById("type-image-cell");
    typeImageCell.innerHTML = `<img loading="lazy" src="${imagePath}" alt="${type}" class="calc-icon-25">`;
  }
}

function displayCharacterImage(characterName) {
  const sanitizedCharacterName = characterName.replace(/:/g, "_");
  const characterImagePath = `https://media.dsrwiki.com/dsrwiki/digimon/${sanitizedCharacterName}/${sanitizedCharacterName}.webp`;
  const characterImageCell = document.getElementById("character-image-cell");
  characterImageCell.innerHTML = `<img loading="lazy" src="${characterImagePath}" alt="${sanitizedCharacterName}" class="character-image">`;
}

function displayCharacterLevelAndPower(digimonData, characterName) {
  const digimon = digimonData[characterName];
  if (digimon) {
    const level = digimon.stats.level;
    const power = digimon.stats.STR;

    const levelCell = document.getElementById("level-cell");
    const powerCell = document.getElementById("힘-cell");

    levelCell.textContent = level;
    powerCell.textContent = power;
  }
}

async function displaySkillImage(characterName) {
  const skillSelect = document.getElementById("skill-select").value;
  const digimonData = await fetchJSONData("https://media.dsrwiki.com/data/csv/digimon.json");
  const digimon = digimonData[characterName];

  if (digimon && digimon.skills) {
    const skillIndex = parseInt(skillSelect.replace('skill', '')) - 1;
    const skillData = digimon.skills[skillIndex];

    if (skillData) {
      const skillImageName = skillData.attribute;
      const skillImagePath = `https://media.dsrwiki.com/dsrwiki/${skillImageName}.webp`;
      const skillText = skillData.target_count;
      const skillImageCell = document.getElementById("skill-cell");

      skillImageCell.innerHTML = `
        <div class="skill-display-container">
          <img loading="lazy" 
            src="${skillImagePath}" 
            alt="${skillImageName}" 
            class="skill-display-img">
          <span>/ ${skillText}</span>
        </div>
      `;
    }
  }
}

document
  .getElementById("map1-select")
  .addEventListener("change", async function () {
    const selectedRegion = this.value;
    const mobData = await fetchCSVData("https://media.dsrwiki.com/data/csv/mob.csv");

    const filteredLocations = [
      ...new Set(
        mobData.filter((row) => row[0] === selectedRegion).map((row) => row[1])
      ),
    ];

    const map2Select = document.getElementById("map2-select");
    map2Select.innerHTML = "";

    filteredLocations.forEach((location) => {
      const option = document.createElement("option");
      option.value = location;
      option.textContent = location;
      map2Select.appendChild(option);
    });

    if (filteredLocations.length > 0) {
      map2Select.value = filteredLocations[0];
      await updateMobSelect(mobData, filteredLocations[0]);
    }
  });

document
  .getElementById("map2-select")
  .addEventListener("change", async function () {
    const selectedLocation = this.value;
    const mobData = await fetchCSVData("https://media.dsrwiki.com/data/csv/mob.csv");
    await updateMobSelect(mobData, selectedLocation);
  });

async function updateMobSelect(mobData, selectedLocation) {
  const filteredMobs = [
    ...new Set(
      mobData.filter((row) => row[1] === selectedLocation).map((row) => row[2])
    ),
  ];
  const mobSelect = document.getElementById("mob-select");
  mobSelect.innerHTML = "";

  filteredMobs.forEach((mob) => {
    const option = document.createElement("option");
    option.value = mob;
    option.textContent = mob;
    mobSelect.appendChild(option);
  });

  if (filteredMobs.length > 0) {
    mobSelect.value = filteredMobs[0];
    await updateMobDetails(mobData, filteredMobs[0]);
    mobSelect.dispatchEvent(new Event("change"));
  }
}

document
  .getElementById("mob-select")
  .addEventListener("change", async function () {
    const selectedMob = this.value;
    const mobData = await fetchCSVData("https://media.dsrwiki.com/data/csv/mob.csv");
    await updateMobDetails(mobData, selectedMob);
  });

async function updateMobDetails(mobData, selectedMob) {
  const selectedMap = document.getElementById("map2-select").value;
  const mobRow = mobData.find(
    (row) => row[2] === selectedMob && row[1] === selectedMap
  );

  if (mobRow) {
    document.getElementById("mob-level").textContent = mobRow[3];
    const mobTypeImage = mobRow[4] ? `https://media.dsrwiki.com/dsrwiki/${mobRow[4]}.webp` : "-";
    document.getElementById("mob-type").innerHTML = mobRow[4]
      ? `<img loading="lazy" src="${mobTypeImage}" alt="${mobRow[4]}" class="mob-attr-icon">`
      : "-";
    document.getElementById("mob-hp").textContent = mobRow[5];
    document.getElementById("mob-def").textContent = parseFloat(
      mobRow[6]
    ).toFixed(2);
    const mobWeaknessImage = mobRow[7] ? `https://media.dsrwiki.com/dsrwiki/${mobRow[7]}.webp` : "-";
    document.getElementById("mob-weak").innerHTML = mobRow[7]
      ? `<img loading="lazy" src="${mobWeaknessImage}" alt="${mobRow[7]}" class="mob-weak-icon">`
      : "-";
    const mobStrengthImage = mobRow[8] ? `https://media.dsrwiki.com/dsrwiki/${mobRow[8]}.webp` : "-";
    document.getElementById("mob-strong").innerHTML = mobRow[8]
      ? `<img loading="lazy" src="${mobStrengthImage}" alt="${mobRow[8]}" class="mob-strong-icon">`
      : "-";
    const mobImagePath = `https://media.dsrwiki.com/dsrwiki/digimon/${selectedMob}/${selectedMob}.webp`;
    const mobImageCell = document.getElementById("mob-image-cell");
    mobImageCell.innerHTML = `<img loading="lazy" src="${mobImagePath}"  alt="${selectedMob}" class="mob-image">`;
  }
}

window.addEventListener("DOMContentLoaded", async function () {
  try {
    const map1Select = document.getElementById("map1-select");
    const defaultRegion = map1Select.value;

    const mobData = await fetchCSVData("https://media.dsrwiki.com/data/csv/mob.csv");

    if (mobData && mobData.length > 0) {
      const filteredLocations = [
        ...new Set(
          mobData.filter((row) => row[0] === defaultRegion).map((row) => row[1])
        ),
      ];

      const map2Select = document.getElementById("map2-select");
      map2Select.innerHTML = "";

      filteredLocations.forEach((location) => {
        const option = document.createElement("option");
        option.value = location;
        option.textContent = location;
        map2Select.appendChild(option);
      });

      if (filteredLocations.length > 0) {
        map2Select.value = filteredLocations[0];
        await updateMobSelect(mobData, filteredLocations[0]);
      }
    }

    const digimonData = await fetchJSONData("https://media.dsrwiki.com/data/csv/digimon.json");

    if (digimonData) {
      await populateCharacterDropdown(digimonData, "성장기");

      const skillSelect = document.getElementById("skill-select");
      skillSelect.value = "skill1";

      const skillLevelSelect = document.getElementById("skilllevel-select");
      skillLevelSelect.value = "1레벨";

      skillSelect.dispatchEvent(new Event("change"));
      skillLevelSelect.dispatchEvent(new Event("change"));

      const firstCharacterName = Object.keys(digimonData).find(name => digimonData[name].evolution_stage === "성장기");

      if (firstCharacterName) {
        await displaySkillImage(firstCharacterName);
      }
    }

    await calculateStrengthResult();
    await calculateProbability();
  } catch (error) {
    console.error("Error in DOMContentLoaded:", error);
  }
});

document.getElementById("manual-mode").addEventListener("change", async function () {
  const isManualMode = this.checked;
  document.getElementById("manual-input-row").style.display = isManualMode ? "table-row" : "none";
  document.getElementById("normal-mode-row").style.display = isManualMode ? "none" : "table-row";
  document.getElementById("character-image-cell").style.display = isManualMode ? "none" : "table-cell";

  // 수동 입력 모드일 때 숨길 요소들
  document.getElementById("character-select-row").style.display = isManualMode ? "none" : "table-row";
  document.getElementById("type-row").style.display = isManualMode ? "none" : "table-row";
  document.getElementById("level-row").style.display = isManualMode ? "none" : "table-row";
  document.getElementById("power-row").style.display = isManualMode ? "none" : "table-row";
  document.getElementById("skill-select-area-row").style.display = isManualMode ? "none" : "table-row";
  document.getElementById("skill-image-row").style.display = isManualMode ? "none" : "table-row";

  // 테이블 테두리 유지
  document.querySelector("table").style.border = "1px solid #ccc";

  if (isManualMode) {
    // 수동 입력 모드일 때 계산 함수 호출
    calculateStrengthResult();
    calculateProbability();
  } else {
    // 일반 모드로 돌아올 때 캐릭터 정보 다시 불러오기
    const characterName = document.getElementById("character-select").value;
    const digimonData = await fetchJSONData("https://media.dsrwiki.com/data/csv/digimon.json");
    if (digimonData) {
      displayCharacterType(digimonData, characterName);
      displayCharacterImage(characterName);
      displayCharacterLevelAndPower(digimonData, characterName);
      displaySkillImage(characterName);
    }

    // 계산 함수 호출
    calculateStrengthResult();
    calculateProbability();
  }
});

// 수동 입력 필드들의 이벤트 리스너 추가
document.querySelectorAll("#manual-type, #manual-level, #manual-power, #manual-skill-coefficient, #manual-hit-count, #manual-skill-element, #manual-target-type").forEach(input => {
  input.addEventListener("input", () => {
    if (document.getElementById("manual-mode").checked) {
      calculateStrengthResult();
      calculateProbability();
    }
  });
});

async function calculateStrengthResult() {
  function getInputValue(id) {
    const value = document.getElementById(id).value;
    return value ? parseFloat(value) : 0;
  }

  const isManualMode = document.getElementById("manual-mode").checked;
  let basePower = 0;
  let myType = "";
  let myLevel = 1;

  if (isManualMode) {
    basePower = getInputValue("manual-power");
    myType = document.getElementById("manual-type").value;
    myLevel = getInputValue("manual-level");
  } else {
    const characterName = document.getElementById("character-select").value;
    const digimonData = await fetchJSONData("https://media.dsrwiki.com/data/csv/digimon.json");
    const digimon = digimonData[characterName];

    if (digimon) {
      basePower = parseFloat(digimon.stats.STR) || 0;
      myType = digimon.type;
      myLevel = parseInt(digimon.stats.level, 10);
    }
  }

  const potential = getInputValue("potential") / 100;
  const correction = getInputValue("correction") / 100;
  const synergy = getInputValue("synergy");
  const buff = getInputValue("buff");
  const specialization = getInputValue("specialization");
  const equipment = getInputValue("equipment1");

  const totalStrength =
    basePower +
    Math.ceil(basePower * potential) +
    Math.ceil(basePower * correction) +
    synergy +
    buff +
    specialization +
    equipment;

  document.getElementById("str-result").textContent = totalStrength;

  return totalStrength;
}

document
  .querySelectorAll(
    "#potential, #correction, #synergy, #buff, #specialization, #equipment, #dmg-min, #dmg-max"
  )
  .forEach((input) => input.addEventListener("input", calculateStrengthResult));

window.addEventListener("DOMContentLoaded", calculateStrengthResult);

// Helper functions for probability calculation
function factorial(n) {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function combinations(n, k) {
  if (k < 0 || k > n) return 0;
  return factorial(n) / (factorial(k) * factorial(n - k));
}

function irwinHallCDF(x, n) {
  if (n === 0) return 0;
  let sum = 0;
  for (let k = 0; k <= Math.floor(x); k++) {
    sum += Math.pow(-1, k) * combinations(n, k) * Math.pow(x - k, n);
  }
  return sum / factorial(n);
}

// CDF of Normal Distribution approximation
function normalCDF(x, mean, stdDev) {
  return 0.5 * (1 + erf((x - mean) / (stdDev * Math.sqrt(2))));
}

function erf(x) {
  // Save the sign of x
  var sign = (x >= 0) ? 1 : -1;
  x = Math.abs(x);

  // Constants
  var a1 = 0.254829592;
  var a2 = -0.284496736;
  var a3 = 1.421413741;
  var a4 = -1.453152027;
  var a5 = 1.061405429;
  var p = 0.3275911;

  // A&S formula 7.1.26
  var t = 1.0 / (1.0 + p * x);
  var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

async function calculateProbability() {
  try {
    const mobName = document.getElementById("mob-select").value;
    const selectedMap = document.getElementById("map2-select").value;

    if (!mobName || !selectedMap) {
      console.log("Missing mob name or selected map");
      document.getElementById("needstr").textContent = "계산 불가";
      return;
    }

    let mobHP = 0;
    let mobDef = 0;
    let mobType = "";
    let mobStrong = "";
    let mobWeak = "";

    const mobData = await fetchCSVData("https://media.dsrwiki.com/data/csv/mob.csv");
    const mobRow = mobData.find(
      (row) => row[2] === mobName && row[1] === selectedMap
    );

    if (!mobRow) {
      document.getElementById("needstr").textContent = "계산 불가";
      return;
    }

    mobHP = parseFloat(mobRow[5]);
    mobDef = parseFloat(mobRow[6]);
    mobType = mobRow[4];
    mobStrong = mobRow[8];
    mobWeak = mobRow[7];

    const isManualMode = document.getElementById("manual-mode").checked;
    let myType = "";
    let myLevel = 1;
    let skillCoefficient = 0;
    let hitCount = 1;
    let mySkillElement = "";

    if (isManualMode) {
      myType = document.getElementById("manual-type").value;
      myLevel = parseFloat(document.getElementById("manual-level").value) || 1;
      skillCoefficient = (parseFloat(document.getElementById("manual-skill-coefficient").value) || 0) / 100;
      hitCount = parseFloat(document.getElementById("manual-hit-count").value) || 1;
      mySkillElement = document.getElementById("manual-skill-element").value;
      const manualTargetType = document.getElementById("manual-target-type").value;
      if (manualTargetType === "전체") {
        const mobCount = parseInt(document.getElementById("mob-count").value);
        if (mobCount > 0) {
          skillCoefficient = skillCoefficient / mobCount;
        }
      }
    } else {
      const characterName = document.getElementById("character-select").value;
      const digimonData = await fetchJSONData("https://media.dsrwiki.com/data/csv/digimon.json");
      const digimon = digimonData[characterName];

      if (!digimon) {
        console.log("Digimon data not found:", characterName);
        document.getElementById("needstr").textContent = "계산 불가";
        return;
      }

      myType = digimon.type;
      myLevel = parseInt(digimon.stats.level, 10);

      const skillSelect = document.getElementById("skill-select").value;
      const skillLevel = document.getElementById("skilllevel-select").value;
      const skillIndex = parseInt(skillSelect.replace('skill', '')) - 1;

      if (digimon.skills && digimon.skills[skillIndex]) {
        const skillData = digimon.skills[skillIndex];
        const levelNumber = parseInt(skillLevel.replace('레벨', '')) - 1;
        skillCoefficient = parseFloat(skillData.multipliers[levelNumber]) || 0;
        hitCount = parseFloat(skillData.hits);
        mySkillElement = skillData.attribute || "";

        if (skillData.target_count === "전체") {
          const mobCount = parseInt(document.getElementById("mob-count").value);
          skillCoefficient = skillCoefficient / mobCount;
        }
      }
    }

    if (!skillCoefficient) {
      skillCoefficient = 1;
    }

    // Ensure hitCount is at least 1 and integer for probability calculation logic
    // Using Round since usually hit counts are integers.
    const effectiveHits = Math.max(1, Math.round(hitCount));

    const skillCount = document.getElementById("skillcount").value;
    let targetHP = mobHP;

    if (skillCount === "2킬") {
      targetHP = mobHP / 2;
    } else if (skillCount === "3킬") {
      targetHP = mobHP / 3;
    } else if (skillCount === "4킬") {
      targetHP = mobHP / 4;
    } else if (skillCount === "5킬") {
      targetHP = mobHP / 5;
    }

    let compatibility = 1.0;

    if (myType === "백신" && mobType === "바이러스") compatibility = 1.25;
    else if (myType === "바이러스" && mobType === "데이터") compatibility = 1.25;
    else if (myType === "데이터" && mobType === "백신") compatibility = 1.25;

    else if (myType === "바이러스" && mobType === "백신") compatibility = 0.75;
    else if (myType === "데이터" && mobType === "바이러스") compatibility = 0.75;
    else if (myType === "백신" && mobType === "데이터") compatibility = 0.75;

    else if (
      myType === "프리" &&
      ["백신", "데이터", "바이러스"].includes(mobType)
    )
      compatibility = 1.0;
    else if (myType === "프리" && mobType === "언노운") compatibility = 1.25;

    else if (
      myType === "언노운" &&
      ["백신", "데이터", "바이러스"].includes(mobType)
    )
      compatibility = 1.125;
    else if (myType === "언노운" && mobType === "프리") compatibility = 0.75;

    else if (myType === mobType) compatibility = 1.0;

    let elementalFactor = 1.0;

    if (mySkillElement === mobStrong) elementalFactor = 0.75;
    else if (mySkillElement === mobWeak) elementalFactor = 1.25;

    const levelConstant = myLevel * 12 + 24;

    let equipment2Value = parseFloat(document.getElementById("equipment2").value) || 0;
    if (!isNaN(equipment2Value)) {
      let adjustedEquipment2Value = Math.ceil((equipment2Value / 100) * 10000) / 10000;
      let increaseValue = skillCoefficient * adjustedEquipment2Value;
      increaseValue = Math.ceil(increaseValue * 10000) / 10000;
      skillCoefficient += increaseValue;
    }



    const totalStrength = await calculateStrengthResult();

    // Critical Damage Parameters
    let critDmgInput = document.getElementById("crit-dmg").value.replace(/%/g, '');
    let critMultiplier = (critDmgInput === "" ? 150 : parseFloat(critDmgInput)) || 150;
    critMultiplier = critMultiplier / 100;

    // Critical Rate Parameters
    let critRateInput = document.getElementById("crit-rate").value.replace(/%/g, '');
    let critRatePercent = (critRateInput === "" ? 0 : parseFloat(critRateInput)) || 0;
    let critProbability = Math.max(0, Math.min(100, critRatePercent)) / 100;

    // Elemental Factor for Crits (remove 1.25x weakness bonus)
    let appliedElementalFactor = elementalFactor;
    if (mySkillElement === mobWeak) {
      appliedElementalFactor = 1.0;
    }

    // Damage Range Percentages
    const minRangeInput = document.getElementById("dmg-min").value;
    const maxRangeInput = document.getElementById("dmg-max").value;
    const minRangePercent = (minRangeInput === "" ? 95 : parseFloat(minRangeInput)) || 95;
    const maxRangePercent = (maxRangeInput === "" ? 105 : parseFloat(maxRangeInput)) || 105;

    // --- 1. Normal Hit Parameters ---
    const normalDamageFactor = (skillCoefficient * compatibility * elementalFactor * levelConstant) / (mobDef || 1);
    const normalBaseDmg = totalStrength * normalDamageFactor;
    const normalMinDmg = normalBaseDmg * (minRangePercent / 100);
    const normalMaxDmg = normalBaseDmg * (maxRangePercent / 100);

    // Normal Approximation stats for single normal hit
    const normalMean = (normalMinDmg + normalMaxDmg) / 2;
    const normalRange = normalMaxDmg - normalMinDmg;
    const normalVar = (normalRange * normalRange) / 12;

    // --- 2. Critical Hit Parameters ---
    const critDamageFactor = (skillCoefficient * compatibility * appliedElementalFactor * levelConstant) / (mobDef || 1);
    const critBaseDmg = totalStrength * critDamageFactor * critMultiplier;
    const critMinDmg = critBaseDmg * (minRangePercent / 100);
    const critMaxDmg = critBaseDmg * (maxRangePercent / 100);

    // Normal Approximation stats for single crit hit
    const critMean = (critMinDmg + critMaxDmg) / 2;
    const critRange = critMaxDmg - critMinDmg;
    const critVar = (critRange * critRange) / 12; // Variance of Uniform distribution

    let totalKillProbability = 0;

    // Iterate through all possible numbers of critical hits (k from 0 to effectiveHits)
    for (let k = 0; k <= effectiveHits; k++) {
      let normalHits = effectiveHits - k;

      // Probability of getting exactly k crits (Binomial Distribution)
      let binomialProb = combinations(effectiveHits, k) * Math.pow(critProbability, k) * Math.pow(1 - critProbability, normalHits);

      if (binomialProb < 1e-9) continue; // Optimization: skip negligible probabilities

      let conditionalKillProb = 0;

      // Distribution of Total Damage for this specific combination of k crits + (N-k) normals
      if (k === 0) {
        // Case: All Normal Hits (Sum of N uniform variables)
        // Use Irwin-Hall logic (reuse existing logic but adapted)
        const totalMin = normalMinDmg * effectiveHits;
        const totalMax = normalMaxDmg * effectiveHits;

        if (totalMin >= targetHP) {
          conditionalKillProb = 1;
        } else if (totalMax < targetHP) {
          conditionalKillProb = 0;
        } else {
          if (effectiveHits > 15) {
            const totalMean = normalMean * effectiveHits;
            const totalVar = normalVar * effectiveHits;
            conditionalKillProb = 1 - normalCDF(targetHP, totalMean, Math.sqrt(totalVar));
          } else {
            const rangePerHit = normalRange;
            if (rangePerHit <= 0.0001) {
              conditionalKillProb = (totalMean >= targetHP) ? 1 : 0;
            } else {
              const z_target = (targetHP - effectiveHits * normalMinDmg) / rangePerHit;
              conditionalKillProb = 1 - irwinHallCDF(z_target, effectiveHits);
            }
          }
        }

      } else if (k === effectiveHits) {
        // Case: All Critical Hits (Sum of N uniform variables)
        const totalMin = critMinDmg * effectiveHits;
        const totalMax = critMaxDmg * effectiveHits;

        if (totalMin >= targetHP) {
          conditionalKillProb = 1;
        } else if (totalMax < targetHP) {
          conditionalKillProb = 0;
        } else {
          if (effectiveHits > 15) {
            const totalMean = critMean * effectiveHits;
            const totalVar = critVar * effectiveHits;
            conditionalKillProb = 1 - normalCDF(targetHP, totalMean, Math.sqrt(totalVar));
          } else {
            const rangePerHit = critRange;
            if (rangePerHit <= 0.0001) {
              conditionalKillProb = (totalMean >= targetHP) ? 1 : 0;
            } else {
              const z_target = (targetHP - effectiveHits * critMinDmg) / rangePerHit;
              conditionalKillProb = 1 - irwinHallCDF(z_target, effectiveHits);
            }
          }
        }
      } else {
        // Case: Mixed Hits (Sum of k Uniform(Crit) + (N-k) Uniform(Normal))
        // Use Normal Approximation for the sum
        const totalMean = k * critMean + normalHits * normalMean;
        const totalVar = k * critVar + normalHits * normalVar;
        const totalStdDev = Math.sqrt(totalVar);

        // Approximate absolute min/max for bounds check (optional but safe)
        const absMin = k * critMinDmg + normalHits * normalMinDmg;
        const absMax = k * critMaxDmg + normalHits * normalMaxDmg;

        if (absMin >= targetHP) {
          conditionalKillProb = 1;
        } else if (absMax < targetHP) {
          conditionalKillProb = 0;
        } else {
          conditionalKillProb = 1 - normalCDF(targetHP, totalMean, totalStdDev);
        }
      }

      totalKillProbability += binomialProb * conditionalKillProb;
    }

    // Clamp and format
    let finalProbability = Math.max(0, Math.min(100, totalKillProbability * 100)); // Convert to percent
    document.getElementById("needstr").textContent = finalProbability.toFixed(2) + "%";

  } catch (error) {
    console.error("Error in calculateProbability:", error);
    document.getElementById("needstr").textContent = "계산 불가";
  }
}
document
  .querySelectorAll(
    "#potential, #correction, #synergy, #buff, #specialization, #equipment1, #equipment2, #dmg-min, #dmg-max, #crit-dmg, #crit-rate"
  )
  .forEach((input) =>
    input.addEventListener("input", async () => {
      await calculateStrengthResult();
      await calculateProbability();
    })
  );

document
  .getElementById("skill-select")
  .addEventListener("change", calculateProbability);
document
  .getElementById("skilllevel-select")
  .addEventListener("change", calculateProbability);
document
  .getElementById("skillcount")
  .addEventListener("change", calculateProbability);
document
  .getElementById("mob-select")
  .addEventListener("change", calculateProbability);
document
  .getElementById("map2-select")
  .addEventListener("change", calculateProbability);

// 몹 수 선택 이벤트 리스너 추가
document
  .getElementById("mob-count")
  .addEventListener("change", calculateProbability);

window.addEventListener("DOMContentLoaded", async () => {
  await calculateStrengthResult();
  await calculateProbability();
});