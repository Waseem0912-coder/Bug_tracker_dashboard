// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { getBugModifications } from '../services/api';
import { useTheme } from '@mui/material/styles';
import {
  Container, Typography, Box, CircularProgress, Alert, Paper,
  ToggleButton, ToggleButtonGroup // Import ToggleButton components
} from '@mui/material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const PRIORITIES = ['all', 'high', 'medium', 'low']; // Define available filters

function DashboardPage() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // State for the selected priority filter, default to 'all'
  const [selectedPriority, setSelectedPriority] = useState('all');
  const theme = useTheme();

  // Memoize fetch function
  const fetchChartData = useCallback(async (filterPriority) => {
    setLoading(true);
    setError('');
    try {
      // Pass null if 'all' is selected, otherwise pass the priority value
      const priorityParam = filterPriority === 'all' ? null : filterPriority;
      const data = await getBugModifications(priorityParam);
       data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setChartData(data);
      console.log(`Chart Data Received (Priority: ${filterPriority}):`, data);
    } catch (err) {
      setError('Failed to fetch chart data. Please try again later.');
      console.error(`Fetch chart data error (Priority: ${filterPriority}):`, err);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed for the function itself

  // Effect to fetch data when selectedPriority changes
  useEffect(() => {
    fetchChartData(selectedPriority);
  }, [selectedPriority, fetchChartData]); // Re-fetch when filter changes

  // Handler for ToggleButtonGroup change
  const handlePriorityChange = (event, newPriority) => {
    // ToggleButtonGroup sends null if the same button is clicked again
    // Ensure we always have a value, default back to 'all'
    if (newPriority !== null) {
      setSelectedPriority(newPriority);
    } else {
        // Optional: Prevent deselecting all, keep current selection or default to 'all'
        // setSelectedPriority('all'); // Or keep the current value by doing nothing
    }
  };

  // Dynamic title based on filter
  const getChartTitle = () => {
      if (selectedPriority === 'all') return 'All Bug Modifications';
      // Capitalize first letter
      const priorityName = selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1);
      return `${priorityName} Priority Bug Modifications`;
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 1 }}>
        Dashboard
      </Typography>

      {/* Filter Controls */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={selectedPriority}
          exclusive // Only one button can be selected at a time
          onChange={handlePriorityChange}
          aria-label="priority filter"
          size="small" // Smaller buttons
        >
          {PRIORITIES.map((priority) => (
            <ToggleButton key={priority} value={priority} aria-label={`${priority} priority`} sx={{ textTransform: 'capitalize', px: 2 }}>
              {priority}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Loading State */}
      {loading && ( /* ... as before ... */
         <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
            <CircularProgress />
         </Box>
      )}

      {/* Error State */}
      {!loading && error && ( /* ... as before ... */
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      )}

      {/* Chart Display State */}
      {!loading && !error && (
        <Paper sx={{ p: { xs: 1, sm: 2, md: 3 }, height: { xs: '50vh', md: '60vh'}, width: '100%' }}>
          {/* Dynamic Title */}
          <Typography variant="h6" align="center" gutterBottom>
              {getChartTitle()}
          </Typography>

          {chartData.length === 0 ? ( /* ... No data message ... */
             <Typography variant="body1" align="center" sx={{ pt: 5, color: 'text.secondary' }}>
                 No modification data available for the selected filter.
             </Typography>
          ) : (
            <ResponsiveContainer width="100%" height="90%"> {/* Adjust height slightly for title */}
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }} barGap={4} >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="date" stroke={theme.palette.text.secondary} tick={{ fontSize: 12 }} />
                <YAxis stroke={theme.palette.text.secondary} allowDecimals={false} width={30} tick={{ fontSize: 12 }} />
                <Tooltip
                   cursor={{ fill: theme.palette.action.hover }}
                   contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider, borderRadius: '4px' }}
                   itemStyle={{ color: theme.palette.text.primary }}
                   labelStyle={{ color: theme.palette.text.primary, fontWeight: 'bold', marginBottom: '5px' }}
                   formatter={(value, name) => [`${value} modification(s)`, name]}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar
                  dataKey="count"
                  fill={theme.palette.primary.main}
                  name="Modifications"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>
      )}
    </Container>
  );
}

export default DashboardPage;