/**
 * Filtro automático del Buzón Comunitario (RF-02).
 *
 * No rechaza nada: solo MARCA relatos para que el equipo los revise primero.
 * Rechazar automáticamente silenciaría justo a quien cuenta lo que le dijeron
 * («me decían gorda»), que es el corazón del buzón. La decisión siempre es humana.
 */

export const FLAG_REASONS = {
  offensive: 'Insultos o lenguaje ofensivo (puede ser una cita)',
  passiveAggressive: 'Posible tono pasivo-agresivo',
  risk: 'Posible riesgo: requiere contención',
  links: 'Contiene enlaces',
  shouting: 'Escrito mayormente en mayúsculas',
} as const;

type Rule = { reason: keyof typeof FLAG_REASONS; patterns: RegExp[] };

// Se comparan sobre texto normalizado (minúsculas, sin tildes, sin letras repetidas).
const RULES: Rule[] = [
  {
    reason: 'offensive',
    patterns: [
      /\b(idiotas?|imbeciles?|estupid[oa]s?|tarad[oa]s?|asqueros[oa]s?|ridicul[oa]s?)\b/,
      /\b(maraca|put[oa]s?|perra|zorra|culia[oa]?s?|aweonad[oa]s?|conchetumare|ctm|csm|qlia[oa]?|qliao)\b/,
      /\b(cerdas?|vacas?|ballenas?|focas?)\b/,
      /\b(das asco|me das asco|dan asco)\b/,
    ],
  },
  {
    reason: 'passiveAggressive',
    patterns: [
      /\bno es por ofender\b/,
      /\bsin (animo de )?ofender\b/,
      /\bcon todo respeto\b/,
      /\bsolo (lo )?digo\b/,
      /\bes por tu (bien|salud)\b/,
      /\bte lo digo por tu (bien|salud)\b/,
      /\bdeberias (bajar de peso|adelgazar|cuidarte mas|hacer ejercicio)\b/,
      /\b(ofendidit[oa]s?|exagerad[oa]s?|victimizar(se)?|llorones?|lloronas?|feminazis?)\b/,
      /\btodo (les|te) ofende\b/,
      /\bdate cuenta\b/,
    ],
  },
  {
    reason: 'risk',
    patterns: [
      /\b(quiero|quisiera|me quiero) morir\b/,
      /\bmatarme\b/,
      /\bsuicid/,
      /\bno quiero (seguir )?vivir\b/,
      /\b(hacerme|me hago) dano\b/,
      /\b(cortarme|me corto|autolesion)/,
      /\b(vomitar|vomito|vomite) (despues de comer|todo lo que como|para no engordar)\b/,
      /\b(dejar de comer|deje de comer|no he comido en)\b/,
    ],
  },
];

/** minúsculas, sin tildes y sin letras repetidas («tontaaaa» → «tonta»). */
export function normalizeForModeration(text: string) {
  return text
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/(\p{L})\1{2,}/gu, '$1');
}

export type ModerationResult = { flagged: boolean; reasons: string[]; matches: string[] };

export function screenSubmission(text: string): ModerationResult {
  const normalized = normalizeForModeration(text);
  const reasons = new Set<string>();
  const matches = new Set<string>();

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      const found = normalized.match(new RegExp(pattern.source, 'g'));
      if (found) {
        reasons.add(FLAG_REASONS[rule.reason]);
        found.forEach((m) => matches.add(m.trim()));
      }
    }
  }

  if (/https?:\/\/|www\.\S+/i.test(text)) reasons.add(FLAG_REASONS.links);

  const letters = text.replace(/[^\p{L}]/gu, '');
  const upper = letters.replace(/[^\p{Lu}]/gu, '');
  if (letters.length >= 40 && upper.length / letters.length > 0.7) reasons.add(FLAG_REASONS.shouting);

  return { flagged: reasons.size > 0, reasons: [...reasons], matches: [...matches].slice(0, 20) };
}
