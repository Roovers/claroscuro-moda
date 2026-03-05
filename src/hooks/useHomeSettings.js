import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export const useHomeSettings = () => {
  const [settings, setSettings] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const ref = doc(db, 'settings', 'home')
        const snap = await getDoc(ref)

        if (snap.exists()) {
          setSettings(snap.data())
        } else {
          // fallback por si todavía no existe el documento
          setSettings({
            heroTitle: 'Una colección minimal, cuidada y atemporal',
            heroSubtitle:
              'Descubrí prendas pensadas para durar. Armá tu carrito y finalizá el pedido por WhatsApp en segundos.',
            heroImage: null,
            heroTag: 'Nueva temporada',
          })
        }
      } catch (err) {
        console.error('Error cargando home settings:', err)
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }

    fetchSettings()
  }, [])

  return { settings, cargando, error }
}