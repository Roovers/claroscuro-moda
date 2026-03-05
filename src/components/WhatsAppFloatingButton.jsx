import { useState } from 'react'
import { WhatsappLogo } from '@phosphor-icons/react'

const WhatsAppFloatingButton = () => {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER
  const [hovered, setHovered] = useState(false)

  if (!number) return null

  return (
    <>
      <style>{`
        @keyframes waGlow {
          0%, 100% { box-shadow: 0 4px 20px rgba(37,211,102,0.20), 0 1px 4px rgba(0,0,0,0.10); }
          50%       { box-shadow: 0 6px 28px rgba(37,211,102,0.38), 0 1px 4px rgba(0,0,0,0.10); }
        }
        .wa-pill { animation: waGlow 3s ease-in-out infinite; }
        .wa-pill:hover { animation: none; }
      `}</style>

      <a
        href={`https://wa.me/${number}`}
        target="_blank"
        rel="noopener noreferrer"
        className="wa-pill"
        style={{
          ...s.pill,
          width: hovered ? 196 : 48,
          boxShadow: hovered
            ? '0 8px 32px rgba(37,211,102,0.30), 0 2px 8px rgba(0,0,0,0.14)'
            : undefined,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Contactar por WhatsApp"
      >
        {/* Ícono */}
        <span style={s.iconWrap}>
          <WhatsappLogo
            size={21}
            weight="fill"
            style={{
              display: 'block',
              flexShrink: 0,
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              transform: hovered ? 'rotate(-8deg) scale(1.1)' : 'none',
            }}
          />
        </span>

        {/* "Hablemos" */}
        <span style={{
          ...s.label,
          opacity: hovered ? 1 : 0,
          maxWidth: hovered ? 90 : 0,
          marginLeft: hovered ? '0.6rem' : 0,
          transition: 'opacity 0.2s ease 0.06s, max-width 0.28s cubic-bezier(0.4,0,0.2,1), margin 0.28s ease',
        }}>
          Hablemos
        </span>
      </a>
    </>
  )
}

const s = {
  pill: {
    position: 'fixed',
    right: 24,
    bottom: 24,
    zIndex: 1000,
    height: 48,
    borderRadius: 999,
    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '0 14px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'width 0.32s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s ease',
    willChange: 'width',
  },

  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 21,
    height: 21,
  },

  label: {
    fontSize: '0.9rem',
    fontWeight: 500,
    letterSpacing: '0.02em',
    color: '#fff',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    lineHeight: 1,
    flexShrink: 0,
  },

  sep: {
    display: 'inline-block',
    width: 1,
    height: 15,
    background: '#fff',
    flexShrink: 0,
  },

  sublabel: {
    fontSize: '0.65rem',
    fontWeight: 300,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: '#fff',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    lineHeight: 1,
    flexShrink: 0,
  },
}

export default WhatsAppFloatingButton