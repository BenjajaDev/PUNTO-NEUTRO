import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InterviewCategoryPicker } from '@/admin/components/InterviewCategoryPicker';
import { InterviewQuestionsField, SUGGESTED_QUESTIONS } from '@/admin/components/InterviewQuestionsField';
import { normalizeSoundcloudUrl, normalizeTags } from '@/lib/soundcloud';
import type { InterviewCategory, InterviewQuestion, InterviewSummary, PodcastEpisode } from '@/lib/types';
import { PodcastCard } from '@/site/components/PodcastCard';
import { InterviewsPage } from '@/site/pages/InterviewsPage';
import { PodcastPage } from '@/site/pages/PodcastPage';
import { FeedbackProvider, Tabs } from '@/ui';

const fetchMock = vi.fn();
const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

/** Muestra la URL actual para comprobar que el filtro vive en ella. */
function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
}

const interview = (id: number, category: InterviewCategory, guestName: string): InterviewSummary => ({
  id,
  slug: `entrevista-${id}`,
  category,
  guestName,
  guestHandle: '',
  guestBio: '',
  photoId: null,
  intro: '',
  firstQuestion: `Pregunta de ${guestName}`,
  questionCount: 3,
  status: 'PUBLISHED',
  publishedAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
});

const episode = (id: number, title: string, tags: string[]): PodcastEpisode => ({
  id,
  number: id,
  title,
  summary: 'Una conversación sobre cuerpos, redes sociales y cuidado.',
  tags,
  coverId: null,
  guests: '',
  soundcloudUrl: `https://soundcloud.com/apausarelfiltro/episodio-${id}`,
  durationMin: 30,
  published: true,
  publishedAt: '2026-10-01T12:00:00.000Z',
});

describe('Tabs', () => {
  function Harness() {
    const [value, setValue] = useState<'a' | 'b' | 'c'>('a');
    return <Tabs idPrefix="t" label="Secciones" value={value} onChange={setValue} tabs={[{ key: 'a', label: 'Uno' }, { key: 'b', label: 'Dos', count: 3 }, { key: 'c', label: 'Tres' }]} />;
  }

  it('solo la pestaña activa entra en el orden de Tab y las flechas cambian la selección', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const [uno, dos, tres] = screen.getAllByRole('tab');
    expect(uno).toHaveAttribute('aria-selected', 'true');
    expect(dos).toHaveAttribute('tabindex', '-1');
    await user.tab();
    expect(uno).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(dos).toHaveFocus();
    expect(dos).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{End}');
    expect(tres).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(uno).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Entrevistas por categoría', () => {
  const data = [interview(1, 'EXPERTAS', 'Dra. Paz'), interview(2, 'INFLUENCERS', 'Camila'), interview(3, 'PERSONAS_COMUNES', 'Josefa')];

  const renderPage = (url = '/entrevistas') =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <InterviewsPage />
        <LocationProbe />
      </MemoryRouter>,
    );

  it('«Todas» agrupa las entrevistas por sección y una pestaña filtra y queda en la URL', async () => {
    fetchMock.mockResolvedValue(json(data));
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Expertas', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Personas comunes', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Todas/ })).toHaveTextContent('3');

    await user.click(screen.getByRole('tab', { name: /Expertas/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('?categoria=expertas');
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByText('Dra. Paz')).toBeInTheDocument();
    expect(within(panel).queryByText('Camila')).not.toBeInTheDocument();
  });

  it('abre directo en la categoría que indica la URL', async () => {
    fetchMock.mockResolvedValue(json(data));
    renderPage('/entrevistas?categoria=personas-comunes');
    expect(await screen.findByText('Josefa')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Personas comunes/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('Dra. Paz')).not.toBeInTheDocument();
  });
});

