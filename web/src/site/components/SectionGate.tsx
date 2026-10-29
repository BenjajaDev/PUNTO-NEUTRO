import { EyeOff } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { SECTION_LABEL } from '@/lib/sections';
import type { SiteSection } from '@/lib/types';
import { buttonClass } from '@/ui';
import { usePageTitle, useSectionEnabled } from '../SiteDataProvider';

function SectionUnavailable({ section }: { section: SiteSection }) {
  usePageTitle(SECTION_LABEL[section]);
  return (
    <section className="container section stack section-unavailable" aria-labelledby="seccion-no-disponible">
      <span className="section-unavailable__icon" aria-hidden>
        <EyeOff size={28} />
      </span>
      <h1 id="seccion-no-disponible" className="section-unavailable__title">Esta sección no está disponible por ahora</h1>
      <p className="text-secondary section-unavailable__text">
        «{SECTION_LABEL[section]}» está en pausa mientras el equipo prepara su contenido. Mientras tanto, puedes seguir recorriendo el resto del sitio.
      </p>
      <Link to="/" className={buttonClass({})} viewTransition>Volver al inicio</Link>
    </section>
  );
}

/** Ruta-contenedor: muestra la sección o, si el panel la ocultó, un aviso en vez del 404 genérico. */
export function SectionGate({ section }: { section: SiteSection }) {
  return useSectionEnabled(section) ? <Outlet /> : <SectionUnavailable section={section} />;
}
