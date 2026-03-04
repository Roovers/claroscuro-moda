import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, List, X, CaretDown } from '@phosphor-icons/react'
import { useCarrito } from '../context/CarritoContext'
import { CATEGORIAS } from '../constants/categorias'
import logo from "../assets/logo1.png";

const Navbar = () => {
  const { cantidadTotal } = useCarrito()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // dropdown catálogo
  const [colOpen, setColOpen] = useState(false)
  const closeTimer = useRef(null)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // cerrar overlays al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false)
    setColOpen(false)
  }, [location])

  // cerrar con ESC (mejor UX)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setColOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const isActive = useMemo(() => {
    const path = location.pathname
    return {
      home: path === '/',
      catalogo: path.startsWith('/catalogo') || path.startsWith('/producto'),
      carrito: path.startsWith('/carrito'),
      contacto: path.startsWith('/contacto'),
    }
  }, [location.pathname])

  const openCatalogo = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setColOpen(true)
  }

  const closeCatalogoWithDelay = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    // pequeño delay para que no se cierre al “cruzar” al dropdown
    closeTimer.current = setTimeout(() => setColOpen(false), 120)
  }

  return (
    <>
      <header style={{ ...nav.bar, ...(scrolled ? nav.barScrolled : {}) }}>
        {/* Logo */}
  <Link to="/" style={nav.logo} aria-label="Ir al inicio">
    <img
      src={logo}
      alt="Logo"
      style={{
        height: "100px",
        width: "auto"
      }}
    />
  </Link>

        {/* Desktop nav */}
        <nav style={nav.links} aria-label="Navegación principal">
          <Link to="/" style={{ ...nav.link, ...(isActive.home ? nav.linkActive : {}) }}>
            Home
          </Link>

          {/* Catálogo dropdown: el wrapper incluye link + dropdown + buffer */}
          <div
            style={nav.dropWrap}
            onPointerEnter={openCatalogo}
            onPointerLeave={closeCatalogoWithDelay}
          >
            <Link
              to="/catalogo"
              style={{ ...nav.link, ...(isActive.catalogo ? nav.linkActive : {}) }}
              aria-haspopup="menu"
              aria-expanded={colOpen}
            >
              Catálogo <CaretDown size={12} weight="bold" style={{ marginLeft: 4, verticalAlign: 'middle' }} />
            </Link>

            {/* buffer invisible para evitar “flicker” */}
            {colOpen && <div style={nav.dropBuffer} />}

            {colOpen && (
              <div
                style={nav.dropdown}
                className="anim-scale-in"
                role="menu"
                aria-label="Categorías"
                onPointerEnter={openCatalogo}
                onPointerLeave={closeCatalogoWithDelay}
              >
                <div style={nav.dropGrid}>
                  <Link to="/catalogo" style={nav.dropAll} role="menuitem">
                    Ver todo
                  </Link>

                  {CATEGORIAS.filter((c) => c.value !== 'sale').map((c) => (
                    <Link
                      key={c.value}
                      to={`/catalogo?categoria=${c.value}`}
                      style={nav.dropItem}
                      role="menuitem"
                    >
                      {c.label}
                    </Link>
                  ))}

                  <Link
                    to="/catalogo?categoria=sale"
                    style={{ ...nav.dropItem, color: '#c0392b', fontWeight: 600 }}
                    role="menuitem"
                  >
                    Sale
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link to="/contacto" style={{ ...nav.link, ...(isActive.contacto ? nav.linkActive : {}) }}>
            Contacto
          </Link>
        </nav>

        {/* Actions */}
        <div style={nav.actions}>
          <Link
            to="/carrito"
            style={{ ...nav.iconBtn, ...(isActive.carrito ? nav.iconBtnActive : {}) }}
            aria-label="Carrito"
          >
            <ShoppingBag size={22} weight="light" />
            {cantidadTotal > 0 && <span style={nav.badge}>{cantidadTotal}</span>}
          </Link>

          <button
            style={nav.iconBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            type="button"
          >
            {menuOpen ? <X size={22} weight="light" /> : <List size={22} weight="light" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={nav.drawer} className="anim-fade-in" aria-label="Menú móvil">
          <Link to="/" style={nav.drawerItem}>
            Home
          </Link>

          <Link to="/catalogo" style={nav.drawerItem}>
            Catálogo (ver todo)
          </Link>

          <div style={nav.drawerGroup}>
            <p style={nav.drawerGroupTitle}>Categorías</p>
            {CATEGORIAS.map((c) => (
              <Link key={c.value} to={`/catalogo?categoria=${c.value}`} style={nav.drawerSubItem}>
                {c.label}
              </Link>
            ))}
          </div>

          <Link to="/contacto" style={nav.drawerItem}>
            Contacto
          </Link>

          <Link to="/carrito" style={{ ...nav.drawerItem, color: 'var(--accent)' }}>
            Carrito {cantidadTotal > 0 ? `(${cantidadTotal})` : ''}
          </Link>
        </div>
      )}
    </>
  )
}

const nav = {
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2.5rem',
    height: '68px',
    background: 'rgba(247,244,239,0.82)',
    backdropFilter: 'blur(20px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
    borderBottom: '1px solid var(--border)',
    transition: 'box-shadow var(--transition)',
  },
  barScrolled: { boxShadow: 'var(--shadow-md)' },

  img: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.55rem',
    fontWeight: 400,
    letterSpacing: '0.06em',
    color: 'var(--ink)',
  },

  links: { display: 'flex', gap: '2.2rem', alignItems: 'center' },

  dropWrap: { position: 'relative' },
  dropBuffer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    height: '18px',
  },

  link: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--ink-2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '0.25rem 0',
    borderBottom: '1px solid transparent',
    transition: 'border-color var(--transition), color var(--transition)',
  },
  linkActive: {
    color: 'var(--ink)',
    borderBottom: '1px solid rgba(184,149,106,0.55)',
  },

  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 16px)',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.25rem',
    minWidth: '280px',
    boxShadow: 'var(--shadow-lg)',
  },
  dropGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' },
  dropAll: {
    gridColumn: '1/-1',
    padding: '0.5rem 0.75rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    marginBottom: '0.5rem',
    borderBottom: '1px solid var(--border)',
  },
  dropItem: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.88rem',
    color: 'var(--ink-2)',
    borderRadius: '8px',
    transition: 'background var(--transition)',
  },

  actions: { display: 'flex', alignItems: 'center', gap: '0.5rem' },

  iconBtn: {
    position: 'relative',
    background: 'none',
    border: 'none',
    padding: '0.5rem',
    color: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '10px',
    transition: 'background var(--transition)',
  },
  iconBtnActive: { background: 'rgba(184,149,106,0.10)' },

  badge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '0.6rem',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
  },

  drawer: {
    position: 'fixed',
    top: '68px',
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(247,244,239,0.97)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    zIndex: 190,
    display: 'flex',
    flexDirection: 'column',
    padding: '1.25rem 1.25rem 2rem',
    gap: '0.25rem',
    overflowY: 'auto',
    borderTop: '1px solid var(--border)',
  },
  drawerItem: {
    padding: '0.95rem 0.75rem',
    fontSize: '0.95rem',
    color: 'var(--ink)',
    borderRadius: '12px',
    transition: 'background var(--transition)',
  },
  drawerGroup: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.6)',
  },
  drawerGroupTitle: {
    margin: 0,
    fontSize: '0.72rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  drawerSubItem: {
    display: 'block',
    padding: '0.65rem 0.25rem',
    fontSize: '0.92rem',
    color: 'var(--ink-2)',
    borderRadius: '10px',
  },
}

export default Navbar