import test from 'node:test'
import assert from 'node:assert/strict'
import mod from '../../netlify/functions/create-order.js'

const validateOrder = mod.validateOrder

const baseCustomer = { name: 'Fatima', email: 'a@b.com', phone: '+971500000000' }
const truffle = { variantId: 'gid://shopify/ProductVariant/1', quantity: 1, price: 50, name: 'Truffle' }

test('non-Abu-Dhabi truffle order does NOT require timeSlot', () => {
  const err = validateOrder({
    customer: baseCustomer,
    delivery: { fulfillmentType: 'delivery', address: 'Villa 1', area: 'Al Jimi', emirate: 'Al Ain', date: '2026-07-23' },
    items: [truffle],
  })
  assert.equal(err, null)
})

test('Abu Dhabi truffle order STILL requires timeSlot', () => {
  const err = validateOrder({
    customer: baseCustomer,
    delivery: { fulfillmentType: 'delivery', address: 'Villa 1', area: 'Al Mushrif', emirate: 'Abu Dhabi', date: '2026-07-22' },
    items: [truffle],
  })
  assert.equal(err, 'A time slot is required')
})

test('any non-apparel order still requires a date', () => {
  const err = validateOrder({
    customer: baseCustomer,
    delivery: { fulfillmentType: 'delivery', address: 'Villa 1', area: 'Al Jimi', emirate: 'Al Ain' },
    items: [truffle],
  })
  assert.equal(err, 'A valid date is required')
})
