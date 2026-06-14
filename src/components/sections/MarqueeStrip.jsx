const TEXT =
  'BUTTERFLY CHOCOLATES · HANDCRAFTED · ABU DHABI · KINDER · MATCHA · RED VELVET · S\'MORES · WHITE CHOCOLATE · MILK CHOCOLATE · DARK CHOCOLATE · '

export default function MarqueeStrip() {
  return (
    <div
      aria-hidden="true"
      style={{
        backgroundColor: '#3D1A1A',
        overflow: 'hidden',
        padding: '0',
        borderTop: '1px solid rgba(201,169,110,0.18)',
        borderBottom: '1px solid rgba(201,169,110,0.18)',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          whiteSpace: 'nowrap',
          animation: 'marquee-dark 22s linear infinite',
          willChange: 'transform',
          padding: '1.15rem 0',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            color: 'var(--color-gold)',
            fontWeight: 500,
          }}
        >
          {TEXT}{TEXT}{TEXT}{TEXT}
        </span>
      </div>
    </div>
  )
}
