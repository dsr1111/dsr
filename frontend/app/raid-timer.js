function getImagePath(name) {
  // :를 _로 대체
  const safeName = name.replace(/:/g, '_');
  return `https://media.dsrwiki.com/dsrwiki/digimon/${safeName}/${safeName}.webp`;
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
];

const RotationRaid = {
  name: '맘몬',
  image: getImagePath('맘몬'),
  baseTime: '19:00',
  baseDate: '2025-10-09',
  map: '빛의 언덕',
};

// TimezoneDB API를 사용하여 서울 시간 동기화
const apiKey = '7YDXWZM4S9QK';
let serverKST = null; // TimezoneDB에서 가져온 서울 시간
let lastFetchTime = null; // serverKST를 가져온 로컬 시간

async function initializeTime() {
  try {
    const response = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=${apiKey}&format=json&by=zone&zone=Asia/Seoul`);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.status === 'OK') {
      // 모바일 호환성을 위해 더 안전한 Date 객체 생성 방식 사용
      try {
        // ISO 형식으로 변환하여 Date 객체 생성
        const isoString = data.formatted.replace(' ', 'T') + '+09:00';
        serverKST = new Date(isoString);
        
        // Date 객체가 유효한지 확인
        if (isNaN(serverKST.getTime())) {
          throw new Error('Invalid date created from API response');
        }
        
        lastFetchTime = Date.now();
        console.log('서버 시간 설정 성공:', serverKST);
      } catch (dateError) {
        console.error('Date 객체 생성 실패:', dateError);
        throw new Error('Failed to create valid date from API response');
      }
    } else {
      throw new Error(`TimezoneDB API Error: ${data.message}`);
    }
  } catch (error) {
    console.error('Failed to initialize time from TimezoneDB:', error);
    alert('정확한 시간 정보를 가져오는데 실패했습니다. 브라우저의 기본 시간을 사용합니다.');
    // API 실패 시, 로컬 시간을 사용하도록 대체
    serverKST = new Date();
    lastFetchTime = Date.now();
  }
}

function getCurrentKST() {
  if (!serverKST || !lastFetchTime) {
    // 아직 시간이 초기화되지 않았거나 API 호출에 실패한 경우 로컬 시간 반환
    return new Date();
  }
  // serverKST가 유효한 Date 객체인지 확인
  if (isNaN(serverKST.getTime())) {
    console.error('serverKST is invalid, using local time');
    return new Date();
  }
  const elapsed = Date.now() - lastFetchTime;
  return new Date(serverKST.getTime() + elapsed);
}

function getNextDailyTime(timeStr) {
    const now = getCurrentKST();
    // KST는 UTC+9. toISOString()은 항상 UTC 기준이므로 9시간을 더해 KST 날짜를 구함
    const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const kstDateString = kstDate.toISOString().slice(0, 10); // YYYY-MM-DD

    let next = new Date(`${kstDateString}T${timeStr}:00+09:00`);

    if (next <= now) {
        // 다음 날로 설정 (24시간을 더함)
        next = new Date(next.getTime() + 24 * 60 * 60 * 1000);
    }
    return next;
}

function getNextBiweeklyTime(timeStr, baseDateStr) {
    const [hour, min] = timeStr.split(':').map(Number);
    const now = getCurrentKST();
    const base = new Date(baseDateStr + 'T00:00:00+09:00');

    // now와 base의 시간을 00:00:00 (KST)로 맞춰서 날짜 차이만 계산
    const nowAtMidnightKST = new Date(new Date(now).setUTCHours(15, 0, 0, 0)); // KST 자정은 UTC 15시
    const baseAtMidnightKST = new Date(new Date(base).setUTCHours(15, 0, 0, 0));
    
    const diffDays = Math.floor((nowAtMidnightKST - baseAtMidnightKST) / (1000 * 60 * 60 * 24));
    
    const cycles = Math.floor(diffDays / 14);
    let nextDate = new Date(base.getTime() + cycles * 14 * 24 * 60 * 60 * 1000);
    
    // 다음 레이드 시간을 KST로 설정
    const kstDate = new Date(nextDate.getTime() + (9 * 60 * 60 * 1000));
    const kstDateString = kstDate.toISOString().slice(0, 10);
    let nextRaidTime = new Date(`${kstDateString}T${timeStr}:00+09:00`);

    if (nextRaidTime <= now) {
        nextRaidTime = new Date(nextRaidTime.getTime() + 14 * 24 * 60 * 60 * 1000);
    }

    return nextRaidTime;
}

function getNextWeeklyTime(timeStr, days) {
    const [hour, min] = timeStr.split(':').map(Number);
    const now = getCurrentKST();
    
    for (let i = 0; i < 14; i++) { // 최대 2주까지만 탐색
        const futureDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        
        // KST 날짜 문자열 생성
        const kstDate = new Date(futureDate.getTime() + (9 * 60 * 60 * 1000));
        const kstDateString = kstDate.toISOString().slice(0, 10);
        
        const nextRaidTime = new Date(`${kstDateString}T${timeStr}:00+09:00`);
        
        // getDay()는 현지 시간 기준이므로, KST 기준 요일을 구해야 함
        const kstDay = new Date(nextRaidTime.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })).getDay();

        if (days.includes(kstDay) && nextRaidTime > now) {
            return nextRaidTime;
        }
    }
    // 만약 지난 2주간 해당 요일이 없다면, 기본 로직으로 다음 시간을 반환 (오류 방지)
    const fallbackDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const kstDate = new Date(fallbackDate.getTime() + (9 * 60 * 60 * 1000));
    const kstDateString = kstDate.toISOString().slice(0, 10);
    return new Date(`${kstDateString}T${timeStr}:00+09:00`);
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
    const now = getCurrentKST();
    const baseDate = new Date(RotationRaid.baseDate + 'T00:00:00+09:00');
    const [baseHour, baseMin] = RotationRaid.baseTime.split(':').map(Number);

    const nowInKST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const baseInKST = new Date(baseDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

    nowInKST.setHours(0, 0, 0, 0);
    baseInKST.setHours(0, 0, 0, 0);

    let diffDays = Math.floor((nowInKST - baseInKST) / (1000 * 60 * 60 * 24));

    // Get the date for the raid
    let raidDate = new Date(baseDate.getTime());
    raidDate.setDate(raidDate.getDate() + diffDays);

    // Get the time for the raid
    raidDate.setHours(baseHour, baseMin);
    raidDate.setMinutes(raidDate.getMinutes() + diffDays * 25);

    let nextTime = raidDate;

    if (nextTime <= now) {
        diffDays++;
        raidDate = new Date(baseDate.getTime());
        raidDate.setDate(raidDate.getDate() + diffDays);
        raidDate.setHours(baseHour, baseMin);
        raidDate.setMinutes(raidDate.getMinutes() + diffDays * 25);
        nextTime = raidDate;
    }

    return nextTime;
}

let sortedRaids = [];

function renderRaids() {
  const container = document.getElementById('raid-timers');
  container.innerHTML = '';
  container.style.maxHeight = '170px';
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
    name: RotationRaid.name,
    image: RotationRaid.image,
    timeStr: tyrannoTime.getHours().toString().padStart(2,'0') + ':' + tyrannoTime.getMinutes().toString().padStart(2,'0'),
    map: RotationRaid.map,
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
    div.style.marginBottom = '4px';
    div.style.fontSize = '0.8rem';
    div.innerHTML = `
      <div style="background:#0B0E1A; border-radius:3px; width:46px; height:46px; display:flex; align-items:center; justify-content:center; margin-right:10px;">
        <img src="${raid.image}" alt="${raid.name}" width="46" height="46" style="object-fit:contain; display:block;">
      </div>
      <div style="display:flex; flex-direction:column; text-align:left;">
        <span><strong>${raid.name}</strong></span>
        <span style="font-size:0.7rem; color:#666;">${raid.timeStr}, ${raid.map}</span>
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
// 경계 기반 트리거 및 스누즈 관리를 위한 상태
let previousDiffSeconds = {}; // 키: name+timeStr -> 직전 남은 초
let cooldownUntil = {}; // 키: name+timeStr -> 스누즈 종료 타임스탬프(ms)

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
        const notifyKey = sortedRaids[i].name + sortedRaids[i].timeStr;
        if (sortedRaids[i].name === RotationRaid.name) {
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
        // 다음 회차로 넘어갔으므로 재알림을 위해 상태 재무장
        delete notified[notifyKey];
        delete previousDiffSeconds[notifyKey];
        delete cooldownUntil[notifyKey];
        needsRerender = true;
      }
      
      // 경계 기반 1회 트리거 + 스누즈(쿨다운)
      const notifyKey = sortedRaids[i].name + sortedRaids[i].timeStr;
      const nowTs = Date.now();
      const prev = previousDiffSeconds[notifyKey];

      // 경계 진입: 직전에는 > 임계값, 현재는 ≤ 임계값인 순간에만 1회 트리거
      const thresholdSec = notificationTime * 60;
      const enteredThreshold = (typeof prev === 'number' ? prev > thresholdSec : true) && diff > 0 && diff <= thresholdSec;

      // 스누즈 중이면 무시
      const underCooldown = cooldownUntil[notifyKey] && cooldownUntil[notifyKey] > nowTs;

      if (enteredThreshold && !underCooldown) {
        if (!notified[notifyKey]) {
          const alarmToggle = document.getElementById('raid-alarm-toggle');
          if (alarmToggle && alarmToggle.checked) {
            const volumeSlider = document.getElementById('alarm-volume');
            const durationInput = document.getElementById('alarm-duration');
            
            alarmAudio.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.5;
            const alarmDuration = durationInput ? parseInt(durationInput.value, 10) * 1000 : 3000;

            alarmAudio.currentTime = 0;
            alarmAudio.play();
            
            setTimeout(() => {
              alarmAudio.pause();
              alarmAudio.currentTime = 0;
            }, alarmDuration);

            // Custom alert logic
            const customAlert = document.getElementById('custom-raid-alert');
            const customAlertMessage = document.getElementById('custom-alert-message');
            if (customAlert && customAlertMessage) {
              customAlertMessage.textContent = `${sortedRaids[i].name} 레이드가 ${formatTimeToKR(getTimeDiffString(sortedRaids[i].nextTime))} 남았습니다!`;
              customAlert.style.display = 'flex';

              // Attach snooze logic to the close button
              const closeButton = document.getElementById('custom-alert-close');
              const closeButtonClickHandler = () => {
                customAlert.style.display = 'none';
                cooldownUntil[notifyKey] = Date.now() + 60 * 1000; // 60초 스누즈
                closeButton.removeEventListener('click', closeButtonClickHandler); // 이벤트 리스너 정리
              };
              closeButton.addEventListener('click', closeButtonClickHandler);
            }
          }
          notified[notifyKey] = true;
        }
      }

      // 직전 diff 업데이트
      previousDiffSeconds[notifyKey] = diff;
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

document.addEventListener('DOMContentLoaded', async () => {
  // 페이지 로드 시 먼저 시간 동기화를 수행
  await initializeTime();

  const alarmToggle = document.getElementById('raid-alarm-toggle');
  const notificationTimeSpan = document.getElementById('notification-time');
  const volumeSlider = document.getElementById('alarm-volume');
  const durationInput = document.getElementById('alarm-duration');
  const durationValueSpan = document.getElementById('alarm-duration-value');
  const settingsToggle = document.getElementById('raid-settings-toggle');
  const settingsPanel = document.getElementById('raid-settings-panel');
  const settingsClose = document.getElementById('raid-settings-close');

  // 설정 패널 토글
  if (settingsToggle && settingsPanel) {
    settingsToggle.addEventListener('click', () => {
      const isVisible = settingsPanel.style.display === 'block';
      settingsPanel.style.display = isVisible ? 'none' : 'block';
    });
  }

  // 설정 패널 닫기
  if (settingsClose && settingsPanel) {
    settingsClose.addEventListener('click', () => {
      settingsPanel.style.display = 'none';
    });
  }

  // 초기 볼륨 설정
  if (volumeSlider) {
    alarmAudio.volume = parseFloat(volumeSlider.value);
    volumeSlider.addEventListener('input', function() {
      alarmAudio.volume = parseFloat(this.value);
    });
  }

  // 재생 시간 슬라이더 이벤트 리스너
  if (durationInput && durationValueSpan) {
    durationInput.addEventListener('input', function() {
      durationValueSpan.textContent = `${this.value}초`;
    });
  }
  
  
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

