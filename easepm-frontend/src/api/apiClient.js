import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Base API URL - ensure it's pointing to the correct backend
const API_BASE_URL = 'http://localhost:5000/api';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // CORS settings for development
  withCredentials: false, // Set to false for simple CORS requests
  timeout: 30000, // 30 seconds timeout
});

// Cache for storing tokens to prevent unnecessary refreshes
let tokenCache = {
  token: null,
  expiry: null
};

// Make tokenCache available globally for logout function
window.tokenCache = tokenCache;

// Log all requests and responses for debugging
apiClient.interceptors.request.use(request => {
  console.log('Starting Request:', request.url);
  return request;
});

apiClient.interceptors.response.use(response => {
  console.log('Response:', response.status, response.config.url);
  return response;
}, error => {
  if (error.response) {
    console.error('Response Error:', error.response.status, error.config.url, error.response.data);
  } else if (error.request) {
    console.error('Request Error:', error.config.url, error.message);
  } else {
    console.error('Error:', error.message);
  }
  return Promise.reject(error);
});

// Add request interceptor to handle auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Skip token for simple requests
    if (config.skipAuth) {
      return config;
    }
    
    try {
      // Get Firebase auth
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        // User is authenticated, check if we have a cached token
        const now = Date.now();
        
        if (tokenCache.token && tokenCache.expiry && tokenCache.expiry > now) {
          // Use cached token if it's still valid
          config.headers.Authorization = `Bearer ${tokenCache.token}`;
        } else {
          // Get a fresh token
          const token = await user.getIdToken(false); // Don't force refresh to avoid delay
          config.headers.Authorization = `Bearer ${token}`;
          
          // Cache the token for 5 minutes
          tokenCache.token = token;
          tokenCache.expiry = now + (5 * 60 * 1000);
        }
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.log('Network error detected - possibly CORS issue');
      
      // Log additional debugging information for CORS issues
      console.error('CORS Error Details:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        message: error.message
      });
    }
    
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        // Clear token cache
        tokenCache.token = null;
        tokenCache.expiry = null;
        
        // Only redirect to login if we're not already on a login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to test authentication directly
export const testAuth = async () => {
  try {
    const user = getAuth().currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    
    const token = await user.getIdToken(true);
    
    try {
      const response = await apiClient.get('/auth/test-auth', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        status: error.response?.status, 
        error: error.response?.data?.error || 'Auth test failed' 
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export { API_BASE_URL, apiClient };

