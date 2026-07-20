import Hero               from '../components/sections/Hero'
import MarqueeStrip       from '../components/sections/MarqueeStrip'
import Products           from '../components/sections/Products'
import EditorialBanner    from '../components/sections/EditorialBanner'
import GiftBoxes          from '../components/sections/GiftBoxes'
import GiftCardShowcase   from '../components/sections/GiftCardShowcase'
import HowToOrder         from '../components/sections/HowToOrder'
import ApparelHighlight   from '../components/sections/ApparelHighlight'
import BrandStory         from '../components/sections/BrandStory'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <MarqueeStrip />
      <Products />
      <EditorialBanner />
      <GiftBoxes />
      <GiftCardShowcase />
      <HowToOrder />
      <ApparelHighlight />
      <BrandStory />
    </main>
  )
}
