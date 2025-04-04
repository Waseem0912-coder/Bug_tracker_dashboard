import { createTheme } from '@mui/material/styles';
import { grey, blue, red, green, yellow } from '@mui/material/colors'; 

const githubDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: blue[300], 
    },
    secondary: {
      main: green[400], 
    },
    background: {
      default: '#0d1117', 
      paper: '#161b22',   
    },
    text: {
      primary: '#c9d1d9',   
      secondary: '#8b949e', 
    },
    error: { main: red[400] },
    warning: { main: yellow[600] }, 
    info: { main: blue[300] }, 
    success: { main: green[400] }, 
    divider: '#30363d', 
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    h1: { fontSize: '2.2rem', fontWeight: 600 },
    h2: { fontSize: '1.8rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1.1rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600, color: '#8b949e' }, 
    button: {
        textTransform: 'none',
        fontWeight: 600,
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#161b22', 
          boxShadow: 'none', 
          borderBottom: '1px solid #30363d', 
        },
      },
    },
    MuiPaper: {
      defaultProps: {
         elevation: 0, 
      },
      styleOverrides: {
         root: {
             backgroundColor: '#161b22', 
             backgroundImage: 'none',
         },

      }
    },
    MuiTableContainer: {
        styleOverrides: {
            root: {
                backgroundColor: 'transparent', 
            }
        }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#8b949e',
          fontWeight: 600,
          borderBottom: '1px solid #30363d',
          whiteSpace: 'nowrap', 
        },
        body: {
          color: '#c9d1d9',
          borderBottom: '1px solid #30363d',
        },
      }
    },
     MuiChip: {
        styleOverrides: {

            root: ({ ownerState, theme }) => ({
               fontWeight: 'bold',

               ...(ownerState.color === 'warning' && { color: grey[900] }),
            }),
        }
    },
    MuiLink: {
        styleOverrides: {
            root: {
                color: blue[300], 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
            }
        }
    },
    MuiButton: {
        styleOverrides: {

        }
    },
    MuiToggleButtonGroup: {
        styleOverrides: {
            root: { backgroundColor: '#21262d' } 
        }
    },
     MuiToggleButton: {
         styleOverrides: {
             root: {
                 color: '#8b949e', 
                 border: `1px solid #30363d`, 
                 '&.Mui-selected': {
                     color: '#c9d1d9', 
                     backgroundColor: 'rgba(56, 139, 253, 0.15)', 
                     borderColor: blue[300], 
                     '&:hover': {
                        backgroundColor: 'rgba(56, 139, 253, 0.25)', 
                     }
                 },
                 '&:not(.Mui-selected):hover': {
                     backgroundColor: '#21262d', 
                     borderColor: '#8b949e', 
                 }
             }
         }
     }
  },
});

export default githubDarkTheme; 