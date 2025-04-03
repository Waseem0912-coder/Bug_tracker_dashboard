// src/pages/BugDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
// --- Import the new update function ---
import { getBugById, updateBugStatus } from '../services/api';
// -------------------------------------
import {
  Container, Typography, Box, CircularProgress, Alert,
  Grid, Chip, Divider, Link, Breadcrumbs, Paper,
  // --- Add Select components ---
  Select, MenuItem, FormControl, InputLabel, FormHelperText
  // ---------------------------
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { grey } from '@mui/material/colors'; // For default chip

// Chip color helper (updated for low priority)
const getChipColor = (value, type) => {
    value = value?.toLowerCase(); type = type?.toLowerCase();
    if (type === 'status') { if (value === 'open') return 'warning'; if (value === 'in progress') return 'info'; if (value === 'resolved' || value === 'closed') return 'success'; }
    else if (type === 'priority') { if (value === 'high') return 'error'; if (value === 'medium') return 'warning'; if (value === 'low') return 'default'; }
    return 'default';
};

// Date format helper
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }; return new Date(dateString).toLocaleString(undefined, options); }
    catch (e) { return dateString; }
};

// --- Define Status Choices Consistently ---
// These should match the keys in your Django Bug.Status choices
const STATUS_CHOICES = [
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
];
// ----------------------------------------

function BugDetailPage() {
  const { bugId } = useParams();
  const [bug, setBug] = useState(null); // Holds the full bug data object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false); // Loading state for status update
  const [updateError, setUpdateError] = useState(''); // Specific error for status update

  // Memoized fetch function
  const fetchBugDetails = useCallback(async () => {
     if (!bugId) { setError('No Bug ID specified.'); setLoading(false); return; }
     setLoading(true); setError(''); setUpdateError(''); setBug(null);
     try { const data = await getBugById(bugId); setBug(data); }
     catch (err) { console.error(`Fetch bug ${bugId} error:`, err); setError(err.response?.status === 404 ? `Bug "${bugId}" not found.` : 'Failed to load details.'); }
     finally { setLoading(false); }
  }, [bugId]);

  // Fetch data on mount or when bugId changes
  useEffect(() => { fetchBugDetails(); }, [fetchBugDetails]);

  // --- Handler for status dropdown change ---
  const handleStatusChange = async (event) => {
      const newStatusKey = event.target.value;
      if (!bug || !newStatusKey || isUpdating || newStatusKey === bug.status_key) {
          return; // Prevent action if no bug, no status, updating, or status unchanged
      }
      setIsUpdating(true);
      setUpdateError(''); // Clear previous update errors
      setError(''); // Clear general page errors
      try {
          console.log(`Attempting to update status for ${bug.bug_id} to ${newStatusKey}`);
          // Call the API function with the bug's unique ID and the NEW status key
          const updatedBugData = await updateBugStatus(bug.bug_id, newStatusKey);
          // Update the local state with the full bug data returned by the API
          setBug(updatedBugData);
          console.log("Status updated successfully:", updatedBugData);
          // TODO: Consider adding a success Snackbar message here
      } catch (updateError) {
          console.error("Status update API error:", updateError);
          const apiErrorMessage = updateError.response?.data?.detail || updateError.message;
          // Display a specific error message near the dropdown
          setUpdateError(`Update failed: ${apiErrorMessage || 'Please try again.'}`);
          // TODO: Consider adding an error Snackbar message here
      } finally {
          setIsUpdating(false);
      }
  };
  // -----------------------------------------

  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link component={RouterLink} underline="hover" color="inherit" to="/">Bug List</Link>
          <Typography color="text.primary">{loading ? 'Loading...' : (bug ? bugId : 'Error')}</Typography>
      </Breadcrumbs>

      {/* Loading State */}
      {loading && (<Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>)}

      {/* Page Level Error State (for initial fetch) */}
      {!loading && error && (<Alert severity="error" sx={{ my: 2 }}>{error}</Alert>)}

      {/* Content Display State */}
      {!loading && !error && bug && (
        <Paper elevation={0} sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h5" component="h1" gutterBottom>Bug Details: {bug.bug_id}</Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            {/* Left Column */}
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

            {/* Right Column */}
            <Grid item xs={12} md={4}>
               {/* --- Status Display and Update Control --- */}
               <Box sx={{ mb: 3 }}>
                 <FormControl fullWidth size="small" error={!!updateError}> {/* Add error prop */}
                   <InputLabel id="status-select-label">Status</InputLabel>
                   <Select
                     labelId="status-select-label"
                     id="status-select"
                     // Value MUST be the internal key (e.g., 'in_progress') from bug.status_key
                     value={bug.status_key || ''}
                     label="Status"
                     onChange={handleStatusChange}
                     disabled={isUpdating || loading} // Disable while loading page or updating status
                   >
                     {/* Map over defined choices */}
                     {STATUS_CHOICES.map((choice) => (
                         <MenuItem key={choice.key} value={choice.key}>
                             {choice.label}
                         </MenuItem>
                     ))}
                   </Select>
                   {/* Display update error message below dropdown */}
                   {updateError && <FormHelperText>{updateError}</FormHelperText>}
                 </FormControl>
                 {isUpdating && <CircularProgress size={20} sx={{ ml: 1, mt: 1, verticalAlign: 'middle' }} />}
               </Box>
               {/* ----------------------------------------- */}

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