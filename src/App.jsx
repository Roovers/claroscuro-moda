import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ScrollToTop from './components/ScrollToTop' 

// Layout público
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton'

// Páginas públicas
import Home from './pages/Home'
import Catalogo from './pages/Catalogo'
import Producto from './pages/Producto'
import Carrito from './pages/Carrito'
import Contacto from './pages/Contacto'

// Páginas admin
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import ProductoForm from './pages/admin/ProductoForm'
import HomeSettings from './pages/admin/HomeSettings'

// Ruta protegida
const RutaProtegida = ({ children }) => {
  const { esAdmin, cargando } = useAuth()
  if (cargando) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando...</div>
  return esAdmin ? children : <Navigate to="/admin/login" replace />
}

// Layout público (con Navbar/Footer + botón flotante)
const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
    <WhatsAppFloatingButton />
  </>
)

const App = () => {
  return (
    <>
    <ScrollToTop />
      <Routes>
        {/* TIENDA PÚBLICA (con layout) */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />

        <Route
          path="/catalogo"
          element={
            <PublicLayout>
              <Catalogo />
            </PublicLayout>
          }
        />

        <Route
          path="/producto/:id"
          element={
            <PublicLayout>
              <Producto />
            </PublicLayout>
          }
        />

        <Route
          path="/carrito"
          element={
            <PublicLayout>
              <Carrito />
            </PublicLayout>
          }
        />

        <Route
          path="/contacto"
          element={
            <PublicLayout>
              <Contacto />
            </PublicLayout>
          }
        />

        {/* ADMIN (sin layout público) */}
        <Route path="/admin/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          }
        />

        {/* ✅ NUEVA RUTA: configuración del HOME */}
        <Route
          path="/admin/home"
          element={
            <RutaProtegida>
              <HomeSettings />
            </RutaProtegida>
          }
        />

        <Route
          path="/admin/nuevo"
          element={
            <RutaProtegida>
              <ProductoForm />
            </RutaProtegida>
          }
        />

        <Route
          path="/admin/editar/:id"
          element={
            <RutaProtegida>
              <ProductoForm />
            </RutaProtegida>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App