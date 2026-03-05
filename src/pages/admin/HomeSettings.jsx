import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { subirImagenCloudinary } from '../../hooks/useProductos'
import { SignOut, Package, Image as ImageIcon, List, X } from '@phosphor-icons/react'

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

const DEFAULTS = {
  heroTitle: 'Una colección minimal, cuidada y atemporal.',
  heroSubtitle: 'Descubrí prendas pensadas para durar. Armá tu carrito y finalizá el pedido por WhatsApp en segundos.',
  heroTag: 'Nueva temporada',
  heroImage: null,
}

const HomeSettings = () => {
  const isMobile = useIsMobile()
  const { logout, usuario } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [form, setForm] = useState(DEFAULTS)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const handleLogout = async () => { await logout(); navigate('/admin/login') }

  useEffect(() => {
    const fetch = async () => {
      try {
        setCargando(true); setError('')
        const snap = await getDoc(doc(db, 'settings', 'home'))
        if (snap.exists()) {
          const d = snap.data()
          setForm({ heroTitle: d.heroTitle ?? DEFAULTS.heroTitle, heroSubtitle: d.heroSubtitle ?? DEFAULTS.heroSubtitle, heroTag: d.heroTag ?? DEFAULTS.heroTag, heroImage: d.heroImage ?? DEFAULTS.heroImage })
        } else { setForm(DEFAULTS) }
      } catch (e) { setError(e?.message || 'Error al cargar') }
      finally { setCargando(false) }
    }
    fetch()
  }, [])

  const onChange = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setOk('') }

  const onSubirImagen = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    try { setError(''); setOk(''); setSubiendo(true); const url = await subirImagenCloudinary(file); setForm((p) => ({ ...p, heroImage: url })) }
    catch { setError('No se pudo subir la imagen.') }
    finally { setSubiendo(false); e.target.value = '' }
  }

  const onGuardar = async () => {
    try {
      setError(''); setOk(''); setGuardando(true)
      if (!form.heroTitle.trim()) { setError('El título es obligatorio.'); return }
      await setDoc(doc(db, 'settings', 'home'), { heroTitle: form.heroTitle.trim(), heroSubtitle: form.heroSubtitle.trim(), heroTag: form.heroTag.trim(), heroImage: form.heroImage || null, updatedAt: serverTimestamp() }, { merge: true })
      setOk('Guardado ✅ (recargá el Home para ver cambios)')
    } catch (e) { setError(e?.message || 'Error al guardar') }
    finally { setGuardando(false) }
  }

  const SidebarContent = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={s.logo}>claroscuro</div>
        {isMobile && <button onClick={() => setSidebarOpen(false)} style={s.closeBtn} type="button"><X size={20} weight="bold" /></button>}
      </div>
      <nav style={s.nav}>
        <NavLink to="/admin" end onClick={() => setSidebarOpen(false)} style={({ isActive }) => (isActive ? { ...s.navItem, ...s.navItemActive } : s.navItem)}>
          <Package size={18} weight="bold" style={{ marginRight: 10 }} />Gestión de Productos
        </NavLink>
        <NavLink to="/admin/home" onClick={() => setSidebarOpen(false)} style={({ isActive }) => (isActive ? { ...s.navItem, ...s.navItemActive } : s.navItem)}>
          <ImageIcon size={18} weight="bold" style={{ marginRight: 10 }} />Gestionar Banner Principal
        </NavLink>
      </nav>
      <div style={s.sidebarFooter}>
        <span style={s.emailText}>{usuario?.email}</span>
        <button onClick={handleLogout} style={s.logoutBtn}><SignOut size={16} weight="bold" style={{ marginRight: 8 }} />Cerrar sesión</button>
      </div>
    </>
  )

  return (
    <div style={{ ...s.root, flexDirection: isMobile ? 'column' : 'row' }}>

      {/* Desktop sidebar */}
      {!isMobile && <aside style={s.sidebar}><SidebarContent /></aside>}

      {/* Mobile top bar */}
      {isMobile && (
        <div style={s.mobileTopBar}>
          <button onClick={() => setSidebarOpen(true)} style={s.menuBtn} type="button"><List size={22} weight="bold" /></button>
          <span style={s.mobileLogoText}>claroscuro</span>
          <button onClick={onGuardar} style={s.btnPrimarySmall} disabled={guardando || cargando} type="button">
            {guardando ? '...' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Mobile drawer */}
      {isMobile && sidebarOpen && (
        <>
          <div style={s.drawerBackdrop} onClick={() => setSidebarOpen(false)} />
          <aside style={s.drawerSidebar}><SidebarContent /></aside>
        </>
      )}

      {/* Main */}
      <main style={{ ...s.main, padding: isMobile ? '1.25rem 1rem' : '2rem 2.5rem' }}>

        {!isMobile && (
          <div style={s.header}>
            <div>
              <h1 style={s.title}>Gestionar Banner Principal</h1>
              <p style={s.subtitle}>Editá el hero del Home sin tocar código.</p>
            </div>
            <button type="button" onClick={onGuardar} style={s.btnPrimary} disabled={guardando || cargando}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        )}

        {isMobile && (
          <div style={{ marginBottom: '1rem' }}>
            <h1 style={{ ...s.title, fontSize: '1.4rem' }}>Banner Principal</h1>
            <p style={s.subtitle}>Editá el hero del Home.</p>
          </div>
        )}

        {cargando && <div style={s.loading}>Cargando…</div>}

        {(error || ok) && !cargando && (
          <div style={{ ...s.msg, ...(error ? s.msgError : s.msgOk) }} role="status">{error || ok}</div>
        )}

        {!cargando && (
          <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>

            {/* Form */}
            <section style={s.card}>
              <h2 style={s.h2}>Contenido</h2>
              <label style={s.label}>
                Título
                <input name="heroTitle" value={form.heroTitle} onChange={onChange} placeholder="Título principal" style={s.input} />
              </label>
              <label style={s.label}>
                Subtítulo
                <textarea name="heroSubtitle" value={form.heroSubtitle} onChange={onChange} placeholder="Texto descriptivo" style={{ ...s.input, minHeight: 100, resize: 'vertical', paddingTop: 12 }} />
              </label>
              <label style={s.label}>
                Tag (badge)
                <input name="heroTag" value={form.heroTag} onChange={onChange} placeholder="Ej: Nueva temporada" style={s.input} />
              </label>
              <div style={s.row}>
                <label style={s.fileLabel}>
                  {subiendo ? 'Subiendo…' : 'Subir imagen'}
                  <input type="file" accept="image/*" onChange={onSubirImagen} style={{ display: 'none' }} />
                </label>
                {form.heroImage && (
                  <button type="button" onClick={() => setForm((p) => ({ ...p, heroImage: null }))} style={s.btnGhost}>Quitar imagen</button>
                )}
              </div>
              <p style={s.help}>Recomendación: imagen horizontal (ej. 1600×1000). Se mostrará recortada tipo "cover".</p>
            </section>

            {/* Preview */}
            <section style={s.card}>
              <h2 style={s.h2}>Vista previa</h2>
              <div style={{ ...s.preview, height: isMobile ? 180 : 260 }}>
                {form.heroImage ? (
                  <><img src={form.heroImage} alt="Hero preview" style={s.previewImg} /><div style={s.previewOverlay} /></>
                ) : (
                  <><div style={s.previewFallbackGlow} /><div style={s.previewFallbackGrid} /><div style={s.previewFallbackOverlay} /></>
                )}
                <div style={s.previewBadge}>{form.heroTag || DEFAULTS.heroTag}</div>
              </div>
              <p style={s.previewTitle}>{form.heroTitle || DEFAULTS.heroTitle}</p>
              <p style={s.previewSub}>{form.heroSubtitle || DEFAULTS.heroSubtitle}</p>
            </section>
          </div>
        )}

        {/* Mobile save button at bottom */}
        {isMobile && !cargando && (
          <button type="button" onClick={onGuardar} style={{ ...s.btnPrimary, width: '100%', marginTop: '1rem', justifyContent: 'center' }} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        )}
      </main>
    </div>
  )
}

const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f5f5f0', fontFamily: "'Helvetica Neue', Arial, sans-serif" },
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
  main: { flex: 1, overflowX: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  title: { margin: '0 0 0.25rem', fontSize: '1.8rem', fontWeight: 700, color: '#1a1a1a' },
  subtitle: { margin: 0, color: '#666', fontSize: '0.9rem' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', background: '#1a1a1a', color: '#fff', border: 'none', padding: '0.75rem 1.15rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, boxShadow: '0 6px 18px rgba(0,0,0,0.10)' },
  loading: { padding: '2rem 0', color: '#666' },
  msg: { marginBottom: 14, padding: '0.85rem 1rem', borderRadius: 14, border: '1px solid', lineHeight: 1.6 },
  msgError: { background: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.22)', color: 'rgba(185,28,28,1)' },
  msgOk: { background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.20)', color: 'rgba(21,128,61,1)' },
  grid: { display: 'grid', gap: 16 },
  card: { borderRadius: 12, background: '#fff', boxShadow: '0 1px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)', padding: '1.1rem 1.1rem 1.25rem' },
  h2: { margin: '0 0 12px', fontWeight: 900, color: '#1a1a1a' },
  label: { display: 'grid', gap: 8, marginTop: 12, color: '#666', fontWeight: 800, fontSize: '0.92rem' },
  input: { width: '100%', padding: '0.75rem 0.9rem', borderRadius: 10, border: '1px solid #ddd', background: '#fff', outline: 'none', color: '#1a1a1a', fontWeight: 600, boxSizing: 'border-box' },
  row: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 },
  fileLabel: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 900, color: '#1a1a1a' },
  btnGhost: { padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid #ddd', background: 'transparent', cursor: 'pointer', fontWeight: 900, color: '#1a1a1a' },
  help: { margin: '0.9rem 0 0', color: '#666', lineHeight: 1.7, fontSize: '0.92rem' },
  preview: { position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', background: 'linear-gradient(135deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02))' },
  previewImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  previewOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.18))' },
  previewFallbackGlow: { position: 'absolute', inset: '-40%', background: 'radial-gradient(circle at 30% 30%, rgba(173,127,82,0.25), transparent 55%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.08), transparent 50%)', filter: 'blur(12px)' },
  previewFallbackGrid: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.25 },
  previewFallbackOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.05))' },
  previewBadge: { position: 'absolute', left: 12, bottom: 12, padding: '0.35rem 0.7rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.86)', border: '1px solid rgba(0,0,0,0.10)', color: '#1a1a1a' },
  previewTitle: { margin: '1rem 0 0.35rem', fontWeight: 900, color: '#1a1a1a' },
  previewSub: { margin: 0, color: '#666', lineHeight: 1.7 },
}

export default HomeSettings