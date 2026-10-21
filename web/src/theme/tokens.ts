/**
 * Fuente única de color de Punto Neutro (paleta «Positive Feminism» de la
 * propuesta). `scripts/syncTokens.ts` genera las variables CSS y
 * `src/test/contrast.test.ts` verifica WCAG AA en ambos temas.
 *
 * Solo sintaxis borrable de TS: Node la ejecuta directo (type stripping).
 */

export const palette = {
  rosaSuave: '#F49A9C', // acento cálido: CTAs y detalles interactivos
  blancoCrema: '#EFE9D7', // fondo neutro
  lilaMedio: '#9169A4', // transición: secundarios, etiquetas, bordes sutiles
  moradoProfundo: '#7D4C97', // identidad central: encabezados, botones, navegación
  magentaSuave: '#B96EB2', // resaltado: enlaces, subtítulos, tarjetas destacadas
  lavandaClaro: '#D198C5', // fondos de sección, citas y testimonios
} as const;

export type ThemeColors = Record<string, string>;

const light: ThemeColors = {
  background: palette.blancoCrema,
  backgroundSoft: '#F5F1E4',
  surface: '#FBF8F0',
  surfaceRaised: '#FFFDF8',
  surfaceSunken: '#E6DEC8',
  border: '#DDD1BB',
  borderStrong: palette.lilaMedio,

  textPrimary: '#2B1D33',
  textSecondary: '#54435E',
  textMuted: '#685A70',
  heading: '#5E3474',

  primary: palette.moradoProfundo,
  primaryHover: '#6C3F85',
  onPrimary: '#FFFFFF',
  primarySoft: '#E9DDEC',
  secondary: palette.lilaMedio,
  accent: palette.rosaSuave,
  accentHover: '#EF8587',
  onAccent: '#2B1D33',
  accentSoft: '#FBE1DF',
  // Rosa salmón oscurecido: texto destacado sobre `accentSoft` (recursos de ayuda).
  accentText: '#9A3F45',
  highlight: palette.magentaSuave,
  link: '#8A3A84',
  section: '#EADCE2',
  quote: palette.lavandaClaro,
  onQuote: '#2B1D33',
  tag: '#E9DDEC',
  onTag: '#5E3474',

  success: '#2F7A57',
  onSuccess: '#FFFFFF',
  successSoft: '#DCEFE4',
  successText: '#225C41',
  danger: '#B3261E',
  onDanger: '#FFFFFF',
  dangerSoft: '#F8DEDB',
  dangerText: '#8C1D17',
  warning: '#B26A00',
  onWarning: '#FFFFFF',
  warningSoft: '#F7E7C8',
  warningText: '#7A4A00',
  info: '#3B5BA5',
  onInfo: '#FFFFFF',
  infoSoft: '#DFE6F5',
  infoText: '#2C4580',

  focusRing: '#A2569C',
  overlay: 'rgba(43, 29, 51, 0.45)',
  shadow: '#3A2246',
  skeletonBase: '#E6DEC8',
  skeletonHighlight: '#F3EEE1',
};

const dark: ThemeColors = {
  background: '#1A1220',
  backgroundSoft: '#201627',
  surface: '#251A2D',
  surfaceRaised: '#2E2137',
  surfaceSunken: '#150E1A',
  border: '#3D2D47',
  borderStrong: '#8C6A9E',

  textPrimary: '#F3EDDF',
  textSecondary: '#D3C7D8',
  textMuted: '#AE9FB5',
  heading: '#E8CDEF',

  primary: '#CDA4DE',
  primaryHover: '#D9B6E7',
  onPrimary: '#22152B',
  primarySoft: '#3A2847',
  secondary: '#B193C1',
  accent: palette.rosaSuave,
  accentHover: '#F7AEB0',
  onAccent: '#22152B',
  accentSoft: '#45272E',
  accentText: palette.rosaSuave,
  highlight: palette.lavandaClaro,
  link: '#EBB0E3',
  section: '#2A1D33',
  quote: '#3E2A48',
  onQuote: '#F3EDDF',
  tag: '#3A2847',
  onTag: '#E8CDEF',

  success: '#5FC293',
  onSuccess: '#0E2219',
  successSoft: '#17332A',
  successText: '#86D9B0',
  danger: '#F2867E',
  onDanger: '#2A0B09',
  dangerSoft: '#3D1B1A',
  dangerText: '#F7A8A2',
  warning: '#E9B25A',
  onWarning: '#2A1B03',
  warningSoft: '#3A2B12',
  warningText: '#F1C987',
  info: '#8EA8E8',
  onInfo: '#0F1A33',
  infoSoft: '#1C2A47',
  infoText: '#B3C6F1',

  focusRing: palette.lavandaClaro,
  overlay: 'rgba(8, 4, 12, 0.6)',
  shadow: '#000000',
  skeletonBase: '#2E2137',
  skeletonHighlight: '#3A2B44',
};

export const themes = { light, dark };

export const gradients = {
  light: {
    brand: `linear-gradient(135deg, ${palette.moradoProfundo} 0%, ${palette.magentaSuave} 100%)`,
    warm: `linear-gradient(135deg, ${palette.rosaSuave} 0%, ${palette.lavandaClaro} 100%)`,
    hero: `radial-gradient(120% 90% at 85% 10%, #EBD6E6 0%, ${palette.blancoCrema} 55%)`,
    section: `linear-gradient(180deg, #EADCE2 0%, ${palette.blancoCrema} 100%)`,
  },
  dark: {
    brand: 'linear-gradient(135deg, #CDA4DE 0%, #E7A9DF 100%)',
    warm: `linear-gradient(135deg, ${palette.rosaSuave} 0%, ${palette.lavandaClaro} 100%)`,
    hero: 'radial-gradient(120% 90% at 85% 10%, #33213D 0%, #1A1220 60%)',
    section: 'linear-gradient(180deg, #2A1D33 0%, #1A1220 100%)',
  },
};

/** Pares texto/fondo que deben cumplir contraste. [texto, fondo, mínimo] */
export const contrastPairs: [string, string, number][] = [
  ['textPrimary', 'background', 4.5],
  ['textPrimary', 'surface', 4.5],
  ['textSecondary', 'background', 4.5],
  ['textSecondary', 'surface', 4.5],
  ['textMuted', 'background', 4.5],
  ['textMuted', 'surfaceRaised', 4.5],
  ['heading', 'background', 4.5],
  ['heading', 'section', 4.5],
  ['primary', 'background', 4.5],
  ['onPrimary', 'primary', 4.5],
  ['onPrimary', 'primaryHover', 4.5],
  ['onAccent', 'accent', 4.5],
  ['onAccent', 'accentHover', 4.5],
  ['link', 'background', 4.5],
  ['link', 'surface', 4.5],
  ['onQuote', 'quote', 4.5],
  ['onTag', 'tag', 4.5],
  ['textPrimary', 'section', 4.5],
  ['successText', 'successSoft', 4.5],
  ['dangerText', 'dangerSoft', 4.5],
  ['warningText', 'warningSoft', 4.5],
  ['infoText', 'infoSoft', 4.5],
  ['accentText', 'accentSoft', 4.5],
  ['textPrimary', 'accentSoft', 4.5],
  ['onSuccess', 'success', 4.5],
  ['onDanger', 'danger', 4.5],
  ['onWarning', 'warning', 3],
  ['onInfo', 'info', 4.5],
  ['dangerText', 'background', 4.5],
  // Bordes de controles y anillo de foco: 3:1 (WCAG 1.4.11).
  ['borderStrong', 'surfaceRaised', 3],
  ['focusRing', 'background', 3],
];
