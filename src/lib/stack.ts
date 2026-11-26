import { CATEGORIES, BUNS } from '../data/menu';
import piezas from '../data/piezas.json';

export const RATIOS: Record<string, number> = {};
for (const list of Object.values(piezas)) for (const pz of list) RATIOS[pz.src] = pz.h / pz.w;

/** Cuánto se encima cada capa sobre la de abajo (0–1) y cuánto baja el pan superior. */
export const STACK_OVERLAP = 0.72;
export const TOP_TUCK = 0.62;

export type Layer = { src: string; scale: number; overlap: number };

/** Capas de arriba hacia abajo (pan superior → pan inferior) para una selección. */
export function layersFor(pick: Record<string, string[]>, overlap = STACK_OVERLAP): Layer[] {
  const bun = BUNS[(pick.pan?.[0] ?? 'brioche') as keyof typeof BUNS];
  const mid: Layer[] = [];
  for (const c of CATEGORIES) {
    if (!c.layer) continue;
    for (const id of pick[c.id] ?? []) {
      const it = c.items.find((i) => i.id === id);
      if (it) mid.push({ src: it.img, scale: it.scale ?? 1, overlap: it.overlap ? Math.max(it.overlap, overlap) : overlap });
    }
  }
  return [{ src: bun.top, scale: 1, overlap: 0 }, ...mid.reverse(), { src: bun.bottom, scale: 0.94, overlap }];
}

/** margin-top negativo (en % del ancho del contenedor) de cada capa. */
export function marginFor(layers: Layer[], i: number, tuck = TOP_TUCK): number {
  if (i === 0) return 0;
  if (i === 1) return (RATIOS[layers[0].src] ?? 0.5) * tuck * 100;
  const l = layers[i];
  return (RATIOS[l.src] ?? 0.45) * l.scale * l.overlap * 100;
}
