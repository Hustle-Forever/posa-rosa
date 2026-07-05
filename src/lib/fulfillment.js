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

export function getFulfillment() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || 'null')
  } catch { return null }
}

export function setFulfillment(data) {
  try { sessionStorage.setItem(KEY, JSON.stringify(data)) } catch {}
}
