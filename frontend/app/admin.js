// API_URL 제거
// const API_URL = 'https://port-0-dsr-m85aqy8qfc2589fd.sel4.cloudtype.app';

// 데이터 관리 클래스
class DataManager {
    constructor() {
        this.currentData = {}; // digimon.json이 객체이므로 초기값을 객체로 변경
        this.currentType = 'digimon';
        this.editForm = document.getElementById('editForm');
        this.dataForm = document.getElementById('dataForm');
        this.dataTypeSelect = document.getElementById('dataTypeSelect');
        this.isCSV = false; // digimon.json은 CSV가 아님
        this.dynamicHeaders = [];
        this.hasUnsavedChanges = false;
        this.currentIndex = null; // 객체 기반이므로 인덱스 대신 이름(키)을 저장할 수 있음
        this.currentName = null; // 현재 수정 중인 디지몬의 이름
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 폼 제출 이벤트
        this.dataForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveToTable();
        });
        this.dataTypeSelect.addEventListener('change', (e) => {
            if (this.hasUnsavedChanges) {
                if (!confirm('저장되지 않은 변경사항이 있습니다. 계속하시겠습니까?')) {
                    this.dataTypeSelect.value = this.currentType;
                    return;
                }
            }
            this.currentType = e.target.value;
            this.loadData();
        });
    }

    async loadData() {
        try {
            const response = await fetch(`data/csv/${this.currentType}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.currentData = await response.json();
            this.renderTable();
            this.hasUnsavedChanges = false;
            this.updateSaveButton();
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            alert('데이터를 불러오는데 실패했습니다.');
        }
    }

    renderTable() {
        const tableBody = document.getElementById('dataTableBody');
        const tableHead = document.querySelector('.data-table thead tr');
        tableBody.innerHTML = '';
        
        // digimon.json 전용 테이블
        if (this.currentType === 'digimon') {
            tableHead.innerHTML = `
                <th>이름</th>
                <th>진화단계</th>
                <th>타입</th>
                <th>레벨</th>
                <th>HP</th>
                <th>SP</th>
                <th>STR</th>
                <th>INT</th>
                <th>DEF</th>
                <th>RES</th>
                <th>SPD</th>
                <th>강점</th>
                <th>강점효과</th>
                <th>약점</th>
                <th>약점효과</th>
                <th>필드</th>
                <th>스킬1</th>
                <th>스킬2</th>
                <th>스킬3</th>
                <th>관리</th>
            `;
            
            // 객체를 배열로 변환하여 정렬
            const digimonArray = Object.entries(this.currentData).map(([name, data]) => ({ name, ...data }));

            const evolutionOrder = ["성장기", "성숙기", "완전체", "궁극체"];
            digimonArray.sort((a, b) => {
                const stageA = evolutionOrder.indexOf(a.evolution_stage);
                const stageB = evolutionOrder.indexOf(b.evolution_stage);
                if (stageA !== stageB) return stageA - stageB;
                return a.name.localeCompare(b.name, 'ko');
            });

            digimonArray.forEach((item) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name || ''}</td>
                    <td>${item.evolution_stage || ''}</td>
                    <td>${item.type || ''}</td>
                    <td>${item.stats?.level || ''}</td>
                    <td>${item.stats?.hp || ''}</td>
                    <td>${item.stats?.sp || ''}</td>
                    <td>${item.stats?.STR || ''}</td>
                    <td>${item.stats?.INT || ''}</td>
                    <td>${item.stats?.DEF || ''}</td>
                    <td>${item.stats?.RES || ''}</td>
                    <td>${item.stats?.SPD || ''}</td>
                    <td>${item.strengths?.attribute || ''}</td>
                    <td>${item.strengths?.effect || ''}</td>
                    <td>${item.weaknesses?.attribute || ''}</td>
                    <td>${item.weaknesses?.effect || ''}</td>
                    <td>${Array.isArray(item.fields) ? item.fields.join(', ') : ''}</td>
                    <td>${item.skills?.[0]?.name || ''}</td>
                    <td>${item.skills?.[1]?.name || ''}</td>
                    <td>${item.skills?.[2]?.name || ''}</td>
                    <td>
                        <button onclick="dataManager.editData('${item.name}')">수정</button>
                        <button onclick="dataManager.deleteData('${item.name}')">삭제</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            return;
        }

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

        Object.values(this.currentData).forEach((item, index) => { // 객체이므로 values 사용
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

    showEditForm(digimonName = null) {
        this.dataForm.innerHTML = '';
        this.currentName = digimonName;
        const item = digimonName ? this.currentData[digimonName] : {};

        if (this.currentType === 'digimon') {
            const fields = [
                { name: 'name', label: '이름', type: 'text', required: true, value: digimonName || '' },
                { name: 'evolution_stage', label: '진화단계', type: 'select', options: ['성장기', '성숙기', '완전체', '궁극체', '초궁극체', '조그레스', '특수'], value: item.evolution_stage || '' },
                { name: 'type', label: '타입', type: 'select', options: ['바이러스', '백신', '데이터', '프리', '언노운', 'NO DATA'], value: item.type || '' },
                { name: 'level', label: '레벨', type: 'number', value: item.stats?.level || 0 },
                { name: 'hp', label: 'HP', type: 'number', value: item.stats?.hp || 0 },
                { name: 'sp', label: 'SP', type: 'number', value: item.stats?.sp || 0 },
                { name: 'STR', label: '힘 (STR)', type: 'number', value: item.stats?.STR || 0 },
                { name: 'INT', label: '지능 (INT)', type: 'number', value: item.stats?.INT || 0 },
                { name: 'DEF', label: '수비 (DEF)', type: 'number', value: item.stats?.DEF || 0 },
                { name: 'RES', label: '저항 (RES)', type: 'number', value: item.stats?.RES || 0 },
                { name: 'SPD', label: '속도 (SPD)', type: 'number', value: item.stats?.SPD || 0 },
                { name: 'strength_attribute', label: '강점 속성', type: 'text', value: item.strengths?.attribute || '' },
                { name: 'strength_effect', label: '강점 효과', type: 'text', value: item.strengths?.effect || '' },
                { name: 'weakness_attribute', label: '약점 속성', type: 'text', value: item.weaknesses?.attribute || '' },
                { name: 'weakness_effect', label: '약점 효과', type: 'text', value: item.weaknesses?.effect || '' },
                { name: 'fields', label: '필드 (쉼표로 구분)', type: 'text', value: Array.isArray(item.fields) ? item.fields.join(', ') : '' }
            ];

            fields.forEach(field => {
                const group = document.createElement('div');
                group.className = 'form-group';
                
                if (field.type === 'select') {
                    group.innerHTML = `
                        <label>${field.label}:</label>
                        <select name="${field.name}" ${field.required ? 'required' : ''}>
                            ${field.options.map(opt => `
                                <option value="${opt}" ${(field.value === opt) ? 'selected' : ''}>${opt}</option>
                            `).join('')}
                        </select>
                    `;
                } else {
                    group.innerHTML = `
                        <label>${field.label}:</label>
                        <input type="${field.type}" name="${field.name}" 
                            value="${field.value}"
                            ${field.required ? 'required' : ''}>
                    `;
                }
                this.dataForm.appendChild(group);
            });

            // 스킬 입력 필드 추가
            for (let i = 0; i < 3; i++) {
                const skill = item.skills?.[i] || {};
                const skillGroup = document.createElement('div');
                skillGroup.className = 'form-group';
                skillGroup.style.border = '1px solid #ddd';
                skillGroup.style.padding = '10px';
                skillGroup.style.marginBottom = '15px';
                skillGroup.style.borderRadius = '5px';

                skillGroup.innerHTML = `
                    <h3 style="margin-top: 0;">스킬 ${i + 1}</h3>
                    <div class="form-group">
                        <label>스킬명:</label>
                        <input type="text" name="skill${i}_name" value="${skill.name || ''}">
                    </div>
                    <div class="form-group">
                        <label>타수:</label>
                        <input type="number" name="skill${i}_hits" value="${skill.hits || 1}" min="1">
                    </div>
                    <div class="form-group">
                        <label>범위:</label>
                        <input type="text" name="skill${i}_range" value="${skill.range || ''}">
                    </div>
                    <div class="form-group">
                        <label>속성:</label>
                        <input type="text" name="skill${i}_attribute" value="${skill.attribute || ''}">
                    </div>
                    <div class="form-group">
                        <label>대상 수:</label>
                        <input type="text" name="skill${i}_target_count" value="${skill.target_count || ''}">
                    </div>
                    <div class="form-group">
                        <label>효과:</label>
                        <input type="text" name="skill${i}_effect" value="${skill.effect || ''}">
                    </div>
                    <div class="form-group">
                        <label>추가 시전 턴:</label>
                        <input type="number" name="skill${i}_additionalTurn" value="${skill.additionalTurn || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>계수 (쉼표로 구분, 10개):</label>
                        <input type="text" name="skill${i}_multipliers" value="${(skill.multipliers || Array(10).fill(0)).join(',')}">
                    </div>
                `;
                this.dataForm.appendChild(skillGroup);
            }
        }
        else if (this.currentType === 'calendar') {
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

            // 색상 미리보기 컨테이너
            const previewContainer = document.createElement('div');
            previewContainer.className = 'form-group';
            previewContainer.style.marginBottom = '20px';
            previewContainer.innerHTML = `
                <label>색상 미리보기:</label>
                <div id="colorPreview" style="padding: 15px; border-radius: 8px; margin-top: 8px; text-align: center; font-weight: bold;">
                    색상 미리보기 텍스트
                </div>
            `;
            this.dataForm.appendChild(previewContainer);

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

            // 색상 미리보기 업데이트 함수
            const updateColorPreview = () => {
                const bgColor = this.dataForm.querySelector('[name="backgroundColor"]').value;
                const textColor = this.dataForm.querySelector('[name="textColor"]').value;
                const preview = document.getElementById('colorPreview');
                preview.style.backgroundColor = bgColor;
                preview.style.color = textColor;
            };

            // 초기 미리보기 설정
            updateColorPreview();

            // 색상 변경 이벤트 리스너 추가
            this.dataForm.querySelector('[name="backgroundColor"]').addEventListener('input', updateColorPreview);
            this.dataForm.querySelector('[name="textColor"]').addEventListener('input', updateColorPreview);
        }
        else if (this.currentType === 'coupon') {
            // 쿠폰명(키)
            const nameGroup = document.createElement('div');
            nameGroup.className = 'form-group';
            nameGroup.innerHTML = `
                <label>쿠폰명:</label>
                <input type="text" name="쿠폰명" value="${item._name || ''}" required>
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
                <input type="text" name="덱이름" value="${item._name || ''}" required>
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

    editData(name) {
        this.currentName = name;
        const item = this.currentData[name];
        this.showEditForm(item);
    }

    saveToTable() {
        if (this.currentType === 'digimon') {
            const formData = new FormData(this.dataForm);
            const name = formData.get('name');
            if (!name) {
                alert('디지몬 이름을 입력해주세요.');
                return;
            }

            const newDigimon = {
                evolution_stage: formData.get('evolution_stage'),
                type: formData.get('type'),
                stats: {
                    level: parseInt(formData.get('level')) || 0,
                    hp: parseInt(formData.get('hp')) || 0,
                    sp: parseInt(formData.get('sp')) || 0,
                    STR: parseInt(formData.get('STR')) || 0,
                    INT: parseInt(formData.get('INT')) || 0,
                    DEF: parseInt(formData.get('DEF')) || 0,
                    RES: parseInt(formData.get('RES')) || 0,
                    SPD: parseInt(formData.get('SPD')) || 0
                },
                strengths: {
                    attribute: formData.get('strength_attribute') || '',
                    effect: formData.get('strength_effect') || ''
                },
                weaknesses: {
                    attribute: formData.get('weakness_attribute') || '',
                    effect: formData.get('weakness_effect') || ''
                },
                fields: formData.get('fields') ? formData.get('fields').split(',').map(f => f.trim()).filter(f => f) : [],
                skills: []
            };

            for (let i = 0; i < 3; i++) {
                const skillName = formData.get(`skill${i}_name`);
                if (skillName) {
                    const multipliers_str = formData.get(`skill${i}_multipliers`);
                    let multipliers = [];
                    try {
                        multipliers = multipliers_str.split(',').map(m => parseFloat(m.trim()));
                        if (multipliers.some(isNaN)) throw new Error('Invalid multiplier value');
                    } catch (e) {
                        alert(`스킬 ${i + 1}의 계수 형식이 올바르지 않습니다. (예: 0.1,0.2,0.3)`);
                        return;
                    }

                    newDigimon.skills.push({
                        name: skillName,
                        hits: parseInt(formData.get(`skill${i}_hits`)) || 1,
                        range: formData.get(`skill${i}_range`) || '',
                        attribute: formData.get(`skill${i}_attribute`) || '',
                        target_count: formData.get(`skill${i}_target_count`) || '',
                        effect: formData.get(`skill${i}_effect`) || undefined,
                        additionalTurn: parseInt(formData.get(`skill${i}_additionalTurn`)) || undefined,
                        multipliers: multipliers
                    });
                }
            }

            // 기존 이름과 다르면 기존 항목 삭제
            if (this.currentName && this.currentName !== name) {
                delete this.currentData[this.currentName];
            }
            this.currentData[name] = newDigimon;

            // 정렬
            const sortedData = {};
            const evolutionOrder = ["성장기", "성숙기", "완전체", "궁극체", "초궁극체", "조그레스", "특수"];
            
            const digimonArray = Object.entries(this.currentData).map(([name, data]) => ({ name, ...data }));
            digimonArray.sort((a, b) => {
                const stageA = evolutionOrder.indexOf(a.evolution_stage);
                const stageB = evolutionOrder.indexOf(b.evolution_stage);
                if (stageA !== stageB) return stageA - stageB;
                return a.name.localeCompare(b.name, 'ko');
            });
            digimonArray.forEach(item => {
                sortedData[item.name] = { ...item };
                delete sortedData[item.name].name; // 이름 필드는 키로 사용되므로 중복 제거
            });
            this.currentData = sortedData;

            this.renderTable();
            this.hideEditForm();
            this.hasUnsavedChanges = true;
            this.updateSaveButton();
        }
        else if (this.isCSV) {
            this.saveToTableCSV();
        } else {
            this.saveToTableJSON();
        }
    }

    saveToTableCSV() {
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

        this.renderTable();
        this.hideEditForm();
        this.hasUnsavedChanges = true;
        this.updateSaveButton();
    }

    saveToTableJSON() {
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
        }
        else if (this.currentType === 'coupon') {
            const formData = new FormData(this.dataForm);
            const name = formData.get('쿠폰명');
            if (!name) {
                alert('쿠폰명을 입력해주세요.');
                return;
            }
            const period = formData.get('period');
            const number = formData.get('number');
            const items = (formData.get('items') || '').split(/\r?\n/).filter(x => x);
            let data = { ...this.currentData };
            const newItem = { period, number, items };
            if (this.currentIndex !== undefined) {
                const oldName = Object.keys(data)[this.currentIndex];
                delete data[oldName];
            }
            data[name] = newItem;
            this.currentData = data;
        }
        else if (this.currentType === 'deck') {
            const formData = new FormData(this.dataForm);
            const name = formData.get('덱이름');
            if (!name) {
                alert('덱이름을 입력해주세요.');
                return;
            }
            const digimon = (formData.get('digimon') || '').split(/\r?\n/).filter(x => x).map(line => {
                const [n, l] = line.split(',');
                return { name: n?.trim() || '', level: Number(l) || 0 };
            });
            const description = formData.get('description');
            const effects = (formData.get('effects') || '').split(/\r?\n/).filter(x => x);
            let data = { ...this.currentData };
            const newItem = { digimon, description, effects };
            if (this.currentIndex !== undefined) {
                const oldName = Object.keys(data)[this.currentIndex];
                delete data[oldName];
            }
            data[name] = newItem;
            
            // 덱이름 기준으로 정렬
            const sortedData = {};
            Object.keys(data)
                .sort((a, b) => a.localeCompare(b, 'ko'))
                .forEach(key => {
                    sortedData[key] = data[key];
                });
            
            this.currentData = sortedData;
        }

        this.renderTable();
        this.hideEditForm();
        this.hasUnsavedChanges = true;
        this.updateSaveButton();
    }

    async saveToGitHub() {
        try {
            console.log('저장할 데이터:', this.currentData);
            const jsonContent = JSON.stringify(this.currentData, null, 2);
            
            // 파일 다운로드 링크 생성
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentType}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.hasUnsavedChanges = false;
            this.updateSaveButton();
            alert('JSON 파일이 다운로드되었습니다. 파일을 data/csv 폴더에 저장해주세요.');
        } catch (error) {
            console.error('저장 실패:', error);
            alert('데이터 저장에 실패했습니다.');
        }
    }

    updateSaveButton() {
        const saveButton = document.getElementById('saveToGitHub');
        if (this.hasUnsavedChanges) {
            saveButton.style.display = 'inline-block';
            saveButton.style.backgroundColor = '#ff4444';
        } else {
            saveButton.style.display = 'none';
        }
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

    async deleteData(name) {
        if (!confirm('정말로 이 항목을 삭제하시겠습니까?')) {
            return;
        }
        delete this.currentData[name];
        this.renderTable();
        this.hasUnsavedChanges = true;
        this.updateSaveButton();
    }
}

// 전역 인스턴스 생성
const dataManager = new DataManager();

// 페이지 로드 시 데이터 로드
document.addEventListener('DOMContentLoaded', () => {
    dataManager.loadData();
});

// 전역 함수들
function showAddForm() {
    dataManager.currentName = null; // 추가 모드
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