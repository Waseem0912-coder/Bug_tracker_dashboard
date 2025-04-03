// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- Layouts ---
import MainLayout from './layouts/MainLayout'; // Main structure for logged-in users

// --- Route Protection ---
import ProtectedRoute from './components/ProtectedRoute'; // Checks if user is authenticated

// --- Page Components ---
import LoginPage from './pages/LoginPage';
import BugListPage from './pages/BugListPage';       // Placeholder for now
import BugDetailPage from './pages/BugDetailPage';     // Placeholder for now
import DashboardPage from './pages/DashboardPage';   // Placeholder for now

// --- Not Found Component ---
const NotFound = () => (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>404 - Page Not Found</h2>
        <p>Sorry, the page you are looking for does not exist.</p>
        {/* Consider adding a link back to home */}
    </div>
);


function App() {
  return (
    <Router>
      {/* The Routes component defines the application's routing structure */}
      <Routes>
        {/* --- Public Routes --- */}
        {/* The login page is accessible to everyone */}
        <Route path="/login" element={<LoginPage />} />


        {/* --- Protected Routes --- */}
        {/* Routes nested under ProtectedRoute require authentication */}
        <Route element={<ProtectedRoute />}>
          {/* Routes nested under MainLayout share the common AppBar and structure */}
          <Route element={<MainLayout />}>
            {/* Default route (e.g., '/'), renders BugListPage */}
            <Route index element={<BugListPage />} />
            {/* Dashboard route */}
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Bug Detail route with dynamic 'bugId' parameter */}
            <Route path="/bugs/:bugId" element={<BugDetailPage />} />
            {/* Add other protected routes within this MainLayout as needed */}
          </Route>
          {/* You could have other protected routes *outside* MainLayout if needed */}
        </Route>


        {/* --- Catch-all Not Found Route --- */}
        {/* This route matches any path not matched above */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}

export default App;