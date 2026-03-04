import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Check, Minus, Plus, WarningCircle } from '@phosphor-icons/react'
import { useProducto } from '../hooks/useProductos'
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

  // Helpers
  const tieneTalles = Boolean(producto?.variantes?.talles?.length)
  const tieneColores = Boolean(producto?.variantes?.colores?.length)

  const categoriaLabel = useMemo(() => {
    if (!producto?.categoria) return null
    return CATEGORIAS.find((c) => c.value === producto.categoria)?.label || producto.categoria
  }, [producto?.categoria])

  // Auto-selección inteligente:
  // Si solo hay 1 talle o 1 color, lo seleccionamos para reducir fricción.
  useEffect(() => {
    if (!producto) return
    if (tieneTalles && producto.variantes.talles.length === 1) setTalle(producto.variantes.talles[0])
    if (tieneColores && producto.variantes.colores.length === 1) setColor(producto.variantes.colores[0])
  }, [producto, tieneTalles, tieneColores])

  // Reset si cambia producto
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

    if (tieneTalles && !talleSeleccionado) {
      setErrorVariante('Seleccioná un talle.')
      return
    }
    if (tieneColores && !colorSeleccionado) {
      setErrorVariante('Seleccioná un color.')
      return
    }

    setErrorVariante('')
    agregar(producto, talleSeleccionado || 'Único', colorSeleccionado?.nombre || 'Único', cantidad)

    setAgregado(true)
    window.setTimeout(() => setAgregado(false), 2200)
  }

  // Loading
  if (cargando) {
    return (
      <main style={s.loadRoot} aria-label="Cargando producto">
        <div style={s.loadWrap}>
          <div style={s.skelImg} className="skeleton" />
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={s.skelLine(90)} className="skeleton" />
            <div style={s.skelLine(240)} className="skeleton" />
            <div style={s.skelLine(160)} className="skeleton" />
            <div style={s.skelLine(120)} className="skeleton" />
            <div style={s.skelLine(220)} className="skeleton" />
          </div>
        </div>
      </main>
    )
  }

  // Error / not found
  if (error || !producto) {
    return (
      <main style={s.errorRoot} aria-label="Producto no encontrado">
        <div style={s.errorBox} className="anim-fade-up">
          <p style={s.errorTitle}>Producto no encontrado</p>
          <p style={s.errorSub}>Probá volver al catálogo y elegir otro producto.</p>
          <div style={s.errorActions}>
            <button type="button" onClick={() => navigate(-1)} style={s.btnGhost}>
              <ArrowLeft size={14} weight="bold" style={{ marginRight: 8 }} />
              Volver
            </button>
            <Link to="/catalogo" style={s.btnPrimary}>
              Ir al catálogo
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={s.root}>
      {/* Breadcrumb */}
      <div style={s.breadcrumb} className="anim-fade-up">
        <Link to="/catalogo" style={s.backBtn}>
          <ArrowLeft size={14} weight="bold" style={{ marginRight: 6 }} />
          Volver al catálogo
        </Link>

        {categoriaLabel && (
          <span style={s.breadSub}>
            <span style={s.breadSep}>/</span>
            <Link to={`/catalogo?categoria=${producto.categoria}`} style={s.breadLink}>
              {categoriaLabel}
            </Link>
            <span style={s.breadSep}>/</span>
            <span style={{ color: 'var(--ink-3)' }}>{producto.nombre}</span>
          </span>
        )}
      </div>

      <div style={s.layout}>
        {/* Galería */}
        <section style={s.galeria} aria-label="Galería del producto" className="anim-fade-up">
          <div style={s.mainImgWrap}>
            {producto.imagenes?.[imgActiva] ? (
              <img src={producto.imagenes[imgActiva]} alt={producto.nombre} style={s.mainImg} />
            ) : (
              <div style={s.mainImgEmpty} />
            )}
          </div>

          {producto.imagenes?.length > 1 && (
            <div style={s.thumbs} aria-label="Miniaturas">
              {producto.imagenes.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  onClick={() => setImgActiva(i)}
                  style={{
                    ...s.thumb,
                    outline: i === imgActiva ? '2px solid var(--accent)' : '2px solid transparent',
                    outlineOffset: 3,
                  }}
                  aria-label={`Ver imagen ${i + 1}`}
                >
                  <img src={url} alt="" style={s.thumbImg} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Info */}
        <section style={s.info} aria-label="Detalles del producto" className="anim-fade-up">
          {categoriaLabel && <p style={s.categoria}>{categoriaLabel}</p>}

          <h1 style={s.nombre}>{producto.nombre}</h1>

          <div style={s.priceRow}>
            <p style={s.precio}>${producto.precio?.toLocaleString('es-AR')}</p>
            <Link to="/carrito" style={s.quickCartLink} title="Ir al carrito">
              Ver carrito →
            </Link>
          </div>

          {producto.descripcion && <p style={s.descripcion}>{producto.descripcion}</p>}

          <div style={s.divider} />

          {/* Colores */}
          {tieneColores && (
            <div style={s.varGroup}>
              <p style={s.varLabel}>
                Color
                {colorSeleccionado && <span style={s.varSelected}> — {colorSeleccionado.nombre}</span>}
              </p>

              <div style={s.coloresRow} role="list" aria-label="Seleccionar color">
                {producto.variantes.colores.map((c) => {
                  const selected = colorSeleccionado?.nombre === c.nombre
                  return (
                    <button
                      key={c.nombre}
                      type="button"
                      onClick={() => setColor(c)}
                      title={c.nombre}
                      style={{
                        ...s.colorBtn,
                        background: c.hex,
                        outline: selected ? '3px solid var(--accent-dark)' : '3px solid transparent',
                        outlineOffset: 3,
                      }}
                      aria-pressed={selected}
                      aria-label={`Color ${c.nombre}`}
                    >
                      {selected && (
                        <Check
                          size={10}
                          weight="bold"
                          color="#fff"
                          style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Talles (prendas o calzado: se muestran igual) */}
          {tieneTalles && (
            <div style={s.varGroup}>
              <p style={s.varLabel}>Talle</p>
              <div style={s.tallesRow} role="list" aria-label="Seleccionar talle">
                {producto.variantes.talles.map((t) => {
                  const selected = talleSeleccionado === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTalle(t)}
                      style={selected ? s.talleActivo : s.talle}
                      aria-pressed={selected}
                      aria-label={`Talle ${t}`}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cantidad */}
          <div style={s.varGroup}>
            <p style={s.varLabel}>Cantidad</p>
            <div style={s.cantRow} aria-label="Selector de cantidad">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                style={s.cantBtn}
                aria-label="Disminuir cantidad"
              >
                <Minus size={14} weight="bold" />
              </button>

              <span style={s.cantNum} aria-label={`Cantidad ${cantidad}`}>
                {cantidad}
              </span>

              <button
                type="button"
                onClick={() => setCantidad((c) => c + 1)}
                style={s.cantBtn}
                aria-label="Aumentar cantidad"
              >
                <Plus size={14} weight="bold" />
              </button>
            </div>
          </div>

          {errorVariante && (
            <div style={s.errorVar} role="alert">
              <WarningCircle size={16} weight="fill" style={{ marginRight: 8 }} />
              {errorVariante}
            </div>
          )}

          {/* CTAs */}
          <button
            type="button"
            onClick={handleAgregar}
            style={{ ...s.btnAgregar, ...(agregado ? s.btnAgregadoActive : {}) }}
          >
            {agregado ? (
              <>
                <Check size={16} weight="bold" style={{ marginRight: 8 }} />
                Agregado al carrito
              </>
            ) : (
              <>
                <ShoppingBag size={16} weight="light" style={{ marginRight: 8 }} />
                Agregar al carrito
              </>
            )}
          </button>

          <Link to="/carrito" style={s.btnVerCarrito}>
            Ver carrito
          </Link>

          <p style={s.hint}>
            Finalizás el pedido por WhatsApp desde el carrito. Sin pagos online.
          </p>
        </section>
      </div>
    </main>
  )
}

const s = {
  root: { minHeight: '60vh' },

  loadRoot: { minHeight: '60vh' },
  loadWrap: { display: 'flex', gap: '3rem', padding: '3rem 2.5rem', maxWidth: '1100px', margin: '0 auto', flexWrap: 'wrap' },
  skelImg: { width: 420, maxWidth: '100%', aspectRatio: '3/4', borderRadius: 16, background: 'rgba(0,0,0,0.06)' },
  skelLine: (w) => ({ height: 18, width: w, marginBottom: 16, borderRadius: 6, background: 'rgba(0,0,0,0.06)' }),

  errorRoot: { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem' },
  errorBox: {
    width: '100%',
    maxWidth: 560,
    borderRadius: '16px',
    border: '1px dashed var(--border-strong)',
    background: 'rgba(255,255,255,0.55)',
    padding: '2rem',
    textAlign: 'center',
  },
  errorTitle: { margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 400, color: 'var(--ink)' },
  errorSub: { margin: '0.6rem 0 1.5rem', color: 'var(--ink-3)', lineHeight: 1.7 },
  errorActions: { display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' },
  btnGhost: {
    background: 'transparent',
    border: '1px solid var(--border-strong)',
    padding: '0.85rem 1.1rem',
    borderRadius: '999px',
    cursor: 'pointer',
    color: 'var(--ink)',
    fontSize: '0.86rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.85rem 1.1rem',
    borderRadius: '999px',
    background: 'var(--ink)',
    color: 'var(--bg)',
    fontSize: '0.86rem',
    letterSpacing: '0.06em',
    fontWeight: 600,
  },

  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    padding: '1.25rem 2.5rem 0.5rem',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  backBtn: { display: 'inline-flex', alignItems: 'center', fontSize: '0.78rem', color: 'var(--ink-3)', letterSpacing: '0.04em' },
  breadSub: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--ink-3)' },
  breadSep: { opacity: 0.4 },
  breadLink: { color: 'var(--ink-3)' },

  layout: {
    display: 'flex',
    gap: '4rem',
    flexWrap: 'wrap',
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '1.5rem 2.5rem 5rem',
    alignItems: 'flex-start',
  },

  galeria: { flex: '1 1 440px', minWidth: '280px' },
  mainImgWrap: { aspectRatio: '3/4', overflow: 'hidden', borderRadius: '16px', background: 'var(--bg-2)', marginBottom: '0.75rem', border: '1px solid var(--border)' },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  mainImgEmpty: { width: '100%', height: '100%', background: 'var(--bg-2)' },

  thumbs: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  thumb: { width: '68px', height: '68px', border: '1px solid var(--border)', padding: 0, cursor: 'pointer', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-2)' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },

  info: { flex: '1 1 360px', minWidth: '280px', paddingTop: '0.25rem' },
  categoria: { fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.6rem', fontWeight: 600 },
  nombre: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 400, margin: '0 0 0.75rem', lineHeight: 1.15, color: 'var(--ink)' },

  priceRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.05rem' },
  precio: { margin: 0, fontSize: '1.35rem', color: 'var(--accent-dark)', fontWeight: 300 },
  quickCartLink: { fontSize: '0.88rem', color: 'var(--accent)', fontWeight: 700 },

  descripcion: { fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--ink-2)', fontWeight: 300, marginBottom: '1.25rem' },
  divider: { borderTop: '1px solid var(--border)', margin: '1.25rem 0' },

  varGroup: { marginBottom: '1.25rem' },
  varLabel: { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: '0.75rem' },
  varSelected: { textTransform: 'none', fontWeight: 300, letterSpacing: 0, color: 'var(--ink-2)' },

  coloresRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  colorBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.1)',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'outline var(--transition)',
  },

  tallesRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  talle: {
    padding: '0.5rem 1.1rem',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    cursor: 'pointer',
    fontSize: '0.82rem',
    borderRadius: '10px',
    fontFamily: 'var(--font-body)',
    color: 'var(--ink-2)',
    transition: 'all var(--transition)',
  },
  talleActivo: {
    padding: '0.5rem 1.1rem',
    border: '1px solid var(--ink)',
    background: 'var(--ink)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.82rem',
    borderRadius: '10px',
    fontFamily: 'var(--font-body)',
    transition: 'all var(--transition)',
  },

  cantRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  cantBtn: {
    width: '38px',
    height: '38px',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--ink)',
    borderRadius: '12px',
  },
  cantNum: { minWidth: '44px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' },

  errorVar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.86rem',
    color: '#8e2a22',
    background: 'rgba(192,57,43,0.10)',
    border: '1px solid rgba(192,57,43,0.25)',
    padding: '0.75rem 0.85rem',
    borderRadius: '12px',
    marginBottom: '0.85rem',
  },

  btnAgregar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '1rem',
    background: 'var(--ink)',
    color: '#fff',
    border: 'none',
    borderRadius: '100px',
    fontSize: '0.85rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    marginBottom: '0.75rem',
    fontFamily: 'var(--font-body)',
    boxShadow: 'var(--shadow-md)',
    transition: 'background var(--transition), transform var(--transition)',
  },
  btnAgregadoActive: { background: '#2d6a4f' },

  btnVerCarrito: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '1rem',
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid var(--border-strong)',
    color: 'var(--ink-2)',
    borderRadius: '100px',
    fontSize: '0.85rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
    fontWeight: 600,
  },

  hint: { marginTop: '0.9rem', fontSize: '0.82rem', color: 'var(--ink-3)', lineHeight: 1.6 },
}

// Responsive mínimo
if (typeof window !== 'undefined' && window.matchMedia) {
  if (window.matchMedia('(max-width: 560px)').matches) {
    s.breadcrumb.padding = '1.1rem 1.25rem 0.5rem'
    s.layout.padding = '1.25rem 1.25rem 4rem'
  }
}

export default Producto