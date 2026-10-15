/** Error de la API con mensajes por campo (para mostrarlos junto a cada input). */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown; signal?: AbortSignal };

/**
 * Cliente único de la API. Agrega la cabecera anti-CSRF que exige el panel y
 * convierte los errores en ApiError con texto en español.
 */
export async function api<T>(path: string, { method = 'GET', body, signal }: Options = {}): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'punto-neutro',
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.', 0);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error || 'Ocurrió un error inesperado.', res.status, data?.fields || {});
  }
  return data as T;
}

export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));
