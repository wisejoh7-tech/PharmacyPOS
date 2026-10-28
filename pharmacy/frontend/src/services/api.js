import axios from 'axios';

export const getBaseURL = () => {
  const customUrl = localStorage.getItem('api_base_url');
  const defaultUrl = import.meta.env.VITE_API_URL || 'https://pharmacy-api-exn3.onrender.com/api/';
  const url = customUrl || defaultUrl;
  return url.endsWith('/') ? url : `${url}/`;
};

export const setApiBaseURL = (newUrl) => {
  if (newUrl) {
    const formatted = newUrl.endsWith('/') ? newUrl : `${newUrl}/`;
    localStorage.setItem('api_base_url', formatted);
  } else {
    localStorage.removeItem('api_base_url');
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Helper to check if a token is valid (not empty or string "null"/"undefined")
const isValidToken = (token) => {
  return token && token !== 'null' && token !== 'undefined' && token !== '';
};

// Interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    config.baseURL = getBaseURL();
    const isPublicEndpoint = config.url && (
      config.url.includes('health-check') ||
      config.url.includes('login') ||
      config.url.includes('token')
    );

    const token = localStorage.getItem('access_token');
    if (isValidToken(token) && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Ensure no stale or "null" header is sent
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthorized responses and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 (Unauthorized) or 403 (Forbidden) if it might be auth related
    // We check !originalRequest._retry to avoid infinite loops
    if (error.response && (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {
      
      // Don't try to refresh if we're already on the login page
      // Check both pathname (for dev) and hash (for prod/webview HashRouter)
      if (window.location.pathname.includes('/login') || window.location.hash.includes('/login')) {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (isValidToken(refreshToken)) {
        try {
          console.log("Attempting token refresh...");
          const response = await axios.post(`${getBaseURL()}token/refresh/`, {
            refresh: refreshToken,
          });
          
          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);
          
          console.log("Token refresh successful.");
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error("Refresh token failed or expired", refreshError);
          // Clear all auth data and redirect
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('username');
          window.location.hash = '#/login';
        }
      } else {
        // No refresh token available, redirect to login
        console.warn("No refresh token found. Redirecting to login.");
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
