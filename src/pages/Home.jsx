import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react'
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

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MICRO-COMPONENTS                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

const Divider = ({ style }) => (
  <div
    style={{
      height: 1,
      background: 'linear-gradient(90deg, transparent, var(--border-strong), transparent)',
      margin: '0 auto',
      ...style,
    }}
  />
)

const ColorSwatches = ({ colores }) => {
  const list = Array.isArray(colores) ? colores : []
  if (list.length === 0) return null
  const shown = list.slice(0, 4)
  const rest = list.length - shown.length
  return (
    <div style={sc.swatches}>
      {shown.map((c, i) => (
        <span
          key={i}
          title={c?.nombre}
          style={{ ...sc.swatch, background: c?.hex || '#ccc' }}
        />
      ))}
      {rest > 0 && <span style={sc.swatchMore}>+{rest}</span>}
    </div>
  )
}

const labelCategoria = (value) => {
  if (!value) return 'Colección'
  return CATEGORIAS.find((x) => x.value === value)?.label || value
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  PRODUCT CARD — editorial style                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

const ProductCard = ({ p, size = 'md' }) => {
  const [hovered, setHovered] = useState(false)
  const tall = size === 'lg' ? 520 : size === 'sm' ? 320 : 420

  return (
    <Link
      to={`/producto/${p.id}`}
      style={{ ...sc.card, '--img-h': `${tall}px` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div style={sc.cardImgWrap}>
        {p.imagenes?.[0] ? (
          <img
            src={p.imagenes[0]}
            alt={p.nombre}
            style={{
              ...sc.cardImg,
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)',
            }}
            loading="lazy"
          />
        ) : (
          <div style={sc.cardImgFallback} />
        )}

        {/* Overlay on hover */}
        <div
          style={{
            ...sc.cardOverlay,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}
        >
          <span style={sc.cardOverlayText}>
            Ver detalles <ArrowUpRight size={14} weight="bold" style={{ marginLeft: 6 }} />
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={sc.cardInfo}>
        <div style={sc.cardRow}>
          <p style={sc.cardCat}>{labelCategoria(p.categoria)}</p>
          <ColorSwatches colores={p?.variantes?.colores} />
        </div>
        <div style={sc.cardRow2}>
          <p style={sc.cardName}>{p.nombre}</p>
          <p style={sc.cardPrice}>${(p.precio || 0).toLocaleString('es-AR')}</p>
        </div>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  HOME                                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

const Home = () => {
  /* ── Hero settings */
  const [hero, setHero] = useState(DEFAULT_HERO)
  const [heroLoading, setHeroLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const ref = doc(db, 'settings', 'home')
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const d = snap.data()
          setHero({
            heroTitle: d.heroTitle ?? DEFAULT_HERO.heroTitle,
            heroSubtitle: d.heroSubtitle ?? DEFAULT_HERO.heroSubtitle,
            heroTag: d.heroTag ?? DEFAULT_HERO.heroTag,
            heroImage: d.heroImage ?? DEFAULT_HERO.heroImage,
          })
        }
      } catch {
        /* silently fall back to defaults */
      } finally {
        setHeroLoading(false)
      }
    }
    run()
  }, [])

  /* ── Productos */
  const { productos: destacados, cargando: cargandoDestacados } = useProductos({
    destacado: true,
    limite: 8,
  })
  const { productos: ultimos, cargando: cargandoUltimos } = useProductos({ limite: 6 })

  const previewCatalogo = useMemo(() => (ultimos || []).slice(0, 6), [ultimos])

  /* ── Ticker state */
  const tickerWords = ['Nueva Temporada', 'Indumentaria', 'Accesorios', 'Diseño Propio', 'Calidad Premium', 'Envíos', 'Talles Especiales']

  /* ── Hero words split for editorial treatment */
  const heroWords = hero.heroTitle.split(' ')

  return (
    <main style={s.page}>

      {/* ══════════════════════════════════════════════════════════
          SECTION 0 — ANNOUNCEMENT TICKER
      ══════════════════════════════════════════════════════════ */}
      <div style={s.ticker}>
        <div style={s.tickerTrack}>
          {[...tickerWords, ...tickerWords, ...tickerWords].map((word, i) => (
            <span key={i} style={s.tickerItem}>
              {word} <span style={s.tickerDot}>·</span>
            </span>
          ))}
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════ */}
      <section style={s.heroSection} className="anim-fade-up">

        {/* Left: editorial title block */}
        <div style={s.heroLeft}>
          <div style={s.heroKickerRow}>
            <div style={s.heroKickerLine} />
            <span style={s.heroKicker}>{hero.heroTag}</span>
          </div>

          <h1 style={s.heroTitle}>
            {heroWords.map((word, i) => (
              <span
                key={i}
                className="anim-fade-up"
                style={{
                  display: 'inline-block',
                  animationDelay: `${0.08 * i}s`,
                  marginRight: '0.25em',
                }}
              >
                {word}
              </span>
            ))}
          </h1>

          <p style={s.heroSub}>{hero.heroSubtitle}</p>

          <div style={s.heroActions}>
            <Link to="/catalogo" style={s.btnDark}>
              Explorar colección
              <ArrowRight size={15} weight="bold" style={{ marginLeft: 10 }} />
            </Link>
            <Link to="/catalogo?categoria=sale" style={s.btnOutline}>
              Sale
            </Link>
          </div>

          {/* Decorative stat row */}
          <div style={s.heroStats}>
            <div style={s.heroStat}>
              <span style={s.heroStatNum}>100%</span>
              <span style={s.heroStatLabel}>Calidad garantizada</span>
            </div>
            <div style={s.heroStatDivider} />
            <div style={s.heroStat}>
              <span style={s.heroStatNum}>WhatsApp</span>
              <span style={s.heroStatLabel}>Pedidos directos</span>
            </div>
            <div style={s.heroStatDivider} />
            <div style={s.heroStat}>
              <span style={s.heroStatNum}>Nueva</span>
              <span style={s.heroStatLabel}>Temporada disponible</span>
            </div>
          </div>
        </div>

        {/* Right: hero image */}
        <div style={s.heroRight}>
          <div style={s.heroImgFrame}>
            {heroLoading ? (
              <div style={s.heroSkeleton} className="skeleton" />
            ) : hero.heroImage ? (
              <>
                <img src={hero.heroImage} alt="" style={s.heroImg} loading="eager" />
                <div style={s.heroImgVignette} />
              </>
            ) : (
              <div style={s.heroImgPlaceholder}>
                <div style={s.heroImgPlaceholderGlow} />
                <div style={s.heroImgPlaceholderGrid} />
                <div style={s.heroImgCross} />
              </div>
            )}

            {/* Floating tag */}
            <div style={s.heroFloatTag}>
              <span style={s.heroFloatTagDot} />
              {hero.heroTag}
            </div>

            {/* Decorative corner marks */}
            <div style={{ ...s.cornerMark, top: 12, left: 12 }} />
            <div style={{ ...s.cornerMark, top: 12, right: 12, transform: 'rotate(90deg)' }} />
            <div style={{ ...s.cornerMark, bottom: 12, left: 12, transform: 'rotate(-90deg)' }} />
            <div style={{ ...s.cornerMark, bottom: 12, right: 12, transform: 'rotate(180deg)' }} />
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — EDITORIAL LABEL
      ══════════════════════════════════════════════════════════ */}
      <div style={s.editorialLabel}>
        <Divider />
        <div style={s.editorialLabelInner}>
          <span style={s.editorialLabelText}>Colección</span>
          <div style={s.editorialLabelLine} />
          <span style={s.editorialLabelText}>2026</span>
        </div>
        <Divider />
      </div>


      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — DESTACADOS (horizontal scroll, editorial)
      ══════════════════════════════════════════════════════════ */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <div style={s.sectionTitleGroup}>
            <span style={s.sectionEyebrow}>Selección curada</span>
            <h2 style={s.sectionTitle}>Destacados</h2>
          </div>
          <Link to="/catalogo" style={s.sectionCta}>
            Ver todos <ArrowRight size={13} weight="bold" style={{ marginLeft: 6 }} />
          </Link>
        </div>

        {cargandoDestacados ? (
          <div style={s.sliderWrap}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={s.skelCard} className="skeleton" />
            ))}
          </div>
        ) : (destacados || []).length === 0 ? (
          <div style={s.emptyNote}>
            <p style={s.emptyNoteText}>Marcá productos como "destacado" desde el panel admin para que aparezcan aquí.</p>
          </div>
        ) : (
          <div style={s.sliderWrap}>
            {destacados.map((p, i) => (
              <div key={p.id} className="anim-fade-up" style={{ animationDelay: `${0.05 * i}s`, flexShrink: 0 }}>
                <ProductCard p={p} size={i === 0 ? 'lg' : 'md'} />
              </div>
            ))}
          </div>
        )}
      </section>


      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — CATEGORÍAS (editorial mosaic)
      ══════════════════════════════════════════════════════════ */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <div style={s.sectionTitleGroup}>
            <span style={s.sectionEyebrow}>Explorar por</span>
            <h2 style={s.sectionTitle}>Categorías</h2>
          </div>
        </div>

        <div style={s.categoryGrid}>
          {CATEGORIAS.filter((c) => c.value !== 'sale').map((c, i) => (
            <Link
              key={c.value}
              to={`/catalogo?categoria=${c.value}`}
              style={{
                ...s.categoryChip,
                ...(i === 0 ? s.categoryChipAccent : {}),
              }}
            >
              <span style={s.categoryChipLabel}>{c.label}</span>
              <ArrowUpRight size={12} weight="bold" style={s.categoryChipIcon} />
            </Link>
          ))}
          <Link to="/catalogo?categoria=sale" style={{ ...s.categoryChip, ...s.categoryChipSale }}>
            <span style={s.categoryChipLabel}>Sale / Ofertas</span>
            <ArrowUpRight size={12} weight="bold" style={s.categoryChipIcon} />
          </Link>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — EDITORIAL MARQUEE
      ══════════════════════════════════════════════════════════ */}
      <div style={s.marqueeSection}>
        <div style={s.marqueeTrack}>
          {['Calidad', 'Diseño', 'Temporada 2026', 'Accesorios', 'Indumentaria', 'Talles Especiales', 'Envíos', 'Calidad', 'Diseño', 'Temporada 2026', 'Accesorios'].map((t, i) => (
            <span key={i} style={s.marqueeItem}>
              {t}
              <span style={s.marqueeSep}>—</span>
            </span>
          ))}
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════════
          SECTION 6 — CATÁLOGO PREVIEW (3+3 grid editorial)
      ══════════════════════════════════════════════════════════ */}
      <section style={{ ...s.section, paddingBottom: '5rem' }}>
        <div style={s.sectionHeader}>
          <div style={s.sectionTitleGroup}>
            <span style={s.sectionEyebrow}>Lo último agregado</span>
            <h2 style={s.sectionTitle}>Catálogo</h2>
          </div>
          <Link to="/catalogo" style={s.sectionCta}>
            Ver todo el catálogo <ArrowRight size={13} weight="bold" style={{ marginLeft: 6 }} />
          </Link>
        </div>

        {cargandoUltimos ? (
          <div style={s.catalogGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={s.skelGridCard} className="skeleton" />
            ))}
          </div>
        ) : previewCatalogo.length === 0 ? (
          <div style={s.emptyNote}>
            <p style={s.emptyNoteText}>Todavía no hay productos cargados. Agregá desde el panel admin.</p>
          </div>
        ) : (
          <div style={s.catalogGrid}>
            {previewCatalogo.map((p, i) => (
              <div
                key={p.id}
                className="anim-fade-up"
                style={{ animationDelay: `${0.06 * i}s` }}
              >
                <ProductCard p={p} size="md" />
              </div>
            ))}
          </div>
        )}

        <div style={s.catalogCta}>
          <Link to="/catalogo" style={s.btnDark}>
            Ver toda la colección
            <ArrowRight size={15} weight="bold" style={{ marginLeft: 10 }} />
          </Link>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════
          SECTION 7 — BRAND STATEMENT
      ══════════════════════════════════════════════════════════ */}
      <section style={s.brandStatement}>
        <div style={s.brandStatementInner}>
          <span style={s.brandStatementEyebrow}>Nuestra filosofía</span>
          <blockquote style={s.brandStatementQuote}>
            "Prendas pensadas para durar,<br />
            <em>estética que trasciende temporadas.</em>"
          </blockquote>
          <div style={s.brandStatementRule} />
          <p style={s.brandStatementSub}>
            Cada pieza es seleccionada con criterio. Sin fast fashion, sin descuidos.
            Armá tu carrito y coordiná por WhatsApp — simple, directo, sin intermediarios.
          </p>
          <Link to="/contacto" style={s.btnOutlineLight}>
            Hablá con nosotros
            <ArrowRight size={14} weight="bold" style={{ marginLeft: 8 }} />
          </Link>
        </div>
      </section>

    </main>
  )
}


