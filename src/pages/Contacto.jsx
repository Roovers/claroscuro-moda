import { WhatsappLogo, InstagramLogo, MapPin, Clock, Phone } from '@phosphor-icons/react'

const Contacto = () => {
  const numero = import.meta.env.VITE_WHATSAPP_NUMBER || ''
  const waLink = numero ? `https://wa.me/${numero}` : '#'

  return (
    <main style={s.main} className="anim-fade-up">
      <section style={s.hero}>
        <p style={s.kicker}>Contacto</p>
        <h1 style={s.title}>¿Tenés una consulta?</h1>
        <p style={s.subtitle}>
          Escribinos por WhatsApp y coordinamos tu pedido, envío o retiro. Respondemos lo antes posible en horario comercial.
        </p>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...s.btnPrimary, ...(numero ? {} : s.btnDisabled) }}
          aria-disabled={!numero}
          title={!numero ? 'Falta configurar VITE_WHATSAPP_NUMBER' : 'Abrir WhatsApp'}
        >
          <WhatsappLogo size={20} weight="fill" style={{ marginRight: 10 }} />
          Hablar por WhatsApp
        </a>

        {!numero && (
          <p style={s.warn}>
            ⚠️ Falta configurar <strong>VITE_WHATSAPP_NUMBER</strong> en tu .env para que el botón funcione.
          </p>
        )}
      </section>

      <section style={s.grid}>
        {/* Card 1: WhatsApp / Tel */}
        <div style={s.card}>
          <div style={s.cardIcon}>
            <Phone size={18} weight="bold" />
          </div>
          <h2 style={s.cardTitle}>WhatsApp</h2>
          <p style={s.cardText}>
            {numero ? (
              <>
                Número: <strong>{numero}</strong>
              </>
            ) : (
              <>
                Configurá el número en tu <strong>.env</strong>.
              </>
            )}
          </p>
          <p style={s.cardHint}>Tip: podés usar el carrito y enviar el pedido con el detalle automáticamente.</p>
        </div>

        {/* Card 2: Horarios */}
        <div style={s.card}>
          <div style={s.cardIcon}>
            <Clock size={18} weight="bold" />
          </div>
          <h2 style={s.cardTitle}>Horarios</h2>
          <p style={s.cardText}>Lunes a Sábado</p>
          <p style={s.cardHint}>10:00 a 19:00 hs</p>
        </div>

        {/* Card 3: Ubicación */}
        <div style={s.card}>
          <div style={s.cardIcon}>
            <MapPin size={18} weight="bold" />
          </div>
          <h2 style={s.cardTitle}>Ubicación</h2>
          <p style={s.cardText}>Coordinamos retiro o envío.</p>
          <p style={s.cardHint}>Agregá acá tu dirección o zona si el cliente lo pide.</p>
        </div>

        {/* Card 4: Redes */}
        <div style={s.card}>
          <div style={s.cardIcon}>
            <InstagramLogo size={18} weight="bold" />
          </div>
          <h2 style={s.cardTitle}>Redes</h2>
          <p style={s.cardText}>Seguinos para ver novedades y lanzamientos.</p>
          <a
            href="#"
            style={s.cardLink}
            onClick={(e) => e.preventDefault()}
            aria-label="Instagram"
            title="Reemplazá este link por el Instagram real"
          >
            Ir a Instagram →
          </a>
        </div>
      </section>

      <section style={s.note}>
        <h3 style={s.noteTitle}>Información importante</h3>
        <ul style={s.list}>
          <li style={s.li}>Los pedidos se confirman por WhatsApp.</li>
          <li style={s.li}>El pago y el envío se coordinan con el vendedor.</li>
          <li style={s.li}>Si necesitás cambios o devoluciones, escribinos y lo resolvemos.</li>
        </ul>
      </section>
    </main>
  )
}

const s = {
  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '3.25rem 2.5rem 5rem',
  },

  hero: {
    background: 'rgba(255,255,255,0.75)',
    border: '1px solid var(--border)',
    borderRadius: '18px',
    padding: '2.25rem',
    boxShadow: 'var(--shadow-md)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    marginBottom: '1.75rem',
  },
  kicker: {
    margin: 0,
    fontSize: '0.72rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 600,
  },
  title: {
    margin: '0.5rem 0 0.75rem',
    fontFamily: 'var(--font-display)',
    fontSize: '2.25rem',
    fontWeight: 400,
    color: 'var(--ink)',
  },
  subtitle: {
    margin: '0 0 1.25rem',
    color: 'var(--ink-2)',
    lineHeight: 1.75,
    maxWidth: '62ch',
    fontSize: '0.98rem',
  },

  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.95rem 1.25rem',
    borderRadius: '999px',
    background: 'linear-gradient(135deg, #25D366, #128C7E)',
    color: '#fff',
    border: 'none',
    fontSize: '0.9rem',
    letterSpacing: '0.06em',
    fontWeight: 600,
    boxShadow: '0 6px 22px rgba(37,211,102,0.25)',
    width: 'fit-content',
  },
  btnDisabled: { opacity: 0.6, pointerEvents: 'none' },

  warn: { marginTop: '1rem', fontSize: '0.85rem', color: '#8e2a22' },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },

  card: {
    background: 'rgba(255,255,255,0.7)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '1.25rem',
    boxShadow: 'var(--shadow-sm)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    minHeight: '170px',
  },
  cardIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(184,149,106,0.12)',
    color: 'var(--accent-dark)',
    marginBottom: '0.85rem',
  },
  cardTitle: { margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' },
  cardText: { margin: '0.55rem 0 0.5rem', color: 'var(--ink-2)', lineHeight: 1.6, fontSize: '0.92rem' },
  cardHint: { margin: 0, color: 'var(--ink-3)', fontSize: '0.82rem', lineHeight: 1.55 },
  cardLink: { display: 'inline-block', marginTop: '0.6rem', color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' },

  note: {
    background: 'rgba(184,149,106,0.08)',
    border: '1px solid rgba(184,149,106,0.18)',
    borderRadius: '16px',
    padding: '1.25rem 1.25rem 1.1rem',
  },
  noteTitle: {
    margin: 0,
    fontSize: '0.85rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 700,
  },
  list: { margin: '0.85rem 0 0', paddingLeft: '1.15rem', color: 'var(--ink-2)', lineHeight: 1.7 },
  li: { marginBottom: '0.35rem', fontSize: '0.92rem' },
}

// Responsive mínimo (sin depender de CSS global)
if (typeof window !== 'undefined' && window.matchMedia) {
  if (window.matchMedia('(max-width: 980px)').matches) s.grid.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))'
  if (window.matchMedia('(max-width: 560px)').matches) {
    s.main.padding = '2.25rem 1.25rem 4rem'
    s.hero.padding = '1.5rem'
    s.title.fontSize = '1.9rem'
    s.grid.gridTemplateColumns = '1fr'
  }
}

export default Contacto