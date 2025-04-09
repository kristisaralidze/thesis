// Home.jsx
import { motion } from "framer-motion"; // For smooth animations
import React from 'react';
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar"; // Import Navbar component
import './Home.css';

const Home = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.3,
        duration: 0.8 
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="home-container">
      <Navbar /> {/* Add Navbar component */}
      
      {/* Decorative elements */}
      <div className="decorative-circle circle1"></div>
      <div className="decorative-circle circle2"></div>
      <div className="decorative-shape shape1"></div>
      <div className="decorative-shape shape2"></div>

      {/* Main Content */}
      <motion.div 
        className="home-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="home-text"
          variants={itemVariants}
        >
          <motion.h1 
            className="home-title"
            variants={itemVariants}
          >
            WELCOME TO <span className="gradient-text">EASEPM</span>
          </motion.h1>
          <motion.p 
            className="home-description"
            variants={itemVariants}
          >
            <span className="highlight">YOUR ULTIMATE PROJECT MANAGEMENT PARTNER!</span><br />
            READY TO BECOME THE MOST EFFICIENT PROJECT MANAGER EVER?<br />
            MANAGING PROJECTS DOESN'T HAVE TO BE STRESSFUL!
          </motion.p>

          <motion.div 
            className="features-list"
            variants={itemVariants}
          >
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <div className="feature-text">Create and manage projects with ease</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <div className="feature-text">Track progress and deadlines effortlessly</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <div className="feature-text">Collaborate seamlessly with your team</div>
            </div>
          </motion.div>

          {/* Buttons with animation */}
          <motion.div 
            className="home-buttons"
            variants={itemVariants}
          >
            <Link to="/login">
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="btn btn-secondary"
              >
                LOGIN
              </motion.button>
            </Link>
            <Link to="/register">
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary"
              >
                GET STARTED
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Video Section with hover effects */}
        <motion.div 
          className="home-video"
          variants={itemVariants}
        >
          <motion.div 
            className="video-wrapper"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <video controls className="video-player" loop autoPlay muted>
              <source src="/video.mp4" type="video/mp4" />
            </video>
          </motion.div>
          <p className="video-caption">"A DAY IN THE LIFE OF A PROJECT MANAGER – BEFORE AND AFTER EASEPM"</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
