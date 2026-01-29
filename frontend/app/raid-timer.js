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
    times: ['19:30'],
    type: 'daily',
    map: '시부야',
  },
  {
    name: '울퉁몬',
    image: getImagePath('울퉁몬'),
    times: ['21:30'],
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
    name: '주작몬',
    image: getImagePath('주작몬'),
    times: ['22:00'],
    type: 'weekly',
    days: [2], // 화요일
    map: '기어 사바나',
  },
  {
    name: '현무몬',
    image: getImagePath('현무몬'),
    times: ['22:00'],
    type: 'weekly',
    days: [3], // 수요일
    map: '용의 눈 호수',
  },
  {
    name: '청룡몬',
    image: getImagePath('청룡몬'),
    times: ['22:00'],
    type: 'weekly',
    days: [4], // 목요일
    map: '어둠성 계곡',
  },
  {
    name: '백호몬',
    image: getImagePath('백호몬'),
    times: ['22:00'],
    type: 'weekly',
    days: [5], // 금요일
    map: '사막 지대',
  },
];

const RotationRaid = {
  name: '록몬',
  image: getImagePath('록몬'),
  baseTime: '19:00',
  baseDate: '2026-01-29',
  map: '기어 사바나',
};

// Cloudflare Workers를 사용하여 서울 시간 동기화 (시스템 시간 무관)
const CUSTOM_TIME_API = 'https://dsr-time-api.s97716.workers.dev';

let serverKST = null; // 서울 시간 기준 Date 객체
let lastFetchTime = null; // serverKST를 가져온 로컬 시간

async function initializeTime() {
  // 여러 서버 시간 API를 시도 (시스템 시간과 무관)
  const timeAPIs = [];

  // 자체 백엔드 API가 설정되어 있으면 우선 사용
  if (CUSTOM_TIME_API) {
    timeAPIs.push(CUSTOM_TIME_API);
  } else {
    // 자동으로 여러 API 시도
    timeAPIs.push(
      '/api/time',
      '/api/kst-time',
      'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Seoul'
    );
  }

  for (const apiUrl of timeAPIs) {
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        continue; // 다음 API 시도
      }

      const data = await response.json();
      let serverTime = null;

      // 다양한 응답 형식 처리
      if (data.datetime) {
        // WorldTimeAPI 형식: { datetime: "2025-01-01T12:00:00+09:00" }
        serverTime = new Date(data.datetime);
      } else if (data.dateTime) {
        // timeapi.io 형식: { dateTime: "2025-01-01T12:00:00" }
        serverTime = new Date(data.dateTime);
      } else if (data.time) {
        // 커스텀 API 형식: { time: "2025-01-01T12:00:00+09:00" }
        serverTime = new Date(data.time);
      } else if (data.kst_time) {
        // KST 시간 직접: { kst_time: "2025-01-01T12:00:00+09:00" }
        serverTime = new Date(data.kst_time);
      } else if (data.timestamp) {
        // 타임스탬프 형식: { timestamp: 1704067200000 }
        serverTime = new Date(data.timestamp);
      } else if (data.utcTime) {
        // UTC 시간: { utcTime: "2025-01-01T03:00:00Z" }
        serverTime = new Date(data.utcTime);
      } else if (typeof data === 'string') {
        // 문자열 직접 파싱: "2025-01-01T12:00:00+09:00"
        serverTime = new Date(data);
      } else if (data.epochSecond) {
        // Unix 타임스탬프 (초 단위): { epochSecond: 1704067200 }
        serverTime = new Date(data.epochSecond * 1000);
      }

      if (serverTime && !isNaN(serverTime.getTime())) {
        serverKST = serverTime;
        lastFetchTime = Date.now();
        console.log(`서버 시간 설정 성공 (${apiUrl}):`, serverKST);
        return; // 성공하면 종료
      }
    } catch (error) {
      // 다음 API 시도
      continue;
    }
  }

  // 모든 서버 API 실패 시, Intl API 사용 (시스템 시간 기반이지만 최선의 대안)
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(now);

    const kstParts = {};
    parts.forEach(part => {
      kstParts[part.type] = part.value;
    });

    const kstString = `${kstParts.year}-${kstParts.month}-${kstParts.day}T${kstParts.hour}:${kstParts.minute}:${kstParts.second}+09:00`;
    serverKST = new Date(kstString);

    if (!isNaN(serverKST.getTime())) {
      lastFetchTime = Date.now();
      console.warn('서버 API 실패, Intl API 사용 (시스템 시간 의존):', serverKST);
      return;
    }
  } catch (error) {
    console.error('Intl API도 실패:', error);
  }

  // 최종 폴백: 시스템 시간 사용 (경고)
  serverKST = new Date();
  lastFetchTime = Date.now();
  console.error('모든 시간 동기화 방법 실패, 시스템 시간 사용 (부정확할 수 있음)');
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

