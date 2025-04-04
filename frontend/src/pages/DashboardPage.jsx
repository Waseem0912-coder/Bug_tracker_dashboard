import React, { useState, useEffect, useCallback } from 'react';
import { getBugModifications } from '../services/api';
import { useTheme } from '@mui/material/styles';
import {
  Container, Typography, Box, CircularProgress, Alert, Paper,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const PRIORITIES = ['all', 'high', 'medium', 'low'];

const getBarColor = (priority, theme) => {
    switch (priority?.toLowerCase()) {
        case 'high':
            return theme.palette.error.main; 
        case 'medium':
            return theme.palette.warning.main; 
        case 'low':
            return theme.palette.grey[500]; 
        case 'all':
        default:
            return theme.palette.primary.main; 
    }
};

function DashboardPage() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const theme = useTheme();

  const fetchChartData = useCallback(async (filterPriority) => {
    setLoading(true); setError('');
    try {
      const priorityParam = filterPriority === 'all' ? null : filterPriority;
      const data = await getBugModifications(priorityParam);
       data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setChartData(data);
    } catch (err) { setError('Failed to fetch chart data.'); console.error(`Fetch chart data error (Priority: ${filterPriority}):`, err); setChartData([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchChartData(selectedPriority); }, [selectedPriority, fetchChartData]);

  const handlePriorityChange = (event, newPriority) => { if (newPriority !== null) { setSelectedPriority(newPriority); } };

  const getChartTitle = () => {
      if (selectedPriority === 'all') return 'All Bug Modifications';
      const priorityName = selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1);
      return `${priorityName} Priority Bug Modifications`;
  }

  const currentBarColor = getBarColor(selectedPriority, theme);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 1 }}>Dashboard</Typography>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup value={selectedPriority} exclusive onChange={handlePriorityChange} aria-label="priority filter" size="small">
          {PRIORITIES.map((priority) => ( <ToggleButton key={priority} value={priority} aria-label={`${priority} priority`} sx={{ textTransform: 'capitalize', px: 2 }}>{priority}</ToggleButton> ))}
        </ToggleButtonGroup>
      </Box>

      {loading && (<Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>)}
      {!loading && error && (<Alert severity="error" sx={{ my: 2 }}>{error}</Alert>)}
      {!loading && !error && (
        <Paper sx={{ p: { xs: 1, sm: 2, md: 3 }, height: { xs: '50vh', md: '60vh'}, width: '100%', border: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" align="center" gutterBottom>{getChartTitle()}</Typography>
          {chartData.length === 0 ? (
             <Typography variant="body1" align="center" sx={{ pt: 5, color: 'text.secondary' }}>No modification data available for the selected filter.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height="90%">
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
                  fill={currentBarColor} 
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