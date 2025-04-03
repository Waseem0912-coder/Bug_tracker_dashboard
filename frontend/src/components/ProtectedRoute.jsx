// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

const ProtectedRoute = () => {
  // Get auth state and loading status from context
  // Using authLoading might be too broad if we add other async auth actions later,
  // but for now it primarily covers login/logout transitions.
  // A dedicated 'initialAuthCheckLoading' state might be better in a complex app.
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation(); // Get current location

  // Optional: Show a loading indicator while auth state is potentially being determined
  // This is more relevant if you add an initial async check in AuthContext
  if (authLoading) {
      // You might want a more centered loading indicator here
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
          </Box>
      );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Pass the current location object in state
    // So LoginPage can redirect back after successful login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the nested child route component
  return <Outlet />;
};

export default ProtectedRoute;