// KST 유틸리티 함수들: Date 객체의 타임스탬프를 KST 기준으로 변환
// Date 객체는 내부적으로 UTC 타임스탬프를 저장하므로, KST 오프셋(+9시간)을 더한 후 UTC 메서드 사용
function getKSTYear(date) {
  const ts = date.getTime();
  const kstTs = ts + (9 * 60 * 60 * 1000);
  return new Date(kstTs).getUTCFullYear();
}

function getKSTMonth(date) {
  const ts = date.getTime();
  const kstTs = ts + (9 * 60 * 60 * 1000);
  return new Date(kstTs).getUTCMonth() + 1; // 0-based to 1-based
}

function getKSTDate(date) {
  const ts = date.getTime();
  const kstTs = ts + (9 * 60 * 60 * 1000);
  return new Date(kstTs).getUTCDate();
}

function getKSTHours(date) {
  const ts = date.getTime();
  const kstTs = ts + (9 * 60 * 60 * 1000);
  return new Date(kstTs).getUTCHours();
}

function getKSTMinutes(date) {
  const ts = date.getTime();
  const kstTs = ts + (9 * 60 * 60 * 1000);
  return new Date(kstTs).getUTCMinutes();
}

function getKSTDay(date) {
  const ts = date.getTime();
  const kstTs = ts + (9 * 60 * 60 * 1000);
  return new Date(kstTs).getUTCDay();
}

