import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (!user) {
    // Lưu lại URL hiện tại để redirect sau khi login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu là Admin/Staff, redirect về trang admin
  if (user.role === 'Admin' || user.role === 'Staff') {
    console.log('ProtectedRoute - Admin/Staff trying to access user page, redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;