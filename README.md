# Posa Rosa

Luxury handcrafted butterfly chocolates — Abu Dhabi.
React 19 + Vite SPA connected to Shopify Storefront (products) and Shopify Admin API (orders).
Orders are also saved to Firebase Firestore for internal tracking.

## Stack

- **Frontend**: React 19 + Vite + React Router v7 + Framer Motion
- **Shopify**: Storefront API (products) · Admin API (order creation via Netlify function)
- **Firebase**: Firestore (order records) · Auth (future admin panel)
- **Hosting**: Netlify (SPA + serverless functions)

## Environment Variables

Create a `.env` file at the root (never commit it):

```
# Shopify
VITE_SHOPIFY_STORE_DOMAIN=posa-rosa.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=...

# Firebase (client + server)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Set the same vars in **Netlify → Site configuration → Environment variables**, plus:

```
SHOPIFY_ADMIN_TOKEN=shpat_...   ← Admin API token, server-only (no VITE_ prefix)
```

## Dev

```bash
npm install
npm run dev          # Vite dev server (frontend only)
netlify dev          # Vite + Netlify functions locally
```

## Key Files

| File | Purpose |
|---|---|
| `src/lib/shopify.js` | Storefront API client (products, collections) |
| `src/lib/firebase.js` | Firebase app init — exports `db` (Firestore) and `auth` |
| `src/context/CartContext.jsx` | Global cart state, persisted to localStorage |
| `netlify/functions/create-order.js` | Serverless function: creates order in Shopify Admin API, then writes to Firestore |
| `netlify.toml` | Build config + redirects (`/api/create-order` → function, `/*` → SPA) |

## Order Flow

1. Customer fills checkout form → POST `/api/create-order`
2. Netlify function creates order in **Shopify Admin API** (source of truth)
3. On success, function also writes order doc to **Firestore `orders` collection** (best-effort — Firestore failure does not affect the customer response)
4. Customer sees Order Confirmation page

## Firestore

- **Collection**: `orders`
- **Document ID**: Shopify order number (e.g. `"1001"`)
- **Fields**: `orderNumber`, `shopifyOrderId`, `status`, `customerName`, `customerPhone`, `customerEmail`, `address`, `area`, `deliveryDate`, `deliveryTimeSlot`, `notes`, `googleMapsLink`, `items[]`, `deliveryFee`, `subtotal`, `total`, `createdAt`

### Security Rules

Paste into **Firebase Console → Firestore → Rules → Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if false;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## UI Redesign — What Was Added (June 2026)

### New pages

| Route | File | Description |
|---|---|---|
| `/about` | `src/pages/AboutPage.jsx` | Brand story, Para Café locations, contact form, brand values |
| `/contact` | `src/pages/ContactPage.jsx` | WhatsApp CTA, email, Instagram, response time note |
| `/wholesale` | `src/pages/WholesalePage.jsx` | Package cards (Café/Wedding/Birthday), custom order form |

### Shop page

- Product cards are now photo-first (square image, name + price below, no description clutter).
- Clicking a card opens a **product detail modal** (large image, description, qty selector, Add to Cart).
- Modal can also be deep-linked: `/shop?product=<handle>` opens it directly (used by the HomeGallery).

### Cart drawer

- **`src/components/CartDrawer.jsx`** — slide-over panel from the right, shows items, subtotal, delivery fee, total.
- Cart icon in the navbar is **always visible** on mobile (beside the hamburger); tapping it opens the drawer.
- Tapping "Add to Cart" in the product modal closes the modal and opens the drawer immediately.
- Drawer has a prominent **Checkout →** button and a "Continue Shopping" link.
- Cart drawer state (`drawerOpen`, `openDrawer`, `closeDrawer`) lives in `CartContext.jsx`.

### Checkout page

- Google Maps field label updated to "Paste your Google Maps location link (optional)".
- Mobile: sticky order summary bar at the bottom of the screen (items count, delivery, total, Place Order button).
- Place Order button shows a spinner while the request is in-flight.

### Navbar

- Added: Shop, Wholesale, About, Contact links.
- "About" changed from a home-page anchor (`#about`) to a real page route (`/about`).
- Cart icon always visible on all viewports.

### Home page — REVERTED

The home page was **not redesigned**. An accidental change (replacing `Products` with `HomeGallery`) was reverted. The home page is byte-for-byte identical to commit `83b5515`.

### Needs Natinael's input before going live

- WhatsApp number: `+971500000000` is a placeholder in About, Contact, Wholesale pages → replace with real number.
- Instagram handle: `@posarosa` on Contact page → confirm correct handle.
- Email: `hello@posarosa.ae` on Contact page → confirm or update.
- Para Café Google Maps embed URLs in About page → paste real embed URLs for Rabdan Mall and Abu Dhabi University.
