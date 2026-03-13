/**
 * useProductosPaginados.js
 * ─────────────────────────────────────────────────────────────────
 * Hook de paginación cursor-based para Firestore.
 *
 * FIX: Se reemplazaron las dependencias de closure (paginas, cursores)
 * por refs sincrónicas (paginasRef, cursoresRef). Esto evita el bug donde
 * al cambiar de categoría, fetchPagina veía datos stale de la categoría
 * anterior y hacía early-return sin ir a Firestore.
 *
 * Exports:
 *   - useProductosPaginados({ categoria, pageSize })  → catálogo público
 *   - useProductosAdminPaginados({ pageSize })         → panel admin (legacy, compatible)
 *   - cloudinaryThumb(url, width)                      → helper Cloudinary
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

// ── Config ───────────────────────────────────────────────────────
const COLECCION = 'productos'
const SESSION_TTL = 3 * 60 * 1000 // 3 min

// ── Cache sessionStorage ─────────────────────────────────────────
const cacheGet = (key) => {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > SESSION_TTL) { sessionStorage.removeItem(key); return null }
    return data
  } catch { return null }
}

const cacheSet = (key, data) => {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

const cacheInvalidate = (prefix) => {
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => sessionStorage.removeItem(k))
  } catch {}
}

// ── Helper Cloudinary ────────────────────────────────────────────
/**
 * Transforma una URL de Cloudinary a thumbnail optimizado.
 * ~80% menos bytes, WebP automático en browsers modernos.
 */
