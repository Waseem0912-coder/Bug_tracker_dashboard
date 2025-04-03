// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('access_token')); // Initialize from localStorage
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('access_token'));
  const [authLoading, setAuthLoading] = useState(false); // Loading state specifically for auth actions

  // Update isAuthenticated whenever accessToken changes
  useEffect(() => {
      setIsAuthenticated(!!accessToken);
  }, [accessToken]);


  const login = useCallback(async (username, password) => {
    setAuthLoading(true);
    try {
      const data = await apiLoginUser(username, password);
      if (data.access && data.refresh) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        setAccessToken(data.access);
        setRefreshToken(data.refresh);
        setAuthLoading(false);
        return true; // Success
      } else {
        throw new Error('Login failed: Invalid response from server.');
      }
    } catch (error) {
      // Clear tokens on any login error
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setAccessToken(null);
      setRefreshToken(null);
      setAuthLoading(false);
      throw error; // Let login page handle displaying specific error
    }
  }, []);

  const logout = useCallback(async () => {
      setAuthLoading(true); // Optional: show loading during logout
      const tokenToBlacklist = refreshToken; // Grab token before clearing state
      console.log("Logging out...");

      // Clear local state and storage immediately
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setAccessToken(null);
      setRefreshToken(null);

      // Attempt to blacklist the token on the backend (fire and forget)
      if (tokenToBlacklist) {
          try {
             await apiLogoutUser(tokenToBlacklist);
          } catch (e) {
             // Log blacklist error but proceed with logout
             console.error("Blacklist API call failed during logout:", e);
          }
      }
      setAuthLoading(false); // Finish loading state
      console.log("Logout complete.");

  }, [refreshToken]); // Depends on refreshToken for blacklisting


  const value = {
    isAuthenticated,
    accessToken, // Expose if needed, but usually just isAuthenticated is enough
    authLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to consume context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};