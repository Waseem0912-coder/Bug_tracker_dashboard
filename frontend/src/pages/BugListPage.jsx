// src/pages/BugListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getBugs } from '../services/api';
import {
  Container, Typography, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Link, Chip, TablePagination, Tooltip
} from '@mui/material';

// Helper function for chip colors
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

// Helper for date formatting
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleString(undefined, options);
    } catch (e) { return dateString; }
};

function BugListPage() {
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0); // 0-based index for MUI component
    const [rowsPerPage, setRowsPerPage] = useState(10); // Default page size
    const [totalBugs, setTotalBugs] = useState(0);

    // Use useCallback to memoize fetch function if needed, though useEffect handles dependencies
    const fetchBugs = useCallback(async (currentPage, currentRowsPerPage) => {
        setLoading(true);
        setError('');
        try {
            // API page is 1-based, MUI page is 0-based
            const data = await getBugs(currentPage + 1);
            setBugs(data.results);
            setTotalBugs(data.count);
        } catch (err) {
            console.error("Fetch bugs error:", err);
            setError('Failed to fetch bugs. Check connection or login status.');
            // Clear data on error
            setBugs([]);
            setTotalBugs(0);
        } finally {
            setLoading(false);
        }
    }, []); // No dependencies, API function doesn't change

    // Effect to fetch data when page or rowsPerPage changes
    useEffect(() => {
        console.log(`Fetching page ${page}, rows ${rowsPerPage}`);
        fetchBugs(page, rowsPerPage);
    }, [page, rowsPerPage, fetchBugs]); // Include fetchBugs if memoized

    // Handlers for MUI TablePagination
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setRowsPerPage(newRowsPerPage);
        setPage(0); // Go back to first page when changing rows per page
    };

    return (
        <Container maxWidth="lg"> {/* Or set maxWidth={false} for full width */}
            <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 3 }}>
                Bug Report List
            </Typography>

            {/* Display Loading Indicator */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Display Error Message */}
            {!loading && error && (
                <Alert severity="error" sx={{ my: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Display Table when not loading and no error */}
            {!loading && !error && (
                <Paper sx={{ width: '100%', mb: 2 }}> {/* Added margin bottom */}
                    <TableContainer> {/* Removed fixed height for now */}
                        <Table stickyHeader aria-label="bug list table">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Bug ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Last Updated</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bugs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            No bugs found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bugs.map((bug) => (
                                        <TableRow
                                            hover
                                            key={bug.id} // Use stable DB ID for key
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }} // Clean look
                                        >
                                            <TableCell component="th" scope="row">
                                                <Tooltip title="View Details">
                                                    <Link component={RouterLink} to={`/bugs/${bug.bug_id}`} underline="hover">
                                                        {bug.bug_id}
                                                    </Link>
                                                </Tooltip>
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
                                                {formatDate(bug.updated_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {/* Pagination Component */}
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div" // Important for layout
                        count={totalBugs}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        // sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}` }} // Optional top border
                    />
                </Paper>
            )}
        </Container>
    );
}

export default BugListPage;