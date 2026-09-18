import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullscreenSpinner } from '../components/ui/StatePanel';

const AdminRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <FullscreenSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to="/forbidden" replace />;
};

export default AdminRoute;
