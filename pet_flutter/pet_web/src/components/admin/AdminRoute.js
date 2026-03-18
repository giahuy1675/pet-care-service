import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// AdminRoute chỉ làm nhiệm vụ xác thực và bảo vệ routes
const AdminRoute = ({ children }) => {
  const auth = useAuth();
  const user = auth?.user;
  const loading = auth?.loading;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: { pathname: '/admin' } }} replace />;
  }

  if (user.role !== 'Admin' && user.role !== 'Staff') {
    return <Navigate to="/" replace />;
  }

  // Nếu là Admin/Staff, hiển thị component con
  return children;
};

export default AdminRoute;
