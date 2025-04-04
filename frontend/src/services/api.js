import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; 
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

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

apiClient.interceptors.response.use(
  (response) => response, 
  async (error) => {

    console.error(
        'API Response Error:',
        error.response?.status,
        error.response?.data || error.message || error
    );
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
       console.warn("Received 401 Unauthorized. Token might be invalid or expired. Logging out.");

       localStorage.removeItem('access_token');
       localStorage.removeItem('refresh_token');

       if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {

           window.location.href = '/login';
       }
    }

    return Promise.reject(error);
  }
);

export const loginUser = async (username, password) => {
  try {
    const response = await apiClient.post('/token/', { username, password });
    return response.data; 
  } catch (error) { throw error; } 
};

export const registerUser = async (userData) => {
    if (!userData.username || !userData.email || !userData.password || !userData.password2) throw new Error("All fields required.");
    if (userData.password !== userData.password2) throw new Error("Passwords do not match.");
    try {
        const response = await apiClient.post('/register/', {
            username: userData.username, email: userData.email,
            password: userData.password, password2: userData.password2,
        });
        return response.data; 
    } catch (error) { throw error; } 
};

export const logoutUser = async (refreshToken) => {
    if (!refreshToken) return; 
    try {
        await apiClient.post('/token/blacklist/', { refresh: refreshToken });
        console.log("Refresh token successfully blacklisted.");
    } catch (error) { console.error("Error blacklisting token:", error.response?.data || error.message); } 
};

export const getBugs = async (page = 1, pageSize = 10, searchTerm = null) => {
  try {
    const params = { page: page, page_size: pageSize };
    if (searchTerm && searchTerm.trim() !== '') { params.search = searchTerm.trim(); }
    console.debug("Fetching bugs with params:", params); 
    const response = await apiClient.get('/bugs/', { params });
    if (response.data?.results) { return response.data; }
    else { throw new Error("Invalid data format for bugs list."); }
  } catch (error) { throw error; } 
};

export const getBugById = async (bugId) => {
  if (!bugId) throw new Error("Bug ID required.");
  try {
    console.debug(`Fetching bug details for ID: ${bugId}`);
    const response = await apiClient.get(`/bugs/${bugId}/`);
    return response.data;
  } catch (error) { throw error; } 
};

export const updateBugStatus = async (bugId, status) => {
    if (!bugId || !status) throw new Error("Bug ID and new status key required.");
    try {
        console.debug(`Updating status for bug ${bugId} to ${status}`);

        const response = await apiClient.patch(`/bugs/${bugId}/status/`, { status });
        return response.data; 
    } catch (error) { throw error; } 
};

export const getBugModifications = async (priority = null) => {
    try {
      const params = {};
      if (priority && ['high', 'medium', 'low'].includes(priority.toLowerCase())) { params.priority = priority.toLowerCase(); }
      console.debug("Fetching modifications with params:", params);
      const response = await apiClient.get('/bug_modifications/', { params });
      return Array.isArray(response.data) ? response.data : []; 
    } catch (error) { throw error; } 
};

export default apiClient;