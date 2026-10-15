import { mediaUrl } from '@/lib/format';

/**
 * Marca: un círculo (el cuerpo, sin forma impuesta) con un punto al centro
 * (el punto neutro). Si se sube un logo en el panel, se usa ese.
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden focusable="false">
      <circle cx="32" cy="32" r="27" fill="none" stroke="var(--color-primary)" strokeWidth="6" />
      <circle cx="32" cy="32" r="9" fill="var(--color-accent)" />
    </svg>
  );
}

export function Logo({ name = 'Punto Neutro', logoId }: { name?: string; logoId?: number | null }) {
  const src = mediaUrl(logoId);
  return (
    <span className="logo">
      {src ? <img src={src} alt="" width={36} height={36} className="logo__img" /> : <LogoMark />}
      <span className="logo__text">{name}</span>
    </span>
  );
}
