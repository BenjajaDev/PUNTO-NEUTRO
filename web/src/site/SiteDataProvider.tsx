import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { SiteSettings } from '@/lib/types';
import { useResource } from '@/lib/useResource';

type SiteData = { settings: SiteSettings | null; loading: boolean; reload: () => void };

const SiteDataContext = createContext<SiteData>({ settings: null, loading: true, reload: () => {} });

function setMeta(name: string, content: string) {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

/** Configuración institucional (nombre, logo, contacto, redes) disponible en todo el sitio. */
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const { data, loading, reload } = useResource((signal) => api<SiteSettings>('/site', { signal }), []);

  // Favicon y descripción editables en el panel. El ?v= evita que el navegador
  // muestre el favicon anterior en caché después de cambiarlo.
  useEffect(() => {
    if (!data) return;
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon) icon.href = `/api/favicon?v=${data.faviconId ?? 0}`;
    if (data.metaDescription) setMeta('description', data.metaDescription);
  }, [data]);

  return <SiteDataContext.Provider value={{ settings: data, loading, reload }}>{children}</SiteDataContext.Provider>;
}

export const useSiteData = () => useContext(SiteDataContext);

/**
 * Título de la pestaña: «Glosario · Punto Neutro…» en cada página y solo el
 * título del sitio en la portada. El título base se edita en el panel.
 */
export function usePageTitle(page?: string | null) {
  const { settings } = useSiteData();
  const base = settings?.siteTitle || settings?.siteName || 'Punto Neutro';
  useEffect(() => {
    document.title = page ? `${page} · ${base}` : base;
  }, [page, base]);
}