describe('Tarjeta de podcast', () => {
  it('enlaza a SoundCloud en otra pestaña y carga el reproductor solo al pedirlo', async () => {
    const user = userEvent.setup();
    const ep = episode(1, 'Filtros y autoestima', ['Salud mental']);
    render(<PodcastCard episode={ep} />);
    const link = screen.getByRole('link', { name: /Escuchar «Filtros y autoestima» en SoundCloud/ });
    expect(link).toHaveAttribute('href', ep.soundcloudUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(document.querySelector('iframe')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Escuchar aquí' }));
    expect(screen.getByRole('button', { name: 'Cerrar reproductor' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('iframe')).not.toBeNull();
  });

  it('en la vista previa del panel no hay enlaces ni reproductor', () => {
    render(<PodcastCard episode={episode(1, '', [])} preview />);
    expect(screen.getByText('Título del episodio')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('Página de podcast', () => {
  it('filtra por palabra clave sin distinguir mayúsculas ni tildes, y el filtro queda en la URL', async () => {
    const episodes = [episode(1, 'Filtros y autoestima', ['Salud mental']), episode(2, 'Comer en paz', ['Alimentación', 'salud mental']), episode(3, 'Moda y cuerpo', ['Moda'])];
    fetchMock.mockImplementation(() => Promise.resolve(json(episodes)));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/podcast']}>
        <PodcastPage />
        <LocationProbe />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Moda y cuerpo' })).toBeInTheDocument();
    const filters = screen.getByRole('group', { name: 'Filtrar por tema' });
    // «Salud mental» y «salud mental» son la misma palabra clave: un solo chip con 2 episodios.
    await user.click(within(filters).getByRole('button', { name: /#Salud mental/ }));
    expect(within(filters).getByRole('button', { name: /#Salud mental/ })).toHaveTextContent('2');
    expect(screen.getByTestId('location')).toHaveTextContent('tema=Salud');
    expect(screen.queryByRole('heading', { name: 'Moda y cuerpo' })).not.toBeInTheDocument();
    expect(screen.getByText(/2 episodios sobre «Salud mental»/)).toBeInTheDocument();
  });
});

describe('Selector de categoría (panel)', () => {
  it('es un grupo de radios accesible y muestra el error', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InterviewCategoryPicker value="" onChange={onChange} error="Elige la categoría de la entrevista." />);
    expect(screen.getByRole('group', { name: 'Categoría *' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Elige la categoría');
    await user.click(screen.getByRole('radio', { name: /Influencers/ }));
    expect(onChange).toHaveBeenCalledWith('INFLUENCERS');
  });
});

describe('Preguntas de la entrevista (panel)', () => {
  function Harness({ category = 'EXPERTAS', initial = [] }: { category?: InterviewCategory | ''; initial?: InterviewQuestion[] }) {
    const [value, setValue] = useState<InterviewQuestion[]>(initial);
    return (
      <FeedbackProvider>
        <InterviewQuestionsField value={value} onChange={setValue} category={category} errors={{}} />
        <output data-testid="value">{JSON.stringify(value)}</output>
      </FeedbackProvider>
    );
  }
  const current = () => JSON.parse(screen.getByTestId('value').textContent || '[]') as InterviewQuestion[];

  it('empieza sin preguntas: las sugeridas no se escriben solas', () => {
    render(<Harness />);
    expect(current()).toEqual([]);
    expect(screen.getByText(/Aún no hay preguntas/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('el botón agrega preguntas en blanco todas las veces que se presione', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Agregar pregunta' }));
    expect(current()).toHaveLength(4);
    await waitFor(() => expect(screen.getByLabelText('Pregunta 4 *')).toHaveFocus());
    await user.type(screen.getByLabelText('Pregunta 4 *'), '¿Una pregunta propia?');
    expect(current()[3]).toEqual({ question: '¿Una pregunta propia?', answer: '' });
  });

  it('una sugerencia se agrega al hacer clic y se puede agregar varias veces', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const suggestion = SUGGESTED_QUESTIONS.EXPERTAS[0];
    const chip = () => screen.getByRole('button', { name: new RegExp(suggestion.slice(1, 30)) });
    await user.click(chip());
    await waitFor(() => expect(screen.getByLabelText('Respuesta 1')).toHaveFocus());
    expect(chip()).toHaveTextContent('Agregada');
    await user.click(chip());
    expect(chip()).toHaveTextContent('Agregada 2 veces');
    expect(current()).toEqual([
      { question: suggestion, answer: '' },
      { question: suggestion, answer: '' },
    ]);
  });

  it('sin categoría pide elegirla para mostrar sugerencias', () => {
    render(<Harness category="" />);
    expect(screen.getByText(/Elige la categoría de la entrevista para ver preguntas de ejemplo/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar pregunta' })).toBeEnabled();
  });

  it('reordena y quita preguntas; si tiene respuesta, pide confirmación', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ question: '¿Primera?', answer: '' }, { question: '¿Segunda?', answer: 'Ya respondida.' }]} />);
    await user.click(screen.getByRole('button', { name: 'Subir la pregunta 2' }));
    expect(current().map((q) => q.question)).toEqual(['¿Segunda?', '¿Primera?']);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bajar la pregunta 1' })).toHaveFocus());

    await user.click(screen.getByRole('button', { name: 'Quitar la pregunta 1' }));
    expect(await screen.findByText('¿Quitar la pregunta 1?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quitar pregunta' }));
    expect(current().map((q) => q.question)).toEqual(['¿Primera?']);

    // Sin respuesta, se quita de inmediato.
    await user.click(screen.getByRole('button', { name: 'Quitar la pregunta 1' }));
    expect(current()).toEqual([]);
  });
});

describe('Validación compartida con la API', () => {
  it('limpia los enlaces de SoundCloud y rechaza otros sitios', () => {
    expect(normalizeSoundcloudUrl('https://m.soundcloud.com/apausarelfiltro/ep-1?si=abc#t=1')).toEqual({ ok: true, url: 'https://soundcloud.com/apausarelfiltro/ep-1' });
    expect(normalizeSoundcloudUrl('https://youtube.com/watch?v=1').ok).toBe(false);
  });

  it('las palabras clave repetidas con otra escritura se guardan una vez', () => {
    expect(normalizeTags(['#Salud mental', 'salud  mental', 'Alimentación', 'alimentacion'])).toEqual(['Salud mental', 'Alimentación']);
  });
});
