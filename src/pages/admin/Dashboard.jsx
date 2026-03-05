import { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProductosAdmin } from '../../hooks/useProductos'
import { CATEGORIAS } from '../../constants/categorias'
import {
  Plus,
  PencilSimple,
  Trash,
  SignOut,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  Star,
  Package,
  Image as ImageIcon,
} from '@phosphor-icons/react'

const Dashboard = () => {
  const { logout, usuario } = useAuth()
  const navigate = useNavigate()
  const { productos, cargando, eliminarProducto, toggleActivo } = useProductosAdmin()

  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('') // '' | 'activos' | 'inactivos'
  const [busqueda, setBusqueda] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const handleEliminar = async (id) => {
    await eliminarProducto(id)
    setConfirmDelete(null)
  }

  const limpiarFiltros = () => {
    setFiltroCategoria('')
    setFiltroEstado('')
    setBusqueda('')
  }

  const categoriaLabel = (value) => {
    if (!value) return 'Sin categoría'
    const found = CATEGORIAS.find((c) => c.value === value)
    if (found) return found.label
    // fallback para casos donde existan productos viejos con categorías nuevas (ej: "calzado")
    if (value === 'calzado') return 'Calzado'
    return value
  }

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()

    return productos.filter((p) => {
      const matchCategoria = filtroCategoria ? p.categoria === filtroCategoria : true
      const nombre = (p.nombre || '').toString().toLowerCase()
      const matchBusqueda = q ? nombre.includes(q) : true
      const matchEstado =
        filtroEstado === 'activos'
          ? p.activo === true
          : filtroEstado === 'inactivos'
            ? p.activo === false
            : true

      return matchCategoria && matchBusqueda && matchEstado
    })
  }, [productos, filtroCategoria, filtroEstado, busqueda])

  const stats = useMemo(() => {
    const total = productos.length
    const activos = productos.filter((p) => p.activo).length
    const inactivos = total - activos
    const destacados = productos.filter((p) => p.destacado).length
    return { total, activos, inactivos, destacados }
  }, [productos])

  return (
    <div style={s.root}>
      <aside style={s.sidebar}>
        <div style={s.logo}>claroscuro</div>

        {/* ✅ Menú real con 2 opciones */}
        <nav style={s.nav}>
          <NavLink
            to="/admin"
            end
            style={({ isActive }) => (isActive ? { ...s.navItem, ...s.navItemActive } : s.navItem)}
          >
            <Package size={18} weight="bold" style={{ marginRight: 10 }} />
            Gestión de Productos
          </NavLink>

          <NavLink
            to="/admin/home"
            style={({ isActive }) => (isActive ? { ...s.navItem, ...s.navItemActive } : s.navItem)}
          >
            <ImageIcon size={18} weight="bold" style={{ marginRight: 10 }} />
            Gestionar Banner Principal
          </NavLink>
        </nav>

        <div style={s.sidebarFooter}>
          <span style={s.emailText}>{usuario?.email}</span>
          <button onClick={handleLogout} style={s.logoutBtn}>
            <SignOut size={16} weight="bold" style={{ marginRight: 8 }} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={s.main}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Gestión de Productos</h1>
            <p style={s.subtitle}>Gestioná tu catálogo (crear, editar, activar/desactivar).</p>
          </div>

          <button onClick={() => navigate('/admin/nuevo')} style={s.btnPrimary}>
            <Plus size={16} weight="bold" style={{ marginRight: 8 }} />
            Nuevo producto
          </button>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <p style={s.statLabel}>Total</p>
            <p style={s.statValue}>{stats.total}</p>
          </div>
          <div style={s.statCard}>
            <p style={s.statLabel}>Activos</p>
            <p style={s.statValue}>{stats.activos}</p>
          </div>
          <div style={s.statCard}>
            <p style={s.statLabel}>Inactivos</p>
            <p style={s.statValue}>{stats.inactivos}</p>
          </div>
          <div style={s.statCard}>
            <p style={s.statLabel}>Destacados</p>
            <p style={s.statValue}>{stats.destacados}</p>
          </div>
        </div>

        {/* Filtros */}
        <div style={s.filtros}>
          <div style={s.searchWrap}>
            <MagnifyingGlass size={16} weight="bold" style={s.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={s.inputBusqueda}
              aria-label="Buscar por nombre"
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            style={s.select}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
            {/* Seguridad por si aún no estaba en constants */}
            {!CATEGORIAS.some((c) => c.value === 'calzado') && <option value="calzado">Calzado</option>}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={s.select}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>

          <button onClick={limpiarFiltros} style={s.btnGhost} type="button">
            Limpiar
          </button>
        </div>

        {/* Tabla / estados */}
        {cargando ? (
          <div style={s.loading}>Cargando productos...</div>
        ) : productosFiltrados.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyTitle}>No hay productos con esos filtros.</p>
            <p style={s.emptySub}>Probá limpiar filtros o creá un producto nuevo.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={limpiarFiltros} style={s.btnGhostLg} type="button">
                Limpiar filtros
              </button>
              <button onClick={() => navigate('/admin/nuevo')} style={s.btnPrimaryLg} type="button">
                Crear producto
              </button>
            </div>
          </div>
        ) : (
          <div style={s.tableWrapper}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Imagen</th>
                  <th style={s.th}>Nombre</th>
                  <th style={s.th}>Categoría</th>
                  <th style={s.th}>Precio</th>
                  <th style={s.th}>Destacado</th>
                  <th style={s.th}>Estado</th>
                  <th style={s.thRight}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {productosFiltrados.map((p) => {
                  const catLabel = categoriaLabel(p.categoria)

                  return (
                    <tr key={p.id} style={s.tr}>
                      <td style={s.td}>
                        {p.imagenes?.[0] ? (
                          <img src={p.imagenes[0]} alt={p.nombre} style={s.thumbnail} loading="lazy" />
                        ) : (
                          <div style={s.noImage}>Sin imagen</div>
                        )}
                      </td>

                      <td style={s.td}>
                        <button
                          style={s.linkName}
                          onClick={() => navigate(`/admin/editar/${p.id}`)}
                          title="Editar producto"
                          type="button"
                        >
                          {p.nombre || '(Sin nombre)'}
                        </button>
                      </td>

                      <td style={s.td}>
                        <span style={s.badge}>{catLabel}</span>
                      </td>

                      <td style={s.td}>${(p.precio || 0).toLocaleString('es-AR')}</td>

                      <td style={s.td}>
                        {p.destacado ? (
                          <span style={s.badgeStar}>
                            <Star size={14} weight="fill" style={{ marginRight: 6 }} />
                            Sí
                          </span>
                        ) : (
                          <span style={s.muted}>—</span>
                        )}
                      </td>

                      <td style={s.td}>
                        <button
                          onClick={() => toggleActivo(p.id, p.activo)}
                          style={p.activo ? s.badgeActivo : s.badgeInactivo}
                          title="Cambiar estado"
                          type="button"
                        >
                          {p.activo ? (
                            <>
                              <CheckCircle size={14} weight="fill" style={{ marginRight: 6 }} />
                              Activo
                            </>
                          ) : (
                            <>
                              <XCircle size={14} weight="fill" style={{ marginRight: 6 }} />
                              Inactivo
                            </>
                          )}
                        </button>
                      </td>

                      <td style={s.tdRight}>
                        <div style={s.acciones}>
                          <button
                            onClick={() => navigate(`/admin/editar/${p.id}`)}
                            style={s.btnEdit}
                            aria-label={`Editar ${p.nombre || 'producto'}`}
                            title="Editar"
                            type="button"
                          >
                            <PencilSimple size={16} weight="bold" />
                          </button>

                          <button
                            onClick={() => setConfirmDelete(p.id)}
                            style={s.btnDelete}
                            aria-label={`Eliminar ${p.nombre || 'producto'}`}
                            title="Eliminar"
                            type="button"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal delete */}
      {confirmDelete && (
        <div style={s.overlay} role="dialog" aria-modal="true" aria-label="Confirmar eliminación">
          <div style={s.modal}>
            <h3 style={s.modalTitle}>¿Eliminar producto?</h3>
            <p style={s.modalSub}>Esta acción no se puede deshacer.</p>

            <div style={s.modalActions}>
              <button onClick={() => handleEliminar(confirmDelete)} style={s.btnDeleteConfirm} type="button">
                Sí, eliminar
              </button>
              <button onClick={() => setConfirmDelete(null)} style={s.btnCancelConfirm} type="button">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
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

  // Sidebar
  sidebar: {
    width: '240px',
    background: '#1a1a1a',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem 1.5rem',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  logo: {
    fontFamily: 'Georgia, serif',
    fontSize: '1.4rem',
    letterSpacing: '0.05em',
    marginBottom: '2.0rem',
  },
  nav: { flex: 1, display: 'grid', gap: 8 },

  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.65rem 0.75rem',
    borderRadius: '10px',
    fontSize: '0.92rem',
    color: '#fff',
    textDecoration: 'none',
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'transparent',
  },
  navItemActive: {
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.18)',
  },

  sidebarFooter: { borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' },
  emailText: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#aaa',
    marginBottom: '0.75rem',
    wordBreak: 'break-all',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    borderRadius: '10px',
    fontSize: '0.82rem',
    width: '100%',
  },

  // Main
  main: { flex: 1, padding: '2rem 2.5rem', overflowX: 'auto' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  title: { margin: '0 0 0.25rem', fontSize: '1.8rem', fontWeight: 700, color: '#1a1a1a' },
  subtitle: { margin: 0, color: '#666', fontSize: '0.9rem' },

  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.15rem',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    boxShadow: '0 6px 18px rgba(0,0,0,0.10)',
  },

  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  statCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '0.9rem 1rem',
    boxShadow: '0 1px 10px rgba(0,0,0,0.05)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  statLabel: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#777',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  statValue: { margin: '0.35rem 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#1a1a1a' },

  // Filtros
  filtros: { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 12, color: '#888' },
  inputBusqueda: {
    padding: '0.65rem 0.9rem 0.65rem 2.25rem',
    border: '1px solid #ddd',
    borderRadius: '10px',
    fontSize: '0.9rem',
    width: '280px',
    background: '#fff',
    outline: 'none',
  },
  select: {
    padding: '0.65rem 0.9rem',
    border: '1px solid #ddd',
    borderRadius: '10px',
    fontSize: '0.9rem',
    background: '#fff',
    outline: 'none',
    cursor: 'pointer',
  },
  btnGhost: {
    background: 'transparent',
    border: '1px solid #ddd',
    padding: '0.62rem 0.9rem',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },

  // Table
  tableWrapper: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '0.9rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#777',
    borderBottom: '1px solid #f0f0f0',
    background: '#fafafa',
  },
  thRight: {
    textAlign: 'right',
    padding: '0.9rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#777',
    borderBottom: '1px solid #f0f0f0',
    background: '#fafafa',
  },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '0.85rem 1rem', fontSize: '0.92rem', color: '#1a1a1a', verticalAlign: 'middle' },
  tdRight: {
    padding: '0.85rem 1rem',
    fontSize: '0.92rem',
    color: '#1a1a1a',
    verticalAlign: 'middle',
    textAlign: 'right',
  },

  linkName: {
    background: 'transparent',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    fontWeight: 700,
    color: '#1a1a1a',
    textAlign: 'left',
  },

  thumbnail: { width: '52px', height: '52px', objectFit: 'cover', borderRadius: '10px', display: 'block' },
  noImage: {
    width: '52px',
    height: '52px',
    background: '#f0f0f0',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.65rem',
    color: '#aaa',
  },

  badge: { background: '#f3f3f3', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', color: '#333' },
  badgeStar: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#fff7e6',
    color: '#a05a00',
    padding: '0.25rem 0.65rem',
    borderRadius: '999px',
    fontSize: '0.78rem',
    border: '1px solid #ffe3b5',
  },
  muted: { color: '#999' },

  badgeActivo: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#e8f5e9',
    color: '#2e7d32',
    border: '1px solid #c8e6c9',
    padding: '0.35rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontWeight: 800,
  },
  badgeInactivo: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#fce4ec',
    color: '#c62828',
    border: '1px solid #f8bbd0',
    padding: '0.35rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontWeight: 800,
  },

  acciones: { display: 'inline-flex', gap: '0.5rem' },
  btnEdit: {
    background: 'transparent',
    border: '1px solid #ddd',
    width: 38,
    height: 38,
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDelete: {
    background: 'transparent',
    border: '1px solid #ffcdd2',
    color: '#c62828',
    width: 38,
    height: 38,
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // States
  loading: { padding: '3rem', textAlign: 'center', color: '#666' },
  empty: {
    padding: '4rem 1.5rem',
    textAlign: 'center',
    color: '#666',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  emptyTitle: { margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1a1a1a' },
  emptySub: { margin: '0.5rem 0 1.25rem', fontSize: '0.92rem', color: '#666', lineHeight: 1.5 },
  btnGhostLg: { background: 'transparent', border: '1px solid #ddd', padding: '0.75rem 1.1rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem' },
  btnPrimaryLg: { background: '#1a1a1a', color: '#fff', border: 'none', padding: '0.75rem 1.1rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 },

  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal: { background: '#fff', padding: '1.5rem', borderRadius: '14px', minWidth: '320px', maxWidth: '420px', width: '100%', boxShadow: '0 18px 50px rgba(0,0,0,0.22)' },
  modalTitle: { margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1a1a1a' },
  modalSub: { color: '#666', margin: '0.5rem 0 1.25rem', fontSize: '0.92rem', lineHeight: 1.45 },
  modalActions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' },
  btnDeleteConfirm: { background: '#c62828', color: '#fff', border: 'none', padding: '0.7rem 1.0rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 800 },
  btnCancelConfirm: { background: '#f5f5f5', color: '#1a1a1a', border: '1px solid #e6e6e6', padding: '0.7rem 1.0rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 },
}

// Responsive mínimo (sin tocar tu CSS global)
if (typeof window !== 'undefined' && window.matchMedia) {
  if (window.matchMedia('(max-width: 980px)').matches) s.statsRow.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))'
  if (window.matchMedia('(max-width: 560px)').matches) s.statsRow.gridTemplateColumns = '1fr'
}

export default Dashboard