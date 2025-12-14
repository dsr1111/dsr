
// 가챠 데이터
let gachaData = null;
let currentBox = null;
let gachaItems = [];

// 로그 통계 데이터
let logStats = {
    totalOpens: 0,
    items: {}, // { "아이템명": { count: 횟수, grade: 등급, probability: 확률 } }
    grades: { 1: 0, 2: 0, 3: 0, 4: 0 },
    tradeable: { available: 0, unavailable: 0 },
    rareItems: 0 // 확률 0.5% 미만 아이템 획득 횟수
};

// 통계 초기화 함수
function resetStats() {
    logStats = {
        totalOpens: 0,
        items: {},
        grades: { 1: 0, 2: 0, 3: 0, 4: 0 },
        tradeable: { available: 0, unavailable: 0 },
        rareItems: 0
    };
}

// 타임스탬프 생성 함수
function getTimestamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// 등급별 색상 클래스 반환 함수
function getGradeColorClass(grade) {
    if (!grade) return 'item-name'; // 등급이 없으면 기본 색상
    return `item-grade-${grade}`;
}

// 아이템 이름에서 거래 가능/불가 정보 추출
function extractTradeInfo(itemName) {
    if (itemName.includes('거래가능')) {
        return { displayName: itemName.replace(/\s*\(거래가능\)/g, ''), tradeStatus: 'available' };
    } else if (itemName.includes('거래 불가') || itemName.includes('거래불가')) {
        return { displayName: itemName.replace(/\s*\(거래\s*불가\)/g, ''), tradeStatus: 'unavailable' };
    }
    return { displayName: itemName, tradeStatus: null };
}

// 콘솔에 메시지 추가
function addConsoleLine(message, isSystem = false, isRare = false, logNumber = null) {
    const consoleContent = document.getElementById('console-content');
    const line = document.createElement('div');
    line.className = 'console-line';

    // 희귀 아이템인 경우 특별한 클래스 추가
    if (isRare) {
        line.classList.add('rare-item');
    }

    if (isSystem) {
        line.innerHTML = `<span class="timestamp">[시스템]</span><span>${message}</span>`;
    } else {
        // 개봉 순서 번호 추가 (고정 폭으로 포맷팅)
        let numberHtml = '';
        if (logNumber !== null) {
            // 최대 9999개까지 고려하여 4자리로 포맷팅
            const formattedNumber = String(logNumber).padStart(4, ' ');
            numberHtml = `<span class="log-number">#${formattedNumber}</span>`;
        }
        line.innerHTML = numberHtml + message;
    }

    consoleContent.appendChild(line);

    // 스크롤을 맨 아래로 (DOM 업데이트 후 실행)
    setTimeout(() => {
        const consoleWrapper = document.querySelector('.console-content-wrapper');
        if (consoleWrapper) {
            consoleWrapper.scrollTop = consoleWrapper.scrollHeight;
        }
    }, 0);
}

// 총 열기 횟수 카운터
let totalOpenCount = 0;

// 카운터 업데이트 함수
function updateCounter() {
    document.getElementById('total-count').textContent = totalOpenCount.toLocaleString();
}

// 상자 선택 함수
function selectBox(boxId) {
    if (!gachaData) return;

    const box = gachaData.boxes.find(b => b.id === boxId);
    if (!box) return;

    // 이전 상자와 다른 상자로 변경되는 경우에만 로그 및 카운터 초기화
    if (currentBox && currentBox.id !== boxId) {
        const consoleContent = document.getElementById('console-content');
        consoleContent.innerHTML = '';
        totalOpenCount = 0;
        updateCounter();
        resetStats();
    }

    currentBox = box;
    gachaItems = box.items;

    // UI 업데이트
    document.getElementById('box-name').textContent = box.name;
    document.getElementById('box-description').textContent = '';
    const boxOpenContainer = document.getElementById('box-open-container');
    boxOpenContainer.style.opacity = '1';
    boxOpenContainer.style.pointerEvents = 'auto';

    // 상자 이미지 설정
    const encodedBoxName = encodeURIComponent(box.name + '.webp');
    const imageUrl = `https://media.dsrwiki.com/dsrwiki/item/${encodedBoxName}`;
    const boxImage = document.getElementById('box-image');
    const boxImagePlaceholder = document.getElementById('box-image-placeholder');

    // 플레이스홀더 먼저 숨김 (배경만 보이도록)
    boxImage.style.display = 'none';
    boxImagePlaceholder.style.display = 'none';

    // 이미지 로드 시도
    const img = new Image();
    img.onload = function () {
        boxImage.src = imageUrl;
        boxImage.style.display = 'block';
        boxImagePlaceholder.style.display = 'none';
    };
    img.onerror = function () {
        boxImage.style.display = 'none';
        boxImagePlaceholder.style.display = 'none'; // 배경만 보이도록
    };
    img.src = imageUrl;
}

