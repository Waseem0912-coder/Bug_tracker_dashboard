import React from 'react';
import ReactDOM from 'react-dom/client'; 
import App from './App.jsx';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'; 

import githubDarkTheme from './theme/theme'; 

import { AuthProvider } from './contexts/AuthContext.jsx'; 

const rootElement = document.getElementById('root');

if (rootElement) {

  const root = ReactDOM.createRoot(rootElement);

  root.render(

    <React.StrictMode>
      {}
      <ThemeProvider theme={githubDarkTheme}> {}
        {}
        <CssBaseline />
        {}
        <AuthProvider>
          {}
          <App />
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
    console.error("Failed to find the root element. Ensure your HTML file has an element with ID 'root'.");
}