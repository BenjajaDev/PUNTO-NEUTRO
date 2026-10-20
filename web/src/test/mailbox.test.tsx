import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Prose } from '@/site/components/Common';
import { MailboxPage } from '@/site/pages/MailboxPage';
import { FeedbackProvider } from '@/ui';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const renderMailbox = () =>
  render(
    <MemoryRouter>
      <FeedbackProvider>
        <MailboxPage />
      </FeedbackProvider>
    </MemoryRouter>,
  );

const posts = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');

describe('Buzón · RF-01 tema «Otros»', () => {
  it('muestra el campo de tema propio solo al elegir «Otros»', async () => {
    const user = userEvent.setup();
    renderMailbox();
    expect(screen.queryByLabelText(/¿De qué tema se trata\?/)).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Tema (opcional)'), 'Otros');
    expect(screen.getByLabelText(/¿De qué tema se trata\?/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Tema (opcional)'), 'Alimentación');
    expect(screen.queryByLabelText(/¿De qué tema se trata\?/)).not.toBeInTheDocument();
  });

  it('no envía si «Otros» está elegido y el tema está vacío', async () => {
    const user = userEvent.setup();
    renderMailbox();
    await user.selectOptions(screen.getByLabelText('Tema (opcional)'), 'Otros');
    await user.type(screen.getByRole('textbox', { name: 'Tu relato' }), 'Un relato con más de treinta caracteres para la prueba.');
    await user.click(screen.getByLabelText(/Leí y acepto las normas/));
    await user.click(screen.getByLabelText(/Acepto que mi relato|Leí la/));
    await user.click(screen.getByRole('button', { name: 'Enviar relato' }));
    expect(await screen.findByText(/Cuéntanos de qué tema se trata/)).toBeInTheDocument();
    expect(posts()).toHaveLength(0);
  });
});

describe('Buzón · RF-02 normas de convivencia', () => {
  it('muestra las normas y exige aceptarlas antes de enviar', async () => {
    const user = userEvent.setup();
    renderMailbox();
    expect(screen.getByRole('heading', { name: /Normas de convivencia/ })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Tu relato' }), 'Un relato con más de treinta caracteres para la prueba.');
    await user.click(screen.getByLabelText(/Acepto que mi relato|Leí la/));
    await user.click(screen.getByRole('button', { name: 'Enviar relato' }));
    expect(await screen.findByText('Para enviar, acepta las normas de convivencia.')).toBeInTheDocument();
    expect(posts()).toHaveLength(0);
  });
});

describe('Prose', () => {
  it('convierte «## » en subtítulos y «- » en listas', () => {
    render(<Prose text={'Intro\n\n## Señales\n- Una\n- Dos\n\nCierre'} />);
    expect(screen.getByRole('heading', { name: 'Señales' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Cierre')).toBeInTheDocument();
  });
});
