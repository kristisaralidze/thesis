import { useEffect, useState } from "react";
import { FaCalendarAlt, FaCheckCircle, FaExclamationTriangle, FaHourglassStart, FaLightbulb } from "react-icons/fa";
import { fetchProjects } from "../../api/projects";
import Navbar from "../../components/Navbar";
import ProjectCard from "../../components/ProjectCard";
import { useAuth } from "../../contexts/AuthContext";
import "./Dashboard.css"; // Dashboard-specific CSS
import { NewProjectModal } from "./NewProjectModal";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const { currentUser, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    // Create an abort controller to cancel requests on unmount
    const controller = new AbortController();
    
    const getProjects = async () => {
      try {
        console.log("🔄 Fetching projects...");
        setLoading(true);
        
        // Show loading message
        setError(null);
        
        // Fetch projects from MongoDB via the API
        const projects = await fetchProjects();
        console.log("✅ Projects fetched successfully:", projects);
        
        if (Array.isArray(projects)) {
          setProjects(projects);
          setFilteredProjects(projects);
        } else {
          setError("Unexpected response format from API");
          console.error("Unexpected response format:", projects);
        }
      } catch (error) {
        // Check if error was due to component unmounting
        if (error.name === 'AbortError') {
          console.log('Fetch aborted due to component unmount');
          return;
        }
        
        console.error("❌ Error fetching projects:", error);
        setError("Failed to load projects. " + (error.response?.data?.error || error.message || 'Server not responding'));
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if authenticated
    if (isAuthenticated) {
      getProjects();
    } else {
      setLoading(false);
    }
    
    // Cleanup function to abort any ongoing fetch requests when component unmounts
    return () => {
      console.log('Aborting any ongoing fetch requests');
      controller.abort();
    };
  }, [isAuthenticated]);

  // Apply filtering when activeFilter changes
  useEffect(() => {
    if (!activeFilter) {
      setFilteredProjects(projects);
      return;
    }
    
    let filtered;
    switch (activeFilter) {
      case 'active':
        filtered = projects.filter(p => p.status === "In Progress");
        break;
      case 'not-started':
        filtered = projects.filter(p => p.status === "Not Started");
        break;
      case 'due-this-week':
        filtered = projects.filter(p => {
          if (p.status === "Completed") return false;
          return isDueThisWeek(p.end_date);
        });
        break;
      case 'overdue':
        filtered = projects.filter(p => {
          if (p.status === "Completed") return false;
          return isOverdue(p.end_date);
        });
        break;
      case 'completed':
        filtered = projects.filter(p => p.status === "Completed");
        break;
      default:
        filtered = projects;
    }
    
    setFilteredProjects(filtered);
  }, [activeFilter, projects]);

  // KPI Calculations
  const activeProjectsCount = projects.filter(
    (p) => p.status === "In Progress"
  ).length;
  
  const notStartedProjectsCount = projects.filter(
    (p) => p.status === "Not Started"
  ).length;
  
  const completedProjectsCount = projects.filter(
    (p) => p.status === "Completed"
  ).length;
  
  const dueThisWeekCount = projects.filter((p) => {
    // only count if not completed
    if (p.status === "Completed") return false;
    return isDueThisWeek(p.end_date);
  }).length;
  
  const overdueProjectsCount = projects.filter((p) => {
    // only count if not completed
    if (p.status === "Completed") return false;
    return isOverdue(p.end_date);
  }).length;

  function isDueThisWeek(date) {
    if (!date) return false;
    const now = new Date();
    const dueDate = new Date(date);
    if (isNaN(dueDate.getTime())) return false;
    const diffDays = (dueDate - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }

  function isOverdue(date) {
    if (!date) return false;
    const dueDate = new Date(date);
    if (isNaN(dueDate.getTime())) return false;
    return dueDate < new Date();
  }

  // Handler for KPI card clicks
  const handleKpiClick = (filterType) => {
    if (activeFilter === filterType) {
      // If clicking the currently active filter, remove the filter
      setActiveFilter(null);
    } else {
      // Otherwise, set the new filter
      setActiveFilter(filterType);
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        {/* KPI Section */}
        <div className="kpi-section">
          {/* ACTIVE PROJECTS */}
          <div 
            className={`kpi-card ${activeFilter === 'active' ? 'kpi-card-active' : ''}`}
            onClick={() => handleKpiClick('active')}
          >
            <div className="kpi-icon">
              <FaLightbulb />
            </div>
            <h5>ACTIVE PROJECTS</h5>
            <h4>{activeProjectsCount}</h4>
          </div>

          {/* NOT STARTED PROJECTS */}
          <div 
            className={`kpi-card ${activeFilter === 'not-started' ? 'kpi-card-active' : ''}`}
            onClick={() => handleKpiClick('not-started')}
          >
            <div className="kpi-icon">
              <FaHourglassStart />
            </div>
            <h5>NOT STARTED</h5>
            <h4>{notStartedProjectsCount}</h4>
          </div>

          {/* DUE THIS WEEK */}
          <div 
            className={`kpi-card ${activeFilter === 'due-this-week' ? 'kpi-card-active' : ''}`}
            onClick={() => handleKpiClick('due-this-week')}
          >
            <div className="kpi-icon">
              <FaCalendarAlt />
            </div>
            <h5>DUE THIS WEEK</h5>
            <h4>{dueThisWeekCount}</h4>
          </div>

          {/* OVERDUE */}
          <div 
            className={`kpi-card ${activeFilter === 'overdue' ? 'kpi-card-active' : ''}`}
            onClick={() => handleKpiClick('overdue')}
          >
            <div className="kpi-icon">
              <FaExclamationTriangle />
            </div>
            <h5>OVERDUE</h5>
            <h4>{overdueProjectsCount}</h4>
          </div>

          {/* COMPLETED PROJECTS */}
          <div 
            className={`kpi-card ${activeFilter === 'completed' ? 'kpi-card-active' : ''}`}
            onClick={() => handleKpiClick('completed')}
          >
            <div className="kpi-icon">
              <FaCheckCircle />
            </div>
            <h5>COMPLETED</h5>
            <h4>{completedProjectsCount}</h4>
          </div>
        </div>

        {/* Add New Project Button */}
        <button className="btn-new-project" onClick={() => setShowModal(true)}>
          + New Project
        </button>

        {showModal && (
          <NewProjectModal
            onClose={() => setShowModal(false)}
            onProjectAdded={() => window.location.reload()}
          />
        )}

        {/* Project List */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading projects...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="error-container">
                <p className="error-text">{error}</p>
              </div>
            )}
            
            <div className="project-grid">
              {Array.isArray(filteredProjects) && filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} dashboard={true} />
                ))
              ) : (
                <div className="no-projects-container">
                  <p className="no-projects-message">
                    {activeFilter ? 
                      "No projects match the selected filter." : 
                      "No projects found. Click the 'New Project' button to create one."
                    }
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;
