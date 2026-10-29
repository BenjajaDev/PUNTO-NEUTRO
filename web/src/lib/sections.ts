import type { SiteSection, SiteSettings } from './types';

export type SectionInfo = { key: SiteSection; label: string; description: string };

/** Secciones que el panel puede ocultar, en el orden del menú. Inicio y Privacidad no se ocultan. */
export const SITE_SECTIONS: SectionInfo[] = [
  { key: 'ABOUT', label: 'Nosotras', description: 'Presentación del equipo y línea editorial.' },
  { key: 'TRENDS', label: 'Anatomía de un Trend', description: 'Notas que desarman tendencias virales.' },
  { key: 'INTERVIEWS', label: 'Pequeñas Entrevistas', description: 'Expertas, influencers y mujeres.' },
  { key: 'GLOSSARY', label: 'Glosario', description: 'Palabras normalizadas y su reformulación neutra.' },
  { key: 'REFLECTIONS', label: 'Querer encajar', description: 'Salud mental, prejuicios y manejo emocional.' },
  { key: 'MAILBOX', label: 'Buzón comunitario', description: 'Formulario y relatos publicados. Mientras esté oculto no recibe relatos nuevos.' },
  { key: 'PODCAST', label: 'Podcast', description: 'Episodios de «A Pausar el Filtro».' },
];

export const SECTION_LABEL = Object.fromEntries(SITE_SECTIONS.map((s) => [s.key, s.label])) as Record<SiteSection, string>;

/** Sin configuración cargada todavía se asume visible: evita que el menú parpadee vacío. */
export function isSectionEnabled(settings: Pick<SiteSettings, 'disabledSections'> | null | undefined, section: SiteSection) {
  return !settings?.disabledSections.includes(section);
}
