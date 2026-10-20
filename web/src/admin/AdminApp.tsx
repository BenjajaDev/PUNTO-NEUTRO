import '../styles/admin.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from '@/ui';
import { AdminLayout } from './AdminLayout';
import { AuthProvider, useAuth } from './AuthProvider';
import { LoginPage } from './LoginPage';
import { AccountPage } from './pages/AccountPage';
import { AuditPage } from './pages/AuditPage';
import { DashboardPage } from './pages/DashboardPage';
import { GlossaryAdmin } from './pages/GlossaryAdmin';
import { InterviewEditor, InterviewsAdmin } from './pages/InterviewsAdmin';
import { MailboxAdmin } from './pages/MailboxAdmin';
import { MediaAdmin } from './pages/MediaAdmin';
import { PodcastAdmin } from './pages/PodcastAdmin';
import { ReflectionEditor, ReflectionsAdmin } from './pages/ReflectionsAdmin';
import { SettingsAdmin } from './pages/SettingsAdmin';
import { TeamAdmin } from './pages/TeamAdmin';
import { TrendEditor, TrendsAdmin } from './pages/TrendsAdmin';
import { UsersAdmin } from './pages/UsersAdmin';

function Gate() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spinner label="Verificando sesión…" />
      </div>
    );
  }
  if (!user) return <LoginPage />;

  const adminOnly = (element: React.ReactElement) => (isAdmin ? element : <Navigate to="/admin" replace />);

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="trends" element={<TrendsAdmin />} />
        <Route path="trends/:id" element={<TrendEditor />} />
        <Route path="entrevistas" element={<InterviewsAdmin />} />
        <Route path="entrevistas/:id" element={<InterviewEditor />} />
        <Route path="glosario" element={<GlossaryAdmin />} />
        <Route path="querer-encajar" element={<ReflectionsAdmin />} />
        <Route path="querer-encajar/:id" element={<ReflectionEditor />} />
        <Route path="podcast" element={<PodcastAdmin />} />
        <Route path="buzon" element={<MailboxAdmin />} />
        <Route path="equipo" element={<TeamAdmin />} />
        <Route path="medios" element={<MediaAdmin />} />
        <Route path="configuracion" element={adminOnly(<SettingsAdmin />)} />
        <Route path="usuarios" element={adminOnly(<UsersAdmin />)} />
        <Route path="historial" element={adminOnly(<AuditPage />)} />
        <Route path="cuenta" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
