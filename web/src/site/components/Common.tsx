import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { paragraphs } from '@/lib/format';

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

/** Texto largo editado en el panel → párrafos. */
export function Prose({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`prose ${className}`}>
      {paragraphs(text).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

/** Cabecera de página interna, consistente en todo el sitio. */
export function PageHero({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <section className="page-hero">
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="page-hero__title">{title}</h1>
        {intro ? <p className="page-hero__intro">{intro}</p> : null}
        {children}
      </div>
    </section>
  );
}
