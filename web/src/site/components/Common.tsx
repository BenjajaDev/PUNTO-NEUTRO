import { ArrowRight, BookMarked, ExternalLink, LifeBuoy, MessageCircleHeart, PlayCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl, paragraphs } from '@/lib/format';
import type { AuthorProfile, Reference } from '@/lib/types';
import { SectionArt, type ArtKind } from './SectionArt';

export function SectionHeading({ eyebrow, title, intro, action, id }: { eyebrow?: string; title: string; intro?: ReactNode; action?: { to: string; label: string }; id?: string }) {
  return (
    <div className="section-heading reveal">
      <div className="stack-sm" style={{ gap: 10 }}>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 id={id} className="section-heading__title">
          {title}
        </h2>
        {intro ? <p className="section-heading__intro">{intro}</p> : null}
      </div>
      {action ? (
        <Link to={action.to} className="link-arrow" viewTransition>
          {action.label} <ArrowRight size={18} aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Texto largo editado en el panel → párrafos. Admite subtítulos («## Título»)
 * y listas (líneas que empiezan con «- »), sin necesidad de un editor enriquecido.
 */
export function Prose({ text, className = '' }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      const items = list;
      blocks.push(
        <ul key={`l${blocks.length}`}>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const line of paragraphs(text)) {
    if (line.startsWith('- ')) {
      list.push(line.slice(2));
      continue;
    }
    flush();
    if (line.startsWith('## ')) blocks.push(<h3 key={blocks.length}>{line.slice(3)}</h3>);
    else blocks.push(<p key={blocks.length}>{line}</p>);
  }
  flush();
  return <div className={`prose ${className}`}>{blocks}</div>;
}

/** Portada de sección: la imagen subida en el panel o, si no hay, la ilustración de la sección. */
export function SectionCover({ coverId, art, className = '' }: { coverId?: number | null; art: ArtKind; className?: string }) {
  const src = mediaUrl(coverId);
  if (src) return <img className={`section-cover ${className}`} src={src} alt="" decoding="async" fetchPriority="high" />;
  return <SectionArt kind={art} className={`section-art ${className}`} />;
}

/** Cabecera de página interna, consistente en todo el sitio, con portada editable. */
export function PageHero({ eyebrow, title, intro, children, art, coverId }: { eyebrow: string; title: string; intro?: ReactNode; children?: ReactNode; art?: ArtKind; coverId?: number | null }) {
  return (
    <section className={`page-hero${art ? ' page-hero--with-art' : ''}`}>
      <div className="container page-hero__inner">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="page-hero__title">{title}</h1>
          {intro ? <p className="page-hero__intro">{intro}</p> : null}
          {children}
        </div>
        {art ? <SectionCover coverId={coverId} art={art} className="page-hero__cover" /> : null}
      </div>
    </section>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/** Perfil de la autora en una nota (RF-04): cercanía y responsabilidad editorial. */
export function AuthorCard({ author, fallbackName }: { author?: AuthorProfile | null; fallbackName?: string | null }) {
  if (!author && !fallbackName) return null;
  const name = author?.name ?? fallbackName ?? '';
  const photo = mediaUrl(author?.photoId);
  return (
    <aside className="author-card" aria-label="Autora de la nota">
      {photo ? <img className="author-card__photo" src={photo} alt="" width={56} height={56} /> : <span className="author-card__photo author-card__photo--initials" aria-hidden>{initials(name)}</span>}
      <div className="author-card__body">
        <span className="author-card__label">Escrito por</span>
        {author ? (
          <Link to={`/nosotras#integrante-${author.id}`} className="author-card__name" viewTransition>
            {name}
          </Link>
        ) : (
          <span className="author-card__name">{name}</span>
        )}
        {author?.role ? <span className="author-card__role">{author.role}</span> : null}
      </div>
    </aside>
  );
}

/** Referencias bibliográficas y fuentes (RF-04). */
export function ReferencesList({ references, id = 'referencias' }: { references: Reference[]; id?: string }) {
  if (!references?.length) return null;
  return (
    <section className="references" aria-labelledby={id}>
      <h2 id={id} className="references__title">
        <BookMarked size={20} aria-hidden /> Referencias y fuentes
      </h2>
      <ol className="references__list">
        {references.map((ref, i) => (
          <li key={i}>
            {ref.citation}{' '}
            {ref.url ? (
              <a href={ref.url} target="_blank" rel="noopener noreferrer">
                Ver fuente <ExternalLink size={13} aria-hidden />
                <span className="visually-hidden"> (se abre en otra pestaña)</span>
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Situación cotidiana que aterriza un concepto (RNF-01). */
export function EverydayExample({ text, title = 'En la vida cotidiana' }: { text: string; title?: string }) {
  if (!text) return null;
  return (
    <figure className="everyday reveal">
      <span className="everyday__icon" aria-hidden>
        <MessageCircleHeart size={22} />
      </span>
      <div>
        <figcaption className="everyday__title">{title}</figcaption>
        <blockquote className="everyday__text">{text}</blockquote>
      </div>
    </figure>
  );
}

/** Enlace a la cápsula audiovisual en redes (RNF-02). */
export function CapsuleLink({ url }: { url: string }) {
  if (!url) return null;
  const host = (() => {
    try {
      const h = new URL(url).hostname;
      if (h.includes('tiktok')) return 'TikTok';
      if (h.includes('instagram')) return 'Instagram';
      if (h.includes('youtu')) return 'YouTube';
      return 'redes';
    } catch {
      return 'redes';
    }
  })();
  return (
    <a className="capsule-link" href={url} target="_blank" rel="noopener noreferrer">
      <PlayCircle size={28} aria-hidden />
      <span>
        <strong>Mira la cápsula en {host}</strong>
        <span className="text-small">Este tema en menos de un minuto</span>
      </span>
      <ExternalLink size={16} aria-hidden />
      <span className="visually-hidden">(se abre en otra pestaña)</span>
    </a>
  );
}

/** Recursos de ayuda en Chile: siempre visibles en contenidos de salud mental. */
export function HelpResources({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`help-box${compact ? ' help-box--compact' : ''}`} aria-labelledby="ayuda-title">
      <span className="help-box__icon" aria-hidden>
        <LifeBuoy size={24} />
      </span>
      <div className="stack-sm">
        <h2 id="ayuda-title" className="help-box__title">Si necesitas ayuda ahora</h2>
        <ul className="help-box__list">
          <li>
            <strong>*4141</strong> · Línea de prevención del suicidio (gratuita, 24 horas)
          </li>
          <li>
            <a href="tel:6003607777"><strong>600 360 7777</strong></a> · Salud Responde
          </li>
          <li>
            <strong>131</strong> · Urgencias (SAMU) o acude al servicio de urgencia más cercano
          </li>
        </ul>
        {!compact ? <p className="text-small">Este contenido es educativo y no reemplaza la atención de profesionales de la salud.</p> : null}
      </div>
    </aside>
  );
}
