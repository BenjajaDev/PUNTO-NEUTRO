import {
  ExternalLink,
  FileText,
  HeartHandshake,
  Headphones,
  History,
  Image,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Moon,
  Settings2,
  SpellCheck,
  Sun,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Stats } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';
import { LogoMark } from '@/site/components/Logo';
import { Badge, Button, useFeedback } from '@/ui';
import { ROLE_LABEL, useAuth } from './AuthProvider';

type NavItem = { to: string; label: string; icon: LucideIcon; adminOnly?: boolean; end?: boolean; badge?: 'pending' };

const SECTIONS: { label: string; items: NavItem[] }[] = [
  { label: 'General', items: [{ to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true }] },
  {
    label: 'Contenidos',
    items: [
      { to: '/admin/trends', label: 'Anatomía de un Trend', icon: FileText },
      { to: '/admin/entrevistas', label: 'Pequeñas Entrevistas', icon: MessageSquareQuote },
      { to: '/admin/glosario', label: 'Glosario', icon: SpellCheck },
      { to: '/admin/querer-encajar', label: 'Querer encajar', icon: HeartHandshake },
      { to: '/admin/podcast', label: 'Podcast', icon: Headphones },
    ],
  },
  { label: 'Comunidad', items: [{ to: '/admin/buzon', label: 'Buzón comunitario', icon: Inbox, badge: 'pending' }] },
  {
    label: 'Sitio web',
    items: [
      { to: '/admin/equipo', label: 'Equipo (Nosotras)', icon: Users },
      { to: '/admin/medios', label: 'Medios', icon: Image },
      { to: '/admin/configuracion', label: 'Configuración del sitio', icon: Settings2, adminOnly: true },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/admin/usuarios', label: 'Usuarios y roles', icon: UserCog, adminOnly: true },
      { to: '/admin/historial', label: 'Historial de cambios', icon: History, adminOnly: true },
    ],
  },
];

/** Evento global para refrescar el contador del buzón tras moderar. */
export const MAILBOX_CHANGED = 'pn:mailbox-changed';

export function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const { confirm } = useFeedback();
  const { mode, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);
  const { pathname } = useLocation();

  const refreshPending = useCallback(() => {
    api<Stats>('/admin/stats')
      .then((s) => setPending(s.pending))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshPending();
    window.addEventListener(MAILBOX_CHANGED, refreshPending);
    return () => window.removeEventListener(MAILBOX_CHANGED, refreshPending);
  }, [refreshPending]);

  useEffect(() => {
    setOpen(false);
    document.getElementById('admin-main')?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const signOut = () =>
    confirm({
      title: '¿Cerrar sesión?',
      message: 'Tendrás que volver a ingresar para administrar el sitio.',
      tone: 'warning',
      icon: LogOut,
      confirmLabel: 'Cerrar sesión',
      onConfirm: logout,
    });

  const themeLabel = mode === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';

  return (
    <div className="admin">
      <a className="skip-link" href="#admin-main">
        Saltar al contenido
      </a>
      <div className="admin__topbar">
        <Button variant="ghost" icon={open ? X : Menu} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="admin-sidebar" onClick={() => setOpen((v) => !v)} />
        <strong className="row" style={{ gap: 8 }}>
          <LogoMark size={26} /> Panel
        </strong>
        <Button variant="ghost" icon={mode === 'dark' ? Sun : Moon} aria-label={themeLabel} onClick={toggle} />
      </div>

      {open ? <div className="admin__backdrop" aria-hidden onClick={() => setOpen(false)} /> : null}
      <aside id="admin-sidebar" className="admin__sidebar" data-open={open} aria-label="Navegación del panel">
        <Link to="/admin" className="admin__brand">
          <LogoMark size={34} />
          <span>
            <strong>Punto Neutro</strong>
            <span className="text-xs text-muted" style={{ display: 'block' }}>Panel editorial</span>
          </span>
        </Link>
        <nav className="admin__nav">
          {SECTIONS.map((section) => {
            const items = section.items.filter((item) => !item.adminOnly || isAdmin);
            if (!items.length) return null;
            return (
              <div key={section.label} className="admin__group">
                <span className="admin__group-label">{section.label}</span>
                {items.map(({ to, label, icon: Icon, end, badge }) => (
                  <NavLink key={to} to={to} end={end} className="admin__link">
                    <Icon size={18} aria-hidden />
                    <span style={{ flex: 1 }}>{label}</span>
                    {badge === 'pending' && pending > 0 ? (
                      <span className="admin__count" aria-label={`${pending} pendientes`}>
                        {pending}
                      </span>
                    ) : null}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="admin__user">
          <div className="row-between" style={{ gap: 8 }}>
            <Link to="/admin/cuenta" className="admin__user-name">
              <strong>{user?.name}</strong>
              <span className="text-xs text-muted">{user?.email}</span>
            </Link>
            <Badge tone={isAdmin ? 'brand' : 'info'}>{user ? ROLE_LABEL[user.role] : ''}</Badge>
          </div>
          <div className="row" style={{ gap: 4 }}>
            <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
              <ExternalLink size={16} aria-hidden /> Ver sitio
            </a>
            <Button variant="ghost" size="sm" icon={mode === 'dark' ? Sun : Moon} onClick={toggle} aria-label={themeLabel} />
            <Button variant="ghost" size="sm" icon={LogOut} onClick={signOut}>
              Salir
            </Button>
          </div>
        </div>
      </aside>

      <main id="admin-main" className="admin__main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
