import { EyeOff, FileCheck2, HandHeart, HeartHandshake, Quote, Send, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError, errorMessage } from '@/lib/api';
import { AGE_RANGES, OTHER_TOPIC, TOPICS, type PublicStory } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { Button, Checkbox, SelectField, Switch, TextArea, TextField, useFeedback } from '@/ui';
import { PageHero } from '../components/Common';
import { usePageTitle, useSiteData } from '../SiteDataProvider';


type Form = {
  anonymous: boolean;
  alias: string;
  contactEmail: string;
  ageRange: string;
  topic: string;
  topicOther: string;
  story: string;
  allowPublication: boolean;
  consent: boolean;
  acceptRules: boolean;
  website: string;
};

const EMPTY: Form = { anonymous: true, alias: '', contactEmail: '', ageRange: '', topic: '', topicOther: '', story: '', allowPublication: false, consent: false, acceptRules: false, website: '' };
const MIN_STORY = 30;
const MAX_STORY = 5000;

const PROTOCOL = [
  { icon: EyeOff, title: 'Anonimato estricto', text: 'Por defecto no pedimos nombre ni correo, y no registramos tu IP ni datos de tu dispositivo.' },
  { icon: FileCheck2, title: 'Consentimiento informado', text: 'Tú decides si tu relato puede publicarse. Sin tu autorización expresa, solo lo lee el equipo.' },
  { icon: ShieldCheck, title: 'Filtro editorial', text: 'Antes de publicar editamos cualquier dato que pueda identificarte y evitamos el sensacionalismo y la revictimización.' },
];