// KST 날짜 문자열 생성 (YYYY-MM-DD)
function getKSTDateString(date) {
  const year = getKSTYear(date);
  const month = getKSTMonth(date);
  const day = getKSTDate(date);
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function getNextDailyTime(timeStr) {
  const now = getCurrentKST();

  // 현재 KST 날짜 문자열 구하기
  const kstDateString = getKSTDateString(now);

  // 오늘 해당 시간의 KST 타임스탬프 계산 (+09:00 오프셋 명시)
  let next = new Date(`${kstDateString}T${timeStr}:00+09:00`);

  if (next <= now) {
    // 다음 날로 설정 (24시간을 더함)
    next = new Date(next.getTime() + 24 * 60 * 60 * 1000);
  }
  return next;
}

function getNextBiweeklyTime(timeStr, baseDateStr) {
  const now = getCurrentKST();
  const base = new Date(baseDateStr + 'T00:00:00+09:00');

  // KST 자정 기준으로 날짜 차이 계산
  const nowKSTYear = getKSTYear(now);
  const nowKSTMonth = getKSTMonth(now) - 1; // Date.UTC는 0-based
  const nowKSTDay = getKSTDate(now);
  const nowAtMidnightKST = Date.UTC(nowKSTYear, nowKSTMonth, nowKSTDay - 1, 15, 0, 0, 0);

  const baseKSTYear = getKSTYear(base);
  const baseKSTMonth = getKSTMonth(base) - 1;
  const baseKSTDay = getKSTDate(base);
  const baseAtMidnightKST = Date.UTC(baseKSTYear, baseKSTMonth, baseKSTDay - 1, 15, 0, 0, 0);

  const diffDays = Math.floor((nowAtMidnightKST - baseAtMidnightKST) / (1000 * 60 * 60 * 24));

  const cycles = Math.floor(diffDays / 14);
  let nextDate = new Date(baseAtMidnightKST + cycles * 14 * 24 * 60 * 60 * 1000);

  // 다음 레이드 시간을 KST로 설정
  const kstDateString = getKSTDateString(nextDate);
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
    const kstDateString = getKSTDateString(futureDate);

    const nextRaidTime = new Date(`${kstDateString}T${timeStr}:00+09:00`);

    // KST 기준 요일 구하기
    const kstDay = getKSTDay(nextRaidTime);

    if (days.includes(kstDay) && nextRaidTime > now) {
      return nextRaidTime;
    }
  }
  // 만약 지난 2주간 해당 요일이 없다면, 기본 로직으로 다음 시간을 반환 (오류 방지)
  const fallbackDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const kstDateString = getKSTDateString(fallbackDate);
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

  // KST 자정 기준으로 날짜 차이 계산
  const nowKSTYear = getKSTYear(now);
  const nowKSTMonth = getKSTMonth(now) - 1; // Date.UTC는 0-based
  const nowKSTDay = getKSTDate(now);
  const nowAtMidnightKST = Date.UTC(nowKSTYear, nowKSTMonth, nowKSTDay - 1, 15, 0, 0, 0);

  const baseKSTYear = getKSTYear(baseDate);
  const baseKSTMonth = getKSTMonth(baseDate) - 1;
  const baseKSTDay = getKSTDate(baseDate);
  const baseAtMidnightKST = Date.UTC(baseKSTYear, baseKSTMonth, baseKSTDay - 1, 15, 0, 0, 0);

  let diffDays = Math.floor((nowAtMidnightKST - baseAtMidnightKST) / (1000 * 60 * 60 * 24));

  // 레이드 날짜 계산 (baseDate에서 diffDays만큼 더함)
  const raidDateString = getKSTDateString(new Date(baseAtMidnightKST + diffDays * 24 * 60 * 60 * 1000));

  // 레이드 시간 계산: baseTime + (diffDays * 25분)
  const totalMinutes = baseHour * 60 + baseMin + (diffDays * 25);
  const raidHour = Math.floor(totalMinutes / 60) % 24;
  const raidMin = totalMinutes % 60;

  // 날짜가 넘어간 경우 처리
  const extraDays = Math.floor(totalMinutes / (60 * 24));
  let finalDate = new Date(baseAtMidnightKST + (diffDays + extraDays) * 24 * 60 * 60 * 1000);
  const finalDateString = getKSTDateString(finalDate);

  let nextTime = new Date(`${finalDateString}T${raidHour.toString().padStart(2, '0')}:${raidMin.toString().padStart(2, '0')}:00+09:00`);

  if (nextTime <= now) {
    diffDays++;
    const nextRaidDateString = getKSTDateString(new Date(baseAtMidnightKST + diffDays * 24 * 60 * 60 * 1000));
    const nextTotalMinutes = baseHour * 60 + baseMin + (diffDays * 25);
    const nextRaidHour = Math.floor(nextTotalMinutes / 60) % 24;
    const nextRaidMin = nextTotalMinutes % 60;
    const nextExtraDays = Math.floor(nextTotalMinutes / (60 * 24));
    const nextFinalDate = new Date(baseAtMidnightKST + (diffDays + nextExtraDays) * 24 * 60 * 60 * 1000);
    const nextFinalDateString = getKSTDateString(nextFinalDate);
    nextTime = new Date(`${nextFinalDateString}T${nextRaidHour.toString().padStart(2, '0')}:${nextRaidMin.toString().padStart(2, '0')}:00+09:00`);
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
    timeStr: getKSTHours(tyrannoTime).toString().padStart(2, '0') + ':' + getKSTMinutes(tyrannoTime).toString().padStart(2, '0'),
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
        <img loading="lazy" src="${raid.image}" alt="${raid.name}" width="46" height="46" style="object-fit:contain; display:block;">
      </div>
      <div style="display:flex; flex-direction:column; text-align:left;">
        <span><strong>${raid.name}</strong></span>
        <span style="font-size:0.7rem; color:#666;">${raid.timeStr}, <span class="raid-location" data-name="${raid.name}" data-time="${raid.timeStr}" style="cursor:pointer; text-decoration:underline; color:#007bff; font-weight:bold;">${raid.map} <i class="ri-map-pin-line"></i></span></span>
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
    volumeSlider.addEventListener('input', function () {
      alarmAudio.volume = parseFloat(this.value);
    });
  }

  // 재생 시간 슬라이더 이벤트 리스너
  if (durationInput && durationValueSpan) {
    durationInput.addEventListener('input', function () {
      durationValueSpan.textContent = `${this.value}초`;
    });
  }


  // 알림 시간 입력 제한
  notificationTimeSpan.addEventListener('input', function () {
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
  notificationTimeSpan.addEventListener('blur', function () {
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

  alarmToggle.addEventListener('change', async function () {
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

  const timersContainer = document.getElementById('raid-timers');
  const modal = document.getElementById('map-modal');
  const modalImage = document.getElementById('map-modal-image');
  const closeModal = document.getElementById('map-modal-close');

  if (timersContainer && modal && modalImage && closeModal) {
    const raidMapImages = {
      '펌프몬': { '19:30': '1930' },
      '울퉁몬': { '21:30': '2130' },
      '오메가몬': 'omega',
      '위그드라실_7D6': '위그드라실',
      [RotationRaid.name]: 'rotation0129',
      '청룡몬': '청룡몬',
      '백호몬': '백호몬',
      '주작몬': '주작몬',
      '현무몬': '현무몬',
      '블랙세라피몬': 'weekend',
      '오파니몬:폴다운모드': 'weekend',
      '메기드라몬': 'weekend'
    };

    timersContainer.addEventListener('click', (e) => {
      // Use closest to handle clicks on the icon inside the span
      const locationSpan = e.target.closest('.raid-location');
      if (locationSpan) {
        const raidName = locationSpan.dataset.name;
        const raidTime = locationSpan.dataset.time;
        let imageName = null;

        const mapEntry = raidMapImages[raidName];
        if (typeof mapEntry === 'string') {
          imageName = mapEntry;
        } else if (mapEntry && typeof mapEntry === 'object') {
          imageName = mapEntry[raidTime] || null;
        }

        if (imageName) {
          modalImage.src = `https://media.dsrwiki.com/dsrwiki/map/${imageName}.png`;
          modal.style.display = 'flex';
        }
      }
    });

    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  renderRaids();
  setInterval(updateTimers, 1000);
});
