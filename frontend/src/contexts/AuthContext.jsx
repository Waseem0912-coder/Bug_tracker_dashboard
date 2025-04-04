import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('access_token')); 
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refresh_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('access_token'));
  const [authLoading, setAuthLoading] = useState(false); 

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
        return true; 
      } else {
        throw new Error('Login failed: Invalid response from server.');
      }
    } catch (error) {

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setAccessToken(null);
      setRefreshToken(null);
      setAuthLoading(false);
      throw error; 
    }
  }, []);

  const logout = useCallback(async () => {
      setAuthLoading(true); 
      const tokenToBlacklist = refreshToken; 
      console.log("Logging out...");

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setAccessToken(null);
      setRefreshToken(null);

      if (tokenToBlacklist) {
          try {
             await apiLogoutUser(tokenToBlacklist);
          } catch (e) {

             console.error("Blacklist API call failed during logout:", e);
          }
      }
      setAuthLoading(false); 
      console.log("Logout complete.");

  }, [refreshToken]); 

  const value = {
    isAuthenticated,
    accessToken, 
    authLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};