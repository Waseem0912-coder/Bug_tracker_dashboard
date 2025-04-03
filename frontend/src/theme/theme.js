// src/theme/theme.js
import { createTheme } from '@mui/material/styles';
import { grey, blue, red, green, yellow } from '@mui/material/colors'; // Use yellow instead of orange

// Define the dark theme inspired by GitHub's dark mode
const githubDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: blue[300], // Lighter blue for primary actions
    },
    secondary: {
      main: green[400], // Green accent
    },
    background: {
      default: '#0d1117', // Very dark charcoal/almost black
      paper: '#161b22',   // Lighter grey/charcoal for surfaces
    },
    text: {
      primary: '#c9d1d9',   // Light grey/off-white for primary text
      secondary: '#8b949e', // Dimmer grey for secondary text/icons
    },
    error: { main: red[400] },
    warning: { main: yellow[600] }, // Yellow for warning (like open status)
    info: { main: blue[300] }, // Blue for info (like in progress)
    success: { main: green[400] }, // Green for success (like resolved)
    divider: '#30363d', // Dark grey divider
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    h1: { fontSize: '2.2rem', fontWeight: 600 },
    h2: { fontSize: '1.8rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1.1rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600, color: '#8b949e' }, // Match secondary text
    button: {
        textTransform: 'none',
        fontWeight: 600,
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#161b22', // Paper background
          boxShadow: 'none', // Flat look
          borderBottom: '1px solid #30363d', // Subtle border
        },
      },
    },
    MuiPaper: {
      defaultProps: {
         elevation: 0, // Default to flat paper
      },
      styleOverrides: {
         root: {
             backgroundColor: '#161b22', // Ensure correct background
             backgroundImage: 'none',
         },
         // Example: Add border only if variant="outlined"
         // outlined: {
         //    border: '1px solid #30363d'
         // }
      }
    },
    MuiTableContainer: {
        styleOverrides: {
            root: {
                backgroundColor: 'transparent', // Use parent Paper background
            }
        }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#8b949e',
          fontWeight: 600,
          borderBottom: '1px solid #30363d',
          whiteSpace: 'nowrap', // Prevent header text wrapping
        },
        body: {
          color: '#c9d1d9',
          borderBottom: '1px solid #30363d',
        },
      }
    },
     MuiChip: {
        styleOverrides: {
            // Adjust chip styles for better contrast/look on new theme
            root: ({ ownerState, theme }) => ({
               fontWeight: 'bold',
               // Use slightly adjusted colors or styles if needed based on theme.palette...
               // Example: Making warning chip text darker for yellow background
               ...(ownerState.color === 'warning' && { color: grey[900] }),
            }),
        }
    },
    MuiLink: {
        styleOverrides: {
            root: {
                color: blue[300], // Primary blue
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
            }
        }
    },
    MuiButton: {
        styleOverrides: {
            // Example: Contrast button
            // containedPrimary: {
            //     color: '#ffffff', // Ensure text is white on blue button
            // }
        }
    },
    MuiToggleButtonGroup: {
        styleOverrides: {
            root: { backgroundColor: '#21262d' } // Slightly different group background
        }
    },
     MuiToggleButton: {
         styleOverrides: {
             root: {
                 color: '#8b949e', // Secondary text
                 border: `1px solid #30363d`, // Divider color border
                 '&.Mui-selected': {
                     color: '#c9d1d9', // Primary text when selected
                     backgroundColor: 'rgba(56, 139, 253, 0.15)', // Primary blue with alpha
                     borderColor: blue[300], // Primary blue border
                     '&:hover': {
                        backgroundColor: 'rgba(56, 139, 253, 0.25)', // Slightly darker on hover
                     }
                 },
                 '&:not(.Mui-selected):hover': {
                     backgroundColor: '#21262d', // Hover background
                     borderColor: '#8b949e', // Brighter border on hover
                 }
             }
         }
     }
  },
});

export default githubDarkTheme; // Export the theme