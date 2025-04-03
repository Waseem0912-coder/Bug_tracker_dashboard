// src/pages/BugDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getBugById } from '../services/api';
import {
  Container, Typography, Box, CircularProgress, Alert,
  Card, CardContent, CardHeader, Grid, Chip, Divider, Link,
  Breadcrumbs, Paper // Use Paper for elevation/background
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// Re-use chip color helper
const getChipColor = (value, type) => {
    value = value?.toLowerCase(); type = type?.toLowerCase();
    if (type === 'status') { /* ... same as list page ... */
        if (value === 'open') return 'warning'; if (value === 'in progress') return 'info'; if (value === 'resolved' || value === 'closed') return 'success';
    } else if (type === 'priority') { /* ... same as list page ... */
        if (value === 'high') return 'error'; if (value === 'medium') return 'warning'; if (value === 'low') return 'info';
    } return 'default';
};

// Re-use date format helper
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }; return new Date(dateString).toLocaleString(undefined, options); }
    catch (e) { return dateString; }
};

function BugDetailPage() {
  const { bugId } = useParams(); // Get bugId from URL
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBugDetails = async () => {
      if (!bugId) { setError('No Bug ID specified.'); setLoading(false); return; }
      setLoading(true); setError(''); setBug(null); // Reset on new fetch
      try {
        const data = await getBugById(bugId);
        setBug(data);
      } catch (err) {
        console.error(`Fetch bug ${bugId} error:`, err);
        setError(err.response?.status === 404 ? `Bug with ID "${bugId}" not found.` : 'Failed to load bug details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBugDetails();
  }, [bugId]); // Re-run effect if bugId changes

  return (
    <Container maxWidth="lg"> {/* Consistent width with list */}
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link component={RouterLink} underline="hover" color="inherit" to="/">
            Bug List
          </Link>
          {/* Show loading or actual bugId */}
          <Typography color="text.primary">{loading ? 'Loading...' : (bug ? bugId : 'Error')}</Typography>
      </Breadcrumbs>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {!loading && error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {/* Content Display State */}
      {!loading && !error && bug && (
        <Paper elevation={3} sx={{ p: 3 }}> {/* Wrap content in Paper */}
          <Typography variant="h5" component="h1" gutterBottom>
             Bug Details: {bug.bug_id}
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}> {/* Increased spacing */}
            {/* Left Column: Description, Timestamps */}
            <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>Subject</Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>{bug.subject || 'N/A'}</Typography>

                <Typography variant="h6" gutterBottom>Description</Typography>
                <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', bgcolor: 'action.hover', p: 2, borderRadius: 1, mb: 3, overflowX: 'auto' }}>
                    {bug.description || 'N/A'}
                </Box>

                <Typography variant="body2" color="text.secondary">
                    Created: {formatDate(bug.created_at)}
                </Typography>
                 <Typography variant="body2" color="text.secondary">
                    Last Updated: {formatDate(bug.updated_at)}
                </Typography>

            </Grid>

            {/* Right Column: Status, Priority, Count */}
            <Grid item xs={12} md={4}>
               <Box sx={{ mb: 3 }}>
                 <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Status</Typography>
                 <Chip label={bug.status || 'N/A'} color={getChipColor(bug.status, 'status')} />
               </Box>
               <Box sx={{ mb: 3 }}>
                 <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Priority</Typography>
                 <Chip label={bug.priority || 'N/A'} color={getChipColor(bug.priority, 'priority')} />
               </Box>
                <Box sx={{ mb: 3 }}>
                 <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Modified Count</Typography>
                 <Typography variant="body1">{bug.modified_count ?? 'N/A'}</Typography>
               </Box>
                 {/* Add other fields like Reporter/Assignee here if implemented later */}
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
}

export default BugDetailPage;