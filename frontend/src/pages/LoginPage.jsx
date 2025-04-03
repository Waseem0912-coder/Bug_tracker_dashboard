// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// --- Add RouterLink for navigation ---
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
// ------------------------------------
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// --- Add Grid and MUI Link ---
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
// -----------------------------
import BugReportIcon from '@mui/icons-material/BugReport';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (event) => { /* ... as before ... */
    event.preventDefault(); setError(''); setLoading(true);
    try { const success = await login(username, password); if (success) { navigate(from, { replace: true }); } }
    catch (err) { const detail = err.response?.data?.detail; setError(detail || 'Login failed.'); }
    finally { setLoading(false); }
  };

  const isSubmitting = loading || authLoading;

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BugReportIcon sx={{ m: 1, fontSize: 40 }} color="primary" />
        <Typography component="h1" variant="h5" gutterBottom>Bug Tracker Sign In</Typography>
        <Card sx={{ width: '100%', mt: 3 }}>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              {error && (<Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>)}
              <TextField margin="normal" required fullWidth autoFocus id="username" label="Username" name="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isSubmitting} />
              <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, position: 'relative' }} disabled={isSubmitting} >
                Sign In
                {isSubmitting && (<CircularProgress size={24} color="inherit" sx={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px', }} /> )}
              </Button>
              {/* --- ADD SIGNUP LINK --- */}
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link component={RouterLink} to="/signup" variant="body2">
                    Don't have an account? Sign Up
                  </Link>
                </Grid>
              </Grid>
              {/* ----------------------- */}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default LoginPage;