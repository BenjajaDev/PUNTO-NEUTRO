import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SectionVisibilityField } from '@/admin/components/SectionVisibilityField';
import type { SiteSection } from '@/lib/types';
import { SectionGate } from '@/site/components/SectionGate';
import { SiteDataProvider } from '@/site/SiteDataProvider';
import { SiteLayout } from '@/site/SiteLayout';

const fetchMock = vi.fn();
const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

/** El sitio con la configuración que devolvería /api/site. */
function renderSite(path: string, disabledSections: SiteSection[]) {
  fetchMock.mockImplementation(async () => json({ siteName: 'Punto Neutro', siteTitle: 'Punto Neutro', disabledSections }));
  const router = createMemoryRouter(
    [
      {
        element: <SiteLayout />,
        children: [
          { index: true, element: <h1>Portada</h1> },
          { element: <SectionGate section="REFLECTIONS" />, children: [{ path: 'querer-encajar', element: <h1>Querer encajar</h1> }] },
          { element: <SectionGate section="GLOSSARY" />, children: [{ path: 'glosario', element: <h1>Glosario</h1> }] },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  return render(
    <SiteDataProvider>
      <RouterProvider router={router} />
    </SiteDataProvider>,
  );
}

describe('Secciones activables · sitio', () => {
  it('el menú, el menú móvil y el pie no enlazan secciones ocultas', async () => {
    renderSite('/', ['REFLECTIONS', 'MAILBOX']);
    const nav = await screen.findByRole('navigation', { name: 'Principal' });
    // Antes de cargar la configuración todo se muestra; se oculta al llegar.
    await waitFor(() => expect(within(nav).queryByRole('link', { name: 'Querer encajar' })).not.toBeInTheDocument());
    expect(within(nav).getByRole('link', { name: 'Glosario' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Querer encajar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Buzón comunitario|Comparte tu relato/ })).not.toBeInTheDocument();
  });

  it('un enlace directo a una sección oculta muestra el aviso, no la página', async () => {
    renderSite('/querer-encajar', ['REFLECTIONS']);
    expect(await screen.findByRole('heading', { name: 'Esta sección no está disponible por ahora', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Querer encajar', level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });

  it('una sección visible se muestra normal', async () => {
    renderSite('/glosario', ['REFLECTIONS']);
    expect(await screen.findByRole('heading', { name: 'Glosario', level: 1 })).toBeInTheDocument();
  });
});

describe('Secciones activables · panel', () => {
  function Harness({ initial }: { initial: SiteSection[] }) {
    const [value, setValue] = useState(initial);
    return (
      <>
        <SectionVisibilityField value={value} onChange={setValue} />
        <output data-testid="value">{value.join(',')}</output>
      </>
    );
  }

  it('cada interruptor oculta o muestra su sección, con el estado también en texto', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);
    const reflections = screen.getByRole('switch', { name: /Querer encajar/ });
    expect(reflections).toBeChecked();
    await user.click(reflections);
    expect(reflections).not.toBeChecked();
    expect(screen.getByTestId('value')).toHaveTextContent('REFLECTIONS');
    expect(screen.getByText('Oculta')).toBeInTheDocument();
  });

  it('apagar y volver a encender deja la lista en el orden del menú (sin cambios falsos)', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['PODCAST']} />);
    await user.click(screen.getByRole('switch', { name: /Nosotras/ }));
    expect(screen.getByTestId('value')).toHaveTextContent('ABOUT,PODCAST');
    await user.click(screen.getByRole('switch', { name: /Nosotras/ }));
    expect(screen.getByTestId('value')).toHaveTextContent(/^PODCAST$/);
  });
});
