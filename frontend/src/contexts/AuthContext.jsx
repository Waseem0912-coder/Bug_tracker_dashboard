// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { loginUser as apiLoginUser } from '../services/api'; // Import login function

// Create the context
const AuthContext = createContext(null);

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token')); // Initial check
  const [isLoading, setIsLoading] = useState(false); // For login process
  // We don't store user details for now, but could add later: const [user, setUser] = useState(null);

  // --- Login Function ---
  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    try {
      const data = await apiLoginUser(username, password);
      if (data.access && data.refresh) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        setAccessToken(data.access);
        setRefreshToken(data.refresh);
        setIsAuthenticated(true);
        setIsLoading(false);
        return true; // Indicate success
      } else {
        // Should not happen if API is correct, but handle defensively
        throw new Error('Login failed: No tokens received.');
      }
    } catch (error) {
      console.error("Login error in context:", error);
      // Clear any potentially stale tokens on login failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setAccessToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      // Rethrow or return error info for the component
      throw error; // Let the login page handle displaying the error
    }
  }, []); // Empty dependency array, function doesn't change

  // --- Logout Function ---
  const logout = useCallback(() => {
    // TODO: Add call to backend /api/token/blacklist/ if implementing blacklisting
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    // setUser(null); // Clear user info if storing it
    // No loading state needed for simple logout
    console.log("User logged out");
  }, []); // Empty dependency array

    // --- Check Auth on Load (Optional but good) ---
    // You could add a useEffect here to verify the token with the backend
    // on initial load, but for now, trusting localStorage is simpler.
    // useEffect(() => {
    //   const checkToken = async () => { ... verify token ... };
    //   if (accessToken) checkToken();
    // }, [accessToken]); // Run when token changes (e.g. on load)


  // Value provided by the context
  const value = {
    isAuthenticated,
    accessToken,
    refreshToken,
    isLoading, // Specifically login loading state
    login,
    logout,
    // user, // Expose user if storing it
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the context itself if needed (less common)
// export default AuthContext;