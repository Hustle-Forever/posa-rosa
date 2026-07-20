# Posa Rosa — Claude Code Guide

## Project
Luxury handcrafted butterfly chocolates brand based in Abu Dhabi.
React 19 + Vite SPA connected to a Shopify Storefront for products and checkout.

## Contact
- WhatsApp: +971503509459
- Instagram: posarosa.ae

## Deployment
- GitHub: Hustle-Forever/posa-rosa
- Netlify: posa-rosa.netlify.app
- Shopify: posa-rosa.myshopify.com (Storefront API)

## Tech Stack
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM v7
- **Animation**: Framer Motion, GSAP
- **Styling**: CSS variables + inline styles (no Tailwind utility classes in components)
- **Shopify**: `src/lib/shopify.js` — Storefront API 2024-01 via GraphQL
- **Cart**: `src/context/CartContext.jsx` — global state, persisted to localStorage

## Environment Variables
```
VITE_SHOPIFY_STORE_DOMAIN=posa-rosa.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=<token>
```
**Never commit `.env` to GitHub.**

## Brand Tokens
```css
--color-dark: #3D1A1A   /* deep burgundy-brown */
--color-gold: <gold>    /* accent */
--color-bg: <cream>     /* page background */
--font-sans: <sans>     /* labels, buttons, caps */
/* Headings: Cormorant Garamond, Georgia, serif */
```

## Key Conventions
- **Mobile first** — product grids are 2 columns on mobile, 3 on desktop
- All user-facing text in **English only**
- Prices displayed as `AED {amount}`
- `normalizeProduct(node)` in `shopify.js` maps Shopify's shape → ProductCard shape
- `ProductCard` expects: `{ id, name, collection, image, price, handle, description, unit? }`

## Rules
- One task at a time — no scope creep
- Mobile first — 2-column grid on mobile
- All text in English only
- Never push `.env` to GitHub  dg
