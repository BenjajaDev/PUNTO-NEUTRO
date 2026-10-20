import { Link } from 'react-router-dom';
import { formatDate, mediaUrl } from '@/lib/format';
import { PLATFORM_LABEL, type Platform, type TrendSummary } from '@/lib/types';

const COVER_TONE: Record<Platform, string> = { TIKTOK: 'cover--tiktok', INSTAGRAM: 'cover--instagram', MULTIPLATFORM: 'cover--multi' };

/** Portada generada con la paleta cuando la nota no tiene imagen propia. */
export function TrendCover({ trend, large = false }: { trend: Pick<TrendSummary, 'title' | 'platform' | 'coverId'>; large?: boolean }) {
  const src = mediaUrl(trend.coverId);
  if (src) return <img className={`cover${large ? ' cover--large' : ''}`} src={src} alt="" loading="lazy" decoding="async" />;
  return (
    <div className={`cover cover--generated ${COVER_TONE[trend.platform]}${large ? ' cover--large' : ''}`} aria-hidden>
      <span className="cover__ring" />
      <span className="cover__dot" />
    </div>
  );
}

export function TrendCard({ trend }: { trend: TrendSummary }) {
  return (
    <article className="trend-card card lift">
      <TrendCover trend={trend} />
      <div className="trend-card__body">
        <div className="row" style={{ gap: 8 }}>
          <span className="badge">{PLATFORM_LABEL[trend.platform]}</span>
          {trend.publishedAt ? <time className="text-muted text-xs" dateTime={trend.publishedAt}>{formatDate(trend.publishedAt)}</time> : null}
        </div>
        <h3 className="trend-card__title">
          {/* El enlace cubre toda la tarjeta (::after) sin anidar elementos interactivos. */}
          <Link to={`/anatomia-de-un-trend/${trend.slug}`} className="stretched-link" viewTransition>
            {trend.title}
          </Link>
        </h3>
        <p className="text-secondary trend-card__summary">{trend.summary}</p>
        {trend.authorMember?.name ? <p className="trend-card__author text-small">Por {trend.authorMember.name}</p> : null}
      </div>
    </article>
  );
}