// 가챠 실행 함수 (단일)
function executeSingleGacha() {
    if (!currentBox || gachaItems.length === 0) {
        addConsoleLine('먼저 상자를 선택해주세요.', true);
        return null;
    }

    // 랜덤 값 생성 (0 ~ 100)
    const random = Math.random() * 100;

    // 누적 확률로 아이템 선택
    let cumulativeProbability = 0;
    let selectedItem = null;

    for (const item of gachaItems) {
        cumulativeProbability += item.probability;
        if (random <= cumulativeProbability) {
            selectedItem = item;
            break;
        }
    }

    // 선택된 아이템이 없으면 마지막 아이템 선택 (오차 보정)
    if (!selectedItem) {
        selectedItem = gachaItems[gachaItems.length - 1];
    }

    // 콘솔에 결과 표시 (상자 이름 포함, 등급별 색상 적용)
    const gradeClass = getGradeColorClass(selectedItem.grade);
    const tradeInfo = extractTradeInfo(selectedItem.name);

    // 희귀 아이템 판단
    let isRare = false;
    if (currentBox.id === 'gunggeukche') {
        // 궁극체 디지코어 꾸러미는 희귀 효과 없음
        isRare = false;
    } else if (currentBox.id === 'bulmyeol') {
        // 불멸의 우정 상자는 0.7% 이하일 때 희귀 효과
        isRare = selectedItem.probability <= 0.7;
    } else {
        // 나머지 상자는 0.61% 미만일 때 희귀 효과
        isRare = selectedItem.probability < 0.61;
    }

    let tradeStatusHtml = '';
    if (tradeInfo.tradeStatus === 'available') {
        tradeStatusHtml = ' <span class="trade-available">(거래가능)</span>';
    } else if (tradeInfo.tradeStatus === 'unavailable') {
        tradeStatusHtml = ' <span class="trade-unavailable">(거래불가)</span>';
    }

    // 카운터 증가 (번호는 증가 전 값 사용)
    totalOpenCount++;
    const currentLogNumber = totalOpenCount;
    updateCounter();

    const message = `<span style="color: #9cdcfe;">[${currentBox.name}]</span> <span class="${gradeClass}">[${tradeInfo.displayName}]</span> <span class="item-count">${selectedItem.count}개</span>를 획득했습니다.${tradeStatusHtml}`;
    addConsoleLine(message, false, isRare, currentLogNumber);

    // 통계 업데이트
    updateStats(selectedItem, tradeInfo, isRare);

    return selectedItem;
}

// 통계 업데이트 함수
function updateStats(item, tradeInfo, isRare) {
    logStats.totalOpens++;

    // 아이템별 획득 횟수
    const itemKey = item.name;
    if (!logStats.items[itemKey]) {
        logStats.items[itemKey] = {
            count: 0,
            grade: item.grade || 1,
            probability: item.probability || 0,
            displayName: tradeInfo.displayName
        };
    }
    logStats.items[itemKey].count += item.count;

    // 등급별 획득 횟수
    const grade = item.grade || 1;
    if (logStats.grades[grade] !== undefined) {
        logStats.grades[grade] += item.count;
    }

    // 거래 가능/불가 통계
    if (tradeInfo.tradeStatus === 'available') {
        logStats.tradeable.available += item.count;
    } else if (tradeInfo.tradeStatus === 'unavailable') {
        logStats.tradeable.unavailable += item.count;
    }

    // 희귀 아이템 통계
    if (isRare) {
        logStats.rareItems += item.count;
    }
}

