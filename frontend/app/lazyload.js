function setLazyAttributes(target) {
  if (!target) return;
  const apply = (img) => {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    if (!img.hasAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }
  };

  if (target.tagName === 'IMG') {
    apply(target);
  } else {
    target.querySelectorAll?.('img').forEach(apply);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('img').forEach((img) => setLazyAttributes(img));

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          setLazyAttributes(node);
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
});


