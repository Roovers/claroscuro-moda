/**
 * useProductosPaginados.js
 * ─────────────────────────────────────────────────────────────────
 * Hook de paginación cursor-based para Firestore.
 * Exporta:
 *   - useProductosPaginados({ categoria, pageSize })  → catálogo público
 *   - useProductosAdminPaginados({ pageSize })         → panel admin
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

// ── Configuración ────────────────────────────────────────────────
const COLECCION = 'productos'
const SESSION_TTL = 3 * 60 * 1000 // 3 minutos en ms

// ── Cache en sessionStorage ──────────────────────────────────────
const cacheGet = (key) => {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > SESSION_TTL) {
      sessionStorage.removeItem(key)
      return null
    }
    return data
  } catch {
    return null
  }
}

const cacheSet = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }))
  } catch {
    // sessionStorage lleno o bloqueado → ignorar silenciosamente
  }
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
 * Transforma una URL de Cloudinary para servir una versión thumbnail optimizada.
 * @param {string} url   - URL original de Cloudinary
 * @param {number} width - Ancho deseado (default: 480)
 * @returns {string} URL con transformación aplicada
 *
 * Resultado: ~80% menos bytes, WebP automático en browsers modernos.
 */
export const cloudinaryThumb = (url, width = 480) => {
  if (!url || !url.includes('cloudinary.com')) return url
  // Reemplaza /upload/ por /upload/w_{width},c_fill,f_auto,q_auto/
  return url.replace('/upload/', `/upload/w_${width},c_fill,f_auto,q_auto/`)
}

// ── Hook Público: catálogo ───────────────────────────────────────
/**
 * Paginación cursor-based para el catálogo público.
 * Solo lee los documentos de la página actual.
 * Volver a una página anterior NO genera nuevas lecturas (cache en memoria).
 *
 * @param {Object}  options
 * @param {string}  options.categoria  - Filtrar por categoría (opcional)
 * @param {number}  options.pageSize   - Productos por página (default: 12)
 */
