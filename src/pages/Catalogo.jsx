import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MagnifyingGlass, ArrowRight, ArrowUpRight, X, SlidersHorizontal } from '@phosphor-icons/react'
import { useProductosPaginados } from '../hooks/useProductosPaginados'
import { CATEGORIAS } from '../constants/categorias'

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MEDIA QUERY HOOK                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */
const useMediaQuery = (query) => {
  const getMatches = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  }
  const [matches, setMatches] = useState(getMatches)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    setMatches(mql.matches)
    if (mql.addEventListener) mql.addEventListener('change', handler)
    else mql.addListener(handler)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler)
      else mql.removeListener(handler)
    }
  }, [query])
  return matches
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  COLOR SWATCHES                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */
const ColorSwatches = ({ colores }) => {
  const list = Array.isArray(colores) ? colores : []
  if (list.length === 0) return null
  const shown = list.slice(0, 4)
  const rest = list.length - shown.length
  return (
    <div style={sc.swatches}>
      {shown.map((c, i) => (
        <span
          key={i}
          title={c?.nombre}
          style={{ ...sc.swatch, background: c?.hex || '#ccc' }}
        />
      ))}
      {rest > 0 && <span style={sc.swatchMore}>+{rest}</span>}
    </div>
  )
}

const labelCategoria = (value) => {
  if (!value) return 'Colección'
  return CATEGORIAS.find((x) => x.value === value)?.label || value
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  PRODUCT CARD — same language as Home                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
const ProductCard = ({ p, index = 0 }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <article
      className="anim-fade-up"
      style={{ animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}
    >
      <Link
        to={`/producto/${p.id}`}
        style={sc.card}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image */}
        <div style={sc.cardImgWrap}>
          {p.imagenes?.[0] ? (
            <img
              src={p.imagenes[0]}
              alt={p.nombre}
              style={{
                ...sc.cardImg,
                transform: hovered ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)',
              }}
              loading="lazy"
            />
          ) : (
            <div style={sc.cardImgFallback} />
          )}

          {/* Overlay */}
          <div
            style={{
              ...sc.cardOverlay,
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.32s ease',
            }}
          >
            <span style={sc.cardOverlayPill}>
              Ver detalles <ArrowUpRight size={12} weight="bold" style={{ marginLeft: 5 }} />
            </span>
          </div>

          {/* Sale badge */}
          {p.categoria === 'sale' && (
            <div style={sc.saleBadge}>SALE</div>
          )}
        </div>

        {/* Info */}
        <div style={sc.cardInfo}>
          <div style={sc.cardMeta}>
            <span style={sc.cardCat}>{labelCategoria(p.categoria)}</span>
            <ColorSwatches colores={p?.variantes?.colores} />
          </div>
          <div style={sc.cardBottom}>
            <p style={sc.cardName}>{p.nombre}</p>
            <p style={sc.cardPrice}>${(p.precio || 0).toLocaleString('es-AR')}</p>
          </div>
        </div>
      </Link>
    </article>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  CATALOGO PAGE                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
const Catalogo = () => {
  const [params, setParams] = useSearchParams()
  const categoriaParam = params.get('categoria') || ''
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('recientes')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const isMd = useMediaQuery('(max-width: 980px)')
  const isSm = useMediaQuery('(max-width: 560px)')

  const {
    productos,
    cargando,
    error,
    paginaActual,
    hayMas,
    hayAnterior,
    siguiente,
    anterior,
  } = useProductosPaginados({ categoria: categoriaParam || '', pageSize: 12 })

  useEffect(() => { setBusqueda('') }, [categoriaParam])

  const categoriaLabel = useMemo(() => {
    if (!categoriaParam) return 'Todo'
    return CATEGORIAS.find((c) => c.value === categoriaParam)?.label || categoriaParam
  }, [categoriaParam])

  const productosProcesados = useMemo(() => {
    let list = Array.isArray(productos) ? [...productos] : []
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      list = list.filter((p) => (p.nombre || '').toLowerCase().includes(q))
    }
    if (orden === 'precio-asc') list.sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0))
    else if (orden === 'precio-desc') list.sort((a, b) => Number(b.precio || 0) - Number(a.precio || 0))
    else if (orden === 'az') list.sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'))
    return list
  }, [productos, busqueda, orden])

  const hayFiltrosLocales = busqueda.trim() || orden !== 'recientes'

  const cambiarCategoria = (value) => {
    if (!value) { params.delete('categoria'); setParams(params, { replace: true }); return }
    setParams({ categoria: value }, { replace: true })
  }

  const limpiar = () => { setBusqueda(''); setOrden('recientes') }

  const gridCols = isSm ? '1fr' : isMd ? 'repeat(2, minmax(0,1fr))' : 'repeat(3, minmax(0,1fr))'
  const hayFiltros = hayFiltrosLocales

  return (
    <main style={{ ...s.page, padding: isSm ? '0 1.25rem 5rem' : s.page.padding }}>

      {/* ══════════════════════════════════════════════════════════
          HEADER EDITORIAL
      ══════════════════════════════════════════════════════════ */}
      <header style={s.pageHeader} className="anim-fade-up">
        <div style={s.headerTop}>
          <div style={s.headerLeft}>
            <div style={s.headerKickerRow}>
              <div style={s.headerKickerLine} />
              <span style={s.headerKicker}>Catálogo</span>
            </div>
            <h1 style={s.headerTitle}>
              {categoriaParam ? (
                <>
                  <em style={s.headerTitleItalic}>{categoriaLabel}</em>
                </>
              ) : (
                <>
                  Toda la<br />
                  <em style={s.headerTitleItalic}>colección</em>
                </>
              )}
            </h1>
            <p style={s.headerSub}>
              Elegí talle y color, sumá al carrito, finalizá por WhatsApp.
            </p>
          </div>

          <div style={s.headerRight}>
            <Link to="/carrito" style={s.headerCartBtn}>
              Ir al carrito
              <ArrowRight size={13} weight="bold" style={{ marginLeft: 7 }} />
            </Link>
          </div>
        </div>

        {/* Divider con conteo */}
        <div style={s.headerDivider}>
          <div style={s.headerDividerLine} />
          <span style={s.headerCount}>
            {cargando ? 'Cargando…' : `${productosProcesados.length} producto${productosProcesados.length !== 1 ? 's' : ''}`}
          </span>
          <div style={s.headerDividerLine} />
        </div>
      </header>


      {/* ══════════════════════════════════════════════════════════
          CATEGORÍAS — horizontal pill strip
      ══════════════════════════════════════════════════════════ */}
      <nav style={s.catStrip} aria-label="Categorías" className="anim-fade-up">
        <button
          type="button"
          onClick={() => cambiarCategoria('')}
          style={{ ...s.catPill, ...(categoriaParam === '' ? s.catPillActive : {}) }}
        >
          Todo
        </button>
        {CATEGORIAS.filter((c) => c.value !== 'sale').map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => cambiarCategoria(c.value)}
            style={{ ...s.catPill, ...(categoriaParam === c.value ? s.catPillActive : {}) }}
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => cambiarCategoria('sale')}
          style={{
            ...s.catPill,
            ...(categoriaParam === 'sale' ? s.catPillActive : {}),
            ...s.catPillSale,
          }}
        >
          Sale
        </button>
      </nav>


      {/* ══════════════════════════════════════════════════════════
          FILTERS BAR — typographic, minimal
      ══════════════════════════════════════════════════════════ */}
      <div style={s.filterBar} className="anim-fade-up">
        {/* Search */}
        <div style={s.searchWrap}>
          <MagnifyingGlass size={14} weight="bold" style={s.searchIcon} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto…"
            style={s.searchInput}
            aria-label="Buscar"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              style={s.searchClear}
              aria-label="Limpiar búsqueda"
            >
              <X size={12} weight="bold" />
            </button>
          )}
        </div>

        {/* Separator */}
        <div style={s.filterSep} />

        {/* Order label + select */}
        <div style={s.filterGroup}>
          <span style={s.filterLabel}>Ordenar</span>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            style={s.filterSelect}
            aria-label="Ordenar productos"
          >
            <option value="recientes">Más nuevos</option>
            <option value="precio-asc">Precio ↑</option>
            <option value="precio-desc">Precio ↓</option>
            <option value="az">Nombre A–Z</option>
          </select>
        </div>

        {/* Clear active filters */}
        {hayFiltros && (
          <>
            <div style={s.filterSep} />
            <button type="button" onClick={limpiar} style={s.filterClearBtn}>
              <X size={11} weight="bold" style={{ marginRight: 5 }} />
              Limpiar
            </button>
          </>
        )}
      </div>


      {/* ══════════════════════════════════════════════════════════
          ERROR
      ══════════════════════════════════════════════════════════ */}
      {error && (
        <div style={s.errorBox} role="alert">
          <p style={s.errorTitle}>Error al cargar productos</p>
          <p style={s.errorText}>{error}</p>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════
          GRID
      ══════════════════════════════════════════════════════════ */}
      {cargando ? (
        <div style={{ ...s.grid, gridTemplateColumns: gridCols }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={s.skelCard} className="skeleton" />
          ))}
        </div>
      ) : productosProcesados.length === 0 ? (
        <EmptyState onLimpiar={limpiar} busqueda={busqueda} />
      ) : (
        <div style={{ ...s.grid, gridTemplateColumns: gridCols }}>
          {productosProcesados.map((p, i) => (
            <ProductCard key={p.id} p={p} index={i} />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PAGINACIÓN
      ══════════════════════════════════════════════════════════ */}
      {!busqueda.trim() && (hayAnterior || hayMas) && (
        <div style={s.pagination}>
          <button
            type="button"
            onClick={anterior}
            disabled={!hayAnterior || cargando}
            style={{ ...s.pageBtn, ...((!hayAnterior || cargando) ? s.pageBtnDisabled : {}) }}
          >
            ← Anterior
          </button>
          <span style={s.pageNum}>Página {paginaActual + 1}</span>
          <button
            type="button"
            onClick={siguiente}
            disabled={!hayMas || cargando}
            style={{ ...s.pageBtn, ...((!hayMas || cargando) ? s.pageBtnDisabled : {}) }}
          >
            Siguiente →
          </button>
        </div>
      )}

    </main>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  EMPTY STATE                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */
const EmptyState = ({ onLimpiar, busqueda }) => (
  <div style={s.empty} className="anim-fade-up">
    <div style={s.emptyInner}>
      <span style={s.emptyEyebrow}>Sin resultados</span>
      <h2 style={s.emptyTitle}>
        {busqueda ? `"${busqueda}"` : 'Sin productos'}
      </h2>
      <p style={s.emptySub}>
        {busqueda
          ? 'No encontramos prendas con ese nombre. Probá con otra búsqueda o limpiá los filtros.'
          : 'Esta categoría no tiene productos disponibles por el momento.'}
      </p>
      <div style={s.emptyActions}>
        <button type="button" onClick={onLimpiar} style={s.btnOutline}>
          Limpiar filtros
        </button>
        <Link to="/" style={s.btnDark}>
          Volver al home
        </Link>
      </div>
    </div>
  </div>
)

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STYLES                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

const sc = {
  swatches: { display: 'inline-flex', alignItems: 'center', gap: 5 },
  swatch: {
    width: 11,
    height: 11,
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.12)',
    flexShrink: 0,
  },
  swatchMore: { fontSize: '0.72rem', color: 'var(--ink-3)', fontWeight: 300 },

  card: {
    display: 'block',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
  cardImgWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '3 / 4',
    overflow: 'hidden',
    background: 'var(--bg-2)',
    borderRadius: 2,
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transformOrigin: 'center',
  },
  cardImgFallback: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, var(--bg-2), var(--accent-light))',
  },
  cardOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(26,20,16,0.22)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: '0.85rem',
    pointerEvents: 'none',
  },
  cardOverlayPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.45rem 0.85rem',
    borderRadius: 999,
    background: 'rgba(247,244,239,0.92)',
    color: 'var(--ink)',
    fontSize: '0.73rem',
    letterSpacing: '0.07em',
    fontWeight: 400,
    backdropFilter: 'blur(10px)',
  },
  saleBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: '0.28rem 0.6rem',
    background: 'rgba(192,57,43,0.92)',
    color: '#fff',
    fontSize: '0.65rem',
    letterSpacing: '0.18em',
    fontWeight: 500,
    borderRadius: 2,
  },
  cardInfo: {
    paddingTop: '0.75rem',
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: '0.3rem',
  },
  cardCat: {
    fontSize: '0.68rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 400,
    margin: 0,
  },
  cardBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  cardName: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: '1.08rem',
    fontWeight: 400,
    color: 'var(--ink)',
    lineHeight: 1.2,
  },
  cardPrice: {
    margin: 0,
    fontSize: '0.88rem',
    fontWeight: 400,
    color: 'var(--ink-2)',
    whiteSpace: 'nowrap',
  },
}

