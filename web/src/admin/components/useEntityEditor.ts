import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, errorMessage } from '@/lib/api';
import { useFeedback } from '@/ui';
import { useUnsavedChanges } from './useUnsavedChanges';

/**
 * Estado de un editor de página completa (notas, entrevistas): carga,
 * cambios sin guardar, errores por campo y guardado como borrador/publicado.
 */
export function useEntityEditor<T extends { id?: number; status?: string }>({ endpoint, id, empty, listPath, editable }: { endpoint: string; id: string; empty: T; listPath: string; editable: (keyof T)[] }) {
  const isNew = id === 'nuevo';
  const navigate = useNavigate();
  const { notify, runBlocking } = useFeedback();
  const [original, setOriginal] = useState<T | null>(isNew ? empty : null);
  const [form, setForm] = useState<T>(empty);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isNew) {
      setOriginal(empty);
      setForm(empty);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    api<T>(`${endpoint}/${id}`, { signal: controller.signal })
      .then((data) => {
        setOriginal(data);
        setForm(data);
      })
      .catch((error) => !controller.signal.aborted && setLoadError(errorMessage(error)))
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, id, isNew]);

  const pick = useCallback((source: T) => Object.fromEntries(editable.map((k) => [k, source[k]])), [editable]);
  const dirty = useMemo(() => original !== null && JSON.stringify(pick(form)) !== JSON.stringify(pick(original)), [form, original, pick]);
  useUnsavedChanges(dirty);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key as string] ? { ...prev, [key as string]: '' } : prev));
  }, []);

  const save = useCallback(
    async (status: string, successMessage: string) => {
      const body = { ...pick(form), status };
      try {
        const saved = await runBlocking(status === 'PUBLISHED' ? 'Publicando…' : 'Guardando…', () =>
          api<T>(isNew ? endpoint : `${endpoint}/${id}`, { method: isNew ? 'POST' : 'PUT', body }),
        );
        setOriginal(saved);
        setForm(saved);
        setErrors({});
        notify({ tone: 'success', message: successMessage });
        if (isNew) navigate(`${listPath}/${saved.id}`, { replace: true });
        return true;
      } catch (error) {
        if (error instanceof ApiError) setErrors(error.fields);
        notify({ tone: 'danger', title: 'No se pudo guardar', message: errorMessage(error) });
        requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
        return false;
      }
    },
    [endpoint, form, id, isNew, listPath, navigate, notify, pick, runBlocking],
  );

  return { isNew, form, set, errors, loading, loadError, dirty, save, original };
}
