import React from 'react';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link'; 
import BugReportIcon from '@mui/icons-material/BugReport'; 

function MainLayout() {

  const { isAuthenticated, logout } = useAuth(); 
  const navigate = useNavigate();

  const handleLogout = async () => {

    await logout();

    navigate('/login', { replace: true });
  };

  return (

    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {}
      <AppBar component="nav" position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <BugReportIcon sx={{ mr: 1 }} /> {}
          <Typography
            variant="h6"
            component={RouterLink} 
            to="/"
            sx={{
              flexGrow: 1,
              color: 'inherit', 
              textDecoration: 'none', 
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Bug Tracker
          </Typography>

          {}
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
          {}
        </Toolbar>
      </AppBar>

      {}
      <Box component="main" sx={{ flexGrow: 1, width: '100%', py: 3 }}> {}
        {}
        <Container maxWidth="lg">
            {}
            <Outlet />
        </Container>
      </Box>

      {}
      {}
    </Box>
  );
}

export default MainLayout;