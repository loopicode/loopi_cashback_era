/**
 * Variant option tooltips – click-to-open modal behaviour.
 * Icon + bubble + modal source markup is rendered server-side by
 * snippets/variant-tooltip-icon.liquid; this only wires up the modal open/close.
 * Desktop hover-preview is pure CSS (see variant-tooltips.css).
 *
 * Uses event delegation on `document` instead of binding listeners directly
 * to each `.variant-tooltip-icon`/`.variant-tooltip-cta` element. Reason:
 * the tooltip markup lives inside `<variant-selects>`, which Shopify's
 * `product-info.js` completely replaces (via `HTMLUpdateUtility.viewTransition`)
 * every time the shopper picks a different option value (Zustand, Mietlaufzeit,
 * etc.). Listeners bound once at page load only ever exist on the *original*
 * DOM nodes, which get removed on the first option change — after that, taps/
 * clicks on the freshly-swapped-in icon did nothing until a full page reload
 * (most noticeable on mobile, since there's no hover fallback there). Event
 * delegation on `document` survives any number of DOM swaps because it never
 * depends on which physical node the listener is attached to.
 *
 * The modal itself is now a single, lazily-created, reusable element (built
 * once on first use, content + aria-labels refreshed per open) instead of one
 * modal per tooltip instance — avoids creating orphaned modal nodes every time
 * `<variant-selects>` is swapped in again.
 */
(function () {
  var modal = null;
  var modalTextEl = null;
  var closeBtn = null;

  function ensureModal() {
    if (modal) return;

    modal = document.createElement('div');
    modal.className = 'variant-tooltip-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    var modalContent = document.createElement('div');
    modalContent.className = 'variant-tooltip-modal-content';

    closeBtn = document.createElement('button');
    closeBtn.className = 'variant-tooltip-modal-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeModal);

    modalTextEl = document.createElement('div');
    modalTextEl.className = 'variant-tooltip-modal-text';

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(modalTextEl);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }

  function closeModal() {
    if (modal) modal.classList.remove('is-open');
  }

  function openModalFor(wrapper) {
    var source = wrapper.querySelector('.variant-tooltip-modal-source');
    if (!source) return;

    ensureModal();
    modal.setAttribute('aria-label', wrapper.dataset.modalAriaLabel || 'Info');
    closeBtn.setAttribute('aria-label', wrapper.dataset.closeAriaLabel || 'Close');
    modalTextEl.innerHTML = source.innerHTML;
    modal.classList.add('is-open');
  }

  function findWrapperFromTrigger(target) {
    var trigger = target.closest('.variant-tooltip-icon, .variant-tooltip-cta');
    if (!trigger) return null;
    return trigger.closest('.variant-tooltip-wrapper');
  }

  document.addEventListener('click', function (e) {
    var wrapper = findWrapperFromTrigger(e.target);
    if (!wrapper) return;
    e.preventDefault();
    e.stopPropagation();
    openModalFor(wrapper);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modal && modal.classList.contains('is-open')) closeModal();
      return;
    }

    if (e.key !== 'Enter' && e.key !== ' ') return;
    var wrapper = findWrapperFromTrigger(e.target);
    if (!wrapper) return;
    e.preventDefault();
    openModalFor(wrapper);
  });
})();
