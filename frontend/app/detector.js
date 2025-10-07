
let detectorData = null;
let selectedDetector = null;
let selectedDigimon = null;

// JSON 데이터 로드
fetch('https://media.dsrwiki.com/data/csv/detector.json')
    .then(response => response.json())
    .then(data => {
        detectorData = data;
        populateDetectorGrid();
    });

// 탐지기 버튼 그리드 생성
function populateDetectorGrid() {
    const detectorGrid = document.getElementById('detectorGrid');
    detectorGrid.innerHTML = '';
    Object.keys(detectorData).forEach(detector => {
        // 상자 관련 항목과 작은 사랑의 꾸러미 제외
        if (!detector.includes('균열 데이터 상자') && detector !== '작은 사랑의 꾸러미' && detector !== '분노에 잠식된 꾸러미' && detector !== '검은 날개의 꾸러미' && detector !== '정의의 상자') {
            const button = document.createElement('button');
            button.className = 'detector-button';
            button.dataset.detector = detector;
            // 변조된 스파이럴 탐지기는 스파이럴 탐지기 이미지 사용
            let imgSrc = `https://media.dsrwiki.com/dsrwiki/item/${detector}.webp`;
            if (detector.replace(/\s/g, '') === '변조된스파이럴탐지기') {
                imgSrc = 'https://media.dsrwiki.com/dsrwiki/item/스파이럴 탐지기.webp';
            }
            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = detector;
            const span = document.createElement('span');
            span.textContent = detector;
            button.appendChild(img);
            button.appendChild(span);
            button.addEventListener('click', () => {
                // 이전에 선택된 버튼의 스타일 제거
                const prevSelected = document.querySelector('.detector-button.selected');
                if (prevSelected) prevSelected.classList.remove('selected');
                button.classList.add('selected');
                selectedDetector = detector;
                selectedDigimon = null;
                populateDigimonGrid(detector);
                document.getElementById('digimonGrid').classList.remove('hidden');
                document.getElementById('mapContainer').classList.add('hidden');
            });
            detectorGrid.appendChild(button);
        }
    });
}

