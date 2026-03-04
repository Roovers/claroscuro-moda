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

  // Checkout form
  const [form, setForm] = useState(INITIAL_FORM)
  const [errorForm, setErrorForm] = useState('')
  const [enviando, setEnviando] = useState(false)

  const itemCountLabel = useMemo(() => {
    const cant = items.length
    return `${cant} ${cant === 1 ? 'producto' : 'productos'}`
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
    if (err) {
      setErrorForm(err)
      return
    }

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

  if (items.length === 0) {
    return (
      <div style={s.root}>
        <div style={s.empty} className="anim-fade-up">
          <ShoppingBag size={52} weight="thin" style={{ color: 'var(--accent)', marginBottom: '1.5rem' }} />
          <h2 style={s.emptyTitle}>Tu carrito está vacío</h2>
          <p style={s.emptySub}>Explorá la colección y encontrá tu próxima prenda favorita.</p>
          <Link to="/catalogo" style={s.btnExplorar}>
            <ArrowLeft size={14} weight="bold" style={{ marginRight: 8 }} />
            Explorar colección
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={s.root}>
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Carrito</h1>
        <p style={s.pageCount}>{itemCountLabel}</p>
      </div>

      <div style={s.layout}>
        {/* Detalle del pedido */}
        <div style={s.itemsCol} aria-label="Detalle del pedido">
          {items.map((item) => (
            <div key={item.key} style={s.item} className="anim-fade-up">
              <div style={s.itemImg}>
                {item.imagen ? (
                  <img src={item.imagen} alt={item.nombre} style={s.itemImgEl} loading="lazy" />
                ) : (
                  <div style={{ ...s.itemImgEl, background: 'var(--bg-2)' }} />
                )}
              </div>

              <div style={s.itemInfo}>
                <p style={s.itemNombre}>{item.nombre}</p>
                <div style={s.itemTags}>
                  {item.talle && item.talle !== 'Único' && <span style={s.tag}>👕 {item.talle}</span>}
                  {item.color && item.color !== 'Único' && <span style={s.tag}>🎨 {item.color}</span>}
                </div>
                <p style={s.itemUnit}>💲 ${item.precio?.toLocaleString('es-AR')} c/u</p>
              </div>

              <div style={s.itemRight}>
                <div style={s.cantRow} aria-label="Cantidad">
                  <button
                    onClick={() => actualizarCantidad(item.key, Math.max(1, item.cantidad - 1))}
                    style={s.cantBtn}
                    aria-label="Disminuir cantidad"
                    type="button"
                  >
                    <Minus size={12} weight="bold" />
                  </button>
                  <span style={s.cantNum} aria-label={`Cantidad ${item.cantidad}`}>
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => actualizarCantidad(item.key, item.cantidad + 1)}
                    style={s.cantBtn}
                    aria-label="Aumentar cantidad"
                    type="button"
                  >
                    <Plus size={12} weight="bold" />
                  </button>
                </div>

                <p style={s.itemSubtotal} aria-label="Subtotal del producto">
                  💰 ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                </p>

                <button onClick={() => quitar(item.key)} style={s.quitarBtn} aria-label="Eliminar producto" type="button">
                  <Trash size={14} weight="light" />
                </button>
              </div>
            </div>
          ))}

          <div style={s.bottomBar}>
            {!confirmVaciar ? (
              <button onClick={() => setConfirmVaciar(true)} style={s.vaciarBtn} type="button">
                Vaciar carrito
              </button>
            ) : (
              <div style={s.confirmRow}>
                <span style={s.confirmTxt}>¿Seguro que querés vaciar el carrito?</span>
                <button
                  onClick={() => {
                    vaciar()
                    setConfirmVaciar(false)
                  }}
                  style={s.confirmSi}
                  type="button"
                >
                  Sí, vaciar
                </button>
                <button onClick={() => setConfirmVaciar(false)} style={s.confirmNo} type="button">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Checkout (datos + resumen) */}
        <div style={s.resumenCol}>
          <div style={s.resumenGlass}>
            <h2 style={s.resumenTitle}>Finalizar pedido</h2>

            {/* Resumen compacto */}
            <div style={s.resumenLineas} aria-label="Resumen del pedido">
              {items.map((item) => (
                <div key={item.key} style={s.resumenLinea}>
                  <span style={s.resumenNombre}>
                    {item.nombre}
                    {item.talle && item.talle !== 'Único' ? ` · ${item.talle}` : ''}
                    {item.color && item.color !== 'Único' ? ` · ${item.color}` : ''}
                    {' '}×{item.cantidad}
                  </span>
                  <span style={s.resumenPrecio}>${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>

            <div style={s.divider} />

            <div style={s.totalRow}>
              <span style={s.totalLabel}>Total</span>
              <span style={s.totalPrecio}>${total.toLocaleString('es-AR')}</span>
            </div>

            <div style={s.nota}>
              <p style={s.notaTxt}>
                Completá tus datos y te abrimos WhatsApp con el pedido listo para enviar. El pago y el envío se coordinan con el vendedor.
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={onEnviarPedido} style={s.form} aria-label="Datos del cliente">
              {errorForm && (
                <div style={s.formError} role="alert">
                  <WarningCircle size={16} weight="fill" style={{ marginRight: 8 }} />
                  {errorForm}
                </div>
              )}

              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label} htmlFor="nombre">
                    Nombre *
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    value={form.nombre}
                    onChange={onChange}
                    style={s.input}
                    autoComplete="given-name"
                    placeholder="Juan"
                    required
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label} htmlFor="apellido">
                    Apellido *
                  </label>
                  <input
                    id="apellido"
                    name="apellido"
                    value={form.apellido}
                    onChange={onChange}
                    style={s.input}
                    autoComplete="family-name"
                    placeholder="Pérez"
                    required
                  />
                </div>
              </div>

              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label} htmlFor="codigoPostal">
                    Código postal *
                  </label>
                  <input
                    id="codigoPostal"
                    name="codigoPostal"
                    value={form.codigoPostal}
                    onChange={onChange}
                    style={s.input}
                    inputMode="numeric"
                    placeholder="1425"
                    required
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label} htmlFor="telefono">
                    Teléfono *
                  </label>
                  <input
                    id="telefono"
                    name="telefono"
                    value={form.telefono}
                    onChange={onChange}
                    style={s.input}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="11 5555-5555"
                    required
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label} htmlFor="aclaraciones">
                  Aclaraciones (opcional)
                </label>
                <textarea
                  id="aclaraciones"
                  name="aclaraciones"
                  value={form.aclaraciones}
                  onChange={onChange}
                  style={s.textarea}
                  rows={3}
                  placeholder="Ej: Entregar por la tarde / Timbre no funciona / etc."
                />
              </div>

              <button type="submit" style={{ ...s.btnWa, ...(enviando ? s.btnWaDisabled : {}) }} disabled={enviando}>
                <WhatsappLogo size={18} weight="fill" style={{ marginRight: 10 }} />
                {enviando ? 'Abriendo WhatsApp...' : 'Enviar pedido'}
              </button>

              <button type="button" onClick={() => navigate('/catalogo')} style={s.btnSeguir}>
                <ArrowLeft size={13} weight="bold" style={{ marginRight: 6 }} />
                Seguir comprando
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  root: { minHeight: '60vh' },

  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '65vh',
    padding: '2rem',
    textAlign: 'center',
  },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, marginBottom: '0.75rem' },
  emptySub: { fontSize: '0.88rem', color: 'var(--ink-3)', marginBottom: '2rem', maxWidth: '320px', lineHeight: 1.6 },
  btnExplorar: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.85rem 2rem',
    background: 'var(--ink)',
    color: 'var(--bg)',
    borderRadius: '100px',
    fontSize: '0.82rem',
    letterSpacing: '0.08em',
    fontWeight: 500,
  },

  pageHeader: { padding: '2.5rem 2.5rem 1rem', maxWidth: '1100px', margin: '0 auto' },
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, marginBottom: '0.25rem' },
  pageCount: { fontSize: '0.8rem', color: 'var(--ink-3)' },

  layout: {
    display: 'flex',
    gap: '2rem',
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '1.5rem 2.5rem 5rem',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },

  itemsCol: { flex: '1 1 560px', minWidth: '280px' },
  item: { display: 'flex', gap: '1.25rem', padding: '1.5rem 0', borderBottom: '1px solid var(--border)', alignItems: 'center' },
  itemImg: { width: '88px', height: '108px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-2)' },
  itemImgEl: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  itemInfo: { flex: 1, minWidth: 0 },
  itemNombre: { fontSize: '0.92rem', fontWeight: 400, marginBottom: '0.5rem', color: 'var(--ink)' },
  itemTags: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' },
  tag: {
    fontSize: '0.72rem',
    background: 'rgba(184,149,106,0.12)',
    color: 'var(--accent-dark)',
    padding: '0.2rem 0.55rem',
    borderRadius: '100px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  itemUnit: { fontSize: '0.78rem', color: 'var(--ink-3)' },
  itemRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' },
  cantRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    border: '1px solid var(--border)',
    borderRadius: '100px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  cantBtn: { background: 'none', border: 'none', padding: '0.4rem 0.75rem', color: 'var(--ink)', display: 'flex', alignItems: 'center' },
  cantNum: { minWidth: '24px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500 },
  itemSubtotal: { fontSize: '0.92rem', fontWeight: 500, color: 'var(--ink)' },
  quitarBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--ink-3)',
    padding: '0.3rem',
    borderRadius: '6px',
    transition: 'color var(--transition)',
  },

  bottomBar: { padding: '1.25rem 0', display: 'flex' },
  vaciarBtn: { background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--ink-3)', textDecoration: 'underline', letterSpacing: '0.03em' },
  confirmRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  confirmTxt: { fontSize: '0.82rem', color: 'var(--ink-2)' },
  confirmSi: { background: '#c0392b', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.78rem', fontFamily: 'var(--font-body)' },
  confirmNo: { background: 'var(--bg-2)', color: 'var(--ink)', border: 'none', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.78rem', fontFamily: 'var(--font-body)' },

  resumenCol: { flex: '0 0 360px', minWidth: '280px' },
  resumenGlass: {
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '1.75rem',
    boxShadow: 'var(--shadow-md)',
    position: 'sticky',
    top: '84px',
  },
  resumenTitle: { fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400, marginBottom: '1.1rem' },

  resumenLineas: { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.1rem' },
  resumenLinea: { display: 'flex', justifyContent: 'space-between', gap: '0.75rem' },
  resumenNombre: { fontSize: '0.78rem', color: 'var(--ink-3)', lineHeight: 1.5, flex: 1 },
  resumenPrecio: { fontSize: '0.8rem', color: 'var(--ink)', flexShrink: 0 },

  divider: { borderTop: '1px solid var(--border)', margin: '1.15rem 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.15rem' },
  totalLabel: { fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' },
  totalPrecio: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--ink)' },

  nota: { background: 'rgba(184,149,106,0.08)', border: '1px solid rgba(184,149,106,0.2)', borderRadius: '10px', padding: '0.875rem', marginBottom: '1rem' },
  notaTxt: { fontSize: '0.76rem', color: 'var(--ink-3)', lineHeight: 1.65 },

  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  formError: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(192,57,43,0.10)',
    border: '1px solid rgba(192,57,43,0.25)',
    color: '#8e2a22',
    padding: '0.75rem 0.8rem',
    borderRadius: '10px',
    fontSize: '0.82rem',
    lineHeight: 1.4,
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' },
  input: {
    width: '100%',
    padding: '0.75rem 0.9rem',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: 'var(--ink)',
    fontSize: '0.92rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem 0.9rem',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: 'var(--ink)',
    fontSize: '0.92rem',
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
    borderRadius: '100px',
    fontSize: '0.85rem',
    letterSpacing: '0.06em',
    fontWeight: 500,
    marginTop: '0.25rem',
    fontFamily: 'var(--font-body)',
    boxShadow: '0 4px 20px rgba(37,211,102,0.3)',
  },
  btnWaDisabled: { opacity: 0.75, cursor: 'not-allowed' },

  btnSeguir: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '0.9rem',
    background: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--ink-2)',
    borderRadius: '100px',
    fontSize: '0.82rem',
    letterSpacing: '0.06em',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
  },
}

export default Carrito