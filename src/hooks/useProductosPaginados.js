/**
 * useProductosPaginados.js — CORREGIDO
 * ─────────────────────────────────────────────────────────────────
 *
 * FIXES aplicados:
 *
 * 1. BUG PRINCIPAL — Stale closure en fetchPagina:
 *    Antes había DOS useEffect separados (reset + fetch). Cuando `categoria`
 *    cambiaba, el efecto de fetch llamaba fetchPagina(0) con el `paginas` viejo
 *    en su closure (el setPaginas([]) del efecto de reset aún no había procesado).
 *    Resultado: fetchPagina veía paginas[0] con datos viejos → retornaba temprano
 *    → los productos de la categoría anterior seguían en pantalla.
 *
 *    SOLUCIÓN: Usar useRef para que fetchPagina lea siempre el valor fresco de
 *    paginas/cursores sin depender del closure. Se asignan directo en el render
 *    body (sin useEffect). Los deps de useCallback se reducen a [categoria, pageSize].
 *    Un único useEffect resetea los refs inmediatamente y llama fetchPagina(0).
 *
 * 2. BUG SECUNDARIO — Cache sessionStorage corrompía cursores de Firestore:
 *    lastVisible es un DocumentSnapshot de Firestore. Al serializarse con
 *    JSON.stringify pierde todos sus métodos prototype. Al restaurarlo y pasarlo
 *    a startAfter(), Firestore recibía un objeto plano inválido → página 2+ fallaba.
 *
 *    SOLUCIÓN: Se eliminó el sessionStorage cache. El cache en memoria (array
 *    paginas[]) es suficiente y funciona correctamente con DocumentSnapshots.
 *
 * ─────────────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COLECCION = 'productos'

// ── Helper Cloudinary ────────────────────────────────────────────
/**
 * Transforma una URL de Cloudinary para servir una versión thumbnail optimizada.
 * @param {string} url   - URL original de Cloudinary
 * @param {number} width - Ancho deseado (default: 480)
 */
