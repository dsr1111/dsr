const SLOT_GROUP_1 = ['머리 슬롯', '상의 슬롯', '등 슬롯', '양말 슬롯'];
const SLOT_GROUP_2 = ['얼굴 슬롯', '장갑 슬롯', '하의 슬롯', '신발 슬롯'];

const STAT_VALUES = {
    '힘': { min: 1, max: 12, isFloat: false },
    '지능': { min: 1, max: 12, isFloat: false },
    '수비': { min: 1, max: 12, isFloat: false },
    '저항': { min: 1, max: 12, isFloat: false },
    '속도': { min: 1, max: 12, isFloat: false },
    '체인스킬': { min: 0.5, max: 1.5, isFloat: true },
    '회피율': { min: 1.25, max: 6.25, isFloat: true },
};

const ELEMENTS = ['물리', '불', '천둥', '바람', '얼음', '물', '흙', '나무', '강철', '빛', '어둠'];

ELEMENTS.forEach(el => {
    STAT_VALUES[`${el} 데미지 증가`] = { min: 0.16, max: 1.94, isFloat: true };
    STAT_VALUES[`${el} 데미지 방어`] = { min: 0.16, max: 1.94, isFloat: true };
});

const PROB_GROUP_1 = [
    { stat: '힘', prob: 2.65 },
    { stat: '지능', prob: 3.06 },
    { stat: '수비', prob: 5.97 },
    { stat: '저항', prob: 6.82 },
    { stat: '체인스킬', prob: 3.0 },
    { stat: '회피율', prob: 3.5 },
];
ELEMENTS.forEach(el => PROB_GROUP_1.push({ stat: `${el} 데미지 증가`, prob: 3.18 }));
ELEMENTS.forEach(el => {
    if (el === '빛' || el === '어둠') {
        PROB_GROUP_1.push({ stat: `${el} 데미지 방어`, prob: 3.63 });
    } else {
        PROB_GROUP_1.push({ stat: `${el} 데미지 방어`, prob: 3.64 });
    }
});

const PROB_GROUP_2 = [
    { stat: '힘', prob: 2.11 },
    { stat: '지능', prob: 2.43 },
    { stat: '수비', prob: 4.74 },
    { stat: '저항', prob: 5.42 },
    { stat: '속도', prob: 3.8 },
    { stat: '체인스킬', prob: 3.0 },
    { stat: '회피율', prob: 3.5 },
];
ELEMENTS.forEach(el => PROB_GROUP_2.push({ stat: `${el} 데미지 증가`, prob: 3.18 }));
ELEMENTS.forEach(el => {
    if (el === '빛' || el === '어둠') {
        PROB_GROUP_2.push({ stat: `${el} 데미지 방어`, prob: 3.63 });
    } else {
        PROB_GROUP_2.push({ stat: `${el} 데미지 방어`, prob: 3.64 });
    }
});

function getRandomStatWithLimit(group, currentRows, limit = 2) {
    const probs = group === 1 ? PROB_GROUP_1 : PROB_GROUP_2;

    // Count existing stats in currentRows
    const counts = {};
    if (currentRows && Array.isArray(currentRows)) {
        currentRows.forEach(r => {
            if (r.stat && r.stat !== '') {
                counts[r.stat] = (counts[r.stat] || 0) + 1;
            }
        });
    }

    // Filter out stats that hit the limit
    const availableProbs = probs.filter(p => (counts[p.stat] || 0) < limit);

    // In rare cases if all are filtered (shouldn't happen with 5 rows and limit 2 and many stats), fallback to all
    const targetProbs = availableProbs.length > 0 ? availableProbs : probs;

    const totalProb = targetProbs.reduce((sum, p) => sum + p.prob, 0);
    const r = Math.random() * totalProb;

    let sum = 0;
    for (let p of targetProbs) {
        sum += p.prob;
        if (r <= sum) return p.stat;
    }
    return targetProbs[targetProbs.length - 1].stat;
}

function getRandomValue(stat) {
    const v = STAT_VALUES[stat] || { min: 1, max: 12, isFloat: false };
    if (v.isFloat) {
        const steps = Math.round((v.max - v.min) * 100);
        const randStep = Math.floor(Math.random() * (steps + 1));
        return +(v.min + randStep / 100).toFixed(2);
    } else {
        const span = v.max - v.min;
        return v.min + Math.floor(Math.random() * (span + 1));
    }
}

const slots = [
    '머리 슬롯', '얼굴 슬롯', '상의 슬롯', '장갑 슬롯',
    '하의 슬롯', '양말 슬롯', '신발 슬롯', '등 슬롯'
];

let state = {};
slots.forEach(s => {
    state[s] = Array(5).fill().map(() => ({ isLocked: false, stat: '', value: 0 }));
});

