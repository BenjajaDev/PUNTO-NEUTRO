import { Pencil, Plus, Trash2, UserCog } from 'lucide-react';
import { useState } from 'react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { Role, UserRow } from '@/lib/types';
import { useResource } from '@/lib/useResource';
import { Badge, Button, Dialog, EmptyState, ErrorState, PageHeader, SelectField, SkeletonRows, Switch, TextField, useFeedback } from '@/ui';
import { ROLE_LABEL, useAuth } from '../AuthProvider';

type Draft = { id?: number; name: string; email: string; role: Role; active: boolean; password: string };
const ROLE_HINT: Record<Role, string> = {
  ADMIN: 'Todo el panel: configuración del sitio, usuarios e historial.',
  EDITOR: 'Contenidos, equipo, medios y moderación del buzón.',
};

export function UsersAdmin() {
  const { user: me } = useAuth();
  const { confirm, notify } = useFeedback();
  const users = useResource((signal) => api<UserRow[]>('/admin/users', { signal }), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const submit = async () => {
    if (!draft) return;
    const isNew = !draft.id;
    const next: Record<string, string> = {};
    if (draft.name.trim().length < 2) next.name = 'Escribe el nombre.';
    if (isNew && !/^\S+@\S+\.\S+$/.test(draft.email)) next.email = 'Correo inválido.';
    if ((isNew || draft.password) && draft.password.length < 10) next.password = 'Mínimo 10 caracteres.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const isSelf = draft.id === me?.id;
    const save = async () => {
      setSaving(true);
      try {
        if (isNew) await api('/admin/users', { method: 'POST', body: { name: draft.name, email: draft.email, role: draft.role, password: draft.password } });
        else await api(`/admin/users/${draft.id}`, { method: 'PUT', body: { name: draft.name, ...(isSelf ? {} : { role: draft.role, active: draft.active }), ...(draft.password ? { password: draft.password } : {}) } });
        notify({ tone: 'success', message: isNew ? 'Cuenta creada. Comparte la contraseña de forma segura.' : 'Cuenta actualizada.' });
        setDraft(null);
        users.reload();
      } catch (error) {
        if (error instanceof ApiError) setErrors(error.fields);
        notify({ tone: 'danger', title: 'No se pudo guardar', message: errorMessage(error) });
      } finally {
        setSaving(false);
      }
    };
    const original = users.data?.find((u) => u.id === draft.id);
    // Dar o quitar el rol de administración es crítico: se confirma.
    if (!isNew && original && original.role !== draft.role) {
      const ok = await confirm({ title: `¿Cambiar el rol a ${ROLE_LABEL[draft.role]}?`, message: ROLE_HINT[draft.role], tone: 'warning', confirmLabel: 'Cambiar rol' });
      if (!ok) return;
    }
    await save();
  };

  const remove = async (row: UserRow) => {
    const done = await confirm({
      title: `¿Eliminar la cuenta de ${row.name}?`,
      message: 'Perderá el acceso al panel. Sus contenidos se conservan. Si solo quieres pausar su acceso, desactívala.',
      tone: 'danger',
      confirmLabel: 'Eliminar cuenta',
      onConfirm: () => api(`/admin/users/${row.id}`, { method: 'DELETE' }),
    });
    if (done) {
      notify({ tone: 'success', message: 'Cuenta eliminada.' });
      users.reload();
    }
  };

  return (
    <>
      <PageHeader title="Usuarios y roles" subtitle="Quién puede entrar al panel y qué puede hacer." actions={<Button icon={Plus} onClick={() => { setErrors({}); setDraft({ name: '', email: '', role: 'EDITOR', active: true, password: '' }); }}>Nueva cuenta</Button>} />
      {users.loading ? (
        <SkeletonRows />
      ) : users.error ? (
        <ErrorState message={users.error} onRetry={users.reload} />
      ) : !users.data?.length ? (
        <EmptyState icon={UserCog} title="Sin cuentas" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Persona</th>
                <th scope="col">Rol</th>
                <th scope="col">Estado</th>
                <th scope="col">Último ingreso</th>
                <th scope="col"><span className="visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong> {row.id === me?.id ? <Badge tone="neutral">Tú</Badge> : null}
                    <span className="text-xs text-muted" style={{ display: 'block' }}>{row.email}</span>
                  </td>
                  <td><Badge tone={row.role === 'ADMIN' ? 'brand' : 'info'}>{ROLE_LABEL[row.role]}</Badge></td>
                  <td>{row.active ? <Badge tone="success">Activa</Badge> : <Badge tone="neutral">Desactivada</Badge>}</td>
                  <td className="text-secondary">{row.lastLoginAt ? formatDateTime(row.lastLoginAt) : 'Nunca'}</td>
                  <td>
                    <div className="row" style={{ gap: 2, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      <Button variant="ghost" size="sm" icon={Pencil} aria-label={`Editar cuenta de ${row.name}`} onClick={() => { setErrors({}); setDraft({ ...row, password: '' }); }} />
                      {row.id !== me?.id ? <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Eliminar cuenta de ${row.name}`} onClick={() => remove(row)} /> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={Boolean(draft)} wide title={draft?.id ? 'Editar cuenta' : 'Nueva cuenta'} dismissible={!saving} onClose={() => setDraft(null)}
        actions={<><Button variant="secondary" onClick={() => setDraft(null)} disabled={saving}>Cancelar</Button><Button onClick={submit} loading={saving}>Guardar</Button></>}
      >
        {draft ? (
          <div className="form-grid">
            <TextField label="Nombre *" value={draft.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
            <TextField label="Correo *" type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} error={errors.email} disabled={Boolean(draft.id)} hint={draft.id ? 'El correo no se puede cambiar.' : undefined} />
            <SelectField label="Rol" value={draft.role} onChange={(e) => set('role', e.target.value as Role)} options={[{ value: 'EDITOR', label: ROLE_LABEL.EDITOR }, { value: 'ADMIN', label: ROLE_LABEL.ADMIN }]} hint={draft.id === me?.id ? 'No puedes cambiar tu propio rol.' : ROLE_HINT[draft.role]} disabled={draft.id === me?.id} />
            <TextField label={draft.id ? 'Nueva contraseña (opcional)' : 'Contraseña inicial *'} type="password" autoComplete="new-password" value={draft.password} onChange={(e) => set('password', e.target.value)} error={errors.password} hint="Mínimo 10 caracteres." />
            {draft.id && draft.id !== me?.id ? (
              <div style={{ gridColumn: '1 / -1' }}>
                <Switch label="Cuenta activa" description="Una cuenta desactivada no puede ingresar al panel." checked={draft.active} onChange={(v) => set('active', v)} />
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
