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
