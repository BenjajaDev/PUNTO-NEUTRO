import { AlertTriangle, type LucideIcon } from 'lucide-react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { Button } from './Button';

export function Card({ variant, className = '', children, ...rest }: HTMLAttributes<HTMLDivElement> & { variant?: 'raised' | 'quote' | 'section' }) {
  return (
    <div className={['card', variant && `card--${variant}`, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}

export type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export function Badge({ tone = 'brand', icon: Icon, children }: { tone?: Tone; icon?: LucideIcon; children: ReactNode }) {
  return (
    <span className={`badge${tone !== 'brand' ? ` badge--${tone}` : ''}`}>
      {Icon ? <Icon size={13} aria-hidden /> : null}
      {children}
    </span>
  );
}

export function Spinner({ size = 40, label }: { size?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="stack-sm" style={{ alignItems: 'center' }}>
      <span className="spinner" style={{ ['--spinner-size' as string]: `${size}px` } as CSSProperties} aria-hidden />
      <span className={label ? 'text-secondary text-small' : 'visually-hidden'}>{label || 'Cargando'}</span>
    </div>
  );
}

export function Skeleton({ width = '100%', height = 16, radius, style }: { width?: number | string; height?: number | string; radius?: number; style?: CSSProperties }) {
  return <span className="skeleton" aria-hidden style={{ width, height, borderRadius: radius, ...style }} />;
}

/** Tarjetas esqueleto para grillas mientras cargan. Nunca un spinner sin texto. */
export function SkeletonCards({ count = 3, label = 'Cargando contenido' }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="grid-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card stack-sm">
          <Skeleton height={160} radius={12} />
          <Skeleton width="40%" height={14} />
          <Skeleton width="85%" height={22} />
          <Skeleton width="70%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 4, label = 'Cargando' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="stack-sm">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card row" style={{ padding: 14 }}>
          <Skeleton width={40} height={40} radius={10} />
          <div className="stack-sm" style={{ flex: 1 }}>
            <Skeleton width="45%" />
            <Skeleton width="70%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action }: { icon: LucideIcon; title: string; message?: ReactNode; action?: ReactNode }) {
  return (
    <div className="stack-sm" style={{ alignItems: 'center', textAlign: 'center', padding: '48px 16px' }}>
      <span style={{ width: 64, height: 64, borderRadius: 32, display: 'grid', placeItems: 'center', background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
        <Icon size={28} aria-hidden />
      </span>
      <h3 style={{ fontSize: 20 }}>{title}</h3>
      {message ? <p className="text-secondary" style={{ maxWidth: 460 }}>{message}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No pudimos cargar esta sección"
      message={message}
      action={onRetry ? <Button variant="secondary" onClick={onRetry}>Reintentar</Button> : undefined}
    />
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="row-between" style={{ marginBottom: 24, alignItems: 'flex-end' }}>
      <div className="stack-sm" style={{ gap: 4 }}>
        <h1 style={{ fontSize: 28 }}>{title}</h1>
        {subtitle ? <p className="text-secondary">{subtitle}</p> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </header>
  );
}

export function StatTile({ icon: Icon, label, value, tone = 'brand' }: { icon: LucideIcon; label: string; value: ReactNode; tone?: Tone }) {
  const colors: Record<Tone, [string, string]> = {
    brand: ['var(--color-primary-soft)', 'var(--color-primary)'],
    accent: ['var(--color-accent-soft)', 'var(--color-text-primary)'],
    success: ['var(--color-success-soft)', 'var(--color-success-text)'],
    warning: ['var(--color-warning-soft)', 'var(--color-warning-text)'],
    danger: ['var(--color-danger-soft)', 'var(--color-danger-text)'],
    info: ['var(--color-info-soft)', 'var(--color-info-text)'],
    neutral: ['var(--color-surface-sunken)', 'var(--color-text-secondary)'],
  };
  const [bg, fg] = colors[tone];
  return (
    <div className="card row" style={{ gap: 14, padding: 18 }}>
      <span style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: bg, color: fg, flexShrink: 0 }}>
        <Icon size={22} aria-hidden />
      </span>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1, fontFamily: 'var(--font-serif)' }}>{value}</div>
        <div className="text-secondary text-small">{label}</div>
      </div>
    </div>
  );
}
