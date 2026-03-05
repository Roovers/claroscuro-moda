import { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProductosAdminPaginados, cloudinaryThumb } from '../../hooks/useProductosPaginados'
import { useProductosAdmin } from '../../hooks/useProductos'
import { CATEGORIAS } from '../../constants/categorias'
import {
  Plus, PencilSimple, Trash, SignOut, MagnifyingGlass, CheckCircle,
  XCircle, Star, Package, Image as ImageIcon, CaretLeft, CaretRight,
  Warning,
} from '@phosphor-icons/react'
import { updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

/* ─────────────────────────────────────────────────────────────────────────── */
/*  SHARED ADMIN SIDEBAR                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
export const AdminSidebar = ({ usuario, onLogout }) => {
  const initial = (usuario?.email || 'A')[0].toUpperCase()
  return (
    <aside style={s.sidebar}>
      {/* Avatar + brand */}
      <div style={s.sidebarTop}>
        <div style={s.avatar}>{initial}</div>
        <div>
          <div style={s.logo}>claroscuro</div>
          <div style={s.sidebarRole}>Panel de administración</div>
        </div>
      </div>

      <div style={s.sidebarDivider} />

      <nav style={s.nav}>
        <NavLink
          to="/admin"
          end
          style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navItemActive : {}) })}
        >
          <Package size={16} weight={useNavActive('/admin') ? 'fill' : 'regular'} style={s.navIcon} />
          Productos
        </NavLink>
        <NavLink
          to="/admin/home"
          style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navItemActive : {}) })}
        >
          <ImageIcon size={16} weight="regular" style={s.navIcon} />
          Banner principal
        </NavLink>
      </nav>

      <div style={s.sidebarFooter}>
        <p style={s.emailText} title={usuario?.email}>{usuario?.email}</p>
        <button onClick={onLogout} style={s.logoutBtn} type="button">
          <SignOut size={14} weight="bold" style={{ marginRight: 7 }} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

// helper mínimo para peso del ícono activo (no usa hook real, solo estilo)
const useNavActive = () => false

