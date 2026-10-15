import { CheckCircle2, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { mediaUrl } from '@/lib/format';
import type { TeamMember } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { EmptyState, ErrorState, SkeletonCards } from '@/ui';
import { PageHero, Prose, SectionHeading } from '../components/Common';
import { useSiteData } from '../SiteDataProvider';

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** Sección 2 · Nosotras: quiénes somos, roles editoriales y línea editorial. */
export function AboutPage() {
  const { settings } = useSiteData();
  const team = useResource((signal) => api<TeamMember[]>('/team', { signal }), []);

  return (
    <>
      <PageHero eyebrow="Nosotras" title="Quiénes somos" intro={settings?.aboutIntro} />

      <section className="section" aria-labelledby="equipo">
        <div className="container stack-lg">
          <SectionHeading id="equipo" eyebrow="Equipo editorial" title="Roles y responsabilidades" intro="Investigación de tendencias, pauta periodística, entrevistas en profundidad, guionización audiovisual, producción transmedia y gestión estratégica de redes." />
          {team.loading ? (
            <SkeletonCards count={2} label="Cargando equipo" />
          ) : team.error ? (
            <ErrorState message={team.error} onRetry={team.reload} />
          ) : !team.data?.length ? (
            <EmptyState icon={Users} title="Pronto presentaremos al equipo" />
          ) : (
            <div className="grid-2">
              {team.data.map((member) => (
                <article key={member.id} className="card card--raised team-card reveal">
                  {mediaUrl(member.photoId) ? (
                    <img className="team-card__photo" src={mediaUrl(member.photoId)!} alt={`Retrato de ${member.name}`} width={96} height={96} loading="lazy" />
                  ) : (
                    <span className="team-card__photo team-card__photo--initials" aria-hidden>{initials(member.name)}</span>
                  )}
                  <div className="stack-sm">
                    <h3 className="team-card__name">{member.name}</h3>
                    <p className="team-card__role">{member.role}</p>
                    {member.bio ? <p className="text-secondary">{member.bio}</p> : null}
                    {member.responsibilities.length ? (
                      <ul className="check-list" aria-label={`Responsabilidades de ${member.name}`}>
                        {member.responsibilities.map((r) => (
                          <li key={r}>
                            <CheckCircle2 size={16} aria-hidden /> {r}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section section--tinted" aria-labelledby="linea">
        <div className="container about-grid">
          <SectionHeading id="linea" eyebrow="Línea editorial" title="Cómo hacemos periodismo" />
          <div className="stack-lg reveal">
            {settings?.editorialLine ? <Prose text={settings.editorialLine} className="prose--lead" /> : null}
            {settings?.editorialPillars.length ? (
              <ul className="pillars">
                {settings.editorialPillars.map((p, i) => (
                  <li key={p} className="pillar">
                    <span className="pillar__n" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                    {p}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
