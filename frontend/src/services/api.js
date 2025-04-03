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
       // For now, just clear tokens and redirect
       localStorage.removeItem('access_token');
       localStorage.removeItem('refresh_token');
       // This simple redirect might lose context, a better approach uses context/events
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
    console.error("Login API error:", error.response?.data || error.message);
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

// --- Bug API Calls --- ADDED/UPDATED THESE ---

/**
 * Fetches a paginated list of bugs.
 * @param {number} [page=1] - The page number (1-based index for API).
 * @returns {Promise<object>} Promise resolving with { count, next, previous, results }.
 */
export const getBugs = async (page = 1) => {
  try {
    // Django PageNumberPagination uses 'page' query parameter
    const response = await apiClient.get('/bugs/', { params: { page } });
    // Basic validation of expected structure
    if (response.data && typeof response.data.count === 'number' && Array.isArray(response.data.results)) {
        return response.data;
    } else {
        console.error("Unexpected format for bugs list response:", response.data);
        throw new Error("Invalid data format received from server.");
    }
  } catch (error) {
    // Error logged by interceptor, re-throw for component handling
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
    // Fetch specific bug by its unique bug_id field used in the URL
    const response = await apiClient.get(`/bugs/${bugId}/`);
    return response.data; // Return the bug object
  } catch (error) {
    // Error logged by interceptor, re-throw for component handling
    throw error;
  }
};

// --- Dashboard API Call --- (Placeholder for Part 3) ---
export const getBugModifications = async () => {
    console.warn("getBugModifications not fully implemented yet.");
    // try {
    //   const response = await apiClient.get('/bug_modifications/');
    //   return Array.isArray(response.data) ? response.data : [];
    // } catch (error) { throw error; }
    return Promise.resolve([]); // Return empty array for now
};


export default apiClient;