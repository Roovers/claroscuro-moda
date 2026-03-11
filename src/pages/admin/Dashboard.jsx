import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProductosAdminPaginados } from '../../hooks/useProductosPaginados'
import { CATEGORIAS } from '../../constants/categorias'
import { collection, query, where, getCountFromServer, doc, updateDoc, deleteDoc, serverTimestamp, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  Plus, PencilSimple, Trash, SignOut, MagnifyingGlass,
  CheckCircle, XCircle, Star, Package, Image as ImageIcon, List, X,
} from '@phosphor-icons/react'

/* ── Hook: contadores globales (3 lecturas totales, sin importar cuántos productos haya) */
const useStatsGlobales = () => {
  const [stats, setStats] = useState({ total: null, activos: null, inactivos: null })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const col = collection(db, 'productos')
        const [snapTotal, snapActivos] = await Promise.all([
          getCountFromServer(query(col)),
          getCountFromServer(query(col, where('activo', '==', true))),
        ])
        const total = snapTotal.data().count
        const activos = snapActivos.data().count
        setStats({ total, activos, inactivos: total - activos })
      } catch (err) {
        console.error('[Firestore] useStatsGlobales error:', err)
      }
    }
    fetchStats()
  }, [])

  return stats
}

/* ── Hook: índice liviano de nombres para búsqueda global
   Trae solo id + nombre + categoria de todos los productos (1 query, ~pocos KB).
   Se cachea en sessionStorage por 5 minutos para no repetir la query en cada recarga. */
const INDICE_CACHE_KEY = 'admin_indice_nombres'
const INDICE_CACHE_TTL = 5 * 60 * 1000 // 5 minutos

const useIndiceNombres = () => {
  const [indice, setIndice] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      // Intentar desde cache primero
      try {
        const raw = sessionStorage.getItem(INDICE_CACHE_KEY)
        if (raw) {
          const { data, ts } = JSON.parse(raw)
          if (Date.now() - ts < INDICE_CACHE_TTL) {
            setIndice(data)
            setCargando(false)
            return
          }
        }
      } catch {}

      // Cache vencido o inexistente — ir a Firestore
      try {
        const snap = await getDocs(query(collection(db, 'productos'), orderBy('nombre')))
        const data = snap.docs.map((d) => ({ id: d.id, nombre: d.data().nombre || '', categoria: d.data().categoria || '' }))
        setIndice(data)
        try {
          sessionStorage.setItem(INDICE_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
        } catch {}
      } catch (err) {
        console.error('[Firestore] useIndiceNombres error:', err)
      } finally {
        setCargando(false)
      }
    }
    fetch()
  }, [])

  return { indice, cargando }
}

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

