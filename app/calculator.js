async function fetchCSVData(fileName) {
  const response = await fetch(fileName);
  const data = await response.text();
  const rows = data.split("\n").map((row) => row.split(","));
  return rows;
}

document.getElementById("skill-select").addEventListener("change", function () {
  const characterName = document.getElementById("character-select").value;
  displaySkillImage(characterName);
});

document
  .getElementById("stage-select")
  .addEventListener("change", async function () {
    const stage = this.value;
    const characters = await fetchCSVData("../data/csv/characters.csv");
    populateCharacterDropdown(characters, stage);
  });

document
  .getElementById("character-select")
  .addEventListener("change", async function () {
    const characterName = this.value;
    const characters = await fetchCSVData("../data/csv/characters.csv");
    displayCharacterType(characters, characterName);
    displayCharacterImage(characterName);
    displayCharacterLevelAndPower(characters, characterName);

    const skillSelect = document.getElementById("skill-select");
    skillSelect.value = "skill1";
    skillSelect.dispatchEvent(new Event("change"));

    const skillLevelSelect = document.getElementById("skilllevel-select");
    skillLevelSelect.value = "1레벨";
    skillLevelSelect.dispatchEvent(new Event("change"));

    displaySkillImage(characterName);
  });

function populateCharacterDropdown(characters, stage) {
  const characterSelect = document.getElementById("character-select");
  characterSelect.innerHTML = "";

  const filteredCharacters = characters.filter(
    (character) => character[1] === stage
  );

  filteredCharacters.forEach((character) => {
    const option = document.createElement("option");
    option.value = character[0];
    option.textContent = character[0];
    characterSelect.appendChild(option);
  });

  if (filteredCharacters.length > 0) {
    const firstCharacter = filteredCharacters[0][0];
    characterSelect.value = firstCharacter;
    displayCharacterType(characters, firstCharacter);
    displayCharacterImage(firstCharacter);
    displayCharacterLevelAndPower(characters, firstCharacter);
    displaySkillImage(firstCharacter);
  }
}

function displayCharacterType(characters, characterName) {
  const character = characters.find(
    (character) => character[0] === characterName
  );
  const type = character[2];
  const imagePath = `../image/${type}.webp`;
  const typeImageCell = document.getElementById("type-image-cell");
  typeImageCell.innerHTML = `<img src="${imagePath}" loading="lazy" alt="${type}" style="width: 25px; height: 25px;">`;
}

function displayCharacterImage(characterName) {
  const sanitizedCharacterName = characterName.replace(/:/g, "_");
  const characterImagePath = `../image/digimon/${sanitizedCharacterName}/${sanitizedCharacterName}.webp`;
  const characterImageCell = document.getElementById("character-image-cell");
  characterImageCell.innerHTML = `<img src="${characterImagePath}" loading="lazy" alt="${sanitizedCharacterName}" class="character-image">`;
}

function displayCharacterLevelAndPower(characters, characterName) {
  const character = characters.find(
    (character) => character[0] === characterName
  );
  const level = character[3];
  const power = character[6];

  const levelCell = document.getElementById("level-cell");
  const powerCell = document.getElementById("힘-cell");

  levelCell.textContent = level;
  powerCell.textContent = power;
}

async function displaySkillImage(characterName) {
  const skillSelect = document.getElementById("skill-select").value;
  let skillFile = "";

  if (skillSelect === "skill1") {
    skillFile = "../data/csv/skill1.csv";
  } else if (skillSelect === "skill2") {
    skillFile = "../data/csv/skill2.csv";
  } else if (skillSelect === "skill3") {
    skillFile = "../data/csv/skill3.csv";
  }

  const skillData = await fetchCSVData(skillFile);
  const skillRow = skillData.find((row) => row[10] === characterName);

  if (skillRow) {
    const skillImageName = skillRow[15];
    const skillImagePath = `../image/${skillImageName}.webp`;
    const skillText = skillRow[17]; // skillRow[17]의 값을 가져옵니다.
    const skillImageCell = document.getElementById("skill-cell");

    skillImageCell.innerHTML = `
      <img 
        src="${skillImagePath}" 
        loading="lazy" 
        alt="${skillImageName}" 
        style="width: 25px; height: 25px; vertical-align: middle; background-image: url('../image/background.webp'); background-size: 120%; background-position: center;">
      <div style="display: inline-block; margin-left: 5px; vertical-align: middle;">/ ${skillText}</div>
    `;
  }
  
}

document
  .getElementById("map1-select")
  .addEventListener("change", async function () {
    const selectedRegion = this.value;
    const mobData = await fetchCSVData("../data/csv/mob.csv");

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
      updateMobSelect(mobData, filteredLocations[0]);
    }
  });

document
  .getElementById("map2-select")
  .addEventListener("change", async function () {
    const selectedLocation = this.value;
    const mobData = await fetchCSVData("../data/csv/mob.csv");
    updateMobSelect(mobData, selectedLocation);
  });

