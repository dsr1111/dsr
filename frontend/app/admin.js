// API_URL 제거
// const API_URL = 'https://port-0-dsr-m85aqy8qfc2589fd.sel4.cloudtype.app';

// 데이터 관리 클래스
class DataManager {
    constructor() {
        this.currentData = [];
        this.currentType = 'digimon';
        this.editForm = document.getElementById('editForm');
        this.dataForm = document.getElementById('dataForm');
        this.dataTypeSelect = document.getElementById('dataTypeSelect');
        this.isCSV = false;
        this.dynamicHeaders = [];
        this.hasUnsavedChanges = false;
        this.currentIndex = null;
        
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
        
        // digimon.json 전용 테이블
        if (this.currentType === 'digimon') {
            tableHead.innerHTML = `
                <th>이름</th>
                <th>진화단계</th>
                <th>타입</th>
                <th>레벨</th>
                <th>HP</th>
                <th>SP</th>
                <th>힘</th>
                <th>지능</th>
                <th>수비</th>
                <th>저항</th>
                <th>속도</th>
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
            
            this.currentData.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name?.[0] || ''}</td>
                    <td>${item.evolution_stage?.[0] || ''}</td>
                    <td>${item.type?.[0] || ''}</td>
                    <td>${item.레벨 || ''}</td>
                    <td>${item.HP || ''}</td>
                    <td>${item.SP || ''}</td>
                    <td>${item.힘 || ''}</td>
                    <td>${item.지능 || ''}</td>
                    <td>${item.수비 || ''}</td>
                    <td>${item.저항 || ''}</td>
                    <td>${item.속도 || ''}</td>
                    <td>${item.강점?.[0] || ''}</td>
                    <td>${item.강점효과?.[0] || ''}</td>
                    <td>${item.약점?.[0] || ''}</td>
                    <td>${item.약점효과?.[0] || ''}</td>
                    <td>${Array.isArray(item.필드) ? item.필드.join(', ') : ''}</td>
                    <td>${item.skills?.skill1?.skillName?.[0] || ''}</td>
                    <td>${item.skills?.skill2?.skillName?.[0] || ''}</td>
                    <td>${item.skills?.skill3?.skillName?.[0] || ''}</td>
                    <td>
                        <button onclick="dataManager.editData(${index})">수정</button>
                        <button onclick="dataManager.deleteData(${index})">삭제</button>
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

        if (this.currentType === 'digimon') {
            const fields = [
                { name: 'name', label: '이름', type: 'text', required: true },
                { name: 'evolution_stage', label: '진화단계', type: 'select', options: ['성장기', '성숙기', '완전체', '궁극체'], required: true },
                { name: 'type', label: '타입', type: 'select', options: ['바이러스', '백신', '데이터', '프리', '언노운'], required: true },
                { name: '레벨', label: '레벨', type: 'number', required: true },
                { name: 'HP', label: 'HP', type: 'number', required: true },
                { name: 'SP', label: 'SP', type: 'number', required: true },
                { name: '힘', label: '힘', type: 'number', required: true },
                { name: '지능', label: '지능', type: 'number', required: true },
                { name: '수비', label: '수비', type: 'number', required: true },
                { name: '저항', label: '저항', type: 'number', required: true },
                { name: '속도', label: '속도', type: 'number', required: true },
                { name: '강점', label: '강점', type: 'select', options: ['어둠', '얼음', '불', '바람', '물', '물리', '천둥', '흙', '나무', '강철', '빛'], required: false },
                { name: '강점효과', label: '강점효과', type: 'select', options: ['반사', '회피', '내성'], required: false },
                { name: '약점', label: '약점', type: 'select', options: ['어둠', '얼음', '불', '바람', '물', '물리', '천둥', '흙', '나무', '강철', '빛'], required: false },
                { name: '약점효과', label: '약점효과', type: 'select', options: ['약점', '회피불가', '효과확률'], required: false }
            ];

            fields.forEach(field => {
                const group = document.createElement('div');
                group.className = 'form-group';
                
                if (field.type === 'select') {
                    group.innerHTML = `
                        <label>${field.label}:</label>
                        <select name="${field.name}" ${field.required ? 'required' : ''}>
                            <option value="">선택 안함</option>
                            ${field.options.map(opt => `
                                <option value="${opt}" ${(item[field.name]?.[0] === opt) ? 'selected' : ''}>${opt}</option>
                            `).join('')}
                        </select>
                    `;
                } else {
                    group.innerHTML = `
                        <label>${field.label}:</label>
                        <input type="${field.type}" name="${field.name}" 
                            value="${field.type === 'number' ? (item[field.name] || '') : (item[field.name]?.[0] || '')}"
                            ${field.required ? 'required' : ''}>
                    `;
                }
                this.dataForm.appendChild(group);
            });

            // 필드 입력 (쉼표로 구분된 여러 값)
            const fieldGroup = document.createElement('div');
            fieldGroup.className = 'form-group';
            const fieldValue = Array.isArray(item.필드) ? item.필드.join(', ') : (item.필드?.[0] || '');
            fieldGroup.innerHTML = `
                <label>필드 (쉼표로 구분):</label>
                <input type="text" name="필드" value="${fieldValue}">
            `;
            this.dataForm.appendChild(fieldGroup);

            // 스킬 입력 필드 추가
            ['skill1', 'skill2', 'skill3'].forEach((skillKey, index) => {
                const skillGroup = document.createElement('div');
                skillGroup.className = 'form-group';
                skillGroup.style.border = '1px solid #ddd';
                skillGroup.style.padding = '10px';
                skillGroup.style.marginBottom = '15px';
                skillGroup.style.borderRadius = '5px';

                const skillName = item.skills?.[skillKey]?.skillName?.[0] || '';
                const skillCoefficients = item.skills?.[skillKey] || {};
                
                skillGroup.innerHTML = `
                    <h3 style="margin-top: 0;">스킬${index + 1}</h3>
                    <div class="form-group">
                        <label>스킬명:</label>
                        <input type="text" name="${skillKey}_name" 
                            value="${skillName}">
                    </div>
                    <div class="form-group">
                        <label>타수:</label>
                        <input type="number" name="${skillKey}_타수" 
                            value="${skillCoefficients.타수 || 1}"
                            min="1" max="10">
                    </div>
                    <div class="form-group">
                        <label>범위:</label>
                        <select name="${skillKey}_범위">
                            <option value="">선택 안함</option>
                            <option value="근거리" ${skillCoefficients.범위?.[0] === '근거리' ? 'selected' : ''}>근거리</option>
                            <option value="원거리" ${skillCoefficients.범위?.[0] === '원거리' ? 'selected' : ''}>원거리</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>속성:</label>
                        <select name="${skillKey}_속성">
                            <option value="">선택 안함</option>
                            <option value="어둠" ${skillCoefficients.속성?.[0] === '어둠' ? 'selected' : ''}>어둠</option>
                            <option value="얼음" ${skillCoefficients.속성?.[0] === '얼음' ? 'selected' : ''}>얼음</option>
                            <option value="불" ${skillCoefficients.속성?.[0] === '불' ? 'selected' : ''}>불</option>
                            <option value="바람" ${skillCoefficients.속성?.[0] === '바람' ? 'selected' : ''}>바람</option>
                            <option value="물" ${skillCoefficients.속성?.[0] === '물' ? 'selected' : ''}>물</option>
                            <option value="물리" ${skillCoefficients.속성?.[0] === '물리' ? 'selected' : ''}>물리</option>
                            <option value="천둥" ${skillCoefficients.속성?.[0] === '천둥' ? 'selected' : ''}>천둥</option>
                            <option value="흙" ${skillCoefficients.속성?.[0] === '흙' ? 'selected' : ''}>흙</option>
                            <option value="나무" ${skillCoefficients.속성?.[0] === '나무' ? 'selected' : ''}>나무</option>
                            <option value="강철" ${skillCoefficients.속성?.[0] === '강철' ? 'selected' : ''}>강철</option>
                            <option value="빛" ${skillCoefficients.속성?.[0] === '빛' ? 'selected' : ''}>빛</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>대상:</label>
                        <select name="${skillKey}_target">
                            <option value="">선택 안함</option>
                            <option value="적" ${skillCoefficients.target?.[0] === '적' ? 'selected' : ''}>적</option>
                            <option value="아군" ${skillCoefficients.target?.[0] === '아군' ? 'selected' : ''}>아군</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>대상 수:</label>
                        <select name="${skillKey}_targetCount">
                            <option value="">선택 안함</option>
                            <option value="단일" ${skillCoefficients.targetCount?.[0] === '단일' ? 'selected' : ''}>단일</option>
                            <option value="전체" ${skillCoefficients.targetCount?.[0] === '전체' ? 'selected' : ''}>전체</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>스킬 계수 (1~10레벨):</label>
                        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px;">
                            ${[1,2,3,4,5,6,7,8,9,10].map(level => `
                                <div>
                                    <label style="font-size: 12px;">Lv.${level}</label>
                                    <input type="number" name="${skillKey}_coefficient_${level}" 
                                        value="${skillCoefficients[level] || 0}"
                                        step="0.0001" min="0" max="10"
                                        style="width: 100%;">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                this.dataForm.appendChild(skillGroup);
            });
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
        // 디지몬 데이터의 경우 skills 객체를 깊은 복사
        if (this.currentType === 'digimon') {
            item = {
                ...item,
                skills: item.skills ? {
                    skill1: { ...item.skills.skill1 },
                    skill2: { ...item.skills.skill2 },
                    skill3: { ...item.skills.skill3 }
                } : {}
            };
        }
        this.currentIndex = index;
        this.showEditForm(item);
    }

    saveToTable() {
        if (this.currentType === 'digimon') {
            const formData = new FormData(this.dataForm);
            const newItem = {};
            
            // 필수 필드들 먼저 처리
            const requiredFields = {
                name: formData.get('name'),
                evolution_stage: formData.get('evolution_stage'),
                type: formData.get('type'),
                레벨: formData.get('레벨'),
                HP: formData.get('HP'),
                SP: formData.get('SP'),
                힘: formData.get('힘'),
                지능: formData.get('지능'),
                수비: formData.get('수비'),
                저항: formData.get('저항'),
                속도: formData.get('속도')
            };

            // 필수 필드 검증
            const missingFields = Object.entries(requiredFields)
                .filter(([_, value]) => !value)
                .map(([key]) => key);

            if (missingFields.length > 0) {
                alert(`다음 필수 필드를 입력해주세요: ${missingFields.join(', ')}`);
                return;
            }

            // 배열로 저장해야 하는 필드들
            ['name', 'evolution_stage', 'type'].forEach(field => {
                newItem[field] = [requiredFields[field]];
            });

            // 숫자 필드들
            ['레벨', 'HP', 'SP', '힘', '지능', '수비', '저항', '속도'].forEach(field => {
                newItem[field] = parseInt(requiredFields[field]);
            });

            // 선택적 배열 필드들
            const optionalArrayFields = ['강점', '강점효과', '약점', '약점효과'];
            optionalArrayFields.forEach(field => {
                const value = formData.get(field);
                if (value) {
                    newItem[field] = [value];
                }
            });

            // 필드 (쉼표로 구분된 문자열을 배열로 변환)
            const fieldValue = formData.get('필드');
            if (fieldValue) {
                newItem.필드 = fieldValue.split(',').map(f => f.trim()).filter(f => f);
            }

            // 스킬 정보
            newItem.skills = {};
            ['skill1', 'skill2', 'skill3'].forEach(skillKey => {
                const skillName = formData.get(`${skillKey}_name`);
                if (skillName) {
                    // 기존 스킬 데이터 가져오기
                    const existingSkill = this.currentData[this.currentIndex]?.skills?.[skillKey] || {};
                    
                    const skill = {
                        ...existingSkill, // 기존 스킬 데이터 유지
                        skillName: [skillName],
                        evolution_stage: [newItem.evolution_stage[0]]
                    };

                    // 타수
                    const 타수 = formData.get(`${skillKey}_타수`);
                    if (타수) {
                        skill.타수 = parseInt(타수);
                    }

                    // 범위
                    const 범위 = formData.get(`${skillKey}_범위`);
                    if (범위) {
                        skill.범위 = [범위];
                    }

                    // 속성
                    const 속성 = formData.get(`${skillKey}_속성`);
                    if (속성) {
                        skill.속성 = [속성];
                    }

                    // 대상
                    const target = formData.get(`${skillKey}_target`);
                    if (target) {
                        skill.target = [target];
                    }

                    // 대상 수
                    const targetCount = formData.get(`${skillKey}_targetCount`);
                    if (targetCount) {
                        skill.targetCount = [targetCount];
                    }

                    // 스킬 계수 추가
                    for (let level = 1; level <= 10; level++) {
                        const coefficient = parseFloat(formData.get(`${skillKey}_coefficient_${level}`));
                        if (!isNaN(coefficient)) {
                            skill[level] = coefficient;
                        }
                    }

                    newItem.skills[skillKey] = skill;
                }
            });

            console.log('새로 추가할 아이템:', newItem);
            console.log('현재 데이터 길이:', this.currentData.length);

            if (this.currentIndex != null) {
                // 수정인 경우 기존 데이터와 병합
                this.currentData[this.currentIndex] = {
                    ...this.currentData[this.currentIndex],
                    ...newItem
                };
            } else {
                // 새로 추가하는 경우
                this.currentData = [...this.currentData, newItem];
            }

            console.log('추가 후 데이터 길이:', this.currentData.length);
            console.log('마지막 아이템:', this.currentData[this.currentData.length - 1]);

            // 진화단계와 이름으로 정렬
            const stageOrder = ["성장기", "성숙기", "완전체", "궁극체"];
            this.currentData.sort((a, b) => {
                const stageA = stageOrder.indexOf(a.evolution_stage[0]);
                const stageB = stageOrder.indexOf(b.evolution_stage[0]);
                if (stageA !== stageB) return stageA - stageB;
                return a.name[0].localeCompare(b.name[0], 'ko');
            });

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

    async deleteData(index) {
        if (!confirm('정말로 이 항목을 삭제하시겠습니까?')) {
            return;
        }
        this.currentData.splice(index, 1);
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
    dataManager.currentIndex = null;
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