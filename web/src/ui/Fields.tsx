import { AlertCircle } from 'lucide-react';
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

type ShellProps = { label?: string; hint?: ReactNode; error?: string | null; id: string; counter?: string; children: ReactNode };

function FieldShell({ label, hint, error, id, counter, children }: ShellProps) {
  return (
    <div className="field">
      {label ? (
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <span className="field__error" id={`${id}-error`} role="alert">
          <AlertCircle size={14} aria-hidden /> {error}
        </span>
      ) : hint ? (
        <span className="field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      {counter ? (
        <span className="field__counter" aria-live="polite">
          {counter}
        </span>
      ) : null}
    </div>
  );
}

type Common = { label?: string; hint?: ReactNode; error?: string | null };

const describedBy = (id: string, error?: string | null, hint?: ReactNode) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export function TextField({ label, hint, error, id, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FieldShell label={label} hint={hint} error={error} id={fieldId}>
      <input id={fieldId} className="input" aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy(fieldId, error, hint)} {...rest} />
    </FieldShell>
  );
}

export function TextArea({ label, hint, error, id, showCount, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { showCount?: boolean }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const length = String(rest.value ?? '').length;
  return (
    <FieldShell label={label} hint={hint} error={error} id={fieldId} counter={showCount && rest.maxLength ? `${length} / ${rest.maxLength}` : undefined}>
      <textarea id={fieldId} className="textarea" aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy(fieldId, error, hint)} {...rest} />
    </FieldShell>
  );
}

export function SelectField({ label, hint, error, id, options, ...rest }: Common & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FieldShell label={label} hint={hint} error={error} id={fieldId}>
      <select id={fieldId} className="select" aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy(fieldId, error, hint)} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function Switch({ label, description, checked, onChange, disabled }: { label: string; description?: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="switch__track" aria-hidden />
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        {description ? <span className="text-secondary text-small">{description}</span> : null}
      </span>
    </label>
  );
}

export function Checkbox({ children, error, ...rest }: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode; error?: string | null }) {
  const id = useId();
  return (
    <div className="field">
      <label className="checkbox">
        <input type="checkbox" aria-invalid={Boolean(error) || undefined} aria-describedby={error ? `${id}-error` : undefined} {...rest} />
        <span>{children}</span>
      </label>
      {error ? (
        <span className="field__error" id={`${id}-error`} role="alert">
          <AlertCircle size={14} aria-hidden /> {error}
        </span>
      ) : null}
    </div>
  );
}
