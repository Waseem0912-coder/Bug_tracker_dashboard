// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { getBugModifications } from '../services/api'; // Import API function
import { useTheme } from '@mui/material/styles'; // To access theme colors
import {
  Container, Typography, Box, CircularProgress, Alert, Paper
} from '@mui/material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'; // Import Recharts components

function DashboardPage() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme(); // Access the current MUI theme

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getBugModifications();
         // Optional: Sort data just in case API doesn't guarantee order
         data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setChartData(data);
      } catch (err) {
        setError('Failed to fetch chart data. Please try again later.');
        console.error("Fetch chart data error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []); // Fetch only on component mount

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom component="h1">
        Dashboard: Bug Modifications Over Time
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
        <Paper sx={{ p: 3, height: '60vh', width: '100%' }}> {/* Adjust height as needed */}
          {chartData.length === 0 ? (
             <Typography variant="h6" align="center" sx={{ pt: 5 }}>
                 No modification data available to display.
             </Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 0, // Adjust left margin if Y-axis labels are long
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                   dataKey="date"
                   stroke={theme.palette.text.secondary} // Use theme color for axis labels
                   // Optional: Format date tick labels if needed or angle them
                   // angle={-30}
                   // textAnchor="end"
                   // tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-CA')} // Example YYYY-MM-DD
                 />
                <YAxis
                  stroke={theme.palette.text.secondary}
                  allowDecimals={false} // Ensure integer counts on Y-axis
                />
                <Tooltip
                   contentStyle={{
                       backgroundColor: theme.palette.background.paper, // Match tooltip background
                       borderColor: theme.palette.divider,
                   }}
                   itemStyle={{ color: theme.palette.text.primary }}
                   labelStyle={{ color: theme.palette.text.primary, fontWeight: 'bold' }}
                />
                <Legend />
                <Bar
                  dataKey="count"
                  fill={theme.palette.primary.main} // Use theme's primary color for bars
                  name="Modifications" // Name shown in Legend and Tooltip
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