/* ─────────────────────────────────────────────────────────────────────────── */
/*  STYLES                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

/* shared sub-component styles */
const sc = {
  swatches: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.12)',
    flexShrink: 0,
  },
  swatchMore: { fontSize: '0.75rem', color: 'var(--ink-3)', fontWeight: 300 },

  card: {
    display: 'block',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
  cardImgWrap: {
    position: 'relative',
    width: '100%',
    height: 'var(--img-h, 420px)',
    overflow: 'hidden',
    background: 'var(--bg-2)',
    borderRadius: 4,
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transformOrigin: 'center',
  },
  cardImgFallback: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, var(--bg-2), var(--accent-light))',
  },
  cardOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(26,20,16,0.28)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: '1rem',
    pointerEvents: 'none',
  },
  cardOverlayText: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.5rem 0.9rem',
    borderRadius: 999,
    background: 'rgba(247,244,239,0.92)',
    color: 'var(--ink)',
    fontSize: '0.76rem',
    letterSpacing: '0.08em',
    fontWeight: 500,
    backdropFilter: 'blur(10px)',
  },
  cardInfo: {
    paddingTop: '0.85rem',
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: '0.35rem',
  },
  cardCat: {
    margin: 0,
    fontSize: '0.72rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 400,
  },
  cardRow2: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  cardName: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 400,
    color: 'var(--ink)',
    lineHeight: 1.2,
  },
  cardPrice: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: 400,
    color: 'var(--ink-2)',
    whiteSpace: 'nowrap',
  },
}

