const KEY = 'posa-rosa-fulfillment'

export const EMIRATE_AREAS = {
  'Abu Dhabi':      ['Al Khalidiyah', 'Al Mushrif', 'Al Nahyan', 'Khalifa City', 'Al Reem Island', 'Yas Island', 'Saadiyat Island', 'Al Karamah', 'Mohamed Bin Zayed', 'Other'],
  'Al Ain':         ['Al Muwaiji', 'Al Jimi', 'Al Towayya', 'Other'],
  'Dubai':          ['Deira', 'Bur Dubai', 'Downtown Dubai', 'Business Bay', 'Jumeirah', 'Marina', 'Al Barsha', 'Mirdif', 'Other'],
  'Sharjah':        ['Al Majaz', 'Al Nahda', 'Al Qasimia', 'Muwaileh', 'Other'],
  'Ajman':          ['Al Nuaimiya', 'Al Rashidiya', 'Al Jurf', 'Other'],
  'Ras Al Khaimah': ['Al Nakheel', 'Al Dhait', 'Al Hamra', 'Other'],
  'Fujairah':       ['Al Faseel', 'Sakamkam', 'Other'],
  'Umm Al Quwain':  ['Al Salamah', 'Al Raas', 'Other'],
}

export const EMIRATES = Object.keys(EMIRATE_AREAS)

export function getDeliveryFee(emirate) {
  if (!emirate) return 35
  return emirate === 'Abu Dhabi' ? 35 : 40
}

export function getDeliveryTiming(emirate) {
  return emirate === 'Abu Dhabi' ? 'same-day' : 'next-day'
}

export function getFulfillment() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || 'null')
  } catch { return null }
}

export function setFulfillment(data) {
  try { sessionStorage.setItem(KEY, JSON.stringify(data)) } catch {}
}

// ── Abu Dhabi same-day delivery slots (Asia/Dubai) ─────────────────────────────
// sameDayCutoff: minutes-since-midnight after which the slot closes for TODAY.
// null = never available same-day (must be ordered the day before).
export const TIME_SLOTS = [
  { label: 'Morning',   hours: '9AM – 12PM', sameDayCutoff: null },
  { label: 'Afternoon', hours: '12PM – 5PM', sameDayCutoff: 13 * 60 },      // 13:00
  { label: 'Evening',   hours: '5PM – 8PM',  sameDayCutoff: 17 * 60 + 30 }, // 17:30
]

// True when the slot cannot be delivered for the chosen date.
// deliveryDate / now.date are 'YYYY-MM-DD' (Asia/Dubai); now.minutes is minutes-since-midnight.
export function slotClosedToday(slot, deliveryDate, now) {
  if (deliveryDate !== now.date) return false   // tomorrow-or-later: always open
  if (slot.sameDayCutoff == null) return true    // never same-day (Morning)
  return now.minutes >= slot.sameDayCutoff
}

// Classify cart for delivery-rule display: 'empty' | 'apparel' | 'truffle'.
export function cartMode(items) {
  if (!items || items.length === 0) return 'empty'
  return items.every(i => i.isApparel) ? 'apparel' : 'truffle'
}
