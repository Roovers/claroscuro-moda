import { Link } from 'react-router-dom'
import { WhatsappLogo, InstagramLogo, EnvelopeSimple, ArrowUpRight } from '@phosphor-icons/react'
import { CATEGORIAS } from '../constants/categorias'
import logo from '../assets/logo3.png'

const Footer = () => {
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL

  const waHref = waNumber ? `https://wa.me/${waNumber}` : '#'
  const igHref = instagramUrl || '#'
  const mailHref = contactEmail ? `mailto:${contactEmail}` : '#'

  const year = new Date().getFullYear()

  return (
    <footer style={s.root}>

      {/* ── Top rule with label */}
      <div style={s.topRule}>
        <div style={s.topRuleLine} />
        <img src={logo} alt="claroscuro" style={s.brandLogo} />
        <div style={s.topRuleLine} />
      </div>

      {/* ── Main grid */}
      <div style={s.grid}>

        {/* COL 1 — Brand */}
        <div style={s.brandCol}>
          <p style={s.brandEyebrow}>Indumentaria & Accesorios</p>
          
          <p style={s.brandTagline}>
            Estética cuidada,<br />
            materiales nobles,<br />
            selección atemporal.
          </p>
          <p style={s.brandNote}>
            Pedidos directos por WhatsApp.<br />
            Sin pagos online, sin intermediarios.
          </p>
        </div>

        {/* COL 2 — Colección */}
        <div style={s.col}>
          <p style={s.colTitle}>Colección</p>
          <div style={s.colLinks}>
            <Link to="/catalogo" style={s.colLink}>
              <span>Ver todo</span>
              <ArrowUpRight size={11} weight="bold" style={s.colLinkIcon} />
            </Link>
            {CATEGORIAS.filter((c) => c.value !== 'sale')
              .slice(0, 5)
              .map((c) => (
                <Link key={c.value} to={`/catalogo?categoria=${c.value}`} style={s.colLink}>
                  <span>{c.label}</span>
                </Link>
              ))}
            <Link to="/catalogo?categoria=sale" style={{ ...s.colLink, ...s.colLinkSale }}>
              <span>Sale / Ofertas</span>
            </Link>
          </div>
        </div>

        {/* COL 3 — Navegación */}
        <div style={s.col}>
          <p style={s.colTitle}>Navegación</p>
          <div style={s.colLinks}>
            <Link to="/" style={s.colLink}><span>Home</span></Link>
            <Link to="/catalogo" style={s.colLink}><span>Catálogo</span></Link>
            <Link to="/carrito" style={s.colLink}><span>Carrito</span></Link>
            <Link to="/contacto" style={s.colLink}><span>Contacto</span></Link>
          </div>
        </div>

        {/* COL 4 — Contacto */}
        <div style={s.col}>
          <p style={s.colTitle}>Atención</p>

          <div style={s.socialRow}>
            <a
              href={waHref}
              target={waNumber ? '_blank' : undefined}
              rel={waNumber ? 'noopener noreferrer' : undefined}
              style={s.socialBtn}
              aria-label="WhatsApp"
            >
              <WhatsappLogo size={16} weight="regular" />
            </a>
            <a
              href={igHref}
              target={instagramUrl ? '_blank' : undefined}
              rel={instagramUrl ? 'noopener noreferrer' : undefined}
              style={s.socialBtn}
              aria-label="Instagram"
            >
              <InstagramLogo size={16} weight="regular" />
            </a>
            <a href={mailHref} style={s.socialBtn} aria-label="Email">
              <EnvelopeSimple size={16} weight="regular" />
            </a>
          </div>

          <div style={s.hoursBlock}>
            <p style={s.hoursTitle}>Horarios</p>
            <p style={s.hoursText}>Lun — Sáb · 10 a 19 hs</p>
          </div>

          <p style={s.atentionNote}>
            Stock y envíos coordinados por WhatsApp. Los pedidos se confirman con el vendedor.
          </p>
        </div>

      </div>

      {/* ── Bottom bar */}
      <div style={s.bottom}>
        <div style={s.bottomRule} />
        <div style={s.bottomInner}>
          <p style={s.copy}>© {year} claroscuro. Todos los derechos reservados.</p>
          <div style={s.bottomRight}>
            <span style={s.bottomTag}>Hecho con cuidado · Argentina</span>
          </div>
        </div>
      </div>

    </footer>
  )
}

