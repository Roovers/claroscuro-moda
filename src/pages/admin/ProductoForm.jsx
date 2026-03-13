import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useParams, NavLink } from 'react-router-dom'
import { subirImagenCloudinary } from '../../hooks/useProductos'
import { invalidarCacheAdmin } from '../../hooks/useProductosAdmin'
import { CATEGORIAS, TALLES, TALLES_CALZADO, TALLES_JEANS, COLORES_PRESET } from '../../constants/categorias'
import {
  collection, doc, getDoc, addDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import {
  ArrowLeft,
  UploadSimple,
  X,
  Star,
  CheckCircle,
  XCircle,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  List,
  Package,
  Image as ImageIcon,
  SignOut,
  Warning,
  Spinner,
} from '@phosphor-icons/react'

/* ── Hook mobile ─────────────────────────────────────────────── */
const useIsMobile = (bp = 768) => {
  const [v, setV] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < bp : false
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`)
    const h = (e) => setV(e.matches)
    mq.addEventListener('change', h)
    setV(mq.matches)
    return () => mq.removeEventListener('change', h)
  }, [bp])
  return v
}

/* ── Constantes ─────────────────────────────────────────────── */
const INITIAL_FORM = {
  nombre: '',
  descripcion: '',
  precio: '',
  categoria: '',
  destacado: false,
  activo: true,
  imagenes: [],
  variantes: { talles: [], colores: [] },
}

const DESC_MAX = 400

/* ── Sidebar compartida ─────────────────────────────────────── */
const AdminSidebar = ({ usuario, onLogout, onClose, isMobile }) => (
  <>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
      <div style={s.logo}>claroscuro</div>
      {isMobile && (
        <button onClick={onClose} style={s.closeBtn} type="button">
          <X size={20} weight="bold" />
        </button>
      )}
    </div>
    <nav style={s.nav}>
      <NavLink
        to="/admin" end onClick={onClose}
        style={({ isActive }) => isActive ? { ...s.navItem, ...s.navItemActive } : s.navItem}
      >
        <Package size={18} weight="bold" style={{ marginRight: 10 }} />
        Gestión de Productos
      </NavLink>
      <NavLink
        to="/admin/home" onClick={onClose}
        style={({ isActive }) => isActive ? { ...s.navItem, ...s.navItemActive } : s.navItem}
      >
        <ImageIcon size={18} weight="bold" style={{ marginRight: 10 }} />
        Gestionar Banner Principal
      </NavLink>
    </nav>
    <div style={s.sidebarFooter}>
      <span style={s.emailText}>{usuario?.email}</span>
      <button onClick={onLogout} style={s.logoutBtn}>
        <SignOut size={16} weight="bold" style={{ marginRight: 8 }} />
        Cerrar sesión
      </button>
    </div>
  </>
)

/* ── Campo de formulario con error inline ───────────────────── */
const Field = ({ label, required, error, hint, children }) => (
  <div style={{ marginBottom: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
      <label style={s.label}>
        {label}
        {required && <span style={s.requiredMark}> *</span>}
      </label>
      {hint && <span style={s.hint}>{hint}</span>}
    </div>
    {children}
    {error && (
      <p style={s.fieldError}>
        <Warning size={11} weight="fill" style={{ marginRight: 4, flexShrink: 0 }} />
        {error}
      </p>
    )}
  </div>
)

/* ── ProductoForm ────────────────────────────────────────────── */
const ProductoForm = () => {
  const isMobile = useIsMobile()
  const { id } = useParams()
  const navigate = useNavigate()
  const { logout, usuario } = useAuth()
  const esEdicion = Boolean(id)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formOriginal, setFormOriginal] = useState(INITIAL_FORM) // para detectar cambios
  const [errores, setErrores] = useState({})               // errores por campo
  const [errorGlobal, setErrorGlobal] = useState('')        // error inesperado
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [guardadoOk, setGuardadoOk] = useState(false)
  const [cargandoProducto, setCargandoProducto] = useState(esEdicion)

  // ── Cargar producto (edición) ────────────────────────────────
  useEffect(() => {
    if (!esEdicion) return
    const cargar = async () => {
      try {
        const snap = await getDoc(doc(db, 'productos', id))
        if (snap.exists()) {
          const d = snap.data()
          const datos = {
            nombre:      d.nombre      || '',
            descripcion: d.descripcion || '',
            precio:      d.precio      || '',
            categoria:   d.categoria   || '',
            destacado:   d.destacado   || false,
            activo:      d.activo      ?? true,
            imagenes:    d.imagenes    || [],
            variantes:   d.variantes   || { talles: [], colores: [] },
          }
          setForm(datos)
          setFormOriginal(datos)
        } else {
          setErrorGlobal('Producto no encontrado.')
        }
      } catch {
        setErrorGlobal('Error al cargar el producto.')
      } finally {
        setCargandoProducto(false)
      }
    }
    cargar()
  }, [id, esEdicion])

  // ── Talles según categoría ───────────────────────────────────
  const esCalzado = form.categoria === 'calzado'
  const esJeans   = form.categoria === 'jeans'
  const tallesDisponibles = esCalzado ? TALLES_CALZADO : esJeans ? TALLES_JEANS : TALLES

  // ── Detección de cambios sin guardar ─────────────────────────
  const hayUnsaved = useMemo(() => {
    if (guardadoOk) return false
    return JSON.stringify(form) !== JSON.stringify(formOriginal)
  }, [form, formOriginal, guardadoOk])

  // ── Handlers básicos ─────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target
    setErrores((p) => ({ ...p, [name]: '' }))
    if (name === 'categoria') {
      setForm((p) => ({ ...p, categoria: value, variantes: { ...p.variantes, talles: [] } }))
      return
    }
    setForm((p) => ({ ...p, [name]: value }))
  }

  const toggleTalle = (t) => {
    setErrores((p) => ({ ...p, talles: '' }))
    setForm((p) => {
      const talles = p.variantes.talles.includes(t)
        ? p.variantes.talles.filter((x) => x !== t)
        : [...p.variantes.talles, t]
      return { ...p, variantes: { ...p.variantes, talles } }
    })
  }

  const toggleTodosTalles = () => {
    setForm((p) => {
      const todos = tallesDisponibles
      const yaSeleccionados = todos.every((t) => p.variantes.talles.includes(t))
      return {
        ...p,
        variantes: {
          ...p.variantes,
          talles: yaSeleccionados ? [] : [...todos],
        },
      }
    })
  }

  const toggleColor = (color) => {
    setErrores((p) => ({ ...p, colores: '' }))
    setForm((p) => {
      const existe = p.variantes.colores.find((c) => c.nombre === color.nombre)
      const colores = existe
        ? p.variantes.colores.filter((c) => c.nombre !== color.nombre)
        : [...p.variantes.colores, color]
      return { ...p, variantes: { ...p.variantes, colores } }
    })
  }

  // ── Upload imagen ────────────────────────────────────────────
  const handleImagenUpload = async (e) => {
    const archivos = Array.from(e.target.files)
    if (!archivos.length) return
    setSubiendoImagen(true)
    setUploadProgress(0)
    setErrores((p) => ({ ...p, imagenes: '' }))

    try {
      const urls = []
      for (let i = 0; i < archivos.length; i++) {
        const url = await subirImagenCloudinary(archivos[i])
        urls.push(url)
        setUploadProgress(Math.round(((i + 1) / archivos.length) * 100))
      }
      setForm((p) => ({ ...p, imagenes: [...p.imagenes, ...urls] }))
    } catch {
      setErrores((p) => ({ ...p, imagenes: 'Error al subir imagen. Revisá el formato e intentá de nuevo.' }))
    } finally {
      setSubiendoImagen(false)
      setUploadProgress(0)
      e.target.value = ''
    }
  }

  const eliminarImagen = (url) =>
    setForm((p) => ({ ...p, imagenes: p.imagenes.filter((i) => i !== url) }))

  const moverImagen = (from, to) =>
    setForm((p) => {
      const imgs = [...p.imagenes]
      const [moved] = imgs.splice(from, 1)
      imgs.splice(to, 0, moved)
      return { ...p, imagenes: imgs }
    })

  // ── Validación ───────────────────────────────────────────────
  const validar = useCallback(() => {
    const errs = {}
    if (!form.nombre.trim())              errs.nombre    = 'El nombre es obligatorio.'
    if (!form.precio || Number(form.precio) <= 0)
                                          errs.precio    = 'Ingresá un precio mayor a 0.'
    if (!form.categoria)                  errs.categoria = 'Elegí una categoría.'
    if (form.imagenes.length === 0)       errs.imagenes  = 'Subí al menos 1 imagen.'
    if (form.variantes.talles.length === 0) errs.talles  = 'Seleccioná al menos 1 talle.'
    if (form.variantes.colores.length === 0) errs.colores = 'Seleccioná al menos 1 color.'
    setErrores(errs)
    return Object.keys(errs).length === 0
  }, [form])

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    setErrorGlobal('')
    if (!validar()) {
      // Scroll al primer error visible
      setTimeout(() => {
        document.querySelector('[data-error="true"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }

    setGuardando(true)
    try {
      const datos = {
        nombre:      form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio:      Number(form.precio),
        categoria:   form.categoria,
        destacado:   form.destacado,
        activo:      form.activo,
        imagenes:    form.imagenes,
        variantes:   form.variantes,
      }

      if (esEdicion) {
        await updateDoc(doc(db, 'productos', id), {
          ...datos,
          actualizadoEn: serverTimestamp(),
        })
      } else {
        await addDoc(collection(db, 'productos'), {
          ...datos,
          activo:    true,
          creadoEn:  serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        })
      }

      // Invalidar cache del admin para que el Dashboard recargue
      invalidarCacheAdmin()

      setGuardadoOk(true)
      setTimeout(() => navigate('/admin'), 900)
    } catch (err) {
      console.error('[Firestore] ProductoForm error:', err)
      setErrorGlobal('Error al guardar. Verificá tu conexión e intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const handleLogout = async () => { await logout(); navigate('/admin/login') }

  // ── Loading state ────────────────────────────────────────────
  if (cargandoProducto) return (
    <div style={{ ...s.root, flexDirection: isMobile ? 'column' : 'row' }}>
      {!isMobile && (
        <aside style={s.sidebar}>
          <AdminSidebar usuario={usuario} onLogout={handleLogout} />
        </aside>
      )}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <Spinner size={24} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Cargando producto…</p>
        </div>
      </main>
    </div>
  )

  const todosTallesSeleccionados =
    tallesDisponibles.length > 0 &&
    tallesDisponibles.every((t) => form.variantes.talles.includes(t))

  return (
    <div style={{ ...s.root, flexDirection: isMobile ? 'column' : 'row' }}>

      {/* Sidebar desktop */}
      {!isMobile && (
        <aside style={s.sidebar}>
          <AdminSidebar usuario={usuario} onLogout={handleLogout} />
        </aside>
      )}

      {/* Mobile top bar */}
      {isMobile && (
        <div style={s.mobileTopBar}>
          <button onClick={() => setSidebarOpen(true)} style={s.menuBtn} type="button">
            <List size={22} weight="bold" />
          </button>
          <span style={s.mobileLogoText}>claroscuro</span>
          <button
            onClick={handleSubmit}
            style={{
              ...s.btnPrimarySmall,
              ...(guardadoOk ? { background: '#1a6b3a', borderColor: 'transparent' } : {}),
            }}
            disabled={guardando || guardadoOk}
            type="button"
          >
            {guardadoOk ? '✓' : guardando ? '…' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Mobile drawer */}
      {isMobile && sidebarOpen && (
        <>
          <div style={s.drawerBackdrop} onClick={() => setSidebarOpen(false)} />
          <aside style={s.drawerSidebar}>
            <AdminSidebar
              usuario={usuario}
              onLogout={handleLogout}
              onClose={() => setSidebarOpen(false)}
              isMobile
            />
          </aside>
        </>
      )}

      {/* ── Main ──────────────────────────────────────────────── */}
      <main style={{ ...s.main, padding: isMobile ? '1.25rem 1rem 3rem' : '2rem 2.5rem' }}>

        {/* Header */}
        <div style={{ ...s.header, marginBottom: isMobile ? '1rem' : '1.75rem' }}>
          <div style={s.headerLeft}>
            <button type="button" onClick={() => navigate('/admin')} style={s.backBtn}>
              <ArrowLeft size={13} weight="bold" style={{ marginRight: 5 }} />
              Volver
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ ...s.title, fontSize: isMobile ? '1.3rem' : '1.55rem' }}>
                  {esEdicion ? 'Editar producto' : 'Nuevo producto'}
                </h1>
                {hayUnsaved && (
                  <span style={s.unsavedBadge}>Sin guardar</span>
                )}
              </div>
              <p style={s.subtitle}>
                {esEdicion ? `ID: ${id}` : 'Completá los campos obligatorios marcados con *'}
              </p>
            </div>
          </div>

          {!isMobile && (
            <button
              type="button"
              onClick={handleSubmit}
              style={guardadoOk ? s.btnGuardadoOk : s.btnPrimary}
              disabled={guardando || guardadoOk}
            >
              {guardadoOk ? (
                <><CheckCircle size={15} weight="fill" style={{ marginRight: 7 }} />¡Guardado!</>
              ) : guardando ? (
                'Guardando…'
              ) : esEdicion ? (
                'Guardar cambios'
              ) : (
                'Crear producto'
              )}
            </button>
          )}
        </div>

        {/* Error global */}
        {errorGlobal && (
          <div style={s.errorBox} role="alert">
            <Warning size={16} weight="fill" style={{ marginRight: 8, flexShrink: 0, marginTop: 1 }} />
            {errorGlobal}
          </div>
        )}

        {/* ── Layout ────────────────────────────────────────── */}
        <div style={{ ...s.layout, flexDirection: isMobile ? 'column' : 'row' }}>

          {/* ── Col principal ─────────────────────────────── */}
          <div style={{ ...s.colMain, minWidth: isMobile ? 'unset' : 320 }}>

            {/* Info general */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Información general</h2>

              <Field
                label="Nombre"
                required
                error={errores.nombre}
              >
                <input
                  data-error={!!errores.nombre}
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  style={{ ...s.input, ...(errores.nombre ? s.inputError : {}) }}
                  placeholder="Ej: Sweater Amelia"
                  maxLength={80}
                  autoComplete="off"
                />
              </Field>

              <Field
                label="Descripción"
                hint={`${form.descripcion.length}/${DESC_MAX}`}
                error={errores.descripcion}
              >
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  style={{ ...s.textarea, ...(errores.descripcion ? s.inputError : {}) }}
                  placeholder="Descripción del producto, materiales, cuidados…"
                  rows={3}
                  maxLength={DESC_MAX}
                />
              </Field>

              <div style={{ ...s.row, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <Field label="Precio (ARS)" required error={errores.precio}>
                    <div style={{ position: 'relative' }}>
                      <span style={s.precioPrefix}>$</span>
                      <input
                        data-error={!!errores.precio}
                        name="precio"
                        type="number"
                        min="0"
                        value={form.precio}
                        onChange={handleChange}
                        style={{ ...s.input, paddingLeft: '1.6rem', ...(errores.precio ? s.inputError : {}) }}
                        placeholder="0"
                      />
                    </div>
                    {form.precio > 0 && (
                      <p style={s.precioPreview}>
                        = ${Number(form.precio).toLocaleString('es-AR')}
                      </p>
                    )}
                  </Field>
                </div>

                <div style={{ flex: 1 }}>
                  <Field label="Categoría" required error={errores.categoria}>
                    <select
                      data-error={!!errores.categoria}
                      name="categoria"
                      value={form.categoria}
                      onChange={handleChange}
                      style={{ ...s.select, ...(errores.categoria ? s.inputError : {}) }}
                    >
                      <option value="">Seleccioná…</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Toggles */}
              <div style={s.toggleRow}>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, destacado: !p.destacado }))}
                  style={form.destacado ? s.toggleBtnOn : s.toggleBtn}
                  title="Producto destacado en home y catálogo"
                >
                  <Star size={14} weight={form.destacado ? 'fill' : 'regular'} style={{ marginRight: 6 }} />
                  {form.destacado ? 'Destacado' : 'Sin destacar'}
                </button>

                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, activo: !p.activo }))}
                  style={form.activo ? s.toggleBtnGreen : s.toggleBtnRed}
                  title="Visible en la tienda pública"
                >
                  {form.activo
                    ? <><CheckCircle size={14} weight="fill" style={{ marginRight: 6 }} />Activo</>
                    : <><XCircle size={14} weight="fill" style={{ marginRight: 6 }} />Inactivo</>}
                </button>
              </div>
            </div>

            {/* Talles */}
            <div style={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h2 style={{ ...s.cardTitle, margin: 0 }}>
                  Talles disponibles
                  {esCalzado && <span style={s.badgeSmall}>Calzado</span>}
                  {esJeans   && <span style={s.badgeSmall}>Jeans</span>}
                </h2>
                {form.categoria !== '' && tallesDisponibles.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleTodosTalles}
                    style={s.selectAllBtn}
                  >
                    {todosTallesSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                )}
              </div>

              {form.categoria === '' ? (
                <p style={s.helper}>Elegí primero una categoría para ver los talles disponibles.</p>
              ) : (
                <>
                  <p style={s.helper}>
                    {form.variantes.talles.length > 0
                      ? `${form.variantes.talles.length} talle${form.variantes.talles.length !== 1 ? 's' : ''} seleccionado${form.variantes.talles.length !== 1 ? 's' : ''}`
                      : 'Seleccioná los talles disponibles para este producto'}
                  </p>
                  <div style={s.tallesGrid}>
                    {tallesDisponibles.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTalle(t)}
                        style={form.variantes.talles.includes(t) ? s.talleActivo : s.talle}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {errores.talles && (
                    <p style={{ ...s.fieldError, marginTop: '0.6rem' }} data-error="true">
                      <Warning size={11} weight="fill" style={{ marginRight: 4 }} />
                      {errores.talles}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Colores */}
            <div style={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h2 style={{ ...s.cardTitle, margin: 0 }}>Colores disponibles</h2>
                {form.variantes.colores.length > 0 && (
                  <span style={s.colorCountBadge}>
                    {form.variantes.colores.length} seleccionado{form.variantes.colores.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div
                style={{
                  ...s.coloresGrid,
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(2, minmax(0, 1fr))',
                }}
              >
                {COLORES_PRESET.map((c) => {
                  const sel = form.variantes.colores.find((x) => x.nombre === c.nombre)
                  return (
                    <button
                      key={c.nombre}
                      type="button"
                      onClick={() => toggleColor(c)}
                      style={{ ...s.colorBtn, ...(sel ? s.colorBtnSel : {}) }}
                      title={c.nombre}
                    >
                      <span style={{ ...s.colorCircle, background: c.hex }} />
                      <span style={s.colorNombre}>{c.nombre}</span>
                      {sel && (
                        <CheckCircle
                          size={13}
                          weight="fill"
                          style={{ marginLeft: 'auto', color: '#1a6b3a', flexShrink: 0 }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              {errores.colores && (
                <p style={{ ...s.fieldError, marginTop: '0.6rem' }} data-error="true">
                  <Warning size={11} weight="fill" style={{ marginRight: 4 }} />
                  {errores.colores}
                </p>
              )}
            </div>
          </div>

          {/* ── Col lateral ───────────────────────────────── */}
          <div style={{ ...s.colSide, minWidth: isMobile ? 'unset' : 260 }}>

            {/* Imágenes */}
            <div style={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <h2 style={{ ...s.cardTitle, margin: 0 }}>
                  Imágenes
                </h2>
                {form.imagenes.length > 0 && (
                  <span style={s.colorCountBadge}>{form.imagenes.length} subida{form.imagenes.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              <label
                style={{
                  ...s.uploadArea,
                  ...(subiendoImagen ? s.uploadAreaLoading : {}),
                  ...(errores.imagenes ? s.uploadAreaError : {}),
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagenUpload}
                  style={{ display: 'none' }}
                  disabled={subiendoImagen}
                />
                <UploadSimple
                  size={22}
                  weight="light"
                  style={{ color: errores.imagenes ? '#8a3525' : '#aaa', marginBottom: 6 }}
                />
                <span style={{ ...s.uploadText, color: errores.imagenes ? '#8a3525' : '#555' }}>
                  {subiendoImagen ? `Subiendo… ${uploadProgress}%` : 'Clic para subir'}
                </span>
                <span style={s.uploadSub}>JPG · PNG · WEBP · múltiples</span>
              </label>

              {subiendoImagen && (
                <div style={s.progressBar}>
                  <div style={{ ...s.progressFill, width: `${uploadProgress}%` }} />
                </div>
              )}

              {errores.imagenes && (
                <p style={{ ...s.fieldError, marginTop: '0.5rem' }} data-error="true">
                  <Warning size={11} weight="fill" style={{ marginRight: 4 }} />
                  {errores.imagenes}
                </p>
              )}

              {form.imagenes.length > 0 && (
                <div style={s.imagenesGrid}>
                  {form.imagenes.map((url, i) => (
                    <div key={url} style={s.imagenWrapper}>
                      <img
                        src={url}
                        alt={`imagen-${i + 1}`}
                        style={s.imagenPreview}
                        loading="lazy"
                      />
                      {i === 0 && <span style={s.imagenPrincipal}>Principal</span>}
                      <div style={s.imagenControls}>
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => moverImagen(i, i - 1)}
                            style={s.imagenMoverBtn}
                            title="Mover hacia atrás"
                          >
                            <ArrowLeftIcon size={10} weight="bold" />
                          </button>
                        )}
                        {i < form.imagenes.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moverImagen(i, i + 1)}
                            style={s.imagenMoverBtn}
                            title="Mover hacia adelante"
                          >
                            <ArrowRightIcon size={10} weight="bold" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarImagen(url)}
                        style={s.imagenDelete}
                        title="Quitar imagen"
                      >
                        <X size={10} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p style={s.imagenHint}>
                La primera imagen es la portada. Arrastrá los botones ← → para reordenar.
              </p>
            </div>

            {/* Vista previa */}
            {(form.nombre || form.imagenes[0]) && (
              <div style={s.card}>
                <h2 style={s.cardTitle}>Vista previa</h2>
                <div style={s.previewCard}>
                  {form.imagenes[0] ? (
                    <img
                      src={form.imagenes[0]}
                      alt="preview"
                      style={s.previewImg}
                    />
                  ) : (
                    <div style={s.previewImgFallback} />
                  )}
                  <div style={s.previewInfo}>
                    {form.categoria && (
                      <span style={s.previewCat}>
                        {CATEGORIAS.find((c) => c.value === form.categoria)?.label || form.categoria}
                      </span>
                    )}
                    <p style={s.previewNombre}>
                      {form.nombre || 'Nombre del producto'}
                    </p>
                    {form.precio > 0 && (
                      <p style={s.previewPrecio}>
                        ${Number(form.precio || 0).toLocaleString('es-AR')}
                      </p>
                    )}
                    <div style={s.previewBadges}>
                      {form.destacado && (
                        <span style={s.previewBadgeStar}>★ Destacado</span>
                      )}
                      <span style={form.activo ? s.previewBadgeActivo : s.previewBadgeInactivo}>
                        {form.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    {form.variantes.talles.length > 0 && (
                      <p style={s.previewTalles}>
                        {form.variantes.talles.join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Checklist de completitud */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Completitud</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Nombre',     ok: !!form.nombre.trim() },
                  { label: 'Precio',     ok: form.precio > 0 },
                  { label: 'Categoría',  ok: !!form.categoria },
                  { label: 'Imágenes',   ok: form.imagenes.length > 0 },
                  { label: 'Talles',     ok: form.variantes.talles.length > 0 },
                  { label: 'Colores',    ok: form.variantes.colores.length > 0 },
                  { label: 'Descripción',ok: form.descripcion.trim().length > 0, optional: true },
                ].map(({ label, ok, optional }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    {ok
                      ? <CheckCircle size={15} weight="fill" style={{ color: '#1a6b3a', flexShrink: 0 }} />
                      : <XCircle size={15} weight="fill" style={{ color: optional ? '#ccc' : '#ccc', flexShrink: 0 }} />}
                    <span style={{ fontSize: '0.85rem', color: ok ? '#333' : optional ? '#bbb' : '#888', fontWeight: ok ? 600 : 400 }}>
                      {label}
                      {optional && <span style={{ fontSize: '0.72rem', color: '#bbb', marginLeft: 4 }}>(opcional)</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones guardar/cancelar */}
            <button
              type="button"
              onClick={handleSubmit}
              style={guardadoOk ? s.btnGuardarSecOk : s.btnGuardarSec}
              disabled={guardando || guardadoOk}
            >
              {guardadoOk ? (
                <><CheckCircle size={16} weight="fill" style={{ marginRight: 8 }} />¡Guardado!</>
              ) : guardando ? (
                'Guardando…'
              ) : esEdicion ? (
                'Guardar cambios'
              ) : (
                'Crear producto'
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={s.btnCancelar}
            >
              Cancelar
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────── */
const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f4f3ef', fontFamily: "'Helvetica Neue', Arial, sans-serif" },

  // Sidebar
  sidebar: { width: '240px', background: '#1a1a1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },
  logo: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.05em' },
  nav: { flex: 1, display: 'grid', gap: 8, alignContent: 'start' },
  navItem: { display: 'flex', alignItems: 'center', padding: '0.65rem 0.75rem', borderRadius: '10px', fontSize: '0.92rem', color: '#fff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.10)', background: 'transparent' },
  navItemActive: { background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' },
  sidebarFooter: { borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' },
  emailText: { display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.75rem', wordBreak: 'break-all' },
  logoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 0.75rem', cursor: 'pointer', borderRadius: '10px', fontSize: '0.82rem', width: '100%' },

  // Mobile
  mobileTopBar: { background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', position: 'sticky', top: 0, zIndex: 100 },
  mobileLogoText: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', letterSpacing: '0.05em', color: '#fff' },
  menuBtn: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' },
  btnPrimarySmall: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', padding: '0.45rem 0.85rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'inherit' },
  closeBtn: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  drawerBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 },
  drawerSidebar: { position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px', background: '#1a1a1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '1.5rem 1.25rem', zIndex: 300, overflowY: 'auto' },

  // Main
  main: { flex: 1, overflowX: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  backBtn: { display: 'inline-flex', alignItems: 'center', background: 'transparent', border: '1px solid #e0ddd6', color: '#666', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, width: 'fit-content', fontFamily: 'inherit' },
  title: { margin: 0, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' },
  subtitle: { margin: 0, color: '#aaa', fontSize: '0.82rem' },
  unsavedBadge: { fontSize: '0.68rem', background: '#fff3cd', color: '#856404', border: '1px solid #ffc107', padding: '0.15rem 0.5rem', borderRadius: 999, fontWeight: 700 },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', background: '#111', color: '#fff', border: 'none', padding: '0.75rem 1.35rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, boxShadow: '0 4px 14px rgba(0,0,0,0.14)', alignSelf: 'flex-start', fontFamily: 'inherit' },
  btnGuardadoOk: { display: 'inline-flex', alignItems: 'center', background: '#1a6b3a', color: '#fff', border: 'none', padding: '0.75rem 1.35rem', borderRadius: '10px', cursor: 'default', fontSize: '0.88rem', fontWeight: 700, alignSelf: 'flex-start' },
  errorBox: { display: 'flex', alignItems: 'flex-start', background: '#fdf0ee', color: '#8a3525', padding: '0.85rem 1.1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.88rem', border: '1px solid #f0c0b5', lineHeight: 1.5 },

  // Layout
  layout: { display: 'flex', gap: '1.5rem', alignItems: 'flex-start' },
  colMain: { flex: 2, display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  colSide: { flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  card: { background: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '14px', padding: '1.35rem', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' },
  cardTitle: { margin: '0 0 1rem', fontSize: '0.92rem', fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 8 },
  badgeSmall: { fontSize: '0.65rem', background: '#f2ede5', color: '#5a4a30', padding: '0.18rem 0.55rem', borderRadius: 999, fontWeight: 700 },

  // Field + validation
  label: { fontSize: '0.82rem', fontWeight: 700, color: '#555' },
  requiredMark: { color: '#c62828' },
  hint: { fontSize: '0.72rem', color: '#bbb' },
  fieldError: { display: 'flex', alignItems: 'center', margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#8a3525', fontWeight: 600 },

  // Inputs
  input: { width: '100%', padding: '0.72rem 0.9rem', border: '1px solid #e0ddd6', borderRadius: '9px', outline: 'none', fontSize: '0.9rem', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' },
  inputError: { borderColor: '#f0c0b5', background: '#fdf9f8' },
  textarea: { width: '100%', padding: '0.72rem 0.9rem', border: '1px solid #e0ddd6', borderRadius: '9px', resize: 'vertical', outline: 'none', fontSize: '0.9rem', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' },
  select: { width: '100%', padding: '0.72rem 0.9rem', border: '1px solid #e0ddd6', borderRadius: '9px', outline: 'none', fontSize: '0.9rem', color: '#1a1a1a', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' },

  // Precio
  precioPrefix: { position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '0.9rem', pointerEvents: 'none' },
  precioPreview: { margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#888', fontWeight: 500 },

  row: { display: 'flex', gap: '1rem' },
  toggleRow: { display: 'flex', gap: '0.65rem', flexWrap: 'wrap', paddingTop: '0.25rem' },
  toggleBtn: { display: 'inline-flex', alignItems: 'center', padding: '0.52rem 0.95rem', border: '1px solid #e0ddd6', borderRadius: 999, background: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#888', fontFamily: 'inherit' },
  toggleBtnOn: { display: 'inline-flex', alignItems: 'center', padding: '0.52rem 0.95rem', border: '1px solid #f0d87a', borderRadius: 999, background: '#fff8e8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#7a5218', fontFamily: 'inherit' },
  toggleBtnGreen: { display: 'inline-flex', alignItems: 'center', padding: '0.52rem 0.95rem', border: '1px solid #b3dfc0', borderRadius: 999, background: '#edf7ef', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#1a6b3a', fontFamily: 'inherit' },
  toggleBtnRed: { display: 'inline-flex', alignItems: 'center', padding: '0.52rem 0.95rem', border: '1px solid #f0c0b5', borderRadius: 999, background: '#fdf0ee', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#8a3525', fontFamily: 'inherit' },

  // Talles
  helper: { margin: '0 0 0.9rem', color: '#aaa', fontSize: '0.82rem', lineHeight: 1.5 },
  tallesGrid: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' },
  talle: { padding: '0.48rem 0.85rem', border: '1px solid #e0ddd6', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#555', fontWeight: 600, fontFamily: 'inherit' },
  talleActivo: { padding: '0.48rem 0.85rem', border: '1px solid #111', background: '#111', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'inherit' },
  selectAllBtn: { fontSize: '0.75rem', color: '#888', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', padding: 0 },

  // Colores
  coloresGrid: { display: 'grid', gap: '0.45rem' },
  colorBtn: { display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.5rem 0.7rem', borderRadius: '9px', border: '1px solid #e0ddd6', background: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' },
  colorBtnSel: { border: '1px solid #b3dfc0', background: '#f4faf6' },
  colorCircle: { width: 14, height: 14, borderRadius: 999, border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 },
  colorNombre: { fontSize: '0.85rem', color: '#333', fontWeight: 500 },
  colorCountBadge: { fontSize: '0.68rem', color: '#888', background: '#f3f3f3', padding: '0.15rem 0.5rem', borderRadius: 999, fontWeight: 600 },

  // Upload
  uploadArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.25rem 1rem', border: '1.5px dashed #d0ccc4', borderRadius: '12px', cursor: 'pointer', background: '#faf9f6', marginBottom: '0.25rem' },
  uploadAreaLoading: { borderColor: '#b3dfc0', background: '#f4faf6' },
  uploadAreaError: { borderColor: '#f0c0b5', background: '#fdf9f8' },
  uploadText: { marginTop: '0.3rem', fontWeight: 700, fontSize: '0.88rem' },
  uploadSub: { marginTop: '0.2rem', fontSize: '0.75rem', color: '#bbb' },
  progressBar: { height: 4, background: '#f0ede6', borderRadius: 999, margin: '0.5rem 0', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#1a6b3a', borderRadius: 999, transition: 'width 0.2s ease' },
  imagenesGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.65rem', marginTop: '0.85rem' },
  imagenWrapper: { position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e0ddd6' },
  imagenPreview: { width: '100%', height: 120, objectFit: 'cover', display: 'block' },
  imagenPrincipal: { position: 'absolute', left: 6, top: 6, background: 'rgba(26,26,26,0.82)', color: '#fff', fontSize: '0.62rem', padding: '0.16rem 0.42rem', borderRadius: 6, fontWeight: 700 },
  imagenControls: { position: 'absolute', bottom: 5, left: 5, display: 'flex', gap: 3 },
  imagenMoverBtn: { background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 5, padding: '0.2rem 0.38rem', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  imagenDelete: { position: 'absolute', right: 6, top: 6, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 6, padding: '0.28rem 0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  imagenHint: { margin: '0.6rem 0 0', fontSize: '0.76rem', color: '#ccc', lineHeight: 1.5 },

  // Preview card
  previewCard: { border: '1px solid #f0ede6', borderRadius: '10px', overflow: 'hidden' },
  previewImg: { width: '100%', height: 190, objectFit: 'cover', display: 'block' },
  previewImgFallback: { width: '100%', height: 190, background: 'linear-gradient(135deg, #f4f3ef, #e8e3d9)' },
  previewInfo: { padding: '0.85rem' },
  previewCat: { fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#aaa', fontWeight: 600 },
  previewNombre: { margin: '0.25rem 0 0.15rem', fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', lineHeight: 1.2 },
  previewPrecio: { margin: 0, fontSize: '0.88rem', color: '#555', fontWeight: 600 },
  previewBadges: { display: 'flex', gap: 5, marginTop: '0.55rem', flexWrap: 'wrap' },
  previewBadgeStar: { fontSize: '0.68rem', background: '#fff8e8', color: '#7a5218', border: '1px solid #f0d87a', padding: '0.15rem 0.5rem', borderRadius: 999, fontWeight: 700 },
  previewBadgeActivo: { fontSize: '0.68rem', background: '#edf7ef', color: '#1a6b3a', border: '1px solid #b3dfc0', padding: '0.15rem 0.5rem', borderRadius: 999, fontWeight: 700 },
  previewBadgeInactivo: { fontSize: '0.68rem', background: '#fdf0ee', color: '#8a3525', border: '1px solid #f0c0b5', padding: '0.15rem 0.5rem', borderRadius: 999, fontWeight: 700 },
  previewTalles: { margin: '0.45rem 0 0', fontSize: '0.72rem', color: '#bbb', lineHeight: 1.5 },

  // Acciones
  btnGuardarSec: { width: '100%', padding: '0.92rem', border: 'none', background: '#111', color: '#fff', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.14)', fontFamily: 'inherit' },
  btnGuardarSecOk: { width: '100%', padding: '0.92rem', border: 'none', background: '#1a6b3a', color: '#fff', borderRadius: '12px', cursor: 'default', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },
  btnCancelar: { width: '100%', padding: '0.82rem', border: '1px solid #e0ddd6', background: '#fff', color: '#555', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.5rem', fontFamily: 'inherit' },
}

export default ProductoForm