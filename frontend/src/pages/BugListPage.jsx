// src/pages/BugListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getBugs } from '../services/api'; // Import API function
import {
  Container, Typography, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Link, Chip, TablePagination, Tooltip
} from '@mui/material';

// Helper function for chip colors adjusted for new theme
const getChipColor = (value, type) => {
    value = value?.toLowerCase();
    type = type?.toLowerCase();
    if (type === 'status') {
        if (value === 'open') return 'warning'; // Yellow
        if (value === 'in progress') return 'info'; // Blue
        if (value === 'resolved' || value === 'closed') return 'success'; // Green
    } else if (type === 'priority') {
        if (value === 'high') return 'error'; // Red
        if (value === 'medium') return 'warning'; // Yellow
        if (value === 'low') return 'info'; // Blue
    }
    return 'default'; // Default grey chip (might need styling via sx prop)
};

// Helper for date formatting
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleString(undefined, options);
    } catch (e) { console.error("Date format error:", e); return dateString; }
};

function BugListPage() {
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0); // 0-based index for MUI component
    const [rowsPerPage, setRowsPerPage] = useState(10); // Default page size
    const [totalBugs, setTotalBugs] = useState(0);

    // Use useCallback to memoize fetch function
    const fetchBugs = useCallback(async (currentPage, currentRowsPerPage) => {
        setLoading(true);
        setError('');
        try {
            // API page is 1-based, MUI page is 0-based
            // Pass rowsPerPage to API call
            const data = await getBugs(currentPage + 1, currentRowsPerPage);
            setBugs(data.results);
            setTotalBugs(data.count);
        } catch (err) {
            console.error("Fetch bugs error:", err);
            setError('Failed to fetch bugs. Check connection or login status.');
            setBugs([]); setTotalBugs(0); // Clear data on error
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array

    // Effect to fetch data when page or rowsPerPage changes
    useEffect(() => {
        console.log(`Fetching page ${page}, rows ${rowsPerPage}`);
        fetchBugs(page, rowsPerPage); // Pass current state values
    }, [page, rowsPerPage, fetchBugs]); // Include dependencies

    // Handlers for MUI TablePagination
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setRowsPerPage(newRowsPerPage);
        setPage(0); // Reset to first page
    };

    return (
        // Using Container to manage max width and padding
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 3 }}>
                Bug Report List
            </Typography>

            {/* Loading Indicator */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error Message */}
            {!loading && error && (
                <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
            )}

            {/* Table Display */}
            {!loading && !error && (
                // Paper provides the surface background and structure
                <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}> {/* Ensure overflow is hidden for pagination */}
                    <TableContainer sx={{ overflowX: 'auto' }}> {/* Allow horizontal scroll on small screens */}
                        <Table stickyHeader aria-label="bug list table">
                            <TableHead>
                                <TableRow>
                                    {/* Add sx for potential width adjustments */}
                                    <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Bug ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', minWidth: 250 }}>Subject</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>Priority</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', minWidth: 170 }}>Last Updated</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bugs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            No bugs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bugs.map((bug) => (
                                        <TableRow hover key={bug.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell component="th" scope="row">
                                                <Tooltip title="View Details">
                                                    {/* Ensure link uses theme color */}
                                                    <Link component={RouterLink} to={`/bugs/${bug.bug_id}`} sx={{ fontWeight: 500 }}>
                                                        {bug.bug_id}
                                                    </Link>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <Tooltip title={bug.subject}>
                                                    <span>{bug.subject}</span>
                                                </Tooltip>
                                            </TableCell>
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
                                                {formatDate(bug.updated_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {/* Pagination */}
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]} // Added 100 option
                        component="div"
                        count={totalBugs}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            )}
        </Container>
    );
}

export default BugListPage;