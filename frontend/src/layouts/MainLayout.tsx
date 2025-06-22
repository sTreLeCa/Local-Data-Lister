// frontend/src/layouts/MainLayout.tsx
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './MainLayout.css';

export const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <div className="App">
      <header>
        <nav className="main-nav">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          {isAuthenticated() ? (
            <>
              <Link to="/favorites">My Favorites</Link>
              <div className="user-info">
                <span>Welcome, {user?.email}!</span>
                <button onClick={handleLogout} className="logout-button">Logout</button>
              </div>
            </>
          ) : (
            <div className="user-info">
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>
          )}
        </nav>
      </header>
      <main className="content">
        {/* The Outlet component from react-router-dom renders the active page here */}
        <Outlet />
      </main>
    </div>
  );
};