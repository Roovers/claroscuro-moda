import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// ✅ Ajustá rutas reales
import logo from '../../assets/logo1.png'
import fashionBg from '../../assets/login-fashion.jpg' // o ponela en /public y usá src="/login-fashion.jpg"

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => !!email.trim() && !!password.trim() && !loading, [email, password, loading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/admin')
    } catch (err) {
      setError('Credenciales inválidas. Revisá tu email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <style>{css}</style>

      <main className="auth-wrap">
        <section className="auth-shell" aria-label="Login">
          {/* Panel visual */}
          <aside
            className="auth-visual"
            style={{ backgroundImage: `url(${fashionBg})` }}
            aria-hidden="true"
          >
            <div className="auth-visual__overlay" />
            <div className="auth-visual__grain" />

            <div className="auth-visual__content">
              <div className="auth-visual__badge">GESTION DE TIENDA</div>
              <h2 className="auth-visual__title">Administración</h2>
              <p className="auth-visual__sub">
                Llevá tu negocio al siguiente nivel.
              </p>

              <div className="auth-visual__chips">
                <span className="chip">Colecciones</span>
                <span className="chip">Pedidos</span>
                <span className="chip">Contenido</span>
              </div>
            </div>

            <div className="auth-visual__footer">© {new Date().getFullYear()}</div>
          </aside>

          {/* Card / Form */}
          <section className="auth-card">
            <header className="auth-head">
              <div className="auth-head__text">
                <h1 className="auth-title">Iniciar sesión</h1>
                <p className="auth-subtitle">Ingresá tus credenciales para continuar.</p>
              </div>
            </header>

            {error && (
              <div className="auth-alert" role="alert" aria-live="polite">
                <span className="auth-alert__dot" />
                <span className="auth-alert__msg">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">Email</label>
                <div className="auth-control">
                  <span className="auth-icon" aria-hidden="true"><MailIcon /></span>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="password">Contraseña</label>
                <div className="auth-control">
                  <span className="auth-icon" aria-hidden="true"><LockIcon /></span>
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input auth-input--padRight"
                    required
                  />

                  <button
                    type="button"
                    className="auth-peek"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="auth-row">
                <label className="auth-check">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="auth-check__box" aria-hidden="true" />
                  <span className="auth-check__text">Mantener sesión</span>
                </label>

                <button
                  type="button"
                  className="auth-link"
                  onClick={() => navigate('/admin/recuperar')}
                >
                  Recuperar contraseña
                </button>
              </div>

              <button
                type="submit"
                className={`auth-btn ${loading ? 'auth-btn--loading' : ''}`}
                disabled={!canSubmit}
              >
                <span className="auth-btn__shine" aria-hidden="true" />
                <span className="auth-btn__text">{loading ? 'Ingresando…' : 'Ingresar'}</span>
                {loading && <span className="auth-spinner" aria-hidden="true" />}
              </button>

              <p className="auth-foot">
                Acceso restringido. Si necesitás credenciales, contactá al administrador.
              </p>
            </form>
          </section>
        </section>
      </main>
    </div>
  )
}

/* ---- Icons ---- */
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 6.5h16A1.5 1.5 0 0 1 21.5 8v8A1.5 1.5 0 0 1 20 17.5H4A1.5 1.5 0 0 1 2.5 16V8A1.5 1.5 0 0 1 4 6.5Z" stroke="currentColor" strokeWidth="1.6" />
    <path d="m4.2 8.2 7.1 5a1.2 1.2 0 0 0 1.4 0l7.1-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7.5 11V8.6A4.5 4.5 0 0 1 12 4.1a4.5 4.5 0 0 1 4.5 4.5V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M7 11h10a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M2.5 12s3.6-7 9.5-7 9.5 7 9.5 7-3.6 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 4.5 21 19.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M4.2 8.4C2.9 10.2 2.5 12 2.5 12s3.6 7 9.5 7c2 0 3.7-.6 5.1-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M8 6.2A9.6 9.6 0 0 1 12 5c5.9 0 9.5 7 9.5 7a16 16 0 0 1-3.3 4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M10.2 10.4A3.2 3.2 0 0 0 13.6 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

/* ---- CSS: usa tus variables globales (accent, bg, surface, border, shadows, fonts) ---- */
const css = `
.auth-root{
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding: clamp(18px, 4vw, 44px);
  position: relative;
  z-index: 1;
  font-family: var(--font-body);
}

.auth-wrap{
  width:100%;
  max-width: 1020px;
}

.auth-shell{
  display:grid;
  grid-template-columns: 1.05fr .95fr;
  border-radius: 22px;
  overflow:hidden;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.18);
  backdrop-filter: var(--glass);
  -webkit-backdrop-filter: var(--glass);
  box-shadow: var(--shadow-lg);
  animation: fadeUp .6s cubic-bezier(0.4,0,0.2,1) both;
}

/* Left / visual with photo */
.auth-visual{
  position:relative;
  min-height: 520px;
  background-size: cover;
  background-position: center;
  isolation:isolate;
}
.auth-visual__overlay{
  position:absolute; inset:0;
  background:
    linear-gradient(120deg, rgba(26,20,16,.78) 0%, rgba(26,20,16,.52) 55%, rgba(26,20,16,.25) 100%),
    radial-gradient(900px 520px at 25% 20%, rgba(184,149,106,.22), transparent 55%);
  z-index:1;
}
.auth-visual__grain{
  position:absolute; inset:0;
  z-index:2;
  opacity:.16;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
  pointer-events:none;
}
.auth-visual__content{
  position:absolute;
  left: clamp(22px, 4vw, 42px);
  right: clamp(22px, 4vw, 42px);
  bottom: clamp(22px, 4vw, 46px);
  z-index:3;
  color: rgba(255,255,255,.92);
}
.auth-visual__badge{
  display:inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.20);
  background: rgba(255,255,255,.10);
  font-weight: 800;
  letter-spacing: .18em;
  font-size: .72rem;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
}
.auth-visual__title{
  margin: 14px 0 8px;
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.03em;
  font-size: clamp(1.7rem, 2.6vw, 2.25rem);
  line-height: 1.05;
}
.auth-visual__sub{
  margin: 0 0 16px;
  color: rgba(255,255,255,.78);
  font-size: .98rem;
  line-height: 1.55;
  max-width: 44ch;
}
.auth-visual__chips{ display:flex; flex-wrap:wrap; gap:10px; }
.chip{
  display:inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(0,0,0,.18);
  color: rgba(255,255,255,.88);
  font-weight: 700;
  font-size: .86rem;
  backdrop-filter: blur(10px);
}
.auth-visual__footer{
  position:absolute;
  left: clamp(22px, 4vw, 42px);
  top: clamp(18px, 3vw, 28px);
  z-index:3;
  color: rgba(255,255,255,.62);
  font-size: .86rem;
}

/* Right / card */
.auth-card{
  background: linear-gradient(180deg, var(--surface), rgba(255,255,255,0.62));
  border-left: 1px solid var(--border);
  padding: clamp(22px, 4vw, 42px);
}
.auth-head{
  display:flex;
  align-items:center;
  gap: 14px;
  margin-bottom: 18px;
}
.auth-logo{
  width: 58px; height: 58px;
  object-fit: contain;
  filter: drop-shadow(0 10px 18px rgba(90,60,30,0.10));
}
.auth-title{
  margin:0;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.auth-subtitle{
  margin: 6px 0 0;
  color: var(--ink-3);
  font-size: .92rem;
  line-height: 1.35;
}

/* Error */
.auth-alert{
  display:flex;
  align-items:flex-start;
  gap:10px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(197,63,63,.28);
  background: rgba(197,63,63,.08);
  color: var(--danger);
  box-shadow: var(--shadow-sm);
  margin: 10px 0 16px;
  animation: fadeIn .35s ease both;
}
.auth-alert__dot{
  width:10px; height:10px; border-radius:999px;
  background: rgba(197,63,63,.85);
  margin-top: 4px;
  flex-shrink:0;
}
.auth-alert__msg{ font-size:.92rem; line-height:1.35; }

/* Form */
.auth-form{ display:flex; flex-direction:column; gap: 14px; }
.auth-field{ display:flex; flex-direction:column; gap: 7px; }

.auth-label{
  font-size:.76rem;
  letter-spacing:.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  font-weight: 800;
}

.auth-control{ position:relative; display:flex; align-items:center; }
.auth-icon{
  position:absolute;
  left: 12px;
  color: rgba(26,20,16,.40);
  transition: color var(--transition);
}
.auth-input{
  width:100%;
  height: 48px;
  padding: 0 14px 0 40px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.78);
  color: var(--ink);
  outline:none;
  font-size: .95rem;
  transition: border-color var(--transition), box-shadow var(--transition), background var(--transition), transform var(--transition);
}
.auth-input::placeholder{ color: rgba(26,20,16,.38); }
.auth-input:focus{
  background: var(--surface-hover);
  border-color: var(--border-strong);
  box-shadow: 0 0 0 6px rgba(184,149,106,.14);
  transform: translateY(-1px);
}
.auth-control:has(.auth-input:focus) .auth-icon{ color: rgba(26,20,16,.62); }

.auth-input--padRight{ padding-right: 48px; }
.auth-peek{
  position:absolute;
  right: 10px;
  width: 36px; height: 36px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.62);
  color: rgba(26,20,16,.62);
  cursor:pointer;
  display:grid;
  place-items:center;
  transition: transform var(--transition), background var(--transition), border-color var(--transition);
}
.auth-peek:hover{
  transform: scale(1.03);
  background: var(--surface-hover);
  border-color: var(--border-strong);
}

/* Row */
.auth-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
  margin-top: 2px;
}
.auth-link{
  border:0;
  background:transparent;
  padding:0;
  cursor:pointer;
  color: var(--ink-2);
  font-weight: 700;
  font-size: .88rem;
  transition: opacity var(--transition), transform var(--transition);
  white-space: nowrap;
}
.auth-link:hover{ opacity:.85; transform: translateY(-1px); }

.auth-check{
  display:flex;
  align-items:center;
  gap:10px;
  cursor:pointer;
  user-select:none;
}
.auth-check input{ position:absolute; opacity:0; pointer-events:none; }
.auth-check__box{
  width: 18px; height: 18px;
  border-radius: 6px;
  border: 1px solid var(--border-strong);
  background: rgba(255,255,255,0.66);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.6);
  position:relative;
  transition: transform var(--transition), border-color var(--transition), background var(--transition);
}
.auth-check__text{
  font-size: .90rem;
  color: var(--ink-2);
  font-weight: 650;
}
.auth-check input:focus + .auth-check__box{ box-shadow: 0 0 0 6px rgba(184,149,106,.14); }
.auth-check input:checked + .auth-check__box{
  background: rgba(26,20,16,.92);
  border-color: rgba(26,20,16,.92);
}
.auth-check input:checked + .auth-check__box::after{
  content:"";
  position:absolute;
  left: 5px; top: 2px;
  width: 5px; height: 9px;
  border-right: 2px solid rgba(255,255,255,.95);
  border-bottom: 2px solid rgba(255,255,255,.95);
  transform: rotate(40deg);
}

/* Button */
.auth-btn{
  position:relative;
  height: 50px;
  width:100%;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 16px;
  background: rgba(26,20,16,.96);
  color: rgba(255,255,255,.96);
  font-weight: 800;
  font-size: .95rem;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  gap: 10px;
  box-shadow: var(--shadow-md);
  transition: transform var(--transition), box-shadow var(--transition), opacity var(--transition);
  overflow:hidden;
}
.auth-btn:hover{ transform: translateY(-1px); box-shadow: var(--shadow-lg); }
.auth-btn:disabled{ cursor:not-allowed; opacity:.60; transform:none; }
.auth-btn__shine{
  position:absolute; inset:0;
  background: linear-gradient(120deg, transparent 0%, rgba(184,149,106,.26) 18%, rgba(255,255,255,.12) 28%, transparent 45%);
  transform: translateX(-120%);
  transition: transform .65s cubic-bezier(0.4,0,0.2,1);
}
.auth-btn:hover .auth-btn__shine{ transform: translateX(120%); }
.auth-btn--loading{ pointer-events:none; }
.auth-spinner{
  width: 16px; height: 16px;
  border-radius: 999px;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: rgba(255,255,255,.95);
  animation: spin .8s linear infinite;
}
@keyframes spin{ to{ transform: rotate(360deg); } }

.auth-foot{
  margin: 10px 0 0;
  text-align:center;
  color: var(--ink-3);
  font-size: .85rem;
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 900px){
  .auth-shell{ grid-template-columns: 1fr; }
  .auth-card{ border-left: 0; border-top: 1px solid var(--border); }
  .auth-visual{ min-height: 260px; }
  .auth-visual__content{ bottom: 18px; }
}
@media (max-width: 420px){
  .auth-row{ flex-direction: column; align-items:flex-start; }
  .auth-link{ white-space: normal; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce){
  .auth-shell{ animation:none !important; }
  .auth-btn, .auth-input, .auth-peek, .auth-link{ transition:none !important; }
  .auth-btn:hover{ transform:none; }
  .auth-spinner{ animation:none !important; }
}
`

export default Login