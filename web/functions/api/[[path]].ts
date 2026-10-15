/**
 * Cloudflare Pages Function: reenvía /api/* a la API (Express + Postgres)
 * alojada aparte. Así el navegador habla con un solo dominio: las cookies de
 * sesión del panel siguen siendo propias y no hace falta CORS.
 *
 * Variables del proyecto en Pages (Settings → Variables and Secrets):
 *   API_ORIGIN    URL pública de la API, ej. https://punto-neutro-api.onrender.com
 *   PROXY_SECRET  mismo valor que PROXY_SECRET en la API
 */
interface Env {
  API_ORIGIN: string;
  PROXY_SECRET?: string;
}

export const onRequest = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  if (!env.API_ORIGIN) {
    return Response.json({ error: 'Falta configurar API_ORIGIN en Cloudflare Pages.' }, { status: 500 });
  }
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, env.API_ORIGIN);

  const upstream = new Request(target.toString(), request);
  // IP real de la persona (la API la usa para limitar envíos al buzón y al login).
  upstream.headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') ?? '');
  upstream.headers.set('X-Forwarded-Proto', 'https');
  upstream.headers.set('X-Forwarded-Host', url.host);
  if (env.PROXY_SECRET) upstream.headers.set('X-Proxy-Secret', env.PROXY_SECRET);

  try {
    return await fetch(upstream, { redirect: 'manual' });
  } catch {
    return Response.json({ error: 'El servidor no responde en este momento. Intenta nuevamente en unos segundos.' }, { status: 502 });
  }
};
