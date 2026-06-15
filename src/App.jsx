import AnnouncementBar from './components/sections/AnnouncementBar'
import Navbar          from './components/sections/Navbar'
import Hero            from './components/sections/Hero'
import MarqueeStrip    from './components/sections/MarqueeStrip'
import Products        from './components/sections/Products'
import EditorialBanner from './components/sections/EditorialBanner'
import GiftBoxes       from './components/sections/GiftBoxes'
import HowToOrder      from './components/sections/HowToOrder'
import BrandStory      from './components/sections/BrandStory'
import Footer          from './components/sections/Footer'

export default function App() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main>
        <Hero />
        <MarqueeStrip />
        <Products />
        <EditorialBanner />
        <GiftBoxes />
        <HowToOrder />
        <BrandStory />
      </main>
      <Footer />
    </>
  )
}
