
    // 1) 외부 JSON으로부터 로드할 변수
    let deckData = {};

    // DOMContentLoaded 에서 JSON 로드 후 초기화
    document.addEventListener('DOMContentLoaded', () => {
      fetch('data/csv/deck.json')
        .then(res => {
          if (!res.ok) throw new Error('deck.json 로드 실패');
          return res.json();
        })
        .then(json => {
          deckData = json;
          renderAllDecks();
          setupEventListeners();
        })
        .catch(err => {
          console.error(err);
          document.getElementById('deck-container').textContent = '덱 데이터를 불러올 수 없습니다.';
        });
    });

    // 모든 덱 렌더링 함수
    function renderAllDecks() {
      const deckContainer = document.getElementById('deck-container');
      deckContainer.innerHTML = '';
      Object.entries(deckData).forEach(([deckName, deckInfo]) => {
        deckContainer.appendChild(createDeckCard(deckName, deckInfo));
      });
    }

    // 덱 카드 생성 함수
    function createDeckCard(deckName, deckInfo, highlightDigimon = '', highlightEffect = '') {
      const deckCard = document.createElement('div');
      deckCard.className = 'deck-card';

      // 제목
      const title = document.createElement('h2');
      title.className = 'deck-title';
      title.textContent = deckName;
      deckCard.appendChild(title);

      // 디지몬 이미지
      const digimonImages = document.createElement('div');
      digimonImages.className = 'digimon-images';
      digimonImages.style.display = 'flex';
      digimonImages.style.marginBottom = '5px';
      deckInfo.digimon.forEach(d => {
        const avatar = document.createElement('div');
        avatar.className = 'digimon-avatar';
        avatar.style.marginRight = '10px';
        const img = document.createElement('img');
        img.src = `image/digimon/${d.name}/${d.name}.webp`;
        img.alt = d.name;
        img.onerror = () => { avatar.textContent = d.name.charAt(0); };
        avatar.appendChild(img);

        // 툴팁
        const tip = `Lv.${d.level} ${d.name} `;
        avatar.addEventListener('mouseover', () => {
          document.querySelectorAll('.digimon-tooltip').forEach(t=>t.remove());
          const tt = document.createElement('div');
          tt.className = 'digimon-tooltip';
          tt.textContent = tip;
          document.body.appendChild(tt);
          const r = avatar.getBoundingClientRect();
          tt.style.left = r.left + r.width/2 + 'px';
          tt.style.top  = r.bottom + 10 + 'px';
          tt.style.transform = 'translateX(-50%)';
          tt.style.opacity = '1';
        });
        avatar.addEventListener('mouseout', () => {
          document.querySelectorAll('.digimon-tooltip').forEach(t=>t.remove());
        });

        if (highlightDigimon && d.name.toLowerCase().includes(highlightDigimon.toLowerCase())) {
          avatar.style.boxShadow = '0 0 10px var(--highlight-color)';
        }
        digimonImages.appendChild(avatar);
      });
      deckCard.appendChild(digimonImages);

      // 설명
      const desc = document.createElement('div');
      desc.className = 'deck-description';
      desc.textContent = deckInfo.description;
      deckCard.appendChild(desc);

      // 효과 한 줄로 / 구분
      const effectsContainer = document.createElement('div');
      effectsContainer.className = 'effects-container';
      effectsContainer.innerHTML = deckInfo.effects
        .map(e =>
          e.replace(/(\+\s*[\d\.]+%?)/g, '<span class="effect-value">$1</span>')
        )
        .join(' / ');
      deckCard.appendChild(effectsContainer);

      return deckCard;
    }

    // 검색 이벤트 설정
    function setupEventListeners() {
      const digimonSearch = document.getElementById('digimon-search');
      const effectSearch  = document.getElementById('effect-search');

      digimonSearch.addEventListener('input', () => {
        const term = digimonSearch.value.trim();
        if (term) {
          searchDigimon(term);
          effectSearch.value = '';
        } else showAllDecks();
      });

      effectSearch.addEventListener('input', () => {
        const term = effectSearch.value.trim();
        if (term) {
          searchEffect(term);
          digimonSearch.value = '';
        } else showAllDecks();
      });
    }

    // 검색·결과 렌더링 함수들 (이전과 동일)
    function searchDigimon(searchTerm) {
      const results = {};
      Object.entries(deckData).forEach(([name, info]) => {
        if (info.digimon.some(d=>d.name.toLowerCase().includes(searchTerm.toLowerCase()))) {
          results[name] = info;
        }
      });
      displaySearchResults(results, '디지몬 검색 결과', searchTerm, '');
    }

    function searchEffect(searchTerm) {
      const results = {};
      Object.entries(deckData).forEach(([name, info]) => {
        if (info.effects.some(e=>e.toLowerCase().includes(searchTerm.toLowerCase()))) {
          results[name] = info;
        }
      });
      displaySearchResults(results, '효과 검색 결과', '', searchTerm);
    }

    function displaySearchResults(results, title, hlDigimon, hlEffect) {
      const rc = document.getElementById('results-container');
      rc.innerHTML = '';
      if (!Object.keys(results).length) {
        const no = document.createElement('div');
        no.className = 'no-results';
        no.textContent = '검색 결과가 없습니다.';
        rc.appendChild(no);
      } else {
        const grid = document.createElement('div');
        grid.className = 'deck-container';
        Object.entries(results).forEach(([n,i]) => {
          grid.appendChild(createDeckCard(n, i, hlDigimon, hlEffect));
        });
        rc.appendChild(grid);
      }
      document.getElementById('search-results').style.display = 'flex';
      document.getElementById('deck-container').style.display = 'none';
    }

    function showAllDecks() {
      document.getElementById('search-results').style.display = 'none';
      document.getElementById('deck-container').style.display = 'flex';
      renderAllDecks();
    }