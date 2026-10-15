import { useCallback, useEffect, useState } from 'react';

// public/theme-init.js lee esta misma clave antes de pintar.
const KEY = 'pn-theme';
type Mode = 'light' | 'dark';

const systemMode = (): Mode => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

function readStored(): Mode | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function apply(stored: Mode | null) {
  if (stored) document.documentElement.dataset.theme = stored;
  else delete document.documentElement.dataset.theme;
}

/**
 * Tema claro/oscuro en dos estados: sigue al sistema por defecto y solo guarda
 * una preferencia cuando la persona elige lo contrario. Si vuelve a elegir lo
 * mismo que el sistema, se borra la preferencia y se vuelve a seguir al sistema.
 */
export function useTheme() {
  const [stored, setStored] = useState<Mode | null>(readStored);
  const [system, setSystem] = useState<Mode>(systemMode);
  const mode: Mode = stored ?? system;

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = () => setSystem(systemMode());
    media?.addEventListener('change', onChange);
    // Otra pestaña cambió el tema.
    const onStorage = (event: StorageEvent) => event.key === KEY && setStored(readStored());
    window.addEventListener('storage', onStorage);
    return () => {
      media?.removeEventListener('change', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => apply(stored), [stored]);

  const toggle = useCallback(() => {
    const target: Mode = mode === 'dark' ? 'light' : 'dark';
    const next = target === systemMode() ? null : target;
    try {
      if (next) localStorage.setItem(KEY, next);
      else localStorage.removeItem(KEY);
    } catch {
      /* sin almacenamiento: el cambio dura esta visita */
    }
    setStored(next);
  }, [mode]);

  return { mode, toggle };
}
