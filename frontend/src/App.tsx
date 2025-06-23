import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MyFavoritesPage } from './pages/MyFavoritesPage';
import { DashboardPage } from './pages/DashboardPage';
import { ItemDetailPage } from './pages/ItemDetailPage'; // <-- IMPORT THE NEW PAGE
import './pages/Auth.css';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/favorites" element={<MyFavoritesPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* 👇 ADD THIS NEW ROUTE 👇 */}
        <Route path="/item/:itemId" element={<ItemDetailPage />} />
        <Route path="*" element={<h2>404: Page Not Found</h2>} />
      </Route>
    </Routes>
  );
}