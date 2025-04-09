// Register.jsx
import { createUserWithEmailAndPassword, getAuth, updateProfile } from "firebase/auth";
import { motion } from "framer-motion"; // For smooth animations
import { React, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/apiClient";
import Navbar from "../../components/Navbar"; // Import Navbar component
import "./Register.css"; // Importing External CSS File

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  // No useEffect for redirection - we'll only redirect after registration

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Prevent submitting while loading
    if (loading) return;
    
    // Basic validation
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Check password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setLoading(true);
    setError("");
    
    // Show status message
    const statusElement = document.createElement('div');
    statusElement.className = 'registration-status';
    statusElement.textContent = 'Creating your account...';
    document.querySelector('.register-box').appendChild(statusElement);

    try {
      // STEP 1: Use Firebase Web SDK directly for user registration
      const auth = getAuth();
      console.log("📤 Creating Firebase user account...");
      
      // Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update the user profile with the name
      await updateProfile(user, { displayName: name });
      
      console.log("✅ Firebase user created successfully:", user.uid);
      
      // Update status message
      statusElement.textContent = 'Account created! Setting up your profile...';
      
      // STEP 2: Store additional user profile data in backend (optional)
      try {
        // Get a fresh token
        const idToken = await user.getIdToken();
        
        // Create an AbortController with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Call the backend to create user profile (with token auth and abort signal)
        const response = await apiClient.post('/users/create-profile', 
          { name, email, uid: user.uid },
          { 
            headers: { Authorization: `Bearer ${idToken}` },
            signal: controller.signal,
            timeout: 10000 // 10 second timeout
          }
        );
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        console.log("✅ User profile created in backend:", response.data);
      } catch (profileError) {
        // If profile creation fails, we can still continue since the auth account exists
        console.warn("⚠️ Could not store user profile, but registration completed:", profileError);
        
        // Queue profile creation for later - store details in localStorage
        localStorage.setItem('pendingProfile', JSON.stringify({ 
          name, 
          email, 
          uid: user.uid, 
          timestamp: Date.now() 
        }));
        console.log("📋 Profile creation queued for next login");
      }
      
      // Remove status message
      if (statusElement.parentNode) {
        statusElement.parentNode.removeChild(statusElement);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (error) {
      console.error("❌ Error:", error);
      
      // Remove status message
      if (statusElement.parentNode) {
        statusElement.parentNode.removeChild(statusElement);
      }
      
      // Handle Firebase specific errors
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setError("This email is already registered. Please use a different email or login instead.");
            break;
          case 'auth/network-request-failed':
            setError("Network error. Please check your internet connection and try again.");
            break;
          case 'auth/too-many-requests':
            setError("Too many failed attempts. Please try again later.");
            break;
          case 'auth/weak-password':
            setError("Password is too weak. Please use a stronger password.");
            break;
          default:
            setError(`Registration failed: ${error.message}`);
        }
      } else {
        setError("Something went wrong during registration. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <Navbar /> {/* Add Navbar component */}
      
      {/* Decorative elements */}
      <div className="decorative-circle circle1"></div>
      <div className="decorative-circle circle2"></div>
      <div className="decorative-shape shape1"></div>
      <div className="decorative-shape shape2"></div>
      
      <div className="register-box">
        <h1 className="logo">
          <span className="text-blue">EASE</span>
          <span className="text-orange">PM</span>
        </h1>

        <motion.h2 
          className="register-title"
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1 }}>
          Create New Account
        </motion.h2>

        {error && <p className="error-message">{error}</p>}
        {success && (
          <motion.div 
            className="success-message"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="success-icon">✓</div>
            <p>Registration successful! Redirecting to login...</p>
          </motion.div>
        )}

        <motion.form onSubmit={handleRegister} className="register-form" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1 }}>
          <div>
            <label>NAME</label>
            <input 
              type="text" 
              placeholder="Your Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>

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

          <motion.button 
            type="submit" 
            className="register-button" 
            whileHover={{ scale: loading ? 1 : 1.1 }}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </motion.button>
        </motion.form>

        <p className="login-text">
          Already Registered?  
          <motion.button 
            className="login-button" 
            onClick={() => navigate("/login")} 
            whileHover={{ scale: loading ? 1 : 1.1 }}
            disabled={loading}
          >
            Login
          </motion.button>
        </p>
      </div>
    </div>
  );
};

export default Register;
