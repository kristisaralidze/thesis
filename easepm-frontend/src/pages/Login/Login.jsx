import { getAuth, signInWithEmailAndPassword } from "firebase/auth"; // Import Firebase auth functions
import { React, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar"; // Import Navbar component
import { useAuth } from "../../contexts/AuthContext"; // Import auth context
import "./Login.css"; // Import External CSS File


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth(); // Get authentication status

  // No useEffect for redirection - we'll only redirect after login

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Prevent submitting while loading
    if (loading) return;
    
    setLoading(true);
    setError("");

    // Show status message
    const statusElement = document.createElement('div');
    statusElement.className = 'login-status';
    statusElement.textContent = 'Signing in...';
    document.querySelector('.login-box').appendChild(statusElement);

    try {
        console.log("🚀 Starting direct Firebase login process...");
        const auth = getAuth();

        // Use Firebase Web SDK directly for authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        console.log("✅ User logged in successfully with Firebase", userCredential.user.uid);
        
        // Get the user's Firebase ID token
        const idToken = await userCredential.user.getIdToken();
        localStorage.setItem('firebase_token', idToken);
        
        // Remove status message
        if (statusElement.parentNode) {
          statusElement.parentNode.removeChild(statusElement);
        }
        
        // Redirect to the intended page or dashboard
        const from = location.state?.from || '/dashboard';
        console.log("✅ Login successful, redirecting to", from);
        navigate(from, { replace: true });
    } catch (error) {
        console.error("❌ Error in handleLogin:", error);
        
        // Remove status message
        if (statusElement.parentNode) {
          statusElement.parentNode.removeChild(statusElement);
        }
        
        // Handle Firebase specific errors
        if (error.code) {
          switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
              setError("Invalid email or password. Please try again.");
              break;
            case 'auth/too-many-requests':
              setError("Access has been temporarily disabled due to many failed login attempts. Please try again later.");
              break;
            case 'auth/network-request-failed':
              setError("Network error. Please check your internet connection and try again.");
              break;
            default:
              setError(`Login failed: ${error.message}`);
          }
        } else {
          setError("Something went wrong. Please try again.");
        }
        setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Navbar />
      <div className="decorative-circle circle1"></div>
      <div className="decorative-circle circle2"></div>
      <div className="decorative-shape shape1"></div>
      <div className="decorative-shape shape2"></div>

      <div className="login-box">
        <h1 className="logo">
          <span className="text-blue">EASE</span>
          <span className="text-orange">PM</span>
        </h1>

        <h2 className="login-title">Login</h2>

        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleLogin} className="login-form">
          <div>
            <label>EMAIL</label>
            <input
              type="email"
              placeholder="hello@reallygreatsite.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label>PASSWORD</label>
            <input
              type="password"
              placeholder="*******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button-in-login"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="register-text">
          Don't have an account?
          <button 
            className="register-button-in-login" 
            onClick={() => navigate("/register")}
            disabled={loading}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
