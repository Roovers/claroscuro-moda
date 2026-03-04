export const CATEGORIAS = [
  { value: 'remeras', label: 'Remeras' },
  { value: 'pantalones', label: 'Pantalones' },
  { value: 'vestidos', label: 'Vestidos' },
  { value: 'sweaters', label: 'Sweaters / Buzos' },
  { value: 'sacos', label: 'Sacos / Abrigos' },

  // ✅ NUEVO: Calzado oficial (para filtros + navbar + chips)
  { value: 'calzado', label: 'Calzado' },

  { value: 'accesorios', label: 'Accesorios' },
  { value: 'conjuntos', label: 'Conjuntos' },
  { value: 'sale', label: 'Sale / Ofertas' },
]

// ✅ Talles prendas (mantengo tu export original TALLES para compatibilidad)
export const TALLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Único']

// ✅ Alias por si querés usarlo más explícito
export const TALLES_PRENDAS = TALLES

// ✅ NUEVO: Talles calzado (string para que coincida con lo que guardamos/mostramos)
export const TALLES_CALZADO = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']

export const COLORES_PRESET = [
  { nombre: 'Negro', hex: '#1a1a1a' },
  { nombre: 'Blanco', hex: '#f5f5f0' },
  { nombre: 'Beige', hex: '#c8b89a' },
  { nombre: 'Marrón', hex: '#6b4c3b' },
  { nombre: 'Gris', hex: '#9e9e9e' },
  { nombre: 'Verde', hex: '#4a6741' },
  { nombre: 'Azul', hex: '#3d5a80' },
  { nombre: 'Rojo', hex: '#b5312c' },
  { nombre: 'Rosa', hex: '#d4a0a0' },
  { nombre: 'Naranja', hex: '#c96a2e' },
  { nombre: 'Amarillo', hex: '#d4b86a' },
  { nombre: 'Lila', hex: '#9b8db5' },
]