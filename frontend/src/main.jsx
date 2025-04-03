// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client'; // Use createRoot from react-dom/client
import App from './App.jsx';

// --- MUI Theme and Styling ---
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'; // Applies baseline styles and background
// Import the potentially renamed theme file/export
import githubDarkTheme from './theme/theme'; // Ensure this matches the export name

// --- Authentication Context ---
import { AuthProvider } from './contexts/AuthContext.jsx'; // Provides auth state and functions

// Get the root DOM element
const rootElement = document.getElementById('root');

// Ensure the root element exists before trying to render
if (rootElement) {
  // Create a root instance using the new React 18 API
  const root = ReactDOM.createRoot(rootElement);

  // Render the application
  root.render(
    // StrictMode helps identify potential problems in an application
    <React.StrictMode>
      {/* Apply the MUI theme to the entire application */}
      <ThemeProvider theme={githubDarkTheme}> {/* Use the new theme name */}
        {/* Apply baseline CSS resets and theme background color */}
        <CssBaseline />
        {/* Provide authentication state and functions to the app */}
        <AuthProvider>
          {/* Render the main application component */}
          <App />
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
    console.error("Failed to find the root element. Ensure your HTML file has an element with ID 'root'.");
}