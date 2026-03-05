import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProductosAdmin, subirImagenCloudinary } from '../../hooks/useProductos'
import { CATEGORIAS, TALLES, COLORES_PRESET } from '../../constants/categorias'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import {
  ArrowLeft, UploadSimple, X, Star, CheckCircle, XCircle,
  ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon,
  List,
} from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { Package, Image as ImageIcon, SignOut } from '@phosphor-icons/react'

/* ── Hook mobile */
const useIsMobile = (bp = 768) => {
  const [v, setV] = useState(() => typeof window !== 'undefined' ? window.innerWidth < bp : false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`)
    const h = (e) => setV(e.matches)
    mq.addEventListener('change', h)
    setV(mq.matches)
    return () => mq.removeEventListener('change', h)
  }, [bp])
  return v
}

const TALLES_CALZADO = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']

const INITIAL_FORM = {
  nombre: '', descripcion: '', precio: '', categoria: '',
  destacado: false, activo: true, imagenes: [],
  variantes: { talles: [], colores: [] },
}

/* ── Sidebar compartida */
const AdminSidebar = ({ usuario, onLogout, onClose, isMobile }) => (
  <>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
      <div style={s.logo}>claroscuro</div>
      {isMobile && <button onClick={onClose} style={s.closeBtn} type="button"><X size={20} weight="bold" /></button>}
    </div>
    <nav style={s.nav}>
      <NavLink to="/admin" end onClick={onClose} style={({ isActive }) => (isActive ? { ...s.navItem, ...s.navItemActive } : s.navItem)}>
        <Package size={18} weight="bold" style={{ marginRight: 10 }} />Gestión de Productos
      </NavLink>
      <NavLink to="/admin/home" onClick={onClose} style={({ isActive }) => (isActive ? { ...s.navItem, ...s.navItemActive } : s.navItem)}>
        <ImageIcon size={18} weight="bold" style={{ marginRight: 10 }} />Gestionar Banner Principal
      </NavLink>
    </nav>
    <div style={s.sidebarFooter}>
      <span style={s.emailText}>{usuario?.email}</span>
      <button onClick={onLogout} style={s.logoutBtn}><SignOut size={16} weight="bold" style={{ marginRight: 8 }} />Cerrar sesión</button>
    </div>
  </>
)

const ProductoForm = () => {
  const isMobile = useIsMobile()
  const { id } = useParams()
  const navigate = useNavigate()
  const { logout, usuario } = useAuth()
  const { crearProducto, actualizarProducto } = useProductosAdmin()
  const esEdicion = Boolean(id)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [form, setForm] = useState(INITIAL_FORM)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardadoOk, setGuardadoOk] = useState(false)
  const [error, setError] = useState('')
  const [cargandoProducto, setCargandoProducto] = useState(esEdicion)

  const categoriasExt = useMemo(() => {
    const existeCalzado = CATEGORIAS.some((c) => c.value === 'calzado')
    return existeCalzado ? CATEGORIAS : [...CATEGORIAS, { value: 'calzado', label: 'Calzado' }]
  }, [])

  const esCalzado = form.categoria === 'calzado'
  const tallesDisponibles = esCalzado ? TALLES_CALZADO : TALLES

  useEffect(() => {
    if (!esEdicion) return
    const cargar = async () => {
      try {
        const snap = await getDoc(doc(db, 'productos', id))
        if (snap.exists()) {
          const d = snap.data()
          setForm({ nombre: d.nombre || '', descripcion: d.descripcion || '', precio: d.precio || '', categoria: d.categoria || '', destacado: d.destacado || false, activo: d.activo ?? true, imagenes: d.imagenes || [], variantes: d.variantes || { talles: [], colores: [] } })
        }
      } catch { setError('Error al cargar el producto') }
      finally { setCargandoProducto(false) }
    }
    cargar()
  }, [id, esEdicion])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'categoria') { setForm((p) => ({ ...p, categoria: value, variantes: { ...p.variantes, talles: [] } })); return }
    setForm((p) => ({ ...p, [name]: value }))
  }

  const toggleTalle = (t) => setForm((p) => {
    const talles = p.variantes.talles.includes(t) ? p.variantes.talles.filter((x) => x !== t) : [...p.variantes.talles, t]
    return { ...p, variantes: { ...p.variantes, talles } }
  })

  const toggleColor = (color) => setForm((p) => {
    const existe = p.variantes.colores.find((c) => c.nombre === color.nombre)
    const colores = existe ? p.variantes.colores.filter((c) => c.nombre !== color.nombre) : [...p.variantes.colores, color]
    return { ...p, variantes: { ...p.variantes, colores } }
  })

  const handleImagenUpload = async (e) => {
    const archivos = Array.from(e.target.files); if (!archivos.length) return
    setSubiendoImagen(true); setUploadProgress(0); setError('')
    try {
      const urls = []
      for (let i = 0; i < archivos.length; i++) {
        const url = await subirImagenCloudinary(archivos[i]); urls.push(url)
        setUploadProgress(Math.round(((i + 1) / archivos.length) * 100))
      }
      setForm((p) => ({ ...p, imagenes: [...p.imagenes, ...urls] }))
    } catch { setError('Error al subir imagen.') }
    finally { setSubiendoImagen(false); setUploadProgress(0); e.target.value = '' }
  }

  const eliminarImagen = (url) => setForm((p) => ({ ...p, imagenes: p.imagenes.filter((i) => i !== url) }))

  const moverImagen = (from, to) => setForm((p) => {
    const imgs = [...p.imagenes]; const [moved] = imgs.splice(from, 1); imgs.splice(to, 0, moved)
    return { ...p, imagenes: imgs }
  })

  const handleSubmit = async (e) => {
    if (e) e.preventDefault(); setError('')
    if (!form.nombre || !form.precio || !form.categoria) { setError('Nombre, precio y categoría son obligatorios.'); return }
    if (form.imagenes.length === 0) { setError('Cargá al menos 1 imagen.'); return }
    if (form.variantes.talles.length === 0) { setError('Seleccioná al menos 1 talle.'); return }
    if (form.variantes.colores.length === 0) { setError('Seleccioná al menos 1 color.'); return }
    setGuardando(true)
    try {
      const datos = { ...form, precio: Number(form.precio) }
      if (esEdicion) await actualizarProducto(id, datos); else await crearProducto(datos)
      setGuardadoOk(true); setTimeout(() => navigate('/admin'), 900)
    } catch { setError('Error al guardar. Intentá de nuevo.') }
    finally { setGuardando(false) }
  }

  const handleLogout = async () => { await logout(); navigate('/admin/login') }

  if (cargandoProducto) return (
    <div style={{ ...s.root, flexDirection: isMobile ? 'column' : 'row' }}>
      {!isMobile && <aside style={s.sidebar}><AdminSidebar usuario={usuario} onLogout={handleLogout} /></aside>}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#888' }}>Cargando producto…</span>
      </main>
    </div>
  )

  const imgPreview = form.imagenes[0]

  return (
    <div style={{ ...s.root, flexDirection: isMobile ? 'column' : 'row' }}>

      {/* Desktop sidebar */}
      {!isMobile && <aside style={s.sidebar}><AdminSidebar usuario={usuario} onLogout={handleLogout} /></aside>}

      {/* Mobile top bar */}
      {isMobile && (
        <div style={s.mobileTopBar}>
          <button onClick={() => setSidebarOpen(true)} style={s.menuBtn} type="button"><List size={22} weight="bold" /></button>
          <span style={s.mobileLogoText}>claroscuro</span>
          <button onClick={handleSubmit} style={s.btnPrimarySmall} disabled={guardando || guardadoOk} type="button">
            {guardadoOk ? '✓' : guardando ? '...' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Mobile drawer */}
      {isMobile && sidebarOpen && (
        <>
          <div style={s.drawerBackdrop} onClick={() => setSidebarOpen(false)} />
          <aside style={s.drawerSidebar}><AdminSidebar usuario={usuario} onLogout={handleLogout} onClose={() => setSidebarOpen(false)} isMobile /></aside>
        </>
      )}

      <main style={{ ...s.main, padding: isMobile ? '1.25rem 1rem' : '2rem 2.5rem' }}>

        {/* Header */}
        <div style={{ ...s.header, marginBottom: isMobile ? '1rem' : '1.75rem' }}>
          <div style={s.headerLeft}>
            <button type="button" onClick={() => navigate('/admin')} style={s.backBtn}>
              <ArrowLeft size={14} weight="bold" style={{ marginRight: 6 }} />Volver
            </button>
            <div>
              <h1 style={{ ...s.title, fontSize: isMobile ? '1.3rem' : '1.55rem' }}>{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h1>
              <p style={s.subtitle}>{esEdicion ? `ID: ${id}` : 'Completá todos los campos.'}</p>
            </div>
          </div>
          {!isMobile && (
            <button type="button" onClick={handleSubmit} style={guardadoOk ? s.btnGuardadoOk : s.btnPrimary} disabled={guardando || guardadoOk}>
              {guardadoOk ? <><CheckCircle size={15} weight="fill" style={{ marginRight: 7 }} />¡Guardado!</> : guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
            </button>
          )}
        </div>

        {error && (
          <div style={s.errorBox} role="alert">
            <X size={14} weight="bold" style={{ marginRight: 6, flexShrink: 0 }} />{error}
          </div>
        )}

        {/* Layout: en mobile, columna única; en desktop, 2 columnas */}
        <div style={{ ...s.layout, flexDirection: isMobile ? 'column' : 'row' }}>

          {/* Col principal */}
          <div style={{ ...s.colMain, minWidth: isMobile ? 'unset' : 320 }}>

            {/* Info general */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Información general</h2>
              <label style={s.label}>Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} style={s.input} placeholder="Ej: Sweater Amelia" />
              <label style={s.label}>Descripción</label>
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange} style={s.textarea} placeholder="Descripción…" rows={3} />
              <div style={{ ...s.row, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Precio (ARS) *</label>
                  <input name="precio" type="number" min="0" value={form.precio} onChange={handleChange} style={s.input} placeholder="0" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Categoría *</label>
                  <select name="categoria" value={form.categoria} onChange={handleChange} style={s.select}>
                    <option value="">Seleccioná…</option>
                    {categoriasExt.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={s.toggleRow}>
                <button type="button" onClick={() => setForm((p) => ({ ...p, destacado: !p.destacado }))} style={form.destacado ? s.toggleBtnOn : s.toggleBtn}>
                  <Star size={14} weight={form.destacado ? 'fill' : 'regular'} style={{ marginRight: 6 }} />
                  {form.destacado ? 'Destacado' : 'Sin destacar'}
                </button>
                <button type="button" onClick={() => setForm((p) => ({ ...p, activo: !p.activo }))} style={form.activo ? s.toggleBtnGreen : s.toggleBtnRed}>
                  {form.activo ? <><CheckCircle size={14} weight="fill" style={{ marginRight: 6 }} />Activo</> : <><XCircle size={14} weight="fill" style={{ marginRight: 6 }} />Inactivo</>}
                </button>
              </div>
            </div>

            {/* Talles */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Talles disponibles {esCalzado ? <span style={s.badgeSmall}>Calzado</span> : ''}</h2>
              {form.categoria === '' ? (
                <p style={s.helper}>Elegí primero una categoría.</p>
              ) : (
                <>
                  <p style={s.helper}>{esCalzado ? 'Talles numéricos.' : 'Talles de prenda (XS, S, M, …).'}</p>
                  <div style={s.tallesGrid}>
                    {tallesDisponibles.map((t) => (
                      <button key={t} type="button" onClick={() => toggleTalle(t)} style={form.variantes.talles.includes(t) ? s.talleActivo : s.talle}>{t}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Colores */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Colores disponibles</h2>
              <div style={{ ...s.coloresGrid, gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(2, minmax(0, 1fr))' }}>
                {COLORES_PRESET.map((c) => {
                  const sel = form.variantes.colores.find((x) => x.nombre === c.nombre)
                  return (
                    <button key={c.nombre} type="button" onClick={() => toggleColor(c)} style={{ ...s.colorBtn, ...(sel ? s.colorBtnSel : {}) }} title={c.nombre}>
                      <span style={{ ...s.colorCircle, background: c.hex }} />
                      <span style={s.colorNombre}>{c.nombre}</span>
                      {sel && <CheckCircle size={13} weight="fill" style={{ marginLeft: 'auto', color: '#1a6b3a', flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Col lateral */}
          <div style={{ ...s.colSide, minWidth: isMobile ? 'unset' : 260 }}>

            {/* Imágenes */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Imágenes</h2>
              <label style={{ ...s.uploadArea, ...(subiendoImagen ? s.uploadAreaLoading : {}) }}>
                <input type="file" accept="image/*" multiple onChange={handleImagenUpload} style={{ display: 'none' }} disabled={subiendoImagen} />
                <UploadSimple size={22} weight="light" style={{ color: '#aaa', marginBottom: 6 }} />
                <span style={s.uploadText}>{subiendoImagen ? `Subiendo… ${uploadProgress}%` : 'Tocar para subir'}</span>
                <span style={s.uploadSub}>JPG, PNG, WEBP · múltiples</span>
              </label>
              {subiendoImagen && <div style={s.progressBar}><div style={{ ...s.progressFill, width: `${uploadProgress}%` }} /></div>}
              {form.imagenes.length > 0 && (
                <div style={s.imagenesGrid}>
                  {form.imagenes.map((url, i) => (
                    <div key={url} style={s.imagenWrapper}>
                      <img src={url} alt={`img-${i}`} style={s.imagenPreview} />
                      {i === 0 && <span style={s.imagenPrincipal}>Principal</span>}
                      <div style={s.imagenControls}>
                        {i > 0 && <button type="button" onClick={() => moverImagen(i, i - 1)} style={s.imagenMoverBtn} title="← Mover"><ArrowLeftIcon size={11} weight="bold" /></button>}
                        {i < form.imagenes.length - 1 && <button type="button" onClick={() => moverImagen(i, i + 1)} style={s.imagenMoverBtn} title="→ Mover"><ArrowRightIcon size={11} weight="bold" /></button>}
                      </div>
                      <button type="button" onClick={() => eliminarImagen(url)} style={s.imagenDelete} title="Quitar"><X size={11} weight="bold" /></button>
                    </div>
                  ))}
                </div>
              )}
              <p style={s.imagenHint}>La primera imagen es la principal.</p>
            </div>

            {/* Vista previa */}
            {(form.nombre || imgPreview) && (
              <div style={s.card}>
                <h2 style={s.cardTitle}>Vista previa</h2>
                <div style={s.previewCard}>
                  {imgPreview ? <img src={imgPreview} alt="preview" style={s.previewImg} /> : <div style={s.previewImgFallback} />}
                  <div style={s.previewInfo}>
                    {form.categoria && <span style={s.previewCat}>{CATEGORIAS.find((c) => c.value === form.categoria)?.label || form.categoria}</span>}
                    <p style={s.previewNombre}>{form.nombre || 'Nombre del producto'}</p>
                    {form.precio && <p style={s.previewPrecio}>${Number(form.precio || 0).toLocaleString('es-AR')}</p>}
                    <div style={s.previewBadges}>
                      {form.destacado && <span style={s.previewBadgeStar}>★ Destacado</span>}
                      <span style={form.activo ? s.previewBadgeActivo : s.previewBadgeInactivo}>{form.activo ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botones guardar/cancelar */}
            <button type="button" onClick={handleSubmit} style={guardadoOk ? s.btnGuardarSecOk : s.btnGuardarSec} disabled={guardando || guardadoOk}>
              {guardadoOk ? <><CheckCircle size={16} weight="fill" style={{ marginRight: 8 }} />¡Guardado!</> : guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
            </button>
            <button type="button" onClick={() => navigate('/admin')} style={s.btnCancelar}>Cancelar</button>
          </div>
        </div>
      </main>
    </div>
  )
}

const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f4f3ef', fontFamily: "'Helvetica Neue', Arial, sans-serif" },
  sidebar: { width: '240px', background: '#1a1a1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },
  mobileTopBar: { background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', position: 'sticky', top: 0, zIndex: 100 },
  mobileLogoText: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', letterSpacing: '0.05em', color: '#fff' },
  menuBtn: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' },
  btnPrimarySmall: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', padding: '0.45rem 0.85rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 },
  closeBtn: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  drawerBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 },
  drawerSidebar: { position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px', background: '#1a1a1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '1.5rem 1.25rem', zIndex: 300, overflowY: 'auto' },
  logo: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.05em' },
  nav: { flex: 1, display: 'grid', gap: 8, alignContent: 'start' },
  navItem: { display: 'flex', alignItems: 'center', padding: '0.65rem 0.75rem', borderRadius: '10px', fontSize: '0.92rem', color: '#fff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.10)', background: 'transparent' },
  navItemActive: { background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' },
  sidebarFooter: { borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' },
  emailText: { display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.75rem', wordBreak: 'break-all' },
  logoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 0.75rem', cursor: 'pointer', borderRadius: '10px', fontSize: '0.82rem', width: '100%' },
  main: { flex: 1, overflowX: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  backBtn: { display: 'inline-flex', alignItems: 'center', background: 'transparent', border: '1px solid #e0ddd6', color: '#666', padding: '0.42rem 0.85rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, width: 'fit-content' },
  title: { margin: 0, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' },
  subtitle: { margin: 0, color: '#aaa', fontSize: '0.82rem' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', background: '#111', color: '#fff', border: 'none', padding: '0.75rem 1.35rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, boxShadow: '0 4px 14px rgba(0,0,0,0.14)', alignSelf: 'flex-start' },
  btnGuardadoOk: { display: 'inline-flex', alignItems: 'center', background: '#1a6b3a', color: '#fff', border: 'none', padding: '0.75rem 1.35rem', borderRadius: '10px', cursor: 'default', fontSize: '0.88rem', fontWeight: 700, alignSelf: 'flex-start' },
  errorBox: { display: 'flex', alignItems: 'flex-start', background: '#fdf0ee', color: '#8a3525', padding: '0.85rem 1.1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #f0c0b5', lineHeight: 1.45 },
  layout: { display: 'flex', gap: '1.5rem', alignItems: 'flex-start' },
  colMain: { flex: 2, display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  colSide: { flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  card: { background: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '14px', padding: '1.35rem', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' },
  cardTitle: { margin: '0 0 1.1rem', fontSize: '0.95rem', fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', gap: 8 },
  badgeSmall: { fontSize: '0.68rem', background: '#f2ede5', color: '#5a4a30', padding: '0.18rem 0.55rem', borderRadius: 999, fontWeight: 700 },
  label: { display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#555', marginBottom: '0.35rem', marginTop: '0.9rem' },
  input: { width: '100%', padding: '0.72rem 0.9rem', border: '1px solid #e0ddd6', borderRadius: '9px', outline: 'none', fontSize: '0.9rem', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.72rem 0.9rem', border: '1px solid #e0ddd6', borderRadius: '9px', resize: 'vertical', outline: 'none', fontSize: '0.9rem', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box' },
  select: { width: '100%', padding: '0.72rem 0.9rem', border: '1px solid #e0ddd6', borderRadius: '9px', outline: 'none', fontSize: '0.9rem', color: '#1a1a1a', background: '#fff', cursor: 'pointer' },
  row: { display: 'flex', gap: '1rem', marginTop: '0.25rem' },
  toggleRow: { display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '1.1rem' },
  toggleBtn: { display: 'inline-flex', alignItems: 'center', padding: '0.52rem 0.95rem', border: '1px solid #e0ddd6', borderRadius: '999px', background: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#888' },
  toggleBtnOn: { display: 'inline-flex', alignItems: 'center', padding: '0.52rem 0.95rem', border: '1px solid #f0d87a', borderRadius: '999px', background: '#fff8e8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#7a5218' },
  toggleBtnGreen: { display: 'inline-flex', alignItems: 'center', padding: '0.52rem 0.95rem', border: '1px solid #b3dfc0', borderRadius: '999px', background: '#edf7ef', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#1a6b3a' },
  toggleBtnRed: { display: 'inline-flex', alignItems: 'center', padding: '0.52rem 0.95rem', border: '1px solid #f0c0b5', borderRadius: '999px', background: '#fdf0ee', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#8a3525' },
  helper: { margin: '0 0 0.9rem', color: '#aaa', fontSize: '0.85rem', lineHeight: 1.5 },
  tallesGrid: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' },
  talle: { padding: '0.48rem 0.85rem', border: '1px solid #e0ddd6', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#555', fontWeight: 600 },
  talleActivo: { padding: '0.48rem 0.85rem', border: '1px solid #111', background: '#111', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 },
  coloresGrid: { display: 'grid', gap: '0.45rem' },
  colorBtn: { display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.5rem 0.7rem', borderRadius: '9px', border: '1px solid #e0ddd6', background: '#fff', cursor: 'pointer', textAlign: 'left' },
  colorBtnSel: { border: '1px solid #b3dfc0', background: '#f4faf6' },
  colorCircle: { width: 14, height: 14, borderRadius: 999, border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 },
  colorNombre: { fontSize: '0.85rem', color: '#333', fontWeight: 500 },
  uploadArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', border: '1.5px dashed #d0ccc4', borderRadius: '12px', cursor: 'pointer', background: '#faf9f6' },
  uploadAreaLoading: { borderColor: '#b3dfc0', background: '#f4faf6' },
  uploadText: { marginTop: '0.3rem', fontWeight: 700, fontSize: '0.9rem', color: '#555' },
  uploadSub: { marginTop: '0.2rem', fontSize: '0.78rem', color: '#bbb' },
  progressBar: { height: 4, background: '#f0ede6', borderRadius: 999, marginTop: '0.6rem', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#1a6b3a', borderRadius: 999, transition: 'width 0.2s ease' },
  imagenesGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.65rem', marginTop: '0.9rem' },
  imagenWrapper: { position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e0ddd6' },
  imagenPreview: { width: '100%', height: 130, objectFit: 'cover', display: 'block' },
  imagenPrincipal: { position: 'absolute', left: 7, top: 7, background: 'rgba(26,26,26,0.82)', color: '#fff', fontSize: '0.65rem', padding: '0.18rem 0.45rem', borderRadius: 6, fontWeight: 700 },
  imagenControls: { position: 'absolute', bottom: 6, left: 6, display: 'flex', gap: 4 },
  imagenMoverBtn: { background: 'rgba(255,255,255,0.88)', border: 'none', borderRadius: 5, padding: '0.18rem 0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center', backdropFilter: 'blur(4px)' },
  imagenDelete: { position: 'absolute', right: 7, top: 7, background: 'rgba(255,255,255,0.88)', border: 'none', borderRadius: 6, padding: '0.28rem 0.42rem', cursor: 'pointer', display: 'flex', alignItems: 'center', backdropFilter: 'blur(4px)' },
  imagenHint: { marginTop: '0.7rem', fontSize: '0.8rem', color: '#bbb', lineHeight: 1.5 },
  previewCard: { border: '1px solid #f0ede6', borderRadius: '10px', overflow: 'hidden' },
  previewImg: { width: '100%', height: 200, objectFit: 'cover', display: 'block' },
  previewImgFallback: { width: '100%', height: 200, background: 'linear-gradient(135deg, #f4f3ef, #e8e3d9)' },
  previewInfo: { padding: '0.9rem' },
  previewCat: { fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#aaa', fontWeight: 600 },
  previewNombre: { margin: '0.3rem 0 0.2rem', fontWeight: 800, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 },
  previewPrecio: { margin: 0, fontSize: '0.9rem', color: '#555', fontWeight: 600 },
  previewBadges: { display: 'flex', gap: 6, marginTop: '0.65rem', flexWrap: 'wrap' },
  previewBadgeStar: { fontSize: '0.7rem', background: '#fff8e8', color: '#7a5218', border: '1px solid #f0d87a', padding: '0.18rem 0.55rem', borderRadius: 999, fontWeight: 700 },
  previewBadgeActivo: { fontSize: '0.7rem', background: '#edf7ef', color: '#1a6b3a', border: '1px solid #b3dfc0', padding: '0.18rem 0.55rem', borderRadius: 999, fontWeight: 700 },
  previewBadgeInactivo: { fontSize: '0.7rem', background: '#fdf0ee', color: '#8a3525', border: '1px solid #f0c0b5', padding: '0.18rem 0.55rem', borderRadius: 999, fontWeight: 700 },
  btnGuardarSec: { width: '100%', padding: '0.92rem', border: 'none', background: '#111', color: '#fff', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.14)' },
  btnGuardarSecOk: { width: '100%', padding: '0.92rem', border: 'none', background: '#1a6b3a', color: '#fff', borderRadius: '12px', cursor: 'default', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnCancelar: { width: '100%', padding: '0.82rem', border: '1px solid #e0ddd6', background: '#fff', color: '#555', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' },
}

export default ProductoForm