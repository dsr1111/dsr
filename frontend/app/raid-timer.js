function getImagePath(name) {
  // :를 _로 대체
  const safeName = name.replace(/:/g, '_');
  return `/image/digimon/${safeName}/${safeName}.webp`;
}

// 레이드 정보 배열
const raids = [
  {
    name: '펌프몬',
    image: getImagePath('펌프몬'),
    times: ['19:30', '21:30'],
    type: 'daily',
    map: '시부야',
  },
  {
    name: '울퉁몬',
    image: getImagePath('울퉁몬'),
    times: ['23:00', '01:00'],
    type: 'daily',
    map: '시부야',
  },
  {
    name: '블랙세라피몬',
    image: getImagePath('블랙세라피몬'),
    times: ['23:00'],
    type: 'biweekly',
    weekType: 'even', // 이번주(짝수주)
    day: 6, // 토요일
    map: '???',
  },
  {
    name: '오파니몬:폴다운모드',
    image: getImagePath('오파니몬:폴다운모드'),
    times: ['23:00'],
    type: 'biweekly',
    weekType: 'odd', // 다음주(홀수주)
    day: 6, // 토요일
    map: '???',
  },
  {
    name: '메기드라몬',
    image: getImagePath('메기드라몬'),
    times: ['22:00'],
    type: 'biweekly',
    weekType: 'odd', // 다음주(홀수주)
    day: 0, // 일요일
    map: '???',
  },
  {
    name: '오메가몬',
    image: getImagePath('오메가몬'),
    times: ['22:00'],
    type: 'biweekly',
    weekType: 'even', // 이번주(짝수주)
    day: 0, // 일요일
    map: '어둠성 계곡',
  },
];

const masterTyrannoRaid = {
  name: '마스터티라노몬',
  image: getImagePath('마스터티라노몬'),
  baseTime: '21:30',
  baseDate: '2025-05-28',
  map: '용의 눈 호수',
};

function getCurrentKST() {
  // 'Asia/Seoul' 시간대를 명시적으로 지정하고 10초 보정
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  return new Date(now.getTime()); // 10초 보정
}

