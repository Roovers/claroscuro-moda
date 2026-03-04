import { useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COLECCION = 'productos'

/**
 * Construye una query de Firestore para productos públicos.
 * IMPORTANTE:
 * - Si combinás where + orderBy, Firestore puede pedir índices compuestos.
 * - Si te llega el error de "requires an index", creás el índice desde el link que te da Firebase.
 */
const buildPublicQuery = ({ categoria, destacado, limite } = {}) => {
  const colRef = collection(db, COLECCION)

  const constraints = [
    where('activo', '==', true),
    orderBy('creadoEn', 'desc'),
  ]

  if (categoria) constraints.splice(1, 0, where('categoria', '==', categoria))
  if (destacado) constraints.splice(1, 0, where('destacado', '==', true))
  if (typeof limite === 'number' && limite > 0) constraints.push(limit(limite))

  return query(colRef, ...constraints)
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook público: listar productos (tienda)
// ─────────────────────────────────────────────────────────────────────────────
export const useProductos = (filtros = {}) => {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Estabilizamos dependencias
  const deps = useMemo(
    () => ({
      categoria: filtros.categoria || '',
      destacado: Boolean(filtros.destacado),
      limite: typeof filtros.limite === 'number' ? filtros.limite : null,
    }),
    [filtros.categoria, filtros.destacado, filtros.limite]
  )

  const fetchProductos = async () => {
    try {
      setError(null)
      setCargando(true)

      const q = buildPublicQuery({
        categoria: deps.categoria || undefined,
        destacado: deps.destacado || undefined,
        limite: deps.limite || undefined,
      })

      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

      if (!mountedRef.current) return
      setProductos(data)
    } catch (err) {
      if (!mountedRef.current) return
      setError(err?.message || 'Error al cargar productos')
    } finally {
      if (!mountedRef.current) return
      setCargando(false)
    }
  }

  useEffect(() => {
    fetchProductos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps.categoria, deps.destacado, deps.limite])

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD “liviano” (para compatibilidad con tu ProductoForm actual)
  // Nota: Esto NO es el panel admin completo, para eso está useProductosAdmin.
  // ─────────────────────────────────────────────────────────────────────────
  const obtenerProducto = async (id) => {
    const docRef = doc(db, COLECCION, id)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  }

  const crearProducto = async (datos) => {
    const docRef = await addDoc(collection(db, COLECCION), {
      ...datos,
      activo: true,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    })
    return docRef.id
  }

  const actualizarProducto = async (id, datos) => {
    const docRef = doc(db, COLECCION, id)
    await updateDoc(docRef, { ...datos, actualizadoEn: serverTimestamp() })
  }

  const eliminarProducto = async (id) => {
    const docRef = doc(db, COLECCION, id)
    await deleteDoc(docRef)
  }

  const toggleActivo = async (id, estadoActual) => {
    const docRef = doc(db, COLECCION, id)
    await updateDoc(docRef, {
      activo: !estadoActual,
      actualizadoEn: serverTimestamp(),
    })
  }

  return {
    productos,
    cargando,
    error,
    refetch: fetchProductos,

    // compatibilidad admin / forms
    obtenerProducto,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    toggleActivo,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook público: obtener un producto por ID (detalle)
// ─────────────────────────────────────────────────────────────────────────────
export const useProducto = (id) => {
  const [producto, setProducto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!id) return

    const fetchProducto = async () => {
      try {
        setError(null)
        setCargando(true)

        const docRef = doc(db, COLECCION, id)
        const docSnap = await getDoc(docRef)

        if (!mountedRef.current) return

        if (docSnap.exists()) {
          setProducto({ id: docSnap.id, ...docSnap.data() })
        } else {
          setProducto(null)
          setError('Producto no encontrado')
        }
      } catch (err) {
        if (!mountedRef.current) return
        setError(err?.message || 'Error al cargar producto')
      } finally {
        if (!mountedRef.current) return
        setCargando(false)
      }
    }

    fetchProducto()
  }, [id])

  return { producto, cargando, error }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook admin: lista completa + CRUD + refresh
// ─────────────────────────────────────────────────────────────────────────────
export const useProductosAdmin = () => {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchTodos = async () => {
    try {
      setError(null)
      setCargando(true)
      const q = query(collection(db, COLECCION), orderBy('creadoEn', 'desc'))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

      if (!mountedRef.current) return
      setProductos(data)
    } catch (err) {
      if (!mountedRef.current) return
      setError(err?.message || 'Error al cargar productos (admin)')
    } finally {
      if (!mountedRef.current) return
      setCargando(false)
    }
  }

  useEffect(() => {
    fetchTodos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const crearProducto = async (datos) => {
    const docRef = await addDoc(collection(db, COLECCION), {
      ...datos,
      activo: true,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    })
    await fetchTodos()
    return docRef.id
  }

  const actualizarProducto = async (id, datos) => {
    const docRef = doc(db, COLECCION, id)
    await updateDoc(docRef, { ...datos, actualizadoEn: serverTimestamp() })
    await fetchTodos()
  }

  const eliminarProducto = async (id) => {
    const docRef = doc(db, COLECCION, id)
    await deleteDoc(docRef)
    await fetchTodos()
  }

  const toggleActivo = async (id, estadoActual) => {
    const docRef = doc(db, COLECCION, id)
    await updateDoc(docRef, { activo: !estadoActual, actualizadoEn: serverTimestamp() })
    await fetchTodos()
  }

  const obtenerProducto = async (id) => {
    const docRef = doc(db, COLECCION, id)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  }

  return {
    productos,
    cargando,
    error,
    refetch: fetchTodos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    toggleActivo,
    obtenerProducto,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: subir imagen a Cloudinary
// ─────────────────────────────────────────────────────────────────────────────
export const subirImagenCloudinary = async (archivo) => {
  const formData = new FormData()
  formData.append('file', archivo)
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', 'productos')

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) throw new Error('Error al subir imagen')
  const data = await res.json()
  return data.secure_url
}