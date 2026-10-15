import './styles/site.css';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { FeedbackProvider, Spinner } from './ui';
import { SiteDataProvider } from './site/SiteDataProvider';
import { SiteLayout } from './site/SiteLayout';
import { AboutPage } from './site/pages/AboutPage';
import { GlossaryPage } from './site/pages/GlossaryPage';
import { HomePage } from './site/pages/HomePage';
import { InterviewDetailPage } from './site/pages/InterviewDetailPage';
import { InterviewsPage } from './site/pages/InterviewsPage';
import { MailboxPage } from './site/pages/MailboxPage';
import { NotFoundPage } from './site/pages/NotFoundPage';
import { PodcastPage } from './site/pages/PodcastPage';
import { PrivacyPage } from './site/pages/PrivacyPage';
import { TrendDetailPage } from './site/pages/TrendDetailPage';
import { TrendsPage } from './site/pages/TrendsPage';

// El panel se descarga solo cuando alguien entra a /admin: el sitio público no lo paga.
const AdminApp = lazy(() => import('./admin/AdminApp'));

function AdminFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Spinner label="Cargando panel…" />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'nosotras', element: <AboutPage /> },
      { path: 'anatomia-de-un-trend', element: <TrendsPage /> },
      { path: 'anatomia-de-un-trend/:slug', element: <TrendDetailPage /> },
      { path: 'entrevistas', element: <InterviewsPage /> },
      { path: 'entrevistas/:slug', element: <InterviewDetailPage /> },
      { path: 'glosario', element: <GlossaryPage /> },
      { path: 'buzon', element: <MailboxPage /> },
      { path: 'podcast', element: <PodcastPage /> },
      { path: 'privacidad', element: <PrivacyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'admin/*',
    element: (
      <Suspense fallback={<AdminFallback />}>
        <AdminApp />
      </Suspense>
    ),
  },
]);

export function App() {
  return (
    <FeedbackProvider>
      <SiteDataProvider>
        <RouterProvider router={router} />
      </SiteDataProvider>
    </FeedbackProvider>
  );
}