export const cloudinaryThumb = (url, width = 480) => {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/w_${width},c_fill,f_auto,q_auto/`)
}

// ── Hook Público: catálogo ───────────────────────────────────────
/**
 * Paginación cursor-based para el catálogo público.
 *
 * FIX aplicado: paginasRef / cursoresRef / hayMasPorPaginaRef
 * se asignan sincrónicamente en cada render, por lo que fetchPagina
 * siempre lee el valor ACTUAL (no el valor capturado en la closure
 * del render anterior). Esto resuelve el bug donde cambiar categoría
 * mostraba los productos de la categoría anterior.
 */
export const useProductosPaginados = ({ categoria = '', pageSize = 12 } = {}) => {
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

  // ── CLAVE DEL FIX: refs sincrónicas ──────────────────────────
  // Se asignan en cada render (fuera de useEffect), por lo que
  // fetchPagina siempre lee el valor más reciente, no el de la closure.
  const paginasRef = useRef(paginas)
  const cursoresRef = useRef(cursores)
  const hayMasPorPaginaRef = useRef(hayMasPorPagina)

  paginasRef.current = paginas
  cursoresRef.current = cursores
  hayMasPorPaginaRef.current = hayMasPorPagina
  // ─────────────────────────────────────────────────────────────

  const cachePrefix = `cat_${categoria || 'all'}_`

  const fetchPagina = useCallback(
    async (numeroPagina) => {
      // ✅ Lee desde ref (siempre actual), no desde closure (stale)
      if (paginasRef.current[numeroPagina]) {
        setPaginaActual(numeroPagina)
        setHayMas(hayMasPorPaginaRef.current[numeroPagina] ?? true)
        return
      }

      // Intentar desde cache sessionStorage
      const cacheKey = `${cachePrefix}p${numeroPagina}`
      const cached = cacheGet(cacheKey)
      if (cached) {
        setPaginas((prev) => { const n = [...prev]; n[numeroPagina] = cached.productos; return n })
        setCursores((prev) => { const n = [...prev]; n[numeroPagina] = cached.lastVisible; return n })
        setHayMasPorPagina((prev) => { const n = [...prev]; n[numeroPagina] = cached.hayMas; return n })
        setHayMas(cached.hayMas)
        setPaginaActual(numeroPagina)
        return
      }

      setCargando(true)
      setError(null)

      try {
        const constraints = [
          where('activo', '==', true),
          orderBy('creadoEn', 'desc'),
          limit(pageSize + 1),
        ]

        if (categoria) {
          constraints.splice(1, 0, where('categoria', '==', categoria))
        }

        if (numeroPagina > 0) {
          // ✅ También usa ref para cursores
          const cursorAnterior = cursoresRef.current[numeroPagina - 1]
          if (!cursorAnterior) { setCargando(false); return }
          constraints.push(startAfter(cursorAnterior))
        }

        const q = query(collection(db, COLECCION), ...constraints)
        const snapshot = await getDocs(q)

        if (!mountedRef.current) return

        const docs = snapshot.docs
        const tieneExtra = docs.length > pageSize
        const docsPagina = tieneExtra ? docs.slice(0, pageSize) : docs
        const productos = docsPagina.map((d) => ({ id: d.id, ...d.data() }))
        const lastVisible = docsPagina[docsPagina.length - 1] || null

        setPaginas((prev) => { const n = [...prev]; n[numeroPagina] = productos; return n })
        setCursores((prev) => { const n = [...prev]; n[numeroPagina] = lastVisible; return n })
        setHayMasPorPagina((prev) => { const n = [...prev]; n[numeroPagina] = tieneExtra; return n })
        setHayMas(tieneExtra)
        setPaginaActual(numeroPagina)

        cacheSet(cacheKey, { productos, lastVisible, hayMas: tieneExtra })
      } catch (err) {
        if (!mountedRef.current) return
        console.error('[Firestore] useProductosPaginados error:', err)
        setError(err?.message || 'Error al cargar productos')
      } finally {
        if (mountedRef.current) setCargando(false)
      }
    },
    // ✅ categoria y pageSize son las únicas deps relevantes para la query.
    // Las refs (paginasRef, cursoresRef) no van en deps porque son refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categoria, pageSize, cachePrefix]
  )

  // ── Efecto único: reset + fetch inicial ──────────────────────
  // Combinar reset y fetch en un solo efecto elimina la condición de
  // carrera entre dos efectos separados.
  useEffect(() => {
    // 1. Reset refs inmediatamente (sincrónico) — fetchPagina los leerá vacíos
    paginasRef.current = []
    cursoresRef.current = []
    hayMasPorPaginaRef.current = []

    // 2. Reset state
    setPaginas([])
    setCursores([])
    setHayMasPorPagina([])
    setPaginaActual(0)
    setHayMas(true)
    setError(null)

    // 3. Fetch — como paginasRef.current[0] es undefined, irá a Firestore
    fetchPagina(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, pageSize])

  const siguiente = () => { if (!hayMas || cargando) return; fetchPagina(paginaActual + 1) }
  const anterior = () => { if (paginaActual === 0 || cargando) return; fetchPagina(paginaActual - 1) }

  const invalidarCache = () => {
    cacheInvalidate(cachePrefix)
    paginasRef.current = []
    cursoresRef.current = []
    hayMasPorPaginaRef.current = []
    setPaginas([])
    setCursores([])
    setPaginaActual(0)
    setHayMas(true)
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
    refetch: () => {
      invalidarCache()
      fetchPagina(0)
    },
  }
}

// ── Hook Admin Paginado (legacy, compatible) ─────────────────────
/**
 * Mantenido por compatibilidad. Para el Dashboard se recomienda
 * usar useProductosAdmin de useProductosAdmin.js (filtrado global).
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
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const paginasRef = useRef(paginas)
  const cursoresRef = useRef(cursores)
  const hayMasPorPaginaRef = useRef(hayMasPorPagina)

  paginasRef.current = paginas
  cursoresRef.current = cursores
  hayMasPorPaginaRef.current = hayMasPorPagina

  const fetchPagina = useCallback(async (numeroPagina) => {
    if (paginasRef.current[numeroPagina]) {
      setPaginaActual(numeroPagina)
      setHayMas(hayMasPorPaginaRef.current[numeroPagina] ?? true)
      return
    }

    setCargando(true)
    setError(null)

    try {
      const constraints = [orderBy('creadoEn', 'desc'), limit(pageSize + 1)]

      if (numeroPagina > 0) {
        const cursorAnterior = cursoresRef.current[numeroPagina - 1]
        if (!cursorAnterior) { setCargando(false); return }
        constraints.push(startAfter(cursorAnterior))
      }

      const q = query(collection(db, COLECCION), ...constraints)
      const snapshot = await getDocs(q)

      if (!mountedRef.current) return

      const docs = snapshot.docs
      const tieneExtra = docs.length > pageSize
      const docsPagina = tieneExtra ? docs.slice(0, pageSize) : docs
      const productos = docsPagina.map((d) => ({ id: d.id, ...d.data() }))
      const lastVisible = docsPagina[docsPagina.length - 1] || null

      setPaginas((prev) => { const n = [...prev]; n[numeroPagina] = productos; return n })
      setCursores((prev) => { const n = [...prev]; n[numeroPagina] = lastVisible; return n })
      setHayMasPorPagina((prev) => { const n = [...prev]; n[numeroPagina] = tieneExtra; return n })
      setHayMas(tieneExtra)
      setPaginaActual(numeroPagina)
    } catch (err) {
      if (!mountedRef.current) return
      console.error('[Firestore] useProductosAdminPaginados error:', err)
      setError(err?.message || 'Error al cargar productos (admin)')
    } finally {
      if (mountedRef.current) setCargando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize])

  useEffect(() => { fetchPagina(0) }, []) // eslint-disable-line

  const siguiente = () => { if (!hayMas || cargando) return; fetchPagina(paginaActual + 1) }
  const anterior = () => { if (paginaActual === 0 || cargando) return; fetchPagina(paginaActual - 1) }

  const refetch = () => {
    setPaginas((prev) => { const n = [...prev]; n[paginaActual] = undefined; return n })
    fetchPagina(paginaActual)
  }

  const actualizarEnMemoria = (id, cambios) => {
    setPaginas((prev) => prev.map((p) => p ? p.map((x) => x.id === id ? { ...x, ...cambios } : x) : p))
  }

  const eliminarDeMemoria = (id) => {
    setPaginas((prev) => prev.map((p) => p ? p.filter((x) => x.id !== id) : p))
  }

  return {
    productos: paginas[paginaActual] || [],
    cargando, error,
    paginaActual, hayMas,
    hayAnterior: paginaActual > 0,
    siguiente, anterior, refetch,
    actualizarEnMemoria, eliminarDeMemoria,
  }
}