const Dashboard = () => {
  const isMobile = useIsMobile()
  const { logout, usuario } = useAuth()
  const navigate = useNavigate()
  const {
    productos,
    cargando,
    eliminarProducto,
    toggleActivo,
    paginaActual,
    hayMas,
    hayAnterior,
    siguiente,
    anterior,
    refetch,
    actualizarEnMemoria,
    eliminarDeMemoria,
  } = useProductosAdminPaginados({ pageSize: 15 })

  const statsGlobales = useStatsGlobales()
  const { indice } = useIndiceNombres()

  const handleToggleActivo = async (id, estadoActual) => {
    actualizarEnMemoria(id, { activo: !estadoActual })
    try {
      await updateDoc(doc(db, 'productos', id), { activo: !estadoActual, actualizadoEn: serverTimestamp() })
    } catch {
      actualizarEnMemoria(id, { activo: estadoActual })
    }
  }

  const handleEliminarProducto = async (id) => {
    eliminarDeMemoria(id)
    try {
      await deleteDoc(doc(db, 'productos', id))
    } catch {
      refetch()
    }
  }

  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [busquedaGlobal, setBusquedaGlobal] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => { await logout(); navigate('/admin/login') }
  const handleEliminar = async (id) => { await handleEliminarProducto(id); setConfirmDelete(null) }
  const limpiarFiltros = () => { setFiltroCategoria(''); setFiltroEstado(''); setBusqueda(''); setBusquedaGlobal('') }

  const categoriaLabel = (value) => {
    if (!value) return 'Sin categoría'
    const found = CATEGORIAS.find((c) => c.value === value)
    if (found) return found.label
    if (value === 'calzado') return 'Calzado'
    return value
  }

  // Resultados de búsqueda global — busca en el índice y trae datos completos de Firestore
  const [resultadosGlobales, setResultadosGlobales] = useState([])
  const [cargandoGlobal, setCargandoGlobal] = useState(false)

  useEffect(() => {
    const q = busquedaGlobal.trim().toLowerCase()
    if (!q || q.length < 2) { setResultadosGlobales([]); return }

    // IDs que matchean en el índice local (sin costo Firestore)
    const ids = indice
      .filter((p) => p.nombre.toLowerCase().includes(q))
      .slice(0, 10)
      .map((p) => p.id)

    if (ids.length === 0) { setResultadosGlobales([]); return }

    // Debounce: esperar 300ms antes de consultar Firestore
    const timer = setTimeout(async () => {
      setCargandoGlobal(true)
      try {
        const { getDocs: gd, query: q2, collection: col, where: wh } = await import('firebase/firestore')
        const snap = await gd(q2(col(db, 'productos'), wh('__name__', 'in', ids)))
        setResultadosGlobales(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('[Firestore] búsqueda global error:', err)
      } finally {
        setCargandoGlobal(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [busquedaGlobal, indice])

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      const matchCategoria = filtroCategoria ? p.categoria === filtroCategoria : true
      const nombre = (p.nombre || '').toString().toLowerCase()
      const matchBusqueda = q ? nombre.includes(q) : true
      const matchEstado =
        filtroEstado === 'activos' ? p.activo === true
        : filtroEstado === 'inactivos' ? p.activo === false : true
      return matchCategoria && matchBusqueda && matchEstado
    })
  }, [productos, filtroCategoria, filtroEstado, busqueda])

  const stats = useMemo(() => {
    const total = productos.length
    const activos = productos.filter((p) => p.activo).length
    return { total, activos, inactivos: total - activos, destacados: productos.filter((p) => p.destacado).length }
  }, [productos])

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
          style={({ isActive }) => (isActive ? { ...s.navItem, ...s.navItemActive } : s.navItem)}
        >
          <Package size={18} weight="bold" style={{ marginRight: 10 }} />
          Gestión de Productos
        </NavLink>
        <NavLink
          to="/admin/home"
          onClick={() => setSidebarOpen(false)}
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
    </>
  )

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
          <div
            style={s.drawerBackdrop}
            onClick={() => setSidebarOpen(false)}
          />
          <aside style={s.drawerSidebar}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <main style={{ ...s.main, padding: isMobile ? '1.25rem 1rem' : '2rem 2.5rem' }}>

        {/* Header — oculto en mobile (está en topbar) */}
        {!isMobile && (
          <div style={s.header}>
            <div>
              <h1 style={s.title}>Gestión de Productos</h1>
              <p style={s.subtitle}>Gestioná tu catálogo (crear, editar, activar/desactivar).</p>
            </div>
            <button onClick={() => navigate('/admin/nuevo')} style={s.btnPrimary} type="button">
              <Plus size={16} weight="bold" style={{ marginRight: 8 }} />
              Nuevo producto
            </button>
          </div>
        )}

        {/* Mobile header */}
        {isMobile && (
          <div style={{ marginBottom: '1rem' }}>
            <h1 style={{ ...s.title, fontSize: '1.4rem' }}>Gestión de Productos</h1>
            <p style={s.subtitle}>Gestioná tu catálogo.</p>
          </div>
        )}

        {/* Stats */}
        <div style={{
          ...s.statsRow,
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, minmax(0, 1fr))',
        }}>
          {[
            { label: 'Total productos', value: statsGlobales.total ?? '…' },
            { label: 'Activos', value: statsGlobales.activos ?? '…', color: '#2e7d32' },
            { label: 'Inactivos', value: statsGlobales.inactivos ?? '…', color: '#c62828' },
            { label: 'Destacados', value: stats.destacados, color: '#a05a00' },
          ].map(({ label, value, color }) => (
            <div key={label} style={s.statCard}>
              <p style={s.statLabel}>{label}</p>
              <p style={{ ...s.statValue, color: color || '#1a1a1a' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Búsqueda global */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ ...s.searchWrap, width: '100%', maxWidth: 480 }}>
            <MagnifyingGlass size={16} weight="bold" style={s.searchIcon} />
            <input
              type="text"
              placeholder="Buscar en todos los productos…"
              value={busquedaGlobal}
              onChange={(e) => setBusquedaGlobal(e.target.value)}
              style={{ ...s.inputBusqueda, width: '100%', paddingRight: busquedaGlobal ? '2rem' : '0.9rem' }}
              aria-label="Búsqueda global"
              autoComplete="off"
            />
            {busquedaGlobal && (
              <button type="button" onClick={() => setBusquedaGlobal('')} style={s.searchClearBtn} aria-label="Limpiar">
                <X size={12} weight="bold" />
              </button>
            )}
          </div>
          {busquedaGlobal.trim().length >= 2 && (
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: '#aaa' }}>
              {cargandoGlobal ? 'Buscando…' : `${resultadosGlobales.length} resultado${resultadosGlobales.length !== 1 ? 's' : ''} en toda la tienda`}
            </p>
          )}
        </div>

        {/* Filtros */}
        <div style={{ ...s.filtros, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
          <div style={{ ...s.searchWrap, width: isMobile ? '100%' : 'auto' }}>
            <MagnifyingGlass size={16} weight="bold" style={s.searchIcon} />
            <input
              type="text"
              placeholder="Filtrar en esta página…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ ...s.inputBusqueda, width: isMobile ? '100%' : 240 }}
              aria-label="Filtrar página actual"
            />
          </div>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={{ ...s.select, width: isMobile ? '100%' : 'auto' }} aria-label="Filtrar por categoría">
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            {!CATEGORIAS.some((c) => c.value === 'calzado') && <option value="calzado">Calzado</option>}
          </select>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ ...s.select, width: isMobile ? '100%' : 'auto' }} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
          <button onClick={limpiarFiltros} style={{ ...s.btnGhost, width: isMobile ? '100%' : 'auto' }} type="button">Limpiar</button>
        </div>

        {/* Tabla / Cards */}
        {(() => {
          const modoGlobal = busquedaGlobal.trim().length >= 2
          const lista = modoGlobal ? resultadosGlobales : productosFiltrados
          const cargandoActual = modoGlobal ? cargandoGlobal : cargando

          if (cargandoActual) return <div style={s.loading}>{modoGlobal ? 'Buscando…' : 'Cargando productos...'}</div>

          if (lista.length === 0) return (
            <div style={s.empty}>
              <p style={s.emptyTitle}>{modoGlobal ? 'Sin resultados para esa búsqueda.' : 'No hay productos con esos filtros.'}</p>
              <p style={s.emptySub}>{modoGlobal ? 'Probá con otra palabra.' : 'Probá limpiar filtros o creá un producto nuevo.'}</p>
              {!modoGlobal && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={limpiarFiltros} style={s.btnGhostLg} type="button">Limpiar filtros</button>
                  <button onClick={() => navigate('/admin/nuevo')} style={s.btnPrimaryLg} type="button">Crear producto</button>
                </div>
              )}
            </div>
          )

          return isMobile ? (
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
                      <button onClick={() => handleToggleActivo(p.id, p.activo)} style={p.activo ? s.badgeActivo : s.badgeInactivo} type="button">
                        {p.activo ? <><CheckCircle size={13} weight="fill" style={{ marginRight: 4 }} />Activo</> : <><XCircle size={13} weight="fill" style={{ marginRight: 4 }} />Inactivo</>}
                      </button>
                      {p.destacado && <span style={s.badgeStar}><Star size={13} weight="fill" style={{ marginRight: 4 }} />Dest.</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => navigate(`/admin/editar/${p.id}`)} style={s.btnEdit} type="button"><PencilSimple size={16} weight="bold" /></button>
                      <button onClick={() => setConfirmDelete(p.id)} style={s.btnDelete} type="button"><Trash size={16} weight="bold" /></button>
                    </div>
                  </div>
                </div>
              ))}
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
                      <td style={s.td}><span style={s.badge}>{categoriaLabel(p.categoria)}</span></td>
                      <td style={s.td}>${(p.precio || 0).toLocaleString('es-AR')}</td>
                      <td style={s.td}>
                        {p.destacado ? <span style={s.badgeStar}><Star size={14} weight="fill" style={{ marginRight: 6 }} />Sí</span> : <span style={s.muted}>—</span>}
                      </td>
                      <td style={s.td}>
                        <button onClick={() => handleToggleActivo(p.id, p.activo)} style={p.activo ? s.badgeActivo : s.badgeInactivo} type="button">
                          {p.activo ? <><CheckCircle size={14} weight="fill" style={{ marginRight: 6 }} />Activo</> : <><XCircle size={14} weight="fill" style={{ marginRight: 6 }} />Inactivo</>}
                        </button>
                      </td>
                      <td style={s.tdRight}>
                        <div style={s.acciones}>
                          <button onClick={() => navigate(`/admin/editar/${p.id}`)} style={s.btnEdit} type="button"><PencilSimple size={16} weight="bold" /></button>
                          <button onClick={() => setConfirmDelete(p.id)} style={s.btnDelete} type="button"><Trash size={16} weight="bold" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}

        {/* Paginación — se oculta durante búsqueda global */}
        {!busquedaGlobal.trim() && (hayAnterior || hayMas) && !busqueda.trim() && !filtroCategoria && !filtroEstado && (
          <div style={s.pagination}>
            <button
              type="button"
              onClick={anterior}
              disabled={!hayAnterior || cargando}
              style={{ ...s.pageBtn, ...(!hayAnterior || cargando ? s.pageBtnDisabled : {}) }}
            >
              ← Anterior
            </button>
            <span style={s.pageNum}>Página {paginaActual + 1}</span>
            <button
              type="button"
              onClick={siguiente}
              disabled={!hayMas || cargando}
              style={{ ...s.pageBtn, ...(!hayMas || cargando ? s.pageBtnDisabled : {}) }}
            >
              Siguiente →
            </button>
          </div>
        )}

      </main>

      {/* Modal delete */}
      {confirmDelete && (
        <div style={s.overlay} role="dialog" aria-modal="true">
          <div style={s.modal}>
            <h3 style={s.modalTitle}>¿Eliminar producto?</h3>
            <p style={s.modalSub}>Esta acción no se puede deshacer.</p>
            <div style={s.modalActions}>
              <button onClick={() => handleEliminar(confirmDelete)} style={s.btnDeleteConfirm} type="button">Sí, eliminar</button>
              <button onClick={() => setConfirmDelete(null)} style={s.btnCancelConfirm} type="button">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f5f5f0', fontFamily: "'Helvetica Neue', Arial, sans-serif" },

  // Desktop sidebar
  sidebar: { width: '240px', background: '#1a1a1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },

  // Mobile top bar
  mobileTopBar: { background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', position: 'sticky', top: 0, zIndex: 100 },
  mobileLogoText: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', letterSpacing: '0.05em', color: '#fff' },
  menuBtn: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' },
  btnPrimarySmall: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  closeBtn: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' },

  // Drawer
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
  btnPrimary: { display: 'inline-flex', alignItems: 'center', background: '#1a1a1a', color: '#fff', border: 'none', padding: '0.75rem 1.15rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 6px 18px rgba(0,0,0,0.10)' },

  statsRow: { display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '0.9rem 1rem', boxShadow: '0 1px 10px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' },
  statLabel: { margin: 0, fontSize: '0.75rem', color: '#777', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 },
  statValue: { margin: '0.35rem 0 0', fontSize: '1.5rem', fontWeight: 800 },

  filtros: { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 12, color: '#888' },
  inputBusqueda: { padding: '0.65rem 0.9rem 0.65rem 2.25rem', border: '1px solid #ddd', borderRadius: '10px', fontSize: '0.9rem', background: '#fff', outline: 'none' },
  searchClearBtn: { position: 'absolute', right: 10, background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' },
  select: { padding: '0.65rem 0.9rem', border: '1px solid #ddd', borderRadius: '10px', fontSize: '0.9rem', background: '#fff', outline: 'none', cursor: 'pointer' },
  btnGhost: { background: 'transparent', border: '1px solid #ddd', padding: '0.62rem 0.9rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem' },

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
  th: { textAlign: 'left', padding: '0.9rem 1rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#777', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  thRight: { textAlign: 'right', padding: '0.9rem 1rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#777', borderBottom: '1px solid #f0f0f0', background: '#fafafa' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '0.85rem 1rem', fontSize: '0.92rem', color: '#1a1a1a', verticalAlign: 'middle' },
  tdRight: { padding: '0.85rem 1rem', fontSize: '0.92rem', color: '#1a1a1a', verticalAlign: 'middle', textAlign: 'right' },
  linkName: { background: 'transparent', border: 'none', padding: 0, margin: 0, cursor: 'pointer', fontWeight: 700, color: '#1a1a1a', textAlign: 'left' },
  thumbnail: { width: '52px', height: '52px', objectFit: 'cover', borderRadius: '10px', display: 'block' },
  noImage: { width: '52px', height: '52px', background: '#f0f0f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#aaa' },

  badge: { background: '#f3f3f3', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', color: '#333' },
  badgeStar: { display: 'inline-flex', alignItems: 'center', background: '#fff7e6', color: '#a05a00', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', border: '1px solid #ffe3b5' },
  muted: { color: '#999' },
  badgeActivo: { display: 'inline-flex', alignItems: 'center', background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 800 },
  badgeInactivo: { display: 'inline-flex', alignItems: 'center', background: '#fce4ec', color: '#c62828', border: '1px solid #f8bbd0', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 800 },

  acciones: { display: 'inline-flex', gap: '0.5rem' },
  btnEdit: { background: 'transparent', border: '1px solid #ddd', width: 38, height: 38, borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  btnDelete: { background: 'transparent', border: '1px solid #ffcdd2', color: '#c62828', width: 38, height: 38, borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },

  loading: { padding: '3rem', textAlign: 'center', color: '#666' },
  empty: { padding: '4rem 1.5rem', textAlign: 'center', color: '#666', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' },
  emptyTitle: { margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1a1a1a' },
  emptySub: { margin: '0.5rem 0 1.25rem', fontSize: '0.92rem', color: '#666', lineHeight: 1.5 },
  btnGhostLg: { background: 'transparent', border: '1px solid #ddd', padding: '0.75rem 1.1rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem' },
  btnPrimaryLg: { background: '#1a1a1a', color: '#fff', border: 'none', padding: '0.75rem 1.1rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 },

  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f0f0f0' },
  pageBtn: { padding: '0.6rem 1.1rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', color: '#1a1a1a', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' },
  pageBtnDisabled: { opacity: 0.35, cursor: 'not-allowed' },
  pageNum: { fontSize: '0.82rem', color: '#888', fontWeight: 600 },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal: { background: '#fff', padding: '1.5rem', borderRadius: '14px', minWidth: '280px', maxWidth: '420px', width: '100%', boxShadow: '0 18px 50px rgba(0,0,0,0.22)' },
  modalTitle: { margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1a1a1a' },
  modalSub: { color: '#666', margin: '0.5rem 0 1.25rem', fontSize: '0.92rem', lineHeight: 1.45 },
  modalActions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' },
  btnDeleteConfirm: { background: '#c62828', color: '#fff', border: 'none', padding: '0.7rem 1.0rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 800 },
  btnCancelConfirm: { background: '#f5f5f5', color: '#1a1a1a', border: '1px solid #e6e6e6', padding: '0.7rem 1.0rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 },
}

export default Dashboard