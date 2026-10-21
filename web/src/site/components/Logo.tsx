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

/** Logo subido en el panel o, si no hay, la marca por defecto. Decorativo: el nombre va al lado. */
export function BrandMark({ logoId, size = 36 }: { logoId?: number | null; size?: number }) {
  const src = mediaUrl(logoId);
  return src ? <img src={src} alt="" width={size} height={size} className="logo__img" style={{ width: size, height: size }} /> : <LogoMark size={size} />;
}

export function Logo({ name = 'Punto Neutro', logoId }: { name?: string; logoId?: number | null }) {
  return (
    <span className="logo">
      <BrandMark logoId={logoId} />
      <span className="logo__text">{name}</span>
    </span>
  );
}
