// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import BugReportIcon from '@mui/icons-material/BugReport'; // App icon

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Local loading state

  const { login, authLoading } = useAuth(); // Get login function and auth loading state
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after successful login
  const from = location.state?.from?.pathname || "/"; // Default to home ('/')

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true); // Use local loading for button disable
    try {
      const success = await login(username, password); // Call context login
      if (success) {
        navigate(from, { replace: true }); // Navigate on success
      }
      // Context handles setting global state, we just navigate
    } catch (err) {
      console.error("Login page submit error:", err);
      const detail = err.response?.data?.detail; // Try to get specific backend error
      setError(detail || 'Login failed. Please check credentials or server connection.');
    } finally {
      setLoading(false); // Stop local loading indicator
    }
  };

  // Combine local loading and global auth loading for disabling form
  const isSubmitting = loading || authLoading;

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <BugReportIcon sx={{ m: 1, fontSize: 40 }} color="primary" />
        <Typography component="h1" variant="h5" gutterBottom>
          Bug Tracker Sign In
        </Typography>
        <Card sx={{ width: '100%', mt: 3 }}>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                  {error}
                </Alert>
              )}
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting} // Use combined loading state
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, position: 'relative' }} // Relative position for spinner
                disabled={isSubmitting}
              >
                Sign In
                {isSubmitting && ( // Show spinner on button if submitting
                  <CircularProgress
                    size={24}
                    color="inherit"
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: '-12px',
                      marginLeft: '-12px',
                    }}
                  />
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default LoginPage;