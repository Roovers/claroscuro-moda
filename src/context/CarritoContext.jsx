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
  if (!itemsCarrito || itemsCarrito.length === 0) return null

  const money = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`

  const detalle = itemsCarrito.map((item) => {
    const nombreProd = item.nombre || 'Producto'
    const talle = item.talle || '-'
    const color = item.color || '-'
    const cantidad = Number(item.cantidad ?? 1)
    const precioUnit = Number(item.precio ?? 0)
    const subtotal = precioUnit * cantidad

    return (
`* ${nombreProd}
  - Talle: ${talle}
  - Color: ${color}
  - Cantidad: ${cantidad}
  - Precio unitario: ${money(precioUnit)}
  - Subtotal: ${money(subtotal)}`
    )
  }).join('\n\n')

  const total = itemsCarrito.reduce(
    (acc, i) => acc + Number(i.precio ?? 0) * Number(i.cantidad ?? 1),
    0
  )

  const mensaje =
`¡Hola! Quiero realizar el siguiente pedido:

Datos del cliente
Nombre: ${nombre || '-'}
Apellido: ${apellido || '-'}
Código Postal: ${codigoPostal || '-'}
Teléfono: ${telefono || '-'}
Aclaraciones: ${aclaraciones ? aclaraciones : '-'}

Detalle del pedido

${detalle}

Total: ${money(total)}`

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