function updateMobSelect(mobData, selectedLocation) {
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
    updateMobDetails(mobData, filteredMobs[0]);
    mobSelect.dispatchEvent(new Event("change"));
  }
}

document
  .getElementById("mob-select")
  .addEventListener("change", async function () {
    const selectedMob = this.value;
    const mobData = await fetchCSVData("../data/csv/mob.csv");
    updateMobDetails(mobData, selectedMob);
  });

function updateMobDetails(mobData, selectedMob) {
  const selectedMap = document.getElementById("map2-select").value;
  const mobRow = mobData.find(
    (row) => row[2] === selectedMob && row[1] === selectedMap
  );

  if (mobRow) {
    document.getElementById("mob-level").textContent = mobRow[3];
    const mobTypeImage = mobRow[4] ? `../image/${mobRow[4]}.webp` : "-";
    document.getElementById("mob-type").innerHTML = mobRow[4]
      ? `<img src="${mobTypeImage}" loading="lazy" alt="${mobRow[4]}" style="width: 25px; height: 25px;">`
      : "-";
    document.getElementById("mob-hp").textContent = mobRow[5];
    document.getElementById("mob-def").textContent = parseFloat(
      mobRow[6]
    ).toFixed(2);
    const mobWeaknessImage = mobRow[7] ? `../image/${mobRow[7]}.webp` : "-";
    document.getElementById("mob-weak").innerHTML = mobRow[7]
      ? `<img src="${mobWeaknessImage}" loading="lazy" alt="${mobRow[7]}" style="width: 25px; height: 25px; background-image: url('../image/weakbackground.webp'); background-size: 120%; background-position: center;">`
      : "-";
    const mobStrengthImage = mobRow[8] ? `../image/${mobRow[8]}.webp` : "-";
    document.getElementById("mob-strong").innerHTML = mobRow[8]
      ? `<img src="${mobStrengthImage}" loading="lazy" alt="${mobRow[8]}" style="width: 25px; height: 25px; background-image: url('../image/strongbackground.webp'); background-size: 120%; background-position: center;">`
      : "-";
    const mobImagePath = `../image/digimon/${selectedMob}/${selectedMob}.webp`;
    const mobImageCell = document.getElementById("mob-image-cell");
    mobImageCell.innerHTML = `<img src="${mobImagePath}" loading="lazy" alt="${selectedMob}" class="mob-image">`;
  }
}

window.addEventListener("DOMContentLoaded", async function () {
  const map1Select = document.getElementById("map1-select");
  const defaultRegion = map1Select.value;

  const mobData = await fetchCSVData("../data/csv/mob.csv");
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
    updateMobSelect(mobData, filteredLocations[0]);
  }

  const characters = await fetchCSVData("../data/csv/characters.csv");
  populateCharacterDropdown(characters, "완전체");

  const skillSelect = document.getElementById("skill-select");
  skillSelect.value = "skill1";

  const skillLevelSelect = document.getElementById("skilllevel-select");
  skillLevelSelect.value = "1레벨";

  skillSelect.dispatchEvent(new Event("change"));
  skillLevelSelect.dispatchEvent(new Event("change"));

  const firstCharacter = characters.find(
    (character) => character[1] === "완전체"
  )[0];
  displaySkillImage(firstCharacter);
});

async function calculateStrengthResult() {
  function getInputValue(id) {
    const value = document.getElementById(id).value;
    return value ? parseFloat(value) : 0;
  }

  const characterName = document.getElementById("character-select").value;
  const charactersData = await fetchCSVData("../data/csv/characters.csv");
  const characterRow = charactersData.find((row) => row[0] === characterName);

  let basePower = 0;
  if (characterRow) {
    basePower = parseFloat(characterRow[6]) || 0;
  }

  const potential = getInputValue("potential") / 100;
  const correction = getInputValue("correction") / 100;
  const synergy = getInputValue("synergy") / 100;
  const buff = getInputValue("buff");
  const specialization = getInputValue("specialization");
  const equipment = getInputValue("equipment");

  const totalStrength =
    basePower +
    Math.ceil(basePower * potential) +
    Math.ceil(basePower * correction) +
    Math.ceil(basePower * synergy) +
    buff +
    specialization +
    equipment;

  document.getElementById("str-result").textContent = totalStrength;

  return totalStrength;
}

document
  .querySelectorAll(
    "#potential, #correction, #synergy, #buff, #specialization, #equipment"
  )
  .forEach((input) => input.addEventListener("input", calculateStrengthResult));

window.addEventListener("DOMContentLoaded", calculateStrengthResult);

