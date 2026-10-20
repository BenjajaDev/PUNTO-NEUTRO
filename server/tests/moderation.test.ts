import { describe, expect, it } from 'vitest';
import { normalizeForModeration, screenSubmission } from '../src/lib/moderation.js';

describe('filtro del buzón', () => {
  it('normaliza tildes, mayúsculas y letras repetidas', () => {
    expect(normalizeForModeration('ESTÚPIDAAAA')).toBe('estupida');
  });

  it('detecta tono pasivo-agresivo', () => {
    expect(screenSubmission('Sin ánimo de ofender, es por tu bien').reasons).toContain('Posible tono pasivo-agresivo');
  });

  it('detecta señales de riesgo para priorizar contención', () => {
    const result = screenSubmission('A veces siento que no quiero seguir vivir así');
    expect(result.flagged).toBe(true);
    expect(screenSubmission('últimamente pienso en hacerme daño').reasons).toContain('Posible riesgo: requiere contención');
  });

  it('marca enlaces y mensajes en mayúsculas', () => {
    expect(screenSubmission('Mira esto https://spam.example').reasons).toContain('Contiene enlaces');
    expect(screenSubmission('ESTO ES UN MENSAJE ESCRITO COMPLETAMENTE EN MAYÚSCULAS PARA LLAMAR LA ATENCIÓN').reasons).toContain('Escrito mayormente en mayúsculas');
  });

  it('no marca palabras que solo contienen un término', () => {
    // «computadora» contiene «puta»: no debe marcarse.
    expect(screenSubmission('Me compré una computadora nueva para estudiar diseño.').flagged).toBe(false);
  });
});
