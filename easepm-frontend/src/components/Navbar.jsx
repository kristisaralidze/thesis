import { useEffect, useRef, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ConfirmationModal from "./ConfirmationModal";
import "./Navbar.css";

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link className="navbar-brand" to="/dashboard">
          <span className="ease-text">EASE</span>
          <span className="pm-text">PM</span>
        </Link>
        <div className="navbar-links">
          <Link className="nav-link" to="/dashboard">Dashboard</Link> 
          <Link className="nav-link" to="/templates">Templates</Link> 
          <div className="user-profile-container" ref={dropdownRef}>
            <button 
              className="user-profile-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <FaUserCircle className="user-icon" />
            </button>
            {showDropdown && (
              <div className="user-dropdown">
                {currentUser ? (
                  <>
                    <div className="user-info">
                      <FaUserCircle className="user-avatar" />
                      <div className="user-details">
                        <span className="user-name">{currentUser.displayName || 'User'}</span>
                        <span className="user-email">{currentUser.email}</span>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button 
                      className="dropdown-item" 
                      onClick={() => {
                        setShowDropdown(false);
                        setShowLogoutModal(true);
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="user-info">
                      <FaUserCircle className="user-avatar" />
                      <div className="user-details">
                        <span className="user-name">Guest User</span>
                        <span className="user-email">Not logged in</span>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link 
                      to="/login" 
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
      />
    </nav>
  );
};

export default Navbar;
