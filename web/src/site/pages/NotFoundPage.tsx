import { Link } from 'react-router-dom';
import { buttonClass } from '@/ui';
import { LogoMark } from '../components/Logo';

export function NotFoundPage() {
  return (
    <section className="container section stack" style={{ alignItems: 'center', textAlign: 'center', minHeight: '50vh', justifyContent: 'center' }}>
      <LogoMark size={64} />
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)' }}>No encontramos esta página</h1>
      <p className="text-secondary" style={{ maxWidth: 460 }}>Puede que el enlace haya cambiado o que el contenido ya no esté publicado.</p>
      <Link to="/" className={buttonClass({})} viewTransition>Volver al inicio</Link>
    </section>
  );
}
