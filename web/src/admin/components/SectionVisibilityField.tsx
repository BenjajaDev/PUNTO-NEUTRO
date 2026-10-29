import { Eye, EyeOff } from 'lucide-react';
import { SITE_SECTIONS } from '@/lib/sections';
import type { SiteSection } from '@/lib/types';
import { Badge, Switch } from '@/ui';

/**
 * Interruptores por sección. El valor es la lista de secciones OCULTAS (igual
 * que en la API), así una sección nueva aparece visible por defecto.
 */
export function SectionVisibilityField({ value, onChange }: { value: SiteSection[]; onChange: (value: SiteSection[]) => void }) {
  // Siempre en el orden del menú: así «apagar y volver a encender» no marca cambios sin guardar.
  const toggle = (section: SiteSection, visible: boolean) =>
    onChange(SITE_SECTIONS.map((s) => s.key).filter((key) => (key === section ? !visible : value.includes(key))));

  return (
    <fieldset className="section-toggles">
      <legend className="visually-hidden">Secciones visibles en el sitio</legend>
      {SITE_SECTIONS.map(({ key, label, description }) => {
        const visible = !value.includes(key);
        return (
          <div key={key} className="section-toggles__row">
            <Switch label={label} description={description} checked={visible} onChange={(v) => toggle(key, v)} />
            {/* El estado también en texto: no depende solo del color del interruptor. */}
            {visible ? <Badge tone="success" icon={Eye}>Visible</Badge> : <Badge tone="neutral" icon={EyeOff}>Oculta</Badge>}
          </div>
        );
      })}
    </fieldset>
  );
}
