import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/theme/contrast';
import { contrastPairs, themes } from '@/theme/tokens';

describe('Contraste WCAG AA de la paleta', () => {
  for (const mode of ['light', 'dark'] as const) {
    it(`tema ${mode === 'light' ? 'claro' : 'oscuro'}: todos los pares cumplen`, () => {
      const failures = contrastPairs
        .map(([fg, bg, min]) => ({ pair: `${fg} / ${bg}`, ratio: contrastRatio(themes[mode][fg], themes[mode][bg]), min }))
        .filter(({ ratio, min }) => ratio < min);
      expect(failures).toEqual([]);
    });
  }

  it('ambos temas definen exactamente los mismos colores', () => {
    expect(Object.keys(themes.dark).sort()).toEqual(Object.keys(themes.light).sort());
  });
});
