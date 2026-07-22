// Firebase Admin SDK singleton for Netlify functions (firebase-admin v14, modular API).
//
// Runs as trusted server code, so it BYPASSES Firestore security rules — the
// rules can stay fully locked (`allow read, write: if false`) while these
// functions still read/write `orders` and `pending_intents`.
//
// Credentials come from three Netlify env vars (the service-account JSON was
// split across three vars to fit Netlify's 4KB-per-var limit):
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY   (may contain literal "\n" — normalised below)

const { initializeApp, getApps, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

function buildCredential() {
  const projectId   = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  // Netlify stores the PEM with escaped newlines; turn them back into real ones.
  const privateKey  = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials missing — need FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    )
  }
  return cert({ projectId, clientEmail, privateKey })
}

// Initialise exactly once per warm Lambda container.
if (!getApps().length) {
  initializeApp({ credential: buildCredential() })
}

const db = getFirestore()
// Never throw on an undefined field value (e.g. apparel orders have no date).
db.settings({ ignoreUndefinedProperties: true })

module.exports = { db }
