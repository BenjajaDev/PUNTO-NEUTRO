import { describe, expect, it } from 'vitest';
import { normalizeSoundcloudUrl } from '../src/lib/soundcloud.js';
import { normalizeTags } from '../src/lib/tags.js';

describe('enlaces de SoundCloud', () => {
  const ok = (input: string) => normalizeSoundcloudUrl(input);

  it('deja la forma canónica: https, sin www/m y sin rastreo', () => {
    expect(ok('https://soundcloud.com/punto-neutro/episodio-1')).toEqual({ ok: true, url: 'https://soundcloud.com/punto-neutro/episodio-1' });
    expect(ok('  http://www.soundcloud.com/punto-neutro/episodio-1/?si=abc123&utm_source=clipboard#t=0:30 ')).toEqual({
      ok: true,
      url: 'https://soundcloud.com/punto-neutro/episodio-1',
    });
    expect(ok('https://m.soundcloud.com/punto-neutro/sets/temporada-1')).toEqual({ ok: true, url: 'https://soundcloud.com/punto-neutro/sets/temporada-1' });
  });

  it('acepta enlaces cortos de la app', () => {
    expect(ok('https://on.soundcloud.com/AbC123xyz?si=1')).toEqual({ ok: true, url: 'https://on.soundcloud.com/AbC123xyz' });
  });

  it('rechaza otros sitios, perfiles, el código para insertar y textos que no son enlaces', () => {
    for (const bad of ['https://youtube.com/watch?v=1', 'https://soundcloud.com/punto-neutro', 'https://w.soundcloud.com/player/?url=x', 'https://api.soundcloud.com/tracks/1', 'soundcloud punto neutro', 'https://soundcloud.com.evil.example/a/b', 'javascript:alert(1)']) {
      expect(ok(bad).ok, bad).toBe(false);
    }
  });
});

describe('palabras clave', () => {
  it('limpia, quita «#» y elimina duplicados sin importar mayúsculas ni tildes', () => {
    expect(normalizeTags(['  Salud   mental ', '#Filtros', 'salud mental', 'Salúd Mental', '', 'Autoestima'])).toEqual(['Salud mental', 'Filtros', 'Autoestima']);
  });
});
