// src/theme/theme.js
import { createTheme } from '@mui/material/styles';
import { blueGrey, grey, indigo, pink, red, green, orange, blue } from '@mui/material/colors';

// Define the dark theme based on the provided image's aesthetic
const darkTheme = createTheme({
  palette: {
    mode: 'dark', // Enable dark mode
    primary: {
      // Main interactive color (e.g., buttons, links, accents)
      // Using a shade of indigo/blue like in the example's highlights
      main: indigo[300],
    },
    secondary: {
      // Secondary interactive color (can adjust)
      main: pink['A200'], // A contrasting accent
    },
    background: {
      // Main background color (dark navy/purple)
      default: '#1e1a3e', // Dark purple/navy base
      paper: '#2a2652',   // Slightly lighter for surfaces like Cards, Tables, AppBar
    },
    text: {
      // Default text colors
      primary: grey[200],   // Light grey for primary text
      secondary: grey[400], // Dimmer grey for secondary text
    },
    // Define specific colors for statuses/priorities if needed directly
    // Or map status/priority values to these in components
    error: {
      main: red[500], // Example for 'Critical' or errors
    },
    warning: {
      main: orange[400], // Example for 'High' priority maybe?
    },
    info: {
      main: blue[400], // Example for 'Medium' priority?
    },
    success: {
      main: green[500], // Example for 'Resolved'/'Fixed' status
    },
    divider: blueGrey[700], // Color for dividers
  },
  typography: {
    // Optional: Adjust font sizes, families etc.
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 500 },
    h2: { fontSize: '2rem', fontWeight: 500 },
    h3: { fontSize: '1.75rem', fontWeight: 500 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1.1rem', fontWeight: 500, color: grey[300] }, // Example: Title color like "Incoming bugs"
    // You can customize body, button, caption typography too
  },
  components: {
    // Optional: Override default styles for specific components
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Use paper background for AppBar to match example
          backgroundColor: '#2a2652',
          // Add a subtle bottom border if desired
          // borderBottom: `1px solid ${blueGrey[700]}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
         root: {
             // Ensure paper surfaces use the slightly lighter background
             backgroundColor: '#2a2652',
         }
      }
    },
     MuiTableContainer: {
        styleOverrides: {
            root: {
                // Make table container background match paper
                backgroundColor: '#2a2652',
            }
        }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          // Style table headers
          color: grey[400],
          fontWeight: 'bold',
        },
        body: {
          // Style table body cells
          color: grey[200],
          // Add subtle borders if desired
          // borderColor: blueGrey[800],
        }
      }
    },
    MuiButton: {
        styleOverrides: {
            root: {
                textTransform: 'none', // Buttons often look better without ALL CAPS
            }
        }
    },
    MuiChip: { // For Status/Priority badges
        styleOverrides: {
            root: {
                borderRadius: '6px', // Slightly less rounded
                fontWeight: 'bold',
            }
        }
    }
    // Add more component overrides as needed
  },
});

export default darkTheme;