/* page-level styles */
const s = {
  page: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 2.5rem',
    position: 'relative',
    zIndex: 1,
  },

  /* ── Ticker */
  ticker: {
    overflow: 'hidden',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(26,20,16,0.04)',
    marginBottom: '2.5rem',
    marginLeft: '-2.5rem',
    marginRight: '-2.5rem',
    paddingLeft: '2.5rem',
    paddingRight: '2.5rem',
  },
  tickerTrack: {
    display: 'flex',
    gap: 0,
    padding: '0.6rem 0',
    animation: 'ticker 28s linear infinite',
    width: 'max-content',
  },
  tickerItem: {
    fontSize: '0.72rem',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 400,
    whiteSpace: 'nowrap',
    padding: '0 1.2rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.2rem',
  },
  tickerDot: {
    color: 'var(--accent)',
    fontSize: '0.85rem',
  },

  /* ── Hero */
  heroSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 0.85fr',
    gap: '4rem',
    alignItems: 'center',
    minHeight: '82vh',
    paddingBottom: '3rem',
  },
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  heroKickerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  heroKickerLine: {
    width: 32,
    height: 1,
    background: 'var(--accent)',
  },
  heroKicker: {
    fontSize: '0.72rem',
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    fontWeight: 400,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
    lineHeight: 1.0,
    letterSpacing: '-0.02em',
    fontWeight: 300,
    color: 'var(--ink)',
    margin: '0 0 1.5rem',
    fontStyle: 'normal',
  },
  heroSub: {
    color: 'var(--ink-3)',
    lineHeight: 1.85,
    fontSize: '1.02rem',
    fontWeight: 300,
    margin: '0 0 2rem',
    maxWidth: '52ch',
  },
  heroActions: {
    display: 'flex',
    gap: '0.875rem',
    flexWrap: 'wrap',
    marginBottom: '3rem',
  },
  heroStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--border)',
  },
  heroStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  heroStatNum: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--ink)',
    letterSpacing: '-0.01em',
  },
  heroStatLabel: {
    fontSize: '0.7rem',
    color: 'var(--ink-3)',
    letterSpacing: '0.06em',
    fontWeight: 300,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    background: 'var(--border)',
    flexShrink: 0,
  },

  heroRight: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  heroImgFrame: {
    position: 'relative',
    width: '100%',
    maxWidth: 480,
    aspectRatio: '3 / 4',
    borderRadius: 2,
    overflow: 'visible',
  },
  heroSkeleton: {
    position: 'absolute',
    inset: 0,
    borderRadius: 2,
  },
  heroImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 2,
    display: 'block',
  },
  heroImgVignette: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, transparent 60%, rgba(26,20,16,0.15))',
    borderRadius: 2,
  },
  heroImgPlaceholder: {
    position: 'absolute',
    inset: 0,
    borderRadius: 2,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'var(--bg-2)',
  },
  heroImgPlaceholderGlow: {
    position: 'absolute',
    inset: '-20%',
    background:
      'radial-gradient(circle at 35% 35%, rgba(184,149,106,0.22), transparent 55%), radial-gradient(circle at 65% 65%, rgba(26,20,16,0.06), transparent 50%)',
    filter: 'blur(20px)',
  },
  heroImgPlaceholderGrid: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
    opacity: 0.5,
  },
  heroImgCross: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, transparent, rgba(247,244,239,0.12))',
  },
  heroFloatTag: {
    position: 'absolute',
    bottom: '-14px',
    left: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '0.5rem 0.95rem',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 999,
    fontSize: '0.72rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--ink)',
    fontWeight: 400,
    boxShadow: 'var(--shadow-md)',
    whiteSpace: 'nowrap',
  },
  heroFloatTagDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent)',
    flexShrink: 0,
  },
  cornerMark: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderTop: '1px solid var(--accent)',
    borderLeft: '1px solid var(--accent)',
    opacity: 0.6,
  },

  /* ── Editorial label */
  editorialLabel: {
    padding: '2.5rem 0',
  },
  editorialLabelInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1rem 0',
  },
  editorialLabelText: {
    fontSize: '0.7rem',
    letterSpacing: '0.32em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 400,
    whiteSpace: 'nowrap',
  },
  editorialLabelLine: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, var(--border), transparent)',
  },

  /* ── Sections */
  section: {
    padding: '0 0 3rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: '1.75rem',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid var(--border)',
  },
  sectionTitleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  sectionEyebrow: {
    fontSize: '0.7rem',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    fontWeight: 400,
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.2rem',
    fontWeight: 300,
    letterSpacing: '-0.01em',
    color: 'var(--ink)',
    margin: 0,
  },
  sectionCta: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ink-3)',
    fontWeight: 400,
    transition: 'color 0.2s ease',
    whiteSpace: 'nowrap',
  },

  /* ── Slider */
  sliderWrap: {
    display: 'flex',
    gap: '1.25rem',
    overflowX: 'auto',
    paddingBottom: '0.75rem',
    scrollSnapType: 'x mandatory',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    /* Hide scrollbar on webkit */
    WebkitOverflowScrolling: 'touch',
  },
  skelCard: {
    minWidth: 280,
    height: 420,
    borderRadius: 4,
    flexShrink: 0,
  },
  emptyNote: {
    padding: '2rem',
    border: '1px dashed var(--border)',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.45)',
  },
  emptyNoteText: {
    margin: 0,
    color: 'var(--ink-3)',
    fontSize: '0.92rem',
    fontWeight: 300,
    lineHeight: 1.7,
  },

  /* ── Category grid */
  categoryGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.6rem',
  },
  categoryChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1.05rem',
    borderRadius: 2,
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.55)',
    color: 'var(--ink)',
    fontSize: '0.82rem',
    letterSpacing: '0.06em',
    fontWeight: 300,
    transition: 'background 0.2s, border-color 0.2s',
    textDecoration: 'none',
  },
  categoryChipAccent: {
    background: 'rgba(184,149,106,0.10)',
    borderColor: 'rgba(184,149,106,0.30)',
    color: 'var(--accent-dark)',
  },
  categoryChipSale: {
    color: '#c0392b',
    borderColor: 'rgba(192,57,43,0.22)',
    background: 'rgba(192,57,43,0.05)',
  },
  categoryChipLabel: {},
  categoryChipIcon: { opacity: 0.5 },

  /* ── Marquee */
  marqueeSection: {
    overflow: 'hidden',
    borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(26,20,16,0.03)',
    marginBottom: '3rem',
    marginLeft: '-2.5rem',
    marginRight: '-2.5rem',
  },
  marqueeTrack: {
    display: 'flex',
    animation: 'ticker 22s linear infinite reverse',
    width: 'max-content',
    padding: '0.9rem 0',
  },
  marqueeItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.25rem',
    padding: '0 1.5rem',
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 300,
    fontStyle: 'italic',
    color: 'var(--ink-3)',
    whiteSpace: 'nowrap',
  },
  marqueeSep: {
    color: 'var(--accent)',
    opacity: 0.6,
    fontSize: '0.9rem',
  },

  /* ── Catalog grid */
  catalogGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '1.5rem',
  },
  skelGridCard: {
    height: 500,
    borderRadius: 4,
  },
  catalogCta: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '2.5rem',
  },

  /* ── Brand statement */
  brandStatement: {
    marginLeft: '-2.5rem',
    marginRight: '-2.5rem',
    background: 'linear-gradient(180deg, rgba(26,20,16,0.97), rgba(10,8,6,1))',
    color: 'rgba(247,244,239,0.9)',
    padding: '5rem 2.5rem',
    marginBottom: 0,
  },
  brandStatementInner: {
    maxWidth: 680,
    margin: '0 auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.25rem',
  },
  brandStatementEyebrow: {
    fontSize: '0.7rem',
    letterSpacing: '0.32em',
    textTransform: 'uppercase',
    color: 'rgba(184,149,106,0.85)',
    fontWeight: 400,
  },
  brandStatementQuote: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
    fontWeight: 300,
    fontStyle: 'normal',
    lineHeight: 1.25,
    color: 'rgba(247,244,239,0.92)',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  brandStatementRule: {
    width: 48,
    height: 1,
    background: 'rgba(184,149,106,0.45)',
  },
  brandStatementSub: {
    fontSize: '0.98rem',
    fontWeight: 300,
    lineHeight: 1.85,
    color: 'rgba(247,244,239,0.52)',
    maxWidth: '56ch',
    margin: 0,
  },

  /* ── Buttons */
  btnDark: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.875rem 1.35rem',
    background: 'rgba(26,20,16,0.92)',
    color: '#fff',
    border: '1px solid rgba(26,20,16,0.5)',
    borderRadius: 2,
    fontSize: '0.78rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 400,
    textDecoration: 'none',
  },
  btnOutline: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.875rem 1.35rem',
    background: 'transparent',
    color: 'var(--ink)',
    border: '1px solid var(--border-strong)',
    borderRadius: 2,
    fontSize: '0.78rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 400,
    textDecoration: 'none',
  },
  btnOutlineLight: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.875rem 1.35rem',
    background: 'transparent',
    color: 'rgba(247,244,239,0.78)',
    border: '1px solid rgba(247,244,239,0.2)',
    borderRadius: 2,
    fontSize: '0.78rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 400,
    textDecoration: 'none',
  },
}

export default Home