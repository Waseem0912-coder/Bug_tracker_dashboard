// src/services/api.js
import axios from 'axios';

// --- Configuration ---

// Base URL for your Django API (Ensure this matches your backend setup)
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Request timeout: 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json', // Explicitly accept JSON responses
  },
});

// --- Interceptors ---

// Request Interceptor: Dynamically injects the JWT access token into the Authorization header for authenticated requests.
apiClient.interceptors.request.use(
  (config) => {
    // Retrieve the access token from localStorage (or your chosen storage)
    const token = localStorage.getItem('access_token');
    if (token) {
      // If a token exists, add it as a Bearer token to the Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config; // Return the modified config
  },
  (error) => {
    // Handle errors during request configuration
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Handles responses, logging errors and potentially refreshing tokens.
apiClient.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx triggers this function.
    // Simply return the successful response.
    return response;
  },
  async (error) => { // Make the interceptor async to await refresh
    // Any status codes outside the range of 2xx triggers this function.
    console.error('API Response Error:', error.response || error.message || error);

    const originalRequest = error.config;

    // --- JWT Token Refresh Logic ---
    // Check if it's a 401 Unauthorized error and if we haven't already tried refreshing for this request.
    if (error.response?.status === 401 && !originalRequest._retry) {
        console.log("Attempting token refresh due to 401...");
        originalRequest._retry = true; // Mark that we've attempted a retry

        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
            try {
                // Use a separate axios instance or direct axios call for refresh
                // to avoid recursive interceptor loops if refresh itself fails with 401.
                const response = await axios.post(`${API_BASE_URL}/token/refresh/`, { refresh: refreshToken });

                if (response.status === 200) {
                    // Refresh successful: Update tokens in storage
                    localStorage.setItem('access_token', response.data.access);
                    // Note: If backend rotates refresh tokens and sends a new one, update it too:
                    // if (response.data.refresh) { localStorage.setItem('refresh_token', response.data.refresh); }

                    console.log("Token refresh successful. Retrying original request.");

                    // Update the authorization header for the default apiClient instance and the original request
                    apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access;
                    originalRequest.headers['Authorization'] = 'Bearer ' + response.data.access;

                    // Retry the original request with the new token
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                 console.error("Token refresh request failed:", refreshError.response?.data || refreshError.message);
                 // Refresh failed: Clear tokens, trigger logout (e.g., redirect, update context)
                 localStorage.removeItem('access_token');
                 localStorage.removeItem('refresh_token');
                 // Example: Redirect to login or dispatch a logout event
                 // Consider dispatching a custom event that the AuthContext can listen for.
                 window.location.href = '/login'; // Simple redirect
                 return Promise.reject(refreshError); // Reject the original request's promise
            }
        } else {
            console.log("No refresh token found, cannot refresh.");
             // If no refresh token, likely need to log in again.
             // Redirect or dispatch logout event here as well.
             localStorage.removeItem('access_token');
             localStorage.removeItem('refresh_token');
             window.location.href = '/login'; // Simple redirect
        }
    }
    // ----------------------------------------

    // For errors other than 401 or if refresh attempt fails, just reject the promise.
    return Promise.reject(error);
  }
);


// --- API Call Functions ---

/**
 * Logs in a user by obtaining JWT tokens.
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} Promise resolving with token data { access, refresh }.
 */
export const loginUser = async (username, password) => {
  try {
    const response = await apiClient.post('/token/', { username, password });
    return response.data;
  } catch (error) {
    // Error is already logged by interceptor, just re-throw
    throw error;
  }
};

/**
 * Fetches a paginated list of bugs.
 * @param {number} [page=1] - The page number (1-based index for API).
 * @param {number} [pageSize=10] - Optional: Items per page (if backend supports).
 * @returns {Promise<object>} Promise resolving with { count, next, previous, results }.
 */
export const getBugs = async (page = 1, pageSize = 10) => {
  try {
    const response = await apiClient.get('/bugs/', {
      params: { page } // Django PageNumberPagination uses 'page'
      // params: { page: page, page_size: pageSize } // If using LimitOffsetPagination or custom param
    });
    return response.data;
  } catch (error) {
    // Error is already logged by interceptor, just re-throw
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
    // Error is already logged by interceptor, just re-throw
    throw error;
  }
};

/**
 * Fetches aggregated bug modification counts per date.
 * @returns {Promise<Array<object>>} Promise resolving with array like [{ date: "YYYY-MM-DD", count: N }].
 */
export const getBugModifications = async () => {
  try {
    const response = await apiClient.get('/bug_modifications/');
    // Ensure data is an array, default to empty array if not or null
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    // Error is already logged by interceptor, just re-throw
    throw error;
  }
};

/**
 * Attempts to blacklist a JWT refresh token on the backend.
 * Should be called during the logout process.
 * @param {string} refreshToken - The refresh token to blacklist.
 * @returns {Promise<void>}
 */
export const logoutUser = async (refreshToken) => {
    if (!refreshToken) {
        console.log("No refresh token provided for blacklisting.");
        return; // Nothing to do
    }
    try {
        // Assumes you have the '/token/blacklist/' endpoint configured in Django
        await apiClient.post('/token/blacklist/', { refresh: refreshToken });
        console.log("Refresh token successfully blacklisted.");
    } catch (error) {
        // Log error but don't necessarily block frontend logout if this fails
        console.error("Error blacklisting token:", error.response?.data || error.message);
        // This might fail if the token is already expired or invalid, which is often ok during logout.
    }
};

// Export the configured apiClient instance if needed for advanced use cases,
// but generally prefer using the exported functions.
export default apiClient;