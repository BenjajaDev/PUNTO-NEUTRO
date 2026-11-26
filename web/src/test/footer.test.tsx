import { render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SiteSettings } from '@/lib/types';
import { SiteDataProvider } from '@/site/SiteDataProvider';
import { SiteLayout } from '@/site/SiteLayout';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function renderFooter(settings: Partial<SiteSettings>) {
  const body = JSON.stringify({ siteName: 'Punto Neutro', siteTitle: 'Punto Neutro', disabledSections: [], ...settings });
  fetchMock.mockImplementation(async () => new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
  const router = createMemoryRouter([{ element: <SiteLayout />, children: [{ index: true, element: <h1>Portada</h1> }] }]);
  render(
    <SiteDataProvider>
      <RouterProvider router={router} />
    </SiteDataProvider>,
  );
}

describe('Pie de página · redes sociales', () => {
  it('muestra X cuando tiene enlace, en otra pestaña y con aviso para lectores de pantalla', async () => {
    renderFooter({ xUrl: 'https://x.com/puntoneutro', instagramUrl: 'https://instagram.com/puntoneutro' });
    const socials = await screen.findByRole('list', { name: 'Redes sociales' });
    const x = within(socials).getByRole('link', { name: 'X (se abre en otra pestaña)' });
    expect(x).toHaveAttribute('href', 'https://x.com/puntoneutro');
    expect(x).toHaveAttribute('target', '_blank');
    expect(x).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('sin enlace no aparece', async () => {
    renderFooter({ xUrl: '', instagramUrl: 'https://instagram.com/puntoneutro' });
    const socials = await screen.findByRole('list', { name: 'Redes sociales' });
    await waitFor(() => expect(within(socials).getByRole('link', { name: /Instagram/ })).toBeInTheDocument());
    expect(within(socials).queryByRole('link', { name: /^X / })).not.toBeInTheDocument();
  });
});
