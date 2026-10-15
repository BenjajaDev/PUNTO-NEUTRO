import { KeyRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { Button, Card, PageHeader, TextField, useFeedback } from '@/ui';
import { ROLE_LABEL, useAuth } from '../AuthProvider';

export function AccountPage() {
  const { user } = useAuth();
  const { notify } = useFeedback();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', repeat: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.currentPassword) next.currentPassword = 'Ingresa tu contraseña actual.';
    if (form.newPassword.length < 10) next.newPassword = 'Mínimo 10 caracteres.';
    if (form.repeat !== form.newPassword) next.repeat = 'Las contraseñas no coinciden.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await api('/auth/password', { method: 'PUT', body: { currentPassword: form.currentPassword, newPassword: form.newPassword } });
      notify({ tone: 'success', message: 'Contraseña actualizada.' });
      setForm({ currentPassword: '', newPassword: '', repeat: '' });
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fields);
      notify({ tone: 'danger', title: 'No se pudo cambiar', message: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Mi cuenta" subtitle={`${user?.name} · ${user?.email} · ${user ? ROLE_LABEL[user.role] : ''}`} />
      <Card style={{ maxWidth: 520 }}>
        <form className="stack" onSubmit={submit} noValidate>
          <h2 style={{ fontSize: 20 }}>Cambiar contraseña</h2>
          <TextField label="Contraseña actual" type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} error={errors.currentPassword} />
          <TextField label="Nueva contraseña" type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} error={errors.newPassword} hint="Mínimo 10 caracteres." />
          <TextField label="Repite la nueva contraseña" type="password" autoComplete="new-password" value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value })} error={errors.repeat} />
          <Button type="submit" icon={KeyRound} loading={saving} style={{ alignSelf: 'flex-start' }}>Actualizar contraseña</Button>
        </form>
      </Card>
    </>
  );
}
