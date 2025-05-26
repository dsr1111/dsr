// 이미지 경로
function getImagePath(name) {
  const safeName = name.replace(/:/g, '_');
  return `/image/digimon/${safeName}/${safeName}.webp`;
}

// 서버 시간 보정값
let serverOffset = 0;

// 서버 기준 현재 시간 반환
function getServerNow() {
  return new Date(Date.now() + serverOffset);
}

// 서버 시간 동기화
async function syncServerTime() {
  try {
    const res = await fetch("https://timeapi.io/api/Time/current/zone?timeZone=Asia/Seoul");
    const data = await res.json();
    const serverNow = new Date(data.dateTime);
    const clientNow = new Date();
    serverOffset = serverNow - clientNow;
    console.log("[INFO] 서버 시간 동기화 완료 (timeapi.io)");
  } catch {
    console.warn("[WARN] timeapi.io 실패, 네이버 헤더로 대체");
    try {
      const res = await fetch("https://www.naver.com", { method: "HEAD" });
      const serverUtc = new Date(res.headers.get("date"));
      const kst = new Date(serverUtc.getTime() + 9 * 60 * 60 * 1000);
      serverOffset = kst - new Date();
      console.log("[INFO] 서버 시간 동기화 완료 (naver.com)");
    } catch {
      console.error("[ERROR] 서버 시간 동기화 실패");
    }
  }
}

// 레이드 데이터
const raids = [
  { name: '펌프몬', image: getImagePath('펌프몬'), times: ['19:30', '21:30'], type: 'daily', map: '시부야' },
  { name: '울퉁몬', image: getImagePath('울퉁몬'), times: ['23:00', '01:00'], type: 'daily', map: '시부야' },
  { name: '블랙세라피몬', image: getImagePath('블랙세라피몬'), times: ['23:00'], type: 'biweekly', weekType: 'even', day: 6, map: '???' },
  { name: '오파니몬:폴다운모드', image: getImagePath('오파니몬:폴다운모드'), times: ['23:00'], type: 'biweekly', weekType: 'odd', day: 6, map: '???' },
  { name: '메기드라몬', image: getImagePath('메기드라몬'), times: ['22:00'], type: 'biweekly', weekType: 'odd', day: 0, map: '???' },
  { name: '오메가몬', image: getImagePath('오메가몬'), times: ['22:00'], type: 'biweekly', weekType: 'even', day: 0, map: '어둠성 계곡' },
];

const masterTyrannoRaid = {
  name: '마스터티라노몬',
  image: getImagePath('마스터티라노몬'),
  nextRaid: '2025-05-27T21:05:00',
  map: '용의 눈 호수',
};

function getNextDailyTime(timeStr) {
  const [hour, min] = timeStr.split(':').map(Number);
  const now = getServerNow();
  let next = new Date(now);
  next.setHours(hour, min, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

function getNextBiweeklyTime(day, timeStr, weekType) {
  const [hour, min] = timeStr.split(':').map(Number);
  const now = getServerNow();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  const isEvenWeek = week % 2 === 0;
  const thisWeekValid = (weekType === 'even') ? isEvenWeek : !isEvenWeek;

  let next = new Date(now);
  next.setDate(next.getDate() + ((7 + day - next.getDay()) % 7));
  next.setHours(hour, min, 0, 0);

  if (!thisWeekValid || next <= now) {
    next.setDate(next.getDate() + 7);
    const nextWeek = week + 1;
    const isNextWeekValid = (weekType === 'even') ? nextWeek % 2 === 0 : nextWeek % 2 !== 0;
    if (!isNextWeekValid) next.setDate(next.getDate() + 7);
  }

  return next;
}

function getTimeDiffString(target) {
  const now = getServerNow();
  let diff = Math.floor((target - now) / 1000);
  if (diff < 0) return '-00:00:00';
  const h = Math.floor(diff / 3600).toString().padStart(2, '0');
  const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
  const s = (diff % 60).toString().padStart(2, '0');
  return `-${h}:${m}:${s}`;
}

function formatTimeToKR(str) {
  const match = str.match(/-(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return str;
  const [, h, m, s] = match;
  let result = '';
  if (h !== '00') result += `${parseInt(h)}시간 `;
  if (m !== '00') result += `${parseInt(m)}분 `;
  result += `${parseInt(s)}초`;
  return result.trim();
}

let sortedRaids = [];

function renderRaids() {
  const container = document.getElementById('raid-timers');
  container.innerHTML = '';
  container.style.maxHeight = '200px';
  container.style.overflowY = 'auto';
  let allRaids = [];

  raids.forEach(raid => {
    raid.times.forEach(timeStr => {
      const nextTime = raid.type === 'daily'
        ? getNextDailyTime(timeStr)
        : getNextBiweeklyTime(raid.day, timeStr, raid.weekType);
      allRaids.push({ name: raid.name, image: raid.image, timeStr, map: raid.map, nextTime });
    });
  });

  const tyrannoTime = new Date(masterTyrannoRaid.nextRaid);
  allRaids.push({
    name: masterTyrannoRaid.name,
    image: masterTyrannoRaid.image,
    timeStr: tyrannoTime.getHours().toString().padStart(2,'0') + ':' + tyrannoTime.getMinutes().toString().padStart(2,'0'),
    map: masterTyrannoRaid.map,
    nextTime: tyrannoTime,
  });

  allRaids.sort((a, b) => a.nextTime - b.nextTime);
  sortedRaids = allRaids;

  allRaids.forEach(raid => {
    const div = document.createElement('div');
    div.className = 'raid-timer-item';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.marginBottom = '8px';
    div.style.fontSize = '0.85em';
    div.innerHTML = `
      <div style="background:#0B0E1A; border-radius:3px; width:46px; height:46px; display:flex; align-items:center; justify-content:center; margin-right:10px;">
        <img src="${raid.image}" alt="${raid.name}" width="46" height="46" style="object-fit:contain; display:block;">
      </div>
      <div style="display:flex; flex-direction:column; text-align:left;">
        <span><strong>${raid.name}</strong></span>
        <span style="font-size:0.8em; color:#666;">${raid.timeStr}, ${raid.map}</span>
        <span class="remain">${getTimeDiffString(raid.nextTime)}</span>
      </div>
    `;
    div.dataset.nextTime = raid.nextTime;
    container.appendChild(div);
  });
}

const alarmAudio = new Audio('assets/sound/alarm.mp3');
let notified = {};

function updateTimers() {
  const items = document.querySelectorAll('.raid-timer-item');
  for (let i = 0; i < items.length; i++) {
    const remainSpan = items[i].querySelector('.remain');
    if (sortedRaids[i]) {
      const now = getServerNow();
      const diff = Math.floor((sortedRaids[i].nextTime - now) / 1000);
      remainSpan.textContent = getTimeDiffString(sortedRaids[i].nextTime);
      if (diff > 0 && diff <= 300) {
        const notifyKey = sortedRaids[i].name + sortedRaids[i].timeStr;
        if (!notified[notifyKey]) {
          const alarmToggle = document.getElementById('raid-alarm-toggle');
          if (alarmToggle && alarmToggle.checked) {
            alarmAudio.currentTime = 0;
            alarmAudio.play();
            alert(`${sortedRaids[i].name} 레이드가 ${formatTimeToKR(getTimeDiffString(sortedRaids[i].nextTime))} 남았습니다!`);
          }
          notified[notifyKey] = true;
        }
      }
      remainSpan.style.color = diff > 0 && diff < 600 ? '#e74c3c' : '';
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await syncServerTime();
  renderRaids();
  setInterval(updateTimers, 1000);
});