export const useProductosPaginados = ({ categoria = '', pageSize = 12 } = {}) => {
  const [paginas, setPaginas] = useState([]) // array de arrays (una por página)
  const [cursores, setCursores] = useState([]) // último doc de cada página (para startAfter)
  const [hayMasPorPagina, setHayMasPorPagina] = useState([]) // hayMas de cada página
  const [paginaActual, setPaginaActual] = useState(0)
  const [hayMas, setHayMas] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const cachePrefix = `cat_${categoria || 'all'}_`
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Reset cuando cambia la categoría
  useEffect(() => {
    setPaginas([])
    setCursores([])
    setHayMasPorPagina([])
    setPaginaActual(0)
    setHayMas(true)
    setError(null)
  }, [categoria])

  const fetchPagina = useCallback(
    async (numeroPagina) => {
      // Si ya tenemos esa página en memoria, la usamos directamente
      if (paginas[numeroPagina]) {
        setPaginaActual(numeroPagina)
        // Restaurar hayMas correcto para esta página
        setHayMas(hayMasPorPagina[numeroPagina] ?? true)
        return
      }

      // Intentar desde cache sessionStorage
      const cacheKey = `${cachePrefix}p${numeroPagina}`
      const cached = cacheGet(cacheKey)
      if (cached) {
        setPaginas((prev) => {
          const next = [...prev]
          next[numeroPagina] = cached.productos
          return next
        })
        setCursores((prev) => {
          const next = [...prev]
          next[numeroPagina] = cached.lastVisible
          return next
        })
        setHayMas(cached.hayMas)
        setPaginaActual(numeroPagina)
        return
      }

      // Construir query
      setCargando(true)
      setError(null)

      try {
        const constraints = [
          where('activo', '==', true),
          orderBy('creadoEn', 'desc'),
          limit(pageSize + 1), // pedimos 1 extra para saber si hay más
        ]

        if (categoria) {
          constraints.splice(1, 0, where('categoria', '==', categoria))
        }

        // Si no es la primera página, necesitamos el cursor de la página anterior
        if (numeroPagina > 0) {
          const cursorAnterior = cursores[numeroPagina - 1]
          if (!cursorAnterior) {
            // No tenemos cursor, hay que cargar desde el principio en cadena
            // (esto no debería pasar en flujo normal)
            setCargando(false)
            return
          }
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
        const masResultados = tieneExtra

        // Guardar en memoria
        setPaginas((prev) => {
          const next = [...prev]
          next[numeroPagina] = productos
          return next
        })
        setCursores((prev) => {
          const next = [...prev]
          next[numeroPagina] = lastVisible
          return next
        })
        setHayMasPorPagina((prev) => {
          const next = [...prev]
          next[numeroPagina] = masResultados
          return next
        })
        setHayMas(masResultados)
        setPaginaActual(numeroPagina)

        // Guardar en sessionStorage
        cacheSet(cacheKey, { productos, lastVisible, hayMas: masResultados })
      } catch (err) {
        if (!mountedRef.current) return
        console.error('[Firestore] useProductosPaginados error:', err)
        setError(err?.message || 'Error al cargar productos')
      } finally {
        if (mountedRef.current) setCargando(false)
      }
    },
    [categoria, pageSize, paginas, cursores, hayMasPorPagina, cachePrefix]
  )

  // Cargar primera página al montar o al cambiar categoría
  useEffect(() => {
    fetchPagina(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, pageSize])

  const siguiente = () => {
    if (!hayMas || cargando) return
    fetchPagina(paginaActual + 1)
  }

  const anterior = () => {
    if (paginaActual === 0 || cargando) return
    fetchPagina(paginaActual - 1)
  }

  // Invalida cache (llamar después de crear/editar/eliminar)
  const invalidarCache = () => {
    cacheInvalidate(cachePrefix)
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
    refetch: () => fetchPagina(paginaActual),
  }
}

// ── Hook Admin: paginación para el panel ────────────────────────
/**
 * Paginación cursor-based para el panel de administración.
 * Carga TODOS los productos (activos e inactivos).
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

  const fetchPagina = useCallback(
    async (numeroPagina) => {
      if (paginas[numeroPagina]) {
        setPaginaActual(numeroPagina)
        setHayMas(hayMasPorPagina[numeroPagina] ?? true)
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
          const cursorAnterior = cursores[numeroPagina - 1]
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

        setPaginas((prev) => {
          const next = [...prev]
          next[numeroPagina] = productos
          return next
        })
        setCursores((prev) => {
          const next = [...prev]
          next[numeroPagina] = lastVisible
          return next
        })
        setHayMasPorPagina((prev) => {
          const next = [...prev]
          next[numeroPagina] = tieneExtra
          return next
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
    [paginas, cursores, hayMasPorPagina, pageSize]
  )

  useEffect(() => {
    fetchPagina(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const siguiente = () => { if (!hayMas || cargando) return; fetchPagina(paginaActual + 1) }
  const anterior = () => { if (paginaActual === 0 || cargando) return; fetchPagina(paginaActual - 1) }

  // Fuerza recarga de la página actual limpiando cache en memoria
  const refetch = () => {
    setPaginas((prev) => {
      const next = [...prev]
      next[paginaActual] = undefined
      return next
    })
    // Pequeño trick: forzar el fetch eliminando la entrada actual
    fetchPagina(paginaActual)
  }

  // Actualizar un producto en memoria sin refetch (toggle activo, etc.)
  const actualizarEnMemoria = (id, cambios) => {
    setPaginas((prev) =>
      prev.map((pagina) =>
        pagina
          ? pagina.map((p) => (p.id === id ? { ...p, ...cambios } : p))
          : pagina
      )
    )
  }

  // Eliminar un producto en memoria sin refetch
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