import CircularGallery from '../CircularGallery/CircularGallery'

const items = [
  { image: "/assets/images/Beige, sweet & caffeinated..jpg",          text: "Beige Sweet & Caffeinated" },
  { image: "/assets/images/Butterflies filled with Kinder love..jpg", text: "Kinder Love" },
  { image: "/assets/images/Butterflies fueled by matcha..jpg",        text: "Matcha Butterfly" },
  { image: "/assets/images/Butterfly, but make it smores..jpg",        text: "S'mores Butterfly" },
  { image: "/assets/images/Cappuccino, but make it a butterfly..jpg", text: "Cappuccino" },
  { image: "/assets/images/Couldnt resist taking a bite!.jpg",        text: "Irresistible" },
  { image: "/assets/images/For the matcha-obsessed only..jpg",        text: "Matcha Obsessed" },
  { image: "/assets/images/For the OG Posarosa lovers..jpg",          text: "OG Posarosa" },
  { image: "/assets/images/For the red velvet lovers..jpg",           text: "Red Velvet" },
  { image: "/assets/images/Kinder lovers, this ones yours..jpg",       text: "Kinder Lovers" },
  { image: "/assets/images/Little red velvet wings..jpg",             text: "Red Velvet Wings" },
  { image: "/assets/images/Matcha, but make it a butterfly..jpg",     text: "Matcha Wings" },
  { image: "/assets/images/One bite, full Kinder nostalgia..jpg",     text: "Kinder Nostalgia" },
  { image: "/assets/images/One classic bite at a time..jpg",          text: "Classic Bite" },
  { image: "/assets/images/Original, simple, perfect..jpg",           text: "Original" },
  { image: "/assets/images/Red velvet, but make it a butterfly..jpg", text: "Red Velvet Butterfly" },
  { image: "/assets/images/Smores, no campfire needed..jpg",           text: "S'mores" },
  { image: "/assets/images/Soft, melty, perfect..jpg",                text: "Soft & Melty" },
  { image: "/assets/images/Sweet and simple..jpg",                    text: "Sweet & Simple" },
]

export default function Products() {
  return (
    <section
      id="chocolates"
      style={{ background: '#FDF6F0', padding: '80px 0' }}
    >
      <h2
        style={{
          textAlign: 'center',
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          color: '#3D1A1A',
          marginBottom: '60px',
          fontWeight: 300,
          letterSpacing: '0.05em',
        }}
      >
        Our Butterflies
      </h2>

      <style>{`
        .gallery-height-wrapper { height: 600px; }
        @media (max-width: 768px) { .gallery-height-wrapper { height: 400px; } }
      `}</style>
      <div className="gallery-height-wrapper" style={{ position: 'relative' }}>
        <CircularGallery
          items={items}
          bend={3}
          textColor="#3D1A1A"
          borderRadius={0.05}
          scrollSpeed={2}
          scrollEase={0.02}
          fontUrl="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap"
          font="300 24px Cormorant Garamond"
        />
      </div>
    </section>
  )
}