const s = {
  root: {
    marginTop: '6rem',
    background: 'linear-gradient(180deg, rgba(14,12,10,0.99) 0%, rgba(8,7,5,1) 100%)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    color: 'rgba(247,244,239,0.72)',
    position: 'relative',
    overflow: 'hidden',
  },

  /* ── Decorative background glow */
  /* (applied via pseudo in real CSS; here we replicate with an inline div trick below) */

  /* ── Top rule */
  topRule: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '2rem 3rem 0',
    maxWidth: 1200,
    margin: '0 auto',
  },
  topRuleLine: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(184,149,106,0.18), transparent)',
  },
  topRuleLabel: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: '0.78rem',
    letterSpacing: '0.42em',
    textTransform: 'uppercase',
    color: 'rgba(184,149,106,0.55)',
    fontWeight: 300,
    whiteSpace: 'nowrap',
  },

  /* ── Main grid */
  grid: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '2.5rem 3rem 3rem',
    display: 'grid',
    gridTemplateColumns: '1.8fr 1fr 1fr 1.2fr',
    gap: '3rem',
    alignItems: 'start',
  },

  /* Brand col */
  brandCol: {},
  brandEyebrow: {
    margin: '0 0 0.75rem',
    fontSize: '0.62rem',
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    color: 'rgba(184,149,106,0.6)',
    fontWeight: 300,
  },
  brandLogo: {
    height: '64px',
    width: 'auto',
    display: 'block',
    marginBottom: '1.25rem',
    opacity: 0.88,
  },
  brandTagline: {
    margin: '0 0 1rem',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: '1.05rem',
    fontWeight: 300,
    fontStyle: 'italic',
    lineHeight: 1.85,
    color: 'rgba(247,244,239,0.45)',
  },
  brandNote: {
    margin: 0,
    fontSize: '0.82rem',
    fontWeight: 300,
    lineHeight: 1.85,
    color: 'rgba(247,244,239,0.28)',
  },

  /* Nav cols */
  col: {},
  colTitle: {
    margin: '0 0 1.1rem',
    fontSize: '0.62rem',
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    fontWeight: 300,
    color: 'rgba(184,149,106,0.65)',
  },
  colLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  colLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    fontSize: '0.9rem',
    fontWeight: 300,
    color: 'rgba(247,244,239,0.48)',
    textDecoration: 'none',
    lineHeight: 1.4,
    transition: 'color 0.2s ease',
    width: 'fit-content',
  },
  colLinkSale: {
    color: 'rgba(192,57,43,0.65)',
  },
  colLinkIcon: {
    opacity: 0.4,
    flexShrink: 0,
  },

  /* Atención col */
  socialRow: {
    display: 'flex',
    gap: '0.6rem',
    marginBottom: '1.5rem',
  },
  socialBtn: {
    width: 34,
    height: 34,
    borderRadius: 2,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    display: 'grid',
    placeItems: 'center',
    color: 'rgba(247,244,239,0.55)',
    textDecoration: 'none',
    transition: 'border-color 0.2s, color 0.2s',
  },
  hoursBlock: {
    marginBottom: '1rem',
  },
  hoursTitle: {
    margin: '0 0 0.2rem',
    fontSize: '0.62rem',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'rgba(184,149,106,0.5)',
    fontWeight: 300,
  },
  hoursText: {
    margin: 0,
    fontSize: '0.88rem',
    fontWeight: 300,
    color: 'rgba(247,244,239,0.45)',
    lineHeight: 1.6,
  },
  atentionNote: {
    margin: 0,
    fontSize: '0.8rem',
    fontWeight: 300,
    lineHeight: 1.8,
    color: 'rgba(247,244,239,0.25)',
  },

  /* ── Bottom */
  bottom: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 3rem 1.75rem',
  },
  bottomRule: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
    marginBottom: '1.25rem',  
  },
  bottomInner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  copy: {
    margin: 0,
    fontSize: '0.75rem',
    fontWeight: 300,
    color: 'rgba(247,244,239,0.22)',
    letterSpacing: '0.03em',
  },
  bottomRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  bottomTag: {
    fontSize: '0.72rem',
    fontWeight: 300,
    color: 'rgba(247,244,239,0.18)',
    letterSpacing: '0.06em',
  },
}

/* ── Responsive mobile */
if (typeof window !== 'undefined') {
  const applyFooterBreakpoint = (isMobile) => {
    if (isMobile) {
      s.grid.gridTemplateColumns = '1fr'
      s.grid.padding = '2rem 1.5rem 2.5rem'
      s.grid.gap = '2rem'
      s.grid.textAlign = 'center'
      s.topRule.padding = '2rem 1.5rem 0'
      s.bottom.padding = '0 1.5rem 1.75rem'
      s.brandCol.display = 'flex'
      s.brandCol.flexDirection = 'column'
      s.brandCol.alignItems = 'center'
      s.brandLogo.margin = '0 auto 1.25rem'
      s.col.display = 'flex'
      s.col.flexDirection = 'column'
      s.col.alignItems = 'center'
      s.colLinks.alignItems = 'center'
      s.socialRow.justifyContent = 'center'
      s.bottomInner.flexDirection = 'column'
      s.bottomInner.textAlign = 'center'
      s.bottomInner.gap = '0.4rem'
    } else {
      s.grid.gridTemplateColumns = '1.8fr 1fr 1fr 1.2fr'
      s.grid.padding = '2.5rem 3rem 3rem'
      s.grid.gap = '3rem'
      s.grid.textAlign = 'left'
      s.topRule.padding = '2rem 3rem 0'
      s.bottom.padding = '0 3rem 1.75rem'
      s.brandCol.display = 'block'
      s.brandCol.flexDirection = undefined
      s.brandCol.alignItems = undefined
      s.brandLogo.margin = undefined
      s.col.display = 'block'
      s.col.flexDirection = undefined
      s.col.alignItems = undefined
      s.colLinks.alignItems = undefined
      s.socialRow.justifyContent = undefined
      s.bottomInner.flexDirection = undefined
      s.bottomInner.textAlign = undefined
      s.bottomInner.gap = '1rem'
    }
  }

  const mql = window.matchMedia('(max-width: 768px)')
  applyFooterBreakpoint(mql.matches)
  mql.addEventListener('change', (e) => applyFooterBreakpoint(e.matches))
}

export default Footer