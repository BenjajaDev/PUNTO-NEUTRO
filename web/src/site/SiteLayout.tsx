import { Mail, Menu, MessageCircle, Moon, Phone, Sun, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '@/lib/useTheme';
import { buttonClass } from '@/ui';
import { Logo, LogoMark } from './components/Logo';
import { FacebookIcon, InstagramIcon, TikTokIcon } from './components/SocialIcons';
import { useSiteData } from './SiteDataProvider';

export const NAV = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/nosotras', label: 'Nosotras' },
  { to: '/anatomia-de-un-trend', label: 'Anatomía de un Trend' },
  { to: '/entrevistas', label: 'Entrevistas' },
  { to: '/glosario', label: 'Glosario' },
  { to: '/querer-encajar', label: 'Querer encajar' },
  { to: '/podcast', label: 'Podcast' },
];

function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const label = mode === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
  return (
    <button type="button" className={buttonClass({ variant: 'ghost', iconOnly: true })} onClick={toggle} aria-label={label} title={label}>
      {mode === 'dark' ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
    </button>
  );
}

/** Al navegar: vuelve arriba y lleva el foco al contenido (lectores de pantalla anuncian la página nueva). */
function useRouteFocus() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    document.getElementById('contenido')?.focus({ preventScroll: true });
  }, [pathname]);
}

export function SiteLayout() {
  const { settings } = useSiteData();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useRouteFocus();

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const name = settings?.siteName || 'Punto Neutro';
  const socials = [
    { href: settings?.instagramUrl, label: 'Instagram', icon: InstagramIcon },
    { href: settings?.facebookUrl, label: 'Facebook', icon: FacebookIcon },
    { href: settings?.tiktokUrl, label: 'TikTok', icon: TikTokIcon },
  ].filter((s) => s.href);
  const whatsapp = settings?.whatsappNumber?.replace(/\D/g, '');

  return (
    <div className="site">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="site-header__brand" aria-label={`${name}, ir al inicio`} viewTransition>
            <Logo name={name} logoId={settings?.logoId} />
          </Link>

          <nav className="site-nav" aria-label="Principal">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="site-nav__link" viewTransition>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-header__actions">
            <ThemeToggle />
            <Link to="/buzon" className={buttonClass({ variant: 'accent', size: 'sm', className: 'site-header__cta' })} viewTransition>
              Buzón comunitario
            </Link>
            <button
              type="button"
              className={buttonClass({ variant: 'ghost', iconOnly: true, className: 'site-header__menu' })}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              aria-controls="menu-movil"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
            </button>
          </div>
        </div>

        <div id="menu-movil" className="mobile-menu" data-open={menuOpen} hidden={!menuOpen}>
          <nav aria-label="Principal (móvil)" className="mobile-menu__nav">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="mobile-menu__link" viewTransition>
                {item.label}
              </NavLink>
            ))}
            <Link to="/buzon" className={buttonClass({ variant: 'accent', block: true })} viewTransition>
              Buzón comunitario
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenido" tabIndex={-1} className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand stack">
            <span className="row" style={{ gap: 10 }}>
              <LogoMark size={40} />
              <strong className="site-footer__name">{name}</strong>
            </span>
            {settings?.tagline ? <p className="text-secondary">{settings.tagline}</p> : null}
            {socials.length ? (
              <ul className="site-footer__socials" aria-label="Redes sociales">
                {socials.map(({ href, label, icon: Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'secondary', iconOnly: true })} aria-label={`${label} (se abre en otra pestaña)`}>
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav aria-label="Secciones" className="site-footer__col">
            <h2 className="site-footer__title">Secciones</h2>
            <ul>
              {[...NAV, { to: '/buzon', label: 'Buzón comunitario' }].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} viewTransition>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-footer__col">
            <h2 className="site-footer__title">Contacto</h2>
            <ul>
              {settings?.contactEmail ? (
                <li>
                  <a href={`mailto:${settings.contactEmail}`} className="row" style={{ gap: 8 }}>
                    <Mail size={16} aria-hidden /> {settings.contactEmail}
                  </a>
                </li>
              ) : null}
              {settings?.contactPhone ? (
                <li>
                  <a href={`tel:${settings.contactPhone.replace(/\s/g, '')}`} className="row" style={{ gap: 8 }}>
                    <Phone size={16} aria-hidden /> {settings.contactPhone}
                  </a>
                </li>
              ) : null}
              {whatsapp ? (
                <li>
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="row" style={{ gap: 8 }}>
                    <MessageCircle size={16} aria-hidden /> WhatsApp
                  </a>
                </li>
              ) : null}
              <li>
                <Link to="/buzon">Comparte tu relato</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__legal">
          <p>{settings?.creditsText}</p>
          <p className="row" style={{ gap: 16 }}>
            <Link to="/privacidad">Privacidad y protección de datos</Link>
            <Link to="/admin">Acceso equipo</Link>
            <span>© {new Date().getFullYear()} {name}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
