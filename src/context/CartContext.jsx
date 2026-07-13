import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('posa-rosa-cart')) ?? [] }
    catch { return [] }
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [giftCardQty, setGiftCardQty] = useState(0)
  const [giftCardTo, setGiftCardTo] = useState('')
  const [giftCardFrom, setGiftCardFrom] = useState('')
  const [giftCardMessage, setGiftCardMessage] = useState('')

  useEffect(() => {
    localStorage.setItem('posa-rosa-cart', JSON.stringify(items))
  }, [items])

  function addToCart(product, quantity = 1) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === product.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity }
        return next
      }
      return [...prev, { ...product, quantity }]
    })
  }

  function removeFromCart(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateQuantity(id, quantity) {
    if (quantity <= 0) { removeFromCart(id); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
  }

  function clearCart() {
    setItems([])
    setGiftCardQty(0)
    setGiftCardTo('')
    setGiftCardFrom('')
    setGiftCardMessage('')
  }

  const openDrawer  = () => setDrawerOpen(true)
  const closeDrawer = () => setDrawerOpen(false)

  const cartCount    = items.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal    = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const giftCardTotal = giftCardQty * 5

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart,
      cartTotal, cartCount,
      giftCardQty, setGiftCardQty, giftCardTotal,
      giftCardTo, setGiftCardTo,
      giftCardFrom, setGiftCardFrom,
      giftCardMessage, setGiftCardMessage,
      drawerOpen, openDrawer, closeDrawer,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
