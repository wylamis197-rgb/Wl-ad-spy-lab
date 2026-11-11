(() => {
  const names = /\b(?:zenly|zedly)\b/i;
  const selectors = 'button,a,[role="menuitem"],[role="tab"],li,[data-nav-item]';
  function removeLegacyEntry() {
    document.querySelectorAll(selectors).forEach(el => {
      const label = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (label && label.length <= 100 && names.test(label)) el.remove();
    });
    document.querySelectorAll('span,div,p,strong').forEach(el => {
      if (el.children.length > 1) return;
      const label = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!label || label.length > 40 || !names.test(label)) return;
      const item = el.closest('button,a,[role="menuitem"],[role="tab"],li,[data-nav-item]') || el;
      item.remove();
    });
  }
  removeLegacyEntry();
  new MutationObserver(removeLegacyEntry).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', event => {
    const target = event.target?.closest?.(selectors);
    if (target && names.test(target.textContent || '')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      target.remove();
    }
  }, true);
})();