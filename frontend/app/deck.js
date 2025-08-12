
    // 1) 외부 JSON으로부터 로드할 변수
    let deckData = {};

    // DOMContentLoaded 에서 JSON 로드 후 초기화
    document.addEventListener('DOMContentLoaded', () => {
      fetch('/data/csv/deck.json')
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

    // 필터링된 덱만 deck-container에 렌더링
    function renderFilteredDecks(filtered, highlightTerms = []) {
        const container = document.getElementById('deck-container');
        container.innerHTML = '';
      
        if (Object.keys(filtered).length === 0) {
          const no = document.createElement('div');
          no.className = 'no-results';
          no.textContent = '검색 결과가 없습니다.';
          container.appendChild(no);
        } else {
          Object.entries(filtered).forEach(([name, info]) => {
            // highlightTerm 를 그대로 넘겨줍니다
            container.appendChild(createDeckCard(name, info, highlightTerms));
          });
        }
      }

    function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 덱 카드 생성 함수
    function createDeckCard(deckName, deckInfo, highlightTerms = []) {
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
        if (highlightTerms.some(term => d.name.toLowerCase().includes(term))) {
            avatar.style.boxShadow = '0 0 8px var(--highlight-color)';
          }
        avatar.style.marginRight = '10px';
        const img = document.createElement('img');
        const safeName = d.name.replace(/:/g, '_');
        img.src = `https://media.dsrwiki.com/dsrwiki/image/digimon/${safeName}/${safeName}.webp`;
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
        digimonImages.appendChild(avatar);
      });
      deckCard.appendChild(digimonImages);

      // 설명
      const desc = document.createElement('div');
      desc.className = 'deck-description';
      let descHTML = deckInfo.description;
      highlightTerms.forEach(term => {
        const re = new RegExp(`(${escapeRegExp(term)})`, 'gi');
        descHTML = descHTML.replace(re, '<span class="highlight">$1</span>');
      });
      desc.innerHTML = descHTML;
      deckCard.appendChild(desc);

      const effectsContainer = document.createElement('div');
      effectsContainer.className = 'effects-container';
      effectsContainer.innerHTML = deckInfo.effects
        .map(e => {
          // 숫자 강조
          let html = e.replace(/(\+\s*[\d\.]+%?)/g, '<span class="effect-value">$1</span>');
          // 다중 키워드 하이라이트
          highlightTerms.forEach(term => {
            const re = new RegExp(`(${escapeRegExp(term)})`, 'gi');
            html = html.replace(re, '<span class="highlight">$1</span>');
          });
          return html;
        })
        .join(' / ');
      deckCard.appendChild(effectsContainer);
    
      return deckCard;
    }

    function setupEventListeners() {
        const digimonSearch = document.getElementById('digimon-search');
        const effectSearch  = document.getElementById('effect-search');
    
        digimonSearch.addEventListener('input', () => {
            const terms = parseTerms(digimonSearch.value);
            if (terms.length === 0) return renderAllDecks();
    
          // 디지몬 이름 필터
          const results = {};
          Object.entries(deckData).forEach(([name, info]) => {
            // 디지몬 목록 중 하나라도 키워드를 포함하면 매칭
            if (info.digimon.some(d =>
                  terms.some(term => d.name.toLowerCase().includes(term))
                )) {
              results[name] = info;
            }
          });
          effectSearch.value = '';
          renderFilteredDecks(results, terms);
        });
    
        effectSearch.addEventListener('input', () => {
            const terms = parseTerms(effectSearch.value);
            if (terms.length === 0) return renderAllDecks();
        
            const results = {};
            Object.entries(deckData).forEach(([name, info]) => {
              // 효과 목록 중 하나라도 키워드를 포함하면 매칭
              if (info.effects.some(e =>
                    terms.some(term => e.toLowerCase().includes(term))
                  )) {
                results[name] = info;
              }
            });
        
            digimonSearch.value = '';
            renderFilteredDecks(results, terms);
          });
        }

    function showAllDecks() {
      document.getElementById('search-results').style.display = 'none';
      document.getElementById('deck-container').style.display = 'flex';
      renderAllDecks();
    }

    function parseTerms(input) {
        return input
          .split(',')
          .map(t => t.trim().toLowerCase())
          .filter(Boolean);
      }