import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Trash,
  Plus,
  Minus,
  WhatsappLogo,
  ArrowLeft,
  ShoppingBag,
  WarningCircle,
  ArrowRight,
} from '@phosphor-icons/react'
import { useCarrito } from '../context/CarritoContext'

const INITIAL_FORM = {
  nombre: '',
  apellido: '',
  codigoPostal: '',
  telefono: '',
  aclaraciones: '',
}

const Carrito = () => {
  const navigate = useNavigate()
  const { items, total, actualizarCantidad, quitar, vaciar, generarMensajeWhatsApp } = useCarrito()

  const [confirmVaciar, setConfirmVaciar] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [errorForm, setErrorForm] = useState('')
  const [enviando, setEnviando] = useState(false)

  const itemCountLabel = useMemo(() => {
    const n = items.length
    return `${n} ${n === 1 ? 'producto' : 'productos'}`
  }, [items.length])

  const validar = () => {
    if (!form.nombre.trim()) return 'Ingresá tu nombre.'
    if (!form.apellido.trim()) return 'Ingresá tu apellido.'
    if (!form.codigoPostal.trim()) return 'Ingresá tu código postal.'
    if (!form.telefono.trim()) return 'Ingresá tu teléfono.'
    return ''
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errorForm) setErrorForm('')
  }

  const onEnviarPedido = async (e) => {
    e.preventDefault()
    if (items.length === 0) return
    const err = validar()
    if (err) { setErrorForm(err); return }
    setEnviando(true)
    try {
      const url = generarMensajeWhatsApp({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        codigoPostal: form.codigoPostal.trim(),
        telefono: form.telefono.trim(),
        aclaraciones: form.aclaraciones.trim(),
      })
      window.open(url, '_blank', 'noopener,noreferrer')
    } finally {
      setEnviando(false)
    }
  }

  /* ════════════════════════════════════════
      EMPTY STATE
  ════════════════════════════════════════ */
  if (items.length === 0) {
    return (
      <div style={s.emptyRoot}>
        <div style={s.emptyInner} className="anim-fade-up">
          <ShoppingBag size={44} weight="thin" style={{ color: 'var(--accent)', marginBottom: '1.5rem' }} />
          <span style={s.emptyEyebrow}>Carrito</span>
          <h2 style={s.emptyTitle}>Tu carrito está vacío</h2>
          <p style={s.emptySub}>
            Explorá la colección y encontrá tu próxima prenda favorita.
          </p>
          <Link to="/catalogo" style={s.btnDark}>
            <ArrowLeft size={13} weight="bold" style={{ marginRight: 8 }} />
            Explorar colección
          </Link>
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════
      CARRITO CON ITEMS
  ════════════════════════════════════════ */
  return (
    <div style={s.root}>

      {/* ── Page header */}
      <div style={s.pageHeader} className="anim-fade-up">
        <div style={s.pageHeaderLeft}>
          <div style={s.pageHeaderKickerRow}>
            <div style={s.pageHeaderKickerLine} />
            <span style={s.pageHeaderKicker}>Carrito</span>
          </div>
          <h1 style={s.pageTitle}>Tu selección</h1>
        </div>
        <span style={s.pageCount}>{itemCountLabel}</span>
      </div>

      {/* ── Divider */}
      <div style={s.headerRule} />

      {/* ── Layout */}
      <div style={s.layout}>

        {/* ════════════════════════════
            COLUMNA ITEMS
        ════════════════════════════ */}
        <div style={s.itemsCol}>

          {items.map((item, i) => (
            <div
              key={item.key}
              className="anim-fade-up"
              style={{ ...s.item, animationDelay: `${i * 0.04}s` }}
            >
              {/* Imagen */}
              <div style={s.itemImgWrap}>
                {item.imagen ? (
                  <img src={item.imagen} alt={item.nombre} style={s.itemImg} loading="lazy" />
                ) : (
                  <div style={s.itemImgFallback} />
                )}
              </div>

              {/* Info */}
              <div style={s.itemInfo}>
                <p style={s.itemNombre}>{item.nombre}</p>
                <div style={s.itemTags}>
                  {item.talle && item.talle !== 'Único' && (
                    <span style={s.tag}>Talle {item.talle}</span>
                  )}
                  {item.color && item.color !== 'Único' && (
                    <span style={s.tag}>{item.color}</span>
                  )}
                </div>
                <p style={s.itemPrecioUnit}>
                  ${(item.precio || 0).toLocaleString('es-AR')} c/u
                </p>
              </div>

              {/* Controles derecha */}
              <div style={s.itemRight}>
                {/* Cantidad */}
                <div style={s.cantRow}>
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.key, Math.max(1, item.cantidad - 1))}
                    style={s.cantBtn}
                    aria-label="Disminuir"
                  >
                    <Minus size={11} weight="bold" />
                  </button>
                  <span style={s.cantNum}>{item.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.key, item.cantidad + 1)}
                    style={s.cantBtn}
                    aria-label="Aumentar"
                  >
                    <Plus size={11} weight="bold" />
                  </button>
                </div>

                {/* Subtotal */}
                <p style={s.itemSubtotal}>
                  ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                </p>

                {/* Quitar */}
                <button
                  type="button"
                  onClick={() => quitar(item.key)}
                  style={s.quitarBtn}
                  aria-label="Eliminar"
                >
                  <Trash size={14} weight="light" />
                </button>
              </div>
            </div>
          ))}

          {/* ── Bottom bar items */}
          <div style={s.itemsFooter}>
            {!confirmVaciar ? (
              <button
                type="button"
                onClick={() => setConfirmVaciar(true)}
                style={s.vaciarBtn}
              >
                Vaciar carrito
              </button>
            ) : (
              <div style={s.confirmRow}>
                <span style={s.confirmTxt}>¿Vaciar el carrito?</span>
                <button
                  type="button"
                  onClick={() => { vaciar(); setConfirmVaciar(false) }}
                  style={s.confirmSi}
                >
                  Sí, vaciar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmVaciar(false)}
                  style={s.confirmNo}
                >
                  Cancelar
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/catalogo')}
              style={s.seguirBtn}
            >
              <ArrowLeft size={12} weight="bold" style={{ marginRight: 6 }} />
              Seguir comprando
            </button>
          </div>
        </div>

        {/* ════════════════════════════
            COLUMNA RESUMEN + FORM
        ════════════════════════════ */}
        <div style={s.resumenCol}>
          <div style={s.resumenCard}>

            {/* Eyebrow */}
            <div style={s.resumenKickerRow}>
              <div style={s.resumenKickerLine} />
              <span style={s.resumenKicker}>Finalizar pedido</span>
            </div>

            {/* Líneas del resumen */}
            <div style={s.resumenLineas}>
              {items.map((item) => (
                <div key={item.key} style={s.resumenLinea}>
                  <span style={s.resumenNombre}>
                    {item.nombre}
                    {item.talle && item.talle !== 'Único' ? ` · ${item.talle}` : ''}
                    {item.color && item.color !== 'Único' ? ` · ${item.color}` : ''}
                    {' '}×{item.cantidad}
                  </span>
                  <span style={s.resumenPrecio}>
                    ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>

            <div style={s.resumenDivider} />

            {/* Total */}
            <div style={s.totalRow}>
              <span style={s.totalLabel}>Total</span>
              <span style={s.totalPrecio}>${total.toLocaleString('es-AR')}</span>
            </div>

            <div style={s.resumenDivider} />

            {/* Nota informativa */}
            <p style={s.notaTxt}>
              Completá tus datos y te abrimos WhatsApp con el pedido listo para enviar.
              El pago y envío se coordinan con el vendedor.
            </p>

            {/* ── Formulario */}
            <form onSubmit={onEnviarPedido} style={s.form} noValidate>

              {errorForm && (
                <div style={s.formError} role="alert">
                  <WarningCircle size={14} weight="fill" style={{ marginRight: 7, flexShrink: 0 }} />
                  {errorForm}
                </div>
              )}

              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label} htmlFor="nombre">Nombre *</label>
                  <input
                    id="nombre" name="nombre" value={form.nombre} onChange={onChange}
                    style={s.input} placeholder="Juan" autoComplete="given-name"
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label} htmlFor="apellido">Apellido *</label>
                  <input
                    id="apellido" name="apellido" value={form.apellido} onChange={onChange}
                    style={s.input} placeholder="Pérez" autoComplete="family-name"
                  />
                </div>
              </div>

              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label} htmlFor="codigoPostal">Código postal *</label>
                  <input
                    id="codigoPostal" name="codigoPostal" value={form.codigoPostal}
                    onChange={onChange} style={s.input} placeholder="1425" inputMode="numeric"
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label} htmlFor="telefono">Teléfono *</label>
                  <input
                    id="telefono" name="telefono" value={form.telefono} onChange={onChange}
                    style={s.input} placeholder="11 5555-5555" inputMode="tel" autoComplete="tel"
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label} htmlFor="aclaraciones">Aclaraciones (opcional)</label>
                <textarea
                  id="aclaraciones" name="aclaraciones" value={form.aclaraciones}
                  onChange={onChange} style={s.textarea} rows={3}
                  placeholder="Ej: entregar por la tarde, timbre no funciona…"
                />
              </div>

              {/* CTA WhatsApp */}
              <button
                type="submit"
                style={enviando ? { ...s.btnWa, ...s.btnWaDisabled } : s.btnWa}
                disabled={enviando}
              >
                <WhatsappLogo size={17} weight="fill" style={{ marginRight: 9 }} />
                {enviando ? 'Abriendo WhatsApp…' : 'Enviar pedido por WhatsApp'}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STYLES                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */
