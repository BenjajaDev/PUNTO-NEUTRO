import { Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, ApiError, errorMessage } from '@/lib/api';
import type { SiteSettings } from '@/lib/types';
import { useSiteData } from '@/site/SiteDataProvider';
import { Badge, Button, ErrorState, PageHeader, SkeletonRows, TextArea, TextField, useFeedback } from '@/ui';
import { ImagePicker } from '../components/ImagePicker';
import { ListField } from '../components/ListField';
import { useUnsavedChanges } from '../components/useUnsavedChanges';

type Key = keyof SiteSettings;
type FieldDef = { key: Key; label: string; type?: 'textarea' | 'list' | 'image' | 'url' | 'email'; rows?: number; max?: number; hint?: string };

const SECTIONS: { id: string; title: string; description: string; fields: FieldDef[] }[] = [
  {
    id: 'identidad',
    title: 'Identidad',
    description: 'Nombre, bajada y logo que aparecen en la cabecera y el pie.',
    fields: [
      { key: 'siteName', label: 'Nombre del sitio *', max: 80 },
      { key: 'tagline', label: 'Bajada', max: 160 },
      { key: 'logoId', label: 'Logo', type: 'image', hint: 'Cuadrado, fondo transparente (PNG o WEBP). Sin logo se usa la marca por defecto.' },
    ],
  },
  {
    id: 'inicio',
    title: 'Inicio',
    description: 'Portada: qué es Punto Neutro, objetivo, misión y visión.',
    fields: [
      { key: 'heroTitle', label: 'Título principal', max: 160 },
      { key: 'heroSubtitle', label: 'Texto bajo el título', type: 'textarea', rows: 2, max: 400 },
      { key: 'whatIs', label: '¿Qué es Punto Neutro?', type: 'textarea', rows: 4, max: 3000 },
      { key: 'objective', label: 'Objetivo de la página', type: 'textarea', rows: 3, max: 2000 },
      { key: 'mission', label: 'Misión', type: 'textarea', rows: 3, max: 2000 },
      { key: 'vision', label: 'Visión', type: 'textarea', rows: 3, max: 2000 },
    ],
  },
  {
    id: 'nosotras',
    title: 'Nosotras',
    description: 'Presentación del equipo y línea editorial (las integrantes se editan en «Equipo»).',
    fields: [
      { key: 'aboutIntro', label: 'Quiénes somos', type: 'textarea', rows: 3, max: 3000 },
      { key: 'editorialLine', label: 'Línea editorial y enfoque', type: 'textarea', rows: 3, max: 3000 },
      { key: 'editorialPillars', label: 'Pilares editoriales', type: 'list' },
    ],
  },
  {
    id: 'buzon',
    title: 'Buzón comunitario',
    description: 'Textos del formulario y del consentimiento informado.',
    fields: [
      { key: 'mailboxIntro', label: 'Presentación del buzón', type: 'textarea', rows: 3, max: 2000 },
      { key: 'consentText', label: 'Texto de consentimiento informado', type: 'textarea', rows: 4, max: 3000 },
    ],
  },
  {
    id: 'podcast',
    title: 'Podcast',
    description: 'Nombre, descripción y perfil de SoundCloud.',
    fields: [
      { key: 'podcastName', label: 'Nombre del podcast *', max: 120 },
      { key: 'soundcloudProfile', label: 'Perfil en SoundCloud', type: 'url', hint: 'https://soundcloud.com/…' },
      { key: 'podcastDescription', label: 'Descripción', type: 'textarea', rows: 3, max: 2000 },
    ],
  },
  {
    id: 'contacto',
    title: 'Contacto y redes',
    description: 'Datos del banner de cierre y del pie de página. Los campos vacíos no se muestran.',
    fields: [
      { key: 'contactEmail', label: 'Correo oficial', type: 'email' },
      { key: 'contactPhone', label: 'Teléfono', max: 40 },
      { key: 'whatsappNumber', label: 'WhatsApp', hint: 'Con código de país, ej. +56 9 1234 5678.' },
      { key: 'instagramUrl', label: 'Instagram', type: 'url' },
      { key: 'facebookUrl', label: 'Facebook', type: 'url' },
      { key: 'tiktokUrl', label: 'TikTok', type: 'url' },
      { key: 'closingTitle', label: 'Título del banner de cierre', max: 160 },
      { key: 'closingText', label: 'Texto del banner de cierre', type: 'textarea', rows: 2, max: 600 },
    ],
  },
  {
    id: 'legal',
    title: 'Créditos y avisos legales',
    description: 'Mención académica y política de privacidad del buzón.',
    fields: [
      { key: 'creditsText', label: 'Créditos', type: 'textarea', rows: 2, max: 600 },
      { key: 'privacyPolicy', label: 'Política de privacidad', type: 'textarea', rows: 14, max: 12000, hint: 'Las líneas que empiezan con «1. », «2. »… se muestran como subtítulos.' },
    ],
  },
];

