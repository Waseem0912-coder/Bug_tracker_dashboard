// src/pages/BugDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getBugById } from '../services/api'; // Import the API function
import {
  Container, Typography, Box, CircularProgress, Alert,
  Card, CardContent, CardHeader, Grid, Chip, Divider, Link,
  Breadcrumbs // For navigation context
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext'; // For breadcrumbs

// Re-use the chip color helper function from BugListPage
const getChipColor = (value, type) => {
   value = value?.toLowerCase();
   type = type?.toLowerCase();
   if (type === 'status') {
       if (value === 'open') return 'warning';
       if (value === 'in progress') return 'info';
       if (value === 'resolved' || value === 'closed') return 'success';
   } else if (type === 'priority') {
       if (value === 'high') return 'error';
       if (value === 'medium') return 'warning';
       if (value === 'low') return 'info';
   }
   return 'default';
};

// Helper to format dates
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
};

function BugDetailPage() {
  const { bugId } = useParams(); // Get bugId from URL parameter
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBugDetails = async () => {
      if (!bugId) {
        setError('No Bug ID provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const data = await getBugById(bugId);
        setBug(data);
      } catch (err) {
         if (err.response?.status === 404) {
             setError(`Bug with ID "${bugId}" not found.`);
         } else {
            setError('Failed to fetch bug details. Please try again later.');
         }
        console.error(`Fetch bug ${bugId} error:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchBugDetails();
  }, [bugId]); // Re-fetch if bugId changes

  return (
    <Container maxWidth="md"> {/* Using medium width for detail view */}
       {/* Breadcrumbs for navigation context */}
       <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
           <Link component={RouterLink} underline="hover" color="inherit" to="/">
             Bug List
           </Link>
           <Typography color="text.primary">{loading ? 'Loading...' : bugId}</Typography>
       </Breadcrumbs>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && bug && (
        <Card>
          <CardHeader
            title={`Bug Details: ${bug.bug_id}`}
            subheader={`Last updated: ${formatDate(bug.updated_at)}`}
          />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              {/* Subject */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Subject</Typography>
                <Typography variant="body1">{bug.subject || 'N/A'}</Typography>
              </Grid>

              <Divider flexItem sx={{ my: 1, width: '100%' }} />

              {/* Status and Priority */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Status</Typography>
                <Chip
                   label={bug.status || 'N/A'}
                   color={getChipColor(bug.status, 'status')}
                   size="medium"
                 />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Priority</Typography>
                 <Chip
                    label={bug.priority || 'N/A'}
                    color={getChipColor(bug.priority, 'priority')}
                    size="medium"
                  />
              </Grid>

               <Divider flexItem sx={{ my: 1, width: '100%' }} />

              {/* Description */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Description</Typography>
                {/* Use pre-wrap to preserve whitespace/newlines from description */}
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                    {bug.description || 'N/A'}
                </Typography>
              </Grid>

              <Divider flexItem sx={{ my: 1, width: '100%' }} />

              {/* Timestamps and Count */}
              <Grid item xs={12} sm={4}>
                 <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Created At</Typography>
                 <Typography variant="body2">{formatDate(bug.created_at)}</Typography>
              </Grid>
               <Grid item xs={12} sm={4}>
                 <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Last Updated</Typography>
                 <Typography variant="body2">{formatDate(bug.updated_at)}</Typography>
               </Grid>
               <Grid item xs={12} sm={4}>
                 <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Modified Count</Typography>
                 <Typography variant="body2">{bug.modified_count ?? 'N/A'}</Typography>
               </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default BugDetailPage;