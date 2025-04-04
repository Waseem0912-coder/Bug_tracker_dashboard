import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';

import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage'; 
import BugListPage from './pages/BugListPage';
import BugDetailPage from './pages/BugDetailPage';
import DashboardPage from './pages/DashboardPage';

const NotFound = () => ( 
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>404 - Page Not Found</h2> <p>Sorry, the page you are looking for does not exist.</p>
    </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} /> {}

        {}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<BugListPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bugs/:bugId" element={<BugDetailPage />} />
          </Route>
        </Route>

        {}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}

export default App;