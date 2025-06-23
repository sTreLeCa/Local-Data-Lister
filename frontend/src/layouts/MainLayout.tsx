import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './MainLayout.css';
import { Toaster } from 'react-hot-toast';

export const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const navLinkClass = ({ isActive }: { isActive: boolean }) => isActive ? 'active' : '';

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-surface-base)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
      <header>
        <nav className="main-nav">
          <div className="nav-links">
            <NavLink to="/" className={navLinkClass}>Home</NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
            {isAuthenticated() && (
              <NavLink to="/favorites" className={navLinkClass}>My Favorites</NavLink>
            )}
          </div>
          <div className="user-info">
            {isAuthenticated() ? (
              <>
                <span>{user?.email}</span>
                <button onClick={handleLogout} className="logout-button">Logout</button>
              </>
            ) : (
              <div className="nav-links">
                <NavLink to="/login" className={navLinkClass}>Login</NavLink>
                <NavLink to="/register" className={navLinkClass}>Register</NavLink>
              </div>
            )}
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
};