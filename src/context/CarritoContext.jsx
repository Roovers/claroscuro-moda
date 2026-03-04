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
    const numero = import.meta.env.VITE_WHATSAPP_NUMBER

    // Si falta número, devolvemos algo seguro para no romper
    if (!numero) return '#'

    const nombre = (datos.nombre || '').trim()
    const apellido = (datos.apellido || '').trim()
    const codigoPostal = (datos.codigoPostal || '').trim()
    const telefono = (datos.telefono || '').trim()
    const aclaraciones = (datos.aclaraciones || '').trim()

    const detalle = state.items
      .map((item) => {
        const unit = Number(item.precio || 0)
        const qty = Number(item.cantidad || 0)
        const sub = unit * qty

        return (
          `• ${item.nombre}\n` +
          `  - Talle: ${item.talle}\n` +
          `  - Color: ${item.color}\n` +
          `  - Cantidad: ${qty}\n` +
          `  - Precio unitario: $${unit.toLocaleString('es-AR')}\n` +
          `  - Subtotal: $${sub.toLocaleString('es-AR')}`
        )
      })
      .join('\n\n')

    const bloqueCliente =
      nombre || apellido || codigoPostal || telefono || aclaraciones
        ? `*Datos del cliente*\n` +
          `Nombre: ${nombre || '-'}\n` +
          `Apellido: ${apellido || '-'}\n` +
          `Código Postal: ${codigoPostal || '-'}\n` +
          `Teléfono: ${telefono || '-'}\n` +
          (aclaraciones ? `Aclaraciones: ${aclaraciones}\n` : '')
        : ''

    const mensaje =
      `¡Hola! Quiero realizar el siguiente pedido:\n\n` +
      (bloqueCliente ? `${bloqueCliente}\n` : '') +
      `*Detalle del pedido*\n\n` +
      `${detalle}\n\n` +
      `*Total: $${total.toLocaleString('es-AR')}*`

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