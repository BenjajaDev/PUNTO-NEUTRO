import { createContext, useContext, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { SiteSettings } from '@/lib/types';
import { useResource } from '@/lib/useResource';

type SiteData = { settings: SiteSettings | null; loading: boolean; reload: () => void };

const SiteDataContext = createContext<SiteData>({ settings: null, loading: true, reload: () => {} });

/** Configuración institucional (nombre, logo, contacto, redes) disponible en todo el sitio. */
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const { data, loading, reload } = useResource((signal) => api<SiteSettings>('/site', { signal }), []);
  return <SiteDataContext.Provider value={{ settings: data, loading, reload }}>{children}</SiteDataContext.Provider>;
}

export const useSiteData = () => useContext(SiteDataContext);