// 통계 모달 내용 업데이트
function updateStatsModal() {
    const modalBody = document.getElementById('stats-modal-body');

    if (logStats.totalOpens === 0) {
        modalBody.innerHTML = '<div style="text-align: center; color: #9cdcfe; padding: 40px;">아직 개봉한 상자가 없습니다.</div>';
        return;
    }

    let html = '';

    // 아이템별 상세 통계
    html += '<div class="stats-section">';
    html += '<div class="stats-section-title">아이템별 획득 통계</div>';
    html += '<div class="stats-item-list">';

    // 획득 횟수 순으로 정렬
    const sortedItems = Object.entries(logStats.items)
        .sort((a, b) => b[1].count - a[1].count);

    sortedItems.forEach(([itemName, itemData]) => {
        const percentage = logStats.totalOpens > 0 ? ((itemData.count / logStats.totalOpens) * 100).toFixed(2) : 0;
        const gradeClass = `item-grade-${itemData.grade}`;
        html += `<div class="stats-item-row">
            <span class="stats-item-name ${gradeClass}">${itemData.displayName}</span>
            <span class="stats-item-count">${itemData.count.toLocaleString()}개</span>
            <span class="stats-item-percentage">${percentage}%</span>
          </div>`;
    });

    html += '</div></div>';

    modalBody.innerHTML = html;
}

// 가챠 일괄 실행 함수
function executeMultipleGacha(count) {
    if (!currentBox) {
        addConsoleLine('먼저 상자를 선택해주세요.', true);
        return;
    }

    if (count <= 0 || count > 1000) {
        addConsoleLine('개수는 1~1000 사이여야 합니다.', true);
        return;
    }

    // 각 상자 열기
    for (let i = 0; i < count; i++) {
        executeSingleGacha();
    }
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', async function () {
    // JSON 데이터 로드
    try {
        const response = await fetch('https://media.dsrwiki.com/data/csv/gacha.json');
        gachaData = await response.json();

        // 상자 선택 드롭다운 채우기
        const boxSelect = document.getElementById('box-select');
        gachaData.boxes.forEach(box => {
            const option = document.createElement('option');
            option.value = box.id;
            option.textContent = box.name;
            boxSelect.appendChild(option);
        });

        // 첫 번째 상자 자동 선택
        if (gachaData.boxes.length > 0) {
            const firstBoxId = gachaData.boxes[0].id;
            boxSelect.value = firstBoxId;
            selectBox(firstBoxId);
        }

        // 상자 선택 이벤트
        boxSelect.addEventListener('change', function () {
            if (this.value) {
                selectBox(this.value);
            } else {
                currentBox = null;
                gachaItems = [];
                document.getElementById('box-name').textContent = '상자를 선택하세요';
                document.getElementById('box-description').textContent = '';
                const boxOpenContainer = document.getElementById('box-open-container');
                boxOpenContainer.style.opacity = '0.5';
                boxOpenContainer.style.pointerEvents = 'none';
            }
        });
    } catch (error) {
        console.error('가챠 데이터 로드 실패:', error);
        addConsoleLine('가챠 데이터를 불러오는데 실패했습니다.', true);
    }

    // 개봉 수 조절 버튼
    document.getElementById('count-minus-btn').addEventListener('click', function () {
        const countInput = document.getElementById('gacha-count');
        const currentValue = parseInt(countInput.value) || 1;
        if (currentValue > 1) {
            countInput.value = currentValue - 1;
        }
    });

    document.getElementById('count-plus-btn').addEventListener('click', function () {
        const countInput = document.getElementById('gacha-count');
        const currentValue = parseInt(countInput.value) || 1;
        if (currentValue < 1000) {
            countInput.value = currentValue + 1;
        }
    });

    // 개봉 버튼
    document.getElementById('open-btn').addEventListener('click', function () {
        if (!currentBox) {
            addConsoleLine('먼저 상자를 선택해주세요.', true);
            return;
        }
        const count = parseInt(document.getElementById('gacha-count').value) || 1;
        executeMultipleGacha(count);
    });

    // 엔터키로 개봉
    document.getElementById('gacha-count').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('open-btn').click();
        }
    });

    // 로그 지우기 버튼
    document.getElementById('clear-btn').addEventListener('click', function () {
        const consoleContent = document.getElementById('console-content');
        consoleContent.innerHTML = '';
        // 카운터는 유지
    });

    // 통계 보기 버튼
    document.getElementById('stats-btn').addEventListener('click', function () {
        updateStatsModal();
        document.getElementById('stats-modal').style.display = 'flex';
    });

    // 통계 모달 닫기 버튼
    document.getElementById('stats-modal-close').addEventListener('click', function () {
        document.getElementById('stats-modal').style.display = 'none';
    });

    // 모달 배경 클릭 시 닫기
    document.getElementById('stats-modal').addEventListener('click', function (e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });

    // 초기 카운터 표시
    updateCounter();
});
