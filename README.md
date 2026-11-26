# Burger Lab — Demo Coffee Code

Constructor dinámico de hamburguesas y combos hecho con **Astro + Tailwind CSS v4**, con la identidad de Coffee Code.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # sitio estático en dist/
```

## Estructura

```
_original/                  Imagen fuente (cuadrícula de ingredientes)
scripts/slice.mjs           Recorta la cuadrícula → public/piezas/* + src/data/piezas.json
public/piezas/<categoría>/  48 piezas PNG con fondo transparente
  panes · proteinas · quesos-extras · vegetales · toppings-salsas · bebidas · acompanantes
public/brand/               Logos Coffee Code (copias; los originales no se tocan)
src/data/menu.ts            Catálogo: nombres, precios, categorías y combos de la casa
src/pages/index.astro       Página + lógica del constructor
src/styles/global.css       Tokens de marca (azul #336CFF, navy #152241, fondo #F2F6FF)
```

Para volver a recortar: `node scripts/slice.mjs`.
Para cambiar precios, nombres o combos: edita `src/data/menu.ts`.