function getNextDailyTime(timeStr) {
  const [hour, min] = timeStr.split(':').map(Number);
  const now = getCurrentKST();
  let next = new Date(now);
  next.setHours(hour, min, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function getNextBiweeklyTime(day, timeStr, weekType) {
  const [hour, min] = timeStr.split(':').map(Number);
  const now = getCurrentKST();
  let next = new Date(now);
  // 이번주가 짝수주인지 홀수주인지 계산
  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  let isEvenWeek = week % 2 === 0;
  let targetWeek = (weekType === 'even') ? isEvenWeek : !isEvenWeek;
  // 이번주에 해당하면 이번주, 아니면 다음주
  next.setDate(next.getDate() + ((7 + day - next.getDay()) % 7));
  next.setHours(hour, min, 0, 0);
  if (!targetWeek || next <= now) {
    // 다음주로 넘김
    next.setDate(next.getDate() + 7);
    // 홀짝주 반전
    if (weekType === 'even') {
      if ((week + 1) % 2 !== 0) next.setDate(next.getDate() + 7);
    } else {
      if ((week + 1) % 2 === 0) next.setDate(next.getDate() + 7);
    }
  }
  return next;
}

function getTimeDiffString(target) {
  const now = getCurrentKST();
  let diff = Math.floor((target - now) / 1000);
  if (diff < 0) return '-00:00:00';
  const h = Math.floor(diff / 3600).toString().padStart(2, '0');
  const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
  const s = (diff % 60).toString().padStart(2, '0');
  return `-${h}:${m}:${s}`;
}

function formatTimeToKR(str) {
  // "-HH:MM:SS" 형식에서 MM, SS만 추출
  const match = str.match(/-(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return str;
  const [, h, m, s] = match;
  let result = '';
  if (h !== '00') result += `${parseInt(h)}시간 `;
  if (m !== '00') result += `${parseInt(m)}분 `;
  result += `${parseInt(s)}초`;
  return result.trim();
}

function getMasterTyrannoNextTime() {
  // baseDate를 KST로 맞춰서 생성
  const baseDate = new Date(masterTyrannoRaid.baseDate + 'T00:00:00+09:00');
  const [baseHour, baseMin] = masterTyrannoRaid.baseTime.split(':').map(Number);
  const now = getCurrentKST();
  
  // 기준 날짜부터 현재까지의 일수 차이 계산
  const diffDays = Math.floor((now - baseDate) / (1000 * 60 * 60 * 24));
  
  // 25분씩 증가하는 시간 계산
  const totalMinutes = (baseHour * 60 + baseMin) + (diffDays * 25);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  
  // 다음 레이드 시간 설정
  const nextTime = new Date(now);
  nextTime.setHours(hours, minutes, 0, 0);
  
  // 이미 지난 시간이면 다음날로 설정
  if (nextTime <= now) {
    // 다음날의 시간 계산
    const nextDayMinutes = totalMinutes + 25;
    const nextDayHours = Math.floor(nextDayMinutes / 60) % 24;
    const nextDayMinutesRemainder = nextDayMinutes % 60;
    
    nextTime.setDate(nextTime.getDate() + 1);
    nextTime.setHours(nextDayHours, nextDayMinutesRemainder, 0, 0);
  }
  
  console.log('마스터티라노몬 시간 계산:', {
    baseDate: baseDate.toISOString(),
    baseTime: `${baseHour}:${baseMin}`,
    now: now.toISOString(),
    diffDays,
    totalMinutes,
    nextTime: nextTime.toISOString()
  });
  
  return nextTime;
}

let sortedRaids = [];

function renderRaids() {
  const container = document.getElementById('raid-timers');
  container.innerHTML = '';
  container.style.maxHeight = '200px';
  container.style.overflowY = 'auto';
  // 모든 레이드(시간별)와 마스터티라노몬을 하나의 배열로 만들어서 정렬
  let allRaids = [];
  raids.forEach(raid => {
    raid.times.forEach(timeStr => {
      let nextTime;
      if (raid.type === 'daily') {
        nextTime = getNextDailyTime(timeStr);
      } else if (raid.type === 'biweekly') {
        nextTime = getNextBiweeklyTime(raid.day, timeStr, raid.weekType);
      }
      allRaids.push({
        name: raid.name,
        image: raid.image,
        timeStr,
        map: raid.map,
        nextTime,
      });
    });
  });
  // 마스터티라노몬(변동)
  const tyrannoTime = getMasterTyrannoNextTime();
  allRaids.push({
    name: masterTyrannoRaid.name,
    image: masterTyrannoRaid.image,
    timeStr: tyrannoTime.getHours().toString().padStart(2,'0') + ':' + tyrannoTime.getMinutes().toString().padStart(2,'0'),
    map: masterTyrannoRaid.map,
    nextTime: tyrannoTime,
  });
  // 남은 시간이 적은 순서로 정렬
  allRaids.sort((a, b) => a.nextTime - b.nextTime);
  // 정렬된 배열을 전역 변수에 저장
  sortedRaids = allRaids;
  // 렌더링
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
  const now = getCurrentKST();
  
  for (let i = 0; i < items.length; i++) {
    const remainSpan = items[i].querySelector('.remain');
    if (sortedRaids[i]) {
      const diff = Math.floor((sortedRaids[i].nextTime - now) / 1000);
      remainSpan.textContent = getTimeDiffString(sortedRaids[i].nextTime);
      if (diff > 0 && diff <= 300) {
        const notifyKey = sortedRaids[i].name + sortedRaids[i].timeStr;
        if (!notified[notifyKey]) {
          const alarmToggle = document.getElementById('raid-alarm-toggle');
          if (alarmToggle && alarmToggle.checked) {
            alarmAudio.currentTime = 0;
            alarmAudio.play();
            
            setTimeout(() => {
              alert(`${sortedRaids[i].name} 레이드가 ${formatTimeToKR(getTimeDiffString(sortedRaids[i].nextTime))} 남았습니다!`);
            }, 1500);
          }
          notified[notifyKey] = true;
        }
      }
      if (diff > 0 && diff < 300) {
        remainSpan.style.color = '#e74c3c'; // 빨간색
      } else {
        remainSpan.style.color = '';
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const alarmToggle = document.getElementById('raid-alarm-toggle');
  
  alarmToggle.addEventListener('change', async function() {
    if (this.checked) {
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          this.checked = false;
          alert("알림 권한이 필요합니다.");
        }
      } else if (Notification.permission === "denied") {
        this.checked = false;
        alert("알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.");
      }
    }
  });
  
  renderRaids();
  setInterval(updateTimers, 1000);
}); 