/** Sección 6 · Buzón Comunitario: espacio seguro y bidireccional. */
export function MailboxPage() {
  const { settings } = useSiteData();
  const { notify } = useFeedback();
  usePageTitle('Buzón comunitario');
  const stories = useResource((signal) => api<PublicStory[]>('/mailbox/stories', { signal }), []);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    // RF-01: con «Otros» el tema escrito es obligatorio.
    if (form.topic === OTHER_TOPIC && form.topicOther.trim().length < 3) next.topicOther = 'Cuéntanos de qué tema se trata (mínimo 3 caracteres).';
    if (form.story.trim().length < MIN_STORY) next.story = `Cuéntanos un poco más (mínimo ${MIN_STORY} caracteres).`;
    if (!form.anonymous && form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) next.contactEmail = 'Revisa el formato del correo.';
    if (!form.acceptRules) next.acceptRules = 'Para enviar, acepta las normas de convivencia.';
    if (!form.consent) next.consent = 'Necesitamos tu consentimiento para recibir el relato.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      // Lleva el foco al primer campo con error para que se entienda qué corregir.
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setSending(true);
    try {
      await api('/mailbox', {
        method: 'POST',
        body: {
          anonymous: form.anonymous,
          alias: form.anonymous ? undefined : form.alias || undefined,
          contactEmail: form.anonymous ? undefined : form.contactEmail || undefined,
          ageRange: form.ageRange || undefined,
          topic: form.topic || undefined,
          topicOther: form.topic === OTHER_TOPIC ? form.topicOther.trim() : undefined,
          story: form.story,
          allowPublication: form.allowPublication,
          consent: form.consent,
          acceptRules: form.acceptRules,
          website: form.website || undefined,
        },
      });
      setSent(true);
      setForm(EMPTY);
      requestAnimationFrame(() => document.getElementById('buzon-gracias')?.focus());
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fields).length) setErrors(error.fields);
      notify({ tone: 'danger', title: 'No pudimos enviar tu relato', message: errorMessage(error) });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHero eyebrow="Buzón comunitario" title="Un espacio seguro para tu historia" intro={settings?.mailboxIntro} art="mailbox" coverId={settings?.mailboxCoverId} />

      <section className="section section--tight" aria-label="Protocolo ético">
        <div className="container grid-3">
          {PROTOCOL.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card protocol-card reveal">
              <span className="protocol-card__icon"><Icon size={22} aria-hidden /></span>
              <h2 className="protocol-card__title">{title}</h2>
              <p className="text-secondary text-small">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="form-title">
        <div className="container mailbox-layout">
          <div className="card card--raised mailbox-form">
            {sent ? (
              <div className="stack" style={{ alignItems: 'flex-start' }}>
                <span className="protocol-card__icon protocol-card__icon--success"><HeartHandshake size={26} aria-hidden /></span>
                <h2 id="buzon-gracias" tabIndex={-1} className="mailbox-form__title">Gracias por confiar en nosotras</h2>
                <p className="text-secondary">Recibimos tu relato. El equipo editorial lo leerá con cuidado. Si autorizaste su publicación, revisaremos el texto antes de compartir un extracto que no te identifique.</p>
                <p className="text-small text-secondary">Si en algún momento necesitas apoyo inmediato, llama a Salud Responde al <a href="tel:6003607777">600 360 7777</a>.</p>
                <Button variant="secondary" onClick={() => setSent(false)}>Enviar otro relato</Button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="stack">
                <h2 id="form-title" className="mailbox-form__title">Comparte tu relato</h2>

                <Switch
                  label="Enviar de forma anónima"
                  description={form.anonymous ? 'No guardaremos nombre ni correo.' : 'Puedes firmar con un seudónimo y dejar un correo opcional.'}
                  checked={form.anonymous}
                  onChange={(v) => set('anonymous', v)}
                />

                {!form.anonymous ? (
                  <div className="grid-2">
                    <TextField label="Seudónimo (opcional)" value={form.alias} maxLength={40} onChange={(e) => set('alias', e.target.value)} error={errors.alias} hint="Así firmaremos si se publica." autoComplete="nickname" />
                    <TextField label="Correo (opcional)" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} error={errors.contactEmail} hint="Solo para contactarte si lo necesitas." autoComplete="email" />
                  </div>
                ) : null}

                <div className="grid-2">
                  <SelectField
                    label="Tema (opcional)"
                    value={form.topic}
                    onChange={(e) => {
                      set('topic', e.target.value);
                      if (e.target.value === OTHER_TOPIC) requestAnimationFrame(() => document.getElementById('tema-otro')?.focus());
                    }}
                    options={[{ value: '', label: 'Elige un tema' }, ...TOPICS.map((t) => ({ value: t, label: t }))]}
                  />
                  <SelectField label="Rango de edad (opcional)" value={form.ageRange} onChange={(e) => set('ageRange', e.target.value)} options={[{ value: '', label: 'Prefiero no indicarlo' }, ...AGE_RANGES.map((a) => ({ value: a, label: a }))]} />
                </div>

                {form.topic === OTHER_TOPIC ? (
                  <div className="reveal-field">
                    <TextField
                      id="tema-otro"
                      label="¿De qué tema se trata? *"
                      value={form.topicOther}
                      maxLength={80}
                      onChange={(e) => set('topicOther', e.target.value)}
                      error={errors.topicOther}
                      hint="Escríbelo en pocas palabras. Solo lo verá el equipo."
                      required
                    />
                  </div>
                ) : null}

                <TextArea
                  label="Tu relato"
                  rows={8}
                  value={form.story}
                  maxLength={MAX_STORY}
                  showCount
                  onChange={(e) => set('story', e.target.value)}
                  error={errors.story}
                  hint="Escribe con la libertad que necesites. No incluyas datos que te identifiquen a ti o a otras personas."
                  required
                />

                {/* Trampa para bots: oculta para personas y lectores de pantalla. */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
                  <label>
                    Sitio web
                    <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
                  </label>
                </div>

                <section className="rules-box" aria-labelledby="normas-title">
                  <h3 id="normas-title" className="rules-box__title">
                    <HandHeart size={20} aria-hidden /> Normas de convivencia
                  </h3>
                  <ul className="rules-box__list">
                    {(settings?.communityRules || 'Escribe desde tu experiencia y con respeto hacia las demás personas.')
                      .split('\n')
                      .map((rule) => rule.trim())
                      .filter(Boolean)
                      .map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                  </ul>
                  <Checkbox checked={form.acceptRules} onChange={(e) => set('acceptRules', e.target.checked)} error={errors.acceptRules} required>
                    Leí y acepto las normas de convivencia.
                  </Checkbox>
                </section>

                <Checkbox checked={form.allowPublication} onChange={(e) => set('allowPublication', e.target.checked)}>
                  Autorizo que el equipo publique un <strong>extracto editado</strong> de mi relato, sin datos que me identifiquen.
                </Checkbox>
                <Checkbox checked={form.consent} onChange={(e) => set('consent', e.target.checked)} error={errors.consent} required>
                  {settings?.consentText || 'Acepto que mi relato sea leído por el equipo editorial.'} Leí la <Link to="/privacidad">política de privacidad</Link>.
                </Checkbox>

                <Button type="submit" variant="primary" size="lg" icon={Send} iconRight loading={sending}>
                  {sending ? 'Enviando…' : 'Enviar relato'}
                </Button>
              </form>
            )}
          </div>

          <aside className="stack" aria-labelledby="relatos-title">
            <h2 id="relatos-title" className="section-heading__title" style={{ fontSize: 24 }}>Relatos de la comunidad</h2>
            {stories.loading ? (
              <p className="text-muted text-small">Cargando relatos…</p>
            ) : stories.data?.length ? (
              <ul className="stories">
                {stories.data.map((story) => (
                  <li key={story.id} className="card card--quote story reveal">
                    <Quote size={22} aria-hidden className="story__mark" />
                    <p>{story.publicExcerpt}</p>
                    <p className="story__meta">— {story.signature}{story.topic ? ` · ${story.topic}` : ''}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-secondary">Aquí aparecerán los relatos que la comunidad autorice publicar, siempre revisados por el equipo.</p>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
