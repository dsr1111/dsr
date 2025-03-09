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
                    <div class="nav__link dropdown__toggle">
                      디지몬 <i class="ri-arrow-down-s-line dropdown__arrow"></i>
                    </div>
                    <ul class="dropdown__menu">
                      <li><a href="digimon.html" class="dropdown__link">도감</a></li>
                      <li><a href="evolution.html" class="dropdown__link">진화트리</a></li>
                    </ul>
                  </li>
                  <li><a href="map.html" class="nav__link">맵</a></li>
                  <li class="dropdown__item">
                    <div class="nav__link dropdown__toggle">
                      던전 <i class="ri-arrow-down-s-line dropdown__arrow"></i>
                    </div>
                    <ul class="dropdown__menu">
                      <li><a href="detector.html" class="dropdown__link">탐지기</a></li>
                      <li><a href="overflow.html" class="dropdown__link">오버플로우</a></li>
                    </ul>
                  </li>
                  <li><a href="tip.html" class="nav__link">공략&TIP</a></li>
                  <li class="dropdown__item">
                    <div class="nav__link dropdown__toggle">
                      도구 <i class="ri-arrow-down-s-line dropdown__arrow"></i>
                    </div>
                    <ul class="dropdown__menu">
                      <li><a href="calculator.html" class="dropdown__link">데미지 계산기</a></li>
                    </ul>
                  </li>
                  <li class="dropdown__item">
                    <div class="nav__link dropdown__toggle">
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

      this.addEventListeners();
  }

  addEventListeners() {
      const navToggle = this.shadowRoot.getElementById("nav-toggle");
      const navMenu = this.shadowRoot.getElementById("nav-menu");
      const dropdownItems = this.shadowRoot.querySelectorAll(".dropdown__item");

      // 햄버거 메뉴 열기/닫기
      if (navToggle && navMenu) {
          navToggle.addEventListener("click", () => {
              navMenu.classList.toggle("show-menu");
              navToggle.classList.toggle("show-icon");
          });
      }

      // 모바일 환경에서만 클릭으로 드롭다운 메뉴 열기
      if (window.innerWidth <= 768) {
          dropdownItems.forEach(item => {
              const toggle = item.querySelector(".dropdown__toggle");
              const menu = item.querySelector(".dropdown__menu");
              const arrow = item.querySelector(".dropdown__arrow");

              if (toggle && menu) {
                  toggle.addEventListener("click", (event) => {
                      event.preventDefault(); // 기본 동작 방지
                      menu.classList.toggle("show-dropdown");
                      arrow.classList.toggle("rotate-arrow");
                  });
              }
          });
      }
  }
}

customElements.define("custom-nav", CustomNav);
