const MSG = 'Order via WhatsApp · Deliveroo · talabat · Open 9AM–8PM · No calls please · '
const TRACK = MSG.repeat(6)

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
          animation: 'ticker 30s linear infinite',
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
          {TRACK}{TRACK}
        </span>
      </div>
      <p className="sr-only">
        Order via WhatsApp · Deliveroo · talabat · Open 9AM–8PM · No calls please
      </p>
    </div>
  )
}
