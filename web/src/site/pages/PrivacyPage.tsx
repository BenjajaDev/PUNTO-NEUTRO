import { paragraphs } from '@/lib/format';
import { Skeleton } from '@/ui';
import { PageHero } from '../components/Common';
import { useSiteData } from '../SiteDataProvider';

/** Política de privacidad del Buzón (editable en el panel). Líneas «1. Título» se vuelven subtítulos. */
export function PrivacyPage() {
  const { settings, loading } = useSiteData();
  return (
    <>
      <PageHero eyebrow="Avisos legales" title="Privacidad y protección de datos" />
      <section className="section section--tight">
        <div className="container reading prose">
          {loading ? (
            <Skeleton height={240} />
          ) : (
            paragraphs(settings?.privacyPolicy || '').map((p, i) => (/^\d+\.\s/.test(p) && p.length < 80 ? <h2 key={i}>{p}</h2> : <p key={i}>{p}</p>))
          )}
        </div>
      </section>
    </>
  );
}
