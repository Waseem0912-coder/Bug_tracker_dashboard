import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api'; 
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Link from '@mui/material/Link'; 
import Grid from '@mui/material/Grid'; 
import BugReportIcon from '@mui/icons-material/BugReport';

function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '', 
  });
  const [error, setError] = useState(''); 
  const [fieldErrors, setFieldErrors] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); 
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));

    if (fieldErrors[name]) {
        setFieldErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
    }

    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setSuccess(false);

    if (formData.password !== formData.password2) {
      setFieldErrors({ password2: "Passwords do not match." });
      return;
    }
    if (!formData.username || !formData.email || !formData.password) {
        setError("Please fill in all required fields.");
        return;
    }

    setLoading(true);
    try {
      const response = await registerUser(formData);
      console.log("Registration successful:", response);
      setSuccess(true); 

      setTimeout(() => navigate('/login'), 3000); 

    } catch (err) {
      console.error("Signup page submit error:", err);
      const responseData = err.response?.data;

      if (responseData && typeof responseData === 'object') {

         const backendErrors = {};
         for (const key in responseData) {
             if (Array.isArray(responseData[key])) {
                backendErrors[key] = responseData[key].join(' '); 
             }
         }
         if (Object.keys(backendErrors).length > 0) {
            setFieldErrors(backendErrors);
         } else {

              setError(responseData.detail || "Registration failed. Please check your input or try again later.");
         }

      } else {
         setError("Registration failed. An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BugReportIcon sx={{ m: 1, fontSize: 40 }} color="primary" />
        <Typography component="h1" variant="h5" gutterBottom>Sign Up</Typography>
        <Card sx={{ width: '100%', mt: 3 }}>
          <CardContent>
            {success ? (
                 <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                    Registration successful! Redirecting to login...
                 </Alert>
             ) : (
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                {}
                {error && !success && ( <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert> )}

                <TextField
                  margin="normal" required fullWidth autoFocus
                  id="username" label="Username" name="username" autoComplete="username"
                  value={formData.username} onChange={handleChange} disabled={loading}
                  error={!!fieldErrors.username} helperText={fieldErrors.username}
                />
                <TextField
                  margin="normal" required fullWidth
                  id="email" label="Email Address" name="email" autoComplete="email" type="email"
                  value={formData.email} onChange={handleChange} disabled={loading}
                  error={!!fieldErrors.email} helperText={fieldErrors.email}
                />
                <TextField
                  margin="normal" required fullWidth
                  name="password" label="Password" type="password" id="password" autoComplete="new-password"
                  value={formData.password} onChange={handleChange} disabled={loading}
                  error={!!fieldErrors.password} helperText={fieldErrors.password || "Use 8+ chars, letters, numbers, symbols."} 
                />
                 <TextField
                  margin="normal" required fullWidth
                  name="password2" label="Confirm Password" type="password" id="password2" autoComplete="new-password"
                  value={formData.password2} onChange={handleChange} disabled={loading}
                  error={!!fieldErrors.password2} helperText={fieldErrors.password2}
                />
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, position: 'relative' }} disabled={loading} >
                  Sign Up
                  {loading && (<CircularProgress size={24} color="inherit" sx={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px', }} /> )}
                </Button>
                <Grid container justifyContent="flex-end">
                  <Grid item>
                    <Link component={RouterLink} to="/login" variant="body2">
                      Already have an account? Sign in
                    </Link>
                  </Grid>
                </Grid>
              </Box>
             )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default SignupPage;