const s = {
  /* ── Empty */
  emptyRoot: {
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
  },
  emptyInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.6rem',
    maxWidth: 420,
  },
  emptyEyebrow: {
    fontSize: '0.68rem',
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
    fontSize: '0.95rem',
    color: 'var(--ink-3)',
    fontWeight: 300,
    lineHeight: 1.8,
    margin: '0.25rem 0 0.75rem',
    maxWidth: '36ch',
  },

  /* ── Root */
  root: { minHeight: '70vh' },

  /* ── Page header */
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '1rem',
    padding: '2.5rem 2.5rem 0',
    maxWidth: 1100,
    margin: '0 auto',
    flexWrap: 'wrap',
  },
  pageHeaderLeft: {},
  pageHeaderKickerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    marginBottom: '0.75rem',
  },
  pageHeaderKickerLine: {
    width: 24,
    height: 1,
    background: 'var(--accent)',
    flexShrink: 0,
  },
  pageHeaderKicker: {
    fontSize: '0.68rem',
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    fontWeight: 400,
  },
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 300,
    letterSpacing: '-0.015em',
    color: 'var(--ink)',
    margin: 0,
    lineHeight: 1,
  },
  pageCount: {
    fontSize: '0.7rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 400,
    paddingBottom: '0.4rem',
  },

  headerRule: {
    height: 1,
    background: 'var(--border)',
    maxWidth: 1100,
    margin: '1.5rem auto 0',
  },

  /* ── Layout */
  layout: {
    display: 'flex',
    gap: '3rem',
    maxWidth: 1100,
    margin: '0 auto',
    padding: '2.5rem 2.5rem 6rem',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },

  /* ── Items column */
  itemsCol: { flex: '1 1 520px', minWidth: 280 },

  item: {
    display: 'flex',
    gap: '1.25rem',
    padding: '1.5rem 0',
    borderBottom: '1px solid var(--border)',
    alignItems: 'center',
  },

  itemImgWrap: {
    width: 80,
    height: 100,
    flexShrink: 0,
    borderRadius: 2,
    overflow: 'hidden',
    background: 'var(--bg-2)',
  },
  itemImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  itemImgFallback: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, var(--bg-2), var(--accent-light))',
  },

  itemInfo: { flex: 1, minWidth: 0 },
  itemNombre: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 400,
    color: 'var(--ink)',
    margin: '0 0 0.4rem',
    lineHeight: 1.2,
  },
  itemTags: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.4rem' },
  tag: {
    fontSize: '0.68rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    background: 'rgba(184,149,106,0.1)',
    color: 'var(--accent-dark)',
    padding: '0.22rem 0.6rem',
    borderRadius: 2,
    fontWeight: 400,
  },
  itemPrecioUnit: {
    margin: 0,
    fontSize: '0.78rem',
    color: 'var(--ink-3)',
    fontWeight: 300,
  },

  itemRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.55rem',
    flexShrink: 0,
  },

  cantRow: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid var(--border)',
    borderRadius: 2,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.55)',
  },
  cantBtn: {
    background: 'none',
    border: 'none',
    padding: '0.4rem 0.7rem',
    color: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  cantNum: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: '0.82rem',
    fontWeight: 400,
    color: 'var(--ink)',
    padding: '0 0.2rem',
    borderLeft: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
  },

  itemSubtotal: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 400,
    color: 'var(--ink)',
  },
  quitarBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--ink-3)',
    padding: '0.3rem',
    borderRadius: 2,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },

  itemsFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 0',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  vaciarBtn: {
    background: 'none',
    border: 'none',
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    padding: 0,
  },
  confirmRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' },
  confirmTxt: { fontSize: '0.8rem', color: 'var(--ink-2)', fontWeight: 300 },
  confirmSi: {
    background: 'rgba(181,49,44,0.9)',
    color: '#fff',
    border: 'none',
    padding: '0.38rem 0.85rem',
    borderRadius: 2,
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
  },
  confirmNo: {
    background: 'var(--bg-2)',
    color: 'var(--ink)',
    border: '1px solid var(--border)',
    padding: '0.38rem 0.85rem',
    borderRadius: 2,
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
  },
  seguirBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    padding: 0,
  },

  /* ── Resumen column */
  resumenCol: { flex: '0 0 360px', minWidth: 280 },
  resumenCard: {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border)',
    borderRadius: 2,
    padding: '1.75rem',
    boxShadow: 'var(--shadow-md)',
    position: 'sticky',
    top: '80px',
  },

  resumenKickerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    marginBottom: '1.25rem',
  },
  resumenKickerLine: { width: 20, height: 1, background: 'var(--accent)', flexShrink: 0 },
  resumenKicker: {
    fontSize: '0.68rem',
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    fontWeight: 400,
  },

  resumenLineas: { display: 'flex', flexDirection: 'column', gap: '0.55rem' },
  resumenLinea: { display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'baseline' },
  resumenNombre: {
    fontSize: '0.78rem',
    color: 'var(--ink-3)',
    lineHeight: 1.5,
    flex: 1,
    fontWeight: 300,
  },
  resumenPrecio: { fontSize: '0.8rem', color: 'var(--ink)', flexShrink: 0, fontWeight: 400 },

  resumenDivider: { height: 1, background: 'var(--border)', margin: '1rem 0' },

  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: '0.68rem',
    fontWeight: 400,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
  },
  totalPrecio: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.85rem',
    fontWeight: 300,
    color: 'var(--ink)',
    letterSpacing: '-0.01em',
  },

  notaTxt: {
    fontSize: '0.76rem',
    color: 'var(--ink-3)',
    lineHeight: 1.75,
    fontWeight: 300,
    margin: '0 0 1.25rem',
  },

  /* ── Form */
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  formError: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(181,49,44,0.07)',
    border: '1px solid rgba(181,49,44,0.2)',
    color: '#8e2a22',
    padding: '0.65rem 0.8rem',
    borderRadius: 2,
    fontSize: '0.8rem',
    lineHeight: 1.5,
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  label: {
    fontSize: '0.62rem',
    fontWeight: 400,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
  },
  input: {
    width: '100%',
    padding: '0.7rem 0.85rem',
    border: '1px solid var(--border)',
    borderRadius: 2,
    background: 'rgba(255,255,255,0.7)',
    color: 'var(--ink)',
    fontSize: '0.88rem',
    fontWeight: 300,
    outline: 'none',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '0.7rem 0.85rem',
    border: '1px solid var(--border)',
    borderRadius: 2,
    background: 'rgba(255,255,255,0.7)',
    color: 'var(--ink)',
    fontSize: '0.88rem',
    fontWeight: 300,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
  },

  btnWa: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '0.95rem',
    background: 'linear-gradient(135deg, #25D366, #128C7E)',
    color: '#fff',
    border: 'none',
    borderRadius: 2,
    fontSize: '0.78rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 400,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(37,211,102,0.22)',
    marginTop: '0.25rem',
  },
  btnWaDisabled: { opacity: 0.7, cursor: 'not-allowed' },

  /* ── Shared */
  btnDark: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.85rem 1.35rem',
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
}

/* ── Responsive */
if (typeof window !== 'undefined' && window.matchMedia) {
  if (window.matchMedia('(max-width: 560px)').matches) {
    s.pageHeader.padding = '2rem 1.25rem 0'
    s.layout.padding = '2rem 1.25rem 5rem'
    s.layout.gap = '2rem'
  }
}

export default Carrito