/**
 * useProductosPaginados.js
 * ─────────────────────────────────────────────────────────────────
 * Hook de paginación cursor-based para Firestore.
 *
 * DECISIONES DE DISEÑO:
 *
 * 1. Cursor-based pagination (startAfter): la más eficiente para Firestore.
 *    Cada fetch lee exactamente pageSize+1 docs, nunca un full scan.
 *
 * 2. Cursores SOLO en memoria (useRef). Los DocumentSnapshot de Firestore
 *    no son serializables a JSON. Guardarlos en sessionStorage los convierte
 *    en objetos planos que startAfter() rechaza silenciosamente.
 *    Si el usuario recarga la página, los cursores se resetean y se
 *    refetchea desde página 0 — comportamiento correcto y seguro.
 *
 * 3. Refs como fuente de verdad interna de fetchPagina. Evita el problema
 *    de "stale closure" donde useCallback capturaba el estado del render
 *    anterior al cambiar de categoría, mostrando productos incorrectos.
 *
 * 4. Índices compuestos requeridos en Firebase Console:
 *    - Collection: productos | Fields: activo ASC, creadoEn DESC
 *    - Collection: productos | Fields: categoria ASC, activo ASC, creadoEn DESC
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
export const cloudinaryThumb = (url, width = 480) => {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/w_${width},c_fill,f_auto,q_auto/`)
}

// ── Hook Público: catálogo ───────────────────────────────────────
export const useProductosPaginados = ({ categoria = '', pageSize = 12 } = {}) => {
  // Estado solo para disparar re-renders
  const [productos, setProductos] = useState([])
  const [paginaActual, setPaginaActual] = useState(0)
  const [hayMas, setHayMas] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  // Refs: fuente de verdad mutable, siempre actualizada, sin closures stale
  const paginasRef = useRef([])
  const cursoresRef = useRef([])          // DocumentSnapshot — NUNCA serializar a JSON
  const hayMasPorPaginaRef = useRef([])
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Reset SINCRÓNICO al cambiar categoría.
  // Al limpiar los refs antes de que fetchPagina se ejecute, garantizamos
  // que no se reutilicen datos de una categoría anterior.
  useEffect(() => {
    paginasRef.current = []
    cursoresRef.current = []
    hayMasPorPaginaRef.current = []
    setProductos([])
    setPaginaActual(0)
    setHayMas(true)
    setError(null)
  }, [categoria])

  const fetchPagina = useCallback(
    async (numeroPagina) => {
      // Cache en memoria (refs siempre frescos)
      if (paginasRef.current[numeroPagina]) {
        setPaginaActual(numeroPagina)
        setProductos(paginasRef.current[numeroPagina])
        setHayMas(hayMasPorPaginaRef.current[numeroPagina] ?? true)
        return
      }

      // Para páginas > 0 necesitamos el cursor de la anterior en memoria.
      // Si no está (ej: usuario recargó la página), no podemos continuar.
      if (numeroPagina > 0 && !cursoresRef.current[numeroPagina - 1]) {
        setError('Navegá desde la página anterior para continuar.')
        return
      }

      setCargando(true)
      setError(null)

      try {
        // Construir constraints. El orden importa para los índices compuestos:
        // where de igualdad primero, luego where de rango/desigualdad, luego orderBy.
        const constraints = []

        if (categoria) {
          constraints.push(where('categoria', '==', categoria))
        }

        constraints.push(
          where('activo', '==', true),
          orderBy('creadoEn', 'desc'),
          limit(pageSize + 1),  // +1 para detectar si hay más sin un fetch extra
        )

        if (numeroPagina > 0) {
          // startAfter recibe el DocumentSnapshot original, no un objeto plano.
          // Por eso los cursores viven solo en memoria (cursoresRef), nunca en sessionStorage.
          constraints.push(startAfter(cursoresRef.current[numeroPagina - 1]))
        }

        const q = query(collection(db, COLECCION), ...constraints)
        const snapshot = await getDocs(q)

        if (!mountedRef.current) return

        const docs = snapshot.docs
        const tieneExtra = docs.length > pageSize
        const docsPagina = tieneExtra ? docs.slice(0, pageSize) : docs
        const productosPagina = docsPagina.map((d) => ({ id: d.id, ...d.data() }))

        // El cursor ES el DocumentSnapshot de Firestore — no transformar, no serializar
        const lastVisible = docsPagina.length > 0 ? docsPagina[docsPagina.length - 1] : null

        // Guardar en refs (cursores incluidos, en memoria)
        paginasRef.current[numeroPagina] = productosPagina
        cursoresRef.current[numeroPagina] = lastVisible
        hayMasPorPaginaRef.current[numeroPagina] = tieneExtra

        setProductos(productosPagina)
        setHayMas(tieneExtra)
        setPaginaActual(numeroPagina)
      } catch (err) {
        if (!mountedRef.current) return
        console.error('[Firestore] useProductosPaginados error:', err)

        if (String(err?.message).toLowerCase().includes('index')) {
          setError(
            `${err.message}\n\nTIP: Abrí el link "Create index" que aparece en la consola del navegador.`
          )
        } else {
          setError(err?.message || 'Error al cargar productos')
        }
      } finally {
        if (mountedRef.current) setCargando(false)
      }
    },
    [categoria, pageSize]
  )

  useEffect(() => {
    fetchPagina(0)
  }, [categoria, pageSize, fetchPagina])

  const siguiente = () => {
    if (!hayMas || cargando) return
    fetchPagina(paginaActual + 1)
  }

  const anterior = () => {
    if (paginaActual === 0 || cargando) return
    fetchPagina(paginaActual - 1)
  }

  const invalidarCache = () => {
    paginasRef.current = []
    cursoresRef.current = []
    hayMasPorPaginaRef.current = []
    setProductos([])
    setPaginaActual(0)
    setHayMas(true)
  }

  return {
    productos,
    cargando,
    error,
    paginaActual,
    hayMas,
    hayAnterior: paginaActual > 0,
    siguiente,
    anterior,
    invalidarCache,
    refetch: () => {
      paginasRef.current[paginaActual] = undefined
      fetchPagina(paginaActual)
    },
  }
}

// ── Hook Admin ───────────────────────────────────────────────────
export const useProductosAdminPaginados = ({ pageSize = 15 } = {}) => {
  const [productos, setProductos] = useState([])
  const [paginaActual, setPaginaActual] = useState(0)
  const [hayMas, setHayMas] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const paginasRef = useRef([])
  const cursoresRef = useRef([])
  const hayMasPorPaginaRef = useRef([])
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchPagina = useCallback(
    async (numeroPagina) => {
      if (paginasRef.current[numeroPagina]) {
        setPaginaActual(numeroPagina)
        setProductos(paginasRef.current[numeroPagina])
        setHayMas(hayMasPorPaginaRef.current[numeroPagina] ?? true)
        return
      }

      setCargando(true)
      setError(null)

      try {
        const constraints = [orderBy('creadoEn', 'desc'), limit(pageSize + 1)]

        if (numeroPagina > 0) {
          const cursor = cursoresRef.current[numeroPagina - 1]
          if (!cursor) { setCargando(false); return }
          constraints.push(startAfter(cursor))
        }

        const q = query(collection(db, COLECCION), ...constraints)
        const snapshot = await getDocs(q)
        if (!mountedRef.current) return

        const docs = snapshot.docs
        const tieneExtra = docs.length > pageSize
        const docsPagina = tieneExtra ? docs.slice(0, pageSize) : docs
        const productosPagina = docsPagina.map((d) => ({ id: d.id, ...d.data() }))
        const lastVisible = docsPagina.length > 0 ? docsPagina[docsPagina.length - 1] : null

        paginasRef.current[numeroPagina] = productosPagina
        cursoresRef.current[numeroPagina] = lastVisible
        hayMasPorPaginaRef.current[numeroPagina] = tieneExtra

        setProductos(productosPagina)
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

  useEffect(() => { fetchPagina(0) }, [fetchPagina])

  const siguiente = () => { if (!hayMas || cargando) return; fetchPagina(paginaActual + 1) }
  const anterior = () => { if (paginaActual === 0 || cargando) return; fetchPagina(paginaActual - 1) }

  const refetch = () => {
    paginasRef.current[paginaActual] = undefined
    fetchPagina(paginaActual)
  }

  const actualizarEnMemoria = (id, cambios) => {
    paginasRef.current = paginasRef.current.map((p) =>
      p ? p.map((x) => (x.id === id ? { ...x, ...cambios } : x)) : p
    )
    setProductos((prev) => prev.map((x) => (x.id === id ? { ...x, ...cambios } : x)))
  }

  const eliminarDeMemoria = (id) => {
    paginasRef.current = paginasRef.current.map((p) =>
      p ? p.filter((x) => x.id !== id) : p
    )
    setProductos((prev) => prev.filter((x) => x.id !== id))
  }

  return {
    productos,
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