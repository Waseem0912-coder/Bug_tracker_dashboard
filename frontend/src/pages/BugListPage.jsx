import React, { useState, useEffect, useCallback, useRef } from 'react'; 
import { Link as RouterLink } from 'react-router-dom';
import { getBugs } from '../services/api';
import {
  Container, Typography, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Link, Chip, TablePagination, Tooltip,
  TextField, InputAdornment 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search'; 
import { grey } from '@mui/material/colors';

const getChipColor = (value, type) => { 
    value = value?.toLowerCase(); type = type?.toLowerCase();
    if (type === 'status') { if (value === 'open') return 'warning'; if (value === 'in progress') return 'info'; if (value === 'resolved' || value === 'closed') return 'success'; }
    else if (type === 'priority') { if (value === 'high') return 'error'; if (value === 'medium') return 'warning'; if (value === 'low') return 'default'; }
    return 'default';
};

const formatDate = (dateString) => { 
    if (!dateString) return 'N/A'; try { const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }; return new Date(dateString).toLocaleString(undefined, options); }
    catch (e) { return dateString; }
};

function BugListPage() {
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalBugs, setTotalBugs] = useState(0);

    const [searchTerm, setSearchTerm] = useState(''); 
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); 
    const debounceTimeoutRef = useRef(null); 

    const handleSearchChange = (event) => {
        const newSearchTerm = event.target.value;
        setSearchTerm(newSearchTerm); 

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            console.log("Debounced search:", newSearchTerm);
            setDebouncedSearchTerm(newSearchTerm); 
             setPage(0); 
        }, 500); 
    };

    const fetchBugs = useCallback(async (currentPage, currentRowsPerPage, currentSearchTerm) => {
        setLoading(true);
        setError('');
        try {

            const data = await getBugs(currentPage + 1, currentRowsPerPage, currentSearchTerm);
            setBugs(data.results);
            setTotalBugs(data.count);
        } catch (err) {
            console.error("Fetch bugs error:", err);
            setError('Failed to fetch bugs.');
            setBugs([]); setTotalBugs(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        console.log(`Fetching page ${page}, rows ${rowsPerPage}, search: '${debouncedSearchTerm}'`);

        fetchBugs(page, rowsPerPage, debouncedSearchTerm);

    }, [page, rowsPerPage, debouncedSearchTerm, fetchBugs]);

    const handleChangePage = (event, newPage) => { setPage(newPage); };
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
                <Typography variant="h4" gutterBottom component="h1" sx={{ mb: { xs: 2, md: 0 } }}> {}
                    Bug Report List
                </Typography>
                {}
                <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search ID, Subject, Desc..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                        startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                        ),
                    }}
                    sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 300 } }} 
                />
                {}
            </Box>

            {loading && (<Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>)}
            {!loading && error && (<Alert severity="error" sx={{ my: 2 }}>{error}</Alert>)}
            {!loading && !error && (
                <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
                    <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table stickyHeader aria-label="bug list table">
                            <TableHead>
                                <TableRow>
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
                                            {debouncedSearchTerm ? `No bugs found matching "${debouncedSearchTerm}".` : "No bugs found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bugs.map((bug) => ( 
                                        <TableRow hover key={bug.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell component="th" scope="row"><Tooltip title="View Details"><Link component={RouterLink} to={`/bugs/${bug.bug_id}`} sx={{ fontWeight: 500 }}>{bug.bug_id}</Link></Tooltip></TableCell>
                                            <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><Tooltip title={bug.subject}><span>{bug.subject}</span></Tooltip></TableCell>
                                            <TableCell><Chip label={bug.status || 'N/A'} color={getChipColor(bug.status, 'status')} size="small"/></TableCell>
                                            <TableCell><Chip label={bug.priority || 'N/A'} color={getChipColor(bug.priority, 'priority')} size="small" sx={ getChipColor(bug.priority, 'priority') === 'default' ? { bgcolor: grey[700], color: grey[100] } : {} }/></TableCell>
                                            <TableCell>{formatDate(bug.updated_at)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]} component="div" count={totalBugs}
                        rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            )}
        </Container>
    );
}

export default BugListPage;