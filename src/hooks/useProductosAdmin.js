/**
 * useProductosAdmin.js
 * ─────────────────────────────────────────────────────────────────
 * Hook específico para el panel de administración.
 *
 * Estrategia:
 *  - UNA sola query Firestore al montar → trae todos los productos
 *  - Se guarda en sessionStorage (TTL 3 min) → re-navegación sin costo
 *  - Todo filtrado, ordenamiento y paginación es client-side (0 reads extra)
 *  - Stats (total, activos, inactivos, destacados) calculadas del listado completo
 *  - CRUD con optimistic updates + invalidación de cache
 *
 * Por qué es eficiente:
 *  - Admin es 1 usuario → 1 carga de datos por sesión
 *  - Filtros/búsqueda no generan lecturas Firestore
 *  - Comparado con paginación server-side + queries por filtro,
 *    este approach usa MENOS reads en el escenario de uso típico
 * ─────────────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COLECCION = 'productos'
const CACHE_KEY = 'admin_productos_full_v1'
const CACHE_TTL = 3 * 60 * 1000 // 3 minutos

// ── Cache helpers ─────────────────────────────────────────────────
const cacheGet = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null }
    return data
  } catch { return null }
}

const cacheSet = (data) => {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

export const invalidarCacheAdmin = () => {
  try { sessionStorage.removeItem(CACHE_KEY) } catch {}
}

// ── Hook principal ────────────────────────────────────────────────
export const useProductosAdmin = ({ pageSize = 15 } = {}) => {
  const [todosProductos, setTodosProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // ── Filtros
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('recientes') // 'recientes' | 'precio-asc' | 'precio-desc' | 'az'
  const [paginaActual, setPaginaActual] = useState(0)

  const mountedRef = useRef(true)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  // ── Carga principal ───────────────────────────────────────────
  const cargar = useCallback(async (forzar = false) => {
    if (forzar) invalidarCacheAdmin()

    setCargando(true)
    setError(null)

    // Intentar desde cache
    if (!forzar) {
      const cached = cacheGet()
      if (cached) {
        if (mountedRef.current) { setTodosProductos(cached); setCargando(false) }
        return
      }
    }

    try {
      const q = query(collection(db, COLECCION), orderBy('creadoEn', 'desc'))
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      cacheSet(data)
      if (mountedRef.current) setTodosProductos(data)
    } catch (err) {
      console.error('[Firestore] useProductosAdmin error:', err)
      if (mountedRef.current) setError(err?.message || 'Error al cargar productos')
    } finally {
      if (mountedRef.current) setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Reset página cuando cambia cualquier filtro
  useEffect(() => { setPaginaActual(0) }, [filtroCategoria, filtroEstado, busqueda, orden])

  // ── Filtrado y ordenamiento (client-side) ─────────────────────
  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()

    let lista = todosProductos.filter((p) => {
      if (filtroCategoria && p.categoria !== filtroCategoria) return false
      if (filtroEstado === 'activos' && p.activo !== true) return false
      if (filtroEstado === 'inactivos' && p.activo !== false) return false
      if (filtroEstado === 'destacados' && p.destacado !== true) return false
      if (q && !(p.nombre || '').toLowerCase().includes(q)) return false
      return true
    })

    if (orden === 'precio-asc') lista = [...lista].sort((a, b) => (a.precio || 0) - (b.precio || 0))
    else if (orden === 'precio-desc') lista = [...lista].sort((a, b) => (b.precio || 0) - (a.precio || 0))
    else if (orden === 'az') lista = [...lista].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
    // 'recientes' → ya viene ordenado por creadoEn desc desde Firestore

    return lista
  }, [todosProductos, filtroCategoria, filtroEstado, busqueda, orden])

  // ── Paginación client-side ────────────────────────────────────
  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / pageSize))
  const paginaSegura = Math.min(paginaActual, totalPaginas - 1)
  const productosPagina = productosFiltrados.slice(
    paginaSegura * pageSize,
    (paginaSegura + 1) * pageSize
  )

  // ── Stats globales (del listado completo, no de la página) ────
  const stats = useMemo(() => ({
    total: todosProductos.length,
    activos: todosProductos.filter((p) => p.activo === true).length,
    inactivos: todosProductos.filter((p) => p.activo !== true).length,
    destacados: todosProductos.filter((p) => p.destacado === true).length,
  }), [todosProductos])

  const hayFiltrosActivos = !!(filtroCategoria || filtroEstado || busqueda.trim())

  // ── CRUD con optimistic updates ───────────────────────────────
  const toggleActivo = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual
    // Optimistic update inmediato
    setTodosProductos((prev) =>
      prev.map((p) => p.id === id ? { ...p, activo: nuevoEstado } : p)
    )
    try {
      await updateDoc(doc(db, COLECCION, id), {
        activo: nuevoEstado,
        actualizadoEn: serverTimestamp(),
      })
      // Invalidar cache para próxima carga (los datos en memoria son correctos)
      invalidarCacheAdmin()
    } catch (err) {
      console.error('[Firestore] toggleActivo error:', err)
      // Revertir
      setTodosProductos((prev) =>
        prev.map((p) => p.id === id ? { ...p, activo: estadoActual } : p)
      )
    }
  }

  const eliminarProducto = async (id) => {
    // Guardar snapshot para rollback
    const snapshot = todosProductos
    setTodosProductos((prev) => prev.filter((p) => p.id !== id))
    try {
      await deleteDoc(doc(db, COLECCION, id))
      invalidarCacheAdmin()
    } catch (err) {
      console.error('[Firestore] eliminarProducto error:', err)
      setTodosProductos(snapshot) // rollback
    }
  }

  // Actualizar un producto en memoria (útil post-edición desde ProductoForm)
  const actualizarEnMemoria = (id, cambios) => {
    setTodosProductos((prev) =>
      prev.map((p) => p.id === id ? { ...p, ...cambios } : p)
    )
    invalidarCacheAdmin()
  }

  return {
    // ── Lista para mostrar
    productos: productosPagina,           // solo la página actual
    productosFiltrados,                    // lista filtrada completa (para conteos)
    cargando,
    error,

    // ── Stats (del listado completo)
    stats,
    hayFiltrosActivos,

    // ── Paginación
    paginaActual: paginaSegura,
    totalPaginas,
    totalFiltrados: productosFiltrados.length,
    hayMas: paginaSegura < totalPaginas - 1,
    hayAnterior: paginaSegura > 0,
    siguiente: () => setPaginaActual((p) => Math.min(p + 1, totalPaginas - 1)),
    anterior: () => setPaginaActual((p) => Math.max(p - 1, 0)),
    irAPagina: (n) => setPaginaActual(Math.max(0, Math.min(n, totalPaginas - 1))),

    // ── Filtros (state + setters)
    filtroCategoria, setFiltroCategoria,
    filtroEstado, setFiltroEstado,
    busqueda, setBusqueda,
    orden, setOrden,
    limpiarFiltros: () => {
      setFiltroCategoria('')
      setFiltroEstado('')
      setBusqueda('')
      setOrden('recientes')
      setPaginaActual(0)
    },

    // ── CRUD
    toggleActivo,
    eliminarProducto,
    actualizarEnMemoria,
    refetch: () => cargar(true),
  }
}