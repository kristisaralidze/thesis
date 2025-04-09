import { apiClient } from './apiClient';

// User registration with timeout handling and retry
export const registerUser = async (userData) => {
  console.log('🚀 Starting registration process...');
  
  try {
    // First attempt with a 30 second timeout
    const response = await apiClient.post('/auth/register', userData, {
      timeout: 30000 // Override the default timeout for this specific request
    });
    console.log('✅ Registration successful on first attempt');
    return response.data;
  } catch (error) {
    // If it's a timeout error, try once more with a shorter timeout
    if (error.code === 'ECONNABORTED') {
      console.log('⏱️ Registration timed out on first attempt, retrying...');
      try {
        const retryResponse = await apiClient.post('/auth/register', userData, {
          timeout: 15000 // Shorter timeout for retry
        });
        console.log('✅ Registration successful on retry attempt');
        return retryResponse.data;
      } catch (retryError) {
        console.error('❌ Registration failed on retry:', retryError);
        // Add more context to the error
        if (retryError.code === 'ECONNABORTED') {
          retryError.message = 'The server is taking too long to respond. Firebase may be experiencing issues. Please try again later.';
        }
        throw retryError;
      }
    }
    
    // Handle other errors
    console.error('❌ Registration error:', error);
    throw error;
  }
};

// User login
export const loginUser = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

// Logout user
export const logoutUser = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

// Get current user profile
export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/profile');
  return response.data;
};

// Verify email
export const verifyEmail = async (token) => {
  const response = await apiClient.post(`/auth/verify-email/${token}`);
  return response.data;
};

// Request password reset
export const requestPasswordReset = async (email) => {
  const response = await apiClient.post('/auth/request-password-reset', { email });
  return response.data;
};

// Reset password with token
export const resetPassword = async (token, newPassword) => {
  const response = await apiClient.post(`/auth/reset-password/${token}`, { password: newPassword });
  return response.data;
};

// Check if token is valid
export const checkToken = async () => {
  const response = await apiClient.get('/auth/check-token');
  return response.data;
}; 