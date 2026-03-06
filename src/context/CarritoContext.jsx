import { createContext, useContext, useReducer } from 'react'

const CarritoContext = createContext()

export const useCarrito = () => {
  const context = useContext(CarritoContext)
  if (!context) throw new Error('useCarrito debe usarse dentro de CarritoProvider')
  return context
}

const carritoReducer = (state, action) => {
  switch (action.type) {
    case 'AGREGAR': {
      const { producto, talle, color, cantidad } = action.payload
      const key = `${producto.id}-${talle}-${color}`
      const existe = state.items.find((i) => i.key === key)

      if (existe) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.key === key ? { ...i, cantidad: i.cantidad + cantidad } : i
          ),
        }
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            key,
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagenes?.[0] || '',
            talle,
            color,
            cantidad,
          },
        ],
      }
    }

    case 'QUITAR': {
      return {
        ...state,
        items: state.items.filter((i) => i.key !== action.payload.key),
      }
    }

    case 'ACTUALIZAR_CANTIDAD': {
      const { key, cantidad } = action.payload
      if (cantidad <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => i.key !== key),
        }
      }
      return {
        ...state,
        items: state.items.map((i) => (i.key === key ? { ...i, cantidad } : i)),
      }
    }

    case 'VACIAR':
      return { ...state, items: [] }

    default:
      return state
  }
}

const initialState = { items: [] }

export const CarritoProvider = ({ children }) => {
  const [state, dispatch] = useReducer(carritoReducer, initialState)

  const agregar = (producto, talle, color, cantidad = 1) => {
    dispatch({ type: 'AGREGAR', payload: { producto, talle, color, cantidad } })
  }

  const quitar = (key) => {
    dispatch({ type: 'QUITAR', payload: { key } })
  }

  const actualizarCantidad = (key, cantidad) => {
    dispatch({ type: 'ACTUALIZAR_CANTIDAD', payload: { key, cantidad } })
  }

  const vaciar = () => {
    dispatch({ type: 'VACIAR' })
  }

  const total = state.items.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
  const cantidadTotal = state.items.reduce((acc, item) => acc + item.cantidad, 0)

  /**
   * Genera URL wa.me con el pedido + datos del cliente.
   * @param {Object} datos
   * @param {string} datos.nombre
   * @param {string} datos.apellido
   * @param {string} datos.codigoPostal
   * @param {string} datos.telefono
   * @param {string} datos.aclaraciones (opcional)
   */
const generarMensajeWhatsApp = (datos = {}) => {
  const numero = String(import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
  if (!numero) return null

  const {
    nombre = '',
    apellido = '',
    telefono = '',
    codigoPostal = '',
    aclaraciones = '',
  } = datos

  const itemsCarrito = state.items

  const items = itemsCarrito.map((item) => {
    const qty = item.cantidad ?? 1
    const nombreProd = item.nombre || item.titulo || 'Producto'
    const variante = [item.talle, item.color].filter(Boolean).join(' · ')
    const precio = Number(item.precio ?? 0)

    return `• ${nombreProd}${variante ? ` (${variante})` : ''} x${qty} — $${(precio * qty).toLocaleString('es-AR')}`
  })

  const subtotal = itemsCarrito.reduce(
    (acc, i) => acc + Number(i.precio ?? 0) * Number(i.cantidad ?? 1),
    0
  )

  const totalPedido = subtotal

  const mensaje =
`Hola! 👋 Quiero hacer un pedido:

🛍️ *Productos*
${items.join('\n')}

💰 *Subtotal:* $${subtotal.toLocaleString('es-AR')}
✅ *Total:* $${totalPedido.toLocaleString('es-AR')}

👤 *Datos del cliente*
• Nombre: ${nombre} ${apellido}
• Teléfono: ${telefono || '-'}
• Código Postal: ${codigoPostal || '-'}

${aclaraciones ? `📝 *Aclaraciones:* ${aclaraciones}` : ''}

Gracias! 🙌`

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}

  const value = {
    items: state.items,
    total,
    cantidadTotal,
    agregar,
    quitar,
    actualizarCantidad,
    vaciar,
    generarMensajeWhatsApp,
  }

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>
}