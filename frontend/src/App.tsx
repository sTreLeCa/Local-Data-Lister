// frontend/src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Pages that will be rendered inside the MainLayout */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Placeholders for your next tasks */}
        <Route path="/favorites" element={<h2>My Favorites (TODO)</h2>} />
        <Route path="/dashboard" element={<h2>Dashboard (TODO)</h2>} />
        
        {/* A catch-all route for any undefined paths */}
        <Route path="*" element={<h2>404: Page Not Found</h2>} />
      </Route>
    </Routes>
  );
}