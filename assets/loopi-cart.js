(() => {
  'use strict';
  const configNode = document.getElementById('loopi-cart-config');
  if (!configNode || window.LoopiCart) return;
  const config = JSON.parse(configNode.textContent);
  const originalFetch = window.fetch.bind(window);
  const root = () => window.Shopify?.routes?.root || '/';
  let queue = Promise.resolve();
  let revision = 0;
  let pending = 0;
  let checkoutBusy = false;
  const messages = config.messages;
  const request = async (url, options = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      return await originalFetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  };
  const readJSON = async (url, options) => {
    const response = await request(url, options);
    const data = await response.json();
    if (!response.ok || data.errors || data.error) throw new Error('checkout_error');
    return data;
  };
  const fingerprint = (cart) => JSON.stringify([
    cart.currency, cart.total_price,
    cart.items.map((item) => [item.key, item.variant_id, item.quantity]),
  ]);
  const validateSnapshot = (cart, snapshot) => {
    if (!Array.isArray(snapshot?.items) || snapshot.currency !== cart.currency || snapshot.total !== cart.total_price ||
        snapshot.items.length !== cart.items.length) throw new Error('metadata_error');
    for (const item of cart.items) {
      const line = snapshot.items.find((entry) => entry.key === item.key);
      if (!line || line.variant_id !== item.variant_id || line.quantity !== item.quantity ||
          typeof line.subscription !== 'boolean' || (line.subscription_type && line.subscription_type !== 'boolean')) {
        throw new Error('metadata_error');
      }
    }
    return snapshot;
  };
  const rentalTerm = (line) => {
    let duration = line.duration;
    if (duration == null || duration === '') {
      const option = line.options?.find((entry) => /\d+\+?\s*(Monate?|Months?|mois)/i.test(entry.value));
      duration = option?.value.match(/\d+/)?.[0];
    }
    duration = Number(duration);
    const interval = Number(line.interval ?? 1);
    const period = line.period || 'monthly';
    if (!Number.isInteger(duration) || duration < 1 || !Number.isInteger(interval) || interval < 1 ||
        !['daily', 'weekly', 'monthly', 'yearly'].includes(period)) throw new Error('metadata_error');
    return { duration, interval, period };
  };
  const buildPayload = (cart, snapshot) => {
    validateSnapshot(cart, snapshot);
    if (cart.total_discount > 0 || cart.items.some((item) => item.selling_plan_allocation ||
        Object.keys(item.properties || {}).length > 0 || item.gift_card)) throw new Error('unsupported');
    const cartId = cart.token?.split('?')[0];
    if (!cartId) throw new Error('metadata_error');
    return {
      cart_id: cartId,
      items: cart.items.map((item) => {
        const line = snapshot.items.find((entry) => entry.key === item.key);
        const result = { sku: item.variant_id, quantity: item.quantity, subscription: line.subscription };
        if (line.subscription) {
          const term = rentalTerm(line);
          Object.assign(result, {
            subscription_duration: term.duration,
            subscription_interval: term.interval,
            subscription_period: term.period,
          });
        }
        return result;
      }),
    };
  };
  const hasSubscription = (snapshot) => snapshot.items.some((line) => line.subscription === true);
  const showError = (key) => {
    document.querySelectorAll('[data-loopi-checkout-error]').forEach((node) => {
      node.textContent = messages[key] || messages.checkout_error;
      node.hidden = false;
    });
  };
  const checkoutButtons = () => document.querySelectorAll('button[name="checkout"], input[name="checkout"]');
  const setBusy = (busy) => {
    document.documentElement.toggleAttribute('data-loopi-checkout-busy', busy);
    checkoutButtons().forEach((button) => {
      if (busy) {
        button.dataset.loopiWasDisabled = String(button.disabled);
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
      } else {
        button.disabled = button.dataset.loopiWasDisabled === 'true';
        button.removeAttribute('aria-busy');
        delete button.dataset.loopiWasDisabled;
      }
    });
  };
  const cartJSON = () => readJSON(root() + 'cart.js', { cache: 'no-store' });
  const snapshotJSON = async () => {
    const url = new URL(root() + 'cart', window.location.origin);
    url.searchParams.set('section_id', 'loopi-cart-data');
    const response = await request(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('metadata_error');
    const html = new DOMParser().parseFromString(await response.text(), 'text/html');
    const data = html.querySelector('[data-loopi-cart-data]');
    if (!data) throw new Error('metadata_error');
    return JSON.parse(data.textContent);
  };
  const settle = async () => {
    document.querySelectorAll('cart-items input[name="updates[]"], cart-drawer-items input[name="updates[]"]').forEach((input) => {
      if (input.value !== input.getAttribute('value')) input.closest('cart-items, cart-drawer-items').validateQuantity({ target: input });
    });
    await queue;
    if (pending) throw new Error('pending');
  };
  const prepare = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      await settle();
      const version = revision;
      const cart = await cartJSON();
      const snapshot = await snapshotJSON();
      const check = await cartJSON();
      if (version !== revision || fingerprint(cart) !== fingerprint(check)) continue;
      return { cart, snapshot: validateSnapshot(cart, snapshot) };
    }
    throw new Error('pending');
  };
  const navigate = async () => {
    if (checkoutBusy) return;
    const settling = settle();
    checkoutBusy = true;
    setBusy(true);
    document.querySelectorAll('[data-loopi-checkout-error]').forEach((node) => { node.hidden = true; });
    try {
      await settling;
      const { cart, snapshot } = await prepare();
      if (!cart.items.length) throw new Error('empty');
      if (!hasSubscription(snapshot)) {
        window.location.assign(root() + 'checkout');
        return;
      }
      if (!config.apiKey) throw new Error('checkout_error');
      const payload = buildPayload(cart, snapshot);
      const encodedKey = encodeURIComponent(config.apiKey);
      const encodedCart = encodeURIComponent(payload.cart_id);
      const response = await request(new URL(`/v1/${encodedKey}/cart/${encodedCart}/create`, config.apiBase), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('checkout_error');
      const body = await response.text();
      if (body) {
        let result;
        try { result = JSON.parse(body); } catch { throw new Error('checkout_error'); }
        if (result.error || result.errors || result.success === false) throw new Error('checkout_error');
      }
      const finalCart = await cartJSON();
      if (fingerprint(finalCart) !== fingerprint(cart)) throw new Error('pending');
      window.location.assign(new URL(`/${encodedKey}/${encodedCart}`, config.checkoutBase).href);
    } catch (error) {
      showError(error.message);
    } finally {
      checkoutBusy = false;
      setBusy(false);
    }
  };
  window.fetch = function(input, options) {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, window.location.origin);
    const method = (options?.method || input?.method || 'GET').toUpperCase();
    if (url.origin !== window.location.origin || method !== 'POST' || !/\/cart\/(add|change|update|clear)(\.js)?\/?$/.test(url.pathname)) {
      return originalFetch(input, options);
    }
    if (checkoutBusy) return Promise.reject(new Error('pending'));
    pending++;
    const operation = queue.then(() => request(input, options));
    queue = operation.then(() => {}, () => {}).finally(() => { pending--; revision++; });
    return operation;
  };
  window.LoopiCart = { navigate, prepare, buildPayload, validateSnapshot, hasSubscription, rentalTerm, fingerprint };
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button[name="checkout"], input[name="checkout"], [data-loopi-checkout]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate().catch((error) => showError(error.message));
  }, true);
  document.addEventListener('submit', (event) => {
    if (!event.target.matches('#cart, #CartDrawer-Form') || (event.submitter && event.submitter.name !== 'checkout')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate().catch((error) => showError(error.message));
  }, true);
  window.addEventListener('pageshow', async (event) => {
    if (!event.persisted) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('sections', 'cart-drawer,cart-icon-bubble');
      const sections = await readJSON(url, { cache: 'no-store' });
      const drawer = document.querySelector('cart-drawer');
      if (drawer) {
        const html = new DOMParser().parseFromString(sections['cart-drawer'], 'text/html');
        document.getElementById('CartDrawer').innerHTML = html.getElementById('CartDrawer').innerHTML;
        drawer.classList.toggle('is-empty', !html.querySelector('.cart-item'));
        drawer.querySelector('#CartDrawer-Overlay').addEventListener('click', () => drawer.close());
      }
      const icon = document.getElementById('cart-icon-bubble');
      if (icon && sections['cart-icon-bubble']) icon.innerHTML = new DOMParser().parseFromString(sections['cart-icon-bubble'], 'text/html').querySelector('.shopify-section').innerHTML;
    } catch { window.location.reload(); }
  });
  const refreshLabels = () => {
    document.querySelectorAll('product-info').forEach((product) => {
      const data = product.querySelector('[data-loopi-rental-variants]');
      if (!data) return;
      const variants = JSON.parse(data.textContent);
      const id = product.querySelector('input[name="id"]')?.value;
      const rental = variants[id] === true;
      product.querySelectorAll('.per-month').forEach((node) => { node.style.display = rental ? 'block' : 'none'; });
      product.querySelectorAll('.one-time').forEach((node) => { node.style.display = rental ? 'none' : 'block'; });
    });
  };
  document.addEventListener('change', (event) => {
    if (event.target.name === 'id') refreshLabels();
  });
  document.addEventListener('product-info:loaded', refreshLabels);
  if (typeof subscribe === 'function') subscribe(PUB_SUB_EVENTS.variantChange, refreshLabels);
  refreshLabels();

  class LoopiCartUpsells extends HTMLElement {
    connectedCallback() {
      this.controller = new AbortController();
      this.addEventListener('submit', this.onSubmit.bind(this), { signal: this.controller.signal });
      this.load();
    }
    disconnectedCallback() { this.controller?.abort(); }
    async load() {
      for (const intent of ['complementary', 'related']) {
        try {
          const url = new URL(root() + 'recommendations/products', window.location.origin);
          url.search = new URLSearchParams({ product_id: this.dataset.productId, section_id: 'loopi-cart-upsells', limit: '6', intent }).toString();
          const response = await request(url);
          if (!response.ok) continue;
          const html = new DOMParser().parseFromString(await response.text(), 'text/html');
          if (!this.isConnected) return;
          const cards = html.querySelector('.loopi-upsell-list');
          if (!cards?.querySelector('.loopi-upsell-card')) continue;
          this.querySelector('[data-loopi-upsell-content]').replaceChildren(cards);
          return;
        } catch { if (!this.isConnected) return; }
      }
      this.hidden = true;
    }
    async onSubmit(event) {
      const form = event.target.closest('[data-loopi-upsell-form]');
      if (!form) return;
      event.preventDefault();
      const button = form.querySelector('button');
      if (button.disabled || checkoutBusy) return;
      button.disabled = true;
      const error = form.querySelector('[data-loopi-upsell-error]');
      error.hidden = true;
      try {
        const drawer = document.querySelector('cart-drawer');
        const data = new FormData(form);
        data.set('quantity', '1');
        data.set('sections', drawer ? 'cart-drawer,cart-icon-bubble' : 'cart-icon-bubble');
        data.set('sections_url', window.location.pathname);
        const response = await fetch(root() + 'cart/add.js', { method: 'POST', body: data });
        const result = await response.json();
        if (!response.ok || result.status) throw new Error(result.description || messages.checkout_error);
        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'loopi-upsell', cartData: result });
        if (drawer) { drawer.classList.remove('is-empty'); drawer.setActiveElement(document.getElementById('cart-icon-bubble')); drawer.renderContents(result); }
        else if (result.sections?.['cart-icon-bubble']) {
          document.getElementById('cart-icon-bubble').innerHTML = new DOMParser().parseFromString(result.sections['cart-icon-bubble'], 'text/html').querySelector('.shopify-section').innerHTML;
        }
      } catch (failure) {
        error.textContent = failure.message;
        error.hidden = false;
      } finally { button.disabled = false; }
    }
  }
  customElements.define('loopi-cart-upsells', LoopiCartUpsells);

  class LoopiStickyCart extends HTMLElement {
    connectedCallback() {
      this.controller = new AbortController();
      const signal = this.controller.signal;
      this.select = this.querySelector('select[name="id"]');
      this.button = this.querySelector('button[name="add"]');
      this.main = document.querySelector('product-info[id^="MainProduct"]');
      if (!this.main || !this.select) return;
      this.main.addEventListener('change', (event) => {
        if (event.target.name !== 'id') return;
        this.select.value = event.target.value;
        this.update();
      }, { signal });
      this.select.addEventListener('change', () => {
        this.update();
        this.button.disabled = true;
        this.main.resetProductFormState();
        const productURL = this.main.dataset.url;
        this.main.renderProductInfo({
          requestUrl: `${productURL}?variant=${encodeURIComponent(this.select.value)}&section_id=${encodeURIComponent(this.main.dataset.section)}`,
          targetId: this.main.querySelector('variant-selects')?.id,
          callback: this.main.handleUpdateProductInfo(productURL),
        });
      }, { signal });
      this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, ({ data }) => {
        if (data.sectionId !== this.main.dataset.section) return;
        if (data.variant) this.select.value = String(data.variant.id);
        this.update();
        this.button.disabled = !data.variant?.available;
      });
      const onScroll = () => {
        const mainButton = this.main.querySelector('button[name="add"]');
        const show = mainButton && mainButton.getBoundingClientRect().bottom + Number(this.dataset.offset || 0) < 0;
        this.classList.toggle('show', Boolean(show));
        this.inert = !show;
        document.documentElement.style.paddingBottom = show ? `${this.clientHeight}px` : '';
      };
      window.addEventListener('scroll', onScroll, { signal, passive: true });
      window.addEventListener('resize', onScroll, { signal, passive: true });
      this.update();
      onScroll();
    }
    update() {
      const option = this.select.selectedOptions[0];
      this.button.disabled = !option || option.dataset.available !== 'true';
      const image = this.querySelector('.product-content img');
      if (image && option?.dataset.img) image.src = option.dataset.img;
      const price = this.querySelector('.price-item--regular');
      if (price && option) price.textContent = option.dataset.price;
      const rental = option?.dataset.subscription === 'true';
      this.querySelectorAll('.per-month').forEach((node) => { node.style.display = rental ? 'block' : 'none'; });
      this.querySelectorAll('.one-time').forEach((node) => { node.style.display = rental ? 'none' : 'block'; });
    }
    disconnectedCallback() {
      this.controller?.abort();
      this.unsubscribe?.();
      document.documentElement.style.paddingBottom = '';
    }
  }
  customElements.define('loopi-sticky-cart', LoopiStickyCart);
})();
