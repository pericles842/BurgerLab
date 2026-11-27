// Lógica compartida del creador de hamburguesas.
// La usan la página principal (/) y el modo pedido táctil (/pedido).
// Todo se conecta por atributos data-* para que los componentes sean reutilizables.

type Item = { id: string; name: string; price: number; img: string; scale?: number; overlap?: number };
type Cat = { id: string; title: string; mode: 'single' | 'multi'; required?: boolean; max?: number; layer: boolean; items: Item[] };
type Data = {
  categories: Cat[];
  buns: Record<string, { name: string; price: number; top: string; bottom: string }>;
  presets: Record<string, { name: string; pick: Record<string, string[]> }>;
  ratios: Record<string, number>;
  overlap: number;
  tuck: number;
};
export type OrderRow = { cat: Cat; item: Item };
export type BuilderDetail = { rows: OrderRow[]; total: number; qty: number; name: string; ok: boolean };

const dataEl = document.getElementById('menu-data');
const root = document.querySelector<HTMLElement>('[data-builder]');

if (dataEl && root) init(JSON.parse(dataEl.textContent!) as Data, root);

function init(data: Data, root: HTMLElement) {
  const kiosk = root.dataset.builder === 'kiosk';
  const q = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);
  const qa = <T extends Element = HTMLElement>(s: string) => [...document.querySelectorAll<T>(s)];
  const cats = Object.fromEntries(data.categories.map((c) => [c.id, c]));
  const money = (n: number) => `$${n.toFixed(2)}`;
  const nameInput = q<HTMLInputElement>('[data-name]');

  const DEFAULT = (): Record<string, string[]> => ({ pan: ['brioche'] });
  let state: Record<string, string[]> = DEFAULT();
  let qty = 1;
  let name = 'Mi burger';
  let lastAdded = '';

  // desplazamiento suave (usa Lenis si la página lo activó)
  const scrollToEl = (el: Element | null, offset = -72) => {
    if (!el) return;
    const lenis = (window as any).lenis;
    if (lenis) lenis.scrollTo(el, { offset });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' });
  };
  const scrollTarget = () => q(root.dataset.scrollTarget || '#crear');

  // web: alto de la vista previa fija (en móvil las pestañas se pegan justo debajo de ella)
  const pvSticky = q('[data-preview-sticky]');
  if (pvSticky) new ResizeObserver(() => document.documentElement.style.setProperty('--pv-h', `${pvSticky.offsetHeight}px`)).observe(pvSticky);

  // al cambiar de paso: dejar el inicio del panel justo bajo la barra de pestañas fija,
  // sin mover la página si ya está a la vista (así la vista previa nunca se esconde)
  function revealPanels() {
    const panels = q('[data-panels]');
    const bar = q('[data-tabs-sticky]');
    if (!panels || !bar) return scrollToEl(scrollTarget());
    const barBottom = (parseFloat(getComputedStyle(bar).top) || 0) + bar.offsetHeight;
    const y = panels.getBoundingClientRect().top;
    if (y < barBottom - 1 || y > window.innerHeight * 0.6) scrollToEl(panels, -barBottom);
  }

  // --- estado <-> URL (solo en la web, no en el quiosco) ---
  function fromHash() {
    const h = new URLSearchParams(location.hash.slice(1));
    if (!h.has('pan')) return;
    state = {};
    for (const [k, v] of h) {
      if (k === 'n') name = v;
      else if (k === 'q') qty = Math.max(1, Number(v) || 1);
      else if (cats[k]) state[k] = v.split(',').filter((id) => cats[k].items.some((i) => i.id === id));
    }
    if (!state.pan?.length) state.pan = ['brioche'];
  }
  function shareUrl() {
    const h = new URLSearchParams();
    h.set('n', name);
    if (qty > 1) h.set('q', String(qty));
    for (const [k, v] of Object.entries(state)) if (v.length) h.set(k, v.join(','));
    return location.origin + location.pathname + '#' + h.toString();
  }

  function toggle(catId: string, itemId: string) {
    const c = cats[catId];
    const cur = state[catId] ?? [];
    if (c.mode === 'single') {
      state[catId] = cur[0] === itemId && !c.required ? [] : [itemId];
    } else if (cur.includes(itemId)) {
      state[catId] = cur.filter((i) => i !== itemId);
    } else {
      if (c.max && cur.length >= c.max) { flash(`Máximo ${c.max} en ${c.title}`); return; }
      state[catId] = [...cur, itemId];
    }
    lastAdded = (state[catId] ?? []).includes(itemId) ? `${catId}:${itemId}` : '';
    render();
  }

  function selected(): OrderRow[] {
    const rows: OrderRow[] = [];
    for (const c of data.categories) for (const id of state[c.id] ?? []) {
      const item = c.items.find((i) => i.id === id);
      if (item) rows.push({ cat: c, item });
    }
    return rows;
  }

  function layerImg(src: string, scale: number, marginPct: number, z: number, animate: boolean) {
    const img = document.createElement('img');
    img.src = src; img.alt = '';
    img.style.width = `${scale * 100}%`;
    img.style.marginTop = `-${marginPct}%`;
    img.style.zIndex = String(z);
    img.style.position = 'relative';
    img.className = 'drop-shadow-[0_6px_8px_rgba(0,0,0,.35)] select-none pointer-events-none' + (animate ? ' layer-in' : '');
    return img;
  }

  // 2) ajustar al espacio: si la hamburguesa no cabe en su panel, se reduce su ancho
  //    (todas las capas usan %, así que todo escala en proporción)
  let heightRatio = 1;
  function fitStack() {
    const stack = q('[data-stack]');
    const box = stack?.parentElement;
    if (!stack || !box) return;
    const cs = getComputedStyle(box);
    const availH = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const availW = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const maxW = parseFloat(stack.dataset.maxWidth || '300');
    if (availH <= 0 || availW <= 0) return;
    const w = Math.max(90, Math.min(maxW, availW, availH / heightRatio));
    stack.style.width = `${Math.floor(w)}px`;
  }
  const stackBox = q('[data-stack]')?.parentElement;
  if (stackBox) new ResizeObserver(() => fitStack()).observe(stackBox);

  function renderStack() {
    const stack = q('[data-stack]');
    if (!stack) return;
    stack.innerHTML = '';
    const bun = data.buns[state.pan?.[0] ?? 'brioche'];
    const mid = selected().filter((r) => r.cat.layer).reverse(); // arriba → abajo
    // 1) compactar: con más capas, cada una se encaja más (como una burger real que se aplasta)
    const n = mid.length;
    const ov = n <= 5 ? data.overlap : n <= 10 ? 0.8 : 0.86;
    const tuck = n <= 10 ? data.tuck : 0.7;
    const list = [
      { src: bun.top, scale: 1, overlap: 0, key: 'pan:' + state.pan?.[0] },
      ...mid.map((r) => ({ src: r.item.img, scale: r.item.scale ?? 1, overlap: Math.max(r.item.overlap ?? 0, ov), key: `${r.cat.id}:${r.item.id}` })),
      { src: bun.bottom, scale: 0.94, overlap: ov, key: 'bottom' },
    ];
    // alto de la hamburguesa en proporción a su ancho (se calcula sin esperar a que carguen las imágenes)
    heightRatio = 0;
    list.forEach((l, i) => {
      const r = data.ratios[l.src] ?? 0.45;
      const m = i === 0 ? 0 : i === 1 ? (data.ratios[list[0].src] ?? 0.5) * tuck * 100 : r * l.scale * l.overlap * 100;
      heightRatio += r * l.scale - m / 100;
      stack.append(layerImg(l.src, l.scale, m, list.length - i, l.key === lastAdded));
    });
    fitStack();

    const extras = q('[data-extras]');
    if (!extras) return;
    extras.innerHTML = '';
    for (const cid of ['acompanante', 'bebida']) {
      const it = cats[cid].items.find((i) => i.id === state[cid]?.[0]);
      if (!it) continue;
      const img = document.createElement('img');
      img.src = it.img; img.alt = it.name;
      img.className = (kiosk ? 'h-20' : 'h-10 md:h-16') + ' object-contain drop-shadow-lg' + (lastAdded === `${cid}:${it.id}` ? ' layer-in' : '');
      extras.append(img);
    }
    if (!extras.children.length) {
      const p = document.createElement('p');
      p.className = 'self-center text-[11px] md:text-xs text-white/50 leading-snug ' + (kiosk ? 'text-center' : 'text-left md:text-center');
      if (kiosk) p.textContent = 'Agrega papas y bebida para hacerlo combo.';
      else p.innerHTML = '<span class="md:hidden">Sin papas ni bebida</span><span class="hidden md:inline">Agrega papas y bebida para hacerlo combo.</span>';
      extras.append(p);
    }
  }

  function render() {
    for (const b of qa<HTMLButtonElement>('[data-item]')) {
      b.setAttribute('aria-pressed', String((state[b.dataset.cat!] ?? []).includes(b.dataset.item!)));
    }
    for (const c of data.categories) {
      const n = (state[c.id] ?? []).length;
      qa(`[data-count="${c.id}"]`).forEach((el) => {
        el.textContent = String(n);
        el.classList.toggle('hidden', n === 0 || c.id === 'pan');
      });
    }
    renderStack();

    const rows = selected();
    const total = rows.reduce((s, r) => s + r.item.price, 0) * qty;
    const ok = rows.some((r) => r.cat.id === 'proteina');
    qa('[data-total], [data-total-badge]').forEach((e) => (e.textContent = money(total)));
    qa('[data-qty-value]').forEach((e) => (e.textContent = String(qty)));
    qa('[data-summary-name]').forEach((e) => (e.textContent = name));

    const ul = q('[data-summary]');
    if (ul) {
      ul.innerHTML = '';
      for (const r of rows) {
        const li = document.createElement('li');
        li.className = 'flex items-center gap-4 py-3';
        li.innerHTML = `<span class="grid place-items-center h-12 w-16 rounded-xl bg-brand-50"><img src="${r.item.img}" class="max-h-10 max-w-14 object-contain" alt=""></span><div class="flex-1"><p class="font-semibold text-sm"></p><p class="text-xs text-navy/50"></p></div><span class="text-sm font-bold"></span>`;
        li.querySelector('p')!.textContent = r.item.name;
        li.querySelectorAll('p')[1].textContent = r.cat.title;
        li.querySelector('span:last-child')!.textContent = r.item.price ? money(r.item.price) : 'Gratis';
        ul.append(li);
      }
      if (!ok) {
        const li = document.createElement('li');
        li.className = 'py-3 text-sm text-brand font-semibold';
        li.textContent = '→ Agrega al menos una proteína para completar tu burger.';
        ul.append(li);
      }
    }

    qa('[data-requires-protein]').forEach((el) => {
      el.setAttribute('aria-disabled', String(!ok));
      if (el instanceof HTMLButtonElement) el.disabled = !ok;
    });
    const order = q<HTMLAnchorElement>('[data-order]');
    if (order) {
      const text = `¡Hola! Quiero pedir ${qty} × "${name}":\n` +
        rows.map((r) => `• ${r.cat.title}: ${r.item.name}`).join('\n') + `\nTotal: ${money(total)}`;
      order.href = 'https://wa.me/?text=' + encodeURIComponent(text);
    }

    root.dispatchEvent(new CustomEvent<BuilderDetail>('builder:change', { bubbles: true, detail: { rows, total, qty, name, ok } }));
  }

  let msgT: number;
  function flash(m: string) {
    const el = q('[data-msg]');
    if (!el) return;
    el.textContent = m;
    clearTimeout(msgT);
    msgT = window.setTimeout(() => (el.textContent = ''), 2500);
  }

  function showTab(id: string) {
    qa('[data-tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
    qa('[data-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== id));
    // centrar la pestaña dentro de su barra sin mover la página
    const tab = q(`[data-tab="${id}"]`);
    const bar = tab?.parentElement;
    if (tab && bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: tab.offsetLeft - bar.clientWidth / 2 + tab.clientWidth / 2, behavior: 'smooth' });
    const panels = q('[data-panels]');
    if (panels && panels.scrollHeight > panels.clientHeight) panels.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // flechas de la barra de categorías: aparecen solo si hay más pestañas hacia ese lado
  const tabsScroll = q('[data-tabs-scroll]');
  function updateArrows() {
    if (!tabsScroll) return;
    const max = tabsScroll.scrollWidth - tabsScroll.clientWidth;
    qa('[data-tabs-arrow]').forEach((b) => {
      const dir = Number(b.dataset.tabsArrow);
      const show = max > 4 && (dir < 0 ? tabsScroll.scrollLeft > 4 : tabsScroll.scrollLeft < max - 4);
      b.classList.toggle('hidden', !show);
      b.classList.toggle('flex', show);
    });
  }
  if (tabsScroll) {
    tabsScroll.addEventListener('scroll', updateArrows, { passive: true });
    new ResizeObserver(updateArrows).observe(tabsScroll);
    qa('[data-tabs-arrow]').forEach((b) => b.addEventListener('click', () => {
      tabsScroll.scrollBy({ left: Number(b.dataset.tabsArrow) * tabsScroll.clientWidth * 0.7, behavior: 'smooth' });
    }));
    updateArrows();
  }

  function reset() {
    state = DEFAULT(); qty = 1; lastAdded = ''; name = 'Mi burger';
    if (nameInput) nameInput.value = name;
    showTab(data.categories[0].id);
    render();
  }

  function loadPreset(id: string) {
    const pr = data.presets[id];
    if (!pr) return;
    state = structuredClone(pr.pick); name = pr.name; lastAdded = '';
    if (nameInput) nameInput.value = name;
    render();
  }

  document.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-item],[data-tab],[data-goto],[data-preset],[data-qty],[data-reset],[data-share]');
    if (!t) return;
    if (t.dataset.item) toggle(t.dataset.cat!, t.dataset.item);
    else if (t.dataset.tab) { showTab(t.dataset.tab); if (!kiosk) revealPanels(); }
    else if (t.dataset.goto) { showTab(t.dataset.goto); if (!kiosk) revealPanels(); }
    else if (t.dataset.preset) { loadPreset(t.dataset.preset); if (!kiosk) scrollToEl(scrollTarget()); }
    else if (t.dataset.qty) { qty = Math.max(1, Math.min(20, qty + Number(t.dataset.qty))); render(); }
    else if (t.hasAttribute('data-reset')) reset();
    else if (t.hasAttribute('data-share')) {
      const url = shareUrl();
      navigator.clipboard?.writeText(url).then(() => flash('¡Enlace copiado! Compártelo con quien quieras.'), () => flash(url));
    }
  });
  nameInput?.addEventListener('input', () => {
    name = nameInput.value.trim() || 'Mi burger';
    render();
  });

  // API mínima para la página del quiosco
  (window as any).builder = { reset, loadPreset, getOrder: () => ({ rows: selected(), qty, name }) };

  if (!kiosk) fromHash();
  if (nameInput) nameInput.value = name;
  render();
}
