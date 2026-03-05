import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { CarritoProvider } from './context/CarritoContext'

const basename = import.meta.env.BASE_URL
const isGhPages = window.location.hostname.endsWith('github.io')

const Providers = ({ children }) => (
  <AuthProvider>
    <CarritoProvider>{children}</CarritoProvider>
  </AuthProvider>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isGhPages ? (
      <HashRouter>
        <Providers>
          <App />
        </Providers>
      </HashRouter>
    ) : (
      <BrowserRouter basename={basename}>
        <Providers>
          <App />
        </Providers>
      </BrowserRouter>
    )}
  </React.StrictMode>
)