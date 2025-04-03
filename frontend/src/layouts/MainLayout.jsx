// src/layouts/MainLayout.jsx
import React, { useState } from 'react';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link'; // MUI Link for styling consistency
import BugReportIcon from '@mui/icons-material/BugReport'; // Example icon

function MainLayout() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar component="nav" position="static"> {/* Use static position for simplicity */}
        <Toolbar>
          <BugReportIcon sx={{ mr: 2 }} /> {/* App icon */}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} // Hide on extra small screens
          >
            Bug Tracker
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}> {/* Nav links */}
             <Link component={RouterLink} to="/" sx={{ color: '#fff', mr: 2 }} underline="hover">
              Bug List
             </Link>
             <Link component={RouterLink} to="/dashboard" sx={{ color: '#fff', mr: 2 }} underline="hover">
               Dashboard
             </Link>
             {isAuthenticated ? (
                <Button onClick={handleLogout} color="inherit">
                  Logout
                </Button>
              ) : (
                <Button component={RouterLink} to="/login" color="inherit">
                  Login
                </Button>
              )}
          </Box>
          {/* Add mobile navigation (Drawer) later if needed */}
        </Toolbar>
      </AppBar>

      {/* Main content area - Rendered by nested routes */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
        {/* Add Toolbar spacer if using position="fixed" AppBar, not needed for static */}
        {/* <Toolbar />  */}
        <Container maxWidth="lg"> {/* Limit content width */}
            <Outlet /> {/* Child routes will render here */}
        </Container>
      </Box>
    </Box>
  );
}

export default MainLayout;