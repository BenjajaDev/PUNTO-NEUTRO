import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button, FeedbackProvider, TextField, useFeedback } from '@/ui';

function ConfirmHarness({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const { confirm } = useFeedback();
  return <Button onClick={() => confirm({ title: '¿Eliminar nota?', tone: 'danger', confirmLabel: 'Eliminar', onConfirm })}>Borrar</Button>;
}

describe('Feedback', () => {
  it('si la acción confirmada falla, el error se muestra en el mismo diálogo', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackProvider>
        <ConfirmHarness onConfirm={() => Promise.reject(new Error('Sin conexión'))} />
      </FeedbackProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    expect(screen.getByText('¿Eliminar nota?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión'));
    expect(screen.getByText('¿Eliminar nota?')).toBeInTheDocument();
  });

  it('cancelar cierra el diálogo sin ejecutar la acción', async () => {
    const user = userEvent.setup();
    let called = false;
    render(
      <FeedbackProvider>
        <ConfirmHarness onConfirm={async () => { called = true; }} />
      </FeedbackProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(called).toBe(false);
    expect(screen.queryByText('¿Eliminar nota?')).not.toBeInTheDocument();
  });
});

describe('Campos', () => {
  it('el error queda asociado al input para lectores de pantalla', () => {
    render(<TextField label="Correo" error="Correo inválido." />);
    const input = screen.getByLabelText('Correo');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Correo inválido.');
  });

  it('un botón en carga se deshabilita y anuncia aria-busy', () => {
    render(<Button loading>Guardar</Button>);
    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