/* ─────────────────────────────────────────────────────────────────────────── */
/*  DASHBOARD                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
const Dashboard = () => {
  const { logout, usuario } = useAuth()
  const navigate = useNavigate()

  // Usamos el hook paginado para el listado
  const {
    productos,
    cargando,
    paginaActual,
    hayMas,
    hayAnterior,
    siguiente,
    anterior,
    actualizarEnMemoria,
    eliminarDeMemoria,
    refetch,
  } = useProductosAdminPaginados({ pageSize: 15 })

  // Para las estadísticas globales usamos una query liviana del hook existente
  const { productos: todosParaStats } = useProductosAdmin()

  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null) // { id, nombre }
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const handleLogout = async () => { await logout(); navigate('/admin/login') }

  const handleToggleActivo = async (p) => {
    setTogglingId(p.id)
    try {
      await updateDoc(doc(db, 'productos', p.id), {
        activo: !p.activo,
        actualizadoEn: serverTimestamp(),
      })
      actualizarEnMemoria(p.id, { activo: !p.activo })
    } catch (e) {
      console.error('Error toggle activo:', e)
    } finally {
      setTogglingId(null)
    }
  }

  const handleEliminar = async () => {
    if (!confirmDelete) return
    setDeletingId(confirmDelete.id)
    try {
      await deleteDoc(doc(db, 'productos', confirmDelete.id))
      eliminarDeMemoria(confirmDelete.id)
    } catch (e) {
      console.error('Error eliminando:', e)
      refetch()
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  const limpiarFiltros = () => { setFiltroCategoria(''); setFiltroEstado(''); setBusqueda('') }

  const categoriaLabel = (value) => {
    if (!value) return 'Sin categoría'
    return CATEGORIAS.find((c) => c.value === value)?.label || value
  }

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      const matchCat = filtroCategoria ? p.categoria === filtroCategoria : true
      const matchBusq = q ? (p.nombre || '').toLowerCase().includes(q) : true
      const matchEst =
        filtroEstado === 'activos' ? p.activo === true
        : filtroEstado === 'inactivos' ? p.activo === false
        : true
      return matchCat && matchBusq && matchEst
    })
  }, [productos, filtroCategoria, filtroEstado, busqueda])

  const stats = useMemo(() => {
    const total = todosParaStats.length
    const activos = todosParaStats.filter((p) => p.activo).length
    const inactivos = total - activos
    const destacados = todosParaStats.filter((p) => p.destacado).length
    return { total, activos, inactivos, destacados }
  }, [todosParaStats])

  return (
    <div style={s.root}>
      <AdminSidebar usuario={usuario} onLogout={handleLogout} />

      <main style={s.main}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Gestión de Productos</h1>
            <p style={s.subtitle}>Gestioná tu catálogo · página {paginaActual + 1}</p>
          </div>
          <button onClick={() => navigate('/admin/nuevo')} style={s.btnPrimary} type="button">
            <Plus size={15} weight="bold" style={{ marginRight: 7 }} />
            Nuevo producto
          </button>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: 'Total', value: stats.total, color: '#1a1a1a' },
            { label: 'Activos', value: stats.activos, color: '#1a6b3a' },
            { label: 'Inactivos', value: stats.inactivos, color: '#8a3525' },
            { label: 'Destacados', value: stats.destacados, color: '#7a5218' },
          ].map(({ label, value, color }) => (
            <div key={label} style={s.statCard}>
              <p style={s.statLabel}>{label}</p>
              <p style={{ ...s.statValue, color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={s.filtros}>
          <div style={s.searchWrap}>
            <MagnifyingGlass size={15} weight="bold" style={s.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={s.inputBusqueda}
            />
          </div>

          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={s.select}>
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={s.select}>
            <option value="">Todos los estados</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>

          <button onClick={limpiarFiltros} style={s.btnGhost} type="button">Limpiar</button>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div style={s.loadingWrap}>
            <div style={s.loadingSpinner} />
            <span style={s.loadingText}>Cargando productos…</span>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyTitle}>No hay productos con esos filtros.</p>
            <p style={s.emptySub}>Probá limpiar filtros o creá un producto nuevo.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={limpiarFiltros} style={s.btnGhostLg} type="button">Limpiar filtros</button>
              <button onClick={() => navigate('/admin/nuevo')} style={s.btnPrimaryLg} type="button">Crear producto</button>
            </div>
          </div>
        ) : (
          <div style={s.tableWrapper}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Imagen</th>
                  <th style={s.th}>Producto</th>
                  <th style={s.th}>Categoría</th>
                  <th style={s.th}>Precio</th>
                  <th style={s.th}>Dest.</th>
                  <th style={s.th}>Estado</th>
                  <th style={s.thRight}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((p) => (
                  <tr key={p.id} style={s.tr}>
                    {/* Imagen */}
                    <td style={s.td}>
                      {p.imagenes?.[0] ? (
                        <img
                          src={cloudinaryThumb(p.imagenes[0], 120)}
                          alt={p.nombre}
                          style={s.thumbnail}
                          loading="lazy"
                        />
                      ) : (
                        <div style={s.noImage}>—</div>
                      )}
                    </td>

                    {/* Nombre + descripcion truncada */}
                    <td style={s.td}>
                      <button
                        style={s.linkName}
                        onClick={() => navigate(`/admin/editar/${p.id}`)}
                        type="button"
                        title="Editar"
                      >
                        {p.nombre || '(Sin nombre)'}
                      </button>
                      {p.descripcion && (
                        <p style={s.tdDesc}>
                          {p.descripcion.length > 55 ? p.descripcion.slice(0, 55) + '…' : p.descripcion}
                        </p>
                      )}
                    </td>

                    {/* Categoría */}
                    <td style={s.td}>
                      <span style={s.badge}>{categoriaLabel(p.categoria)}</span>
                    </td>

                    {/* Precio */}
                    <td style={s.td}>
                      <span style={s.price}>${(p.precio || 0).toLocaleString('es-AR')}</span>
                    </td>

                    {/* Destacado */}
                    <td style={s.td}>
                      {p.destacado
                        ? <span style={s.badgeStar}><Star size={12} weight="fill" style={{ marginRight: 4 }} />Sí</span>
                        : <span style={s.muted}>—</span>
                      }
                    </td>

                    {/* Estado toggle */}
                    <td style={s.td}>
                      <button
                        onClick={() => handleToggleActivo(p)}
                        style={p.activo ? s.badgeActivo : s.badgeInactivo}
                        disabled={togglingId === p.id}
                        type="button"
                        title="Cambiar estado"
                      >
                        {togglingId === p.id ? (
                          <span style={s.spinnerInline} />
                        ) : p.activo ? (
                          <><CheckCircle size={13} weight="fill" style={{ marginRight: 5 }} />Activo</>
                        ) : (
                          <><XCircle size={13} weight="fill" style={{ marginRight: 5 }} />Inactivo</>
                        )}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td style={s.tdRight}>
                      <div style={s.acciones}>
                        <button
                          onClick={() => navigate(`/admin/editar/${p.id}`)}
                          style={s.btnEdit}
                          type="button"
                          title="Editar"
                          aria-label={`Editar ${p.nombre}`}
                        >
                          <PencilSimple size={15} weight="bold" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ id: p.id, nombre: p.nombre })}
                          style={s.btnDelete}
                          type="button"
                          title="Eliminar"
                          aria-label={`Eliminar ${p.nombre}`}
                        >
                          <Trash size={15} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!cargando && (hayAnterior || hayMas) && (
          <div style={s.pagination}>
            <button
              type="button"
              onClick={anterior}
              disabled={!hayAnterior || cargando}
              style={{ ...s.pageBtn, ...(!hayAnterior ? s.pageBtnDisabled : {}) }}
            >
              <CaretLeft size={13} weight="bold" style={{ marginRight: 5 }} />
              Anterior
            </button>
            <span style={s.pageIndicator}>Página {paginaActual + 1}</span>
            <button
              type="button"
              onClick={siguiente}
              disabled={!hayMas || cargando}
              style={{ ...s.pageBtn, ...(!hayMas ? s.pageBtnDisabled : {}) }}
            >
              Siguiente
              <CaretRight size={13} weight="bold" style={{ marginLeft: 5 }} />
            </button>
          </div>
        )}
      </main>

      {/* Modal eliminar */}
      {confirmDelete && (
        <div style={s.overlay} role="dialog" aria-modal="true">
          <div style={s.modal}>
            <div style={s.modalIconWrap}>
              <Warning size={22} weight="fill" style={{ color: '#c62828' }} />
            </div>
            <h3 style={s.modalTitle}>¿Eliminar producto?</h3>
            <p style={s.modalSub}>
              Vas a eliminar <strong>{confirmDelete.nombre || 'este producto'}</strong>. Esta acción no se puede deshacer.
            </p>
            <div style={s.modalActions}>
              <button onClick={() => setConfirmDelete(null)} style={s.btnCancelConfirm} type="button" disabled={!!deletingId}>
                Cancelar
              </button>
              <button onClick={handleEliminar} style={s.btnDeleteConfirm} type="button" disabled={!!deletingId}>
                {deletingId ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STYLES                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */
const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f4f3ef', fontFamily: "'Helvetica Neue', Arial, sans-serif" },

  // Sidebar
  sidebar: { width: '256px', background: '#111', color: '#fff', display: 'flex', flexDirection: 'column', padding: '1.75rem 1.5rem', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },
  sidebarTop: { display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem' },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: 'rgba(184,149,106,0.25)', border: '1px solid rgba(184,149,106,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700, color: 'rgba(184,149,106,0.9)', flexShrink: 0, letterSpacing: '0.02em' },
  logo: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.15rem', letterSpacing: '0.06em', color: 'rgba(247,244,239,0.88)', lineHeight: 1 },
  sidebarRole: { fontSize: '0.68rem', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.2rem' },
  sidebarDivider: { height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: '1.25rem' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: { display: 'flex', alignItems: 'center', padding: '0.62rem 0.75rem', borderRadius: '8px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'background 0.15s, color 0.15s', letterSpacing: '0.01em' },
  navItemActive: { background: 'rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.92)', fontWeight: 600 },
  navIcon: { marginRight: 10, flexShrink: 0, opacity: 0.75 },
  sidebarFooter: { borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem', marginTop: '0.5rem' },
  emailText: { margin: '0 0 0.75rem', fontSize: '0.73rem', color: 'rgba(255,255,255,0.3)', wordBreak: 'break-all', lineHeight: 1.4 },
  logoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)', padding: '0.5rem 0.75rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.8rem', width: '100%', transition: 'border-color 0.15s, color 0.15s' },

  // Main
  main: { flex: 1, padding: '2rem 2.5rem', overflowX: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  title: { margin: '0 0 0.2rem', fontSize: '1.65rem', fontWeight: 800, color: '#111', letterSpacing: '-0.02em' },
  subtitle: { margin: 0, color: '#888', fontSize: '0.88rem' },

  btnPrimary: { display: 'inline-flex', alignItems: 'center', background: '#111', color: '#fff', border: 'none', padding: '0.72rem 1.15rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, boxShadow: '0 4px 14px rgba(0,0,0,0.14)', transition: 'opacity 0.15s' },

  // Stats
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '0.95rem 1.15rem', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' },
  statLabel: { margin: 0, fontSize: '0.7rem', color: '#999', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 },
  statValue: { margin: '0.3rem 0 0', fontSize: '1.65rem', fontWeight: 900, lineHeight: 1 },

  // Filtros
  filtros: { display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 11, color: '#aaa' },
  inputBusqueda: { padding: '0.62rem 0.9rem 0.62rem 2.1rem', border: '1px solid #e0ddd6', borderRadius: '10px', fontSize: '0.88rem', width: '260px', background: '#fff', outline: 'none', color: '#1a1a1a' },
  select: { padding: '0.62rem 0.9rem', border: '1px solid #e0ddd6', borderRadius: '10px', fontSize: '0.88rem', background: '#fff', outline: 'none', cursor: 'pointer', color: '#333' },
  btnGhost: { background: 'transparent', border: '1px solid #e0ddd6', padding: '0.6rem 0.9rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', color: '#666' },

  // Table
  tableWrapper: { background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 10px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#aaa', borderBottom: '1px solid #f0ede6', background: '#faf9f6' },
  thRight: { textAlign: 'right', padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#aaa', borderBottom: '1px solid #f0ede6', background: '#faf9f6' },
  tr: { borderBottom: '1px solid #f5f3ee', transition: 'background 0.12s' },
  td: { padding: '0.85rem 1rem', fontSize: '0.9rem', color: '#1a1a1a', verticalAlign: 'middle' },
  tdRight: { padding: '0.85rem 1rem', fontSize: '0.9rem', verticalAlign: 'middle', textAlign: 'right' },
  tdDesc: { margin: '0.2rem 0 0', fontSize: '0.76rem', color: '#aaa', lineHeight: 1.35, fontWeight: 300 },

  linkName: { background: 'transparent', border: 'none', padding: 0, margin: 0, cursor: 'pointer', fontWeight: 700, color: '#1a1a1a', textAlign: 'left', fontSize: '0.92rem', lineHeight: 1.3 },
  price: { fontWeight: 700, color: '#1a1a1a', fontSize: '0.9rem' },

  thumbnail: { width: '48px', height: '56px', objectFit: 'cover', borderRadius: '8px', display: 'block', border: '1px solid rgba(0,0,0,0.06)' },
  noImage: { width: '48px', height: '56px', background: '#f0ede6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#ccc', fontWeight: 700 },

  badge: { background: '#f2ede5', padding: '0.22rem 0.7rem', borderRadius: '999px', fontSize: '0.76rem', color: '#5a4a30', fontWeight: 600, letterSpacing: '0.02em' },
  badgeStar: { display: 'inline-flex', alignItems: 'center', background: '#fff8e8', color: '#8a6000', padding: '0.22rem 0.65rem', borderRadius: '999px', fontSize: '0.76rem', border: '1px solid #f0d87a', fontWeight: 700 },
  muted: { color: '#ccc', fontSize: '1rem' },

  badgeActivo: { display: 'inline-flex', alignItems: 'center', background: '#edf7ef', color: '#1a6b3a', border: '1px solid #b3dfc0', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 700, minWidth: 80, justifyContent: 'center' },
  badgeInactivo: { display: 'inline-flex', alignItems: 'center', background: '#fdf0ee', color: '#8a3525', border: '1px solid #f0c0b5', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.76rem', cursor: 'pointer', fontWeight: 700, minWidth: 80, justifyContent: 'center' },

  spinnerInline: { display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' },

  acciones: { display: 'inline-flex', gap: '0.4rem' },
  btnEdit: { background: '#fff', border: '1px solid #e0ddd6', width: 36, height: 36, borderRadius: '9px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#555', transition: 'border-color 0.15s' },
  btnDelete: { background: '#fff', border: '1px solid #f0c0b5', color: '#c62828', width: 36, height: 36, borderRadius: '9px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' },

  // Loading
  loadingWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '4rem 1.5rem', background: '#fff', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.04)' },
  loadingSpinner: { width: 20, height: 20, border: '2px solid #e0ddd6', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.65s linear infinite' },
  loadingText: { color: '#888', fontSize: '0.9rem' },

  // Empty
  empty: { padding: '4rem 1.5rem', textAlign: 'center', color: '#666', background: '#fff', borderRadius: '14px', boxShadow: '0 1px 10px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' },
  emptyTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1a1a1a' },
  emptySub: { margin: '0.5rem 0 1.25rem', fontSize: '0.9rem', color: '#888', lineHeight: 1.5 },
  btnGhostLg: { background: 'transparent', border: '1px solid #ddd', padding: '0.72rem 1.1rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', color: '#555' },
  btnPrimaryLg: { background: '#111', color: '#fff', border: 'none', padding: '0.72rem 1.1rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 },

  // Paginación
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f0ede6' },
  pageBtn: { display: 'inline-flex', alignItems: 'center', padding: '0.6rem 1.1rem', border: '1px solid #e0ddd6', borderRadius: '10px', background: '#fff', color: '#333', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' },
  pageBtnDisabled: { opacity: 0.35, cursor: 'default', pointerEvents: 'none' },
  pageIndicator: { fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', fontWeight: 600, minWidth: '4.5rem', textAlign: 'center' },

  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' },
  modal: { background: '#fff', padding: '1.75rem', borderRadius: '16px', minWidth: '320px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.22)', textAlign: 'center' },
  modalIconWrap: { width: 46, height: 46, borderRadius: '50%', background: '#fdf0ee', border: '1px solid #f0c0b5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' },
  modalTitle: { margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 800, color: '#1a1a1a' },
  modalSub: { color: '#666', margin: '0 0 1.5rem', fontSize: '0.9rem', lineHeight: 1.55 },
  modalActions: { display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' },
  btnDeleteConfirm: { background: '#c62828', color: '#fff', border: 'none', padding: '0.72rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 800 },
  btnCancelConfirm: { background: '#f5f3ef', color: '#1a1a1a', border: '1px solid #e0ddd6', padding: '0.72rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 },
}

// Responsive stats
if (typeof window !== 'undefined' && window.matchMedia) {
  if (window.matchMedia('(max-width: 980px)').matches) s.statsRow.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))'
  if (window.matchMedia('(max-width: 560px)').matches) s.statsRow.gridTemplateColumns = '1fr'
}

export default Dashboard