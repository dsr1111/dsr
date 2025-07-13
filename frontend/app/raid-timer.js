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
    baseDate: '2025-05-31',
    map: '???',
  },
  {
    name: '오파니몬:폴다운모드',
    image: getImagePath('오파니몬:폴다운모드'),
    times: ['23:00'],
    type: 'biweekly',
    baseDate: '2025-06-07',
    map: '???',
  },
  {
    name: '메기드라몬',
    image: getImagePath('메기드라몬'),
    times: ['22:00'],
    type: 'biweekly',
    baseDate: '2025-06-08',
    map: '???',
  },
  {
    name: '오메가몬',
    image: getImagePath('오메가몬'),
    times: ['22:00'],
    type: 'biweekly',
    baseDate: '2025-06-01',
    map: '어둠성 계곡',
  },
  {
    name: '위그드라실_7D6',
    image: getImagePath('위그드라실_7D6'),
    times: ['21:00'],
    type: 'weekly',
    days: [5, 6, 0], // 금(5), 토(6), 일(0)
    map: '무한 산',
  },
];

const masterTyrannoRaid = {
  name: '묘티스몬',
  image: getImagePath('묘티스몬'),
  baseTime: '19:00',
  baseDate: '2025-07-03',
  map: '어둠성 계곡',
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

function getNextBiweeklyTime(timeStr, baseDate) {
  const [hour, min] = timeStr.split(':').map(Number);
  const now = getCurrentKST();
  const base = new Date(baseDate + 'T00:00:00+09:00');
  
  // 기준 날짜부터 현재까지의 일수 차이 계산
  const diffDays = Math.floor((now - base) / (1000 * 60 * 60 * 24));
  
  // 2주(14일) 간격으로 다음 레이드 시간 계산
  const nextDate = new Date(base);
  nextDate.setDate(base.getDate() + Math.ceil(diffDays / 14) * 14);
  nextDate.setHours(hour, min, 0, 0);
  
  // 이미 지난 시간이면 다음 2주 후로 설정
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 14);
  }
  
  return nextDate;
}

