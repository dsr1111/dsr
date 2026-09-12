(() => {
  "use strict";
  // Upload the contents of assets/gacha under this CDN prefix (keep the trailing slash).
  const assetBase = new URL('https://media.dsrwiki.com/assets/gacha/');
  const dialog = document.createElement("dialog");
  dialog.id = "presentation-dialog";
  dialog.setAttribute("aria-labelledby", "result-title");
  dialog.style.setProperty('--gacha-result-background', 'url("'+new URL('media/result-background.png', assetBase).href+'")');
  dialog.innerHTML = `
    <section class="result-window">
      <div class="presentation-topbar"><button type="button" id="result-close" aria-label="결과 화면 닫기">닫기 ×</button></div>
      <div class="result-stage"><div class="hero-rays" aria-hidden="true"></div><button type="button" class="hero-item" id="result-hero"></button></div>
      <h2 class="result-heading" id="result-title"></h2>
      <div class="result-grid-wrap"><div class="result-grid" id="result-grid" aria-label="공지 우선, Box_Grade 높은 순으로 표시한 획득 보상"></div></div>
      <div class="result-detail" id="result-detail" aria-live="polite"><strong></strong></div>
      <div class="result-actions"><button type="button" class="secondary" id="result-again">다시 개봉</button><button type="button" id="result-receive">확인</button></div>
    </section>
    <section class="result-video" aria-label="게임 원본 개봉 영상">
      <video id="result-movie" playsinline preload="none"></video>
      <div class="video-controls"><button type="button" id="result-skip">건너뛰기</button></div>
    </section>`;
  document.body.append(dialog);
  const video = dialog.querySelector("video");
  const hero = document.getElementById("result-hero");
  const grid = document.getElementById("result-grid");
  const detail = document.getElementById("result-detail");
  const title = document.getElementById("result-title");
  const boxGrade = entry => Number.isFinite(entry.presentationGrade) ? entry.presentationGrade : -1;
  let history = null;
  let phase = "closed";
  let videoTimer = null;
  let revealTimer = null;
  let returnFocus = null;
  let savedOverflow = "";
  let progressTime = 0;
  let pendingReopenCount = null;
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanName = name => name.replace(/\s*\(거래\s*(?:가능|불가)\)/g, "");
  function clearTimers() {
    clearTimeout(videoTimer);
    clearTimeout(revealTimer);
    videoTimer = revealTimer = null;
  }
  function remoteIcon(name) {
    return "https://media.dsrwiki.com/dsrwiki/item/" + encodeURIComponent(cleanName(name).replace(/:/g,"_").replace(/%/g,"^")) + ".webp";
  }
  function icon(entry, big = false) {
    const tile = document.createElement("span");
    tile.className = "reward-icon" + (big ? " hero-icon" : "");
    tile.dataset.grade = String(entry.item.grade || 1);
    const img = new Image();
    img.alt = cleanName(entry.item.name);
    img.decoding = "async";
    if (!big) img.loading = "lazy";
    img.src = entry.icon ? new URL(entry.icon, assetBase).href : remoteIcon(entry.item.name);
    img.onerror = () => {
      img.onerror = null;
      img.remove();
      const fallback = document.createElement("span");
      fallback.className = "icon-fallback";
      fallback.textContent = cleanName(entry.item.name);
      tile.prepend(fallback);
    };
    const mask = document.createElement("span");
    mask.className = "item-mask";
    mask.textContent = "?";
    mask.setAttribute("aria-hidden","true");
    tile.append(img, mask);
    return tile;
  }
  function selectDetail(index) {
    const entry = history.entries[index];
    detail.querySelector("strong").textContent = cleanName(entry.item.name);
  }
  function renderResults() {
    const first = history.entries[0];
    hero.replaceChildren(icon(first, true));
    hero.dataset.drawIndex = first.drawIndex;
    hero.setAttribute("aria-label", first.item.name+", "+first.item.count+"개");
    const quantity = document.createElement("span");
    quantity.className = "hero-quantity";
    quantity.textContent = "× "+first.item.count;
    hero.append(quantity);
    title.replaceChildren();
    const name = document.createElement("span");
    name.className = "box-name";
    name.textContent = history.name;
    const amount = document.createElement("span");
    amount.className = "open-count";
    amount.textContent = history.drawCount+"개";
    title.append(name, document.createTextNode(" 아이템을 "), amount, document.createTextNode(" 개봉하여 다음 아이템을 획득했습니다."));
    const fragment = document.createDocumentFragment();
    history.entries.forEach((entry, index) => {
      if (index === 0) return; // The entire representative stack is displayed above.
      const button = document.createElement("button");
      button.type = "button";
      button.className = "reward-button";
      button.dataset.index = index;
      button.dataset.drawIndex = entry.drawIndex;
      button.setAttribute("aria-label",entry.item.name+", "+entry.item.count+"개");
      const ordinal = document.createElement("span");
      ordinal.className = "draw-number";
      ordinal.textContent = String(index+1).padStart(2,"0");
      const count = document.createElement("span");
      count.className = "reward-count";
      count.textContent = "× "+entry.item.count;
      button.append(ordinal, icon(entry), count);
      fragment.append(button);
    });
    grid.replaceChildren(fragment);
    grid.parentElement.hidden = history.entries.length === 1;
    grid.parentElement.scrollTop = 0;
    selectDetail(0);
    document.getElementById("result-again").textContent = history.drawCount+"개 다시 개봉";
  }
  function reveal(instant = false, fallback = "") {
    if (phase === "closed") return;
    clearTimers();
    video.pause();
    phase = "results";
    dialog.dataset.phase = phase;
    if (fallback) console.warn(fallback+" · 결과는 재추첨하지 않았습니다.");
    const tiles = [hero.querySelector(".reward-icon"), ...grid.querySelectorAll(".reward-icon")];
    const show = () => {
      tiles.forEach((el, index) => {
        const delay = instant || reducedMotion() ? 0 : Math.min(index * 60, 900);
        el.querySelector(".item-mask").style.transitionDelay = delay+"ms";
        el.classList.add("is-revealed");
      });
    };
    if (instant || reducedMotion()) show();
    else revealTimer = setTimeout(show, 180);
    document.getElementById("result-receive").focus({preventScroll:true});
  }
  function playVideo() {
    phase = "video";
    dialog.dataset.phase = phase;
    const first = history.entries[0];
    const grade = first.presentationGrade || 1;
    video.muted = !document.getElementById("presentation-sound").checked;
    video.volume = .55;
    progressTime = 0;
    video.src = new URL("media/DSR_Random_Gacha_Seq_"+grade+".mp4", assetBase).href;
    video.load();
    videoTimer = setTimeout(() => reveal(false, "영상 로딩 지연으로 결과를 표시했습니다"), 10000);
    const promise = video.play();
    if (promise) promise.catch(() => {if(phase === "video") reveal(false, "영상 재생이 제한되어 결과를 표시했습니다");});
    document.getElementById("result-skip").focus({preventScroll:true});
  }
  function openHistory(play = true) {
    if (!history || !history.entries.length) return;
    clearTimers();
    returnFocus = document.activeElement;
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    renderResults();
    dialog.showModal();
    phase = "results";
    if (play && document.getElementById("presentation-enabled").checked && !reducedMotion()) playVideo();
    else reveal(true);
  }
  function close() {
    clearTimers();
    video.pause();
    phase = "closed";
    dialog.close();
  }
  video.addEventListener("ended", () => {if(phase === "video") reveal();});
  video.addEventListener("error", () => {if(phase === "video") reveal(false,"영상 로딩에 실패해 결과를 표시했습니다");});
  video.addEventListener("timeupdate", () => {
    if (phase !== "video" || video.currentTime <= progressTime) return;
    progressTime = video.currentTime;
    clearTimeout(videoTimer);
    videoTimer = setTimeout(() => reveal(false,"영상이 멈춰 결과를 표시했습니다"), 10000);
  });
  dialog.addEventListener("close", () => {
    clearTimers();
    video.pause();
    phase = "closed";
    document.body.style.overflow = savedOverflow;
    if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
    if (pendingReopenCount !== null) {
      const count = pendingReopenCount;
      pendingReopenCount = null;
      document.getElementById("gacha-count").value = count;
      document.getElementById("open-btn").click();
    }
  });
  dialog.addEventListener("cancel", e => {
    if(phase === "video") {e.preventDefault();reveal();}
  });
  hero.addEventListener("pointerenter", () => selectDetail(0));
  hero.addEventListener("focus", () => selectDetail(0));
  grid.addEventListener("pointerover", e => {
    const button = e.target.closest(".reward-button");
    if(button && !button.contains(e.relatedTarget)) selectDetail(Number(button.dataset.index));
  });
  grid.addEventListener("focusin", e => {
    const button = e.target.closest(".reward-button");
    if(button) selectDetail(Number(button.dataset.index));
  });
  document.getElementById("result-skip").addEventListener("click", () => reveal());
  document.getElementById("result-close").addEventListener("click", close);
  document.getElementById("result-receive").addEventListener("click", close);
  document.getElementById("result-again").addEventListener("click", () => {
    pendingReopenCount = history.drawCount;
    close();
  });
  document.getElementById("presentation-reopen").addEventListener("click", () => openHistory(false));
  window.GachaPresentation = {
    get busy() {return dialog.open;},
    present(box, results) {
      if (!box || !results.length || dialog.open) return;
      const assets = window.GACHA_PRESENTATION_ASSETS?.[box.id];
      // Sort a presentation-only copy; preserve draw results, logs and probabilities.
      const ranked = results.map((item, drawIndex) => ({
        item, drawIndex, ...(assets?.items.find(asset => asset.itemName === item.name && asset.itemCount === item.count) || {})
      })).sort((a, b) => Number(b.item.serverNotice === true)-Number(a.item.serverNotice === true)
        || boxGrade(b)-boxGrade(a) || a.drawIndex-b.drawIndex);
      const stacks = new Map();
      for (const entry of ranked) {
        // Full names retain trade restrictions. Quantity is not part of identity.
        const key = JSON.stringify([entry.item.name, entry.item.grade]);
        const stack = stacks.get(key);
        if (stack) stack.item.count += entry.item.count;
        else stacks.set(key, {...entry, item:{...entry.item}});
      }
      // Each stack inherits its highest-priority draw's video and position.
      history = {name:box.name, id:box.id, drawCount:results.length, entries:[...stacks.values()]};
      document.getElementById("presentation-reopen").disabled = false;
      if (document.getElementById("presentation-enabled").checked) openHistory(true);
    }
  };
})();
