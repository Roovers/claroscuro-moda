import { useEffect, useState, useMemo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { subirImagenCloudinary } from '../../hooks/useProductos'
import {
  SignOut, Package, Image as ImageIcon, List, X,
  UploadSimple, CheckCircle, Warning, ArrowCounterClockwise,
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

/* ── Defaults ────────────────────────────────────────────────── */
const DEFAULTS = {
  heroTitle:    'Una colección minimal, cuidada y atemporal.',
  heroSubtitle: 'Descubrí prendas pensadas para durar. Armá tu carrito y finalizá el pedido por WhatsApp en segundos.',
  heroTag:      'Nueva temporada',
  heroImage:    null,
}

const TITLE_MAX    = 80
const SUBTITLE_MAX = 220
const TAG_MAX      = 32

/* ── Sidebar ─────────────────────────────────────────────────── */
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

/* ── HomeSettings ────────────────────────────────────────────── */
const HomeSettings = () => {
  const isMobile = useIsMobile()
  const { logout, usuario } = useAuth()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [form, setForm]               = useState(DEFAULTS)
  const [formOriginal, setFormOriginal] = useState(DEFAULTS)
  const [cargando, setCargando]       = useState(true)
  const [guardando, setGuardando]     = useState(false)
  const [guardadoOk, setGuardadoOk]   = useState(false)
  const [subiendo, setSubiendo]       = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errores, setErrores]         = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')

  const handleLogout = async () => { await logout(); navigate('/admin/login') }

  /* ── Carga inicial ──────────────────────────────────────────── */
  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true)
        setErrorGlobal('')
        const snap = await getDoc(doc(db, 'settings', 'home'))
        const datos = snap.exists()
          ? {
              heroTitle:    snap.data().heroTitle    ?? DEFAULTS.heroTitle,
              heroSubtitle: snap.data().heroSubtitle ?? DEFAULTS.heroSubtitle,
              heroTag:      snap.data().heroTag      ?? DEFAULTS.heroTag,
              heroImage:    snap.data().heroImage    ?? DEFAULTS.heroImage,
            }
          : DEFAULTS
        setForm(datos)
        setFormOriginal(datos)
      } catch (e) {
        setErrorGlobal(e?.message || 'Error al cargar la configuración.')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  /* ── Detección de cambios sin guardar ───────────────────────── */
  const hayUnsaved = useMemo(() => {
    if (guardadoOk) return false
    return JSON.stringify(form) !== JSON.stringify(formOriginal)
  }, [form, formOriginal, guardadoOk])

  /* ── Handlers ───────────────────────────────────────────────── */
  const onChange = (e) => {
    const { name, value } = e.target
    setErrores((p) => ({ ...p, [name]: '' }))
    setGuardadoOk(false)
    setForm((p) => ({ ...p, [name]: value }))
  }

  const onSubirImagen = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrores((p) => ({ ...p, heroImage: '' }))
    setErrorGlobal('')
    setSubiendo(true)
    setUploadProgress(0)
    try {
      // Simular progreso (Cloudinary no da progreso real en fetch)
      const tick = setInterval(() => {
        setUploadProgress((p) => p < 85 ? p + 12 : p)
      }, 250)
      const url = await subirImagenCloudinary(file)
      clearInterval(tick)
      setUploadProgress(100)
      setForm((p) => ({ ...p, heroImage: url }))
      setGuardadoOk(false)
    } catch {
      setErrores((p) => ({ ...p, heroImage: 'No se pudo subir la imagen. Verificá el formato e intentá de nuevo.' }))
    } finally {
      setSubiendo(false)
      setUploadProgress(0)
      e.target.value = ''
    }
  }

  const onQuitarImagen = () => {
    setForm((p) => ({ ...p, heroImage: null }))
    setGuardadoOk(false)
  }

  const onRestaurarDefaults = () => {
    setForm(DEFAULTS)
    setErrores({})
    setGuardadoOk(false)
  }

  /* ── Validación ─────────────────────────────────────────────── */
  const validar = () => {
    const errs = {}
    if (!form.heroTitle.trim()) errs.heroTitle = 'El título es obligatorio.'
    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  /* ── Guardar ────────────────────────────────────────────────── */
  const onGuardar = async () => {
    setErrorGlobal('')
    if (!validar()) return
    setGuardando(true)
    try {
      await setDoc(
        doc(db, 'settings', 'home'),
        {
          heroTitle:    form.heroTitle.trim(),
          heroSubtitle: form.heroSubtitle.trim(),
          heroTag:      form.heroTag.trim(),
          heroImage:    form.heroImage || null,
          updatedAt:    serverTimestamp(),
        },
        { merge: true }
      )
      const guardado = { ...form }
      setFormOriginal(guardado)
      setGuardadoOk(true)
      setTimeout(() => setGuardadoOk(false), 4000)
    } catch (e) {
      setErrorGlobal(e?.message || 'Error al guardar. Verificá tu conexión e intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  /* ── Loading ────────────────────────────────────────────────── */
  if (cargando) return (
    <div style={{ ...s.root, flexDirection: isMobile ? 'column' : 'row' }}>
      {!isMobile && (
        <aside style={s.sidebar}>
          <AdminSidebar usuario={usuario} onLogout={handleLogout} />
        </aside>
      )}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
        <p style={{ color: '#999', fontSize: '0.9rem' }}>Cargando configuración…</p>
      </main>
    </div>
  )

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
            onClick={onGuardar}
            style={{
              ...s.btnPrimarySmall,
              ...(guardadoOk ? { background: '#1a6b3a', borderColor: 'transparent' } : {}),
            }}
            disabled={guardando}
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
        {!isMobile ? (
          <div style={s.header}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h1 style={s.title}>Gestionar Banner Principal</h1>
                {hayUnsaved && <span style={s.unsavedBadge}>Sin guardar</span>}
                {guardadoOk && (
                  <span style={s.savedBadge}>
                    <CheckCircle size={12} weight="fill" style={{ marginRight: 4 }} />
                    Guardado
                  </span>
                )}
              </div>
              <p style={s.subtitle}>Editá el hero del Home sin tocar código.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onRestaurarDefaults}
                style={s.btnGhost}
                title="Restaurar valores por defecto"
              >
                <ArrowCounterClockwise size={14} weight="bold" style={{ marginRight: 6 }} />
                Restaurar
              </button>
              <button
                type="button"
                onClick={onGuardar}
                style={guardadoOk ? s.btnGuardadoOk : s.btnPrimary}
                disabled={guardando}
              >
                {guardadoOk ? (
                  <><CheckCircle size={15} weight="fill" style={{ marginRight: 7 }} />¡Guardado!</>
                ) : guardando ? (
                  'Guardando…'
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <h1 style={{ ...s.title, fontSize: '1.4rem', margin: 0 }}>Banner Principal</h1>
              {hayUnsaved && <span style={s.unsavedBadge}>Sin guardar</span>}
              {guardadoOk && (
                <span style={s.savedBadge}>
                  <CheckCircle size={11} weight="fill" style={{ marginRight: 3 }} />Guardado
                </span>
              )}
            </div>
            <p style={s.subtitle}>Editá el hero del Home sin tocar código.</p>
          </div>
        )}

        {/* Error global */}
        {errorGlobal && (
          <div style={s.errorBox} role="alert">
            <Warning size={16} weight="fill" style={{ marginRight: 8, flexShrink: 0, marginTop: 1 }} />
            {errorGlobal}
          </div>
        )}

        {/* ── Grid ──────────────────────────────────────────── */}
        <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>

          {/* ── Formulario ─────────────────────────────────── */}
          <section style={s.card}>
            <h2 style={s.cardTitle}>Contenido del hero</h2>

            {/* Título */}
            <div style={s.fieldWrap}>
              <div style={s.fieldHeader}>
                <label style={s.label}>
                  Título <span style={s.requiredMark}>*</span>
                </label>
                <span style={s.charCount}>{form.heroTitle.length}/{TITLE_MAX}</span>
              </div>
              <input
                name="heroTitle"
                value={form.heroTitle}
                onChange={onChange}
                placeholder={DEFAULTS.heroTitle}
                style={{ ...s.input, ...(errores.heroTitle ? s.inputError : {}) }}
                maxLength={TITLE_MAX}
                autoComplete="off"
              />
              {errores.heroTitle && (
                <p style={s.fieldError}>
                  <Warning size={11} weight="fill" style={{ marginRight: 4 }} />
                  {errores.heroTitle}
                </p>
              )}
            </div>

            {/* Subtítulo */}
            <div style={s.fieldWrap}>
              <div style={s.fieldHeader}>
                <label style={s.label}>Subtítulo</label>
                <span style={s.charCount}>{form.heroSubtitle.length}/{SUBTITLE_MAX}</span>
              </div>
              <textarea
                name="heroSubtitle"
                value={form.heroSubtitle}
                onChange={onChange}
                placeholder={DEFAULTS.heroSubtitle}
                style={{ ...s.input, ...s.textarea }}
                rows={3}
                maxLength={SUBTITLE_MAX}
              />
            </div>

            {/* Tag */}
            <div style={s.fieldWrap}>
              <div style={s.fieldHeader}>
                <label style={s.label}>Tag / badge</label>
                <span style={s.charCount}>{form.heroTag.length}/{TAG_MAX}</span>
              </div>
              <input
                name="heroTag"
                value={form.heroTag}
                onChange={onChange}
                placeholder={DEFAULTS.heroTag}
                style={s.input}
                maxLength={TAG_MAX}
                autoComplete="off"
              />
              <p style={s.hint}>Aparece como pastilla sobre la imagen. Ej: "Nueva temporada".</p>
            </div>

            {/* Imagen */}
            <div style={s.fieldWrap}>
              <label style={s.label}>Imagen de fondo</label>

              {form.heroImage ? (
                /* Imagen cargada — previsualización compacta */
                <div style={s.imgLoaded}>
                  <img
                    src={form.heroImage}
                    alt="Hero actual"
                    style={s.imgLoadedThumb}
                  />
                  <div style={s.imgLoadedInfo}>
                    <p style={s.imgLoadedLabel}>Imagen actual</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <label style={s.btnReplace}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onSubirImagen}
                          style={{ display: 'none' }}
                          disabled={subiendo}
                        />
                        {subiendo ? `Subiendo… ${uploadProgress}%` : 'Reemplazar'}
                      </label>
                      <button
                        type="button"
                        onClick={onQuitarImagen}
                        style={s.btnQuitarImg}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Sin imagen — área de upload */
                <label
                  style={{
                    ...s.uploadArea,
                    ...(subiendo ? s.uploadAreaLoading : {}),
                    ...(errores.heroImage ? s.uploadAreaError : {}),
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSubirImagen}
                    style={{ display: 'none' }}
                    disabled={subiendo}
                  />
                  <UploadSimple
                    size={22}
                    weight="light"
                    style={{ color: errores.heroImage ? '#8a3525' : '#aaa', marginBottom: 6 }}
                  />
                  <span style={{ ...s.uploadText, color: errores.heroImage ? '#8a3525' : '#555' }}>
                    {subiendo ? `Subiendo… ${uploadProgress}%` : 'Clic para subir imagen'}
                  </span>
                  <span style={s.uploadSub}>JPG · PNG · WEBP · recomendado 1600×1000</span>
                </label>
              )}

              {subiendo && (
                <div style={s.progressBar}>
                  <div style={{ ...s.progressFill, width: `${uploadProgress}%` }} />
                </div>
              )}

              {errores.heroImage && (
                <p style={s.fieldError}>
                  <Warning size={11} weight="fill" style={{ marginRight: 4 }} />
                  {errores.heroImage}
                </p>
              )}

              <p style={s.hint}>
                Se mostrará recortada en modo "cover" detrás del texto. Sin imagen se usa el fondo con gradiente por defecto.
              </p>
            </div>
          </section>

          {/* ── Vista previa ───────────────────────────────── */}
          <section style={s.card}>
            <h2 style={s.cardTitle}>Vista previa</h2>

            {/* Hero simulado */}
            <div style={{ ...s.preview, height: isMobile ? 180 : 260 }}>
              {form.heroImage ? (
                <>
                  <img src={form.heroImage} alt="Hero preview" style={s.previewImg} />
                  <div style={s.previewOverlay} />
                </>
              ) : (
                <>
                  <div style={s.previewFallbackGlow} />
                  <div style={s.previewFallbackGrid} />
                  <div style={s.previewFallbackOverlay} />
                </>
              )}
              {form.heroTag.trim() && (
                <div style={s.previewBadge}>{form.heroTag}</div>
              )}
            </div>

            <p style={s.previewTitle}>{form.heroTitle || DEFAULTS.heroTitle}</p>
            <p style={s.previewSub}>{form.heroSubtitle || DEFAULTS.heroSubtitle}</p>

            {/* Checklist */}
            <div style={s.checklist}>
              {[
                { label: 'Título',    ok: !!form.heroTitle.trim() },
                { label: 'Subtítulo', ok: !!form.heroSubtitle.trim(), optional: true },
                { label: 'Tag',       ok: !!form.heroTag.trim(),      optional: true },
                { label: 'Imagen',    ok: !!form.heroImage,           optional: true },
              ].map(({ label, ok, optional }) => (
                <div key={label} style={s.checkItem}>
                  {ok
                    ? <CheckCircle size={13} weight="fill" style={{ color: '#1a6b3a', flexShrink: 0 }} />
                    : <X size={13} weight="bold" style={{ color: optional ? '#ddd' : '#ddd', flexShrink: 0 }} />}
                  <span style={{ fontSize: '0.82rem', color: ok ? '#333' : optional ? '#bbb' : '#999', fontWeight: ok ? 600 : 400 }}>
                    {label}
                    {optional && <span style={{ fontSize: '0.7rem', color: '#ccc', marginLeft: 4 }}>(opcional)</span>}
                  </span>
                </div>
              ))}
            </div>

            {/* Nota */}
            <p style={s.previewNote}>
              Los cambios se reflejan en el Home luego de guardar. No es necesario recargar el servidor.
            </p>
          </section>
        </div>

        {/* Botón guardar mobile al pie */}
        {isMobile && (
          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={onGuardar}
              style={guardadoOk ? s.btnGuardarSecOk : s.btnGuardarSec}
              disabled={guardando}
            >
              {guardadoOk ? (
                <><CheckCircle size={16} weight="fill" style={{ marginRight: 8 }} />¡Guardado!</>
              ) : guardando ? (
                'Guardando…'
              ) : (
                'Guardar cambios'
              )}
            </button>
            <button
              type="button"
              onClick={onRestaurarDefaults}
              style={s.btnCancelar}
            >
              <ArrowCounterClockwise size={14} weight="bold" style={{ marginRight: 6 }} />
              Restaurar valores por defecto
            </button>
          </div>
        )}

      </main>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────── */
const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f5f5f0', fontFamily: "'Helvetica Neue', Arial, sans-serif" },

  sidebar: { width: '240px', background: '#1a1a1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },
  logo: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.05em' },
  nav: { flex: 1, display: 'grid', gap: 8, alignContent: 'start' },
  navItem: { display: 'flex', alignItems: 'center', padding: '0.65rem 0.75rem', borderRadius: '10px', fontSize: '0.92rem', color: '#fff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.10)', background: 'transparent' },
  navItemActive: { background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' },
  sidebarFooter: { borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' },
  emailText: { display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.75rem', wordBreak: 'break-all' },
  logoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 0.75rem', cursor: 'pointer', borderRadius: '10px', fontSize: '0.82rem', width: '100%', fontFamily: 'inherit' },

  mobileTopBar: { background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', position: 'sticky', top: 0, zIndex: 100 },
  mobileLogoText: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', letterSpacing: '0.05em', color: '#fff' },
  menuBtn: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' },
  btnPrimarySmall: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '8px', padding: '0.45rem 0.85rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'inherit' },
  closeBtn: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  drawerBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 },
  drawerSidebar: { position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px', background: '#1a1a1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '1.5rem 1.25rem', zIndex: 300, overflowY: 'auto' },

  main: { flex: 1, overflowX: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  title: { margin: '0 0 0.2rem', fontSize: '1.8rem', fontWeight: 700, color: '#1a1a1a' },
  subtitle: { margin: 0, color: '#888', fontSize: '0.85rem' },

  unsavedBadge: { fontSize: '0.68rem', background: '#fff3cd', color: '#856404', border: '1px solid #ffc107', padding: '0.15rem 0.5rem', borderRadius: 999, fontWeight: 700 },
  savedBadge: { display: 'inline-flex', alignItems: 'center', fontSize: '0.68rem', background: '#edf7ef', color: '#1a6b3a', border: '1px solid #b3dfc0', padding: '0.15rem 0.5rem', borderRadius: 999, fontWeight: 700 },

  btnPrimary: { display: 'inline-flex', alignItems: 'center', background: '#1a1a1a', color: '#fff', border: 'none', padding: '0.75rem 1.15rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, boxShadow: '0 4px 14px rgba(0,0,0,0.12)', fontFamily: 'inherit' },
  btnGuardadoOk: { display: 'inline-flex', alignItems: 'center', background: '#1a6b3a', color: '#fff', border: 'none', padding: '0.75rem 1.15rem', borderRadius: '10px', cursor: 'default', fontSize: '0.88rem', fontWeight: 700, fontFamily: 'inherit' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', background: 'transparent', border: '1px solid #ddd', padding: '0.65rem 0.9rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.82rem', color: '#555', fontFamily: 'inherit' },

  errorBox: { display: 'flex', alignItems: 'flex-start', background: '#fdf0ee', color: '#8a3525', padding: '0.85rem 1.1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.88rem', border: '1px solid #f0c0b5', lineHeight: 1.5 },

  grid: { display: 'grid', gap: '1rem' },
  card: { borderRadius: '14px', background: '#fff', boxShadow: '0 1px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', padding: '1.35rem' },
  cardTitle: { margin: '0 0 1.1rem', fontWeight: 800, fontSize: '0.92rem', color: '#111' },

  // Fields
  fieldWrap: { marginBottom: '1.1rem' },
  fieldHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' },
  label: { fontSize: '0.82rem', fontWeight: 700, color: '#555' },
  requiredMark: { color: '#c62828' },
  charCount: { fontSize: '0.72rem', color: '#bbb' },
  hint: { margin: '0.35rem 0 0', fontSize: '0.76rem', color: '#bbb', lineHeight: 1.5 },
  fieldError: { display: 'flex', alignItems: 'center', margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#8a3525', fontWeight: 600 },

  input: { width: '100%', padding: '0.72rem 0.9rem', border: '1px solid #e0ddd6', borderRadius: '9px', outline: 'none', fontSize: '0.9rem', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' },
  inputError: { borderColor: '#f0c0b5', background: '#fdf9f8' },
  textarea: { resize: 'vertical', minHeight: 88 },

  // Upload
  uploadArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', border: '1.5px dashed #d0ccc4', borderRadius: '12px', cursor: 'pointer', background: '#faf9f6', textAlign: 'center' },
  uploadAreaLoading: { borderColor: '#b3dfc0', background: '#f4faf6' },
  uploadAreaError: { borderColor: '#f0c0b5', background: '#fdf9f8' },
  uploadText: { marginTop: '0.3rem', fontWeight: 700, fontSize: '0.88rem' },
  uploadSub: { marginTop: '0.2rem', fontSize: '0.72rem', color: '#bbb' },
  progressBar: { height: 4, background: '#f0ede6', borderRadius: 999, marginTop: '0.5rem', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#1a6b3a', borderRadius: 999, transition: 'width 0.25s ease' },

  // Imagen cargada
  imgLoaded: { display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', border: '1px solid #e8e3d9', borderRadius: '10px', background: '#faf9f6' },
  imgLoadedThumb: { width: 64, height: 48, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 },
  imgLoadedInfo: { flex: 1, minWidth: 0 },
  imgLoadedLabel: { margin: '0 0 0.4rem', fontSize: '0.78rem', color: '#888', fontWeight: 600 },
  btnReplace: { display: 'inline-flex', alignItems: 'center', padding: '0.38rem 0.75rem', border: '1px solid #e0ddd6', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#1a1a1a', fontFamily: 'inherit' },
  btnQuitarImg: { display: 'inline-flex', alignItems: 'center', padding: '0.38rem 0.75rem', border: '1px solid #f0c0b5', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#8a3525', fontFamily: 'inherit' },

  // Preview
  preview: { position: 'relative', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)', background: 'linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.02))' },
  previewImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  previewOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.18))' },
  previewFallbackGlow: { position: 'absolute', inset: '-40%', background: 'radial-gradient(circle at 30% 30%, rgba(173,127,82,0.25), transparent 55%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.08), transparent 50%)', filter: 'blur(12px)' },
  previewFallbackGrid: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.25 },
  previewFallbackOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.05))' },
  previewBadge: { position: 'absolute', left: 12, bottom: 12, padding: '0.35rem 0.7rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(0,0,0,0.09)', color: '#1a1a1a' },
  previewTitle: { margin: '1rem 0 0.3rem', fontWeight: 800, color: '#1a1a1a', fontSize: '0.95rem', lineHeight: 1.3 },
  previewSub: { margin: 0, color: '#777', lineHeight: 1.65, fontSize: '0.85rem' },

  // Checklist
  checklist: { display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '1rem', padding: '0.85rem', background: '#faf9f6', borderRadius: '10px', border: '1px solid #f0ede6' },
  checkItem: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  previewNote: { margin: '1rem 0 0', fontSize: '0.76rem', color: '#bbb', lineHeight: 1.6 },

  // Mobile bottom buttons
  btnGuardarSec: { width: '100%', padding: '0.92rem', border: 'none', background: '#111', color: '#fff', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.14)', fontFamily: 'inherit' },
  btnGuardarSecOk: { width: '100%', padding: '0.92rem', border: 'none', background: '#1a6b3a', color: '#fff', borderRadius: '12px', cursor: 'default', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },
  btnCancelar: { width: '100%', padding: '0.82rem', border: '1px solid #e0ddd6', background: '#fff', color: '#555', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },
}

export default HomeSettings