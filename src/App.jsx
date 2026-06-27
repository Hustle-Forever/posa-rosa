import { Routes, Route } from 'react-router-dom'
import { CartProvider }  from './context/CartContext'
import AnnouncementBar   from './components/sections/AnnouncementBar'
import Navbar            from './components/sections/Navbar'
import Footer            from './components/sections/Footer'
import HomePage          from './pages/HomePage'
import ShopPage          from './pages/ShopPage'
import CartPage          from './pages/CartPage'
import CheckoutPage           from './pages/CheckoutPage'
import OrderConfirmationPage   from './pages/OrderConfirmationPage'

export default function App() {
  return (
    <CartProvider>
      <AnnouncementBar />
      <Navbar />
      <Routes>
        <Route path="/"                   element={<HomePage />}             />
        <Route path="/shop"               element={<ShopPage />}             />
        <Route path="/cart"               element={<CartPage />}             />
        <Route path="/checkout"           element={<CheckoutPage />}         />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
      </Routes>
      <Footer />
    </CartProvider>
  )
}
