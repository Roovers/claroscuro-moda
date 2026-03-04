import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProductosAdmin, subirImagenCloudinary } from '../../hooks/useProductos'
import { CATEGORIAS, TALLES, COLORES_PRESET } from '../../constants/categorias'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'

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

const TALLES_CALZADO = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']

const ProductoForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { crearProducto, actualizarProducto } = useProductosAdmin()
  const esEdicion = Boolean(id)

  const [form, setForm] = useState(INITIAL_FORM)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [cargandoProducto, setCargandoProducto] = useState(esEdicion)

  // Categorías extendidas (sumamos calzado si no existe)
  const categoriasExt = useMemo(() => {
    const existeCalzado = CATEGORIAS.some((c) => c.value === 'calzado')
    return existeCalzado ? CATEGORIAS : [...CATEGORIAS, { value: 'calzado', label: 'Calzado' }]
  }, [])

  const esCalzado = form.categoria === 'calzado'
  const tallesDisponibles = esCalzado ? TALLES_CALZADO : TALLES

  // Cargar producto si es edición
  useEffect(() => {
    if (!esEdicion) return
    const cargar = async () => {
      try {
        const docRef = doc(db, 'productos', id)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const data = snap.data()
          setForm({
            nombre: data.nombre || '',
            descripcion: data.descripcion || '',
            precio: data.precio || '',
            categoria: data.categoria || '',
            destacado: data.destacado || false,
            activo: data.activo ?? true,
            imagenes: data.imagenes || [],
            variantes: data.variantes || { talles: [], colores: [] },
          })
        }
      } catch (e) {
        setError('Error al cargar el producto')
      } finally {
        setCargandoProducto(false)
      }
    }
    cargar()
  }, [id, esEdicion])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    // Si cambia categoría, reseteamos talles para evitar mezclar XS/S/M con 38/39/etc
    if (name === 'categoria') {
      setForm((prev) => ({
        ...prev,
        categoria: value,
        variantes: {
          ...prev.variantes,
          talles: [],
        },
      }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  // Talles
  const toggleTalle = (talle) => {
    setForm((prev) => {
      const talles = prev.variantes.talles.includes(talle)
        ? prev.variantes.talles.filter((t) => t !== talle)
        : [...prev.variantes.talles, talle]
      return { ...prev, variantes: { ...prev.variantes, talles } }
    })
  }

  // Colores
  const toggleColor = (color) => {
    setForm((prev) => {
      const existe = prev.variantes.colores.find((c) => c.nombre === color.nombre)
      const colores = existe
        ? prev.variantes.colores.filter((c) => c.nombre !== color.nombre)
        : [...prev.variantes.colores, color]
      return { ...prev, variantes: { ...prev.variantes, colores } }
    })
  }

  // Subir imagen
  const handleImagenUpload = async (e) => {
    const archivos = Array.from(e.target.files)
    if (!archivos.length) return
    setSubiendoImagen(true)
    try {
      const urls = await Promise.all(archivos.map((a) => subirImagenCloudinary(a)))
      setForm((prev) => ({ ...prev, imagenes: [...prev.imagenes, ...urls] }))
    } catch {
      setError('Error al subir imagen. Verificá tu configuración de Cloudinary.')
    } finally {
      setSubiendoImagen(false)
    }
  }

  const eliminarImagen = (url) => {
    setForm((prev) => ({ ...prev, imagenes: prev.imagenes.filter((i) => i !== url) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.nombre || !form.precio || !form.categoria) {
      setError('Nombre, precio y categoría son obligatorios.')
      return
    }

    // Reglas mínimas para que el cliente no cargue productos incompletos
    if (form.imagenes.length === 0) {
      setError('Cargá al menos 1 imagen.')
      return
    }
    if (form.variantes.talles.length === 0) {
      setError(esCalzado ? 'Seleccioná al menos 1 talle numérico.' : 'Seleccioná al menos 1 talle.')
      return
    }
    if (form.variantes.colores.length === 0) {
      setError('Seleccioná al menos 1 color.')
      return
    }

    setGuardando(true)
    try {
      const datos = { ...form, precio: Number(form.precio) }
      if (esEdicion) {
        await actualizarProducto(id, datos)
      } else {
        await crearProducto(datos)
      }
      navigate('/admin')
    } catch {
      setError('Error al guardar el producto. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  if (cargandoProducto) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando...</div>

  return (
    <div style={s.root}>
      <aside style={s.sidebar}>
        <div style={s.logo}>claroscuro</div>
        <nav style={s.nav}>
          <span onClick={() => navigate('/admin')} style={s.navItem}>
            ← Volver a productos
          </span>
        </nav>
      </aside>

      <main style={s.main}>
        <h1 style={s.title}>{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h1>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          {/* Columna izquierda */}
          <div style={s.col}>
            <div style={s.card}>
              <h2 style={s.cardTitle}>Información general</h2>

              <label style={s.label}>Nombre *</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                style={s.input}
                placeholder="Ej: Sweater Amelia"
                required
              />

              <label style={s.label}>Descripción</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                style={s.textarea}
                placeholder="Descripción del producto..."
                rows={4}
              />

              <div style={s.row}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Precio (ARS) *</label>
                  <input
                    name="precio"
                    type="number"
                    value={form.precio}
                    onChange={handleChange}
                    style={s.input}
                    placeholder="39900"
                    required
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={s.label}>Categoría *</label>
                  <select
                    name="categoria"
                    value={form.categoria}
                    onChange={handleChange}
                    style={s.select}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {categoriasExt.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={s.checkRow}>
                <label style={s.checkLabel}>
                  <input
                    type="checkbox"
                    name="destacado"
                    checked={form.destacado}
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Producto destacado (aparece en el Home)
                </label>

                <label style={s.checkLabel}>
                  <input
                    type="checkbox"
                    name="activo"
                    checked={form.activo}
                    onChange={handleChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Activo (visible en la tienda)
                </label>
              </div>
            </div>

            {/* Talles */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>
                Talles disponibles {esCalzado ? '(Calzado)' : ''}
              </h2>

              {form.categoria === '' ? (
                <p style={s.helper}>
                  Elegí primero una categoría para seleccionar talles.
                </p>
              ) : (
                <>
                  <p style={s.helper}>
                    {esCalzado
                      ? 'Seleccioná talles numéricos (ej: 38, 39, 40).'
                      : 'Seleccioná talles de prenda (XS, S, M, ...).'}
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
                </>
              )}
            </div>

            {/* Colores */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Colores disponibles</h2>
              <div style={s.coloresGrid}>
                {COLORES_PRESET.map((c) => {
                  const seleccionado = form.variantes.colores.find((x) => x.nombre === c.nombre)
                  return (
                    <button
                      key={c.nombre}
                      type="button"
                      onClick={() => toggleColor(c)}
                      style={{
                        ...s.colorBtn,
                        outline: seleccionado ? `3px solid #1a1a1a` : '3px solid transparent',
                        outlineOffset: '2px',
                      }}
                      title={c.nombre}
                    >
                      <span style={{ ...s.colorCircle, background: c.hex }} />
                      <span style={s.colorNombre}>{c.nombre}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Columna derecha — Imágenes */}
          <div style={s.colRight}>
            <div style={s.card}>
              <h2 style={s.cardTitle}>Imágenes</h2>

              <label style={s.uploadArea}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagenUpload}
                  style={{ display: 'none' }}
                  disabled={subiendoImagen}
                />
                <span style={s.uploadIcon}>📷</span>
                <span style={s.uploadText}>{subiendoImagen ? 'Subiendo...' : 'Clic para subir imágenes'}</span>
                <span style={s.uploadSub}>JPG, PNG, WEBP</span>
              </label>

              {form.imagenes.length > 0 && (
                <div style={s.imagenesGrid}>
                  {form.imagenes.map((url, i) => (
                    <div key={url} style={s.imagenWrapper}>
                      <img src={url} alt={`img-${i}`} style={s.imagenPreview} />
                      {i === 0 && <span style={s.imagenPrincipal}>Principal</span>}
                      <button type="button" onClick={() => eliminarImagen(url)} style={s.imagenDelete}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p style={s.imagenHint}>La primera imagen es la principal.</p>
            </div>

            {/* Acciones */}
            <div style={s.acciones}>
              <button type="submit" style={s.btnGuardar} disabled={guardando}>
                {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
              </button>
              <button type="button" onClick={() => navigate('/admin')} style={s.btnCancelar}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

const s = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f5f5f0',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  sidebar: {
    width: '220px',
    background: '#1a1a1a',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem 1.5rem',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  logo: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.05em', marginBottom: '2.5rem' },
  nav: { flex: 1 },
  navItem: { display: 'block', padding: '0.6rem 0.75rem', color: '#aaa', fontSize: '0.9rem', cursor: 'pointer' },

  main: { flex: 1, padding: '2rem 2.5rem', overflowX: 'auto' },
  title: { margin: '0 0 1.5rem', fontSize: '1.6rem', fontWeight: '600' },

  errorBox: {
    background: '#fdecea',
    color: '#c62828',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    fontSize: '0.92rem',
  },

  form: { display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' },
  col: { flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 320 },
  colRight: { flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 280 },

  card: { background: '#fff', border: '1px solid #e6e3dc', borderRadius: '10px', padding: '1.25rem' },
  cardTitle: { margin: '0 0 1rem', fontSize: '1rem', fontWeight: '700' },

  label: { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' },
  input: { width: '100%', padding: '0.75rem', border: '1px solid #dedbd3', borderRadius: '8px', marginBottom: '0.9rem' },
  textarea: { width: '100%', padding: '0.75rem', border: '1px solid #dedbd3', borderRadius: '8px', marginBottom: '0.9rem', resize: 'vertical' },
  select: { width: '100%', padding: '0.75rem', border: '1px solid #dedbd3', borderRadius: '8px' },

  row: { display: 'flex', gap: '1rem', marginTop: '0.25rem' },

  checkRow: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '1rem' },
  checkLabel: { fontSize: '0.9rem', color: '#333', display: 'flex', alignItems: 'center' },

  helper: { margin: '0 0 0.9rem', color: '#666', fontSize: '0.9rem', lineHeight: 1.5 },

  tallesGrid: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  talle: { padding: '0.5rem 0.9rem', border: '1px solid #dedbd3', background: '#fff', borderRadius: '8px', cursor: 'pointer' },
  talleActivo: { padding: '0.5rem 0.9rem', border: '1px solid #1a1a1a', background: '#1a1a1a', color: '#fff', borderRadius: '8px', cursor: 'pointer' },

  coloresGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem' },
  colorBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.55rem 0.7rem',
    borderRadius: '10px',
    border: '1px solid #e6e3dc',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
  },
  colorCircle: { width: 16, height: 16, borderRadius: 999, border: '1px solid rgba(0,0,0,0.15)' },
  colorNombre: { fontSize: '0.9rem', color: '#333' },

  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.25rem',
    border: '1px dashed #cfcac0',
    borderRadius: '10px',
    cursor: 'pointer',
    background: '#faf9f6',
  },
  uploadIcon: { fontSize: '1.6rem' },
  uploadText: { marginTop: '0.35rem', fontWeight: 700 },
  uploadSub: { marginTop: '0.2rem', fontSize: '0.85rem', color: '#777' },

  imagenesGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', marginTop: '1rem' },
  imagenWrapper: { position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e6e3dc' },
  imagenPreview: { width: '100%', height: 140, objectFit: 'cover', display: 'block' },
  imagenPrincipal: { position: 'absolute', left: 8, top: 8, background: '#1a1a1a', color: '#fff', fontSize: '0.72rem', padding: '0.2rem 0.45rem', borderRadius: 6 },
  imagenDelete: { position: 'absolute', right: 8, top: 8, background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '0.2rem 0.45rem', cursor: 'pointer' },
  imagenHint: { marginTop: '0.75rem', fontSize: '0.88rem', color: '#666' },

  acciones: { display: 'flex', gap: '0.75rem' },
  btnGuardar: { flex: 1, padding: '0.95rem', border: 'none', background: '#1a1a1a', color: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 },
  btnCancelar: { flex: 1, padding: '0.95rem', border: '1px solid #dedbd3', background: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 },
}

export default ProductoForm