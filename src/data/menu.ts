// Catálogo del constructor. Las imágenes vienen de /public/piezas (generadas con scripts/slice.mjs).
export type Item = { id: string; name: string; price: number; img: string; scale?: number; overlap?: number };
export type Category = {
  id: string;
  title: string;
  icon: string;
  mode: 'single' | 'multi';
  required?: boolean;
  max?: number;
  layer: boolean; // ¿se apila en la hamburguesa?
  items: Item[];
};

const p = (folder: string, id: string) => `/piezas/${folder}/${id}.png`;

export const BUNS = {
  brioche: { name: 'Brioche con ajonjolí', price: 1.5, top: p('panes', 'brioche-top'), bottom: p('panes', 'brioche-bottom') },
  negro: { name: 'Pan negro', price: 2, top: p('panes', 'negro-top'), bottom: p('panes', 'negro-bottom') },
  integral: { name: 'Integral con avena', price: 1.75, top: p('panes', 'integral-top'), bottom: p('panes', 'integral-bottom') },
} as const;

export const CATEGORIES: Category[] = [
  {
    id: 'pan', title: 'Pan', icon: 'tabler:bread', mode: 'single', required: true, layer: false,
    items: Object.entries(BUNS).map(([id, b]) => ({ id, name: b.name, price: b.price, img: b.top })),
  },
  {
    id: 'proteina', title: 'Proteína', icon: 'tabler:meat', mode: 'multi', max: 3, layer: true,
    items: [
      { id: 'res-parrilla', name: 'Res a la parrilla', price: 4.5, img: p('proteinas', 'res-parrilla') },
      { id: 'smash', name: 'Smash burger', price: 4, img: p('proteinas', 'smash') },
      { id: 'pollo-parrilla', name: 'Pollo a la parrilla', price: 3.75, img: p('proteinas', 'pollo-parrilla') },
      { id: 'pollo-crispy', name: 'Pollo crispy', price: 4, img: p('proteinas', 'pollo-crispy') },
      { id: 'veggie', name: 'Veggie', price: 3.5, img: p('proteinas', 'veggie') },
      { id: 'pulled-pork', name: 'Pulled pork', price: 4.75, img: p('proteinas', 'pulled-pork') },
    ],
  },
  {
    id: 'queso', title: 'Quesos y extras', icon: 'tabler:cheese', mode: 'multi', layer: true,
    items: [
      { id: 'cheddar', name: 'Cheddar fundido', price: 1, img: p('quesos-extras', 'cheddar') },
      { id: 'americano', name: 'Queso americano', price: 0.9, img: p('quesos-extras', 'americano') },
      { id: 'mozzarella', name: 'Mozzarella', price: 1, img: p('quesos-extras', 'mozzarella') },
      { id: 'suizo', name: 'Queso suizo', price: 1.1, img: p('quesos-extras', 'suizo') },
      { id: 'tocino', name: 'Tocino', price: 1.5, img: p('quesos-extras', 'tocino') },
      { id: 'huevo', name: 'Huevo frito', price: 1.25, img: p('quesos-extras', 'huevo') },
    ],
  },
  {
    id: 'vegetales', title: 'Vegetales', icon: 'tabler:salad', mode: 'multi', layer: true,
    items: [
      { id: 'lechuga', name: 'Lechuga', price: 0.5, img: p('vegetales', 'lechuga'), scale: 0.95 },
      { id: 'mix-verde', name: 'Mix de hojas', price: 0.75, img: p('vegetales', 'mix-verde'), scale: 0.95 },
      { id: 'tomate', name: 'Tomate', price: 0.5, img: p('vegetales', 'tomate'), scale: 0.9 },
      { id: 'cebolla-blanca', name: 'Cebolla blanca', price: 0.4, img: p('vegetales', 'cebolla-blanca'), scale: 0.75 },
      { id: 'cebolla-morada', name: 'Cebolla morada', price: 0.4, img: p('vegetales', 'cebolla-morada'), scale: 0.75 },
      { id: 'cebolla-caramelizada', name: 'Cebolla caramelizada', price: 0.9, img: p('vegetales', 'cebolla-caramelizada'), scale: 0.8 },
      { id: 'pepinillos', name: 'Pepinillos', price: 0.5, img: p('vegetales', 'pepinillos'), scale: 0.65 },
      { id: 'aguacate', name: 'Aguacate', price: 1.25, img: p('vegetales', 'aguacate'), scale: 0.65 },
      { id: 'jalapenos', name: 'Jalapeños', price: 0.6, img: p('vegetales', 'jalapenos'), scale: 0.6 },
    ],
  },
  {
    id: 'toppings', title: 'Toppings', icon: 'tabler:mushroom', mode: 'multi', layer: true,
    items: [
      { id: 'pina', name: 'Piña a la parrilla', price: 0.9, img: p('toppings-salsas', 'pina'), scale: 0.75 },
      { id: 'champinones', name: 'Champiñones', price: 1, img: p('toppings-salsas', 'champinones'), scale: 0.85 },
      { id: 'aros-cebolla', name: 'Aros de cebolla', price: 1.1, img: p('toppings-salsas', 'aros-cebolla'), scale: 0.85 },
    ],
  },
  {
    id: 'salsas', title: 'Salsas', icon: 'tabler:droplet', mode: 'multi', layer: true,
    items: [
      { id: 'ketchup', name: 'Ketchup', price: 0, img: p('toppings-salsas', 'ketchup'), scale: 0.7, overlap: 0.88 },
      { id: 'mostaza', name: 'Mostaza', price: 0, img: p('toppings-salsas', 'mostaza'), scale: 0.65, overlap: 0.88 },
      { id: 'mayonesa', name: 'Mayonesa', price: 0, img: p('toppings-salsas', 'mayonesa'), scale: 0.65, overlap: 0.88 },
      { id: 'bbq', name: 'BBQ', price: 0.3, img: p('toppings-salsas', 'bbq'), scale: 0.65, overlap: 0.88 },
      { id: 'miel-mostaza', name: 'Miel mostaza', price: 0.3, img: p('toppings-salsas', 'miel-mostaza'), scale: 0.6, overlap: 0.88 },
      { id: 'salsa-rosada', name: 'Salsa rosada', price: 0.3, img: p('toppings-salsas', 'salsa-rosada'), scale: 0.6, overlap: 0.88 },
    ],
  },
  {
    id: 'acompanante', title: 'Acompañante', icon: 'tabler:paper-bag', mode: 'single', layer: false,
    items: [
      { id: 'papas', name: 'Papas fritas', price: 2.5, img: p('acompanantes', 'papas') },
      { id: 'papas-rizadas', name: 'Papas rizadas', price: 2.75, img: p('acompanantes', 'papas-rizadas') },
      { id: 'camote', name: 'Camote frito', price: 3, img: p('acompanantes', 'camote') },
      { id: 'aros', name: 'Aros de cebolla', price: 3, img: p('acompanantes', 'aros') },
      { id: 'nuggets', name: 'Nuggets', price: 3.5, img: p('acompanantes', 'nuggets') },
      { id: 'papas-queso-tocino', name: 'Papas queso y tocino', price: 4, img: p('acompanantes', 'papas-queso-tocino') },
    ],
  },
  {
    id: 'bebida', title: 'Bebida', icon: 'tabler:cup', mode: 'single', layer: false,
    items: [
      { id: 'cola', name: 'Cola', price: 1.5, img: p('bebidas', 'cola') },
      { id: 'naranja', name: 'Naranjada', price: 1.75, img: p('bebidas', 'naranja') },
      { id: 'limonada', name: 'Limonada', price: 2, img: p('bebidas', 'limonada') },
      { id: 'malteada-chocolate', name: 'Malteada de chocolate', price: 3.5, img: p('bebidas', 'malteada-chocolate') },
      { id: 'malteada-fresa', name: 'Malteada de fresa', price: 3.5, img: p('bebidas', 'malteada-fresa') },
      { id: 'agua', name: 'Agua', price: 1, img: p('bebidas', 'agua') },
    ],
  },
];