// 디지몬 버튼 그리드 생성
function populateDigimonGrid(detector) {
    const digimonGrid = document.getElementById('digimonGrid');
    digimonGrid.innerHTML = '';
    document.getElementById('digimonInfoCard').classList.add('hidden');
    document.getElementById('digimonInfoCard').innerHTML = '';
    document.getElementById('digimonMechanicCard').classList.add('hidden');
    document.getElementById('digimonMechanicCard').innerHTML = '';
    const digimons = detectorData[detector]['악역 디지몬'];
    Object.keys(digimons).forEach(digimon => {
        if (digimon !== '베놈묘티스몬' && digimon !== '베리얼묘티스몬' && digimon !== '로제몬:버스트모드' && digimon !== '마왕몬' && digimon !== '레이브몬:버스트모드' && digimon !== '반쵸레오몬:버스트모드' && digimon !== '크레니엄몬' && digimon !== '주작몬' && digimon !== '청룡몬') {
            const button = document.createElement('button');
            button.className = 'digimon-button';
            button.dataset.digimon = digimon;
            const imgBg = document.createElement('div');
            imgBg.className = 'digimon-img-bg';
            const img = document.createElement('img');
            img.src = `https://media.dsrwiki.com/dsrwiki/digimon/${digimon}/${digimon}.webp`;
            img.alt = digimon;
            imgBg.appendChild(img);
            const span = document.createElement('span');
            span.textContent = digimon;
            button.appendChild(imgBg);
            button.appendChild(span);
            button.addEventListener('click', () => {
                // 이전에 선택된 버튼의 스타일 제거
                const prevSelected = document.querySelector('.digimon-button.selected');
                if (prevSelected) prevSelected.classList.remove('selected');
                button.classList.add('selected');
                selectedDigimon = digimon;
                showMapAndMarker(selectedDetector, selectedDigimon);
                showDigimonInfo(selectedDetector, selectedDigimon);

                // 안드로몬이 아닌 다른 디지몬 선택 시 크레니엄몬 버튼 제거
                if (digimon !== '안드로몬' && detector === '보급형 탐지기') {
                    const venomButton = document.querySelector('.digimon-button[data-digimon="크레니엄몬"]');
                    if (venomButton) {
                        venomButton.remove();
                    }
                }

                // 묘티스몬이 아닌 다른 디지몬 선택 시 베놈묘티스몬 버튼 제거
                if (digimon !== '묘티스몬' && detector === '현실 세계 A형 탐지기') {
                    const venomButton = document.querySelector('.digimon-button[data-digimon="베놈묘티스몬"]');
                    if (venomButton) {
                        venomButton.remove();
                    }
                }

                // 로제몬이 아닌 다른 디지몬 선택 시 로제몬:버스트모드 버튼 제거
                if (digimon !== '로제몬' && detector === '로제몬 탐지기') {
                    const burstButton = document.querySelector('.digimon-button[data-digimon="로제몬:버스트모드"]');
                    if (burstButton) {
                        burstButton.remove();
                    }
                }

                // 블랙세라피몬이 아닌 다른 디지몬 선택 시 마왕몬 버튼 제거
                if (digimon !== '블랙세라피몬' && detector === '타락한 세라피몬 탐지기') {
                    const mawangButton = document.querySelector('.digimon-button[data-digimon="마왕몬"]');
                    if (mawangButton) {
                        mawangButton.remove();
                    }
                }

                // 레이브몬 아닌 다른 디지몬 선택 시 레이브몬:버스트모드 버튼 제거
                if (digimon !== '레이브몬' && detector === '레이브몬 탐지기') {
                    const mawangButton = document.querySelector('.digimon-button[data-digimon="레이브몬:버스트모드"]');
                    if (mawangButton) {
                        mawangButton.remove();
                    }
                }

                // 반쵸레오몬 아닌 다른 디지몬 선택 시 반쵸레오몬:버스트모드 버튼 제거
                if (digimon !== '반쵸레오몬' && detector === '반쵸레오몬 탐지기') {
                    const mawangButton = document.querySelector('.digimon-button[data-digimon="반쵸레오몬:버스트모드"]');
                    if (mawangButton) {
                        mawangButton.remove();
                    }
                }

                // 트리케라몬 아닌 다른 디지몬 선택 시 청룡몬 버튼 제거
                if (digimon !== '트리케라몬' && detector === '계곡 탐지기') {
                    const mawangButton = document.querySelector('.digimon-button[data-digimon="청룡몬"]');
                    if (mawangButton) {
                        mawangButton.remove();
                    }
                }                 

                // 히포그리포몬 아닌 다른 디지몬 선택 시 주작몬 버튼 제거
                if (digimon !== '히포그리포몬' && detector === '현실 세계 B형 탐지기') {
                    const mawangButton = document.querySelector('.digimon-button[data-digimon="주작몬"]');
                    if (mawangButton) {
                        mawangButton.remove();
                    }
                }                

                // 안드로몬 선택 시 크레니엄몬 버튼 추가
                if (digimon === '안드로몬' && detector === '보급형 탐지기') {
                    // 이미 크레니엄몬 버튼이 있는지 확인
                    const existingVenomButton = document.querySelector('.digimon-button[data-digimon="크레니엄몬"]');
                    if (!existingVenomButton) {
                        const venomButton = document.createElement('button');
                        venomButton.className = 'digimon-button';
                        venomButton.dataset.digimon = '크레니엄몬';
                        const venomImgBg = document.createElement('div');
                        venomImgBg.className = 'digimon-img-bg';
                        const venomImg = document.createElement('img');
                        venomImg.src = 'https://media.dsrwiki.com/dsrwiki/digimon/크레니엄몬/크레니엄몬.webp';
                        venomImg.alt = '크레니엄몬';
                        venomImgBg.appendChild(venomImg);
                        const venomSpan = document.createElement('span');
                        venomSpan.textContent = '크레니엄몬';
                        venomButton.appendChild(venomImgBg);
                        venomButton.appendChild(venomSpan);
                        venomButton.addEventListener('click', () => {
                            const prevSelected = document.querySelector('.digimon-button.selected');
                            if (prevSelected) prevSelected.classList.remove('selected');
                            venomButton.classList.add('selected');
                            selectedDigimon = '크레니엄몬';
                            showMapAndMarker(selectedDetector, selectedDigimon);
                            showDigimonInfo(selectedDetector, selectedDigimon);
                        });
                        digimonGrid.appendChild(venomButton);
                    }
                }                

                // 묘티스몬 선택 시 베놈묘티스몬 버튼 추가
                if (digimon === '묘티스몬' && detector === '현실 세계 A형 탐지기') {
                    // 이미 베놈묘티스몬 버튼이 있는지 확인
                    const existingVenomButton = document.querySelector('.digimon-button[data-digimon="베놈묘티스몬"]');
                    if (!existingVenomButton) {
                        const venomButton = document.createElement('button');
                        venomButton.className = 'digimon-button';
                        venomButton.dataset.digimon = '베놈묘티스몬';
                        const venomImgBg = document.createElement('div');
                        venomImgBg.className = 'digimon-img-bg';
                        const venomImg = document.createElement('img');
                        venomImg.src = 'https://media.dsrwiki.com/dsrwiki/digimon/베놈묘티스몬/베놈묘티스몬.webp';
                        venomImg.alt = '베놈묘티스몬';
                        venomImgBg.appendChild(venomImg);
                        const venomSpan = document.createElement('span');
                        venomSpan.textContent = '베놈묘티스몬';
                        venomButton.appendChild(venomImgBg);
                        venomButton.appendChild(venomSpan);
                        venomButton.addEventListener('click', () => {
                            const prevSelected = document.querySelector('.digimon-button.selected');
                            if (prevSelected) prevSelected.classList.remove('selected');
                            venomButton.classList.add('selected');
                            selectedDigimon = '베놈묘티스몬';
                            showMapAndMarker(selectedDetector, selectedDigimon);
                            showDigimonInfo(selectedDetector, selectedDigimon);
                        });
                        digimonGrid.appendChild(venomButton);
                    }
                }

                // 로제몬 선택 시 로제몬:버스트모드 버튼 추가
                if (digimon === '로제몬' && detector === '로제몬 탐지기') {
                    // 이미 로제몬:버스트모드 버튼이 있는지 확인
                    const existingBurstButton = document.querySelector('.digimon-button[data-digimon="로제몬:버스트모드"]');
                    if (!existingBurstButton) {
                        const burstButton = document.createElement('button');
                        burstButton.className = 'digimon-button';
                        burstButton.dataset.digimon = '로제몬:버스트모드';
                        const burstImgBg = document.createElement('div');
                        burstImgBg.className = 'digimon-img-bg';
                        const burstImg = document.createElement('img');
                        burstImg.src = 'https://media.dsrwiki.com/dsrwiki/digimon/로제몬_버스트모드/로제몬_버스트모드.webp';
                        burstImg.alt = '로제몬:버스트모드';
                        burstImgBg.appendChild(burstImg);
                        const burstSpan = document.createElement('span');
                        burstSpan.textContent = '로제몬:버스트모드';
                        burstButton.appendChild(burstImgBg);
                        burstButton.appendChild(burstSpan);
                        burstButton.addEventListener('click', () => {
                            const prevSelected = document.querySelector('.digimon-button.selected');
                            if (prevSelected) prevSelected.classList.remove('selected');
                            burstButton.classList.add('selected');
                            selectedDigimon = '로제몬:버스트모드';
                            showMapAndMarker(selectedDetector, selectedDigimon);
                            showDigimonInfo(selectedDetector, selectedDigimon);
                        });
                        digimonGrid.appendChild(burstButton);
                    }
                }

                // 블랙세라피몬 선택 시 마왕몬 버튼 추가
                if (digimon === '블랙세라피몬' && detector === '타락한 세라피몬 탐지기') {
                    // 이미 마왕몬 버튼이 있는지 확인
                    const existingMawangButton = document.querySelector('.digimon-button[data-digimon="마왕몬"]');
                    if (!existingMawangButton) {
                        const mawangButton = document.createElement('button');
                        mawangButton.className = 'digimon-button';
                        mawangButton.dataset.digimon = '마왕몬';
                        const mawangImgBg = document.createElement('div');
                        mawangImgBg.className = 'digimon-img-bg';
                        const mawangImg = document.createElement('img');
                        mawangImg.src = 'https://media.dsrwiki.com/dsrwiki/digimon/마왕몬/마왕몬.webp';
                        mawangImg.alt = '마왕몬';
                        mawangImgBg.appendChild(mawangImg);
                        const mawangSpan = document.createElement('span');
                        mawangSpan.textContent = '마왕몬';
                        mawangButton.appendChild(mawangImgBg);
                        mawangButton.appendChild(mawangSpan);
                        mawangButton.addEventListener('click', () => {
                            const prevSelected = document.querySelector('.digimon-button.selected');
                            if (prevSelected) prevSelected.classList.remove('selected');
                            mawangButton.classList.add('selected');
                            selectedDigimon = '마왕몬';
                            showMapAndMarker(selectedDetector, selectedDigimon);
                            showDigimonInfo(selectedDetector, selectedDigimon);
                        });
                        digimonGrid.appendChild(mawangButton);
                    }
                }

                // 레이브몬 선택 시 레이브몬:버스트모드 버튼 추가
                if (digimon === '레이브몬' && detector === '레이브몬 탐지기') {
                    // 이미 레이브몬:버스트모드 버튼이 있는지 확인
                    const existingMawangButton = document.querySelector('.digimon-button[data-digimon="레이브몬:버스트모드"]');
                    if (!existingMawangButton) {
                        const mawangButton = document.createElement('button');
                        mawangButton.className = 'digimon-button';
                        mawangButton.dataset.digimon = '레이브몬:버스트모드';
                        const mawangImgBg = document.createElement('div');
                        mawangImgBg.className = 'digimon-img-bg';
                        const mawangImg = document.createElement('img');
                        mawangImg.src = 'https://media.dsrwiki.com/dsrwiki/digimon/레이브몬_버스트모드/레이브몬_버스트모드.webp';
                        mawangImg.alt = '레이브몬:버스트모드';
                        mawangImgBg.appendChild(mawangImg);
                        const mawangSpan = document.createElement('span');
                        mawangSpan.textContent = '레이브몬:버스트모드';
                        mawangButton.appendChild(mawangImgBg);
                        mawangButton.appendChild(mawangSpan);
                        mawangButton.addEventListener('click', () => {
                            const prevSelected = document.querySelector('.digimon-button.selected');
                            if (prevSelected) prevSelected.classList.remove('selected');
                            mawangButton.classList.add('selected');
                            selectedDigimon = '레이브몬:버스트모드';
                            showMapAndMarker(selectedDetector, selectedDigimon);
                            showDigimonInfo(selectedDetector, selectedDigimon);
                        });
                        digimonGrid.appendChild(mawangButton);
                    }
                }
                
                // 반쵸레오몬 선택 시 반쵸레오몬:버스트모드 버튼 추가
                if (digimon === '반쵸레오몬' && detector === '반쵸레오몬 탐지기') {
                    // 이미 반쵸레오몬:버스트모드 버튼이 있는지 확인
                    const existingMawangButton = document.querySelector('.digimon-button[data-digimon="반쵸레오몬:버스트모드"]');
                    if (!existingMawangButton) {
                        const mawangButton = document.createElement('button');
                        mawangButton.className = 'digimon-button';
                        mawangButton.dataset.digimon = '반쵸레오몬:버스트모드';
                        const mawangImgBg = document.createElement('div');
                        mawangImgBg.className = 'digimon-img-bg';
                        const mawangImg = document.createElement('img');
                        mawangImg.src = 'https://media.dsrwiki.com/dsrwiki/digimon/반쵸레오몬_버스트모드/반쵸레오몬_버스트모드.webp';
                        mawangImg.alt = '반쵸레오몬:버스트모드';
                        mawangImgBg.appendChild(mawangImg);
                        const mawangSpan = document.createElement('span');
                        mawangSpan.textContent = '반쵸레오몬:버스트모드';
                        mawangButton.appendChild(mawangImgBg);
                        mawangButton.appendChild(mawangSpan);
                        mawangButton.addEventListener('click', () => {
                            const prevSelected = document.querySelector('.digimon-button.selected');
                            if (prevSelected) prevSelected.classList.remove('selected');
                            mawangButton.classList.add('selected');
                            selectedDigimon = '반쵸레오몬:버스트모드';
                            showMapAndMarker(selectedDetector, selectedDigimon);
                            showDigimonInfo(selectedDetector, selectedDigimon);
                        });
                        digimonGrid.appendChild(mawangButton);
                    }
                }

                // 트리케라몬 선택 시 청룡몬 버튼 추가
                if (digimon === '트리케라몬' && detector === '계곡 탐지기') {
                    // 이미 청룡몬 버튼이 있는지 확인
                    const existingMawangButton = document.querySelector('.digimon-button[data-digimon="청룡몬"]');
                    if (!existingMawangButton) {
                        const mawangButton = document.createElement('button');
                        mawangButton.className = 'digimon-button';
                        mawangButton.dataset.digimon = '청룡몬';
                        const mawangImgBg = document.createElement('div');
                        mawangImgBg.className = 'digimon-img-bg';
                        const mawangImg = document.createElement('img');
                        mawangImg.src = 'https://media.dsrwiki.com/dsrwiki/digimon/청룡몬/청룡몬.webp';
                        mawangImg.alt = '청룡몬';
                        mawangImgBg.appendChild(mawangImg);
                        const mawangSpan = document.createElement('span');
                        mawangSpan.textContent = '청룡몬';
                        mawangButton.appendChild(mawangImgBg);
                        mawangButton.appendChild(mawangSpan);
                        mawangButton.addEventListener('click', () => {
                            const prevSelected = document.querySelector('.digimon-button.selected');
                            if (prevSelected) prevSelected.classList.remove('selected');
                            mawangButton.classList.add('selected');
                            selectedDigimon = '청룡몬';
                            showMapAndMarker(selectedDetector, selectedDigimon);
                            showDigimonInfo(selectedDetector, selectedDigimon);
                        });
                        digimonGrid.appendChild(mawangButton);
                    }
                }  

                // 히포그리포몬 선택 시 주작몬 버튼 추가
                if (digimon === '히포그리포몬' && detector === '현실 세계 B형 탐지기') {
                    // 이미 주작몬 버튼이 있는지 확인
                    const existingMawangButton = document.querySelector('.digimon-button[data-digimon="주작몬"]');
                    if (!existingMawangButton) {
                        const mawangButton = document.createElement('button');
                        mawangButton.className = 'digimon-button';
                        mawangButton.dataset.digimon = '주작몬';
                        const mawangImgBg = document.createElement('div');
                        mawangImgBg.className = 'digimon-img-bg';
                        const mawangImg = document.createElement('img');
                        mawangImg.src = 'https://media.dsrwiki.com/dsrwiki/digimon/주작몬/주작몬.webp';
                        mawangImg.alt = '주작몬';
                        mawangImgBg.appendChild(mawangImg);
                        const mawangSpan = document.createElement('span');
                        mawangSpan.textContent = '주작몬';
                        mawangButton.appendChild(mawangImgBg);
                        mawangButton.appendChild(mawangSpan);
                        mawangButton.addEventListener('click', () => {
                            const prevSelected = document.querySelector('.digimon-button.selected');
                            if (prevSelected) prevSelected.classList.remove('selected');
                            mawangButton.classList.add('selected');
                            selectedDigimon = '주작몬';
                            showMapAndMarker(selectedDetector, selectedDigimon);
                            showDigimonInfo(selectedDetector, selectedDigimon);
                        });
                        digimonGrid.appendChild(mawangButton);
                    }
                }                
            });
            digimonGrid.appendChild(button);
        }
    });

    // 변조된 베놈묘티스몬 탐지기의 경우 베놈묘티스몬 버튼만 표시
    if (detector === '변조된 베놈묘티스몬 탐지기') {
        const venomButton = document.createElement('button');
        venomButton.className = 'digimon-button';
        venomButton.dataset.digimon = '베놈묘티스몬';
        const venomImgBg = document.createElement('div');
        venomImgBg.className = 'digimon-img-bg';
        const venomImg = document.createElement('img');
        venomImg.src = 'https://media.dsrwiki.com/dsrwiki/digimon/베놈묘티스몬/베놈묘티스몬.webp';
        venomImg.alt = '베놈묘티스몬';
        venomImgBg.appendChild(venomImg);
        const venomSpan = document.createElement('span');
        venomSpan.textContent = '베놈묘티스몬';
        venomButton.appendChild(venomImgBg);
        venomButton.appendChild(venomSpan);
        venomButton.addEventListener('click', () => {
            const prevSelected = document.querySelector('.digimon-button.selected');
            if (prevSelected) prevSelected.classList.remove('selected');
            venomButton.classList.add('selected');
            selectedDigimon = '베놈묘티스몬';
            showMapAndMarker(selectedDetector, selectedDigimon);
            showDigimonInfo(selectedDetector, selectedDigimon);

            // 베놈묘티스몬 선택 시 베리얼묘티스몬 버튼 추가
            const existingVileButton = document.querySelector('.digimon-button[data-digimon="베리얼묘티스몬"]');
            if (!existingVileButton) {
                const vileButton = document.createElement('button');
                vileButton.className = 'digimon-button';
                vileButton.dataset.digimon = '베리얼묘티스몬';
                const vileImgBg = document.createElement('div');
                vileImgBg.className = 'digimon-img-bg';
                const vileImg = document.createElement('img');
                vileImg.src = 'https://media.dsrwiki.com/dsrwiki/digimon/베리얼묘티스몬/베리얼묘티스몬.webp';
                vileImg.alt = '베리얼묘티스몬';
                vileImgBg.appendChild(vileImg);
                const vileSpan = document.createElement('span');
                vileSpan.textContent = '베리얼묘티스몬';
                vileButton.appendChild(vileImgBg);
                vileButton.appendChild(vileSpan);
                vileButton.addEventListener('click', () => {
                    const prevSelected = document.querySelector('.digimon-button.selected');
                    if (prevSelected) prevSelected.classList.remove('selected');
                    vileButton.classList.add('selected');
                    selectedDigimon = '베리얼묘티스몬';
                    showMapAndMarker(selectedDetector, selectedDigimon);
                    showDigimonInfo(selectedDetector, selectedDigimon);
                });
                digimonGrid.appendChild(vileButton);
            }
        });
        digimonGrid.appendChild(venomButton);
    }
}

