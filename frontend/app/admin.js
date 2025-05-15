const API_URL = 'https://port-0-dsr-m85aqy8qfc2589fd.sel4.cloudtype.app';

// 데이터 관리 클래스
class DataManager {
    constructor() {
        this.currentData = [];
        this.currentType = 'characters';
        this.editForm = document.getElementById('editForm');
        this.dataForm = document.getElementById('dataForm');
        this.dataTypeSelect = document.getElementById('dataTypeSelect');
        this.isCSV = true;
        this.dynamicHeaders = [];
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 폼 제출 이벤트
        this.dataForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveData();
        });
        this.dataTypeSelect.addEventListener('change', (e) => {
            this.currentType = e.target.value;
            this.isCSV = !['coupon', 'deck'].includes(this.currentType);
            this.loadData();
        });
    }

    async loadData() {
        try {
            const response = await fetch(`${API_URL}/api/data/${this.currentType}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            if (data.isJson) {
                this.isCSV = false;
                this.currentData = this.parseJSON(data.content);
            } else {
                this.isCSV = true;
                this.currentData = this.parseCSV(data.content);
            }
            this.renderTable();
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            alert('데이터를 불러오는데 실패했습니다.');
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        this.dynamicHeaders = headers;
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index]?.trim() || '';
                return obj;
            }, {});
        });
    }

    parseJSON(jsonText) {
        try {
            return JSON.parse(jsonText);
        } catch (e) {
            alert('JSON 파싱 오류');
            return [];
        }
    }

    renderTable() {
        const tableBody = document.getElementById('dataTableBody');
        const tableHead = document.querySelector('.data-table thead tr');
        tableBody.innerHTML = '';
        
        // calendar.json 전용 테이블
        if (this.currentType === 'calendar') {
            tableHead.innerHTML = '<th>제목</th><th>시작일</th><th>종료일</th><th>배경색</th><th>글자색</th><th>관리</th>';
            this.currentData.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.title}</td>
                    <td>${item.start}</td>
                    <td>${item.end}</td>
                    <td>${item.backgroundColor}</td>
                    <td>${item.textColor}</td>
                    <td>
                        <button onclick="dataManager.editData(${index})">수정</button>
                        <button onclick="dataManager.deleteData(${index})">삭제</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            return;
        }

        // coupon.json 전용 테이블
        if (this.currentType === 'coupon') {
            tableHead.innerHTML = '<th>쿠폰명</th><th>기간</th><th>쿠폰번호</th><th>보상</th><th>관리</th>';
            const entries = Object.entries(this.currentData);
            entries.forEach(([name, info], index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${name}</td>
                    <td>${info.period || ''}</td>
                    <td>${info.number || ''}</td>
                    <td>${(info.items || []).join('<br>')}</td>
                    <td>
                        <button onclick="dataManager.editData(${index})">수정</button>
                        <button onclick="dataManager.deleteData(${index})">삭제</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            return;
        }

        // deck.json 전용 테이블
        if (this.currentType === 'deck') {
            tableHead.innerHTML = '<th>덱이름</th><th>디지몬</th><th>설명</th><th>효과</th><th>관리</th>';
            const entries = Object.entries(this.currentData);
            entries.forEach(([name, info], index) => {
                const digimonList = (info.digimon || []).map(d => `${d.name}(${d.level})`).join(', ');
                const effects = (info.effects || []).join('<br>');
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${name}</td>
                    <td>${digimonList}</td>
                    <td>${info.description || ''}</td>
                    <td>${effects}</td>
                    <td>
                        <button onclick="dataManager.editData(${index})">수정</button>
                        <button onclick="dataManager.deleteData(${index})">삭제</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            return;
        }

        // ... 기존 CSV/기타 JSON 처리 ...
        let headers = this.dynamicHeaders || [];
        if (!this.isCSV) {
            if (this.currentType === 'coupon') {
                headers = ['쿠폰번호', '보상', '만료일'];
            } else if (this.currentType === 'deck') {
                headers = ['덱이름', '디지몬1', '디지몬2', '디지몬3'];
            }
        }
        tableHead.innerHTML = headers
            .map(header => `<th>${header}</th>`)
            .join('') + '<th>관리</th>';

        this.currentData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = headers
                .map(key => `<td>${item[key] || ''}</td>`)
                .join('') + `
                <td>
                    <button onclick="dataManager.editData(${index})">수정</button>
                    <button onclick="dataManager.deleteData(${index})">삭제</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    showEditForm(item = {}) {
        this.dataForm.innerHTML = '';

        if (this.currentType === 'calendar') {
            // 제목
            const titleGroup = document.createElement('div');
            titleGroup.className = 'form-group';
            titleGroup.innerHTML = `
                <label>제목:</label>
                <input type="text" name="title" value="${item.title || ''}" required>
            `;
            this.dataForm.appendChild(titleGroup);

            // 시작일
            const startGroup = document.createElement('div');
            startGroup.className = 'form-group';
            startGroup.innerHTML = `
                <label>시작일:</label>
                <input type="datetime-local" name="start" value="${item.start ? item.start.slice(0, 16) : ''}" required>
            `;
            this.dataForm.appendChild(startGroup);

            // 종료일
            const endGroup = document.createElement('div');
            endGroup.className = 'form-group';
            endGroup.innerHTML = `
                <label>종료일:</label>
                <input type="datetime-local" name="end" value="${item.end ? item.end.slice(0, 16) : ''}" required>
            `;
            this.dataForm.appendChild(endGroup);

            // 배경색
            const bgColorGroup = document.createElement('div');
            bgColorGroup.className = 'form-group';
            bgColorGroup.innerHTML = `
                <label>배경색:</label>
                <input type="color" name="backgroundColor" value="${item.backgroundColor || '#ffffff'}" required>
            `;
            this.dataForm.appendChild(bgColorGroup);

            // 글자색
            const textColorGroup = document.createElement('div');
            textColorGroup.className = 'form-group';
            textColorGroup.innerHTML = `
                <label>글자색:</label>
                <input type="color" name="textColor" value="${item.textColor || '#000000'}" required>
            `;
            this.dataForm.appendChild(textColorGroup);
        }
        else if (this.currentType === 'coupon') {
            // 쿠폰명(키)
            const nameGroup = document.createElement('div');
            nameGroup.className = 'form-group';
            nameGroup.innerHTML = `
                <label>쿠폰명:</label>
                <input type="text" name="쿠폰명" value="${item._name || ''}">
            `;
            this.dataForm.appendChild(nameGroup);

            // 기간, 쿠폰번호
            ['period', 'number'].forEach(field => {
                const group = document.createElement('div');
                group.className = 'form-group';
                group.innerHTML = `
                    <label>${field === 'period' ? '기간' : '쿠폰번호'}:</label>
                    <input type="text" name="${field}" value="${item[field] || ''}">
                `;
                this.dataForm.appendChild(group);
            });

            // 보상(items)
            const itemsGroup = document.createElement('div');
            itemsGroup.className = 'form-group';
            const itemsValue = Array.isArray(item.items) ? item.items.join('\n') : (item.items || '');
            itemsGroup.innerHTML = `
                <label>보상(줄바꿈으로 구분):</label>
                <textarea name="items" rows="8" style="width:100%">${itemsValue}</textarea>
            `;
            this.dataForm.appendChild(itemsGroup);
        }
        else if (this.currentType === 'deck') {
            // 덱이름(키)
            const nameGroup = document.createElement('div');
            nameGroup.className = 'form-group';
            nameGroup.innerHTML = `
                <label>덱이름:</label>
                <input type="text" name="덱이름" value="${item._name || ''}">
            `;
            this.dataForm.appendChild(nameGroup);

            // 디지몬(이름/레벨)
            const digimonGroup = document.createElement('div');
            digimonGroup.className = 'form-group';
            const digimonValue = Array.isArray(item.digimon) ? item.digimon.map(d => `${d.name},${d.level}`).join('\n') : (item.digimon || '');
            digimonGroup.innerHTML = `
                <label>디지몬(이름,레벨 한 줄씩):</label>
                <textarea name="digimon" rows="8" style="width:100%">${digimonValue}</textarea>
            `;
            this.dataForm.appendChild(digimonGroup);

            // 설명
            const descGroup = document.createElement('div');
            descGroup.className = 'form-group';
            descGroup.innerHTML = `
                <label>설명:</label>
                <input type="text" name="description" value="${item.description || ''}">
            `;
            this.dataForm.appendChild(descGroup);

            // 효과
            const effectsGroup = document.createElement('div');
            effectsGroup.className = 'form-group';
            const effectsValue = Array.isArray(item.effects) ? item.effects.join('\n') : (item.effects || '');
            effectsGroup.innerHTML = `
                <label>효과(줄바꿈으로 구분):</label>
                <textarea name="effects" rows="8" style="width:100%">${effectsValue}</textarea>
            `;
            this.dataForm.appendChild(effectsGroup);
        }
        else {
            (this.dynamicHeaders || []).forEach(header => {
                const value = item[header] || '';
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';

                const label = document.createElement('label');
                label.htmlFor = header;
                label.textContent = header + ':';

                const input = document.createElement('input');
                input.type = 'text';
                input.id = header;
                input.name = header;
                input.value = value;

                formGroup.appendChild(label);
                formGroup.appendChild(input);
                this.dataForm.appendChild(formGroup);
            });
        }

        // 버튼 그룹 추가
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        buttonGroup.innerHTML = `
            <button type="submit">저장</button>
            <button type="button" onclick="hideEditForm()">취소</button>
        `;
        this.dataForm.appendChild(buttonGroup);

        this.editForm.style.display = 'block';
    }

    hideEditForm() {
        this.editForm.style.display = 'none';
        this.dataForm.innerHTML = '';
    }

    editData(index) {
        if (this.currentType === 'coupon' || this.currentType === 'deck') {
            const entries = Object.entries(this.currentData);
            const key = entries[index][0];
            let item = entries[index][1];
            item = { ...(item || {}), _name: key };
            this.currentIndex = index;
            this.showEditForm(item);
            return;
        }
        let item = this.currentData[index];
        this.currentIndex = index;
        this.showEditForm(item);
    }

    saveData() {
        if (this.isCSV) {
            this.saveCSV();
        } else {
            this.saveJSON();
        }
    }

    async saveCSV() {
        const formData = new FormData(this.dataForm);
        const newItem = {};
        formData.forEach((value, key) => {
            newItem[key] = value;
        });

        if (this.currentIndex !== undefined) {
            this.currentData[this.currentIndex] = newItem;
        } else {
            this.currentData.push(newItem);
        }

        // characters.csv 정렬: evolution_stage(성장기,성숙기,완전체,궁극체) → name(가나다순)
        if (this.currentType === 'characters') {
            const stageOrder = ["성장기", "성숙기", "완전체", "궁극체"];
            this.currentData.sort((a, b) => {
                const stageA = stageOrder.indexOf(a.evolution_stage);
                const stageB = stageOrder.indexOf(b.evolution_stage);
                if (stageA !== stageB) return stageA - stageB;
                return a.name.localeCompare(b.name, 'ko');
            });
        }
        // condition.csv 정렬: evolution_stage(3,4,5,6) → name(가나다순)
        else if (this.currentType === 'condition') {
            const stageOrder = ["3", "4", "5", "6"];
            this.currentData.sort((a, b) => {
                const stageA = stageOrder.indexOf(a.evolution_stage);
                const stageB = stageOrder.indexOf(b.evolution_stage);
                if (stageA !== stageB) return stageA - stageB;
                return a.name.localeCompare(b.name, 'ko');
            });
        }
        // evolution.csv 정렬: evolution_stage(1~6) → name(가나다순)
        else if (this.currentType === 'evolution') {
            const stageOrder = ["1", "2", "3", "4", "5", "6"];
            this.currentData.sort((a, b) => {
                const stageA = stageOrder.indexOf(a.evolution_stage);
                const stageB = stageOrder.indexOf(b.evolution_stage);
                if (stageA !== stageB) return stageA - stageB;
                return a.name.localeCompare(b.name, 'ko');
            });
        }
        // skill1, skill2, skill3 정렬: evolution_stage(성장기,성숙기,완전체,궁극체) → name(가나다순)
        else if (["skill1", "skill2", "skill3"].includes(this.currentType)) {
            const stageOrder = ["성장기", "성숙기", "완전체", "궁극체"];
            this.currentData.sort((a, b) => {
                const stageA = stageOrder.indexOf(a.evolution_stage);
                const stageB = stageOrder.indexOf(b.evolution_stage);
                if (stageA !== stageB) return stageA - stageB;
                return a.name.localeCompare(b.name, 'ko');
            });
        }

        try {
            const csvContent = this.convertToCSV(this.currentData);
            const response = await fetch(`${API_URL}/api/save-csv/${this.currentType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csv: csvContent })
            });

            if (!response.ok) {
                throw new Error('데이터 저장 실패');
            }

            this.renderTable();
            this.hideEditForm();
            alert('데이터가 성공적으로 저장되었습니다.');
        } catch (error) {
            console.error('저장 실패:', error);
            alert('데이터 저장에 실패했습니다.');
        }
    }

    async saveJSON() {
        if (this.currentType === 'calendar') {
            const formData = new FormData(this.dataForm);
            const newItem = {
                title: formData.get('title'),
                start: formData.get('start') + ':00',
                end: formData.get('end') + ':00',
                backgroundColor: formData.get('backgroundColor'),
                textColor: formData.get('textColor')
            };

            if (this.currentIndex !== undefined) {
                this.currentData[this.currentIndex] = newItem;
            } else {
                this.currentData.push(newItem);
            }

            const jsonContent = JSON.stringify(this.currentData, null, 2);
            try {
                const response = await fetch(`${API_URL}/api/save-json/${this.currentType}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ json: jsonContent })
                });

                if (!response.ok) {
                    throw new Error('데이터 저장 실패');
                }

                this.renderTable();
                this.hideEditForm();
                alert('데이터가 성공적으로 저장되었습니다.');
            } catch (error) {
                console.error('저장 실패:', error);
                alert('데이터 저장에 실패했습니다.');
            }
            return;
        }
        if (this.currentType === 'coupon') {
            // coupon.json 저장 구조 변환
            const formData = new FormData(this.dataForm);
            const name = formData.get('쿠폰명');
            const period = formData.get('period');
            const number = formData.get('number');
            const items = (formData.get('items') || '').split(/\r?\n/).filter(x => x);
            let data = { ...this.currentData };
            const newItem = { period, number, items };
            if (this.currentIndex !== undefined) {
                // 수정: 기존 key를 찾아서 교체
                const oldName = Object.keys(data)[this.currentIndex];
                delete data[oldName];
            }
            data[name] = newItem;
            this.currentData = data;
            const jsonContent = JSON.stringify(this.currentData, null, 2);
            await fetch(`${API_URL}/api/save-json/${this.currentType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ json: jsonContent })
            });
            this.renderTable();
            this.hideEditForm();
            alert('데이터가 성공적으로 저장되었습니다.');
            return;
        }
        if (this.currentType === 'deck') {
            // deck.json 저장 구조 변환
            const formData = new FormData(this.dataForm);
            const name = formData.get('덱이름');
            const digimon = (formData.get('digimon') || '').split(/\r?\n/).filter(x => x).map(line => {
                const [n, l] = line.split(',');
                return { name: n?.trim() || '', level: Number(l) || 0 };
            });
            const description = formData.get('description');
            const effects = (formData.get('effects') || '').split(/\r?\n/).filter(x => x);
            let data = { ...this.currentData };
            const newItem = { digimon, description, effects };
            if (this.currentIndex !== undefined) {
                // 수정: 기존 key를 찾아서 교체
                const oldName = Object.keys(data)[this.currentIndex];
                delete data[oldName];
            }
            data[name] = newItem;
            this.currentData = data;
            const jsonContent = JSON.stringify(this.currentData, null, 2);
            await fetch(`${API_URL}/api/save-json/${this.currentType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ json: jsonContent })
            });
            this.renderTable();
            this.hideEditForm();
            alert('데이터가 성공적으로 저장되었습니다.');
            return;
        }
        // 기타 JSON(기존 방식)
        const jsonContent = JSON.stringify(this.currentData, null, 2);
        const response = await fetch(`${API_URL}/api/save-json/${this.currentType}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ json: jsonContent })
        });
        if (!response.ok) {
            throw new Error('데이터 저장 실패');
        }
        alert('데이터가 성공적으로 저장되었습니다.');
    }

    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(header => row[header]).join(','))
        ];
        
        return csvRows.join('\n');
    }

    async deleteData(index) {
        if (!confirm('정말로 이 항목을 삭제하시겠습니까?')) {
            return;
        }
        if (this.currentType === 'coupon' || this.currentType === 'deck') {
            const entries = Object.entries(this.currentData);
            const key = entries[index][0];
            delete this.currentData[key];
            const jsonContent = JSON.stringify(this.currentData, null, 2);
            try {
                const response = await fetch(`${API_URL}/api/save-json/${this.currentType}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ json: jsonContent })
                });
                if (!response.ok) {
                    throw new Error('데이터 삭제 실패');
                }
                this.renderTable();
                alert('데이터가 성공적으로 삭제되었습니다.');
            } catch (error) {
                console.error('삭제 실패:', error);
                alert('데이터 삭제에 실패했습니다.');
            }
            return;
        }
        this.currentData.splice(index, 1);
        try {
            const csvContent = this.convertToCSV(this.currentData);
            const response = await fetch(`${API_URL}/api/save-csv/characters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ csv: csvContent })
            });

            if (!response.ok) {
                throw new Error('데이터 삭제 실패');
            }

            this.renderTable();
            alert('데이터가 성공적으로 삭제되었습니다.');
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('데이터 삭제에 실패했습니다.');
        }
    }
}

// 전역 인스턴스 생성
const dataManager = new DataManager();

// 페이지 로드 시 데이터 로드
document.addEventListener('DOMContentLoaded', () => {
    dataManager.loadData();
});

// 전역 함수
function showAddForm() {
    dataManager.currentIndex = undefined;
    dataManager.showEditForm();
}

function hideEditForm() {
    dataManager.hideEditForm();
}

// 오버레이와 수정창 동기화
const editForm = document.getElementById('editForm');
const editOverlay = document.getElementById('editOverlay');
function showEditFormWithOverlay() {
    editForm.style.display = 'block';
    editOverlay.style.display = 'block';
}
function hideEditFormWithOverlay() {
    editForm.style.display = 'none';
    editOverlay.style.display = 'none';
    if (window.dataManager) dataManager.hideEditForm();
}
// editForm 열릴 때 오버레이도 같이 열기
const origShowEditForm = dataManager.showEditForm.bind(dataManager);
dataManager.showEditForm = function(item) {
    origShowEditForm(item);
    showEditFormWithOverlay();
};
// editForm 닫힐 때 오버레이도 같이 닫기
const origHideEditForm = dataManager.hideEditForm.bind(dataManager);
dataManager.hideEditForm = function() {
    origHideEditForm();
    hideEditFormWithOverlay();
};
function submitAdminPassword() {
    const pw = document.getElementById('adminPassword').value;
    fetch(`${API_URL}/api/admin-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw })
    })
    .then(res => {
        if (!res.ok) throw new Error('fail');
        return res.json();
    })
    .then(data => {
        if (data.success) {
            document.getElementById('admin-auth-modal').style.display = 'none';
            document.getElementById('admin-main').style.display = '';
        } else {
            document.getElementById('adminAuthError').innerText = '비밀번호가 틀렸습니다.';
        }
    })
    .catch(() => {
        document.getElementById('adminAuthError').innerText = '비밀번호가 틀렸습니다.';
    });
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('adminPassword').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') submitAdminPassword();
    });
}); 