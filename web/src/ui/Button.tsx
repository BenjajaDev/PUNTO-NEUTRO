import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: boolean;
  loading?: boolean;
  block?: boolean;
  children?: ReactNode;
};

export function buttonClass({ variant = 'primary', size = 'md', block = false, iconOnly = false, className = '' }: { variant?: Variant; size?: Size; block?: boolean; iconOnly?: boolean; className?: string }) {
  return ['btn', variant !== 'primary' && `btn--${variant}`, size !== 'md' && `btn--${size}`, block && 'btn--block', iconOnly && 'btn--icon', className].filter(Boolean).join(' ');
}

/**
 * Botón único (sitio y panel). Estados: hover, focus-visible, disabled y
 * loading (bloquea el doble envío y anuncia aria-busy). Un botón solo con
 * icono DEBE llevar aria-label.
 */
export function Button({ variant = 'primary', size = 'md', icon: Icon, iconRight = false, loading = false, block = false, className = '', children, disabled, type = 'button', ...rest }: ButtonProps) {
  const iconNode = loading ? (
    <span className="spinner" style={{ ['--spinner-size' as string]: '16px', borderWidth: 2 }} aria-hidden />
  ) : Icon ? (
    <Icon size={size === 'sm' ? 16 : 18} aria-hidden />
  ) : null;
  return (
    <button type={type} className={buttonClass({ variant, size, block, iconOnly: !children && Boolean(Icon), className })} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {!iconRight && iconNode}
      {children}
      {iconRight && iconNode}
    </button>
  );
}
