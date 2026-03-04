import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CaretLeft, CaretRight, Sparkle } from '@phosphor-icons/react'
import { useProductos } from '../hooks/useProductos'
import { CATEGORIAS } from '../constants/categorias'

const Home = () => {
  const { productos: destacados, cargando: cargandoDestacados } = useProductos({ destacado: true })
  const { productos: ultimos, cargando: cargandoUltimos } = useProductos()

  const sliderRef = useRef(null)

  const previewCatalogo = useMemo(() => (ultimos || []).slice(0, 9), [ultimos])

  const scrollSlider = (dir) => {
    const el = sliderRef.current
    if (!el) return
    const amount = Math.round(el.clientWidth * 0.85)
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <main style={s.page}>
      {/* HERO / CAROUSEL FIJO */}
      <section style={s.hero} className="anim-fade-up">
        <div style={s.heroInner}>
          <div style={s.heroContent}>
            <p style={s.kicker}>
              <Sparkle size={14} weight="fill" style={{ marginRight: 8, color: 'var(--accent)' }} />
              Indumentaria & accesorios
            </p>

            <h1 style={s.heroTitle}>Una colección minimal, cuidada y atemporal.</h1>

            <p style={s.heroSub}>
              Descubrí prendas pensadas para durar. Armá tu carrito y finalizá el pedido por WhatsApp en segundos.
            </p>

            <div style={s.heroActions}>
              <Link to="/catalogo" style={s.btnPrimary}>
                Explorar catálogo
                <ArrowRight size={16} weight="bold" style={{ marginLeft: 10 }} />
              </Link>

              <Link to="/catalogo?categoria=sale" style={s.btnSecondary}>
                Ver sale
              </Link>
            </div>
          </div>

          {/* “Imagen” editorial sin depender de assets */}
          <div style={s.heroMedia} aria-hidden="true">
            <div style={s.heroFrame}>
              <div style={s.heroGlow} />
              <div style={s.heroGrid} />
              <div style={s.heroOverlay} />
              <div style={s.heroLabel}>Nueva temporada</div>
            </div>
          </div>
        </div>
      </section>

      {/* DESTACADOS */}
      <section style={s.section}>
        <div style={s.sectionHead}>
          <div>
            <h2 style={s.h2}>Destacados</h2>
            <p style={s.sub}>Nuestros seleccionados de la semana.</p>
          </div>

          <div style={s.sliderControls}>
            <button type="button" onClick={() => scrollSlider('left')} style={s.iconBtn} aria-label="Anterior">
              <CaretLeft size={18} weight="bold" />
            </button>
            <button type="button" onClick={() => scrollSlider('right')} style={s.iconBtn} aria-label="Siguiente">
              <CaretRight size={18} weight="bold" />
            </button>
          </div>
        </div>

        <div style={s.slider} ref={sliderRef}>
          {cargandoDestacados
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={s.cardSkeleton} className="anim-fade-in" />
              ))
            : (destacados || []).length === 0
              ? (
                <div style={s.emptyBox}>
                  <p style={s.emptyTitle}>Aún no hay productos destacados.</p>
                  <p style={s.emptySub}>Podés marcarlos como “destacado” desde el panel admin.</p>
                </div>
              )
              : destacados.map((p) => (
                <Link key={p.id} to={`/producto/${p.id}`} style={s.card} className="anim-fade-up">
                  <div style={s.cardImgWrap}>
                    {p.imagenes?.[0] ? (
                      <img src={p.imagenes[0]} alt={p.nombre} style={s.cardImg} loading="lazy" />
                    ) : (
                      <div style={s.cardImgFallback} />
                    )}
                  </div>

                  <div style={s.cardBody}>
                    <p style={s.cardName}>{p.nombre}</p>
                    <div style={s.cardMeta}>
                      <span style={s.price}>${(p.precio || 0).toLocaleString('es-AR')}</span>
                      <span style={s.metaDot}>•</span>
                      <span style={s.metaText}>{labelCategoria(p.categoria)}</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* CATÁLOGO PREVIEW */}
      <section style={s.section}>
        <div style={s.sectionHead}>
          <div>
            <h2 style={s.h2}>Catálogo</h2>
            <p style={s.sub}>Explorá lo último agregado.</p>
          </div>

          <Link to="/catalogo" style={s.linkMore}>
            Ver más <ArrowRight size={14} weight="bold" style={{ marginLeft: 8 }} />
          </Link>
        </div>

        <div style={s.grid}>
          {cargandoUltimos
            ? Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={s.gridSkeleton} className="anim-fade-in" />
              ))
            : previewCatalogo.map((p) => (
                <Link key={p.id} to={`/producto/${p.id}`} style={s.gridCard} className="anim-fade-up">
                  <div style={s.gridImgWrap}>
                    {p.imagenes?.[0] ? (
                      <img src={p.imagenes[0]} alt={p.nombre} style={s.gridImg} loading="lazy" />
                    ) : (
                      <div style={s.gridImgFallback} />
                    )}
                  </div>
                  <div style={s.gridBody}>
                    <p style={s.gridName}>{p.nombre}</p>
                    <p style={s.gridPrice}>${(p.precio || 0).toLocaleString('es-AR')}</p>
                  </div>
                </Link>
              ))}
        </div>

        <div style={s.centerCta}>
          <Link to="/catalogo" style={s.btnPrimarySoft}>
            Ver todo el catálogo
            <ArrowRight size={16} weight="bold" style={{ marginLeft: 10 }} />
          </Link>
        </div>
      </section>

      {/* CATEGORÍAS (simple, pro, sin ruido) */}
      <section style={{ ...s.section, paddingBottom: '5rem' }}>
        <div style={s.sectionHead}>
          <div>
            <h2 style={s.h2}>Categorías</h2>
            <p style={s.sub}>Encontrá rápido lo que buscás.</p>
          </div>
        </div>

        <div style={s.chips}>
          {CATEGORIAS.map((c) => (
            <Link key={c.value} to={`/catalogo?categoria=${c.value}`} style={s.chip}>
              {c.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

const labelCategoria = (value) => {
  if (!value) return 'Colección'
  const c = CATEGORIAS.find((x) => x.value === value)
  return c?.label || value
}

const s = {
  page: { maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2.5rem 0' },

  hero: {
    borderRadius: '22px',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.70)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    boxShadow: 'var(--shadow-md)',
    overflow: 'hidden',
  },
  heroInner: {
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.85fr',
    gap: '1.75rem',
    padding: '2.25rem',
    alignItems: 'center',
  },
  heroContent: { maxWidth: '60ch' },
  kicker: {
    margin: 0,
    fontSize: '0.72rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
  },
  heroTitle: {
    margin: '0.75rem 0 0.75rem',
    fontFamily: 'var(--font-display)',
    fontSize: '2.4rem',
    fontWeight: 400,
    color: 'var(--ink)',
    lineHeight: 1.1,
  },
  heroSub: {
    margin: 0,
    color: 'var(--ink-2)',
    lineHeight: 1.75,
    fontSize: '1rem',
  },
  heroActions: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.95rem 1.25rem',
    borderRadius: '999px',
    background: 'var(--ink)',
    color: 'var(--bg)',
    fontSize: '0.86rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    boxShadow: 'var(--shadow-sm)',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.95rem 1.1rem',
    borderRadius: '999px',
    background: 'transparent',
    color: 'var(--ink)',
    border: '1px solid var(--border-strong)',
    fontSize: '0.86rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
  },

  heroMedia: { display: 'flex', justifyContent: 'flex-end' },
  heroFrame: {
    width: '100%',
    maxWidth: '360px',
    aspectRatio: '4 / 5',
    borderRadius: '18px',
    border: '1px solid rgba(0,0,0,0.08)',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, rgba(184,149,106,0.18), rgba(0,0,0,0.02))',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    inset: '-40%',
    background: 'radial-gradient(circle at 40% 30%, rgba(184,149,106,0.35), transparent 55%)',
    filter: 'blur(18px)',
  },
  heroGrid: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)',
    backgroundSize: '26px 26px',
    opacity: 0.22,
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.75))',
  },
  heroLabel: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    padding: '0.35rem 0.65rem',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid var(--border)',
    color: 'var(--ink-2)',
    fontSize: '0.75rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontWeight: 700,
  },

  section: { paddingTop: '2.75rem' },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap' },
  h2: { margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 400, color: 'var(--ink)' },
  sub: { margin: '0.35rem 0 0', color: 'var(--ink-3)', fontSize: '0.92rem', lineHeight: 1.6 },

  sliderControls: { display: 'flex', gap: '0.5rem' },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: '12px',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--ink)',
  },

  slider: {
    display: 'flex',
    gap: '1rem',
    overflowX: 'auto',
    paddingBottom: '0.35rem',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
  },

  card: {
    flex: '0 0 260px',
    scrollSnapAlign: 'start',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.72)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  cardImgWrap: { width: '100%', height: 280, background: 'var(--bg-2)' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  cardImgFallback: { width: '100%', height: '100%' },
  cardBody: { padding: '0.95rem 1rem 1.05rem' },
  cardName: { margin: 0, fontSize: '0.95rem', color: 'var(--ink)', fontWeight: 500, lineHeight: 1.35 },
  cardMeta: { marginTop: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-3)' },
  price: { color: 'var(--ink)', fontWeight: 600, fontSize: '0.92rem' },
  metaDot: { opacity: 0.6 },
  metaText: { fontSize: '0.82rem' },

  cardSkeleton: {
    flex: '0 0 260px',
    height: 360,
    borderRadius: '16px',
    border: '1px solid var(--border)',
    background: 'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.07), rgba(0,0,0,0.04))',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.35s infinite',
  },

  emptyBox: {
    width: '100%',
    borderRadius: '16px',
    border: '1px dashed var(--border-strong)',
    padding: '1.5rem',
    color: 'var(--ink-2)',
    background: 'rgba(255,255,255,0.55)',
  },
  emptyTitle: { margin: 0, fontWeight: 700 },
  emptySub: { margin: '0.45rem 0 0', color: 'var(--ink-3)', lineHeight: 1.6 },

  linkMore: {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'var(--accent)',
    fontWeight: 700,
    fontSize: '0.9rem',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '1rem',
  },
  gridCard: {
    borderRadius: '16px',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.72)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  gridImgWrap: { width: '100%', aspectRatio: '4 / 5', background: 'var(--bg-2)' },
  gridImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  gridImgFallback: { width: '100%', height: '100%' },
  gridBody: { padding: '0.9rem 1rem 1.1rem' },
  gridName: { margin: 0, fontSize: '0.92rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.35 },
  gridPrice: { margin: '0.5rem 0 0', color: 'var(--ink-2)', fontSize: '0.9rem' },

  gridSkeleton: {
    borderRadius: '16px',
    border: '1px solid var(--border)',
    background: 'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.07), rgba(0,0,0,0.04))',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.35s infinite',
    aspectRatio: '4 / 5',
  },

  centerCta: { display: 'flex', justifyContent: 'center', marginTop: '1.75rem' },
  btnPrimarySoft: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.95rem 1.25rem',
    borderRadius: '999px',
    background: 'rgba(184,149,106,0.12)',
    color: 'var(--accent-dark)',
    border: '1px solid rgba(184,149,106,0.22)',
    fontSize: '0.86rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 700,
  },

  chips: { display: 'flex', flexWrap: 'wrap', gap: '0.6rem' },
  chip: {
    padding: '0.6rem 0.9rem',
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.65)',
    color: 'var(--ink-2)',
    fontSize: '0.88rem',
  },
}

export default Home