export const PRESETS: Record<string, { name: string; desc: string; pick: Record<string, string[]> }> = {
  clasica: { name: 'La Clásica', desc: 'Res a la parrilla, cheddar, lechuga, tomate y cebolla.', pick: { pan: ['brioche'], proteina: ['res-parrilla'], queso: ['cheddar'], vegetales: ['lechuga', 'tomate', 'cebolla-blanca'], salsas: ['ketchup', 'mostaza'], acompanante: ['papas'], bebida: ['cola'] } },
  bbq: { name: 'Smoky BBQ', desc: 'Doble carne, tocino, aros de cebolla y salsa BBQ.', pick: { pan: ['negro'], proteina: ['pulled-pork', 'smash'], queso: ['americano', 'tocino'], vegetales: ['cebolla-caramelizada'], toppings: ['aros-cebolla'], salsas: ['bbq'], acompanante: ['papas-queso-tocino'], bebida: ['malteada-chocolate'] } },
  verde: { name: 'Green Code', desc: 'Veggie, mozzarella, aguacate y mix de hojas.', pick: { pan: ['integral'], proteina: ['veggie'], queso: ['mozzarella'], vegetales: ['mix-verde', 'tomate', 'aguacate', 'cebolla-morada'], salsas: ['salsa-rosada'], acompanante: ['camote'], bebida: ['limonada'] } },
};
