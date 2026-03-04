import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MagnifyingGlass, ArrowRight } from '@phosphor-icons/react'
import { useProductos } from '../hooks/useProductos'
import { CATEGORIAS } from '../constants/categorias'

const Catalogo = () => {
  const [params, setParams] = useSearchParams()
  const categoriaParam = params.get('categoria') || ''

  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('recientes') // recientes | precio-asc | precio-desc | az

  // Trae productos (si hay categoria, query en Firestore; si no, trae todos activos)
  const { productos, cargando, error } = useProductos({
    categoria: categoriaParam || undefined,
  })

  // Si cambia la categoría desde URL, limpiamos búsqueda (mejor UX)
  useEffect(() => {
    setBusqueda('')
  }, [categoriaParam])

  const categoriaLabel = useMemo(() => {
    if (!categoriaParam) return 'Todo'
    return CATEGORIAS.find((c) => c.value === categoriaParam)?.label || categoriaParam
  }, [categoriaParam])

  const productosProcesados = useMemo(() => {
    let list = Array.isArray(productos) ? [...productos] : []

    // Buscar (front-only)
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      list = list.filter((p) => (p.nombre || '').toLowerCase().includes(q))
    }

    // Ordenar (front-only)
    if (orden === 'precio-asc') {
      list.sort((a, b) => (Number(a.precio || 0) - Number(b.precio || 0)))
    } else if (orden === 'precio-desc') {
      list.sort((a, b) => (Number(b.precio || 0) - Number(a.precio || 0)))
    } else if (orden === 'az') {
      list.sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'))
    } else {
      // recientes: ya viene orderBy(creadoEn, desc) desde tu hook
      // igual dejamos estable por si cambia el backend luego
      list.sort((a, b) => {
        const ta = a.creadoEn?.seconds || 0
        const tb = b.creadoEn?.seconds || 0
        return tb - ta
      })
    }

    return list
  }, [productos, busqueda, orden])

  const cambiarCategoria = (value) => {
    if (!value) {
      params.delete('categoria')
      setParams(params, { replace: true })
      return
    }
    setParams({ categoria: value }, { replace: true })
  }

  return (
    <main style={s.page}>
      {/* Header */}
      <section style={s.header} className="anim-fade-up">
        <div>
          <p style={s.kicker}>Catálogo</p>
          <h1 style={s.title}>{categoriaLabel}</h1>
          <p style={s.sub}>
            Explorá la colección. Elegí talle, color, sumá al carrito y finalizá por WhatsApp.
          </p>
        </div>

        <Link to="/carrito" style={s.headerCta}>
          Ir al carrito <ArrowRight size={14} weight="bold" style={{ marginLeft: 8 }} />
        </Link>
      </section>

      {/* Chips de categorías */}
      <section style={s.chipsWrap} className="anim-fade-up">
        <button
          type="button"
          onClick={() => cambiarCategoria('')}
          style={{ ...s.chip, ...(categoriaParam === '' ? s.chipActive : {}) }}
        >
          Todo
        </button>

        {CATEGORIAS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => cambiarCategoria(c.value)}
            style={{ ...s.chip, ...(categoriaParam === c.value ? s.chipActive : {}) }}
          >
            {c.label}
          </button>
        ))}
      </section>

      {/* Filtros */}
      <section style={s.filters} className="anim-fade-up" aria-label="Filtros de catálogo">
        <div style={s.searchWrap}>
          <MagnifyingGlass size={16} weight="bold" style={s.searchIcon} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre..."
            style={s.search}
            aria-label="Buscar por nombre"
          />
        </div>

        <select
          value={categoriaParam}
          onChange={(e) => cambiarCategoria(e.target.value)}
          style={s.select}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select value={orden} onChange={(e) => setOrden(e.target.value)} style={s.select} aria-label="Ordenar">
          <option value="recientes">Más nuevos</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="az">Nombre: A–Z</option>
        </select>

        <div style={s.count} aria-label="Cantidad de resultados">
          {cargando ? 'Cargando…' : `${productosProcesados.length} resultado(s)`}
        </div>
      </section>

      {/* Estados */}
      {error && (
        <div style={s.errorBox} role="alert">
          Ocurrió un error al cargar productos: {error}
        </div>
      )}

      {cargando ? (
        <section style={s.grid} aria-label="Cargando productos">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={s.skeleton} className="anim-fade-in" />
          ))}
        </section>
      ) : productosProcesados.length === 0 ? (
        <section style={s.empty} className="anim-fade-up">
          <h2 style={s.emptyTitle}>No encontramos productos</h2>
          <p style={s.emptySub}>
            Probá con otra categoría o cambiá la búsqueda.
          </p>
          <div style={s.emptyActions}>
            <button type="button" onClick={() => { setBusqueda(''); setOrden('recientes'); }} style={s.btnGhost}>
              Limpiar filtros
            </button>
            <Link to="/" style={s.btnPrimary}>
              Volver al home
            </Link>
          </div>
        </section>
      ) : (
        <section style={s.grid} aria-label="Listado de productos">
          {productosProcesados.map((p) => (
            <Link key={p.id} to={`/producto/${p.id}`} style={s.card} className="anim-fade-up">
              <div style={s.imgWrap}>
                {p.imagenes?.[0] ? (
                  <img src={p.imagenes[0]} alt={p.nombre} style={s.img} loading="lazy" />
                ) : (
                  <div style={s.imgFallback} />
                )}
              </div>

              <div style={s.body}>
                <p style={s.name}>{p.nombre}</p>
                <div style={s.meta}>
                  <span style={s.price}>${(p.precio || 0).toLocaleString('es-AR')}</span>
                  <span style={s.dot}>•</span>
                  <span style={s.cat}>{labelCategoria(p.categoria)}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  )
}

const labelCategoria = (value) => {
  if (!value) return 'Colección'
  const c = CATEGORIAS.find((x) => x.value === value)
  return c?.label || value
}

const s = {
  page: { maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2.5rem 5rem' },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '1.25rem',
    flexWrap: 'wrap',
    marginBottom: '1.25rem',
  },
  kicker: {
    margin: 0,
    fontSize: '0.72rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 700,
  },
  title: {
    margin: '0.5rem 0 0.5rem',
    fontFamily: 'var(--font-display)',
    fontSize: '2.2rem',
    fontWeight: 400,
    color: 'var(--ink)',
  },
  sub: { margin: 0, color: 'var(--ink-2)', lineHeight: 1.75, maxWidth: '70ch' },

  headerCta: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.7)',
    color: 'var(--ink)',
    boxShadow: 'var(--shadow-sm)',
    fontSize: '0.9rem',
    fontWeight: 600,
  },

  chipsWrap: { display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.25rem' },
  chip: {
    padding: '0.6rem 0.9rem',
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.65)',
    color: 'var(--ink-2)',
    fontSize: '0.88rem',
    cursor: 'pointer',
  },
  chipActive: {
    background: 'rgba(184,149,106,0.14)',
    border: '1px solid rgba(184,149,106,0.30)',
    color: 'var(--accent-dark)',
    fontWeight: 700,
  },

  filters: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '1.25rem',
  },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 12, color: 'var(--ink-3)' },
  search: {
    width: '280px',
    padding: '0.7rem 0.9rem 0.7rem 2.25rem',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.7)',
    outline: 'none',
    fontSize: '0.92rem',
    color: 'var(--ink)',
  },
  select: {
    padding: '0.7rem 0.9rem',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.7)',
    outline: 'none',
    fontSize: '0.92rem',
    color: 'var(--ink)',
    cursor: 'pointer',
  },
  count: { marginLeft: 'auto', fontSize: '0.88rem', color: 'var(--ink-3)' },

  errorBox: {
    background: 'rgba(192,57,43,0.10)',
    border: '1px solid rgba(192,57,43,0.25)',
    color: '#8e2a22',
    padding: '0.9rem 1rem',
    borderRadius: '12px',
    marginBottom: '1rem',
  },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' },

  card: {
    borderRadius: '16px',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.72)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  imgWrap: { width: '100%', aspectRatio: '4 / 5', background: 'var(--bg-2)' },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgFallback: { width: '100%', height: '100%' },
  body: { padding: '0.9rem 1rem 1.1rem' },
  name: { margin: 0, fontSize: '0.95rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.35 },
  meta: { marginTop: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-3)' },
  price: { color: 'var(--ink)', fontWeight: 700, fontSize: '0.95rem' },
  dot: { opacity: 0.6 },
  cat: { fontSize: '0.82rem' },

  skeleton: {
    borderRadius: '16px',
    border: '1px solid var(--border)',
    background: 'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.07), rgba(0,0,0,0.04))',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.35s infinite',
    aspectRatio: '4 / 5',
  },

  empty: {
    borderRadius: '16px',
    border: '1px dashed var(--border-strong)',
    padding: '2rem',
    background: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  emptyTitle: { margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 400, color: 'var(--ink)' },
  emptySub: { margin: '0.6rem auto 1.5rem', maxWidth: '58ch', color: 'var(--ink-3)', lineHeight: 1.7 },
  emptyActions: { display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' },

  btnGhost: {
    background: 'transparent',
    border: '1px solid var(--border-strong)',
    padding: '0.85rem 1.1rem',
    borderRadius: '999px',
    cursor: 'pointer',
    color: 'var(--ink)',
    fontSize: '0.86rem',
    fontWeight: 600,
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
}

// Responsive mínimo (sin depender de CSS global)
if (typeof window !== 'undefined' && window.matchMedia) {
  if (window.matchMedia('(max-width: 980px)').matches) {
    s.grid.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))'
    s.count.marginLeft = 0
  }
  if (window.matchMedia('(max-width: 560px)').matches) {
    s.page.padding = '2.25rem 1.25rem 4rem'
    s.grid.gridTemplateColumns = '1fr'
    s.search.width = '100%'
  }
}

export default Catalogo