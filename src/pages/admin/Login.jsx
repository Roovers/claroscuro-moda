import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setError('Email o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.titulo}>claroscuro</h1>
        <p style={styles.subtitulo}>Panel de administración</p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.boton} disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f0',
  },
  card: {
    background: '#fff',
    padding: '2.5rem',
    borderRadius: '4px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
  },
  titulo: {
    fontFamily: 'serif',
    fontSize: '1.8rem',
    margin: '0 0 0.25rem',
    letterSpacing: '0.05em',
  },
  subtitulo: {
    color: '#888',
    fontSize: '0.85rem',
    margin: '0 0 2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '0.75rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '2px',
    fontSize: '0.95rem',
    outline: 'none',
  },
  boton: {
    padding: '0.75rem',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '2px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  error: {
    color: '#c0392b',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    padding: '0.5rem',
    background: '#fdecea',
    borderRadius: '2px',
  },
}

export default Login