import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';

import { getBugById, updateBugStatus } from '../services/api';

import {
  Container, Typography, Box, CircularProgress, Alert,
  Grid, Chip, Divider, Link, Breadcrumbs, Paper,

  Select, MenuItem, FormControl, InputLabel, FormHelperText

} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { grey } from '@mui/material/colors'; 

const getChipColor = (value, type) => {
    value = value?.toLowerCase(); type = type?.toLowerCase();
    if (type === 'status') { if (value === 'open') return 'warning'; if (value === 'in progress') return 'info'; if (value === 'resolved' || value === 'closed') return 'success'; }
    else if (type === 'priority') { if (value === 'high') return 'error'; if (value === 'medium') return 'warning'; if (value === 'low') return 'default'; }
    return 'default';
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }; return new Date(dateString).toLocaleString(undefined, options); }
    catch (e) { return dateString; }
};

const STATUS_CHOICES = [
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
];

function BugDetailPage() {
  const { bugId } = useParams();
  const [bug, setBug] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false); 
  const [updateError, setUpdateError] = useState(''); 

  const fetchBugDetails = useCallback(async () => {
     if (!bugId) { setError('No Bug ID specified.'); setLoading(false); return; }
     setLoading(true); setError(''); setUpdateError(''); setBug(null);
     try { const data = await getBugById(bugId); setBug(data); }
     catch (err) { console.error(`Fetch bug ${bugId} error:`, err); setError(err.response?.status === 404 ? `Bug "${bugId}" not found.` : 'Failed to load details.'); }
     finally { setLoading(false); }
  }, [bugId]);

  useEffect(() => { fetchBugDetails(); }, [fetchBugDetails]);

  const handleStatusChange = async (event) => {
      const newStatusKey = event.target.value;
      if (!bug || !newStatusKey || isUpdating || newStatusKey === bug.status_key) {
          return; 
      }
      setIsUpdating(true);
      setUpdateError(''); 
      setError(''); 
      try {
          console.log(`Attempting to update status for ${bug.bug_id} to ${newStatusKey}`);

          const updatedBugData = await updateBugStatus(bug.bug_id, newStatusKey);

          setBug(updatedBugData);
          console.log("Status updated successfully:", updatedBugData);

      } catch (updateError) {
          console.error("Status update API error:", updateError);
          const apiErrorMessage = updateError.response?.data?.detail || updateError.message;

          setUpdateError(`Update failed: ${apiErrorMessage || 'Please try again.'}`);

      } finally {
          setIsUpdating(false);
      }
  };

  return (
    <Container maxWidth="lg">
      {}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link component={RouterLink} underline="hover" color="inherit" to="/">Bug List</Link>
          <Typography color="text.primary">{loading ? 'Loading...' : (bug ? bugId : 'Error')}</Typography>
      </Breadcrumbs>

      {}
      {loading && (<Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>)}

      {}
      {!loading && error && (<Alert severity="error" sx={{ my: 2 }}>{error}</Alert>)}

      {}
      {!loading && !error && bug && (
        <Paper elevation={0} sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h5" component="h1" gutterBottom>Bug Details: {bug.bug_id}</Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            {}
            <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>Subject</Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>{bug.subject || 'N/A'}</Typography>
                <Typography variant="h6" gutterBottom>Description</Typography>
                <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', bgcolor: 'action.hover', p: 2, borderRadius: 1, mb: 3, overflowX: 'auto', maxHeight: '400px' }}>
                    {bug.description || 'N/A'}
                </Box>
                <Typography variant="body2" color="text.secondary">Created: {formatDate(bug.created_at)}</Typography>
                 <Typography variant="body2" color="text.secondary">Last Updated: {formatDate(bug.updated_at)}</Typography>
            </Grid>

            {}
            <Grid item xs={12} md={4}>
               {}
               <Box sx={{ mb: 3 }}>
                 <FormControl fullWidth size="small" error={!!updateError}> {}
                   <InputLabel id="status-select-label">Status</InputLabel>
                   <Select
                     labelId="status-select-label"
                     id="status-select"

                     value={bug.status_key || ''}
                     label="Status"
                     onChange={handleStatusChange}
                     disabled={isUpdating || loading} 
                   >
                     {}
                     {STATUS_CHOICES.map((choice) => (
                         <MenuItem key={choice.key} value={choice.key}>
                             {choice.label}
                         </MenuItem>
                     ))}
                   </Select>
                   {}
                   {updateError && <FormHelperText>{updateError}</FormHelperText>}
                 </FormControl>
                 {isUpdating && <CircularProgress size={20} sx={{ ml: 1, mt: 1, verticalAlign: 'middle' }} />}
               </Box>
               {}

               <Box sx={{ mb: 3 }}>
                 <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Priority</Typography>
                 <Chip label={bug.priority || 'N/A'} color={getChipColor(bug.priority, 'priority')} sx={ getChipColor(bug.priority, 'priority') === 'default' ? { bgcolor: grey[700], color: grey[100] } : {} }/>
               </Box>
                <Box sx={{ mb: 3 }}>
                 <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Modified Count</Typography>
                 <Typography variant="body1">{bug.modified_count ?? 'N/A'}</Typography>
               </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
}

export default BugDetailPage;