import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './api';

/** Carga asíncrona con estados explícitos (loading / error / data) y recarga. */
export function useResource<T>(loader: (signal: AbortSignal) => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setLoading(true);
    setError(null);
    try {
      const value = await loader(current.signal);
      if (!current.signal.aborted) setData(value);
    } catch (err) {
      if (!current.signal.aborted) setError(errorMessage(err));
    } finally {
      if (!current.signal.aborted) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
    return () => controller.current?.abort();
  }, [reload]);

  return { data, setData, loading, error, reload };
}
