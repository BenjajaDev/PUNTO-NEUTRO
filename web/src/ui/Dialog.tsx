import { AlertTriangle, CheckCircle2, Info, Trash2, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

export type DialogTone = 'info' | 'success' | 'warning' | 'danger' | 'brand';

const TONES: Record<DialogTone, { icon: LucideIcon; accent: string; soft: string; fg: string }> = {
  info: { icon: Info, accent: 'var(--color-info)', soft: 'var(--color-info-soft)', fg: 'var(--color-info-text)' },
  success: { icon: CheckCircle2, accent: 'var(--color-success)', soft: 'var(--color-success-soft)', fg: 'var(--color-success-text)' },
  warning: { icon: AlertTriangle, accent: 'var(--color-warning)', soft: 'var(--color-warning-soft)', fg: 'var(--color-warning-text)' },
  danger: { icon: Trash2, accent: 'var(--color-danger)', soft: 'var(--color-danger-soft)', fg: 'var(--color-danger-text)' },
  brand: { icon: Info, accent: 'var(--gradient-brand)', soft: 'var(--color-primary-soft)', fg: 'var(--color-primary)' },
};

type DialogProps = {
  open: boolean;
  tone?: DialogTone;
  icon?: LucideIcon;
  title: string;
  message?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  dismissible?: boolean;
  wide?: boolean;
  onClose?: () => void;
};

/**
 * Diálogo modal sobre <dialog> nativo: showModal() da capa superior, foco
 * atrapado e `inert` para el resto de la página. Esc y clic en el fondo
 * cierran solo si es descartable. El foco vuelve al elemento que lo abrió.
 */
export function Dialog({ open, tone = 'brand', icon, title, message, children, actions, dismissible = true, wide = false, onClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const config = TONES[tone];
  const Icon = icon || config.icon;

  // onClose y dismissible por ref: las páginas pasan funciones nuevas en cada render.
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  onCloseRef.current = onClose;
  dismissibleRef.current = dismissible;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    const onCancel = (event: Event) => {
      event.preventDefault();
      if (dismissibleRef.current) onCloseRef.current?.();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, []);

  return (
    <dialog
      ref={ref}
      className={`dialog${wide ? ' dialog--wide' : ''}`}
      aria-labelledby={titleId}
      style={{ ['--dialog-accent' as string]: config.accent }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && dismissibleRef.current) onCloseRef.current?.();
      }}
    >
      {open ? (
        <>
          <div className="dialog__accent" />
          <div className="dialog__body">
            {!wide ? (
              <div className="dialog__badge" style={{ background: config.soft, color: config.fg }}>
                <Icon size={26} aria-hidden />
              </div>
            ) : null}
            <h2 id={titleId} className="dialog__title">
              {title}
            </h2>
            {message ? <div className="dialog__message">{message}</div> : null}
            {children}
            {actions ? <div className="dialog__actions">{actions}</div> : null}
          </div>
        </>
      ) : null}
    </dialog>
  );
}
