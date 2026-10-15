import { ArrowRight, BookOpen, Compass, Eye, Headphones, Mail, MessageSquareQuote, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { mediaUrl } from '@/lib/format';
import type { HomeData } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { buttonClass, ErrorState, Skeleton, SkeletonCards } from '@/ui';
import { Prose, SectionHeading } from '../components/Common';
import { SoundCloudPlayer } from '../components/SoundCloudPlayer';
import { TrendCard } from '../components/TrendCard';

/** Composición decorativa: cuerpos/círculos sin forma impuesta. Estática a propósito. */
function HeroArt() {
  return (
    <svg className="hero__art" viewBox="0 0 420 420" aria-hidden focusable="false">
      <circle cx="210" cy="210" r="190" fill="var(--color-section)" />
      <circle cx="160" cy="170" r="110" fill="var(--palette-lavanda-claro)" opacity="0.75" />
      <circle cx="270" cy="250" r="105" fill="var(--palette-rosa-suave)" opacity="0.7" />
      <circle cx="225" cy="150" r="64" fill="var(--palette-magenta-suave)" opacity="0.55" />
      <circle cx="210" cy="210" r="150" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
      <circle cx="210" cy="210" r="26" fill="var(--color-primary)" />
      <circle cx="210" cy="210" r="9" fill="var(--palette-blanco-crema)" />
    </svg>
  );
}

function HomeSkeleton() {
  return (
    <div className="container section stack-lg" role="status" aria-label="Cargando portada">
      <Skeleton width="30%" height={18} />
      <Skeleton width="75%" height={56} />
      <Skeleton width="60%" height={22} />
      <SkeletonCards />
    </div>
  );
}

export function HomePage() {
  const { data, loading, error, reload } = useResource((signal) => api<HomeData>('/home', { signal }), []);

  if (loading && !data) return <HomeSkeleton />;
  if (error || !data) return <div className="container section"><ErrorState message={error || ''} onRetry={reload} /></div>;

  const { settings: s, trends, interview, glossary, glossaryCount, episode, storiesCount } = data;

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero__inner">
          <div className="hero__copy stagger">
            <span className="eyebrow">{s.tagline || 'Periodismo transmedia'}</span>
            <h1 id="hero-title" className="hero__title">
              {s.heroTitle || s.siteName}
            </h1>
            {s.heroSubtitle ? <p className="hero__subtitle">{s.heroSubtitle}</p> : null}
            <div className="row hero__actions">
              <Link to="/anatomia-de-un-trend" className={buttonClass({ size: 'lg' })} viewTransition>
                Explorar los trends <ArrowRight size={18} aria-hidden />
              </Link>
              <Link to="/buzon" className={buttonClass({ variant: 'secondary', size: 'lg' })} viewTransition>
                Comparte tu relato
              </Link>
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      {/* ── ¿Qué es Punto Neutro? ── */}
      <section className="section" aria-labelledby="que-es">
        <div className="container about-grid">
          <SectionHeading id="que-es" eyebrow="El proyecto" title={`¿Qué es ${s.siteName}?`} />
          <div className="stack-lg reveal">
            <Prose text={s.whatIs} className="prose--lead" />
            {s.objective ? (
              <div className="callout">
                <Target size={22} aria-hidden className="callout__icon" />
                <div>
                  <h3 className="callout__title">Objetivo de la página</h3>
                  <Prose text={s.objective} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Misión y visión ── */}
      <section className="section section--tinted" aria-label="Misión y visión">
        <div className="container grid-2">
          <article className="card card--raised mv-card reveal">
            <span className="mv-card__icon"><Compass size={24} aria-hidden /></span>
            <h2 className="mv-card__title">Misión</h2>
            <Prose text={s.mission} />
          </article>
          <article className="card card--raised mv-card reveal">
            <span className="mv-card__icon mv-card__icon--accent"><Eye size={24} aria-hidden /></span>
            <h2 className="mv-card__title">Visión</h2>
            <Prose text={s.vision} />
          </article>
        </div>
      </section>

      {/* ── Anatomía de un Trend ── */}
      {trends.length ? (
        <section className="section" aria-labelledby="trends-title">
          <div className="container stack-lg">
            <SectionHeading
              id="trends-title"
              eyebrow="Anatomía de un Trend"
              title="Desarmamos las tendencias virales"
              intro="Origen, mecanismo algorítmico, impacto y una mirada desde la neutralidad corporal."
              action={{ to: '/anatomia-de-un-trend', label: 'Ver todas las notas' }}
            />
            <div className="grid-3">
              {trends.map((trend) => (
                <div key={trend.id} className="reveal">
                  <TrendCard trend={trend} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Glosario ── */}
      {glossary.length ? (
        <section className="section section--tinted" aria-labelledby="glosario-title">
          <div className="container stack-lg">
            <SectionHeading
              id="glosario-title"
              eyebrow="Glosario de palabras normalizadas"
              title="Las palabras también moldean los cuerpos"
              action={{ to: '/glosario', label: `Explorar los ${glossaryCount} términos` }}
            />
            <div className="grid-3">
              {glossary.map((term) => (
                <article key={term.id} className="card card--raised glossary-teaser reveal">
                  <span className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Se dice</span>
                  <h3 className="glossary-teaser__term">«{term.term}»</h3>
                  <p className="text-secondary text-small">{term.bias}</p>
                  <div className="glossary-teaser__neutral">
                    <span className="badge badge--success">Reformulación neutra</span>
                    <p>{term.neutralReformulation}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Entrevista y podcast ── */}
      <section className="section" aria-label="Entrevistas y podcast">
        <div className="container grid-2">
          <article className="card feature-card reveal">
            <span className="feature-card__icon"><MessageSquareQuote size={24} aria-hidden /></span>
            <span className="eyebrow">Pequeñas Entrevistas</span>
            {interview ? (
              <>
                <div className="row" style={{ gap: 14 }}>
                  {mediaUrl(interview.photoId) ? <img className="avatar" src={mediaUrl(interview.photoId)!} alt="" width={56} height={56} /> : null}
                  <div>
                    <h2 className="feature-card__title">{interview.guestName}</h2>
                    {interview.guestHandle ? <p className="text-muted text-small">{interview.guestHandle}</p> : null}
                  </div>
                </div>
                <blockquote className="feature-card__quote">«{interview.question1}»</blockquote>
                <Link to={`/entrevistas/${interview.slug}`} className="link-arrow" viewTransition>
                  Leer las tres preguntas <ArrowRight size={18} aria-hidden />
                </Link>
              </>
            ) : (
              <>
                <h2 className="feature-card__title">Tres preguntas, una conversación honesta</h2>
                <p className="text-secondary">Creadoras de contenido chilenas hablan sobre el escrutinio digital, la presión estética y el autocuidado. Muy pronto.</p>
              </>
            )}
          </article>

          <article className="card feature-card feature-card--podcast reveal">
            <span className="feature-card__icon feature-card__icon--accent"><Headphones size={24} aria-hidden /></span>
            <span className="eyebrow">Podcast</span>
            <h2 className="feature-card__title">{s.podcastName}</h2>
            {episode ? (
              <>
                <p className="text-secondary">{episode.title}</p>
                <SoundCloudPlayer url={episode.soundcloudUrl} title={episode.title} />
                <Link to="/podcast" className="link-arrow" viewTransition>
                  Todos los episodios <ArrowRight size={18} aria-hidden />
                </Link>
              </>
            ) : (
              <p className="text-secondary">{s.podcastDescription || 'Conversaciones con especialistas. Primer episodio muy pronto.'}</p>
            )}
          </article>
        </div>
      </section>

      {/* ── Buzón ── */}
      <section className="section" aria-labelledby="buzon-title">
        <div className="container">
          <div className="cta-band reveal">
            <div className="stack-sm" style={{ maxWidth: 620 }}>
              <span className="eyebrow eyebrow--on-band">Buzón comunitario</span>
              <h2 id="buzon-title" className="cta-band__title">Tu historia también importa</h2>
              <p>{s.mailboxIntro}</p>
              {storiesCount ? <p className="text-small"><BookOpen size={15} aria-hidden style={{ verticalAlign: '-2px' }} /> {storiesCount} relatos compartidos con la comunidad</p> : null}
            </div>
            <Link to="/buzon" className={buttonClass({ variant: 'accent', size: 'lg' })} viewTransition>
              <Mail size={18} aria-hidden /> Escribir mi relato
            </Link>
          </div>
        </div>
      </section>

      {/* ── Banner de cierre ── */}
      <section className="section closing" aria-labelledby="cierre-title">
        <div className="container closing__inner reveal">
          <h2 id="cierre-title" className="closing__title">{s.closingTitle || '¿Conversamos?'}</h2>
          {s.closingText ? <p className="closing__text">{s.closingText}</p> : null}
          <div className="row" style={{ justifyContent: 'center' }}>
            {s.contactEmail ? (
              <a href={`mailto:${s.contactEmail}`} className={buttonClass({})}>
                <Mail size={18} aria-hidden /> {s.contactEmail}
              </a>
            ) : null}
            <Link to="/nosotras" className={buttonClass({ variant: 'secondary' })} viewTransition>
              Conoce al equipo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
