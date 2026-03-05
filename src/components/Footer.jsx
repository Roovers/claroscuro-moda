import { Link } from 'react-router-dom'
import { WhatsappLogo, InstagramLogo, EnvelopeSimple } from '@phosphor-icons/react'
import { CATEGORIAS } from '../constants/categorias'
import logo from '../assets/logo1.png'

const Footer = () => {
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL

  const waHref = waNumber ? `https://wa.me/${waNumber}` : '#'
  const igHref = instagramUrl || '#'
  const mailHref = contactEmail ? `mailto:${contactEmail}` : '#'

  return (
    <footer style={s.root}>
      <div style={s.inner}>
        {/* BRAND */}
        <div style={s.brand}>
          <div style={s.brandTop}>
            <span style={s.brandPill}>INDUMENTARIA & ACCESORIOS</span>
          </div>

          <p style={s.brandText}>
            Estética cuidada, materiales nobles y una
            <br />
            selección pensada para durar.
          </p>

          <p style={s.brandTextSoft}>Armá tu carrito y finalizá por WhatsApp.</p>
        </div>

        {/* COLECCIÓN */}
        <div style={s.col}>
          <p style={s.colTitle}>COLECCIÓN</p>
          {CATEGORIAS.filter((c) => c.value !== 'sale')
            .slice(0, 5)
            .map((c) => (
              <Link key={c.value} to={`/catalogo?categoria=${c.value}`} style={s.link}>
                {c.label}
              </Link>
            ))}
        </div>

        {/* NAVEGACIÓN */}
        <div style={s.col}>
          <p style={s.colTitle}>NAVEGACIÓN</p>
          <Link to="/catalogo" style={s.link}>
            Catálogo
          </Link>
          <Link to="/carrito" style={s.link}>
            Carrito
          </Link>
          <Link to="/contacto" style={s.link}>
            Contacto
          </Link>
        </div>

        {/* ATENCIÓN */}
        <div style={s.col}>
          <p style={s.colTitle}>ATENCIÓN</p>

          <div style={s.iconRow}>
            <a
              href={waHref}
              target={waNumber ? '_blank' : undefined}
              rel={waNumber ? 'noopener noreferrer' : undefined}
              style={s.iconBtn}
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <WhatsappLogo size={18} weight="regular" />
            </a>

            <a
              href={igHref}
              target={instagramUrl ? '_blank' : undefined}
              rel={instagramUrl ? 'noopener noreferrer' : undefined}
              style={s.iconBtn}
              aria-label="Instagram"
              title="Instagram"
            >
              <InstagramLogo size={18} weight="regular" />
            </a>

            <a href={mailHref} style={s.iconBtn} aria-label="Email" title="Email">
              <EnvelopeSimple size={18} weight="regular" />
            </a>
          </div>

          <p style={s.note}>
            Sin pagos online. Confirmación de stock y coordinación del pedido por WhatsApp.
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div style={s.bottom}>
        <div style={s.bottomLine} />
        <p style={s.copy}>© {new Date().getFullYear()} claroscuro. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}

const s = {
  root: {
    marginTop: '5.5rem',
    background:
      'radial-gradient(900px 340px at 20% 10%, rgba(184,149,106,0.08), transparent 55%), linear-gradient(180deg, rgba(12,11,10,0.98), rgba(8,7,6,1))',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.78)',
  },

  inner: {
    maxWidth: 1120,
    margin: '0 auto',
    padding: '2.6rem 2.5rem 2.0rem',
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr 1fr 1.1fr',
    gap: '2.2rem',
    alignItems: 'start',
  },

  brand: { minWidth: 260 },
  brandTop: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },

  logoImg: {
    height: 100, 
    width: 'auto',
    opacity: 0.92,
    filter: 'grayscale(0%)',
  },

  brandPill: {
    fontSize: '0.68rem',
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    fontWeight: 300,
    padding: '0.30rem 0.62rem',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(184,149,106,0.95)',
  },

  brandText: {
    margin: '1.0rem 0 0',
    fontWeight: 300,
    lineHeight: 1.9,
    fontSize: '0.98rem',
    color: 'rgba(255,255,255,0.58)',
  },
  brandTextSoft: {
    margin: '0.55rem 0 0',
    fontWeight: 300,
    lineHeight: 1.9,
    fontSize: '0.98rem',
    color: 'rgba(255,255,255,0.48)',
  },

  col: { display: 'flex', flexDirection: 'column', gap: 10, minWidth: 140 },

  colTitle: {
    margin: 0,
    fontSize: '0.70rem',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    fontWeight: 300,
    color: 'rgba(184,149,106,0.92)',
  },

  link: {
    textDecoration: 'none',
    color: 'rgba(255,255,255,0.54)',
    fontWeight: 300,
    fontSize: '0.95rem',
    lineHeight: 1.6,
    width: 'fit-content',
  },

  iconRow: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 2 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.04)',
    display: 'grid',
    placeItems: 'center',
    color: 'rgba(255,255,255,0.70)',
    textDecoration: 'none',
  },

  note: {
    margin: '0.95rem 0 0',
    fontSize: '0.92rem',
    lineHeight: 1.75,
    color: 'rgba(255,255,255,0.42)',
    fontWeight: 300,
    maxWidth: 320,
  },

  mini: {
    margin: '0.85rem 0 0',
    fontSize: '0.82rem',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.34)',
  },

  bottom: {
    maxWidth: 1120,
    margin: '0 auto',
    padding: '0 2.5rem 1.5rem',
  },

  bottomLine: {
    height: 1,
    width: '100%',
    margin: '0.3rem 0 1.0rem',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
  },

  copy: {
    margin: 0,
    textAlign: 'center',
    fontSize: '0.86rem',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: '0.02em',
  },
}

export default Footer