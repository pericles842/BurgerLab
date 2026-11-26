// Recorta cada pieza de la cuadrícula de ingredientes en su propio PNG transparente.
// Uso: node scripts/slice.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = '_original/Cuadrícula de ingredientes para hamburguesas.png';
const OUT = 'public/piezas';
const NO_WHITE = new Set(['res-parrilla', 'smash', 'pollo-parrilla', 'pollo-crispy', 'veggie', 'pulled-pork', 'cheddar', 'americano', 'tocino', 'lechuga', 'mix-verde', 'cebolla-caramelizada', 'champinones', 'aros-cebolla', 'pina', 'pepinillos', 'aguacate', 'jalapenos', 'ketchup', 'mostaza', 'bbq', 'miel-mostaza']);
const RING_HOLE =new Set(['cebolla-morada', 'pina', 'aros-cebolla']);
const RING_SEEDS = [[0.5, 0.5], [0.4, 0.45], [0.6, 0.45], [0.5, 0.35], [0.5, 0.65], [0.35, 0.6], [0.65, 0.6], [0.3, 0.4], [0.7, 0.4]];
// Piezas sin zonas blancas: su sombra gris del fondo se convierte en sombra transparente real
const SOFT_SHADOW = new Set(['brioche-top','brioche-bottom','negro-top','negro-bottom','integral-top','integral-bottom','res-parrilla','smash','pollo-parrilla','pollo-crispy','veggie','pulled-pork','cheddar','americano','suizo','tocino','tomate','lechuga','mix-verde','cebolla-caramelizada','pina','champinones','aros-cebolla']);

// Nombres por fila (de izquierda a derecha) y carpeta de destino
const ROWS = [
  { folder: 'panes', names: ['brioche-top', 'brioche-bottom', 'negro-top', 'negro-bottom', 'integral-top', 'integral-bottom'] },
  { folder: 'proteinas', names: ['res-parrilla', 'smash', 'pollo-parrilla', 'pollo-crispy', 'veggie', 'pulled-pork'] },
  { folder: 'quesos-extras', names: ['cheddar', 'americano', 'mozzarella', 'suizo', 'tocino', 'huevo'] },
  { folder: 'vegetales', names: ['lechuga', 'mix-verde', 'tomate', 'cebolla-blanca', 'cebolla-morada', 'cebolla-caramelizada', 'pepinillos', 'aguacate', 'jalapenos'] },
  { folder: 'toppings-salsas', names: ['pina', 'champinones', 'aros-cebolla', 'ketchup', 'mostaza', 'mayonesa', 'bbq', 'miel-mostaza', 'salsa-rosada'] },
  { folder: 'bebidas', names: ['cola', 'naranja', 'limonada', 'malteada-chocolate', 'malteada-fresa', 'agua'] },
  { folder: 'acompanantes', names: ['papas', 'papas-rizadas', 'camote', 'aros', 'nuggets', 'papas-queso-tocino'] },
];

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const px = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
const isInk = (x, y) => { const [r, g, b] = px(x, y); return Math.min(r, g, b) < 225 || Math.max(r, g, b) - Math.min(r, g, b) > 28; };

function segments(counts, minCount, maxGap) {
  const segs = []; let start = -1, lastOn = -1;
  counts.forEach((c, i) => {
    if (c >= minCount) { if (start < 0) start = i; lastOn = i; }
    else if (start >= 0 && i - lastOn > maxGap) { segs.push([start, lastOn]); start = -1; }
  });
  if (start >= 0) segs.push([start, lastOn]);
  return segs;
}

// 1) bandas horizontales
const rowCounts = Array.from({ length: H }, (_, y) => { let c = 0; for (let x = 0; x < W; x++) if (isInk(x, y)) c++; return c; });
const bands = segments(rowCounts, 4, 4).filter(([a, b]) => b - a > 30);
if (bands.length !== ROWS.length) { console.error('Bandas encontradas:', bands); process.exit(1); }

fs.rmSync(OUT, { recursive: true, force: true });
const manifest = {};

