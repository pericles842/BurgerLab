import { CATEGORIES } from '../data/menu';

export const money = (n: number) => (n === 0 ? 'Gratis' : `$${n.toFixed(2)}`);

export const priceOf = (pick: Record<string, string[]>) =>
  CATEGORIES.reduce((s, c) => s + (pick[c.id] ?? []).reduce((a, id) => a + (c.items.find((i) => i.id === id)?.price ?? 0), 0), 0);
