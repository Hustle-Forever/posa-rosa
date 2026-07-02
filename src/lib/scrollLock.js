// Reference-counted body scroll lock. The product modal and the cart drawer
// can overlap (Add to Cart closes the modal and opens the drawer while the
// modal's exit animation is still running), so each caller acquires/releases
// a lock instead of writing document.body.style.overflow directly —
// otherwise one overlay's cleanup can wipe out or re-freeze the other's lock.

let locks = 0

export function lockBodyScroll() {
  locks++
  document.body.style.overflow = 'hidden'
}

export function unlockBodyScroll() {
  locks = Math.max(0, locks - 1)
  if (locks === 0) document.body.style.overflow = ''
}

// Safety valve on route change: no overlay survives navigation.
export function resetBodyScroll() {
  locks = 0
  document.body.style.overflow = ''
}