for (let r = 0; r < bands.length; r++) {
  const [y0, y1] = bands[r];
  const row = ROWS[r];
  const colCounts = Array.from({ length: W }, (_, x) => { let c = 0; for (let y = y0; y <= y1; y++) if (isInk(x, y)) c++; return c; });
  let cols = segments(colCounts, 2, 8).filter(([a, b]) => b - a > 20);
  if (cols.length !== row.names.length) { console.error(`Fila ${r}: ${cols.length} piezas, esperaba ${row.names.length}`, cols); process.exit(1); }

  fs.mkdirSync(path.join(OUT, row.folder), { recursive: true });
  manifest[row.folder] = [];
  for (let c = 0; c < cols.length; c++) {
    const [x0, x1] = cols[c];
    // ajustar caja vertical a la pieza concreta
    let ty = y1, by = y0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (isInk(x, y)) { if (y < ty) ty = y; if (y > by) by = y; }
    const pad = 6;
    const L = Math.max(0, x0 - pad), T = Math.max(0, ty - pad), R = Math.min(W - 1, x1 + pad), B = Math.min(H - 1, by + pad);
    const w = R - L + 1, h = B - T + 1;

    // quitar fondo blanco por inundación desde el borde (respeta blancos internos: queso, mayo, cebolla)
    const out = Buffer.alloc(w * h * 4);
    const bg = new Uint8Array(w * h);
    const soft = SOFT_SHADOW.has(row.names[c]);
    const nearWhite = (x, y) => { const [r1, g1, b1] = px(L + x, T + y); const mn = Math.min(r1, g1, b1); return mn > (soft ? 200 : 238) && Math.max(r1, g1, b1) - mn < (soft ? 18 : 14); };
    const stack = [];
    for (let x = 0; x < w; x++) { stack.push([x, 0], [x, h - 1]); }
    for (let y = 0; y < h; y++) { stack.push([0, y], [w - 1, y]); }
    // piezas con agujero en el centro (aros): el fondo encerrado también se quita
    if (RING_HOLE.has(row.names[c])) for (const [fx, fy] of RING_SEEDS) stack.push([Math.round(w * fx), Math.round(h * fy)]);
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const k = y * w + x; if (bg[k] || !nearWhite(x, y)) continue;
      bg[k] = 1; stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    const name0 = row.names[c];
    // piezas sin blancos propios: cualquier blanco suelto (restos de sombra/reflejo) también es fondo
    if (NO_WHITE.has(name0)) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const [r1, g1, b1] = px(L + x, T + y); const mn = Math.min(r1, g1, b1);
      if (mn > 226 && Math.max(r1, g1, b1) - mn < 24) bg[y * w + x] = 1;
    }
    // panes: el filo blanco aparece solo en la base (el ajonjolí de arriba se respeta)
    if (name0.startsWith('brioche') || name0.startsWith('negro') || name0.startsWith('integral'))
      for (let y = Math.floor(h * 0.7); y < h; y++) for (let x = 0; x < w; x++) {
        const [r1, g1, b1] = px(L + x, T + y); const mn = Math.min(r1, g1, b1);
        if (mn > 222 && Math.max(r1, g1, b1) - mn < 26) bg[y * w + x] = 1;
      }

    // distancia (en px) al fondo, hasta 3, para tratar el borde
    const dist = new Uint8Array(w * h).fill(9);
    let front = [];
    for (let k = 0; k < w * h; k++) if (bg[k]) { dist[k] = 0; front.push(k); }
    for (let d = 1; d <= 3; d++) {
      const next = [];
      for (const k of front) {
        const x = k % w, y = (k / w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const nk = ny * w + nx; if (dist[nk] > d) { dist[nk] = d; next.push(nk); }
        }
      }
      front = next;
    }

    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = y * w + x; let [r1, g1, b1] = px(L + x, T + y);
      const mn = Math.min(r1, g1, b1), sat = Math.max(r1, g1, b1) - mn;
      if (bg[k]) {
        if (soft && mn < 246 && mn > 120) { out.set([20, 14, 10, Math.min(100, Math.round((246 - mn) * 2.4))], k * 4); continue; }
        out.set([0, 0, 0, 0], k * 4); continue;
      }
      let a = 1;
      const d = dist[k];
      const isBun = /^(brioche|negro|integral)/.test(name0);
      const matte = NO_WHITE.has(name0) || isBun || name0 === 'tomate';
      if (!matte) { if (d === 1) a = 0.6; out.set([r1, g1, b1, Math.round(a * 255)], k * 4); continue; }
      if (d <= 3) {
        // cuánto blanco hay mezclado en el píxel del borde (0 = nada, 1 = todo)
        const whiteness = Math.max(0, Math.min(1, (mn - 150) / 100)) * Math.max(0, 1 - sat / 90);
        a = 1 - whiteness;
        if (d === 1) a *= 0.55; // come 1 px del borde (anti-halo)
        else if (d === 2) a *= 0.85;
        a = Math.max(0, Math.min(1, a));
        if (a < 0.08) { out.set([0, 0, 0, 0], k * 4); continue; }
        // descontaminar: quitar el blanco del color (P = a·C + (1-a)·255)
        const fix = (v) => Math.max(0, Math.min(255, Math.round((v - (1 - a) * 255) / a)));
        if (a < 0.98) { r1 = fix(r1); g1 = fix(g1); b1 = fix(b1); }
      }
      out.set([r1, g1, b1, Math.round(a * 255)], k * 4);
    }
    const name = row.names[c];
    const file = path.join(OUT, row.folder, `${name}.png`);
    await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toFile(file);
    manifest[row.folder].push({ id: name, src: `/piezas/${row.folder}/${name}.png`, w, h });
    console.log('✓', file, `${w}x${h}`);
  }
}
fs.writeFileSync('src/data/piezas.json', JSON.stringify(manifest, null, 2));
console.log('Manifiesto: src/data/piezas.json');
