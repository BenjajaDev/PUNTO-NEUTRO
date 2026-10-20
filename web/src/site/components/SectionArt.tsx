import type { ReactElement } from 'react';

/**
 * Ilustraciones por sección con la paleta del proyecto. Se muestran cuando el
 * equipo no ha subido una portada propia en el panel. Son estáticas a
 * propósito (nada se mueve solo) y decorativas (aria-hidden).
 */
export type ArtKind = 'home' | 'about' | 'trends' | 'interviews' | 'glossary' | 'reflections' | 'mailbox' | 'podcast';

const C = {
  rosa: 'var(--palette-rosa-suave)',
  crema: 'var(--palette-blanco-crema)',
  lila: 'var(--palette-lila-medio)',
  morado: 'var(--color-primary)',
  magenta: 'var(--palette-magenta-suave)',
  lavanda: 'var(--palette-lavanda-claro)',
  fondo: 'var(--color-section)',
  tinta: 'var(--color-text-primary)',
};

function Backdrop() {
  return (
    <>
      <circle cx="210" cy="210" r="190" fill={C.fondo} />
      <circle cx="210" cy="210" r="150" fill="none" stroke={C.morado} strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
    </>
  );
}

const ART: Record<ArtKind, () => ReactElement> = {
  home: () => (
    <>
      <Backdrop />
      <circle cx="160" cy="170" r="110" fill={C.lavanda} opacity="0.75" />
      <circle cx="270" cy="250" r="105" fill={C.rosa} opacity="0.7" />
      <circle cx="225" cy="150" r="64" fill={C.magenta} opacity="0.55" />
      <circle cx="210" cy="210" r="26" fill={C.morado} />
      <circle cx="210" cy="210" r="9" fill={C.crema} />
    </>
  ),
  // Cuerpos diversos: círculos de distinto tamaño que conviven sin jerarquía.
  about: () => (
    <>
      <Backdrop />
      <circle cx="150" cy="230" r="78" fill={C.lavanda} opacity="0.85" />
      <circle cx="265" cy="215" r="96" fill={C.rosa} opacity="0.75" />
      <circle cx="205" cy="140" r="56" fill={C.magenta} opacity="0.6" />
      <circle cx="150" cy="200" r="16" fill={C.crema} />
      <circle cx="265" cy="180" r="18" fill={C.crema} />
      <circle cx="205" cy="125" r="12" fill={C.crema} />
    </>
  ),
  // Un teléfono con un video y los «me gusta» que empujan la comparación.
  trends: () => (
    <>
      <Backdrop />
      <rect x="150" y="70" width="130" height="250" rx="26" fill={C.morado} />
      <rect x="162" y="92" width="106" height="200" rx="12" fill={C.lavanda} />
      <circle cx="215" cy="175" r="34" fill={C.crema} opacity="0.9" />
      <path d="M205 160 L232 175 L205 190 Z" fill={C.morado} />
      <rect x="175" y="230" width="80" height="10" rx="5" fill={C.crema} opacity="0.85" />
      <rect x="175" y="250" width="54" height="10" rx="5" fill={C.crema} opacity="0.6" />
      <path d="M318 130c0-12 17-15 21-4 4-11 21-8 21 4 0 15-21 25-21 25s-21-10-21-25z" fill={C.rosa} />
      <path d="M86 230c0-9 13-11 16-3 3-8 16-6 16 3 0 11-16 19-16 19s-16-8-16-19z" fill={C.magenta} />
      <path d="M330 250l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" fill={C.magenta} />
      <path d="M96 120l5 11 11 5-11 5-5 11-5-11-11-5 11-5z" fill={C.rosa} />
    </>
  ),
  // Dos voces que conversan.
  interviews: () => (
    <>
      <Backdrop />
      <path d="M90 120h170a28 28 0 0 1 28 28v60a28 28 0 0 1-28 28H150l-36 30v-30h-24a28 28 0 0 1-28-28v-60a28 28 0 0 1 28-28z" fill={C.lavanda} />
      <path d="M190 210h140a26 26 0 0 1 26 26v52a26 26 0 0 1-26 26h-16v28l-32-28h-92a26 26 0 0 1-26-26v-52a26 26 0 0 1 26-26z" fill={C.rosa} />
      <circle cx="140" cy="178" r="10" fill={C.morado} />
      <circle cx="176" cy="178" r="10" fill={C.morado} />
      <circle cx="212" cy="178" r="10" fill={C.morado} />
      <rect x="215" y="250" width="110" height="10" rx="5" fill={C.crema} />
      <rect x="215" y="272" width="72" height="10" rx="5" fill={C.crema} opacity="0.8" />
    </>
  ),
  // Un libro abierto: las palabras se pueden releer y resignificar.
  glossary: () => (
    <>
      <Backdrop />
      <path d="M210 120c-40-22-90-22-120-10v190c30-12 80-12 120 10z" fill={C.lavanda} />
      <path d="M210 120c40-22 90-22 120-10v190c-30-12-80-12-120 10z" fill={C.rosa} />
      <path d="M210 120v190" stroke={C.morado} strokeWidth="4" />
      <text x="150" y="215" textAnchor="middle" fontFamily="var(--font-serif)" fontSize="56" fontWeight="600" fill={C.morado}>Aa</text>
      <rect x="236" y="170" width="70" height="9" rx="4.5" fill={C.crema} />
      <rect x="236" y="192" width="56" height="9" rx="4.5" fill={C.crema} />
      <rect x="236" y="214" width="64" height="9" rx="4.5" fill={C.crema} />
      <path d="M236 250l14 14 28-30" fill="none" stroke={C.morado} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // Un espejo que devuelve un reflejo amable.
  reflections: () => (
    <>
      <Backdrop />
      <ellipse cx="210" cy="205" rx="92" ry="122" fill={C.morado} />
      <ellipse cx="210" cy="205" rx="76" ry="106" fill={C.lavanda} />
      <path d="M180 120c-26 18-40 50-36 86" fill="none" stroke={C.crema} strokeWidth="8" strokeLinecap="round" opacity="0.8" />
      <path d="M188 200c0-16 22-20 22-5 0-15 22-11 22 5 0 18-22 30-22 30s-22-12-22-30z" fill={C.rosa} />
      <rect x="196" y="325" width="28" height="30" rx="6" fill={C.morado} />
      <path d="M318 280c18-6 34 4 38 22-18 6-34-4-38-22z" fill={C.magenta} />
      <path d="M100 150c-4-18 8-32 26-34 4 18-8 32-26 34z" fill={C.rosa} />
    </>
  ),
  // Un sobre que guarda un relato con cuidado.
  mailbox: () => (
    <>
      <Backdrop />
      <rect x="95" y="130" width="230" height="160" rx="18" fill={C.lavanda} />
      <path d="M95 148l115 82 115-82" fill="none" stroke={C.morado} strokeWidth="8" strokeLinejoin="round" />
      <path d="M182 92c0-18 28-22 28-4 0-18 28-14 28 4 0 22-28 36-28 36s-28-14-28-36z" fill={C.rosa} />
      <circle cx="310" cy="285" r="34" fill={C.morado} />
      <path d="M295 285l11 11 20-22" fill="none" stroke={C.crema} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // Audífonos y ondas: «A Pausar el Filtro».
  podcast: () => (
    <>
      <Backdrop />
      <path d="M130 230v-30a80 80 0 0 1 160 0v30" fill="none" stroke={C.morado} strokeWidth="16" strokeLinecap="round" />
      <rect x="112" y="220" width="46" height="80" rx="20" fill={C.rosa} />
      <rect x="262" y="220" width="46" height="80" rx="20" fill={C.rosa} />
      <rect x="185" y="160" width="12" height="60" rx="6" fill={C.magenta} />
      <rect x="205" y="140" width="12" height="100" rx="6" fill={C.lavanda} />
      <rect x="225" y="170" width="12" height="40" rx="6" fill={C.magenta} />
    </>
  ),
};

export function SectionArt({ kind, className = 'section-art' }: { kind: ArtKind; className?: string }) {
  const Art = ART[kind];
  return (
    <svg className={className} viewBox="0 0 420 420" aria-hidden focusable="false">
      <Art />
    </svg>
  );
}
