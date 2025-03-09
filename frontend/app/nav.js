class CustomNav extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <link href="https://cdn.jsdelivr.net/npm/remixicon@3.2.0/fonts/remixicon.css" rel="stylesheet"/>
            <link rel="stylesheet" href="assets/css/styles1.css">
            <header class="header">
              <nav class="nav container">
                <div class="nav__data">
                  <a href="index.html">
                    <img src="image/logo2.webp" class="nav__logo" />
                  </a>

                  <div class="nav__toggle" id="nav-toggle">
                    <i class="ri-menu-line nav__burger"></i>
                    <i class="ri-close-line nav__close"></i>
                  </div>
                </div>

                <div class="nav__menu" id="nav-menu">
                  <ul class="nav__list">
                    <li class="dropdown__item">
                      <div class="nav__link">
                        디지몬 <i class="ri-arrow-down-s-line dropdown__arrow"></i>
                      </div>
                      <ul class="dropdown__menu">
                        <li><a href="digimon.html" class="dropdown__link">도감</a></li>
                        <li><a href="evolution.html" class="dropdown__link">진화트리</a></li>
                      </ul>
                    </li>
                    <li><a href="map.html" class="nav__link">맵</a></li>
                    <li class="dropdown__item">
                      <div class="nav__link">
                        던전 <i class="ri-arrow-down-s-line dropdown__arrow"></i>
                      </div>
                      <ul class="dropdown__menu">
                        <li><a href="detector.html" class="dropdown__link">탐지기</a></li>
                        <li><a href="overflow.html" class="dropdown__link">오버플로우</a></li>
                      </ul>
                    </li>
                    <li><a href="tip.html" class="nav__link">공략&TIP</a></li>
                    <li class="dropdown__item">
                      <div class="nav__link">
                        도구 <i class="ri-arrow-down-s-line dropdown__arrow"></i>
                      </div>
                      <ul class="dropdown__menu">
                        <li><a href="calculator.html" class="dropdown__link">데미지 계산기</a></li>
                      </ul>
                    </li>
                    <li class="dropdown__item">
                      <div class="nav__link">
                        사이트 <i class="ri-arrow-down-s-line dropdown__arrow"></i>
                      </div>
                      <ul class="dropdown__menu">
                        <li><a href="https://www.digimonsuperrumble.com/" class="dropdown__link" target="_blank">공식 홈페이지</a></li>
                        <li><a href="https://cafe.naver.com/movedsr" class="dropdown__link" target="_blank">공식 카페</a></li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </nav>
            </header>
        `;
    }
}

customElements.define("custom-nav", CustomNav);
