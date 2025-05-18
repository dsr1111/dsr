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
            
            .feedback-btn-wrapper {
              display: flex;
              align-items: center;
              height: 100%;
            }
            
            @media screen and (max-width: 768px) {
              .feedback-btn-wrapper {
                justify-content: center;
              }
              .feedback-btn {
                margin-bottom: 20px;
              }
            }
          </style>
          <header class="header">
            <nav class="nav container">
              <div class="nav__data">
                <a href="../index.html">
                  <img src="../image/logo2.webp" class="nav__logo" />
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
                      <li><a href="../digimon.html" class="dropdown__link">도감</a></li>
                      <li><a href="../deck.html" class="dropdown__link">덱</a></li>
                      <li><a href="../evolution.html" class="dropdown__link">진화트리</a></li>
                    </ul>
                  </li>
                  <li><a href="../map.html" class="nav__link">맵</a></li>
                  <li class="dropdown__item">
                    <div class="nav__link dropdown__toggle">
                      던전 <i class="ri-arrow-down-s-line dropdown__arrow"></i>
                    </div>
                    <ul class="dropdown__menu">
                      <li><a href="../detector.html" class="dropdown__link">탐지기</a></li>
                      <li><a href="../overflow.html" class="dropdown__link">오버플로우</a></li>
                    </ul>
                  </li>
                  <li><a href="../tip.html" class="nav__link">공략&TIP</a></li>
                  <li class="dropdown__item">
                    <div class="nav__link dropdown__toggle">
                      도구 <i class="ri-arrow-down-s-line dropdown__arrow"></i>
                    </div>
                    <ul class="dropdown__menu">
                      <li><a href="../calculator.html" class="dropdown__link">데미지 계산기</a></li>
                      <li><a href="../exp.html" class="dropdown-item">경험치 물약 계산기</a></li>
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
                  <li class="feedback-btn-wrapper"><button class="feedback-btn" id="feedbackBtn">피드백</button></li>
                </ul>
              </div>
            </nav>
          </header>

          <div id="feedbackModal" class="modal">
            <div class="modal-content">
              <span class="close">&times;</span>
              <h2>피드백</h2>
              <form class="feedback-form" id="feedbackForm" action="https://formspree.io/f/xblokoep" method="POST">
                <select class="feedback-type" name="type" required>
                  <option value="" disabled selected hidden>문의 유형 선택</option>
                  <option value="error">오류 제보</option>
                  <option value="suggestion">건의사항</option>
                </select>
                <textarea class="feedback-content" name="content" placeholder="내용을 입력해주세요" required></textarea>
                <button type="submit" class="submit-btn">제출하기</button>
              </form>
            </div>
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
      

      // 피드백 모달 관련 이벤트 리스너
      if (feedbackBtn && modal) {
          feedbackBtn.addEventListener("click", () => {
              modal.style.display = "block";
          });

          closeBtn.addEventListener("click", () => {
              modal.style.display = "none";
          });

          window.addEventListener("click", (event) => {
              if (event.target === modal) {
                  modal.style.display = "none";
              }
          });

          // AJAX로 Formspree에 제출
          feedbackForm.addEventListener("submit", async (event) => {
              event.preventDefault();
              const type = feedbackForm.querySelector(".feedback-type").value;
              const content = feedbackForm.querySelector(".feedback-content").value;

              try {
                  const response = await fetch("https://formspree.io/f/xblokoep", {
                      method: "POST",
                      headers: {
                          "Accept": "application/json",
                          "Content-Type": "application/json"
                      },
                      body: JSON.stringify({ type, content })
                  });

                  if (response.ok) {
                      feedbackForm.reset();
                      modal.style.display = "none";
                      alert("피드백이 제출되었습니다. 감사합니다!");
                  } else {
                      alert("제출에 실패했습니다. 다시 시도해 주세요.");
                  }
              } catch (error) {
                  alert("오류가 발생했습니다. 다시 시도해 주세요.");
              }
          });
      }
  }
}

customElements.define("custom-nav", CustomNav);
