import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Check, Minus, Plus, WarningCircle, ArrowRight } from '@phosphor-icons/react'
import { useProducto } from '../hooks/useProductos'
import { cloudinaryThumb } from '../hooks/useProductosPaginados'
import { useCarrito } from '../context/CarritoContext'
import { CATEGORIAS } from '../constants/categorias'

const Producto = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { producto, cargando, error } = useProducto(id)
  const { agregar } = useCarrito()

  const [imgActiva, setImgActiva] = useState(0)
  const [talleSeleccionado, setTalle] = useState('')
  const [colorSeleccionado, setColor] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)
  const [errorVariante, setErrorVariante] = useState('')

  const tieneTalles = Boolean(producto?.variantes?.talles?.length)
  const tieneColores = Boolean(producto?.variantes?.colores?.length)

  const categoriaLabel = useMemo(() => {
    if (!producto?.categoria) return null
    return CATEGORIAS.find((c) => c.value === producto.categoria)?.label || producto.categoria
  }, [producto?.categoria])

  useEffect(() => {
    if (!producto) return
    if (tieneTalles && producto.variantes.talles.length === 1) setTalle(producto.variantes.talles[0])
    if (tieneColores && producto.variantes.colores.length === 1) setColor(producto.variantes.colores[0])
  }, [producto, tieneTalles, tieneColores])

  useEffect(() => {
    setImgActiva(0)
    setCantidad(1)
    setAgregado(false)
    setErrorVariante('')
    setTalle('')
    setColor(null)
  }, [id])

  const handleAgregar = () => {
    if (!producto) return
    if (tieneTalles && !talleSeleccionado) { setErrorVariante('Seleccioná un talle.'); return }
    if (tieneColores && !colorSeleccionado) { setErrorVariante('Seleccioná un color.'); return }
    setErrorVariante('')
    agregar(producto, talleSeleccionado || 'Único', colorSeleccionado?.nombre || 'Único', cantidad)
    setAgregado(true)
    window.setTimeout(() => setAgregado(false), 2400)
  }

  /* ── Loading skeleton */
  if (cargando) {
    return (
      <main style={s.loadRoot}>
        <div style={s.loadWrap}>
          <div style={s.skelImg} className="skeleton" />
          <div style={s.skelInfo}>
            <div style={{ ...s.skelLine, width: 80, height: 12 }} className="skeleton" />
            <div style={{ ...s.skelLine, width: '70%', height: 40, marginTop: 10 }} className="skeleton" />
            <div style={{ ...s.skelLine, width: '40%', height: 28, marginTop: 8 }} className="skeleton" />
            <div style={{ ...s.skelLine, width: '90%', height: 14, marginTop: 20 }} className="skeleton" />
            <div style={{ ...s.skelLine, width: '80%', height: 14, marginTop: 6 }} className="skeleton" />
            <div style={{ ...s.skelLine, width: '60%', height: 14, marginTop: 6 }} className="skeleton" />
          </div>
        </div>
      </main>
    )
  }

  /* ── Error / not found */
  if (error || !producto) {
    return (
      <main style={s.errorRoot}>
        <div style={s.errorBox} className="anim-fade-up">
          <span style={s.errorEyebrow}>404</span>
          <h1 style={s.errorTitle}>Producto no encontrado</h1>
          <p style={s.errorSub}>Probá volver al catálogo y elegir otro producto.</p>
          <div style={s.errorActions}>
            <button type="button" onClick={() => navigate(-1)} style={s.btnOutline}>
              <ArrowLeft size={13} weight="bold" style={{ marginRight: 7 }} />
              Volver
            </button>
            <Link to="/catalogo" style={s.btnDark}>
              Ir al catálogo
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={s.root}>

      {/* ── Breadcrumb */}
      <div style={s.breadcrumb} className="anim-fade-up">
        <button type="button" onClick={() => navigate(-1)} style={s.backBtn}>
          <ArrowLeft size={12} weight="bold" style={{ marginRight: 6 }} />
          Volver
        </button>
        <span style={s.breadSep}>·</span>
        <Link to="/catalogo" style={s.breadLink}>Catálogo</Link>
        {categoriaLabel && (
          <>
            <span style={s.breadSep}>·</span>
            <Link to={`/catalogo?categoria=${producto.categoria}`} style={s.breadLink}>
              {categoriaLabel}
            </Link>
          </>
        )}
        <span style={s.breadSep}>·</span>
        <span style={s.breadCurrent}>{producto.nombre}</span>
      </div>

      {/* ── Layout */}
      <div style={s.layout}>

        {/* ════════════════════════════
            GALERÍA
        ════════════════════════════ */}
        <section style={s.galeria} className="anim-fade-up" aria-label="Galería">

          {/* Imagen principal */}
          <div style={s.mainImgWrap}>
            {producto.imagenes?.[imgActiva] ? (
              <img
                src={cloudinaryThumb(producto.imagenes[imgActiva], 900)}
                alt={producto.nombre}
                style={s.mainImg}
                key={imgActiva}
              />
            ) : (
              <div style={s.mainImgFallback} />
            )}

            {/* Corner marks — mismo detalle decorativo que el hero */}
            <div style={{ ...s.corner, top: 14, left: 14 }} />
            <div style={{ ...s.corner, top: 14, right: 14, transform: 'rotate(90deg)' }} />
            <div style={{ ...s.corner, bottom: 14, left: 14, transform: 'rotate(-90deg)' }} />
            <div style={{ ...s.corner, bottom: 14, right: 14, transform: 'rotate(180deg)' }} />
          </div>

          {/* Thumbnails */}
          {producto.imagenes?.length > 1 && (
            <div style={s.thumbs}>
              {producto.imagenes.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  onClick={() => setImgActiva(i)}
                  style={{
                    ...s.thumb,
                    outline: i === imgActiva
                      ? '2px solid var(--accent)'
                      : '2px solid transparent',
                    outlineOffset: 3,
                    opacity: i === imgActiva ? 1 : 0.55,
                  }}
                  aria-label={`Imagen ${i + 1}`}
                >
                  <img src={cloudinaryThumb(url, 120)} alt="" style={s.thumbImg} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ════════════════════════════
            INFO
        ════════════════════════════ */}
        <section style={s.info} className="anim-fade-up" aria-label="Detalles">

          {/* Eyebrow */}
          <div style={s.infoKickerRow}>
            {categoriaLabel && (
              <>
                <div style={s.infoKickerLine} />
                <span style={s.infoKicker}>{categoriaLabel}</span>
              </>
            )}
          </div>

          {/* Nombre */}
          <h1 style={s.nombre}>{producto.nombre}</h1>

          {/* Precio */}
          <div style={s.priceRow}>
            <p style={s.precio}>${(producto.precio || 0).toLocaleString('es-AR')}</p>
            <Link to="/carrito" style={s.quickCartLink}>
              Ver carrito <ArrowRight size={12} weight="bold" style={{ marginLeft: 5 }} />
            </Link>
          </div>

          {/* Descripción */}
          {producto.descripcion && (
            <p style={s.descripcion}>{producto.descripcion}</p>
          )}

          <div style={s.divider} />

          {/* ── Colores */}
          {tieneColores && (
            <div style={s.varGroup}>
              <p style={s.varLabel}>
                Color
                {colorSeleccionado && (
                  <span style={s.varSelected}> — {colorSeleccionado.nombre}</span>
                )}
              </p>
              <div style={s.coloresRow}>
                {producto.variantes.colores.map((c) => {
                  const sel = colorSeleccionado?.nombre === c.nombre
                  return (
                    <button
                      key={c.nombre}
                      type="button"
                      onClick={() => { setColor(c); setErrorVariante('') }}
                      title={c.nombre}
                      style={{
                        ...s.colorBtn,
                        background: c.hex,
                        outline: sel ? '2px solid var(--accent-dark)' : '2px solid transparent',
                        outlineOffset: 3,
                      }}
                      aria-pressed={sel}
                      aria-label={`Color ${c.nombre}`}
                    >
                      {sel && (
                        <Check
                          size={10}
                          weight="bold"
                          color="#fff"
                          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Talles */}
          {tieneTalles && (
            <div style={s.varGroup}>
              <p style={s.varLabel}>Talle</p>
              <div style={s.tallesRow}>
                {producto.variantes.talles.map((t) => {
                  const sel = talleSeleccionado === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setTalle(t); setErrorVariante('') }}
                      style={sel ? s.talleActivo : s.talle}
                      aria-pressed={sel}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Cantidad */}
          <div style={s.varGroup}>
            <p style={s.varLabel}>Cantidad</p>
            <div style={s.cantRow}>
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                style={s.cantBtn}
                aria-label="Disminuir cantidad"
              >
                <Minus size={13} weight="bold" />
              </button>
              <span style={s.cantNum}>{cantidad}</span>
              <button
                type="button"
                onClick={() => setCantidad((c) => c + 1)}
                style={s.cantBtn}
                aria-label="Aumentar cantidad"
              >
                <Plus size={13} weight="bold" />
              </button>
            </div>
          </div>

          {/* ── Error variante */}
          {errorVariante && (
            <div style={s.errorVar} role="alert">
              <WarningCircle size={15} weight="fill" style={{ marginRight: 7, flexShrink: 0 }} />
              {errorVariante}
            </div>
          )}

          {/* ── CTAs */}
          <div style={s.ctaGroup}>
            <button
              type="button"
              onClick={handleAgregar}
              style={agregado ? s.btnAgregado : s.btnAgregar}
            >
              {agregado ? (
                <>
                  <Check size={15} weight="bold" style={{ marginRight: 8 }} />
                  Agregado al carrito
                </>
              ) : (
                <>
                  <ShoppingBag size={15} weight="light" style={{ marginRight: 8 }} />
                  Agregar al carrito
                </>
              )}
            </button>

            <Link to="/carrito" style={s.btnVerCarrito}>
              Ver carrito
            </Link>
          </div>

          {/* ── Hint */}
          <p style={s.hint}>
            Finalizás el pedido por WhatsApp desde el carrito. Sin pagos online.
          </p>

        </section>
      </div>
    </main>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STYLES                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */
const s = {
  root: { minHeight: '70vh' },

  /* ── Loading */
  loadRoot: { minHeight: '70vh', maxWidth: 1100, margin: '0 auto', padding: '3rem 2.5rem' },
  loadWrap: { display: 'flex', gap: '4rem', flexWrap: 'wrap', alignItems: 'flex-start' },
  skelImg: { flex: '1 1 420px', aspectRatio: '3/4', borderRadius: 2, maxWidth: 480 },
  skelInfo: { flex: '1 1 320px', display: 'flex', flexDirection: 'column' },
  skelLine: { borderRadius: 2, height: 14 },

  /* ── Error */
  errorRoot: {
    minHeight: '65vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
  },
  errorBox: {
    textAlign: 'center',
    maxWidth: 480,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  errorEyebrow: {
    fontSize: '0.68rem',
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    fontWeight: 400,
  },
  errorTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.4rem',
    fontWeight: 300,
    fontStyle: 'italic',
    color: 'var(--ink)',
    margin: 0,
  },
  errorSub: { color: 'var(--ink-3)', fontSize: '0.95rem', fontWeight: 300, lineHeight: 1.75, margin: 0 },
  errorActions: { display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' },

  /* ── Breadcrumb */
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
    padding: '1.5rem 2.5rem 0',
    maxWidth: 1100,
    margin: '0 auto',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    color: 'var(--ink-3)',
    fontFamily: 'var(--font-body)',
    padding: 0,
  },
  breadSep: { color: 'var(--border-strong)', fontSize: '0.7rem' },
  breadLink: {
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    color: 'var(--ink-3)',
    textDecoration: 'none',
  },
  breadCurrent: {
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    color: 'var(--ink)',
    fontWeight: 400,
  },

  /* ── Layout */
  layout: {
    display: 'flex',
    gap: '5rem',
    maxWidth: 1100,
    margin: '0 auto',
    padding: '2rem 2.5rem 6rem',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },

  /* ── Galería */
  galeria: { flex: '1 1 420px', minWidth: 280 },
  mainImgWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '3/4',
    overflow: 'hidden',
    borderRadius: 2,
    background: 'var(--bg-2)',
    marginBottom: '0.75rem',
  },
  mainImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  mainImgFallback: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, var(--bg-2), var(--accent-light))',
  },
  corner: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderTop: '1px solid var(--accent)',
    borderLeft: '1px solid var(--accent)',
    opacity: 0.45,
    pointerEvents: 'none',
  },
  thumbs: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  thumb: {
    width: 64,
    height: 80,
    border: '1px solid var(--border)',
    padding: 0,
    cursor: 'pointer',
    borderRadius: 2,
    overflow: 'hidden',
    background: 'var(--bg-2)',
    transition: 'opacity 0.2s ease',
  },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },

  /* ── Info */
  info: { flex: '1 1 340px', minWidth: 280, paddingTop: '0.5rem' },

  infoKickerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    marginBottom: '1rem',
  },
  infoKickerLine: { width: 24, height: 1, background: 'var(--accent)', flexShrink: 0 },
  infoKicker: {
    fontSize: '0.68rem',
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    fontWeight: 400,
  },

  nombre: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
    fontWeight: 300,
    lineHeight: 1.05,
    letterSpacing: '-0.015em',
    color: 'var(--ink)',
    margin: '0 0 0.85rem',
  },

  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  precio: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    fontWeight: 300,
    color: 'var(--ink)',
    letterSpacing: '-0.01em',
  },
  quickCartLink: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.72rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--accent-dark)',
    fontWeight: 400,
  },

  descripcion: {
    fontSize: '0.92rem',
    lineHeight: 1.85,
    color: 'var(--ink-2)',
    fontWeight: 300,
    margin: 0,
  },

  divider: { borderTop: '1px solid var(--border)', margin: '1.5rem 0' },

  /* ── Variantes */
  varGroup: { marginBottom: '1.35rem' },
  varLabel: {
    fontSize: '0.68rem',
    fontWeight: 400,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    margin: '0 0 0.75rem',
  },
  varSelected: {
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: 300,
    color: 'var(--ink-2)',
  },

  coloresRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  colorBtn: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.10)',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'outline 0.18s ease',
  },

  tallesRow: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' },
  talle: {
    padding: '0.55rem 1rem',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    letterSpacing: '0.06em',
    borderRadius: 2,
    fontFamily: 'var(--font-body)',
    color: 'var(--ink-2)',
    fontWeight: 300,
    transition: 'all 0.18s ease',
  },
  talleActivo: {
    padding: '0.55rem 1rem',
    border: '1px solid var(--ink)',
    background: 'var(--ink)',
    color: '#f7f4ef',
    cursor: 'pointer',
    fontSize: '0.8rem',
    letterSpacing: '0.06em',
    borderRadius: 2,
    fontFamily: 'var(--font-body)',
    fontWeight: 400,
    transition: 'all 0.18s ease',
  },

  cantRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0,
    border: '1px solid var(--border)',
    borderRadius: 2,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.6)',
  },
  cantBtn: {
    background: 'none',
    border: 'none',
    padding: '0.5rem 0.85rem',
    color: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  cantNum: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: '0.88rem',
    fontWeight: 400,
    color: 'var(--ink)',
    padding: '0 0.25rem',
    borderLeft: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
  },

  errorVar: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.82rem',
    color: '#8e2a22',
    background: 'rgba(192,57,43,0.07)',
    border: '1px solid rgba(192,57,43,0.2)',
    padding: '0.7rem 0.85rem',
    borderRadius: 2,
    marginBottom: '1rem',
    lineHeight: 1.5,
  },

  /* ── CTAs */
  ctaGroup: { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' },

  btnAgregar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '1rem',
    background: 'rgba(26,20,16,0.94)',
    color: '#f7f4ef',
    border: '1px solid rgba(26,20,16,0.6)',
    borderRadius: 2,
    fontSize: '0.78rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    fontWeight: 400,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  btnAgregado: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '1rem',
    background: '#2d6a4f',
    color: '#f7f4ef',
    border: '1px solid #2d6a4f',
    borderRadius: 2,
    fontSize: '0.78rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    fontWeight: 400,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
  },
  btnVerCarrito: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '0.95rem',
    background: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--ink)',
    borderRadius: 2,
    fontSize: '0.78rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-body)',
    fontWeight: 300,
    textDecoration: 'none',
    textAlign: 'center',
    boxSizing: 'border-box',
  },

  hint: {
    fontSize: '0.78rem',
    color: 'var(--ink-3)',
    lineHeight: 1.7,
    fontWeight: 300,
    margin: 0,
  },

  /* ── Shared buttons */
  btnDark: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.82rem 1.25rem',
    background: 'rgba(26,20,16,0.92)',
    color: '#f7f4ef',
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

/* ── Responsive mínimo */
if (typeof window !== 'undefined' && window.matchMedia) {
  if (window.matchMedia('(max-width: 560px)').matches) {
    s.breadcrumb.padding = '1.25rem 1.25rem 0'
    s.layout.padding = '1.5rem 1.25rem 5rem'
    s.layout.gap = '2.5rem'
  }
}

export default Producto