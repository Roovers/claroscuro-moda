import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useProductos } from '../hooks/useProductos'
import { CATEGORIAS } from '../constants/categorias'

const DEFAULT_HERO = {
  heroTitle: 'Una colección minimal, cuidada y atemporal.',
  heroSubtitle:
    'Descubrí prendas pensadas para durar. Armá tu carrito y finalizá el pedido por WhatsApp en segundos.',
  heroTag: 'Nueva temporada',
  heroImage: null,
}

const Home = () => {
  // ── Hero settings (Firestore)
  const [hero, setHero] = useState(DEFAULT_HERO)
  const [heroLoading, setHeroLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        setHeroLoading(true)
        const ref = doc(db, 'settings', 'home')
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data()
          setHero({
            heroTitle: data.heroTitle ?? DEFAULT_HERO.heroTitle,
            heroSubtitle: data.heroSubtitle ?? DEFAULT_HERO.heroSubtitle,
            heroTag: data.heroTag ?? DEFAULT_HERO.heroTag,
            heroImage: data.heroImage ?? DEFAULT_HERO.heroImage,
          })
        } else {
          setHero(DEFAULT_HERO)
        }
      } catch (e) {
        // Si falla, mostramos defaults (sin romper la home)
        console.warn('[Home] No se pudo cargar settings/home. Usando defaults.', e)
        setHero(DEFAULT_HERO)
      } finally {
        setHeroLoading(false)
      }
    }
    run()
  }, [])

  // ── Productos
  const {
    productos: destacados,
    cargando: cargandoDestacados,
    error: errorDestacados,
  } = useProductos({ destacado: true, limite: 12 })

  const {
    productos: ultimos,
    cargando: cargandoUltimos,
    error: errorUltimos,
  } = useProductos({ limite: 9 })

  const sliderRef = useRef(null)

  const previewCatalogo = useMemo(() => (ultimos || []).slice(0, 9), [ultimos])

  const scrollSlider = (dir) => {
    const el = sliderRef.current
    if (!el) return
    const amount = Math.round(el.clientWidth * 0.9)
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <main style={s.page}>
      {/* HERO */}
      <section style={s.hero} className="anim-fade-up">
        <div style={s.heroInner}>
          <div style={s.heroContent}>
            <div style={s.kickerRow}>
              <span style={s.kickerDot} />
              <span style={s.kicker}>INDUMENTARIA & ACCESORIOS</span>
            </div>

            <h1 style={s.heroTitle}>{hero.heroTitle}</h1>

            <p style={s.heroSub}>{hero.heroSubtitle}</p>

            <div style={s.heroActions}>
              <Link to="/catalogo" style={s.btnPrimary}>
                Explorar catálogo
                <ArrowRight size={16} weight="bold" style={{ marginLeft: 10 }} />
              </Link>

              <Link to="/catalogo?categoria=sale" style={s.btnGhost}>
                Ver sale
              </Link>
            </div>
          </div>

          <div style={s.heroMedia} aria-hidden="true">
            <div style={s.heroFrame}>
              {/* Imagen real si existe, sino fallback elegante */}
              {heroLoading ? (
                <div style={s.skeletonHero} className="skeleton" />
              ) : hero.heroImage ? (
                <>
                  <img src={hero.heroImage} alt="" style={s.heroImg} loading="eager" />
                  <div style={s.heroImgOverlay} />
                </>
              ) : (
                <>
                  <div style={s.heroFallback} />
                  <div style={s.heroFallbackOverlay} />
                </>
              )}

              <div style={s.heroBadge}>{hero.heroTag}</div>
            </div>
          </div>
        </div>
      </section>

      {/* DESTACADOS */}
      <section style={s.section}>
        <div style={s.sectionHead}>
          <div>
            <h2 style={s.h2}>Destacados</h2>
            <p style={s.sub}>Selección curada de la semana.</p>
          </div>

          <div style={s.controls}>
            <button type="button" onClick={() => scrollSlider('left')} style={s.ctrlBtn} aria-label="Anterior">
              <CaretLeft size={18} weight="bold" />
            </button>
            <button type="button" onClick={() => scrollSlider('right')} style={s.ctrlBtn} aria-label="Siguiente">
              <CaretRight size={18} weight="bold" />
            </button>
          </div>
        </div>

        {errorDestacados ? (
          <div style={s.noticeError}>
            <p style={s.noticeTitle}>No se pudieron cargar los destacados.</p>
            <p style={s.noticeText}>
              Si Firestore pide un índice compuesto, crealo desde el link del error en la consola.
            </p>
          </div>
        ) : null}

        <div style={s.slider} ref={sliderRef}>
          {cargandoDestacados ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} style={s.cardSkel} className="skeleton" />)
          ) : (destacados || []).length === 0 ? (
            <div style={s.noticeSoft}>
              <p style={s.noticeTitleSoft}>Aún no hay productos destacados.</p>
              <p style={s.noticeText}>Podés marcarlos como “destacado” desde el panel admin.</p>
            </div>
          ) : (
            destacados.map((p) => (
              <Link key={p.id} to={`/producto/${p.id}`} style={s.card}>
                <div style={s.cardImgWrap}>
                  {p.imagenes?.[0] ? (
                    <img src={p.imagenes[0]} alt={p.nombre} style={s.cardImg} loading="lazy" />
                  ) : (
                    <div style={s.cardImgFallback} />
                  )}
                </div>

                <div style={s.cardBody}>
                  <div style={s.cardTop}>
                    <p style={s.cardName}>{p.nombre}</p>
                    <p style={s.cardPrice}>${(p.precio || 0).toLocaleString('es-AR')}</p>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <ColorSwatches colores={p?.variantes?.colores} />
                  </div>

                  <div style={s.cardBottom}>
                    <span style={s.cardMeta}>{labelCategoria(p.categoria)}</span>
                    <span style={s.cardCta}>
                      Ver detalles <ArrowRight size={14} weight="bold" style={{ marginLeft: 8 }} />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
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

        {errorUltimos ? (
          <div style={s.noticeError}>
            <p style={s.noticeTitle}>No se pudo cargar el catálogo.</p>
            <p style={s.noticeText}>Reintentá en unos segundos.</p>
          </div>
        ) : null}

        <div style={s.grid}>
          {cargandoUltimos
            ? Array.from({ length: 9 }).map((_, i) => <div key={i} style={s.gridSkel} className="skeleton" />)
            : previewCatalogo.map((p) => (
              <article key={p.id} style={s.gridCard}>
                <Link to={`/producto/${p.id}`} style={s.gridImgWrap} aria-label={`Ver ${p.nombre}`}>
                  {p.imagenes?.[0] ? (
                    <img src={p.imagenes[0]} alt={p.nombre} style={s.gridImg} loading="lazy" />
                  ) : (
                    <div style={s.gridImgFallback} />
                  )}
                </Link>

                <div style={s.gridBody}>
                  <div style={s.gridTop}>
                    <p style={s.gridName}>{p.nombre}</p>
                    <p style={s.gridPrice}>${(p.precio || 0).toLocaleString('es-AR')}</p>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <ColorSwatches colores={p?.variantes?.colores} />
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <Link to={`/producto/${p.id}`} style={s.btnDetails}>
                      Ver detalles <ArrowRight size={14} weight="bold" style={{ marginLeft: 10 }} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
        </div>

        <div style={s.centerCta}>
          <Link to="/catalogo" style={s.btnSoft}>
            Ver todo el catálogo
            <ArrowRight size={16} weight="bold" style={{ marginLeft: 10 }} />
          </Link>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section style={{ ...s.section, paddingBottom: '5rem' }}>
        <div style={s.sectionHead}>
          <div>
            <h2 style={s.h2}>Categorías</h2>
            <p style={s.sub}>Encontrá rápido lo que buscás.</p>
          </div>
        </div>

        <div style={s.categoryPanel}>
          <div style={s.chips}>
            {CATEGORIAS.map((c) => (
              <Link key={c.value} to={`/catalogo?categoria=${c.value}`} style={s.chip}>
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

const ColorSwatches = ({ colores }) => {
  const list = Array.isArray(colores) ? colores : []
  if (list.length === 0) return null

  const max = 5
  const shown = list.slice(0, max)
  const rest = list.length - shown.length

  return (
    <div style={s.swatches} aria-label="Colores disponibles">
      {shown.map((c, idx) => (
        <span
          key={`${c?.nombre || 'color'}-${idx}`}
          title={c?.nombre || 'Color'}
          style={{
            ...s.swatch,
            background: c?.hex || '#ddd',
          }}
        />
      ))}
      {rest > 0 ? <span style={s.swatchMore}>+{rest}</span> : null}
    </div>
  )
}

const labelCategoria = (value) => {
  if (!value) return 'Colección'
  const c = CATEGORIAS.find((x) => x.value === value)
  return c?.label || value
}

const s = {
  page: { maxWidth: 1120, margin: '0 auto', padding: '2.5rem 2.5rem 0', position: 'relative', zIndex: 1 },

  hero: {
    borderRadius: 24,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
    backdropFilter: 'var(--glass)',
    WebkitBackdropFilter: 'var(--glass)',
    overflow: 'hidden',
  },
  heroInner: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: '2.25rem',
    padding: '2.6rem',
    alignItems: 'center',
  },
  heroContent: { maxWidth: '62ch' },
  kickerRow: { display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  kickerDot: { width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' },
  kicker: {
    fontSize: '0.72rem',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 400,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.85rem',
    lineHeight: 1.02,
    letterSpacing: '-0.02em',
    fontWeight: 400, // 👈 lujo (no “negrita”)
    color: 'var(--ink)',
    margin: 0,
  },
  heroSub: {
    marginTop: 14,
    color: 'var(--ink-3)',
    lineHeight: 1.8,
    fontSize: '1.04rem',
    fontWeight: 300,
    marginBottom: 0,
    maxWidth: '56ch',
  },
  heroActions: { marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' },

  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    padding: '0.88rem 1.18rem',
    background: 'rgba(26,20,16,0.92)',
    color: '#fff',
    border: '1px solid rgba(26,20,16,0.35)',
    fontWeight: 400,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontSize: '0.78rem',
    transition: 'var(--transition)',
  },
  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    padding: '0.88rem 1.18rem',
    background: 'transparent',
    color: 'var(--ink)',
    border: '1px solid var(--border-strong)',
    fontWeight: 400,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontSize: '0.78rem',
    transition: 'var(--transition)',
  },

  heroMedia: { display: 'grid', placeItems: 'center' },
  heroFrame: {
    position: 'relative',
    width: '100%',
    maxWidth: 420,
    height: 340,
    borderRadius: 20,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'linear-gradient(135deg, rgba(184,149,106,0.10), rgba(255,255,255,0.10))',
  },
  skeletonHero: { position: 'absolute', inset: 0, borderRadius: 20 },

  heroImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  heroImgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.00), rgba(0,0,0,0.18))',
  },

  heroFallback: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(ellipse at 30% 20%, rgba(184,149,106,0.22) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(26,20,16,0.10) 0%, transparent 60%)',
    filter: 'blur(0px)',
  },
  heroFallbackOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.02))',
  },

  heroBadge: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    padding: '0.42rem 0.78rem',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.72)',
    border: '1px solid var(--border)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    fontSize: '0.70rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ink)',
    fontWeight: 400,
  },

  section: { padding: '2.25rem 0 0' },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 14 },
  h2: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.85rem',
    fontWeight: 400,
    letterSpacing: '-0.01em',
    margin: 0,
  },
  sub: { margin: '0.3rem 0 0', color: 'var(--ink-3)', fontWeight: 300, lineHeight: 1.7 },

  controls: { display: 'flex', gap: 8 },
  ctrlBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'grid',
    placeItems: 'center',
  },

  noticeError: {
    border: '1px solid rgba(220,38,38,0.25)',
    background: 'rgba(255,255,255,0.65)',
    borderRadius: 16,
    padding: '0.9rem 1rem',
    marginBottom: 14,
  },
  noticeSoft: {
    border: '1px dashed var(--border-strong)',
    background: 'rgba(255,255,255,0.60)',
    borderRadius: 16,
    padding: '0.9rem 1rem',
    minWidth: 360,
  },
  noticeTitle: { margin: 0, color: 'rgba(185,28,28,1)', fontWeight: 400 },
  noticeTitleSoft: { margin: 0, color: 'var(--ink)', fontWeight: 400 },
  noticeText: { margin: '0.35rem 0 0', color: 'var(--ink-3)', lineHeight: 1.7, fontWeight: 300, fontSize: '0.95rem' },

  slider: { display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, scrollSnapType: 'x mandatory' },
  card: {
    minWidth: 260,
    maxWidth: 260,
    borderRadius: 18,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.78)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    scrollSnapAlign: 'start',
    transition: 'var(--transition)',
  },
  cardImgWrap: { width: '100%', height: 240, background: 'var(--bg-2)', overflow: 'hidden' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgFallback: { width: '100%', height: '100%' },
  cardBody: { padding: '0.95rem 0.95rem 1.0rem' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  cardName: { margin: 0, fontWeight: 400, color: 'var(--ink)', lineHeight: 1.2 },
  cardPrice: { margin: 0, fontWeight: 400, color: 'var(--ink-2)' },
  cardBottom: { marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardMeta: { color: 'var(--ink-3)', fontWeight: 300, fontSize: '0.92rem' },
  cardCta: { color: 'var(--accent-dark)', fontWeight: 400, fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center' },

  cardSkel: { minWidth: 260, maxWidth: 260, height: 360, borderRadius: 18, border: '1px solid var(--border)' },

  linkMore: { color: 'var(--accent-dark)', fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 },
  gridCard: { borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.78)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' },
  gridImgWrap: { display: 'block', width: '100%', height: 340, background: 'var(--bg-2)' },
  gridImg: { width: '100%', height: '100%', objectFit: 'cover' },
  gridImgFallback: { width: '100%', height: '100%' },
  gridBody: { padding: '0.95rem 0.95rem 1.0rem' },
  gridTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  gridName: { margin: 0, fontWeight: 400, lineHeight: 1.2 },
  gridPrice: { margin: 0, fontWeight: 400, color: 'var(--ink-2)' },

  btnDetails: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    padding: '0.72rem 1.05rem',
    background: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--ink)',
    fontWeight: 400,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontSize: '0.76rem',
  },

  gridSkel: { height: 460, borderRadius: 18, border: '1px solid var(--border)' },

  centerCta: { display: 'flex', justifyContent: 'center', marginTop: 18 },
  btnSoft: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    padding: '0.88rem 1.18rem',
    background: 'rgba(184,149,106,0.10)',
    border: '1px solid rgba(184,149,106,0.25)',
    color: 'var(--accent-dark)',
    fontWeight: 400,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontSize: '0.78rem',
  },

  categoryPanel: {
    borderRadius: 18,
    background: 'rgba(255,255,255,0.65)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    padding: '1.1rem 1.1rem 1.2rem',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.62rem 0.95rem',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.65)',
    color: 'var(--ink)',
    fontWeight: 300,
  },

  swatches: { display: 'inline-flex', alignItems: 'center', gap: 8 },
  swatch: { width: 14, height: 14, borderRadius: 999, border: '1px solid rgba(0,0,0,0.10)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' },
  swatchMore: { fontSize: '0.85rem', color: 'var(--ink-3)', fontWeight: 300, marginLeft: 2 },
}

export default Home