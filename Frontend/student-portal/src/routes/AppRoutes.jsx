import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import { useAuth } from '../context/AuthContext';
import { FullscreenSpinner } from '../components/ui/StatePanel';

const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const MaterialDetailPage = lazy(() => import('../pages/MaterialDetailPage'));
const UploadPage = lazy(() => import('../pages/UploadPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage'));

const NotFoundRedirect = () => {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
};

const AppRoutes = () => (
  <Suspense fallback={<FullscreenSpinner />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route path="/dashboard" element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
      </Route>

      <Route path="/search" element={<ProtectedRoute />}>
        <Route index element={<SearchPage />} />
      </Route>

      <Route path="/materials/:id" element={<ProtectedRoute />}>
        <Route index element={<MaterialDetailPage />} />
      </Route>

      <Route path="/upload" element={<ProtectedRoute />}>
        <Route index element={<UploadPage />} />
      </Route>

      <Route path="/profile" element={<ProtectedRoute />}>
        <Route index element={<ProfilePage />} />
      </Route>

      <Route path="/notifications" element={<ProtectedRoute />}>
        <Route index element={<NotificationsPage />} />
      </Route>

      <Route path="/admin" element={<AdminRoute />}>
        <Route index element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
