import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { subirImagenCloudinary } from '../../hooks/useProductos'
import { AdminSidebar } from './Dashboard'
import { UploadSimple, X, CheckCircle, Info } from '@phosphor-icons/react'

const DEFAULTS = {
  heroTitle: 'Una colección minimal, cuidada y atemporal.',
  heroSubtitle: 'Descubrí prendas pensadas para durar. Armá tu carrito y finalizá el pedido por WhatsApp en segundos.',
  heroTag: 'Nueva temporada',
  heroImage: null,
}

const HomeSettings = () => {
  const { logout, usuario } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(DEFAULTS)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardadoOk, setGuardadoOk] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = async () => { await logout(); navigate('/admin/login') }

  useEffect(() => {
    const fetch = async () => {
      try {
        setCargando(true)
        const ref = doc(db, 'settings', 'home')
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data()
          setForm({
            heroTitle: data.heroTitle ?? DEFAULTS.heroTitle,
            heroSubtitle: data.heroSubtitle ?? DEFAULTS.heroSubtitle,
            heroTag: data.heroTag ?? DEFAULTS.heroTag,
            heroImage: data.heroImage ?? DEFAULTS.heroImage,
          })
        } else {
          setForm(DEFAULTS)
        }
      } catch (e) {
        setError(e?.message || 'Error al cargar configuración')
      } finally {
        setCargando(false)
      }
    }
    fetch()
  }, [])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setGuardadoOk(false)
    setError('')
  }

  const onSubirImagen = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setError('')
      setSubiendo(true)
      setUploadProgress(10)
      // Simular progreso mientras sube (Cloudinary no da progreso real en fetch simple)
      const timer = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 85))
      }, 300)
      const url = await subirImagenCloudinary(file)
      clearInterval(timer)
      setUploadProgress(100)
      setForm((prev) => ({ ...prev, heroImage: url }))
      setTimeout(() => setUploadProgress(0), 600)
    } catch (err) {
      setError('No se pudo subir la imagen. Verificá Cloudinary (preset / cloud name).')
      setUploadProgress(0)
    } finally {
      setSubiendo(false)
      e.target.value = ''
    }
  }

  const onGuardar = async () => {
    if (!form.heroTitle.trim()) { setError('El título es obligatorio.'); return }
    try {
      setError('')
      setGuardando(true)
      const ref = doc(db, 'settings', 'home')
      await setDoc(ref, {
        heroTitle: form.heroTitle.trim(),
        heroSubtitle: form.heroSubtitle.trim(),
        heroTag: form.heroTag.trim(),
        heroImage: form.heroImage || null,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      setGuardadoOk(true)
    } catch (e) {
      setError(e?.message || 'Error al guardar configuración')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={s.root}>
      <AdminSidebar usuario={usuario} onLogout={handleLogout} />

      <main style={s.main}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Banner principal</h1>
            <p style={s.subtitle}>Editá el hero del Home sin tocar código.</p>
          </div>
          <button
            type="button"
            onClick={onGuardar}
            style={guardadoOk ? s.btnGuardadoOk : s.btnPrimary}
            disabled={guardando || cargando}
          >
            {guardadoOk
              ? <><CheckCircle size={15} weight="fill" style={{ marginRight: 7 }} />Guardado</>
              : guardando ? 'Guardando…' : 'Guardar cambios'
            }
          </button>
        </div>

        {cargando && (
          <div style={s.loadingWrap}>
            <div style={s.loadingSpinner} />
            <span style={s.loadingText}>Cargando configuración…</span>
          </div>
        )}

        {error && (
          <div style={s.errorBox} role="alert">
            <X size={14} weight="bold" style={{ marginRight: 6, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {!cargando && (
          <div style={s.grid}>
            {/* Columna formulario */}
            <section style={s.card}>
              <h2 style={s.cardTitle}>Contenido del hero</h2>

              <label style={s.label}>
                Título principal *
                <input name="heroTitle" value={form.heroTitle} onChange={onChange} placeholder="Título principal" style={s.input} />
              </label>

              <label style={s.label}>
                Subtítulo
                <textarea
                  name="heroSubtitle"
                  value={form.heroSubtitle}
                  onChange={onChange}
                  placeholder="Texto descriptivo"
                  style={{ ...s.input, minHeight: 100, resize: 'vertical', paddingTop: 10 }}
                />
              </label>

              <label style={s.label}>
                Tag / Badge
                <input name="heroTag" value={form.heroTag} onChange={onChange} placeholder="Ej: Nueva temporada" style={s.input} />
              </label>

              {/* Upload imagen */}
              {/* Upload imagen */}
              <div style={s.imgSection}>
                <p style={s.label}>Imagen del hero</p>

                <div style={{ ...s.uploadBox, ...(form.heroImage ? s.uploadBoxHasImage : {}), ...(subiendo ? s.uploadBoxLoading : {}) }}>
                  <input
                    id="heroImageInput"
                    type="file"
                    accept="image/*"
                    onChange={onSubirImagen}
                    style={{ display: 'none' }}
                    disabled={subiendo}
                  />

                  {!form.heroImage ? (
                    <label htmlFor="heroImageInput" style={s.uploadEmpty}>
                      <UploadSimple size={20} weight="light" style={{ color: '#aaa', marginBottom: 6 }} />
                      <span style={s.uploadText}>{subiendo ? `Subiendo… ${uploadProgress}%` : 'Clic para subir imagen'}</span>
                      <span style={s.uploadSub}>Recomendado: horizontal 1600×1000</span>
                    </label>
                  ) : (
                    <div style={s.uploadFilled}>
                      <img src={form.heroImage} alt="Imagen actual" style={s.uploadThumb} />

                      <div style={s.uploadMeta}>
                        <div style={s.uploadMetaTitle}>Imagen cargada</div>
                        <div style={s.uploadMetaSub}>Podés cambiarla o quitarla.</div>

                        <div style={s.uploadActions}>
                          <label htmlFor="heroImageInput" style={s.btnSecondary} title="Cambiar imagen">
                            <UploadSimple size={14} weight="bold" />
                            Cambiar
                          </label>

                          <button
                            type="button"
                            onClick={() => { setForm((p) => ({ ...p, heroImage: null })); setGuardadoOk(false); }}
                            style={s.btnDanger}
                            title="Quitar imagen"
                          >
                            <X size={14} weight="bold" />
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {subiendo && (
                  <div style={s.progressBar}>
                    <div style={{ ...s.progressFill, width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>


            </section>

            {/* Columna preview */}
            <section style={s.card}>
              <h2 style={s.cardTitle}>Vista previa</h2>

              <div style={s.preview}>
                {form.heroImage ? (
                  <>
                    <img src={form.heroImage} alt="Hero preview" style={s.previewImg} />
                    <div style={s.previewOverlay} />
                  </>
                ) : (
                  <>
                    <div style={s.previewFallbackGlow} />
                    <div style={s.previewFallbackGrid} />
                  </>
                )}
                <div style={s.previewBadge}>{form.heroTag || DEFAULTS.heroTag}</div>

                {/* Overlay con texto encima de imagen */}
                <div style={s.previewTextOverlay}>
                  <p style={s.previewTextTitle}>{(form.heroTitle || DEFAULTS.heroTitle).slice(0, 60)}</p>
                </div>
              </div>

              <p style={s.previewTitle}>{form.heroTitle || DEFAULTS.heroTitle}</p>
              <p style={s.previewSub}>{form.heroSubtitle || DEFAULTS.heroSubtitle}</p>

              {/* Guardar desde preview también */}
              <button
                type="button"
                onClick={onGuardar}
                style={guardadoOk ? s.btnGuardadoOkFull : s.btnPrimaryFull}
                disabled={guardando || cargando}
              >
                {guardadoOk
                  ? <><CheckCircle size={14} weight="fill" style={{ marginRight: 7 }} />Guardado correctamente</>
                  : guardando ? 'Guardando…' : 'Guardar cambios'
                }
              </button>
              {/* Tips */}
              <div style={s.tipsCard}>
                <div style={s.tipsHeader}>
                  <Info size={14} weight="fill" style={{ color: 'rgba(184,149,106,0.8)', flexShrink: 0 }} />
                  <span style={s.tipsTitle}>Consejos</span>
                </div>
                <ul style={s.tipsList}>
                  <li style={s.tipsItem}>La imagen se muestra recortada (tipo "cover") en el hero.</li>
                  <li style={s.tipsItem}>El título y subtítulo también son editables desde acá.</li>
                  <li style={s.tipsItem}>Recargá el Home luego de guardar para ver los cambios.</li>
                </ul>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f4f3ef', fontFamily: "'Helvetica Neue', Arial, sans-serif" },
  main: { flex: 1, padding: '2rem 2.5rem', overflowX: 'auto' },

  loadingWrap: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '3rem', justifyContent: 'center' },
  loadingSpinner: { width: 20, height: 20, border: '2px solid #e0ddd6', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.65s linear infinite' },
  loadingText: { color: '#888', fontSize: '0.9rem' },

  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  title: { margin: '0 0 0.2rem', fontSize: '1.65rem', fontWeight: 800, color: '#111', letterSpacing: '-0.02em' },
  subtitle: { margin: 0, color: '#888', fontSize: '0.88rem' },

  btnPrimary: { display: 'inline-flex', alignItems: 'center', background: '#111', color: '#fff', border: 'none', padding: '0.72rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, boxShadow: '0 4px 14px rgba(0,0,0,0.14)' },
  btnGuardadoOk: { display: 'inline-flex', alignItems: 'center', background: '#1a6b3a', color: '#fff', border: 'none', padding: '0.72rem 1.25rem', borderRadius: '10px', cursor: 'default', fontSize: '0.88rem', fontWeight: 700 },

  errorBox: { display: 'flex', alignItems: 'flex-start', background: '#fdf0ee', color: '#8a3525', padding: '0.85rem 1.1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.9rem', border: '1px solid #f0c0b5' },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },

  card: { borderRadius: 14, background: '#fff', boxShadow: '0 1px 10px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)', padding: '1.35rem' },
  cardTitle: { margin: '0 0 1.25rem', fontWeight: 800, color: '#111', fontSize: '0.95rem' },

  label: { display: 'grid', gap: 6, marginTop: 14, color: '#555', fontWeight: 700, fontSize: '0.82rem' },
  input: { width: '100%', padding: '0.72rem 0.9rem', borderRadius: 10, border: '1px solid #e0ddd6', background: '#fff', outline: 'none', color: '#1a1a1a', fontWeight: 500, fontSize: '0.9rem', boxSizing: 'border-box' },

  imgSection: { marginTop: '1.25rem' },
  uploadArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', border: '1.5px dashed #d0ccc4', borderRadius: '12px', cursor: 'pointer', background: '#faf9f6', marginTop: 8 },
  uploadAreaLoading: { borderColor: '#b3dfc0', background: '#f4faf6' },
  uploadText: { fontWeight: 700, fontSize: '0.88rem', color: '#555' },
  uploadSub: { marginTop: '0.2rem', fontSize: '0.76rem', color: '#bbb' },

  progressBar: { height: 4, background: '#f0ede6', borderRadius: 999, marginTop: '0.6rem', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#1a6b3a', borderRadius: 999, transition: 'width 0.25s ease' },

  imgPreviewWrap: { marginTop: '0.85rem', position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #e0ddd6' },
  imgPreview: { width: '100%', height: 150, objectFit: 'cover', display: 'block' },
  imgDeleteBtn: { display: 'flex', alignItems: 'center', gap: 5, position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)', border: '1px solid #e0ddd6', borderRadius: 8, padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#555', backdropFilter: 'blur(4px)' },

  tipsCard: { marginTop: '1.25rem', background: 'rgba(184,149,106,0.07)', border: '1px solid rgba(184,149,106,0.18)', borderRadius: 12, padding: '0.9rem 1rem' },
  tipsHeader: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: '0.55rem' },
  tipsTitle: { fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(184,149,106,0.9)', fontWeight: 800 },
  tipsList: { margin: 0, paddingLeft: '1.1rem' },
  tipsItem: { fontSize: '0.82rem', color: '#7a6a50', lineHeight: 1.65, marginBottom: '0.25rem' },

  // Preview
  preview: { position: 'relative', width: '100%', height: 240, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', background: '#f5f3ef', marginBottom: '0.85rem' },
  previewImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  previewOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.22))' },
  previewFallbackGlow: { position: 'absolute', inset: '-30%', background: 'radial-gradient(circle at 35% 40%, rgba(184,149,106,0.2), transparent 55%)', filter: 'blur(14px)' },
  previewFallbackGrid: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3 },
  previewBadge: { position: 'absolute', left: 10, bottom: 10, padding: '0.3rem 0.65rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(0,0,0,0.08)', color: '#1a1a1a', backdropFilter: 'blur(6px)' },
  previewTextOverlay: { position: 'absolute', bottom: 34, left: 12, right: 12 },
  previewTextTitle: { margin: 0, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem', fontWeight: 400, color: 'rgba(255,255,255,0.88)', lineHeight: 1.3, textShadow: '0 1px 6px rgba(0,0,0,0.4)' },
  previewTitle: { margin: '0 0 0.4rem', fontWeight: 800, color: '#111', fontSize: '0.92rem' },
  previewSub: { margin: '0 0 1.1rem', color: '#888', lineHeight: 1.65, fontSize: '0.85rem' },

  btnPrimaryFull: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: '#111', color: '#fff', border: 'none', padding: '0.82rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
  btnGuardadoOkFull: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: '#1a6b3a', color: '#fff', border: 'none', padding: '0.82rem', borderRadius: '12px', cursor: 'default', fontSize: '0.9rem', fontWeight: 700 },
  uploadBox: {
    marginTop: 8,
    border: '1.5px dashed #d0ccc4',
    borderRadius: 12,
    background: '#faf9f6',
    overflow: 'hidden',
  },

  uploadBoxHasImage: {
    borderStyle: 'solid',
    borderColor: '#e0ddd6',
    background: '#fff',
  },

  uploadBoxLoading: {
    borderColor: '#b3dfc0',
    background: '#f4faf6',
  },

  uploadEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.25rem',
    cursor: 'pointer',
  },

  uploadFilled: {
    display: 'flex',
    gap: 12,
    padding: '0.9rem',
    alignItems: 'center',
  },

  uploadThumb: {
    width: 96,
    height: 64,
    borderRadius: 10,
    objectFit: 'cover',
    border: '1px solid #e0ddd6',
    flexShrink: 0,
  },

  uploadMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
    flex: 1,
  },

  uploadMetaTitle: {
    fontSize: '0.86rem',
    fontWeight: 800,
    color: '#111',
  },

  uploadMetaSub: {
    fontSize: '0.8rem',
    color: '#888',
    lineHeight: 1.4,
  },

  uploadActions: {
    display: 'flex',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },

  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '0.45rem 0.75rem',
    borderRadius: 10,
    cursor: 'pointer',
    border: '1px solid #e0ddd6',
    background: '#fff',
    color: '#1a1a1a',
    fontSize: '0.82rem',
    fontWeight: 800,
  },

  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '0.45rem 0.75rem',
    borderRadius: 10,
    cursor: 'pointer',
    border: '1px solid #f0c0b5',
    background: '#fdf0ee',
    color: '#8a3525',
    fontSize: '0.82rem',
    fontWeight: 800,
  },
}

export default HomeSettings