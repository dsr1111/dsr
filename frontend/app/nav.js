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
    if (path.includes('map.html')) document.body.classList.add('page-map');
    else if (path.includes('exp.html') || path.includes('gacha.html') || path.includes('calculator.html')) document.body.classList.add('page-narrow');
    else if (path.includes('overflow.html')) document.body.classList.add('page-overflow');
    else if (path.includes('digimon.html') || path.includes('evolution.html')) document.body.classList.add('page-wide');
    else if (path.includes('detector.html')) document.body.classList.add('page-detector');
    else document.body.classList.add('page-standard');

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
           data-ad-slot="1428393398"></ins>
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
}

customElements.define("custom-nav", CustomNav);