let currentMode = 'stat'; // 'stat' | 'value'
let currentSlot = '머리 슬롯';

// Track consumption individually per slot and mode
const consumption = {};
slots.forEach(s => {
    consumption[s] = {
        stat: { main: 0, lock: 0, cost: 0 },
        value: { main: 0, lock: 0, cost: 0 }
    };
});

document.addEventListener('DOMContentLoaded', () => {
    const uiMatList = document.getElementById('ce-material-list');
    const uiLockCount = document.getElementById('ce-lock-count');
    const uiStatList = document.getElementById('ce-stat-list');
    const uiCostValue = document.getElementById('ce-cost-value');
    const uiEngraveBtn = document.getElementById('ce-engrave-btn');
    const currentSlotNameLabel = document.getElementById('current-slot-name');
    const currentSlotIcon = document.getElementById('current-slot-icon');

    const tabs = document.querySelectorAll('.ce-tab');
    const slotBtns = document.querySelectorAll('.ce-slot-btn');

    // Stats mode elements
    const uiStatsBtn = document.getElementById('ce-stats-btn');
    const uiStatsModal = document.getElementById('ce-stats-modal');
    const uiStatsCloseBtn = document.getElementById('ce-stats-close-btn');
    const totalCostValue = document.getElementById('total-cost-value');
    const totalMatsList = document.getElementById('total-mats-list');
    const totalStatsList = document.getElementById('total-stats-list');

    function renderStatsOnly(rows) {
        if (!uiStatList) return;
        uiStatList.innerHTML = '';
        rows.forEach((row, i) => {
            const div = document.createElement('div');
            div.className = `ce-stat-row ${row.isLocked ? 'locked' : ''}`;

            let displayValue = '';
            let isFloat = false;

            if (row.stat) {
                isFloat = STAT_VALUES[row.stat] ? STAT_VALUES[row.stat].isFloat : false;
                const valStr = isFloat ? row.value.toFixed(2) : row.value;
                displayValue = `+${valStr}${isFloat ? '%' : ''}`;
            }

            div.innerHTML = `
                <span class="ce-stat-name">${row.stat || '<span style="color:#475569;">빈 슬롯</span>'}</span>
                <div class="ce-stat-value-wrap">
                    <span class="ce-stat-value">${displayValue}</span>
                    ${row.stat ? `<i class="${row.isLocked ? 'ri-lock-fill' : 'ri-lock-unlock-fill'} ce-stat-lock" data-index="${i}"></i>` : ''}
                </div>
            `;
            uiStatList.appendChild(div);
        });

        const lockIcons = uiStatList.querySelectorAll('.ce-stat-lock');
        lockIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                if (rows[idx].isLocked) {
                    rows[idx].isLocked = false;
                } else {
                    const lockedCount = state[currentSlot].filter(r => r.isLocked).length;
                    if (lockedCount >= 2) {
                        alert('최대 2개까지만 잠글 수 있습니다.');
                        return;
                    }
                    rows[idx].isLocked = true;
                }
                renderRightPanel();
            });
        });
    }

    function renderRightPanel() {
        if (!uiMatList) return;
        const rows = state[currentSlot];
        const lockedCount = rows.filter(r => r.isLocked).length;
        const locksLeft = 2 - lockedCount;

        uiLockCount.textContent = locksLeft;
        uiLockCount.style.color = locksLeft > 0 ? '#00ea73' : '#fe3535';

        renderStatsOnly(rows);

        const curConsum = consumption[currentSlot][currentMode];
        const partName = currentSlot.replace(' 슬롯', '');

        let mainMatName = '';
        let lockMatName = '';

        if (currentMode === 'stat') {
            mainMatName = `${partName} 능력치 각인 부적`;
            lockMatName = '능력치 잠금 방울';
            uiEngraveBtn.textContent = '능력치 각인';
        } else {
            mainMatName = `${partName} 수치 각인 부적`;
            lockMatName = '수치 잠금 방울';
            uiEngraveBtn.textContent = '수치 각인';
        }

        uiCostValue.textContent = (curConsum.cost).toLocaleString();

        uiMatList.innerHTML = `
            <div class="ce-material-item">
                <div class="ce-mat-icon"><img src="https://media.dsrwiki.com/dsrwiki/item/${mainMatName}.webp" style="width:100%; height:100%; object-fit:contain; border-radius:4px;" alt="amulet"></div>
                <span class="ce-mat-name">${mainMatName}</span>
                <span class="ce-mat-count green">${curConsum.main.toLocaleString()} 개</span>
            </div>
            <div class="ce-material-item">
                <div class="ce-mat-icon"><img src="https://media.dsrwiki.com/dsrwiki/item/${lockMatName}.webp" style="width:100%; height:100%; object-fit:contain; border-radius:4px;" alt="bell"></div>
                <span class="ce-mat-name">${lockMatName}</span>
                <span class="ce-mat-count green">${curConsum.lock.toLocaleString()} 개</span>
            </div>
        `;
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => { t.classList.remove('active'); t.classList.add('inactive'); });
            tab.classList.add('active');
            tab.classList.remove('inactive');
            currentMode = index === 0 ? 'stat' : 'value';

            // Note: Keep the locks as is when changing modes, or unlock them all.
            // Keeping them allows easy re-roll between modes
            renderRightPanel();
        });
    });

    uiStatsBtn.addEventListener('click', () => {
        let tCost = 0;
        const matCounts = {};
        const statCounts = {};

        slots.forEach(s => {
            const partName = s.replace(' 슬롯', '');

            // Collect material and cost
            ['stat', 'value'].forEach(m => {
                const c = consumption[s][m];
                tCost += c.cost;
                if (c.main > 0) {
                    const mName = m === 'stat' ? `${partName} 능력치 각인 부적` : `${partName} 수치 각인 부적`;
                    matCounts[mName] = (matCounts[mName] || 0) + c.main;
                }
                if (c.lock > 0) {
                    const lName = m === 'stat' ? '능력치 잠금 방울' : '수치 잠금 방울';
                    matCounts[lName] = (matCounts[lName] || 0) + c.lock;
                }
            });

            // Collect allocated stats
            state[s].forEach(r => {
                if (r.stat && r.value > 0) {
                    statCounts[r.stat] = (statCounts[r.stat] || 0) + r.value;
                }
            });
        });

        totalCostValue.textContent = tCost.toLocaleString();

        let matHtml = '';
        const matKeys = Object.keys(matCounts).sort();
        if (matKeys.length === 0) {
            matHtml = '<div style="color:#718096;font-size:12px;text-align:center;padding:10px;">소모된 재료가 없습니다.</div>';
        } else {
            for (let k of matKeys) {
                matHtml += `<div class="ce-stats-mat-item">
                    <span>${k}</span>
                    <span style="color:#00ea73;font-weight:bold;">${matCounts[k].toLocaleString()} 개</span>
                </div>`;
            }
        }
        totalMatsList.innerHTML = matHtml;

        let optHtml = '';
        const optKeys = Object.keys(statCounts).sort();
        if (optKeys.length === 0) {
            optHtml = '<div style="color:#718096;font-size:12px;grid-column:span 2;text-align:center;padding:10px;">적용된 옵션이 없습니다.</div>';
        } else {
            for (let k of optKeys) {
                const isFloat = STAT_VALUES[k] ? STAT_VALUES[k].isFloat : false;
                const valStr = isFloat ? statCounts[k].toFixed(2) + '%' : Math.round(statCounts[k]);
                optHtml += `<div class="ce-stats-opt-item">
                    <span class="name">${k}</span>
                    <span class="val">+${valStr}</span>
                </div>`;
            }
        }
        totalStatsList.innerHTML = optHtml;

        uiStatsModal.style.display = 'flex';
    });

    uiStatsCloseBtn.addEventListener('click', () => {
        uiStatsModal.style.display = 'none';
    });

    slotBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            slotBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const slotName = btn.dataset.slot;
            currentSlot = slotName;
            currentSlotNameLabel.textContent = slotName;

            currentSlotIcon.src = `https://media.dsrwiki.com/dsrwiki/item/${slotName}.webp`;

            renderRightPanel();
        });
    });

    uiEngraveBtn.addEventListener('click', () => {
        const rows = state[currentSlot];
        const group = SLOT_GROUP_1.includes(currentSlot) ? 1 : 2;

        // Apply cost accumulation
        const lockedCount = rows.filter(r => r.isLocked).length;
        if (currentMode === 'stat') {
            consumption[currentSlot].stat.cost += 400000;
            consumption[currentSlot].stat.main += 5;
            consumption[currentSlot].stat.lock += lockedCount;
        } else {
            consumption[currentSlot].value.cost += 300000;
            consumption[currentSlot].value.main += 3;
            consumption[currentSlot].value.lock += lockedCount;
        }

        const finalBuilderRows = rows.map(r => ({ ...r, stat: (currentMode === 'stat' && !r.isLocked) ? null : r.stat }));
        finalBuilderRows.forEach(row => {
            if (!row.isLocked) {
                if (currentMode === 'stat') {
                    row.stat = getRandomStatWithLimit(group, finalBuilderRows);
                }
                if (row.stat) {
                    row.value = getRandomValue(row.stat);
                }
            }
        });

        // Finalize changes into state
        finalBuilderRows.forEach((fr, i) => {
            rows[i].stat = fr.stat;
            rows[i].value = fr.value;
        });

        renderRightPanel();
    });

    // Initial Render
    renderRightPanel();
});
