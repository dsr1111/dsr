/**
 * Referral Code Floating Widget
 * 추천인 코드 홍보 플로팅 위젯
 */

const REFERRAL_CODE = 'A2USQRY';

class ReferralFloat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isCollapsed = false; // 기본적으로 펼쳐진 상태
  }

  connectedCallback() {
    // 추천인 코드 기간 종료로 인한 숨김 처리
    this.style.display = 'none';
    return;

    // this.render();
    // this.initEvents();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link href="https://cdn.jsdelivr.net/npm/remixicon@3.2.0/fonts/remixicon.css" rel="stylesheet"/>
      <link rel="stylesheet" href="assets/css/components/referral-float.css">
      
      <div class="referral-float" id="referralWidget">
        <div class="referral-panel">
          <!-- Header with toggle button -->
          <div class="referral-header" id="referralHeader">
            <span class="referral-title">추천인 코드</span>
            <button class="referral-toggle" id="referralToggle" aria-label="접기/펼치기">
              <i class="ri-arrow-down-s-line"></i>
            </button>
          </div>

          <!-- Content (collapsible) -->
          <div class="referral-content" id="referralContent">
            <div class="referral-code-box">
              <span class="referral-code" id="codeText">${REFERRAL_CODE}</span>
              <button class="referral-copy-btn" id="copyBtn">
                <i class="ri-file-copy-line"></i>
                <span>복사</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initEvents() {
    const widget = this.shadowRoot.getElementById('referralWidget');
    const header = this.shadowRoot.getElementById('referralHeader');
    const copyBtn = this.shadowRoot.getElementById('copyBtn');

    // Toggle collapse/expand when clicking header
    header.addEventListener('click', (e) => {
      // 복사 버튼 클릭은 제외
      if (e.target.closest('#copyBtn')) return;

      this.isCollapsed = !this.isCollapsed;
      widget.classList.toggle('collapsed', this.isCollapsed);
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();

      try {
        await navigator.clipboard.writeText(REFERRAL_CODE);
        this.showCopyFeedback(copyBtn);
      } catch (err) {
        this.fallbackCopy(REFERRAL_CODE, copyBtn);
      }
    });
  }

  showCopyFeedback(btn) {
    btn.classList.add('copied');
    btn.innerHTML = '<i class="ri-check-line"></i><span>완료</span>';

    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = '<i class="ri-file-copy-line"></i><span>복사</span>';
    }, 1500);
  }

  fallbackCopy(text, btn) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      this.showCopyFeedback(btn);
    } catch (err) {
      console.error('Copy failed:', err);
    }

    document.body.removeChild(textarea);
  }
}

customElements.define('referral-float', ReferralFloat);
