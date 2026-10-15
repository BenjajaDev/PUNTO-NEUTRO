import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useFeedback } from '@/ui';

/**
 * Evita perder trabajo: confirma antes de salir de un formulario con cambios
 * (navegación interna) y avisa el navegador si se cierra o recarga la pestaña.
 */
export function useUnsavedChanges(dirty: boolean) {
  const { confirm } = useFeedback();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirm({ title: '¿Salir sin guardar?', message: 'Tienes cambios sin guardar. Si sales ahora, se perderán.', tone: 'warning', confirmLabel: 'Salir sin guardar', cancelLabel: 'Seguir editando' }).then((leave) =>
      leave ? blocker.proceed() : blocker.reset(),
    );
  }, [blocker, confirm]);

  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);
}
