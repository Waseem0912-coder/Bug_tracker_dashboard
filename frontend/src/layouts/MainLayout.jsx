// src/layouts/MainLayout.jsx
import React from 'react';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link'; // Use MUI Link for consistency
import BugReportIcon from '@mui/icons-material/BugReport'; // Ensure @mui/icons-material is installed

function MainLayout() {
  // Get isAuthenticated state and logout function from context
  const { isAuthenticated, logout } = useAuth(); // Assuming useAuth provides logout
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Call the logout function from the context
    await logout();
    // Redirect to login page after logout logic completes
    navigate('/login', { replace: true });
  };

  return (
    // Using Box as a flex container to manage layout
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <AppBar component="nav" position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <BugReportIcon sx={{ mr: 1 }} /> {/* Icon */}
          <Typography
            variant="h6"
            component={RouterLink} // Make title a link to home
            to="/"
            sx={{
              flexGrow: 1,
              color: 'inherit', // Inherit color from AppBar
              textDecoration: 'none', // Remove underline from link
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Bug Tracker
          </Typography>

          {/* Desktop Navigation Links */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {isAuthenticated ? (
              <>
                <Button component={RouterLink} to="/" color="inherit">
                  Bug List
                </Button>
                <Button component={RouterLink} to="/dashboard" color="inherit">
                  Dashboard
                </Button>
                <Button onClick={handleLogout} color="inherit">
                  Logout
                </Button>
              </>
            ) : (
              <Button component={RouterLink} to="/login" color="inherit">
                Login
              </Button>
            )}
          </Box>
          {/* Consider adding a Mobile Drawer/Menu Button here later */}
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, width: '100%', py: 3 }}> {/* Add vertical padding */}
        {/* Container limits content width and centers it */}
        <Container maxWidth="lg">
            {/* Nested routes defined in App.jsx will render their element here */}
            <Outlet />
        </Container>
      </Box>

      {/* Optional Footer */}
      {/* <Box component="footer" sx={{ py: 2, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.background.paper }}>
          <Typography variant="body2" color="text.secondary" align="center">
            {'Copyright © '}
            <Link color="inherit" href="#">Your Website</Link>{' '}
            {new Date().getFullYear()}
            {'.'}
          </Typography>
      </Box> */}
    </Box>
  );
}

export default MainLayout;