// 맵과 디지몬 마커 표시
function showMapAndMarker(detector, digimon) {
    const digimonData = detectorData[detector]['악역 디지몬'][digimon];
    let mapName = digimonData.map.replace(/\s+/g, '');
    if (detector.replace(/\s/g, '') === '변조된스파이럴탐지기' && digimon === '아포카리몬' && mapName === '???') {
        mapName = 'ApocalymonArea';
    }
    // 맵 이미지 설정
    const mapImage = document.getElementById('mapImage');
    mapImage.src = `https://media.dsrwiki.com/dsrwiki/map/${mapName}.webp`;
    // 디지몬 마커 설정
    const marker = document.getElementById('digimonMarker');
    const markerImg = marker.querySelector('img');
    const digimonImageName = digimon.replace(':', '_');
    markerImg.src = `https://media.dsrwiki.com/dsrwiki/digimon/${digimonImageName}/${digimonImageName}.webp`;
    
    // 환경별 좌표 재계산
    const isMobile = window.innerWidth <= 768;
    const desktopSize = 500;
    const mobileSize = 350;
    const originalSize = 400; // 기존 좌표 기준
    const scale = isMobile ? mobileSize / originalSize : desktopSize / originalSize;
    marker.style.left = `${digimonData.coordinates.x * scale}px`;
    marker.style.top = `${digimonData.coordinates.y * scale}px`;
    // 기존 transform 클래스 제거
    marker.classList.remove('-translate-x-1/2', '-translate-y-1/2');
    // 환경에 상관없이 transform을 항상 동일하게 적용
    marker.style.transform = 'translate(-50%, -50%)';
    marker.classList.remove('hidden');
    document.getElementById('mapContainer').classList.remove('hidden');
}

