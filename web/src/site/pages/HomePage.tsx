import { ArrowRight, BookOpen, Compass, Eye, Headphones, HeartHandshake, Mail, MessageSquareQuote, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { mediaUrl } from '@/lib/format';
import { INTERVIEW_CATEGORY_LABEL, REFLECTION_CATEGORY, type HomeData } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { buttonClass, ErrorState, Skeleton, SkeletonCards } from '@/ui';
import { Prose, SectionCover, SectionHeading } from '../components/Common';
import { SectionArt } from '../components/SectionArt';
import { TrendCard } from '../components/TrendCard';
import { usePageTitle } from '../SiteDataProvider';

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
  usePageTitle(null);

  if (loading && !data) return <HomeSkeleton />;
  if (error || !data) return <div className="container section"><ErrorState message={error || ''} onRetry={reload} /></div>;

  const { settings: s, trends, interview, glossary, glossaryCount, episode, storiesCount, reflections } = data;

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
          {/* Imagen editable en el panel; sin imagen, la ilustración de la marca. */}
          <SectionCover coverId={s.heroImageId} art="home" className="hero__art" />
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

      {/* ── Querer encajar ── */}
      {reflections.length ? (
        <section className="section" aria-labelledby="encajar-title">
          <div className="container stack-lg">
            <SectionHeading
              id="encajar-title"
              eyebrow="Querer encajar"
              title="Salud mental, prejuicios y presión social"
              intro={s.reflectionsIntro || undefined}
              action={{ to: '/querer-encajar', label: 'Leer la sección' }}
            />
            <div className="grid-3">
              {reflections.map((r) => (
                <article key={r.id} className="card card--raised reflection-card lift reveal">
                  <span className="reflection-card__icon" aria-hidden><HeartHandshake size={22} /></span>
                  <span className="badge">{REFLECTION_CATEGORY[r.category]}</span>
                  <h3 className="reflection-card__title">
                    <Link to={`/querer-encajar/${r.slug}`} className="stretched-link" viewTransition>{r.title}</Link>
                  </h3>
                  <p className="text-secondary text-small">{r.summary}</p>
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
                    <span className="badge">{INTERVIEW_CATEGORY_LABEL[interview.category]}</span>
                    <h2 className="feature-card__title">{interview.guestName}</h2>
                    {interview.guestHandle ? <p className="text-muted text-small">{interview.guestHandle}</p> : null}
                  </div>
                </div>
                <blockquote className="feature-card__quote">«{interview.firstQuestion}»</blockquote>
                <Link to={`/entrevistas/${interview.slug}`} className="link-arrow" viewTransition>
                  {interview.questionCount > 1 ? `Leer las ${interview.questionCount} preguntas` : 'Leer la entrevista'} <ArrowRight size={18} aria-hidden />
                </Link>
              </>
            ) : (
              <>
                <h2 className="feature-card__title">Preguntas simples, conversaciones honestas</h2>
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
                <div className="episode-mini">
                  {mediaUrl(episode.coverId) ? (
                    <img className="episode-mini__cover" src={mediaUrl(episode.coverId)!} alt="" width={88} height={88} loading="lazy" />
                  ) : (
                    <span className="episode-mini__cover episode-mini__cover--art" aria-hidden><SectionArt kind="podcast" /></span>
                  )}
                  <div className="stack-sm" style={{ gap: 4 }}>
                    <span className="text-xs text-muted">Último episodio</span>
                    <strong>{episode.title}</strong>
                    {episode.tags.length ? <span className="text-small text-secondary">{episode.tags.map((t) => `#${t}`).join(' ')}</span> : null}
                  </div>
                </div>
                <a className={buttonClass({ size: 'sm' })} href={episode.soundcloudUrl} target="_blank" rel="noopener noreferrer" style={{ alignSelf: 'flex-start' }}>
                  <Headphones size={16} aria-hidden /> Escuchar en SoundCloud
                  <span className="visually-hidden">(se abre en otra pestaña)</span>
                </a>
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