const EDITABLE: Key[] = SECTIONS.flatMap((s) => s.fields.map((f) => f.key));
const pick = (s: SiteSettings) => Object.fromEntries(EDITABLE.map((k) => [k, s[k]]));

export function SettingsAdmin() {
  const { confirm, notify, runBlocking } = useFeedback();
  const site = useSiteData();
  const [original, setOriginal] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = () => {
    setError(null);
    api<SiteSettings>('/admin/settings')
      .then((s) => {
        setOriginal(s);
        setForm(s);
      })
      .catch((e) => setError(errorMessage(e)));
  };
  useEffect(load, []);

  const dirty = useMemo(() => Boolean(form && original && JSON.stringify(pick(form)) !== JSON.stringify(pick(original))), [form, original]);
  useUnsavedChanges(dirty);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!form) return <SkeletonRows rows={6} label="Cargando configuración" />;

  const set = (key: Key, value: unknown) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const save = async () => {
    const ok = await confirm({ title: '¿Publicar los cambios?', message: 'Los textos y datos de contacto se actualizarán de inmediato en el sitio.', tone: 'brand', icon: Save, confirmLabel: 'Guardar y publicar' });
    if (!ok) return;
    try {
      const saved = await runBlocking('Guardando…', () => api<SiteSettings>('/admin/settings', { method: 'PUT', body: pick(form) }));
      setOriginal(saved);
      setForm(saved);
      setErrors({});
      site.reload();
      notify({ tone: 'success', message: 'Configuración publicada.' });
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      notify({ tone: 'danger', title: 'No se pudo guardar', message: errorMessage(e) });
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    }
  };

  return (
    <>
      <PageHeader
        title="Configuración del sitio"
        subtitle="Textos institucionales, logo, contacto y avisos legales."
        actions={
          <>
            {dirty ? <Badge tone="accent">Cambios sin guardar</Badge> : null}
            <Button icon={Save} onClick={save} disabled={!dirty}>Guardar y publicar</Button>
          </>
        }
      />
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Secciones de la configuración">
          {SECTIONS.map((s) => <a key={s.id} href={`#cfg-${s.id}`}>{s.title}</a>)}
        </nav>
        <div className="stack-lg">
          {SECTIONS.map((section) => (
            <section key={section.id} id={`cfg-${section.id}`} className="card stack" aria-labelledby={`cfg-${section.id}-t`}>
              <div>
                <h2 id={`cfg-${section.id}-t`} style={{ fontSize: 20 }}>{section.title}</h2>
                <p className="text-secondary text-small">{section.description}</p>
              </div>
              <div className="form-grid">
                {section.fields.map((f) => {
                  const value = form[f.key];
                  const full = f.type === 'textarea' || f.type === 'list' ? { gridColumn: '1 / -1' } : undefined;
                  if (f.type === 'image') return <div key={f.key}><ImagePicker label={f.label} hint={f.hint} value={value as number | null} onChange={(v) => set(f.key, v)} /></div>;
                  if (f.type === 'list') return <div key={f.key} style={full}><ListField label={f.label} value={value as string[]} max={8} onChange={(v) => set(f.key, v)} error={errors[f.key]} /></div>;
                  if (f.type === 'textarea') return <div key={f.key} style={full}><TextArea label={f.label} hint={f.hint} rows={f.rows} maxLength={f.max} showCount value={value as string} onChange={(e) => set(f.key, e.target.value)} error={errors[f.key]} /></div>;
                  return (
                    <div key={f.key}>
                      <TextField label={f.label} hint={f.hint} type={f.type === 'url' ? 'url' : f.type === 'email' ? 'email' : 'text'} maxLength={f.max} value={value as string} onChange={(e) => set(f.key, e.target.value)} error={errors[f.key]} />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