const s = {
  page: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 2.5rem 6rem',
    position: 'relative',
    zIndex: 1,
  },

  /* ── Header */
  pageHeader: {
    paddingTop: '3rem',
    paddingBottom: '0',
    marginBottom: '2rem',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '2rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  headerLeft: {},
  headerKickerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    marginBottom: '1rem',
  },
  headerKickerLine: {
    width: 28,
    height: 1,
    background: 'var(--accent)',
    flexShrink: 0,
  },
  headerKicker: {
    fontSize: '0.7rem',
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    fontWeight: 400,
  },
  headerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.6rem, 5vw, 4rem)',
    fontWeight: 300,
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    color: 'var(--ink)',
    margin: '0 0 0.875rem',
  },
  headerTitleItalic: {
    fontStyle: 'italic',
    fontWeight: 300,
  },
  headerSub: {
    color: 'var(--ink-3)',
    fontSize: '0.98rem',
    fontWeight: 300,
    lineHeight: 1.75,
    margin: 0,
    maxWidth: '52ch',
  },
  headerRight: {
    flexShrink: 0,
    alignSelf: 'flex-start',
    paddingTop: '0.5rem',
  },
  headerCartBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.72rem 1.1rem',
    border: '1px solid var(--border-strong)',
    borderRadius: 2,
    background: 'transparent',
    color: 'var(--ink)',
    fontSize: '0.75rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 400,
    textDecoration: 'none',
  },
  headerDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  headerDividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--border)',
  },
  headerCount: {
    fontSize: '0.7rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 400,
    whiteSpace: 'nowrap',
  },

  /* ── Category strip */
  catStrip: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '1.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid var(--border)',
  },
  catPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.55rem 1rem',
    borderRadius: 2,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--ink-2)',
    fontSize: '0.78rem',
    letterSpacing: '0.06em',
    fontWeight: 300,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-body)',
  },
  catPillActive: {
    background: 'rgba(26,20,16,0.92)',
    color: '#fff',
    borderColor: 'rgba(26,20,16,0.92)',
    fontWeight: 400,
  },
  catPillSale: {
    color: '#b5312c',
    borderColor: 'rgba(181,49,44,0.25)',
  },

  /* ── Filter bar */
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 220px',
    maxWidth: 320,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    color: 'var(--ink-3)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '0.65rem 2rem 0.65rem 2.2rem',
    border: '1px solid var(--border)',
    borderRadius: 2,
    background: 'rgba(255,255,255,0.55)',
    outline: 'none',
    fontSize: '0.85rem',
    fontWeight: 300,
    color: 'var(--ink)',
    fontFamily: 'var(--font-body)',
  },
  searchClear: {
    position: 'absolute',
    right: 10,
    background: 'none',
    border: 'none',
    color: 'var(--ink-3)',
    padding: '0.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  filterSep: {
    width: 1,
    height: 20,
    background: 'var(--border)',
    flexShrink: 0,
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  filterLabel: {
    fontSize: '0.7rem',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 400,
    whiteSpace: 'nowrap',
  },
  filterSelect: {
    padding: '0.55rem 0.85rem',
    border: '1px solid var(--border)',
    borderRadius: 2,
    background: 'rgba(255,255,255,0.55)',
    outline: 'none',
    fontSize: '0.82rem',
    fontWeight: 300,
    color: 'var(--ink)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  filterClearBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.52rem 0.85rem',
    border: '1px solid var(--border)',
    borderRadius: 2,
    background: 'transparent',
    color: 'var(--ink-3)',
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },

  /* ── Grid */
  grid: {
    display: 'grid',
    gap: '2rem 1.5rem',
  },
  skelCard: {
    aspectRatio: '3 / 4',
    borderRadius: 2,
  },

  /* ── Error */
  errorBox: {
    padding: '1.25rem',
    border: '1px solid rgba(181,49,44,0.2)',
    borderRadius: 2,
    background: 'rgba(181,49,44,0.04)',
    marginBottom: '1.5rem',
  },
  errorTitle: {
    margin: '0 0 0.25rem',
    fontSize: '0.88rem',
    fontWeight: 500,
    color: '#b5312c',
  },
  errorText: {
    margin: 0,
    fontSize: '0.82rem',
    color: 'var(--ink-3)',
    fontWeight: 300,
    lineHeight: 1.65,
  },

  /* ── Empty state */
  empty: {
    minHeight: '40vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
  },
  emptyInner: {
    textAlign: 'center',
    maxWidth: 480,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.85rem',
  },
  emptyEyebrow: {
    fontSize: '0.7rem',
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    fontWeight: 400,
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.4rem',
    fontWeight: 300,
    fontStyle: 'italic',
    color: 'var(--ink)',
    margin: 0,
    lineHeight: 1.1,
  },
  emptySub: {
    color: 'var(--ink-3)',
    fontSize: '0.95rem',
    fontWeight: 300,
    lineHeight: 1.8,
    margin: 0,
  },
  emptyActions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '0.5rem',
  },

  /* ── Paginación */
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    marginTop: '3rem',
    paddingTop: '2rem',
    borderTop: '1px solid var(--border)',
  },
  pageBtn: {
    padding: '0.65rem 1.35rem',
    border: '1px solid var(--border-strong)',
    borderRadius: 2,
    background: 'transparent',
    color: 'var(--ink)',
    fontSize: '0.78rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontWeight: 400,
    transition: 'all 0.18s ease',
  },
  pageBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  pageNum: {
    fontSize: '0.72rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 400,
  },

  /* ── Buttons */
  btnDark: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.82rem 1.25rem',
    background: 'rgba(26,20,16,0.92)',
    color: '#fff',
    border: '1px solid rgba(26,20,16,0.5)',
    borderRadius: 2,
    fontSize: '0.78rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 400,
    textDecoration: 'none',
    fontFamily: 'var(--font-body)',
  },
  btnOutline: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.82rem 1.25rem',
    background: 'transparent',
    color: 'var(--ink)',
    border: '1px solid var(--border-strong)',
    borderRadius: 2,
    fontSize: '0.78rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 400,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
}

export default Catalogo