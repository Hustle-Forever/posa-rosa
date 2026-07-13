import { useState, useEffect } from 'react'
import Marquee from '../Marquee'
import { getProducts } from '../../lib/shopify'

const BRAND_SEG = 'HANDCRAFTED TRUFFLES & CHOCOLATES · CUSTOM ORDERS FOR WEDDINGS & EVENTS · ABU DHABI · '
const FALLBACK_SEG = 'PREMIUM CHOCOLATES · HANDCRAFTED · '

export default function MarqueeStrip() {
  const [productSeg, setProductSeg] = useState(FALLBACK_SEG)

  useEffect(() => {
    getProducts()
      .then(nodes => {
        if (!nodes?.length) return
        setProductSeg(nodes.map(n => n.title.toUpperCase()).join(' · ') + ' · ')
      })
      .catch(() => {})
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        backgroundColor: 'var(--color-dark)',
        overflow: 'hidden',
        padding: '0',
        borderTop: '1px solid rgba(201,169,110,0.18)',
        borderBottom: '1px solid rgba(201,169,110,0.18)',
      }}
    >
      <Marquee
        text={BRAND_SEG + productSeg}
        speed={108}
        trackStyle={{ padding: '1.15rem 0' }}
        spanStyle={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          color: 'rgba(253,246,240,0.82)',
          fontWeight: 500,
        }}
      />
    </div>
  )
}
