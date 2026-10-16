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
  const accessoryPlan = (items, candidates, month) => {
    const main = items.filter((item) => !item.tags.includes('Kategorie:Zubehör'));
    const strollers = main.filter((item) => item.tags.includes('Kategorie:Kinderwagen') || item.type === 'Kinderwagen');
    const trailers = main.filter((item) => item.tags.includes('Kategorie:Velo-Anhänger'));
    const bugaboo = strollers.filter((item) => item.vendor.toLowerCase() === 'bugaboo' || item.tags.includes('Marke:Bugaboo'));
    const model = (name) => bugaboo.some((item) => item.tags.includes('Modell:' + name));
    const donkeyMounts = new Set();
    bugaboo.filter((item) => item.tags.includes('Modell:Donkey')).forEach((item) => {
      // Handles distinguish Mono/Duo/Double from Twin; shared model tags do not.
      const tokens = item.handle.toLowerCase().split('-');
      if (tokens.includes('twin')) donkeyMounts.add('Twin');
      else if (['mono', 'duo', 'double'].some((name) => tokens.includes(name))) donkeyMounts.add('Mono');
    });
    const urbanGlide = strollers.some((item) =>
      (item.vendor.toLowerCase() === 'thule' || item.tags.includes('Marke:Thule')) && item.tags.includes('Modell:Urban Glide'));
    const adapters = new Set(['bugaboo-donkey-car-seats-adapter', 'bugaboo-fox-car-seats-adapter', 'thule-urban-glide-autositz-adapter']);
    const mounts = [];
    if (model('Butterfly')) mounts.push('Butterfly');
    if (['Fox', 'Dragonfly', 'Donkey'].some(model)) mounts.push('Donkey Fox Dragonfly');
    const handled = strollers.length > 0 || trailers.length > 0 || items.every((item) => item.tags.includes('Kategorie:Zubehör'));
    const winter = month >= 9 || month <= 3;
    const scores = {
      'sleepytroll-baby-rocker-gen-2': strollers.length ? 95 : 0,
      'bugaboo-performance-footmuff': strollers.length || trailers.length ? (winter ? 100 : 45) : 0,
      'bugaboo-butterfly-transporttasche': model('Butterfly') ? 90 : 0,
      'bugaboo-komfort-transporttasche': model('Donkey') ? 90 : 0,
      'bugaboo-comfort-wheeled-board': mounts.length ? 80 : 0,
      'bugaboo-donkey-car-seats-adapter': donkeyMounts.size ? 75 : 0,
      'bugaboo-fox-car-seats-adapter': model('Fox') ? 75 : 0,
      'thule-urban-glide-autositz-adapter': urbanGlide ? 75 : 0,
      'bugaboo-organizer': bugaboo.length ? 60 : 0,
      'bugaboo-seat-liner': bugaboo.length ? 50 : 0,
      'nicon-wheelblades-xl-paar-schneetaugliche-kinderwagen-in-sekundenschnelle': strollers.length ? 40 : 0,
    };
    const rentalBasket = items.some((item) => item.subscription === true);
    const present = new Set(items.map((item) => item.handle));
    const cards = candidates.flatMap((candidate) => {
      const score = scores[candidate.handle] || 0;
      if (!score || present.has(candidate.handle)) return [];
      const options = candidate.options.filter((option) => {
        if (candidate.handle === 'bugaboo-comfort-wheeled-board') return mounts.includes(option.mount);
        if (candidate.handle === 'bugaboo-donkey-car-seats-adapter') return donkeyMounts.has(option.mount);
        return true;
      });
      if (!options.length) return [];
      const preferred = options.find((option) => option.subscription === rentalBasket);
      const mixedMounts = candidate.handle === 'bugaboo-comfort-wheeled-board' && new Set(options.map((option) => option.mount)).size > 1;
      const adapter = adapters.has(candidate.handle);
      const needsChoice = adapter || mixedMounts || !preferred;
      return [{ handle: candidate.handle, options, score, adapter, needsChoice, selected: needsChoice ? null : preferred.id }];
    }).sort((a, b) => b.score - a.score || a.handle.localeCompare(b.handle));
    return { handled, cards };
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
    if (cart.items.some((item) => item.selling_plan_allocation ||
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
  window.LoopiCart = { navigate, prepare, buildPayload, validateSnapshot, hasSubscription, rentalTerm, fingerprint, accessoryPlan };
  const feedbackSelector = [
    '#cart-icon-bubble', 'button[name="add"]', 'button[name="checkout"]',
    'input[name="checkout"]', '[data-loopi-checkout]', '.shopify-payment-button__button',
    '[data-loopi-upsell-form] button[type="submit"]',
    'cart-drawer button', 'cart-remove-button button',
    'cart-items .quantity__button', 'cart-drawer-items .quantity__button',
  ].join(', ');
  const feedbackAnimations = new WeakMap();
  const pressFeedback = (event) => {
    if (event.type === 'pointerdown' && (event.button !== 0 || event.isPrimary === false)) return;
    if (event.type === 'click' && event.detail !== 0) return;
    const button = event.target.closest(feedbackSelector);
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true' || !button.animate) return;
    feedbackAnimations.get(button)?.cancel();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animation = button.animate(
      reduced ? [{ opacity: 1 }, { opacity: 0.72 }, { opacity: 1 }]
        : [{ scale: '1' }, { scale: '0.96', offset: 0.4 }, { scale: '1' }],
      { duration: 180, easing: 'ease-out' }
    );
    feedbackAnimations.set(button, animation);
  };
  document.addEventListener('pointerdown', pressFeedback, true);
  document.addEventListener('click', pressFeedback, true);
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
      this.addEventListener('change', (event) => {
        if (event.target.name !== 'id') return;
        const option = event.target.selectedOptions[0];
        const price = event.target.closest('form').querySelector('[data-loopi-upsell-price]');
        if (price && option) price.textContent = option.dataset.price || '';
        const button = event.target.closest('form').querySelector('button');
        if (button) button.disabled = !event.target.value;
      }, { signal: this.controller.signal });
      this.load();
    }
    disconnectedCallback() { this.controller?.abort(); }
    renderPlan(html, data, plan) {
      const list = document.createElement('div');
      list.className = 'loopi-upsell-list';
      const heading = document.createElement('h3');
      heading.textContent = data.messages.heading;
      list.append(heading);
      let more;
      plan.cards.forEach((card, index) => {
        const template = html.querySelector('template[data-loopi-accessory="' + card.handle + '"]');
        const article = template.content.firstElementChild.cloneNode(true);
        const select = article.querySelector('select');
        select.id = 'LoopiUpsell-' + (this.closest('#CartDrawer') ? 'drawer' : 'page') + '-' + card.handle;
        article.querySelector('label').htmlFor = select.id;
        const ids = new Set(card.options.map((option) => option.id));
        Array.from(select.options).forEach((option) => { if (!ids.has(option.value)) option.remove(); });
        if (card.needsChoice) {
          const placeholder = document.createElement('option');
          placeholder.value = '';
          placeholder.disabled = true;
          placeholder.selected = true;
          placeholder.textContent = card.adapter ? data.messages.adapter_choice : data.messages.choose;
          select.prepend(placeholder);
          select.selectedIndex = 0;
        } else select.value = card.selected;
        const selected = select.selectedOptions[0];
        article.querySelector('[data-loopi-upsell-price]').textContent = selected?.dataset.price || '';
        article.querySelector('button[type="submit"]').disabled = !select.value;
        if (index < 3) list.append(article);
        else {
          if (!more) {
            more = document.createElement('details');
            more.className = 'loopi-upsell-more';
            const summary = document.createElement('summary');
            summary.textContent = data.messages.more;
            more.append(summary);
            more.addEventListener('toggle', () => {
              if (!more.open || !this.closest('.drawer__footer')) return;
              this.scrollTop += more.getBoundingClientRect().top - this.getBoundingClientRect().top;
            }, { signal: this.controller.signal });
            list.append(more);
          }
          more.append(article);
        }
      });
      this.querySelector('[data-loopi-upsell-content]').replaceChildren(list);
      this.hidden = !plan.cards.length;
    }
    async load() {
      try {
        const url = new URL(root(), window.location.origin);
        url.searchParams.set('section_id', 'loopi-cart-upsells');
        const response = await request(url, { cache: 'no-store' });
        if (!response.ok) throw new Error('recommendations');
        const html = new DOMParser().parseFromString(await response.text(), 'text/html');
        if (!this.isConnected) return;
        const data = JSON.parse(html.querySelector('[data-loopi-accessory-data]').textContent);
        const candidates = Array.from(html.querySelectorAll('template[data-loopi-accessory]')).map((template) => ({
          handle: template.dataset.loopiAccessory,
          options: Array.from(template.content.querySelectorAll('option')).map((option) => ({
            id: option.value, mount: option.dataset.mount, subscription: option.dataset.subscription === 'true',
          })),
        }));
        const plan = accessoryPlan(data.items, candidates, data.month);
        if (plan.handled) {
          this.renderPlan(html, data, plan);
          return;
        }
      } catch {
        this.hidden = true;
        return;
      }
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
      this.variantOptions = Array.from(this.select.options);
      this.colorIndex = Number(this.dataset.colorIndex ?? -1);
      this.syncVariant(this.main.querySelector('input[name="id"]')?.value || this.select.value);
      this.main.addEventListener('change', (event) => {
        if (event.target.name !== 'id') return;
        this.syncVariant(event.target.value);
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
        if (data.variant) this.syncVariant(String(data.variant.id));
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
    syncVariant(id) {
      const selected = this.variantOptions.find((option) => option.value === String(id));
      if (!selected) {
        this.select.selectedIndex = -1;
        this.button.disabled = true;
        return;
      }
      const matching = this.colorIndex >= 0
        ? this.variantOptions.filter((option) => option.dataset.color === selected.dataset.color)
        : this.variantOptions;
      this.select.replaceChildren(...matching);
      this.select.value = selected.value;
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