export const cloudinaryThumb = (url, width = 480) => {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/w_${width},c_fill,f_auto,q_auto/`)
}

// ── Hook Público: catálogo ───────────────────────────────────────
/**
 * Paginación cursor-based para el catálogo público.
 * Cache en memoria: volver a una página anterior no genera nuevas lecturas.
 *
 * @param {Object}  options
 * @param {string}  options.categoria  - Filtrar por categoría (opcional)
 * @param {number}  options.pageSize   - Productos por página (default: 12)
 */
export const useProductosPaginados = ({ categoria = '', pageSize = 12 } = {}) => {
  const [paginas, setPaginas] = useState([])           // cache en memoria por página
  const [cursores, setCursores] = useState([])         // DocumentSnapshot de último doc
  const [hayMasPorPagina, setHayMasPorPagina] = useState([])
  const [paginaActual, setPaginaActual] = useState(0)
  const [hayMas, setHayMas] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Refs para evitar stale closures ──────────────────────────
  // Se asignan directo en render body → siempre tienen el valor más reciente
  // sin necesidad de useEffect (que correría demasiado tarde).
  const paginasRef         = useRef(paginas)
  const cursoresRef        = useRef(cursores)
  const hayMasPorPaginaRef = useRef(hayMasPorPagina)
  paginasRef.current         = paginas
  cursoresRef.current        = cursores
  hayMasPorPaginaRef.current = hayMasPorPagina

  // ── fetchPagina ──────────────────────────────────────────────
  // deps SOLO [categoria, pageSize]: los refs manejan paginas/cursores sin stale closure.
  // La identidad de esta función cambia únicamente cuando categoria o pageSize cambian.
  const fetchPagina = useCallback(
    async (numeroPagina) => {
      // Leer desde refs → siempre frescos, nunca stale
      const _paginas         = paginasRef.current
      const _cursores        = cursoresRef.current
      const _hayMasPorPagina = hayMasPorPaginaRef.current

      // Cache hit en memoria
      if (_paginas[numeroPagina]) {
        setPaginaActual(numeroPagina)
        setHayMas(_hayMasPorPagina[numeroPagina] ?? true)
        return
      }

      setCargando(true)
      setError(null)

      try {
        const constraints = [
          where('activo', '==', true),
          orderBy('creadoEn', 'desc'),
          limit(pageSize + 1), // +1 para saber si hay más
        ]

        // El where de categoria debe ir ANTES del orderBy en Firestore
        if (categoria) {
          constraints.splice(1, 0, where('categoria', '==', categoria))
        }

        // Cursor para páginas 2, 3, …
        if (numeroPagina > 0) {
          const cursorAnterior = _cursores[numeroPagina - 1]
          if (!cursorAnterior) { setCargando(false); return }
          constraints.push(startAfter(cursorAnterior))
        }

        const q = query(collection(db, COLECCION), ...constraints)
        const snapshot = await getDocs(q)

        if (!mountedRef.current) return

        const docs        = snapshot.docs
        const tieneExtra  = docs.length > pageSize
        const docsPagina  = tieneExtra ? docs.slice(0, pageSize) : docs
        const productos   = docsPagina.map((d) => ({ id: d.id, ...d.data() }))
        const lastVisible = docsPagina[docsPagina.length - 1] || null

        // Actualizar estado con functional updates (sin depender de closures)
        setPaginas((prev) => {
          const next = [...prev]; next[numeroPagina] = productos; return next
        })
        setCursores((prev) => {
          // lastVisible es un DocumentSnapshot → se guarda en memoria, NO en sessionStorage
          const next = [...prev]; next[numeroPagina] = lastVisible; return next
        })
        setHayMasPorPagina((prev) => {
          const next = [...prev]; next[numeroPagina] = tieneExtra; return next
        })
        setHayMas(tieneExtra)
        setPaginaActual(numeroPagina)

      } catch (err) {
        if (!mountedRef.current) return
        console.error('[Firestore] useProductosPaginados error:', err)
        setError(err?.message || 'Error al cargar productos')
      } finally {
        if (mountedRef.current) setCargando(false)
      }
    },
    [categoria, pageSize] // ← SOLO estos dos. Refs manejan el resto.
  )

  // ── Efecto ÚNICO: reset + fetch cuando cambia categoria o pageSize ──
  // fetchPagina cambia de identidad solo cuando categoria/pageSize cambian,
  // por eso el dep array es [fetchPagina] y el efecto corre exactamente cuando se necesita.
  useEffect(() => {
    // 1. Resetear estado
    setPaginas([])
    setCursores([])
    setHayMasPorPagina([])
    setPaginaActual(0)
    setHayMas(true)
    setError(null)

    // 2. CRÍTICO: resetear refs AHORA (antes de llamar fetchPagina)
    //    para que fetchPagina vea paginas/cursores vacíos y no retorne temprano.
    paginasRef.current         = []
    cursoresRef.current        = []
    hayMasPorPaginaRef.current = []

    // 3. Fetch fresco
    fetchPagina(0)
  }, [fetchPagina])

  // ── Navegación ───────────────────────────────────────────────
  const siguiente = () => {
    if (!hayMas || cargando) return
    fetchPagina(paginaActual + 1)
  }

  const anterior = () => {
    if (paginaActual === 0 || cargando) return
    fetchPagina(paginaActual - 1)
  }

  // ── Invalidar cache (llamar después de crear/editar/eliminar) ─
  const invalidarCache = () => {
    setPaginas([])
    setCursores([])
    setHayMasPorPagina([])
    paginasRef.current         = []
    cursoresRef.current        = []
    hayMasPorPaginaRef.current = []
    setPaginaActual(0)
    setHayMas(true)
    fetchPagina(0)
  }

  // ── Refetch página actual ─────────────────────────────────────
  const refetch = () => {
    // Borrar la página actual del cache en memoria
    const newPaginas = [...paginasRef.current]
    newPaginas[paginaActual] = undefined
    paginasRef.current = newPaginas
    setPaginas(newPaginas)
    fetchPagina(paginaActual)
  }

  return {
    productos: paginas[paginaActual] || [],
    cargando,
    error,
    paginaActual,
    hayMas,
    hayAnterior: paginaActual > 0,
    siguiente,
    anterior,
    invalidarCache,
    refetch,
  }
}

// ── Hook Admin: paginación para el panel ────────────────────────
/**
 * Paginación cursor-based para el panel de administración.
 * Carga TODOS los productos (activos e inactivos).
 * Aplica el mismo fix de refs para consistencia.
 *
 * @param {Object} options
 * @param {number} options.pageSize - Productos por página (default: 15)
 */
export const useProductosAdminPaginados = ({ pageSize = 15 } = {}) => {
  const [paginas, setPaginas] = useState([])
  const [cursores, setCursores] = useState([])
  const [hayMasPorPagina, setHayMasPorPagina] = useState([])
  const [paginaActual, setPaginaActual] = useState(0)
  const [hayMas, setHayMas] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Refs para evitar stale closures
  const paginasRef         = useRef(paginas)
  const cursoresRef        = useRef(cursores)
  const hayMasPorPaginaRef = useRef(hayMasPorPagina)
  paginasRef.current         = paginas
  cursoresRef.current        = cursores
  hayMasPorPaginaRef.current = hayMasPorPagina

  const fetchPagina = useCallback(
    async (numeroPagina) => {
      const _paginas         = paginasRef.current
      const _cursores        = cursoresRef.current
      const _hayMasPorPagina = hayMasPorPaginaRef.current

      if (_paginas[numeroPagina]) {
        setPaginaActual(numeroPagina)
        setHayMas(_hayMasPorPagina[numeroPagina] ?? true)
        return
      }

      setCargando(true)
      setError(null)

      try {
        const constraints = [
          orderBy('creadoEn', 'desc'),
          limit(pageSize + 1),
        ]

        if (numeroPagina > 0) {
          const cursorAnterior = _cursores[numeroPagina - 1]
          if (!cursorAnterior) { setCargando(false); return }
          constraints.push(startAfter(cursorAnterior))
        }

        const q = query(collection(db, COLECCION), ...constraints)
        const snapshot = await getDocs(q)

        if (!mountedRef.current) return

        const docs        = snapshot.docs
        const tieneExtra  = docs.length > pageSize
        const docsPagina  = tieneExtra ? docs.slice(0, pageSize) : docs
        const productos   = docsPagina.map((d) => ({ id: d.id, ...d.data() }))
        const lastVisible = docsPagina[docsPagina.length - 1] || null

        setPaginas((prev) => {
          const next = [...prev]; next[numeroPagina] = productos; return next
        })
        setCursores((prev) => {
          const next = [...prev]; next[numeroPagina] = lastVisible; return next
        })
        setHayMasPorPagina((prev) => {
          const next = [...prev]; next[numeroPagina] = tieneExtra; return next
        })
        setHayMas(tieneExtra)
        setPaginaActual(numeroPagina)

      } catch (err) {
        if (!mountedRef.current) return
        console.error('[Firestore] useProductosAdminPaginados error:', err)
        setError(err?.message || 'Error al cargar productos (admin)')
      } finally {
        if (mountedRef.current) setCargando(false)
      }
    },
    [pageSize]
  )

  useEffect(() => {
    fetchPagina(0)
  }, [fetchPagina])

  const siguiente = () => { if (!hayMas || cargando) return; fetchPagina(paginaActual + 1) }
  const anterior  = () => { if (paginaActual === 0 || cargando) return; fetchPagina(paginaActual - 1) }

  const refetch = () => {
    const newPaginas = [...paginasRef.current]
    newPaginas[paginaActual] = undefined
    paginasRef.current = newPaginas
    setPaginas(newPaginas)
    fetchPagina(paginaActual)
  }

  // Actualizar un producto en memoria sin re-fetch (toggle activo, etc.)
  const actualizarEnMemoria = (id, cambios) => {
    setPaginas((prev) =>
      prev.map((pagina) =>
        pagina ? pagina.map((p) => (p.id === id ? { ...p, ...cambios } : p)) : pagina
      )
    )
  }

  // Eliminar un producto en memoria sin re-fetch
  const eliminarDeMemoria = (id) => {
    setPaginas((prev) =>
      prev.map((pagina) =>
        pagina ? pagina.filter((p) => p.id !== id) : pagina
      )
    )
  }

  return {
    productos: paginas[paginaActual] || [],
    cargando,
    error,
    paginaActual,
    hayMas,
    hayAnterior: paginaActual > 0,
    siguiente,
    anterior,
    refetch,
    actualizarEnMemoria,
    eliminarDeMemoria,
  }
}