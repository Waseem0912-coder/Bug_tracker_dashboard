// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Removed Link from here

// Layouts & Pages
import MainLayout from './layouts/MainLayout'; // Import MainLayout
import LoginPage from './pages/LoginPage';
import BugListPage from './pages/BugListPage';
import BugDetailPage from './pages/BugDetailPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      {/* Routes decide which layout/page to show */}
      <Routes>
        {/* Public Route (doesn't use MainLayout) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes (use MainLayout) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}> {/* Wrap protected pages */}
            <Route path="/" element={<BugListPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bugs/:bugId" element={<BugDetailPage />} />
          </Route>
        </Route>

        {/* Not Found */}
        <Route path="*" element={<h2>404 Not Found</h2>} />
      </Routes>
    </Router>
  );
}

export default App;