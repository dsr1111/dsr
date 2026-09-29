// Damage and probability calculation, preserving the existing wiki formula.
async function calculateStrengthResult(value) {
  const context = getCalculationContext(value);
  if (context.hasStrengthResult) return context.strengthResult;

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
    const digimonData = await context.getDigimonData();
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

  if (context.isCurrent()) {
    document.getElementById("str-result").textContent = totalStrength;
  }

  context.strengthResult = totalStrength;
  context.hasStrengthResult = true;

  return totalStrength;
}




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

async function calculateProbability(value) {
  const context = getCalculationContext(value);
  if (!context.isCurrent()) return;
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

    const mobData = await context.getMobData();
    if (!context.isCurrent()) return;
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
      const digimonData = await context.getDigimonData();
      if (!context.isCurrent()) return;
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
        mySkillElement = document.getElementById("skill-element").value || skillData.attribute || "";

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

    let equipment2Value = (parseFloat(document.getElementById("equipment2").value) || 0) + (parseFloat(document.getElementById("engraving").value) || 0);
    if (!isNaN(equipment2Value)) {
      let adjustedEquipment2Value = Math.ceil((equipment2Value / 100) * 10000) / 10000;
      let increaseValue = skillCoefficient * adjustedEquipment2Value;
      increaseValue = Math.ceil(increaseValue * 10000) / 10000;
      skillCoefficient += increaseValue;
    }



    const totalStrength = await calculateStrengthResult(context);
    if (!context.isCurrent()) return;

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

    document.dispatchEvent(new CustomEvent('calculation-detail', {detail: {skillCoefficient, compatibility, elementalFactor, appliedElementalFactor, normalMinDmg, normalMaxDmg, critMinDmg, critMaxDmg, effectiveHits, totalStrength}}));
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
              conditionalKillProb = (normalMean * effectiveHits >= targetHP) ? 1 : 0;
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
              conditionalKillProb = (critMean * effectiveHits >= targetHP) ? 1 : 0;
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
    if (!context.isCurrent()) return;
    console.error("Error in calculateProbability:", error);
    document.getElementById("needstr").textContent = "계산 불가";
  }
}
