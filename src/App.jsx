import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider }  from './context/CartContext'
import AnnouncementBar   from './components/sections/AnnouncementBar'
import Navbar            from './components/sections/Navbar'
import Footer            from './components/sections/Footer'
import CartDrawer        from './components/CartDrawer'
import HomePage          from './pages/HomePage'
import ShopPage          from './pages/ShopPage'
import CartPage          from './pages/CartPage'
import CheckoutPage           from './pages/CheckoutPage'
import OrderConfirmationPage   from './pages/OrderConfirmationPage'
import AboutPage         from './pages/AboutPage'
import ContactPage       from './pages/ContactPage'
import { resetBodyScroll } from './lib/scrollLock'

// On every route change: clear any leftover body scroll lock (modal/drawer)
// and start the new page at the top. Hash links keep native anchor scrolling.
function ScrollReset() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    resetBodyScroll()
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <CartProvider>
      <ScrollReset />
      <AnnouncementBar />
      <Navbar />
      <CartDrawer />
      <Routes>
        <Route path="/"                   element={<HomePage />}             />
        <Route path="/shop"               element={<ShopPage />}             />
        <Route path="/cart"               element={<CartPage />}             />
        <Route path="/checkout"           element={<CheckoutPage />}         />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/about"              element={<AboutPage />}            />
        <Route path="/contact"            element={<ContactPage />}          />
      </Routes>
      <Footer />
    </CartProvider>
  )
}