async function calculateNeedStr() {
  const mobName = document.getElementById("mob-select").value;
  const selectedMap = document.getElementById("map2-select").value;

  let mobHP = 0;
  let mobDef = 0;
  let mobType = "";
  let mobStrong = "";
  let mobWeak = "";

  const mobData = await fetchCSVData("../data/csv/mob.csv");
  const mobRow = mobData.find(
    (row) => row[2] === mobName && row[1] === selectedMap
  );

  if (mobRow) {
    mobHP = parseFloat(mobRow[5]);
    mobDef = parseFloat(mobRow[6]);
    mobType = mobRow[4];
    mobStrong = mobRow[8];
    mobWeak = mobRow[7];
  } else {
    document.getElementById("needstr").textContent = "계산 불가";
    return;
  }

  const characterName = document.getElementById("character-select").value;
  let myType = "";
  let myLevel = 1;
  const characterData = await fetchCSVData("../data/csv/characters.csv");
  const characterRow = characterData.find((row) => row[0] === characterName);

  if (characterRow) {
    myType = characterRow[2];
    myLevel = parseInt(characterRow[3], 10);
  } else {
    document.getElementById("needstr").textContent = "계산 불가";
    return;
  }

  const skillSelect = document.getElementById("skill-select").value;
  const skillLevel = document.getElementById("skilllevel-select").value;
  let skillCoefficient = 0;
  let hitCount = 1;
  let mySkillElement = "";

  const skillData = await fetchCSVData(`../data/csv/${skillSelect}.csv`);
  const skillRow = skillData.find((row) => row[10] === characterName);

  if (skillRow) {
    const levelIndex = parseInt(skillLevel) - 1;
    skillCoefficient = parseFloat(skillRow[levelIndex]);
    hitCount = parseFloat(skillRow[13]);
    mySkillElement = skillRow[15];
  }

  const skillCount = document.getElementById("skillcount").value;

  if (skillCount === "2킬") {
    mobHP = mobHP / 2;
  } else if (skillCount === "3킬") {
    mobHP = mobHP / 3;
  } else if (skillCount === "4킬") {
    mobHP = mobHP / 4;
  } else if (skillCount === "5킬") {
    mobHP = mobHP / 5;
  }

  let compatibility = 1.0;

  // 기존 강점 조건
  if (myType === "백신" && mobType === "바이러스") compatibility = 1.25;
  else if (myType === "바이러스" && mobType === "데이터") compatibility = 1.25;
  else if (myType === "데이터" && mobType === "백신") compatibility = 1.25;
  
  // 추가된 약점 조건 (반대 상황일 때)
  else if (myType === "바이러스" && mobType === "백신") compatibility = 0.75;
  else if (myType === "데이터" && mobType === "바이러스") compatibility = 0.75;
  else if (myType === "백신" && mobType === "데이터") compatibility = 0.75;
  
  // 프리 타입 조건
  else if (
    myType === "프리" &&
    ["백신", "데이터", "바이러스"].includes(mobType)
  )
    compatibility = 1.0;
  else if (myType === "프리" && mobType === "언노운") compatibility = 1.25;
  
  // 언노운 타입 조건
  else if (
    myType === "언노운" &&
    ["백신", "데이터", "바이러스"].includes(mobType)
  )
    compatibility = 1.125;
  else if (myType === "언노운" && mobType === "프리") compatibility = 0.75;
  
  // 동일 타입 조건
  else if (myType === mobType) compatibility = 1.0;  

  let elementalFactor = 1.0;

  if (mySkillElement === mobStrong) elementalFactor = 0.75;
  else if (mySkillElement === mobWeak) elementalFactor = 1.25;

  const minDamageRatio = 0.95;
  const constant = myLevel * 12 + 24;

  const totalStrength = await calculateStrengthResult();
  const needStr = Math.ceil(
    mobHP /
      ((hitCount *
        skillCoefficient *
        compatibility *
        elementalFactor *
        constant *
        minDamageRatio) /
        mobDef)
  );

  const strResult =
    parseFloat(document.getElementById("str-result").textContent) || 0;
  const minDamage = Math.ceil(
    (totalStrength *
      hitCount *
      skillCoefficient *
      compatibility *
      elementalFactor *
      constant *
      minDamageRatio) /
      mobDef
  );

  document.getElementById("needstr").textContent = needStr;
  document.getElementById("min-damage").textContent = minDamage;
}

document
  .querySelectorAll(
    "#potential, #correction, #synergy, #buff, #specialization, #equipment"
  )
  .forEach((input) =>
    input.addEventListener("input", async () => {
      await calculateStrengthResult();
      await calculateNeedStr();
    })
  );

document
  .getElementById("skill-select")
  .addEventListener("change", calculateNeedStr);
document
  .getElementById("skilllevel-select")
  .addEventListener("change", calculateNeedStr);
document
  .getElementById("skillcount")
  .addEventListener("change", calculateNeedStr);
document
  .getElementById("mob-select")
  .addEventListener("change", calculateNeedStr);
document
  .getElementById("map2-select")
  .addEventListener("change", calculateNeedStr);

window.addEventListener("DOMContentLoaded", async () => {
  await calculateStrengthResult();
  await calculateNeedStr();
});
