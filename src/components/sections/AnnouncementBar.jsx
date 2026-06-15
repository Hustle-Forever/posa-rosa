const TEXT = 'Handcrafted Truffles & Chocolates · Custom Orders for Weddings, Birthdays & Corporate Events · Order Online, WhatsApp, Deliveroo & Talabat · '

export default function AnnouncementBar() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--bar-h)',
        backgroundColor: '#C8888A',
        overflow: 'hidden',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          whiteSpace: 'nowrap',
          animation: 'marquee-dark 60s linear infinite',
          willChange: 'transform',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.67rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#FDF6F0',
          }}
        >
          {TEXT}{TEXT}{TEXT}{TEXT}
        </span>
      </div>
      <p className="sr-only">
        Handcrafted Truffles & Chocolates · Custom Orders for Weddings, Birthdays & Corporate Events · Order Online, WhatsApp, Deliveroo & Talabat
      </p>
    </div>
  )
}
