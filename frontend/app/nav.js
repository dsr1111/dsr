const MENU_ITEMS = [
  {
    type: 'dropdown',
    label: '디지몬',
    items: [
      { label: '도감', href: '../digimon' },
      { label: '덱', href: '../deck' },
      { label: '진화트리', href: '../evolution' },
    ]
  },
  {
    type: 'link',
    label: '맵',
    href: '../map'
  },
  {
    type: 'dropdown',
    label: '던전',
    items: [
      { label: '탐지기', href: '../detector' },
      { label: '오버플로우', href: '../overflow' },
    ]
  },
  {
    type: 'dropdown',
    label: '도구',
    items: [
      { label: '데미지 계산기', href: '../calculator' },
      { label: 'EXP 물약 시뮬레이터', href: '../exp' },
      { label: '가챠 시뮬레이터', href: '../gacha' },
      { label: '코스튬 슬롯 각인 시뮬레이터', href: '../costume-slot' },
    ]
  },
  {
    type: 'dropdown',
    label: '사이트',
    items: [
      { label: '공식 홈페이지', href: 'https://www.digimonsuperrumble.com/', target: '_blank' },
      { label: '공식 카페', href: 'https://cafe.naver.com/movedsr', target: '_blank' },
    ]
  }
];

class CustomNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.initMenu();
    this.initAds();
    this.initReferral();
  }

  render() {
    const menuHtml = MENU_ITEMS.map(item => {
      if (item.type === 'dropdown') {
        const subItems = item.items.map(subItem => `
          <li>
            <a href="${subItem.href}" class="dropdown__link" ${subItem.target ? `target="${subItem.target}"` : ''}>
              ${subItem.label}
            </a>
          </li>
        `).join('');

        return `
          <li class="dropdown__item">
            <div class="nav__link dropdown__toggle">
              ${item.label} <i class="ri-arrow-down-s-line dropdown__arrow"></i>
            </div>
            <ul class="dropdown__menu">
              ${subItems}
            </ul>
          </li>
        `;
      } else {
        return `
          <li><a href="${item.href}" class="nav__link">${item.label}</a></li>
        `;
      }
    }).join('');

    this.shadowRoot.innerHTML = `
      <link href="https://cdn.jsdelivr.net/npm/remixicon@3.2.0/fonts/remixicon.css" rel="stylesheet"/>
      <link rel="stylesheet" href="assets/css/styles1.css">
      <link rel="stylesheet" href="assets/css/nav-custom.css">

      <header class="header">
        <nav class="nav container">
          <div class="nav__data">
            <a href="../index">
              <img loading="lazy" src="https://media.dsrwiki.com/dsrwiki/logo2.webp" class="nav__logo" />
            </a>

            <div class="nav__toggle" id="nav-toggle">
              <i class="ri-menu-line nav__burger"></i>
              <i class="ri-close-line nav__close"></i>
            </div>
          </div>

          <div class="nav__menu" id="nav-menu">
            <ul class="nav__list">
              ${menuHtml}

              <li class="feedback-expcarry-wrapper">
                <button class="feedback-btn" id="feedbackBtn">피드백</button>
                <button class="expcarry-btn" id="expcarryBtn">쫄작 문의</button>
              </li>
            </ul>
          </div>
        </nav>
      </header>
    `;
  }

  initMenu() {
    const root = this.shadowRoot;

    const navToggle = root.getElementById("nav-toggle");
    const navMenu = root.getElementById("nav-menu");

    /* 메뉴 토글 */
    if (navToggle) {
      navToggle.addEventListener("click", () => {
        navMenu.classList.toggle("show-menu");
        navToggle.classList.toggle("show-icon");
      });
    }

    /* 드롭다운 토글 (모바일 + PC 모두 동일 처리) */
    root.querySelectorAll(".dropdown__toggle").forEach((toggle) => {
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();

        const item = toggle.closest(".dropdown__item");
        const menu = item.querySelector(".dropdown__menu");
        const arrow = item.querySelector(".dropdown__arrow");

        const isOpen = menu.classList.contains("show-dropdown");

        // 다른 메뉴 닫기
        root.querySelectorAll(".dropdown__menu").forEach((m) => m.classList.remove("show-dropdown"));
        root.querySelectorAll(".dropdown__arrow").forEach((a) => a.classList.remove("rotate-arrow"));

        // 현재 메뉴 토글
        if (!isOpen) {
          menu.classList.add("show-dropdown");
          arrow.classList.add("rotate-arrow");
        }
      });
    });

    /* 외부 클릭 시 닫기 */
    root.addEventListener("click", (e) => {
      if (!e.target.closest(".dropdown__item")) {
        root.querySelectorAll(".dropdown__menu").forEach((m) => m.classList.remove("show-dropdown"));
        root.querySelectorAll(".dropdown__arrow").forEach((a) => a.classList.remove("rotate-arrow"));
      }
    });

    /* 버튼 링크 */
    const feedbackBtn = root.getElementById("feedbackBtn");
    if (feedbackBtn) {
      feedbackBtn.addEventListener("click", () => {
        window.open("https://forms.gle/7xSaJBz4A28CPY4z9", "_blank");
      });
    }

    const expcarryBtn = root.getElementById("expcarryBtn");
    if (expcarryBtn) {
      expcarryBtn.addEventListener("click", () => {
        window.open("https://open.kakao.com/o/gUkDeqpg", "_blank");
      });
    }
  }

  initAds() {
    // 로컬 체크
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 페이지별 클래스 부여
    const path = window.location.pathname;
    if (path.includes('digimon')) document.body.classList.add('page-digimon');
    else if (path.includes('deck')) document.body.classList.add('page-deck');
    else if (path.includes('evolution')) document.body.classList.add('page-evolution');
    else if (path.includes('map')) document.body.classList.add('page-map');
    else if (path.includes('detector')) document.body.classList.add('page-detector');
    else if (path.includes('overflow')) document.body.classList.add('page-overflow');
    else if (path.includes('calculator')) document.body.classList.add('page-calculator');
    else if (path.includes('exp')) document.body.classList.add('page-exp');
    else if (path.includes('gacha')) document.body.classList.add('page-gacha');
    else if (path.includes('costume-slot')) document.body.classList.add('page-costume-slot');
    else document.body.classList.add('page-index'); // index.html 또는 기본값

    // 중복 방지
    if (document.querySelector('.side-ad-container')) return;

    const adContainer = document.createElement('div');
    adContainer.className = 'side-ad-container';

    const leftAd = document.createElement('div');
    leftAd.className = 'side-ad-left';
    leftAd.innerHTML = `
      <div class="ad-label" style="font-size:10px; color:#ccc; text-align:center; margin-bottom:2px;">광고</div>
      <ins class="adsbygoogle"
           style="display:inline-block;width:160px;height:600px"
           data-ad-client="ca-pub-6625279423156068"
           data-ad-slot="1428393398"></ins>
    `;

    const rightAd = document.createElement('div');
    rightAd.className = 'side-ad-right';
    rightAd.innerHTML = `
      <div class="ad-label" style="font-size:10px; color:#ccc; text-align:center; margin-bottom:2px;">광고</div>
      <ins class="adsbygoogle"
           style="display:inline-block;width:160px;height:600px"
           data-ad-client="ca-pub-6625279423156068"
           data-ad-slot="1851169108"></ins>
    `;

    adContainer.appendChild(leftAd);
    adContainer.appendChild(rightAd);
    document.body.appendChild(adContainer);

    // 광고 푸시
    if (!isLocal) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense push failed", e);
      }
    }
  }

  initReferral() {
    // 이미 닫은 경우 다시 띄우지 않음
    if (localStorage.getItem('referralClosed') === 'true') return;

    // 이미 배너가 있으면 중복 생성 방지
    if (document.getElementById('referral-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'referral-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(11, 14, 26, 0.95);
      border: 1px solid #333;
      border-radius: 8px;
      color: #fff;
      padding: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      z-index: 9999;
      font-family: inherit;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 250px;
      backdrop-filter: blur(4px);
    `;

    // 접힌 상태 확인
    const isFolded = localStorage.getItem('referralFolded') === 'true';

    banner.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:bold; font-size: 14px; color: #a66bff;">💎 추천인 코드</span>
        <div style="display:flex; gap: 8px; align-items:center;">
          <span id="ref-fold" style="cursor:pointer; font-size:12px; opacity:0.8; user-select:none;" title="접기/펴기">${isFolded ? '▲' : '▼'}</span>
          <span id="ref-close" style="cursor:pointer; font-size:14px; opacity:0.8; user-select:none;" title="닫기">✕</span>
        </div>
      </div>
      <div id="ref-content" style="display: ${isFolded ? 'none' : 'block'};">
        <div style="font-size:12px; margin-bottom:8px; color:#aaa; line-height:1.4;">
          신규 유저 가입 시 아래 코드를 입력하면 특별한 보상을 받을 수 있습니다!
        </div>
        <div style="background:#1a1d2e; padding:10px; border-radius:4px; text-align:center; font-weight:bold; font-size:18px; letter-spacing:2px; border:1px dashed #a66bff; margin-bottom:8px;">
          A2USQRY
        </div>
        <div style="text-align:right;">
          <button id="ref-copy" style="background:#a66bff; color:#fff; border:none; border-radius:4px; padding:6px 12px; cursor:pointer; font-size:12px; font-weight:bold; transition: background 0.2s;">복사하기</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    const foldBtn = document.getElementById('ref-fold');
    const closeBtn = document.getElementById('ref-close');
    const content = document.getElementById('ref-content');
    const copyBtn = document.getElementById('ref-copy');

    if (isFolded) {
      banner.style.width = '160px';
      banner.style.padding = '10px 15px';
    }

    foldBtn.addEventListener('click', () => {
      const currentlyFolded = content.style.display === 'none';
      if (currentlyFolded) {
        content.style.display = 'block';
        foldBtn.innerText = '▼';
        banner.style.width = '250px';
        banner.style.padding = '15px';
        localStorage.setItem('referralFolded', 'false');
      } else {
        content.style.display = 'none';
        foldBtn.innerText = '▲';
        banner.style.width = '160px';
        banner.style.padding = '10px 15px';
        localStorage.setItem('referralFolded', 'true');
      }
    });

    closeBtn.addEventListener('click', () => {
      banner.remove();
      localStorage.setItem('referralClosed', 'true');
    });

    // 호버 효과
    copyBtn.addEventListener('mouseover', () => {
      if(copyBtn.innerText === '복사하기') copyBtn.style.background = '#8e54e9';
    });
    copyBtn.addEventListener('mouseout', () => {
      if(copyBtn.innerText === '복사하기') copyBtn.style.background = '#a66bff';
    });

    copyBtn.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('A2USQRY').then(() => {
          const originalText = copyBtn.innerText;
          copyBtn.innerText = '복사 완료!';
          copyBtn.style.background = '#4caf50';
          setTimeout(() => {
            copyBtn.innerText = originalText;
            copyBtn.style.background = '#a66bff';
          }, 2000);
        });
      } else {
        // Fallback
        const tempInput = document.createElement('input');
        tempInput.value = 'A2USQRY';
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        const originalText = copyBtn.innerText;
        copyBtn.innerText = '복사 완료!';
        copyBtn.style.background = '#4caf50';
        setTimeout(() => {
          copyBtn.innerText = originalText;
          copyBtn.style.background = '#a66bff';
        }, 2000);
      }
    });
  }
}

customElements.define("custom-nav", CustomNav);
