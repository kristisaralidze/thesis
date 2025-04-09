import { onAuthStateChanged, signOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Function to get the current user's ID token
  const getAuthToken = async () => {
    if (currentUser) {
      try {
        return await currentUser.getIdToken(true);
      } catch (error) {
        console.error('❌ Error getting auth token:', error);
        return null;
      }
    }
    return null;
  };

  // Function to handle pending profile creation
  const handlePendingProfile = async (user) => {
    try {
      // Check if there's a pending profile creation
      const pendingProfileData = localStorage.getItem('pendingProfile');
      if (!pendingProfileData) return;
      
      console.log('🔄 Found pending profile creation, attempting to create profile');
      const pendingProfile = JSON.parse(pendingProfileData);
      
      // Verify it's for the current user
      if (pendingProfile.uid !== user.uid) {
        console.warn('⚠️ Pending profile UID does not match current user, clearing pending profile');
        localStorage.removeItem('pendingProfile');
        return;
      }
      
      // Get a fresh token
      const idToken = await user.getIdToken();
      
      // Create an AbortController with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Try to create the profile
      await apiClient.post('/users/create-profile', 
        { 
          name: pendingProfile.name, 
          email: pendingProfile.email, 
          uid: pendingProfile.uid 
        },
        { 
          headers: { Authorization: `Bearer ${idToken}` },
          signal: controller.signal,
          timeout: 10000 // 10 second timeout
        }
      );
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Clear the pending profile data
      localStorage.removeItem('pendingProfile');
      console.log('✅ Successfully created pending profile');
    } catch (error) {
      console.warn('⚠️ Failed to create pending profile:', error);
      // Keep the pending profile data for next login attempt
    }
  };

  // Function to handle logout
  const logout = async () => {
    try {
      console.log('🔄 Starting logout process...');
      
      // Clear any cached tokens in localStorage
      localStorage.removeItem('user_id');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('firebase_token');
      
      // Also clear any other application state that might be persisted
      sessionStorage.clear();
      
      // Clear token cache from API client if we can access it
      if (window.tokenCache) {
        window.tokenCache = { backendToken: null, expiry: null };
      }
      
      // Sign out from Firebase
      await signOut(auth);
      console.log('✅ User logged out from Firebase');
      
      // Force reload to clear any in-memory state
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      
      return true;
    } catch (error) {
      console.error('❌ Error in logout:', error);
      return false;
    }
  };

  // Effect to watch for auth state changes
  useEffect(() => {
    console.log('🔄 Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user ? `User ${user.uid}` : 'No user');
      
      if (user) {
        // If user is logged in, try to handle any pending profile creation
        await handlePendingProfile(user);
      }
      
      setCurrentUser(user);
      setLoading(false);
      setIsAuthReady(true);
    });
    
    // Cleanup function to unsubscribe when component unmounts
    return () => {
      console.log('🧹 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);
  
  // Create the context value to provide
  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isAuthReady,
    loading,
    getAuthToken,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 