class CustomNav extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
      this.shadowRoot.innerHTML = `
          <link href="https://cdn.jsdelivr.net/npm/remixicon@3.2.0/fonts/remixicon.css" rel="stylesheet"/>
          <link rel="stylesheet" href="assets/css/styles1.css">
          <style>
            .referral-floating {
              position: fixed;
              right: 18px;
              bottom: 18px;
              z-index: 1200;
              max-width: 320px;
              box-sizing: border-box;
              background-color: #ffffff;
              color: #333333;
              padding: 8px 10px;
              border-radius: 8px;
              border: 1px solid #c0c0c0;
              box-shadow: 0 2px 6px rgba(0,0,0,0.12);
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
              font-family: "Pretendard", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              white-space: nowrap;
            }

            .referral-floating__content {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }

            .referral-floating__highlight {
              font-weight: 600;
              color: #2c3e50;
            }

            .referral-floating__code {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              background-color: #f4f4f9;
              padding: 1px 5px;
              border-radius: 4px;
              border: 1px solid #d0d0d0;
              font-size: 14px;
              display: inline-block;
              cursor: pointer;
            }

            .referral-floating__subtext {
              opacity: 0.9;
            }

            .referral-floating__toggle {
              border: none;
              background: none;
              cursor: pointer;
              padding: 2px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: #888;
              font-size: 14px;
            }

            .referral-floating__collapsed-label {
              display: none;
              font-size: 14px;
              color: #555;
              white-space: nowrap;
              font-family: "Pretendard", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            .referral-floating--collapsed {
              padding: 4px;
              max-width: none;
              border-radius: 999px;
            }

            .referral-floating--collapsed .referral-floating__content,
            .referral-floating--collapsed .referral-floating__collapsed-label {
              display: none;
            }

            @media (max-width: 768px) {
              .referral-floating {
                right: 10px;
                bottom: 10px;
                max-width: 260px;
                padding: 7px 9px;
                font-size: 14px;
              }

              .referral-floating--collapsed {
                padding: 5px 7px;
              }
            }

            .feedback-btn {
              background-color: #3B82F6;
              color: white;
              padding: 8px 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              margin-left: 10px;
              display: flex;
              align-items: center;
              height: 32px;
              box-sizing: border-box;
            }
            
            .feedback-btn:hover {
              background-color: #2563EB;
            }
            
            .modal {
              display: none;
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0,0,0,0.5);
              z-index: 1000;
            }
            
            .modal-content {
              background-color: white;
              margin: 15% auto;
              padding: 20px;
              border-radius: 8px;
              width: 80%;
              max-width: 500px;
            }
            
            .modal-content h2 {
              margin-bottom: 16px;
            }
            
            .close {
              float: right;
              cursor: pointer;
              font-size: 24px;
            }
            
            .feedback-form {
              display: flex;
              flex-direction: column;
              gap: 15px;
            }
            
            .feedback-type {
              padding: 8px;
              border-radius: 4px;
              border: 1px solid #ddd;
            }
            
            .feedback-content {
              padding: 8px;
              border-radius: 4px;
              border: 1px solid #ddd;
              min-height: 100px;
              resize: vertical;
            }
            
            .submit-btn {
              background-color: #4CAF50;
              color: white;
              padding: 10px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            
            .submit-btn:hover {
              background-color: #45a049;
            }
            
            .feedback-expcarry-wrapper {
              display: flex;
              align-items: center;
              height: 100%;
            }
            .feedback-expcarry-wrapper .feedback-btn {
              margin-right: 4px;
            }
            
            .expcarry-btn {
              background-color: #27ae60;
              color: white;
              padding: 8px 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              margin-left: 10px;
              display: flex;
              align-items: center;
              height: 32px;
              box-sizing: border-box;
            }
            .expcarry-btn:hover {
              background-color: #219150;
            }
            
            @media screen and (max-width: 768px) {
              .feedback-btn-wrapper {
                justify-content: center;
              }
              .feedback-btn, .expcarry-btn {
                margin-bottom: 20px;
              }
            }
          </style>
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
                  <li class="dropdown__item">
                    <div class="nav__link dropdown__toggle">
                      디지몬 <i class="ri-arrow-down-s-line dropdown__arrow"></i>
                    </div>
                    <ul class="dropdown__menu">
                      <li><a href="../digimon" class="dropdown__link">도감</a></li>
                      <li><a href="../deck" class="dropdown__link">덱</a></li>
                      <li><a href="../evolution" class="dropdown__link">진화트리</a></li>
                    </ul>
                  </li>
                  <li><a href="../map" class="nav__link">맵</a></li>
                  <li class="dropdown__item">
                    <div class="nav__link dropdown__toggle">
                      던전 <i class="ri-arrow-down-s-line dropdown__arrow"></i>
                    </div>
                    <ul class="dropdown__menu">
                      <li><a href="../detector" class="dropdown__link">탐지기</a></li>
                      <li><a href="../overflow" class="dropdown__link">오버플로우</a></li>
                    </ul>
                  </li>
                  <li class="dropdown__item">
                    <div class="nav__link dropdown__toggle">
                      도구 <i class="ri-arrow-down-s-line dropdown__arrow"></i>
                    </div>
                    <ul class="dropdown__menu">
                      <li><a href="../calculator" class="dropdown__link">데미지 계산기</a></li>
                      <li><a href="../exp" class="dropdown__link">EXP 물약 시뮬레이터</a></li>
                      <li><a href="../gacha" class="dropdown__link">가챠 시뮬레이터</a></li>
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
                  <li class="feedback-expcarry-wrapper">
                    <button class="feedback-btn" id="feedbackBtn">피드백</button>
                    <button class="expcarry-btn" id="expcarryBtn">쫄작 문의</button>
                  </li>
                </ul>
              </div>
            </nav>
          </header>
          <div class="referral-floating" id="referralFloating">
            <button class="referral-floating__toggle" id="toggleReferralBtn" aria-label="추천 코드 박스 접기/펴기">
              <i class="ri-arrow-down-s-line"></i>
            </button>
            <div class="referral-floating__content">
              <span class="referral-floating__highlight">DSR WIKI가 도움이 되셨나요?</span>
              <span class="referral-floating__subtext">추천인 코드 <span class="referral-floating__code" id="referralCode">VY9YJ8</span> 입력 부탁드립니다!</span>
            </div>
            <span class="referral-floating__collapsed-label">추천인 코드 VY9YJ8</span>
          </div>
      `;

      this.addEventListeners();
  }

  addEventListeners() {
      const navToggle = this.shadowRoot.getElementById("nav-toggle");
      const navMenu = this.shadowRoot.getElementById("nav-menu");
      const dropdownItems = this.shadowRoot.querySelectorAll(".dropdown__item");
      const feedbackBtn = this.shadowRoot.getElementById("feedbackBtn");
      const modal = this.shadowRoot.getElementById("feedbackModal");
      const closeBtn = this.shadowRoot.querySelector(".close");
      const feedbackForm = this.shadowRoot.getElementById("feedbackForm");
      const expcarryBtn = this.shadowRoot.getElementById("expcarryBtn");
      const referralCode = this.shadowRoot.getElementById("referralCode");
      const referralFloating = this.shadowRoot.getElementById("referralFloating");
      const toggleReferralBtn = this.shadowRoot.getElementById("toggleReferralBtn");

      // 기존 이벤트 리스너
      if (navToggle && navMenu) {
          navToggle.addEventListener("click", () => {
              navMenu.classList.toggle("show-menu");
              navToggle.classList.toggle("show-icon");
          });
      }

      if (window.innerWidth <= 768) {
        dropdownItems.forEach(item => {
          const toggle = item.querySelector(".dropdown__toggle");
          const menu = item.querySelector(".dropdown__menu");
          const arrow = item.querySelector(".dropdown__arrow");
      
          toggle.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // 현재 메뉴의 상태 확인
            const isOpen = menu.classList.contains("show-dropdown");
            
            // 모든 메뉴 닫기
            dropdownItems.forEach(otherItem => {
              if (otherItem !== item) {
                const otherMenu = otherItem.querySelector(".dropdown__menu");
                const otherArrow = otherItem.querySelector(".dropdown__arrow");
                otherMenu.classList.remove("show-dropdown");
                otherArrow.classList.remove("rotate-arrow");
              }
            });
            
            // 현재 메뉴 토글
            if (isOpen) {
              menu.classList.remove("show-dropdown");
              arrow.classList.remove("rotate-arrow");
            } else {
              menu.classList.add("show-dropdown");
              arrow.classList.add("rotate-arrow");
            }
          });
        });

        // 메뉴 외부 클릭시 모든 메뉴 닫기
        document.addEventListener("click", function(e) {
          if (!e.target.closest(".dropdown__item")) {
            dropdownItems.forEach(item => {
              const menu = item.querySelector(".dropdown__menu");
              const arrow = item.querySelector(".dropdown__arrow");
              menu.classList.remove("show-dropdown");
              arrow.classList.remove("rotate-arrow");
            });
          }
        });
      }


      if (feedbackBtn) {
        feedbackBtn.addEventListener("click", () => {
          window.open("https://forms.gle/7xSaJBz4A28CPY4z9", "_blank");
        });
      }

      if (expcarryBtn) {
        expcarryBtn.addEventListener("click", () => {
          window.open("https://open.kakao.com/o/gUkDeqpg", "_blank");
        });
      }

      if (referralCode) {
        referralCode.addEventListener("click", async (e) => {
          e.stopPropagation();
          const code = "VY9YJ8";
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(code);
            } else {
              // clipboard API 미지원 브라우저 대응
              const tempInput = document.createElement("input");
              tempInput.value = code;
              document.body.appendChild(tempInput);
              tempInput.select();
              document.execCommand("copy");
              document.body.removeChild(tempInput);
            }
            alert("추천인 코드가 복사되었습니다: " + code);
          } catch (e) {
            alert("복사에 실패했습니다. 직접 입력해 주세요: " + code);
          }
        });
      }

      if (referralFloating && toggleReferralBtn) {
        const STORAGE_KEY = "dsrReferralCollapsed";

        const applyInitialState = () => {
          try {
            const saved = window.localStorage ? localStorage.getItem(STORAGE_KEY) : null;
            const collapsed = saved === "1";
            if (collapsed) {
              referralFloating.classList.add("referral-floating--collapsed");
              toggleReferralBtn.innerHTML = '<i class="ri-arrow-up-s-line"></i>';
            }
          } catch (e) {
            // localStorage 사용 불가 시 무시
          }
        };

        const toggleState = () => {
          const willCollapse = !referralFloating.classList.contains("referral-floating--collapsed");
          if (willCollapse) {
            referralFloating.classList.add("referral-floating--collapsed");
            toggleReferralBtn.innerHTML = '<i class="ri-arrow-up-s-line"></i>';
          } else {
            referralFloating.classList.remove("referral-floating--collapsed");
            toggleReferralBtn.innerHTML = '<i class="ri-arrow-down-s-line"></i>';
          }

          try {
            if (window.localStorage) {
              localStorage.setItem(STORAGE_KEY, willCollapse ? "1" : "0");
            }
          } catch (e) {
            // localStorage 사용 불가 시 무시
          }
        };

        applyInitialState();

        toggleReferralBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleState();
        });

        // 접힌 상태에서도 전체 박스를 클릭하면 펼쳐지도록
        referralFloating.addEventListener("click", () => {
          if (referralFloating.classList.contains("referral-floating--collapsed")) {
            toggleState();
          }
        });
      }

      function unifyDropdownWidths() {
      const menus = document.querySelectorAll('.dropdown__menu');

      menus.forEach(menu => {
        const links = menu.querySelectorAll('.dropdown__link');
        let maxWidth = 0;

        // 너비 측정 (보이기 전에 display: none 상태면 제대로 안 잡힐 수 있음)
        links.forEach(link => {
          link.style.width = 'auto'; // 초기화
          const width = link.offsetWidth;
          if (width > maxWidth) maxWidth = width;
        });

        // 최대 너비로 통일
        links.forEach(link => {
          link.style.width = maxWidth + 'px';
        });
      });
    }

    window.addEventListener('load', unifyDropdownWidths);
    window.addEventListener('resize', unifyDropdownWidths);
    
  }
}

customElements.define("custom-nav", CustomNav);



