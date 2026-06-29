import { Routes, Route } from 'react-router-dom'
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
import WholesalePage     from './pages/WholesalePage'

export default function App() {
  return (
    <CartProvider>
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
        <Route path="/wholesale"          element={<WholesalePage />}        />
      </Routes>
      <Footer />
    </CartProvider>
  )
}
