// src/pages/BugListPage.jsx
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom'; // For linking to detail page
import { getBugs } from '../services/api'; // Import API function
import {
  Container, Typography, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Link, Chip, TablePagination // Import table components
} from '@mui/material';

// Helper function to determine chip color based on status/priority
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
  return 'default'; // Default grey chip
};


function BugListPage() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0); // Corresponds to page_number - 1 for MUI TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10); // Match Django's PAGE_SIZE or allow selection
  const [totalBugs, setTotalBugs] = useState(0); // Total count from API

  // Fetch bugs when page or rowsPerPage changes
  useEffect(() => {
    const fetchBugs = async () => {
      setLoading(true);
      setError('');
      try {
         // API uses 1-based indexing for page, MUI uses 0-based
        const data = await getBugs(page + 1);
        setBugs(data.results || []); // Ensure results is an array
        setTotalBugs(data.count || 0); // Get total count
      } catch (err) {
        setError('Failed to fetch bugs. Please try again later.');
        console.error("Fetch bugs error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBugs();
  }, [page, rowsPerPage]); // Re-fetch when page or rowsPerPage changes

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when changing rows per page
  };


  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom component="h1">
        Bug List
      </Typography>

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

      {!loading && !error && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 640 }}> {/* Optional: Set max height for scroll */}
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <TableCell>Bug ID</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Updated At</TableCell> {/* Added Updated At */}
                </TableRow>
              </TableHead>
              <TableBody>
                {bugs.length === 0 ? (
                     <TableRow>
                         <TableCell colSpan={5} align="center">
                             No bugs found.
                         </TableCell>
                     </TableRow>
                 ) : (
                    bugs.map((bug) => (
                    <TableRow hover role="checkbox" tabIndex={-1} key={bug.id}>
                      <TableCell>
                        {/* Link to detail page */}
                        <Link component={RouterLink} to={`/bugs/${bug.bug_id}`} underline="hover">
                          {bug.bug_id}
                        </Link>
                      </TableCell>
                      <TableCell>{bug.subject}</TableCell>
                      <TableCell>
                         <Chip
                            label={bug.status || 'N/A'}
                            color={getChipColor(bug.status, 'status')}
                            size="small"
                          />
                      </TableCell>
                      <TableCell>
                         <Chip
                            label={bug.priority || 'N/A'}
                            color={getChipColor(bug.priority, 'priority')}
                            size="small"
                          />
                      </TableCell>
                       <TableCell>
                            {/* Format date nicely */}
                           {new Date(bug.updated_at).toLocaleString()}
                       </TableCell>
                    </TableRow>
                  ))
                 )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]} // Options for rows per page
            component="div"
            count={totalBugs} // Total number of bugs from API
            rowsPerPage={rowsPerPage}
            page={page} // Current page (0-based)
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Container>
  );
}

export default BugListPage;