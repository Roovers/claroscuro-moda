import { Link } from 'react-router-dom'
import { WhatsappLogo, InstagramLogo, EnvelopeSimple } from '@phosphor-icons/react'
import { CATEGORIAS } from '../constants/categorias'

const Footer = () => (
  <footer style={f.root}>
    <div style={f.glow} />
    <div style={f.inner}>
      <div style={f.brand}>
        <p style={f.logo}>claroscuro</p>
        <p style={f.tagline}>Prendas que definen tu estilo,<br/>estación a estación.</p>
        <div style={f.socials}>
          <a
            href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`}
            target="_blank" rel="noopener noreferrer"
            style={f.socialBtn} aria-label="WhatsApp"
          >
            <WhatsappLogo size={18} weight="fill" />
          </a>
          <a href="#" style={f.socialBtn} aria-label="Instagram">
            <InstagramLogo size={18} weight="fill" />
          </a>
          <a href="#" style={f.socialBtn} aria-label="Email">
            <EnvelopeSimple size={18} weight="fill" />
          </a>
        </div>
      </div>

      <div style={f.col}>
        <p style={f.colTitle}>Colección</p>
        {CATEGORIAS.slice(0, 5).map(c => (
          <Link key={c.value} to={`/catalogo?categoria=${c.value}`} style={f.link}>{c.label}</Link>
        ))}
      </div>

      <div style={f.col}>
        <p style={f.colTitle}>Más</p>
        {CATEGORIAS.slice(5).map(c => (
          <Link key={c.value} to={`/catalogo?categoria=${c.value}`} style={f.link}>{c.label}</Link>
        ))}
        <Link to="/carrito" style={f.link}>Carrito</Link>
      </div>

      <div style={f.col}>
        <p style={f.colTitle}>Contacto</p>
        <a
          href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`}
          target="_blank" rel="noopener noreferrer"
          style={{ ...f.link, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <WhatsappLogo size={14} weight="fill" /> Escribinos
        </a>
      </div>
    </div>

    <div style={f.bottom}>
      <p style={f.copy}>© {new Date().getFullYear()} claroscuro. Todos los derechos reservados.</p>
    </div>
  </footer>
)

const f = {
  root: {
    background: 'var(--ink)', color: 'var(--bg)',
    fontFamily: 'var(--font-body)', position: 'relative', overflow: 'hidden',
    marginTop: '6rem',
  },
  glow: {
    position: 'absolute', top: 0, left: '50%',
    transform: 'translateX(-50%)',
    width: '600px', height: '1px',
    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
  },
  inner: {
    display: 'flex', gap: '4rem', flexWrap: 'wrap',
    padding: '4rem 2.5rem 2.5rem', maxWidth: '1200px', margin: '0 auto',
  },
  brand: { flex: '1 1 220px', minWidth: '180px' },
  logo: {
    fontFamily: 'var(--font-display)', fontSize: '1.8rem',
    fontWeight: 400, letterSpacing: '0.06em',
    color: 'var(--bg)', marginBottom: '0.75rem',
  },
  tagline: {
    fontSize: '0.82rem', color: 'rgba(247,244,239,0.5)',
    fontWeight: 300, lineHeight: 1.7, marginBottom: '1.5rem',
  },
  socials: { display: 'flex', gap: '0.5rem' },
  socialBtn: {
    width: '36px', height: '36px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--accent)', transition: 'background var(--transition)',
  },
  col: { flex: '1 1 130px', display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '110px' },
  colTitle: {
    fontSize: '0.7rem', fontWeight: 500,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    color: 'var(--accent)', marginBottom: '0.25rem',
  },
  link: { fontSize: '0.85rem', color: 'rgba(247,244,239,0.55)', lineHeight: 1.9 },
  bottom: {
    borderTop: '1px solid rgba(255,255,255,0.07)',
    padding: '1.25rem 2.5rem', maxWidth: '1200px', margin: '0 auto',
  },
  copy: { fontSize: '0.72rem', color: 'rgba(247,244,239,0.3)' },
}

export default Footer