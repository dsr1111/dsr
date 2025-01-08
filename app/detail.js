function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener("DOMContentLoaded", () => {
  const characterName = decodeURIComponent(getQueryParam("name"));
  if (!characterName) {
    document.getElementById("character-name").textContent =
      "캐릭터 정보를 찾을 수 없습니다.";
    return;
  }

  document.getElementById("character-name").textContent = characterName;
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

        for (let i = 1; i <= 3; i++) {
          const fieldImgElement = document.getElementById(`field-img${i}`);
          if (fields[i - 1]) {
            fieldImgElement.src = `../image/field/${fields[i - 1]}.webp`;
            fieldImgElement.alt = `${fields[i - 1]} 이미지`;
            fieldImgElement.title = `${fields[i - 1]}`;
            fieldImgElement.style.display = "inline";
          } else {
            fieldImgElement.style.display = "none";
          }
        }

        document.getElementById("character-img").src = characterImgPath;

        const evolutionImgPath = `../image/${evolutionStage}.webp`;
        document.getElementById("evolution-img").src = evolutionImgPath;

        const typeImgPath = `../image/${type}.webp`;
        document.getElementById("type-img").src = typeImgPath;
        document.getElementById("stat-level").textContent = columns[3];
        document.getElementById("stat-hp").textContent = columns[4];
        document.getElementById("stat-sp").textContent = columns[5];
        document.getElementById("stat-power").textContent = columns[6];
        document.getElementById("stat-intelligence").textContent = columns[7];
        document.getElementById("stat-defense").textContent = columns[8];
        document.getElementById("stat-resistance").textContent = columns[9];
        document.getElementById("stat-speed").textContent = columns[10];

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

        const swTableBody = document
          .getElementById("sw")
          .querySelector("tbody");
        swTableBody.innerHTML = `
<tr>
  ${strengths
    .map(
      (str, index) => `
      <td style="width: 60px; padding: 5px; text-align: center; position: relative; left: 50px; top: -20px;">
        <div style="background-image: url('../image/strongbackground.webp'); background-size: cover; background-position: center; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center;">
          <img src="../image/${str}.webp" loading="lazy" alt="${str} 이미지" title="${str}" style="width: 80%; height: 80%; object-fit: contain;">
        </div>
      </td>
      <td style="padding: 5px; text-align: left; position: relative; left: 50px; top: -20px;">
        <span style="font-size: 16px; font-weight: bold;">${strengthsDesc[index] || ""}</span>
        ${
                strengthsDesc[index] === "반사"
              ? '<span style="font-size: 14px; color: #3f3f3f; margin-left: 10px;">해당 속성의 공격을 받으면 <span class="highlight">피해량의 25%</span>를 되돌려 줍니다.</span>'
              : strengthsDesc[index] === "회피"
              ? '<span style="font-size: 14px; color: #3f3f3f; margin-left: 10px;">해당 속성 공격에 대해 <span class="highlight">회피율이 2배</span>로 적용됩니다.</span>'
              : strengthsDesc[index] === "내성"
              ? '<span style="font-size: 14px; color: #3f3f3f; margin-left: 10px;">해당 속성의 공격으로 받는 데미지는 <span class="highlight">25% 감소</span>합니다.</span>'
              : ""
        }
      </td>
    `
    )
    .join("")}
</tr>
<tr>
  ${weaknesses
    .map(
      (weak, index) => `
      <td style="width: 60px; padding: 5px; text-align: center; position: relative; left: 50px; top: -20px;">
        <div style="background-image: url('../image/weakbackground.webp'); background-size: cover; background-position: center; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center;">
          <img src="../image/${weak}.webp" loading="lazy" alt="${weak} 이미지" title="${weak}" style="width: 80%; height: 80%; object-fit: contain;">
        </div>
      </td>
      <td style="padding: 5px; text-align: left; position: relative; left: 50px; top: -20px;">
        <span style="font-size: 16px; font-weight: bold;">${weaknessesDesc[index] || ""}</span>
        ${
          weaknessesDesc[index] === "약점"
              ? '<span style="font-size: 14px; color: #3f3f3f; margin-left: 10px;">해당 속성의 공격으로 <span class="highlight">25% 증가된 데미지</span>를 입습니다.</span>'
              : weaknessesDesc[index] === "회피불가"
              ? '<span style="font-size: 14px; color: #3f3f3f; margin-left: 10px;">해당 속성의 공격은 <span class="highlight">회피가 불가</span>합니다.</span>'
              : weaknessesDesc[index] === "효과확률"
              ? '<span style="font-size: 14px; color: #3f3f3f; margin-left: 10px;">해당 속성의 공격에 효과가 있을 경우, <span class="highlight">효과에 걸릴 확률</span>이 증가합니다.</span>'
              : ""
        }
      </td>
    `
    )
    .join("")}
</tr>
`
;

        Promise.all([
          fetch("../data/csv/skill1.csv").then((res) => res.text()),
          fetch("../data/csv/skill2.csv").then((res) => res.text()),
          fetch("../data/csv/skill3.csv").then((res) => res.text()),
        ]).then(([skill1Data, skill2Data, skill3Data]) => {
          const skills = [skill1Data, skill2Data, skill3Data];
          const skillNames = ["1스킬", "2스킬", "3스킬"];

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

              const skillImgPath = `../image/digimon/${sanitizedCharacterName}/skill${
                index + 1
              }.webp`;
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

              const newRow = `
                <tr>
                  <!-- 스킬 아이콘과 텍스트를 2줄로 배치 -->
                  <td rowspan="2" style="width: 50px;">
                    <img src="${skillImgPath}" loading="lazy" alt="스킬 아이콘" style="width: 50px; border-radius: 50%; margin-top: 20px; margin-right: -25px; border: 0.1px solid grey; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4); position: relative;
                    left: 50px; top: -30px;">
                  </td>
                  <!-- 스킬 이름, 속성 부분 한 줄 -->
                  <td colspan="3" style="vertical-align: middle; position: relative; left: 50px; top: -30px;">
                    <div style="font-size: 16px; font-weight: bold; display: flex; align-items: center; margin-top: 12px; margin-left: 8px;">
                      <span>${skillColumns[12]}</span> <!-- 스킬 이름 -->
                      <img src="${skill1ImgPath}" loading="lazy" alt="속성" style="width: 22px; margin-left: 5px; background-image: url('../image/background.webp'); background-size: 120%; background-position: center; "> <!-- 속성 이미지 -->
                    </div>
                  </td>
                </tr>
                <tr>
                  <!-- 아래쪽에는 범위, 타겟 수, 타수 정보를 한 줄에 표시 -->
                  <td style="background-color: ${
                    skillColumns[14] === "원거리" ? "green" : "#D32F2F"
                  }; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; font-weight: bold; vertical-align: middle; margin-left: 8px; position: relative;
                    left: 50px; top: -30px;">
                    ${skillColumns[14]} <!-- 범위 -->
                  </td>
                  <td style="background-color: #D32F2F; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; font-weight: bold; vertical-align: middle; margin-left: 5px; position: relative;
                    left: 50px; top: -30px;">
                    ${skillColumns[16]} ${skillColumns[17]} <!-- 타겟 수 -->
                  </td>
                  <td style="background-color: green; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; font-weight: bold; vertical-align: middle; margin-left: 5px; position: relative;
                    left: 50px; top: -30px;">
                    ${
                      isNaN(skillColumns[13])
                        ? skillColumns[13]
                        : `${skillColumns[13]}타`
                    } <!-- 타수 -->
                  </td>
                  </td>
                    ${
                      skillColumns[18]
                        ? `<td style="background-color: #D32F2F; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; font-weight: bold; vertical-align: middle; margin-left: 5px; position: relative;
                    left: 50px; top: -30px;">
                    ${skillColumns[18]} <!-- 효과 -->
                  </td>`
                        : ""
                    }
                  ${
                    skillColumns[19]
                      ? `<td style="background-color: grey; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; font-weight: bold; vertical-align: middle; margin-left: 5px; position: relative;
                    left: 50px; top: -30px;">
                    추가 시전 턴 : ${skillColumns[19]}턴 <!-- 캐스팅 턴 -->
                  </td>`
                      : ""
                  }
                </tr>
                <tr>
                    <!-- 레벨별 데미지 표 -->
                    <td colspan="6">
                        <table class="level-table" style="width: 100%; border-collapse: collapse; solid #ccc; margin-top: 10px; position: relative; left: 50px; top: -30px;">
                            <tr>
                                <th style="border: 1px solid #ccc; font-size: 14px; vertical-align: middle; padding: 5px; background-color: rgb(229,229,229); width: 70px; height: 35px;">1레벨</th>
                                <th style="border: 1px solid #ccc; font-size: 14px; vertical-align: middle; padding: 5px; background-color: rgb(229,229,229); width: 70px; height: 35px;">2레벨</th>
                                <th style="border: 1px solid #ccc; font-size: 14px; vertical-align: middle; padding: 5px; background-color: rgb(229,229,229); width: 70px; height: 35px;">3레벨</th>
                                <th style="border: 1px solid #ccc; font-size: 14px; vertical-align: middle; padding: 5px; background-color: rgb(229,229,229); width: 70px; height: 35px;">4레벨</th>
                                <th style="border: 1px solid #ccc; font-size: 14px; vertical-align: middle; padding: 5px; background-color: rgb(229,229,229); width: 70px; height: 35px;">5레벨</th>
                                <th style="border: 1px solid #ccc; font-size: 14px; vertical-align: middle; padding: 5px; background-color: rgb(229,229,229); width: 70px; height: 35px;">6레벨</th>
                                <th style="border: 1px solid #ccc; font-size: 14px; vertical-align: middle; padding: 5px; background-color: rgb(229,229,229); width: 70px; height: 35px;">7레벨</th>
                                <th style="border: 1px solid #ccc; font-size: 14px; vertical-align: middle; padding: 5px; background-color: rgb(229,229,229); width: 70px; height: 35px;">8레벨</th>
                                <th style="border: 1px solid #ccc; font-size: 14px; vertical-align: middle; padding: 5px; background-color: rgb(229,229,229); width: 70px; height: 35px;">9레벨</th>
                                <th style="border: 1px solid #ccc; font-size: 14px; vertical-align: middle; padding: 5px; background-color: rgb(229,229,229); width: 70px; height: 35px;">10레벨</th>
                            </tr>
                            <tr>
                                ${levelData
                                  .map(
                                    (level) =>
                                      `<th style="border: 1px solid #ccc; font-size: 13px; vertical-align: middle; padding: 7px; width: 70px; height: 35px;">${level}</td>`
                                  )
                                  .join("")} <!-- 각 레벨별 데미지 출력 -->
                            </tr>
                        </table>
                    </td>
                </tr>
              `;
              skillDetailsTable.innerHTML += newRow;
            }
          });
        });
      } else {
        document.getElementById("character-name").textContent =
          "캐릭터 정보를 찾을 수 없습니다.";
      }
    });
});
