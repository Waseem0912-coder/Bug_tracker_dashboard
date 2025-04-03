// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Option 1: Using Outlet for nested routes (recommended)
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />; // Render the child route element (page)
};

// Option 2: Wrapping a specific component (less common with modern react-router)
// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated } = useAuth();
//   const location = useLocation();
//
//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }
//
//   return children;
// };

export default ProtectedRoute;