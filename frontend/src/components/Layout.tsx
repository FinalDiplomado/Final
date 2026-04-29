import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === '/';
  const isCreate = location.pathname === '/evaluations/new';
  const isAdminUsers = location.pathname === '/admin/users';
  const isAdmin = user?.role?.name === 'ADMIN';

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="topbarLeft">
          <Link to="/" className="brand">
            Usability UX/UI
          </Link>
          {user ? (
            <nav className="nav">
              <Link to="/" className="navLink" aria-current={isDashboard ? 'page' : undefined}>
                Inicio
              </Link>
              {isAdmin ? (
                <Link
                  to="/evaluations/new"
                  className="navLink"
                  aria-current={isCreate ? 'page' : undefined}
                >
                  Nueva evaluación
                </Link>
              ) : null}
              {isAdmin ? (
                <Link
                  to="/admin/users"
                  className="navLink"
                  aria-current={isAdminUsers ? 'page' : undefined}
                >
                  Usuarios
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
        <div className="topbarRight">
          {user ? (
            <>
              <span className="userTag">{user.fullName}</span>
              <button
                className="btn btnSecondary"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Salir
              </button>
            </>
          ) : (
            <Link className="btn btnSecondary" to="/login">
              Ingresar
            </Link>
          )}
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
