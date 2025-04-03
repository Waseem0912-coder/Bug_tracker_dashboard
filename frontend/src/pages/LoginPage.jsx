// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook
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

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Local loading state for button

  const { login } = useAuth(); // Get login function from context
  const navigate = useNavigate();
  const location = useLocation();

  // Determine where to redirect after login
  const from = location.state?.from?.pathname || "/"; // Redirect to previous page or home

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setError(''); // Clear previous errors
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        navigate(from, { replace: true }); // Redirect on success
      }
      // If login throws error, it's caught below
    } catch (err) {
      console.error("Login page submit error:", err);
      // Try to get specific error message from backend response
      const detail = err.response?.data?.detail;
      setError(detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
        <Card sx={{ width: '100%', mt: 1 }}>
          <CardContent>
            <Typography component="h1" variant="h5" align="center" gutterBottom>
              Sign In
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
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
                disabled={loading}
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
                disabled={loading}
              />
              {/* Add Remember Me later if needed */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
              {/* Add Links for Forgot Password or Sign Up later if needed */}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default LoginPage;