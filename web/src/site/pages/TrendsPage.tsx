import { Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { normalize } from '@/lib/format';
import { PLATFORM_LABEL, type Platform, type TrendSummary } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { EmptyState, ErrorState, SkeletonCards } from '@/ui';
import { PageHero } from '../components/Common';
import { TrendCard } from '../components/TrendCard';
import { usePageTitle, useSiteData } from '../SiteDataProvider';

const FILTERS: { key: Platform | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'TIKTOK', label: PLATFORM_LABEL.TIKTOK },
  { key: 'INSTAGRAM', label: PLATFORM_LABEL.INSTAGRAM },
  { key: 'MULTIPLATFORM', label: 'Ambas plataformas' },
];

/** Sección 3 · Anatomía de un Trend: listado con filtro por plataforma y búsqueda. */
export function TrendsPage() {
  const { data, loading, error, reload } = useResource((signal) => api<TrendSummary[]>('/trends', { signal }), []);
  const { settings } = useSiteData();
  usePageTitle('Anatomía de un Trend');
  const [platform, setPlatform] = useState<Platform | 'ALL'>('ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return (data || []).filter((t) => (platform === 'ALL' || t.platform === platform) && (!q || normalize(`${t.title} ${t.summary} ${t.tags.join(' ')}`).includes(q)));
  }, [data, platform, query]);

  return (
    <>
      <PageHero
        eyebrow="Anatomía de un Trend"
        title="Tendencias virales, desarmadas con calma"
        intro="Notas breves que desglosan tendencias de TikTok e Instagram: su origen, el mecanismo algorítmico que las impulsa, su impacto y una mirada desde la neutralidad corporal."
        art="trends"
        coverId={settings?.trendsCoverId}
      />
      <section className="section section--tight">
        <div className="container stack-lg">
          <div className="toolbar">
            <div className="row" role="group" aria-label="Filtrar por plataforma">
              {FILTERS.map((f) => (
                <button key={f.key} type="button" className="chip" aria-pressed={platform === f.key} onClick={() => setPlatform(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
            <label className="search">
              <Search size={18} aria-hidden />
              <span className="visually-hidden">Buscar notas</span>
              <input className="input" type="search" placeholder="Buscar por tema o palabra" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
          </div>

          {loading ? (
            <SkeletonCards count={6} label="Cargando notas" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !filtered.length ? (
            <EmptyState icon={Sparkles} title={data?.length ? 'Sin coincidencias' : 'Pronto publicaremos la primera nota'} message={data?.length ? 'Prueba con otra palabra o plataforma.' : undefined} />
          ) : (
            <>
              <p className="text-muted text-small" aria-live="polite">{filtered.length === 1 ? '1 nota' : `${filtered.length} notas`}</p>
              <div className="grid-3 stagger">
                {filtered.map((trend) => (
                  <TrendCard key={trend.id} trend={trend} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
