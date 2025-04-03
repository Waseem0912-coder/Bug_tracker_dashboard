// src/services/api.js
import axios from 'axios';

// --- Configuration ---
const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Your Django API base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// --- Interceptors ---

// Request Interceptor: Adds JWT authentication token if available
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
    return Promise.reject(error); // Pass error along
  }
);

// Response Interceptor: Basic error logging and 401 handling (clears token, redirects)
apiClient.interceptors.response.use(
  (response) => response, // Pass successful responses through
  async (error) => {
    // Log detailed error information if available
    console.error(
        'API Response Error:',
        error.response?.status,
        error.response?.data || error.message || error
    );
    const originalRequest = error.config;

    // Handle 401 Unauthorized specifically (e.g., token expired/invalid)
    // Add token refresh logic here if needed in the future.
    if (error.response?.status === 401 && !originalRequest._retry) {
       console.warn("Received 401 Unauthorized. Token might be invalid or expired. Logging out.");
       // Clear stored tokens
       localStorage.removeItem('access_token');
       localStorage.removeItem('refresh_token');
       // Redirect to login page, avoiding redirect loops
       if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
           // Consider using React Router's navigate for better integration if possible outside component context
           window.location.href = '/login';
       }
    }
    // Reject the promise for other errors or after handling 401 without refresh
    return Promise.reject(error);
  }
);


// --- API Call Functions ---

/** Logs in a user by obtaining JWT tokens. */
export const loginUser = async (username, password) => {
  try {
    const response = await apiClient.post('/token/', { username, password });
    return response.data; // { access, refresh }
  } catch (error) { throw error; } // Error logged by interceptor
};

/** Registers a new user. */
export const registerUser = async (userData) => {
    if (!userData.username || !userData.email || !userData.password || !userData.password2) throw new Error("All fields required.");
    if (userData.password !== userData.password2) throw new Error("Passwords do not match.");
    try {
        const response = await apiClient.post('/register/', {
            username: userData.username, email: userData.email,
            password: userData.password, password2: userData.password2,
        });
        return response.data; // { message: "...", user: { ... } }
    } catch (error) { throw error; } // Error logged by interceptor
};

/** Attempts to blacklist a JWT refresh token on the backend during logout. */
export const logoutUser = async (refreshToken) => {
    if (!refreshToken) return; // Nothing to blacklist
    try {
        await apiClient.post('/token/blacklist/', { refresh: refreshToken });
        console.log("Refresh token successfully blacklisted.");
    } catch (error) { console.error("Error blacklisting token:", error.response?.data || error.message); } // Log but don't block logout
};

/** Fetches a paginated list of bugs, optionally filtered by search term. */
export const getBugs = async (page = 1, pageSize = 10, searchTerm = null) => {
  try {
    const params = { page: page, page_size: pageSize };
    if (searchTerm && searchTerm.trim() !== '') { params.search = searchTerm.trim(); }
    console.debug("Fetching bugs with params:", params); // Use debug level
    const response = await apiClient.get('/bugs/', { params });
    if (response.data?.results) { return response.data; }
    else { throw new Error("Invalid data format for bugs list."); }
  } catch (error) { throw error; } // Error logged by interceptor
};

/** Fetches details for a single bug by its unique ID. */
export const getBugById = async (bugId) => {
  if (!bugId) throw new Error("Bug ID required.");
  try {
    console.debug(`Fetching bug details for ID: ${bugId}`);
    const response = await apiClient.get(`/bugs/${bugId}/`);
    return response.data;
  } catch (error) { throw error; } // Error logged by interceptor
};

/** Updates the status of a specific bug using PATCH. */
export const updateBugStatus = async (bugId, status) => {
    if (!bugId || !status) throw new Error("Bug ID and new status key required.");
    try {
        console.debug(`Updating status for bug ${bugId} to ${status}`);
        // Send PATCH request with { "status": "new_key" }
        const response = await apiClient.patch(`/bugs/${bugId}/status/`, { status });
        return response.data; // Return updated bug object
    } catch (error) { throw error; } // Error logged by interceptor
};

/** Fetches aggregated bug modification counts, optionally filtered by priority. */
export const getBugModifications = async (priority = null) => {
    try {
      const params = {};
      if (priority && ['high', 'medium', 'low'].includes(priority.toLowerCase())) { params.priority = priority.toLowerCase(); }
      console.debug("Fetching modifications with params:", params);
      const response = await apiClient.get('/bug_modifications/', { params });
      return Array.isArray(response.data) ? response.data : []; // Ensure array response
    } catch (error) { throw error; } // Error logged by interceptor
};

// Export the configured apiClient instance (optional, prefer functions)
export default apiClient;