function getNextWeeklyTime(timeStr, days) {
  const [hour, min] = timeStr.split(':').map(Number);
  const now = getCurrentKST();
  let next = new Date(now);
  next.setHours(hour, min, 0, 0);

  let addDays = 0;
  while (true) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + addDays);
    candidate.setHours(hour, min, 0, 0);
    const dayOfWeek = candidate.getDay();
    if (days.includes(dayOfWeek) && candidate > now) {
      next = candidate;
      break;
    }
    addDays++;
    if (addDays > 14) break; // 안전장치
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
  const baseDate = new Date(masterTyrannoRaid.baseDate + 'T00:00:00+09:00');
  const [baseHour, baseMin] = masterTyrannoRaid.baseTime.split(':').map(Number);
  const now = getCurrentKST();

  const baseMinutes = baseHour * 60 + baseMin;
  const diffMs = now - baseDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // 총 경과 시간 (기준 시간 + 25분 * 일수)
  let totalMinutes = baseMinutes + diffDays * 25;

  // 기준 날짜 복사
  const nextTime = new Date(baseDate);

  // 날짜 + 시간 계산
  const additionalDays = Math.floor(totalMinutes / 1440); // 하루 = 1440분
  const remainingMinutes = totalMinutes % 1440;
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  nextTime.setDate(nextTime.getDate() + additionalDays);
  nextTime.setHours(hours, minutes, 0, 0);

  // 이미 지난 경우 → 1일 더해서 다음 시간으로
  if (nextTime <= now) {
    totalMinutes += 25;

    const nextAdditionalDays = Math.floor(totalMinutes / 1440);
    const nextRemainingMinutes = totalMinutes % 1440;
    const nextHours = Math.floor(nextRemainingMinutes / 60);
    const nextMinutes = nextRemainingMinutes % 60;

    nextTime.setDate(baseDate.getDate() + nextAdditionalDays);
    nextTime.setHours(nextHours, nextMinutes, 0, 0);
  }

  return nextTime;
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
      let nextTime;
      if (raid.type === 'daily') {
        nextTime = getNextDailyTime(timeStr);
      } else if (raid.type === 'biweekly') {
        nextTime = getNextBiweeklyTime(timeStr, raid.baseDate);
      } else if (raid.type === 'weekly') {
        nextTime = getNextWeeklyTime(timeStr, raid.days);
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
let notificationTime = 5; // 기본값 5분

function updateTimers() {
  const items = document.querySelectorAll('.raid-timer-item');
  const now = getCurrentKST();
  let needsRerender = false;
  
  // 알림 시간 설정값 가져오기
  const notificationTimeSpan = document.getElementById('notification-time');
  if (notificationTimeSpan) {
    const time = parseInt(notificationTimeSpan.textContent);
    if (!isNaN(time) && time > 0 && time <= 60) {
      notificationTime = time;
    }
  }
  
  for (let i = 0; i < items.length; i++) {
    const remainSpan = items[i].querySelector('.remain');
    if (sortedRaids[i]) {
      const diff = Math.floor((sortedRaids[i].nextTime - now) / 1000);
      remainSpan.textContent = getTimeDiffString(sortedRaids[i].nextTime);
      
      // 남은 시간이 0이 되면 다음 시간으로 업데이트
      if (diff <= 0) {
        if (sortedRaids[i].name === masterTyrannoRaid.name) {
          sortedRaids[i].nextTime = getMasterTyrannoNextTime();
        } else {
          const raid = raids.find(r => r.name === sortedRaids[i].name);
          if (raid) {
            if (raid.type === 'daily') {
              sortedRaids[i].nextTime = getNextDailyTime(sortedRaids[i].timeStr);
            } else if (raid.type === 'biweekly') {
              sortedRaids[i].nextTime = getNextBiweeklyTime(sortedRaids[i].timeStr, raid.baseDate);
            } else if (raid.type === 'weekly') {
              sortedRaids[i].nextTime = getNextWeeklyTime(sortedRaids[i].timeStr, raid.days);
            }
          }
        }
        needsRerender = true;
      }
      
      // 알림 시간을 초 단위로 변환하여 비교
      if (diff > 0 && diff <= notificationTime * 60) {
        const notifyKey = sortedRaids[i].name + sortedRaids[i].timeStr;
        if (!notified[notifyKey]) {
          const alarmToggle = document.getElementById('raid-alarm-toggle');
          if (alarmToggle && alarmToggle.checked) {
            alarmAudio.currentTime = 0;
            alarmAudio.play();
            
            setTimeout(() => {
              alert(`${sortedRaids[i].name} 레이드가 ${formatTimeToKR(getTimeDiffString(sortedRaids[i].nextTime))} 남았습니다!`);
            }, 500);
          }
          notified[notifyKey] = true;
        }
      }
      if (diff > 0 && diff < notificationTime * 60) {
        remainSpan.style.color = '#e74c3c'; // 빨간색
      } else {
        remainSpan.style.color = '';
      }
    }
  }
  
  // 시간이 업데이트된 경우 전체 목록을 다시 렌더링
  if (needsRerender) {
    renderRaids();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const alarmToggle = document.getElementById('raid-alarm-toggle');
  const notificationTimeSpan = document.getElementById('notification-time');
  
  // 알림 시간 입력 제한
  notificationTimeSpan.addEventListener('input', function() {
    // 빈 문자열이면 그대로 두기
    if (this.textContent === '') return;
    
    let value = parseInt(this.textContent);
    if (isNaN(value)) {
      this.textContent = '';
    } else if (value > 60) {
      this.textContent = '60';
    }
  });
  
  // 알림 시간 입력 완료 시 유효성 검사
  notificationTimeSpan.addEventListener('blur', function() {
    let value = parseInt(this.textContent);
    if (isNaN(value) || value < 1) {
      this.textContent = '5';
      notificationTime = 5;
    } else if (value > 60) {
      this.textContent = '60';
      notificationTime = 60;
    } else {
      notificationTime = value;
    }
    // 알림 시간이 변경되면 notified 객체 초기화
    notified = {};
  });
  
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