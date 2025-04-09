import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// A wrapper for routes that should only be accessible to authenticated users
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthReady } = useAuth();
  const location = useLocation();
  
  // If auth is still initializing, show a loading indicator
  if (!isAuthReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginLeft: '10px' }}>Verifying authentication...</p>
      </div>
    );
  }
  
  // If not authenticated, redirect to login with the current route in state
  if (!isAuthenticated) {
    console.log(`⛔ Access to ${location.pathname} denied - redirecting to login`);
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // If authenticated, render the children components
  console.log(`✅ Access to ${location.pathname} granted`);
  return children;
};

export default ProtectedRoute; 