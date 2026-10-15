import { LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, errorMessage } from '@/lib/api';
import { Button, TextField } from '@/ui';
import { LogoMark } from '@/site/components/Logo';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'Ingresa tu correo.';
    if (!password) next.password = 'Ingresa tu contraseña.';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fields).length) setErrors(error.fields);
      setFormError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login">
      <div className="login__card card card--raised">
        <div className="stack-sm" style={{ alignItems: 'center', textAlign: 'center' }}>
          <LogoMark size={52} />
          <h1 style={{ fontSize: 28 }}>Panel de Punto Neutro</h1>
          <p className="text-secondary">Acceso exclusivo para el equipo editorial.</p>
        </div>
        <form className="stack" onSubmit={submit} noValidate>
          {formError ? (
            <p className="login__error" role="alert">
              {formError}
            </p>
          ) : null}
          <TextField label="Correo" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoFocus />
          <TextField label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
          <Button type="submit" size="lg" block icon={LogIn} loading={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
        <Link to="/" className="text-small" style={{ textAlign: 'center' }}>
          ← Volver al sitio
        </Link>
      </div>
    </main>
  );
}
