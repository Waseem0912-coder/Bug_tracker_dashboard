// src/services/api.js
import axios from 'axios';

// Base URL for your Django API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor (adds token)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor (basic error logging + basic 401 handling)
apiClient.interceptors.response.use(
  (response) => response, // Pass through success
  async (error) => { // Make async for refresh logic later
    console.error('API Response Error:', error.response || error.message || error);
    const originalRequest = error.config;

    // Basic 401 check (can add full refresh logic later if needed)
    if (error.response?.status === 401 && !originalRequest._retry) {
       console.warn("Received 401 Unauthorized. Token might be expired or invalid.");
       // TODO: Implement token refresh logic here if desired
       localStorage.removeItem('access_token');
       localStorage.removeItem('refresh_token');
       if (window.location.pathname !== '/login') {
           window.location.href = '/login';
       }
    }
    return Promise.reject(error);
  }
);

// --- API Call Functions ---

export const loginUser = async (username, password) => {
  try {
    const response = await apiClient.post('/token/', { username, password });
    return response.data; // { access, refresh }
  } catch (error) {
    // Error logged by interceptor, just re-throw
    throw error;
  }
};

// Optional: Blacklist function for logout
export const logoutUser = async (refreshToken) => {
    if (!refreshToken) return;
    try {
        await apiClient.post('/token/blacklist/', { refresh: refreshToken });
        console.log("Refresh token blacklisted.");
    } catch (error) {
        console.error("Error blacklisting token:", error.response?.data || error.message);
    }
};

/**
 * Fetches a paginated list of bugs.
 * @param {number} [page=1] - The page number (1-based index for API).
 * @param {number} [pageSize=10] - The number of items per page requested by frontend.
 * @returns {Promise<object>} Promise resolving with { count, next, previous, results }.
 */
export const getBugs = async (page = 1, pageSize = 10) => {
  try {
    const response = await apiClient.get('/bugs/', {
      params: {
          page: page,
          page_size: pageSize // Send the requested page size (check settings.py)
        }
    });
     if (response.data && typeof response.data.count === 'number' && Array.isArray(response.data.results)) {
        return response.data;
    } else {
        console.error("Unexpected format for bugs list response:", response.data);
        throw new Error("Invalid data format received from server.");
    }
  } catch (error) {
    // Error logged by interceptor, just re-throw
    throw error;
  }
};

/**
 * Fetches details for a single bug by its unique ID.
 * @param {string} bugId - The unique string identifier of the bug (e.g., "BUG-123").
 * @returns {Promise<object>} Promise resolving with the bug data object.
 */
export const getBugById = async (bugId) => {
  if (!bugId) {
      const error = new Error("Bug ID is required.");
      console.error(error.message);
      throw error;
  }
  try {
    const response = await apiClient.get(`/bugs/${bugId}/`);
    return response.data;
  } catch (error) {
    // Error logged by interceptor, just re-throw
    throw error;
  }
};

/**
 * Fetches aggregated bug modification counts per date, optionally filtered by priority.
 * @param {string|null} [priority=null] - The priority to filter by ('high', 'medium', 'low') or null/undefined/'all' for all.
 * @returns {Promise<Array<object>>} Promise resolving with array like [{ date: "YYYY-MM-DD", count: N }].
 */
export const getBugModifications = async (priority = null) => {
    try {
      const params = {};
      if (priority && typeof priority === 'string' && ['high', 'medium', 'low'].includes(priority.toLowerCase())) {
        params.priority = priority.toLowerCase();
      }
      console.log("Fetching modifications with params:", params);
      const response = await apiClient.get('/bug_modifications/', { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching bug modifications:", error.response?.data || error.message);
      throw error;
    }
};

export default apiClient;