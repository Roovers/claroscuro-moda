import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, List, X, CaretDown } from '@phosphor-icons/react'
import { useCarrito } from '../context/CarritoContext'
import { CATEGORIAS } from '../constants/categorias'
import logo from '../assets/logo1.png'

const Navbar = () => {
  const { cantidadTotal } = useCarrito()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [colOpen, setColOpen] = useState(false)
  const closeTimer = useRef(null)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setColOpen(false)
  }, [location])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setMenuOpen(false); setColOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const isActive = useMemo(() => {
    const p = location.pathname
    return {
      home: p === '/',
      catalogo: p.startsWith('/catalogo') || p.startsWith('/producto'),
      carrito: p.startsWith('/carrito'),
      contacto: p.startsWith('/contacto'),
    }
  }, [location.pathname])

  const openCol = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setColOpen(true)
  }
  const closeColDelayed = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setColOpen(false), 140)
  }

  return (
    <>
      {/* ════════════════════════════════════════════════════
          NAVBAR BAR
      ════════════════════════════════════════════════════ */}
      <header style={{ ...n.bar, ...(scrolled ? n.barScrolled : {}) }}>

        {/* Left — logo */}
        <Link to="/" style={n.logoWrap} aria-label="Ir al inicio">
          <img src={logo} alt="claroscuro" style={n.logoImg} />
        </Link>

        {/* Center — desktop nav */}
        <nav style={n.navLinks} aria-label="Navegación principal">

          <Link
            to="/"
            style={{ ...n.navLink, ...(isActive.home ? n.navLinkActive : {}) }}
          >
            Home
          </Link>

          {/* Catálogo con dropdown */}
          <div
            style={n.dropWrap}
            onPointerEnter={openCol}
            onPointerLeave={closeColDelayed}
          >
            <Link
              to="/catalogo"
              style={{ ...n.navLink, ...(isActive.catalogo ? n.navLinkActive : {}) }}
              aria-haspopup="menu"
              aria-expanded={colOpen}
            >
              Catálogo
              <CaretDown
                size={10}
                weight="bold"
                style={{
                  marginLeft: 5,
                  verticalAlign: 'middle',
                  transition: 'transform 0.2s ease',
                  transform: colOpen ? 'rotate(-180deg)' : 'rotate(0deg)',
                }}
              />
            </Link>

            {/* Invisible buffer to prevent flicker */}
            {colOpen && <div style={n.dropBuffer} />}

            {colOpen && (
              <div
                style={n.dropdown}
                className="anim-scale-in"
                role="menu"
                onPointerEnter={openCol}
                onPointerLeave={closeColDelayed}
              >
                {/* Header del dropdown */}
                <div style={n.dropHeader}>
                  <span style={n.dropHeaderLabel}>Explorar colección</span>
                  <Link to="/catalogo" style={n.dropHeaderCta}>
                    Ver todo →
                  </Link>
                </div>

                <div style={n.dropDivider} />

                {/* Grid de categorías */}
                <div style={n.dropGrid}>
                  {CATEGORIAS.filter((c) => c.value !== 'sale').map((c) => (
                    <Link
                      key={c.value}
                      to={`/catalogo?categoria=${c.value}`}
                      style={n.dropItem}
                      role="menuitem"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>

                <div style={n.dropDivider} />

                {/* Sale */}
                <Link
                  to="/catalogo?categoria=sale"
                  style={n.dropSale}
                  role="menuitem"
                >
                  <span style={n.dropSaleDot} />
                  Sale / Ofertas
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/contacto"
            style={{ ...n.navLink, ...(isActive.contacto ? n.navLinkActive : {}) }}
          >
            Contacto
          </Link>

        </nav>

        {/* Right — actions */}
        <div style={n.actions}>

          {/* Carrito */}
          <Link
            to="/carrito"
            style={{ ...n.iconBtn, ...(isActive.carrito ? n.iconBtnActive : {}) }}
            aria-label={`Carrito${cantidadTotal > 0 ? ` (${cantidadTotal} items)` : ''}`}
          >
            <ShoppingBag size={19} weight="light" />
            {cantidadTotal > 0 && (
              <span style={n.cartBadge} aria-hidden="true">
                {cantidadTotal}
              </span>
            )}
          </Link>

          {/* Hamburger — mobile only */}
          <button
            style={n.burgerBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            type="button"
          >
            {menuOpen
              ? <X size={19} weight="light" />
              : <List size={19} weight="light" />
            }
          </button>

        </div>
      </header>


      {/* ════════════════════════════════════════════════════
          MOBILE DRAWER
      ════════════════════════════════════════════════════ */}
      {menuOpen && (
        <div style={n.drawer} className="anim-fade-in" role="dialog" aria-label="Menú móvil">

          {/* Brand mark */}
          <div style={n.drawerBrand}>
            <span style={n.drawerBrandName}>claroscuro</span>
            <span style={n.drawerBrandSub}>Indumentaria & Accesorios</span>
          </div>

          <div style={n.drawerDivider} />

          {/* Main links */}
          <nav style={n.drawerNav}>
            <Link to="/" style={n.drawerLink}>
              <span style={n.drawerLinkNum}>01</span>
              <span>Home</span>
            </Link>
            <Link to="/catalogo" style={n.drawerLink}>
              <span style={n.drawerLinkNum}>02</span>
              <span>Catálogo</span>
            </Link>
            <Link to="/contacto" style={n.drawerLink}>
              <span style={n.drawerLinkNum}>03</span>
              <span>Contacto</span>
            </Link>
            <Link to="/carrito" style={{ ...n.drawerLink, ...n.drawerLinkCart }}>
              <span style={n.drawerLinkNum}>04</span>
              <span>
                Carrito{cantidadTotal > 0 ? ` (${cantidadTotal})` : ''}
              </span>
            </Link>
          </nav>

          <div style={n.drawerDivider} />

          {/* Categorías */}
          <div style={n.drawerSection}>
            <p style={n.drawerSectionTitle}>Categorías</p>
            <div style={n.drawerCatGrid}>
              {CATEGORIAS.map((c) => (
                <Link
                  key={c.value}
                  to={`/catalogo?categoria=${c.value}`}
                  style={{
                    ...n.drawerCatChip,
                    ...(c.value === 'sale' ? n.drawerCatChipSale : {}),
                  }}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Overlay behind drawer */}
      {menuOpen && (
        <div
          style={n.drawerOverlay}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STYLES                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */
const n = {
  /* ── Bar */
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2.5rem',
    height: '64px',
    background: 'rgba(247,244,239,0.88)',
    backdropFilter: 'blur(24px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
    borderBottom: '1px solid var(--border)',
    transition: 'box-shadow 0.28s ease, background 0.28s ease',
  },
  barScrolled: {
    background: 'rgba(247,244,239,0.96)',
    boxShadow: '0 1px 0 var(--border), 0 4px 24px rgba(90,60,30,0.06)',
  },

  /* ── Logo */
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoImg: {
    height: '60px',
    width: 'auto',
    display: 'block',
  },

  /* ── Desktop nav */
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '2.5rem',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  navLink: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.72rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    fontWeight: 400,
    color: 'var(--ink-3)',
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.2rem 0',
    borderBottom: '1px solid transparent',
    transition: 'color 0.2s ease, border-color 0.2s ease',
    whiteSpace: 'nowrap',
  },
  navLinkActive: {
    color: 'var(--ink)',
    borderBottomColor: 'var(--accent)',
  },

  /* ── Dropdown */
  dropWrap: { position: 'relative' },
  dropBuffer: {
    position: 'absolute',
    top: '100%',
    left: '-1rem',
    right: '-1rem',
    height: '20px',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 18px)',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(252,250,246,0.97)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid var(--border)',
    borderRadius: 2,
    padding: '1rem',
    minWidth: '300px',
    boxShadow: '0 16px 48px rgba(90,60,30,0.12), 0 2px 8px rgba(90,60,30,0.06)',
  },
  dropHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingBottom: '0.75rem',
  },
  dropHeaderLabel: {
    fontSize: '0.62rem',
    letterSpacing: '0.26em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 400,
  },
  dropHeaderCta: {
    fontSize: '0.72rem',
    color: 'var(--accent-dark)',
    fontWeight: 400,
    letterSpacing: '0.06em',
  },
  dropDivider: {
    height: 1,
    background: 'var(--border)',
    margin: '0.5rem 0',
  },
  dropGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.1rem',
    padding: '0.35rem 0',
  },
  dropItem: {
    padding: '0.5rem 0.6rem',
    fontSize: '0.85rem',
    fontWeight: 300,
    color: 'var(--ink-2)',
    borderRadius: 2,
    transition: 'background 0.15s, color 0.15s',
    display: 'block',
  },
  dropSale: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '0.5rem 0.6rem',
    fontSize: '0.82rem',
    fontWeight: 400,
    color: '#b5312c',
    letterSpacing: '0.04em',
  },
  dropSaleDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#b5312c',
    flexShrink: 0,
  },

  /* ── Actions */
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
  },
  iconBtn: {
    position: 'relative',
    background: 'none',
    border: 'none',
    padding: '0.5rem',
    color: 'var(--ink-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    cursor: 'pointer',
    transition: 'color 0.2s, background 0.2s',
    textDecoration: 'none',
  },
  iconBtnActive: {
    color: 'var(--ink)',
    background: 'rgba(184,149,106,0.08)',
  },
  cartBadge: {
    position: 'absolute',
    top: '3px',
    right: '3px',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '0.58rem',
    minWidth: '15px',
    height: '15px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    letterSpacing: 0,
    padding: '0 3px',
    lineHeight: 1,
  },
  burgerBtn: {
    background: 'none',
    border: 'none',
    padding: '0.5rem',
    color: 'var(--ink-2)',
    display: 'none', // shown via @media in real CSS; here we rely on the breakpoint below
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    cursor: 'pointer',
    // We show this via JS className trick below — see note
  },

  /* ── Mobile drawer */
  drawerOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 180,
    background: 'rgba(26,20,16,0.35)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  },
  drawer: {
    position: 'fixed',
    top: '64px',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 190,
    background: 'rgba(247,244,239,0.99)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem 2rem 3rem',
    gap: 0,
  },
  drawerBrand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    paddingBottom: '1.5rem',
  },
  drawerBrandName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: '1.6rem',
    fontWeight: 300,
    letterSpacing: '0.06em',
    color: 'var(--ink)',
  },
  drawerBrandSub: {
    fontSize: '0.65rem',
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 300,
  },
  drawerDivider: {
    height: 1,
    background: 'var(--border)',
    marginBottom: '1.5rem',
  },
  drawerNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    marginBottom: '1.75rem',
  },
  drawerLink: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
    padding: '0.9rem 0',
    fontSize: '1.6rem',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontWeight: 300,
    color: 'var(--ink)',
    textDecoration: 'none',
    borderBottom: '1px solid var(--border)',
    letterSpacing: '-0.01em',
  },
  drawerLinkCart: {
    color: 'var(--accent-dark)',
  },
  drawerLinkNum: {
    fontSize: '0.62rem',
    letterSpacing: '0.18em',
    color: 'var(--ink-3)',
    fontFamily: 'var(--font-body)',
    fontWeight: 300,
    flexShrink: 0,
    paddingBottom: '0.1rem',
  },
  drawerSection: {
    paddingTop: '0.25rem',
  },
  drawerSectionTitle: {
    margin: '0 0 0.85rem',
    fontSize: '0.62rem',
    letterSpacing: '0.26em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    fontWeight: 400,
  },
  drawerCatGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  drawerCatChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.5rem 0.9rem',
    border: '1px solid var(--border)',
    borderRadius: 2,
    fontSize: '0.8rem',
    fontWeight: 300,
    color: 'var(--ink-2)',
    textDecoration: 'none',
    background: 'rgba(255,255,255,0.5)',
  },
  drawerCatChipSale: {
    color: '#b5312c',
    borderColor: 'rgba(181,49,44,0.22)',
    background: 'rgba(181,49,44,0.04)',
  },
}

/* ── Responsive: show burger, hide desktop nav on small screens */
if (typeof window !== 'undefined') {
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  if (isMobile) {
    n.navLinks.display = 'none'
    n.burgerBtn.display = 'flex'
  }

  window.matchMedia('(max-width: 768px)').addEventListener('change', (e) => {
    n.navLinks.display = e.matches ? 'none' : 'flex'
    n.burgerBtn.display = e.matches ? 'flex' : 'none'
  })
}

export default Navbar