// 카드 하단에 스킬 테이블 추가
async function showDigimonSkills(digimon) {
    // digimon.json에서 스킬 정보 가져오기
    const response = await fetch('https://media.dsrwiki.com/data/csv/digimon.json');
    const digimonData = await response.json();
    const digimonInfo = digimonData[digimon];
    
    if (!digimonInfo || !digimonInfo.skills) {
        return '';
    }

    const digimonImageName = digimon.replace(':', '_');
    const skillRows = digimonInfo.skills.map((skillData, idx) => {
        return {
            img: `https://media.dsrwiki.com/dsrwiki/digimon/${digimonImageName}/skill${idx + 1}.webp`,
            name: skillData.name,
            attribute: skillData.attribute,
            detail1: skillData.range,
            detail2: skillData.target_count,
            hit: skillData.hits,
            detail3: skillData.effect || '',
            cooldown: skillData.additionalTurn
        };
    });

    if (skillRows.length > 0) {
        const skillsHtml = skillRows.map(skill => `
            <div class="skill-row">
                <img src="${skill.img}" class="skill-image" alt="${skill.name}">
                <div class="skill-info">
                    <div class="skill-header">
                        <span class="skill-name">${skill.name}</span>
                        <span class="skill-attribute"><img src="https://media.dsrwiki.com/dsrwiki/${skill.attribute}.webp" alt="${skill.attribute}"></span>
                    </div>
                    <div class="skill-details">
                        <span style="background-color: ${skill.detail1 === '원거리' ? 'green' : '#D32F2F'}; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; vertical-align: middle;">${skill.detail1 || '정보 없음'}</span>
                        <span style="background-color: #D32F2F; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; vertical-align: middle;">${skill.detail2 || '정보 없음'}</span>
                        <span style="background-color: green; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; vertical-align: middle;">${isNaN(skill.hit) ? (skill.hit || '정보 없음') : `${skill.hit}타`}</span>
                        ${skill.detail3 ? `<span style="background-color: #D32F2F; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; vertical-align: middle;">${skill.detail3}</span>` : ''}
                        ${skill.cooldown ? `<span style="background-color: grey; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center;">추가 시전 턴 : ${skill.cooldown}턴</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        return `<div class="skill-container">${skillsHtml}</div>`;
    }
    return '';
}

// 디지몬 정보 카드 표시
async function showDigimonInfo(detector, digimon) {
    const data = detectorData[detector]['악역 디지몬'][digimon];
    let typeIcon = '';
    if (data.type) {
        typeIcon = `<span style="display:flex;align-items:center;justify-content:center;">
            <img src="https://media.dsrwiki.com/dsrwiki/${data.type}.webp" alt="${data.type}" style="width:24px;height:24px;margin-left:5px;">
        </span>`;
    }
    const strongBadges = data.strong ? data.strong.split(',').map((s, i) => {
        const value = s.trim();
        if (i === 0) {
            return `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;margin-right:8px;margin-left:5px;background:url('https://media.dsrwiki.com/dsrwiki/strongbackground.webp') center/cover no-repeat;border-radius:5px;">
                <img src="https://media.dsrwiki.com/dsrwiki/${value}.webp" alt="${value}" style="width:24px;height:24px;object-fit:contain;">
            </span>`;
        } else {
            return `<span style="margin-right:8px;">${value}</span>`;
        }
    }).join('') : '';
    const weakBadges = data.weak ? data.weak.split(',').map((s, i) => {
        const value = s.trim();
        if (i === 0) {
            return `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;margin-right:8px;margin-left:5px;background:url('https://media.dsrwiki.com/dsrwiki/weakbackground.webp') center/cover no-repeat;border-radius:5px;">
                <img src="https://media.dsrwiki.com/dsrwiki/${value}.webp" alt="${value}" style="width:24px;height:24px;object-fit:contain;">
            </span>`;
        } else {
            return `<span style="margin-right:8px;">${value}</span>`;
        }
    }).join('') : '';
    const skillTable = await showDigimonSkills(digimon);
    const digimonImageName = digimon.replace(':', '_');
    document.getElementById('digimonInfoCard').innerHTML = `
      <div class="bg-white rounded-lg shadow p-4 w-full h-full flex flex-col">
        <div class="flex items-center gap-2 mb-2">
          <div style="width: 64px; height: 64px; background: rgb(52,52,52); border-radius: 3px; display: flex; align-items: center; justify-content: center;">
            <img src="https://media.dsrwiki.com/dsrwiki/digimon/${digimonImageName}/${digimonImageName}.webp" alt="${digimon}" class="w-16 h-16 object-contain">
          </div>
          <span class="font-bold text-lg">${digimon}</span>
        </div>
        <div class="text-sm text-gray-700 space-y-3 mb-4">
          ${data.level ? `<div style="color: #000; font-weight: bold;"><b>레벨 :</b> ${data.level}</div>` : ''}
          ${data.HP ? `<div style="color: #000; font-weight: bold;"><b>HP :</b> ${data.HP}</div>` : ''}
          ${data.type ? `<div style="display:flex;align-items:center;flex-wrap:wrap;color: #000; font-weight: bold;"><b>타입 :</b> ${typeIcon}</div>` : ''}
          ${data.strong ? `<div style="display:flex;align-items:center;flex-wrap:wrap;color: #000; font-weight: bold;">강점 : ${strongBadges}</div>` : ''}
          ${data.weak ? `<div style="display:flex;align-items:center;flex-wrap:wrap;color: #000; font-weight: bold;">약점 : ${weakBadges}</div>` : ''}
        </div>
        <div class="flex-1 overflow-y-auto">
          ${skillTable}
        </div>
      </div>
    `;
    document.getElementById('digimonInfoCard').classList.remove('hidden');

    // 기믹과 아이템 정보 카드 표시
    showDigimonMechanicInfo(detector, digimon);
}

// 기믹과 아이템 정보 카드 표시
function showDigimonMechanicInfo(detector, digimon) {
    const data = detectorData[detector]['악역 디지몬'][digimon];
    
    // 아이템 정보 HTML 생성 (이름별로 거래상태/드롭타입 병합)
    const itemMap = {};
    if (data.item) {
        data.item.forEach(item => {
            const [name, tradeStatus, dropType] = item.split(',');
            if (!itemMap[name]) {
                itemMap[name] = { tradeStatus: new Set(), dropType: new Set(), raw: item };
            }
            itemMap[name].tradeStatus.add(tradeStatus.trim());
            itemMap[name].dropType.add(dropType.trim());
        });
    }

    const itemHtml = Object.entries(itemMap).length > 0 ? Object.entries(itemMap).map(([name, info]) => {
        let imageName;
        if (name.includes('Data : ')) {
            imageName = name.replace(/\s/g, '').replace(':', '');
        } else {
            imageName = name.trim();
        }
        const finalImageName = imageName.includes('균열 데이터 상자') ? '균열 데이터 상자' : imageName;
        const imagePath = `https://media.dsrwiki.com/dsrwiki/item/${finalImageName}.webp`;
        // 거래상태 뱃지들
        const tradeBadges = Array.from(info.tradeStatus).map(status =>
            `<span style="background-color: ${status === '거래가능' ? 'green' : '#D32F2F'}; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; vertical-align: middle; margin-left: 5px; line-height: 1; height: auto; min-height: unset;">${status}</span>`
        ).join('');
        // 드롭타입 뱃지들
        const dropBadges = Array.from(info.dropType).map(type =>
            `<span style="background-color: ${type === '확률' ? 'green' : '#D32F2F'}; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; vertical-align: middle; margin-left: 5px; line-height: 1; height: auto; min-height: unset;">${type}</span>`
        ).join('');

        // 구성품 툴팁 처리
        const itemsList = detectorData[name]?.items || {};
        const tooltipContent = Object.entries(itemsList)
            .map(([itemName, itemData]) => {
                const cleanName = itemName.replace(/\s*x\s*\d+$/, '').replace(/\s*x\s*\d+/g, '').trim();
                const imagePath = `https://media.dsrwiki.com/dsrwiki/item/${cleanName}.webp`;
                const tradeStatusText = itemData.tradeStatus === '거래가능' ? '(거래가능)' : '(거래불가)';
                const tradeStatusColor = itemData.tradeStatus === '거래가능' ? 'green' : 'red';
                return `
                    <div style="display: flex; align-items: center;">
                        <img src="${imagePath}" 
                            style="width: 30px; height: 30px; margin: 5px; background-color: #343434; border-radius: 3px; border: 1px solid grey; vertical-align: middle;"
                            onerror="this.onerror=null; this.src='https://media.dsrwiki.com/dsrwiki/item/default.webp';">
                        <span style="color: ${tradeStatusColor};">${tradeStatusText}</span>
                        <span>${itemName}</span>
                    </div>`;
            })
            .join('');
        const extraInfo = (name.includes('균열 데이터 상자') || name === '작은 사랑의 꾸러미' || name === '분노에 잠식된 꾸러미' || name === '검은 날개의 꾸러미'  || name === '정의의 상자')
            ? `<span style="background-color: #FFC107; color: white; border-radius: 5px; padding: 2px 2px; font-size: 13px; display: inline-block; text-align: center; vertical-align: middle; margin-left: 5px; line-height: 1; height: auto; min-height: unset; cursor: pointer; position: relative;" onmouseover="showTooltip(this)" onmouseout="hideTooltip(this)">
                구성품 확인
                <div class="custom-tooltip" style="display: none; position: absolute; top: 50%; left: 100%; transform: translateY(-50%); margin-left: 10px; background-color: rgba(0, 0, 0, 0.9); border: 1px solid #ccc; border-radius: 5px; padding: 5px; box-shadow: 0px 4px 8px rgba(0,0,0,0.1); white-space: nowrap; z-index: 9999; width: max-content; max-height: 80vh; overflow-y: auto;">
                    ${tooltipContent}
                </div>
            </span>`
            : '';
        return `
            <div style="color: black; font-size: 14px; display: flex; align-items: center;">
                <img src="${imagePath}" alt="${name.trim()}" style="width: 30px; height: 30px; margin-right: 5px; margin-top: 5px; background-color: #343434; border-radius: 3px; border: 1px solid grey; vertical-align: middle;">
                <span style="font-weight: bold;">${name.trim()}</span>
                ${tradeBadges}
                ${dropBadges}
                ${extraInfo}
            </div>`;
    }).join('') : '<div style="color: black; font-size: 14px;">정보 없음</div>';

    document.getElementById('digimonMechanicCard').innerHTML = `
        <div class="bg-white rounded-lg shadow p-4 w-full h-full flex flex-col">
            ${data.gimmick ? `
                <div class="mb-4">
                    <h3 class="font-bold text-lg mb-2">
                        <img src="https://media.dsrwiki.com/dsrwiki/title.webp" alt="title" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 6px;">
                        패턴
                    </h3>
                    <div class="text-sm text-gray-700" style="font-weight: bold;">
                        ${data.gimmick}
                    </div>
                </div>
            ` : ''}
            <div>
                <h3 class="font-bold text-lg mb-2">
                    <img src="https://media.dsrwiki.com/dsrwiki/title.webp" alt="title" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 6px;">
                    드롭 아이템
                </h3>
                <div class="overflow-x-auto md:overflow-x-visible space-y-1 whitespace-nowrap">

                    ${itemHtml}
                </div>
            </div>
        </div>
    `;
    document.getElementById('digimonMechanicCard').classList.remove('hidden');
}

// 툴팁 표시 함수
function showTooltip(element) {
    const tooltip = element.querySelector('.custom-tooltip');
    if (window.innerWidth <= 768) {
        tooltip.style.position = 'fixed';
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
        tooltip.style.marginLeft = '0';
    } else {
        tooltip.style.position = 'absolute';
        tooltip.style.top = '50%';
        tooltip.style.left = '100%';
        tooltip.style.transform = 'translateY(-50%)';
        tooltip.style.marginLeft = '10px';
    }
    tooltip.style.display = 'block';
}

// 툴팁 숨김 함수
function hideTooltip(element) {
    const tooltip = element.querySelector('.custom-tooltip');
    tooltip.style.display = 'none';
}
