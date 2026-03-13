import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProductosAdmin } from '../../hooks/useProductosAdmin'
import { CATEGORIAS } from '../../constants/categorias'
import {
  Plus, PencilSimple, Trash, SignOut, MagnifyingGlass,
  CheckCircle, XCircle, Star, Package, Image as ImageIcon,
  List, X, ArrowsDownUp, FunnelSimple,
} from '@phosphor-icons/react'
import { useEffect } from 'react'

/* ── Hook mobile ──────────────────────────────────────────────── */
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

const categoriaLabel = (value) => {
  if (!value) return 'Sin categoría'
  return CATEGORIAS.find((c) => c.value === value)?.label || value
}

/* ── Stat Card ────────────────────────────────────────────────── */
const StatCard = ({ label, value, color, total, icon: Icon }) => {
  const pct = total && value !== null ? Math.round((value / total) * 100) : null
  return (
    <div style={s.statCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={s.statLabel}>{label}</p>
        {Icon && <Icon size={16} weight="bold" style={{ color: color || '#777', opacity: 0.7 }} />}
      </div>
      <p style={{ ...s.statValue, color: color || '#1a1a1a' }}>
        {value ?? '…'}
      </p>
      {pct !== null && (
        <div style={s.statBarWrap}>
          <div style={{ ...s.statBar, width: `${pct}%`, background: color || '#1a1a1a' }} />
        </div>
      )}
    </div>
  )
}

/* ── Dashboard ────────────────────────────────────────────────── */
const Dashboard = () => {
  const isMobile = useIsMobile()
  const { logout, usuario } = useAuth()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const {
    productos,
    productosFiltrados,
    cargando,
    error,
    stats,
    hayFiltrosActivos,
    paginaActual,
    totalPaginas,
    totalFiltrados,
    hayMas,
    hayAnterior,
    siguiente,
    anterior,
    filtroCategoria, setFiltroCategoria,
    filtroEstado, setFiltroEstado,
    busqueda, setBusqueda,
    orden, setOrden,
    limpiarFiltros,
    toggleActivo,
    eliminarProducto,
    refetch,
  } = useProductosAdmin({ pageSize: 15 })

  const handleLogout = async () => { await logout(); navigate('/admin/login') }

  const handleEliminar = async (id) => {
    await eliminarProducto(id)
    setConfirmDelete(null)
  }

  /* ── Sidebar content ────────────────────────────────────────── */
  const SidebarContent = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={s.logo}>claroscuro</div>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} style={s.closeBtn} type="button">
            <X size={20} weight="bold" />
          </button>
        )}
      </div>
      <nav style={s.nav}>
        <NavLink
          to="/admin" end
          onClick={() => setSidebarOpen(false)}
          style={({ isActive }) => isActive ? { ...s.navItem, ...s.navItemActive } : s.navItem}
        >
          <Package size={18} weight="bold" style={{ marginRight: 10 }} />
          Gestión de Productos
        </NavLink>
        <NavLink
          to="/admin/home"
          onClick={() => setSidebarOpen(false)}
          style={({ isActive }) => isActive ? { ...s.navItem, ...s.navItemActive } : s.navItem}
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
    </>
  )

  /* ── Lista a mostrar (siempre la página actual del hook) ─────── */
  const lista = productos

  return (
    <div style={{ ...s.root, flexDirection: isMobile ? 'column' : 'row' }}>

      {/* Sidebar desktop */}
      {!isMobile && (
        <aside style={s.sidebar}>
          <SidebarContent />
        </aside>
      )}

      {/* Mobile top bar */}
      {isMobile && (
        <div style={s.mobileTopBar}>
          <button onClick={() => setSidebarOpen(true)} style={s.menuBtn} type="button">
            <List size={22} weight="bold" />
          </button>
          <span style={s.mobileLogoText}>claroscuro</span>
          <button onClick={() => navigate('/admin/nuevo')} style={s.btnPrimarySmall} type="button">
            <Plus size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Mobile sidebar drawer */}
      {isMobile && sidebarOpen && (
        <>
          <div style={s.drawerBackdrop} onClick={() => setSidebarOpen(false)} />
          <aside style={s.drawerSidebar}><SidebarContent /></aside>
        </>
      )}

      {/* ── Main ──────────────────────────────────────────────── */}
      <main style={{ ...s.main, padding: isMobile ? '1.25rem 1rem' : '2rem 2.5rem' }}>

        {/* Header */}
        {!isMobile ? (
          <div style={s.header}>
            <div>
              <h1 style={s.title}>Gestión de Productos</h1>
              <p style={s.subtitle}>Gestioná tu catálogo · todos los filtros son globales</p>
            </div>
            <button onClick={() => navigate('/admin/nuevo')} style={s.btnPrimary} type="button">
              <Plus size={16} weight="bold" style={{ marginRight: 8 }} />
              Nuevo producto
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <h1 style={{ ...s.title, fontSize: '1.4rem' }}>Gestión de Productos</h1>
            <p style={s.subtitle}>Filtros globales sobre todos los productos</p>
          </div>
        )}

        {/* ── Stats ─────────────────────────────────────────── */}
        <div style={{
          ...s.statsRow,
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, minmax(0, 1fr))',
        }}>
          <StatCard
            label="Total productos"
            value={stats.total}
            icon={Package}
          />
          <StatCard
            label="Activos"
            value={stats.activos}
            color="#2e7d32"
            total={stats.total}
            icon={CheckCircle}
          />
          <StatCard
            label="Inactivos"
            value={stats.inactivos}
            color="#c62828"
            total={stats.total}
            icon={XCircle}
          />
          <StatCard
            label="Destacados"
            value={stats.destacados}
            color="#a05a00"
            total={stats.total}
            icon={Star}
          />
        </div>

        {/* ── Barra de búsqueda + filtros ───────────────────── */}
        <div style={{ marginBottom: '0.75rem' }}>
          {/* Búsqueda + botón filtros */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ ...s.searchWrap, flex: '1 1 220px', maxWidth: 420 }}>
              <MagnifyingGlass size={16} weight="bold" style={s.searchIcon} />
              <input
                type="text"
                placeholder="Buscar en todos los productos…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ ...s.inputBusqueda, width: '100%', paddingRight: busqueda ? '2.2rem' : '0.9rem' }}
                aria-label="Buscar productos"
                autoComplete="off"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  style={s.searchClearBtn}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              style={{
                ...s.btnGhost,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: filtersOpen || hayFiltrosActivos ? 'rgba(26,20,16,0.06)' : 'transparent',
                borderColor: hayFiltrosActivos ? '#1a1a1a' : '#ddd',
              }}
              aria-label="Mostrar filtros"
            >
              <FunnelSimple size={15} weight="bold" />
              Filtros
              {hayFiltrosActivos && (
                <span style={s.filtrosBadge}>
                  {[filtroCategoria, filtroEstado].filter(Boolean).length +
                   (busqueda.trim() ? 1 : 0)}
                </span>
              )}
            </button>

            <div style={{ ...s.searchWrap }}>
              <ArrowsDownUp size={14} weight="bold" style={{ ...s.searchIcon, left: 10 }} />
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                style={{ ...s.inputBusqueda, paddingLeft: '2rem', paddingRight: '0.75rem', cursor: 'pointer', width: 'auto' }}
                aria-label="Ordenar"
              >
                <option value="recientes">Más nuevos</option>
                <option value="precio-asc">Precio ↑</option>
                <option value="precio-desc">Precio ↓</option>
                <option value="az">Nombre A–Z</option>
              </select>
            </div>

            {hayFiltrosActivos && (
              <button type="button" onClick={limpiarFiltros} style={{ ...s.btnGhost, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <X size={12} weight="bold" />
                Limpiar
              </button>
            )}
          </div>

          {/* Panel de filtros expandible */}
          {filtersOpen && (
            <div style={{
              ...s.filtroPanel,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
            }}>
              {/* Categoría — chips */}
              <div style={s.filtroPanelGroup}>
                <span style={s.filtroPanelLabel}>Categoría</span>
                <div style={s.chipsRow}>
                  <button
                    type="button"
                    onClick={() => setFiltroCategoria('')}
                    style={filtroCategoria === '' ? { ...s.chip, ...s.chipActive } : s.chip}
                  >
                    Todas
                  </button>
                  {CATEGORIAS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFiltroCategoria(filtroCategoria === c.value ? '' : c.value)}
                      style={filtroCategoria === c.value ? { ...s.chip, ...s.chipActive } : s.chip}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estado */}
              <div style={s.filtroPanelGroup}>
                <span style={s.filtroPanelLabel}>Estado</span>
                <div style={s.chipsRow}>
                  {[
                    { value: '', label: 'Todos' },
                    { value: 'activos', label: 'Activos' },
                    { value: 'inactivos', label: 'Inactivos' },
                  ].map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setFiltroEstado(o.value)}
                      style={filtroEstado === o.value ? { ...s.chip, ...s.chipActive } : s.chip}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resultado count */}
        <div style={s.resultBar}>
          {cargando ? (
            <span style={s.resultBarText}>Cargando…</span>
          ) : (
            <span style={s.resultBarText}>
              {hayFiltrosActivos
                ? `${totalFiltrados} de ${stats.total} producto${stats.total !== 1 ? 's' : ''}`
                : `${stats.total} producto${stats.total !== 1 ? 's' : ''} en total`
              }
              {totalPaginas > 1 && ` · Página ${paginaActual + 1} de ${totalPaginas}`}
            </span>
          )}
          {error && <span style={{ color: '#c62828', fontSize: '0.82rem' }}>{error}</span>}
        </div>

        {/* ── Tabla / Cards ─────────────────────────────────── */}
        {cargando ? (
          <div style={s.loading}>Cargando productos…</div>
        ) : lista.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyTitle}>
              {hayFiltrosActivos ? 'Sin resultados con esos filtros.' : 'No hay productos aún.'}
            </p>
            <p style={s.emptySub}>
              {hayFiltrosActivos
                ? 'Probá cambiando los filtros o limpiándolos.'
                : 'Creá tu primer producto para empezar.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {hayFiltrosActivos && (
                <button onClick={limpiarFiltros} style={s.btnGhostLg} type="button">
                  Limpiar filtros
                </button>
              )}
              <button onClick={() => navigate('/admin/nuevo')} style={s.btnPrimaryLg} type="button">
                Crear producto
              </button>
            </div>
          </div>
        ) : isMobile ? (
          /* ── Mobile cards ────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {lista.map((p) => (
              <div key={p.id} style={s.mobileCard}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {p.imagenes?.[0] ? (
                    <img src={p.imagenes[0]} alt={p.nombre} style={s.mobileThumb} loading="lazy" />
                  ) : (
                    <div style={s.mobileNoImg}>?</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.mobileCardName}>{p.nombre || '(Sin nombre)'}</p>
                    <p style={s.mobileCardCat}>{categoriaLabel(p.categoria)}</p>
                    <p style={s.mobileCardPrice}>${(p.precio || 0).toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => toggleActivo(p.id, p.activo)} style={p.activo ? s.badgeActivo : s.badgeInactivo} type="button">
                      {p.activo
                        ? <><CheckCircle size={13} weight="fill" style={{ marginRight: 4 }} />Activo</>
                        : <><XCircle size={13} weight="fill" style={{ marginRight: 4 }} />Inactivo</>}
                    </button>
                    {p.destacado && (
                      <span style={s.badgeStar}>
                        <Star size={13} weight="fill" style={{ marginRight: 4 }} />Dest.
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => navigate(`/admin/editar/${p.id}`)} style={s.btnEdit} type="button">
                      <PencilSimple size={16} weight="bold" />
                    </button>
                    <button onClick={() => setConfirmDelete(p.id)} style={s.btnDelete} type="button">
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Desktop table ───────────────────────────────── */
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
                {lista.map((p) => (
                  <tr key={p.id} style={s.tr}>
                    <td style={s.td}>
                      {p.imagenes?.[0] ? (
                        <img src={p.imagenes[0]} alt={p.nombre} style={s.thumbnail} loading="lazy" />
                      ) : (
                        <div style={s.noImage}>Sin imagen</div>
                      )}
                    </td>
                    <td style={s.td}>
                      <button style={s.linkName} onClick={() => navigate(`/admin/editar/${p.id}`)} type="button">
                        {p.nombre || '(Sin nombre)'}
                      </button>
                    </td>
                    <td style={s.td}>
                      <span style={s.badge}>{categoriaLabel(p.categoria)}</span>
                    </td>
                    <td style={s.td}>${(p.precio || 0).toLocaleString('es-AR')}</td>
                    <td style={s.td}>
                      {p.destacado
                        ? <span style={s.badgeStar}><Star size={14} weight="fill" style={{ marginRight: 6 }} />Sí</span>
                        : <span style={s.muted}>—</span>}
                    </td>
                    <td style={s.td}>
                      <button onClick={() => toggleActivo(p.id, p.activo)} style={p.activo ? s.badgeActivo : s.badgeInactivo} type="button">
                        {p.activo
                          ? <><CheckCircle size={14} weight="fill" style={{ marginRight: 6 }} />Activo</>
                          : <><XCircle size={14} weight="fill" style={{ marginRight: 6 }} />Inactivo</>}
                      </button>
                    </td>
                    <td style={s.tdRight}>
                      <div style={s.acciones}>
                        <button onClick={() => navigate(`/admin/editar/${p.id}`)} style={s.btnEdit} type="button">
                          <PencilSimple size={16} weight="bold" />
                        </button>
                        <button onClick={() => setConfirmDelete(p.id)} style={s.btnDelete} type="button">
                          <Trash size={16} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Paginación ────────────────────────────────────── */}
        {totalPaginas > 1 && !cargando && (
          <div style={s.pagination}>
            <button
              type="button"
              onClick={anterior}
              disabled={!hayAnterior}
              style={{ ...s.pageBtn, ...(!hayAnterior ? s.pageBtnDisabled : {}) }}
            >
              ← Anterior
            </button>
            <span style={s.pageNum}>
              Página {paginaActual + 1} de {totalPaginas}
            </span>
            <button
              type="button"
              onClick={siguiente}
              disabled={!hayMas}
              style={{ ...s.pageBtn, ...(!hayMas ? s.pageBtnDisabled : {}) }}
            >
              Siguiente →
            </button>
          </div>
        )}

      </main>

      {/* ── Modal eliminar ────────────────────────────────────── */}
      {confirmDelete && (
        <div style={s.overlay} role="dialog" aria-modal="true">
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

/* ── Styles ───────────────────────────────────────────────────── */
const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f5f5f0', fontFamily: "'Helvetica Neue', Arial, sans-serif" },

  sidebar: { width: '240px', background: '#1a1a1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },
  mobileTopBar: { background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', position: 'sticky', top: 0, zIndex: 100 },
  mobileLogoText: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', letterSpacing: '0.05em', color: '#fff' },
  menuBtn: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' },
  btnPrimarySmall: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  closeBtn: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' },
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
  subtitle: { margin: 0, color: '#888', fontSize: '0.85rem' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', background: '#1a1a1a', color: '#fff', border: 'none', padding: '0.75rem 1.15rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 6px 18px rgba(0,0,0,0.10)' },

  // Stats
  statsRow: { display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '1rem 1.1rem 0.85rem', boxShadow: '0 1px 10px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' },
  statLabel: { margin: '0 0 0.1rem', fontSize: '0.72rem', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 },
  statValue: { margin: '0.2rem 0 0.6rem', fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 },
  statBarWrap: { height: 3, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' },
  statBar: { height: '100%', borderRadius: 2, transition: 'width 0.5s ease' },

  // Search + filters
  searchWrap: { position: 'relative', display: 'inline-flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 12, color: '#888', pointerEvents: 'none' },
  inputBusqueda: { padding: '0.65rem 0.9rem 0.65rem 2.25rem', border: '1px solid #ddd', borderRadius: '10px', fontSize: '0.88rem', background: '#fff', outline: 'none', fontFamily: 'inherit', color: '#1a1a1a', WebkitAppearance: 'none', },
  searchClearBtn: { position: 'absolute', right: 10, background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' },
  btnGhost: { background: 'transparent', border: '1px solid #ddd', padding: '0.62rem 0.9rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', color: '#1a1a1a', WebkitAppearance: 'none', },
  filtrosBadge: { background: '#1a1a1a', color: '#fff', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.45rem', lineHeight: 1.4 },

  // Filter panel
  filtroPanel: { display: 'flex', gap: '1.25rem', background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '0.75rem', flexWrap: 'wrap' },
  filtroPanelGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 0 },
  filtroPanelLabel: { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', margin: 0 },
  chipsRow: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  chip: { padding: '0.32rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: '999px', background: 'transparent', fontSize: '0.78rem', color: '#555', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' },
  chipActive: { background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' },

  // Result bar
  resultBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' },
  resultBarText: { fontSize: '0.8rem', color: '#999', fontWeight: 400 },

  // Mobile cards
  mobileCard: { background: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 10px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' },
  mobileThumb: { width: 64, height: 64, objectFit: 'cover', borderRadius: '10px', flexShrink: 0 },
  mobileNoImg: { width: 64, height: 64, background: '#f0f0f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#aaa', flexShrink: 0 },
  mobileCardName: { margin: '0 0 0.2rem', fontWeight: 700, color: '#1a1a1a', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  mobileCardCat: { margin: '0 0 0.2rem', fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' },
  mobileCardPrice: { margin: 0, fontWeight: 700, color: '#1a1a1a', fontSize: '0.92rem' },

  // Desktop table
  tableWrapper: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.9rem 1rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#777', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  thRight: { textAlign: 'right', padding: '0.9rem 1rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#777', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '0.85rem 1rem', fontSize: '0.92rem', color: '#1a1a1a', verticalAlign: 'middle' },
  tdRight: { padding: '0.85rem 1rem', fontSize: '0.92rem', color: '#1a1a1a', verticalAlign: 'middle', textAlign: 'right' },
  linkName: { background: 'transparent', border: 'none', padding: 0, margin: 0, cursor: 'pointer', fontWeight: 700, color: '#1a1a1a', textAlign: 'left', fontFamily: 'inherit' },
  thumbnail: { width: '52px', height: '52px', objectFit: 'cover', borderRadius: '10px', display: 'block' },
  noImage: { width: '52px', height: '52px', background: '#f0f0f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#aaa' },

  badge: { background: '#f3f3f3', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', color: '#333' },
  badgeStar: { display: 'inline-flex', alignItems: 'center', background: '#fff7e6', color: '#a05a00', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', border: '1px solid #ffe3b5' },
  muted: { color: '#ccc' },
  badgeActivo: { display: 'inline-flex', alignItems: 'center', background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' },
  badgeInactivo: { display: 'inline-flex', alignItems: 'center', background: '#fce4ec', color: '#c62828', border: '1px solid #f8bbd0', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' },

  acciones: { display: 'inline-flex', gap: '0.5rem' },
  btnEdit: { background: 'transparent', border: '1px solid #ddd', width: 38, height: 38, borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  btnDelete: { background: 'transparent', border: '1px solid #ffcdd2', color: '#c62828', width: 38, height: 38, borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },

  loading: { padding: '3rem', textAlign: 'center', color: '#999', fontSize: '0.9rem' },
  empty: { padding: '4rem 1.5rem', textAlign: 'center', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' },
  emptyTitle: { margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a' },
  emptySub: { margin: '0 0 1.25rem', fontSize: '0.88rem', color: '#888', lineHeight: 1.5 },
  btnGhostLg: { background: 'transparent', border: '1px solid #ddd', padding: '0.75rem 1.1rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' },
  btnPrimaryLg: { background: '#1a1a1a', color: '#fff', border: 'none', padding: '0.75rem 1.1rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'inherit' },

  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f0f0f0' },
  pageBtn: { padding: '0.6rem 1.1rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', color: '#1a1a1a', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  pageBtnDisabled: { opacity: 0.3, cursor: 'not-allowed' },
  pageNum: { fontSize: '0.82rem', color: '#888', fontWeight: 600 },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal: { background: '#fff', padding: '1.5rem', borderRadius: '14px', minWidth: '280px', maxWidth: '420px', width: '100%', boxShadow: '0 18px 50px rgba(0,0,0,0.22)' },
  modalTitle: { margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1a1a1a' },
  modalSub: { color: '#666', margin: '0.5rem 0 1.25rem', fontSize: '0.88rem', lineHeight: 1.45 },
  modalActions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' },
  btnDeleteConfirm: { background: '#c62828', color: '#fff', border: 'none', padding: '0.7rem 1.0rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'inherit' },
  btnCancelConfirm: { background: '#f5f5f5', color: '#1a1a1a', border: '1px solid #e6e6e6', padding: '0.7rem 1.0rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'inherit' },
}

export default Dashboard