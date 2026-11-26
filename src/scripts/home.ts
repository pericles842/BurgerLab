// Efectos de la página principal: scroll suave, apariciones al hacer scroll y hero dinámico.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string) => [...document.querySelectorAll<T>(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- scroll suave (sutil) ----------
if (!reduce) {
  const lenis = new Lenis({ autoRaf: true, lerp: 0.11, anchors: { offset: -72 } });
  (window as any).lenis = lenis;
}

// ---------- menú móvil ----------
const toggle = $<HTMLButtonElement>('[data-menu-toggle]');
const menu = $<HTMLElement>('[data-mobile-menu]');
const setMenu = (open: boolean) => {
  if (!toggle || !menu) return;
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  toggle.querySelector('.menu-open-icon')?.classList.toggle('hidden', open);
  toggle.querySelector('.menu-close-icon')?.classList.toggle('hidden', !open);
};
toggle?.addEventListener('click', () => setMenu(menu!.hidden));
$$('[data-menu-link]').forEach((a) => a.addEventListener('click', () => setMenu(false)));
matchMedia('(min-width: 768px)').addEventListener('change', (e) => e.matches && setMenu(false));

// ---------- barra inferior móvil mientras se crea ----------
const bar = $('[data-mobile-bar]');
const builderSection = $('[data-builder-section]');
const preview = $('[data-preview]');
if (bar && builderSection && preview) {
  let inBuilder = false, previewVisible = false;
  const update = () => bar.classList.toggle('translate-y-[150%]', !(inBuilder && !previewVisible));
  new IntersectionObserver(([e]) => { inBuilder = e.isIntersecting; update(); }, { rootMargin: '-30% 0px -30% 0px' }).observe(builderSection);
  new IntersectionObserver(([e]) => { previewVisible = e.isIntersecting; update(); }, { threshold: 0.35 }).observe(preview);
  $('[data-see-burger]')?.addEventListener('click', () => {
    const lenis = (window as any).lenis;
    if (lenis) lenis.scrollTo(preview, { offset: -80 });
    else preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ---------- apariciones al entrar en pantalla ----------
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  },
  { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
);
$$('[data-reveal]').forEach((el) => {
  if (reduce) el.classList.add('is-in');
  else io.observe(el);
});

// ---------- palabra rotativa ----------
const words = $$('[data-words] .word');
let wi = 0;
if (!reduce && words.length) setInterval(() => {
  const prev = words[wi];
  prev.classList.remove('is-active'); prev.classList.add('is-out');
  setTimeout(() => prev.classList.remove('is-out'), 650);
  wi = (wi + 1) % words.length;
  words[wi].classList.add('is-active');
}, 2600);

// ---------- carrusel de hamburguesas que se construyen ----------
const tabs = $$('[data-hero-tab]');
let hi = 0;
let heroTimer: number | undefined;
function showHero(i: number) {
  hi = i;
  tabs.forEach((t, j) => t.setAttribute('aria-selected', String(j === i)));
  const id = tabs[i].dataset.heroTab!;
  $$('[data-hero-slide]').forEach((sl) => {
    const on = sl.dataset.heroSlide === id;
    sl.classList.toggle('hidden', !on);
    const st = sl.firstElementChild as HTMLElement;
    const imgs = st.querySelectorAll('img');
    imgs.forEach((im, k) => { im.classList.add('build-layer'); im.style.setProperty('--d', (imgs.length - 1 - k) * 0.18 + 's'); });
    st.classList.remove('build');
    if (on && !reduce) { void st.offsetWidth; st.classList.add('build'); }
  });
  const n = $('[data-hero-name]'), p = $('[data-hero-price]');
  if (n) n.textContent = tabs[i].dataset.hname!;
  if (p) p.textContent = tabs[i].dataset.hprice!;
  $$('.hero-progress').forEach((b) => b.classList.remove('run'));
  const bar = tabs[i].querySelector<HTMLElement>('.hero-progress')!;
  void bar.offsetWidth; bar.classList.add('run');
  clearTimeout(heroTimer);
  if (!reduce) heroTimer = window.setTimeout(() => showHero((hi + 1) % tabs.length), 6000);
}
if (tabs.length) {
  tabs.forEach((t, i) => t.addEventListener('click', () => showHero(i)));
  showHero(0);
}

// ---------- parallax de ingredientes ----------
const scene = $('[data-hero]');
const depthEls = $$('[data-depth]');
if (scene && !reduce && matchMedia('(pointer: fine)').matches) {
  scene.addEventListener('pointermove', (e) => {
    const r = scene.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    depthEls.forEach((l) => { const d = Number(l.dataset.depth); l.style.translate = `${x * d}px ${y * d}px`; });
  });
  scene.addEventListener('pointerleave', () => depthEls.forEach((l) => (l.style.translate = '0 0')));
}

// ---------- contadores ----------
if (!reduce) $$('[data-count-to]').forEach((el) => {
  const to = Number(el.dataset.countTo), dec = to % 1 ? 1 : 0, t0 = performance.now();
  const tick = (t: number) => {
    const p = Math.min(1, (t - t0) / 1400), v = to * (1 - Math.pow(1 - p, 3));
    el.textContent = v.toFixed(dec);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
