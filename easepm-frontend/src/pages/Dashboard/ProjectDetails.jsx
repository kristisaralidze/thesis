import React, { useEffect, useState } from "react";
import { FaCalendarWeek, FaCheckCircle, FaExclamationTriangle, FaHourglass, FaSpinner } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api/apiClient";
import * as projectsApi from "../../api/projects";
import ConfirmationModal from "../../components/ConfirmationModal";
import DeliverableEditModal from "../../components/DeliverableEditModal";
import DeliverableModal from "../../components/DeliverableModal";
import Navbar from "../../components/Navbar";
import "./ProjectDetails.css"; // Optional for styling
import ProjectEditModal from "./ProjectEditModal";

const API_URL = "http://localhost:5000/api/projects";

const ProjectDetails = () => {
  // All hooks must be declared at the top.
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteDeliverableModal, setShowDeleteDeliverableModal] = useState(false);
  const [showDeleteDocumentModal, setShowDeleteDocumentModal] = useState(false);
  const [selectedDeliverableToDelete, setSelectedDeliverableToDelete] = useState(null);
  const [selectedDocumentToDelete, setSelectedDocumentToDelete] = useState({ type: null, handler: null });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [showDeliverableEditModal, setShowDeliverableEditModal] = useState(false);

  // Tab state: "deliverables", "documentation", or "timeline"
  const [activeTab, setActiveTab] = useState("deliverables");
  
  // Active KPI filter state
  const [activeKpi, setActiveKpi] = useState(null);
  const [filteredDeliverables, setFilteredDeliverables] = useState([]);

  // Parse a date string properly considering MM/DD/YYYY format
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      // Try to parse the date string
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      
      // Return a valid date object
      return date;
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  };

  // Format a date object to a localized string
  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) return "N/A";
    
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Fetch project on mount
  useEffect(() => {
    // Create an abort controller to cancel requests on unmount
    const controller = new AbortController();
    
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`🔄 Fetching project with ID: ${id}...`);
        // Use the API module to fetch project data from MongoDB
        const projectData = await projectsApi.fetchProjectById(id);
        setProject(projectData);
        console.log(`✅ Successfully fetched project: ${id}`);
      } catch (error) {
        // Check if error was due to component unmounting
        if (error.name === 'AbortError') {
          console.log('Fetch aborted due to component unmount');
          return;
        }
        
        console.error(`❌ Error fetching project ${id}:`, error);
        setError("Project not found or access denied. " + (error.message || 'Server not responding'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
    
    // Cleanup function to abort any ongoing fetch requests when component unmounts
    return () => {
      console.log('Aborting any ongoing project fetch requests');
      controller.abort();
    };
  }, [id]);

  // Filter deliverables based on active KPI
  useEffect(() => {
    if (!project?.deliverables) return;
    
    // Reset to default display when no KPI is selected
    if (!activeKpi) {
      setFilteredDeliverables(project.deliverables);
      return;
    }
    
    // Filter based on the active KPI
    let filteredItems = [];
    const today = parseDate(new Date().toISOString().split('T')[0]);
    
    if (activeKpi === 'overdue') {
      filteredItems = project.deliverables.filter(deliverable => {
        const dueDate = parseDate(deliverable.end_date);
        return dueDate && 
               today && 
               dueDate < today && 
               deliverable.status !== 'Completed';
      });
    } else if (activeKpi === 'completed') {
      filteredItems = project.deliverables.filter(
        deliverable => deliverable.status === 'Completed'
      );
    } else if (activeKpi === 'inProgress') {
      filteredItems = project.deliverables.filter(
        deliverable => deliverable.status === 'In Progress'
      );
    } else if (activeKpi === 'notStarted') {
      filteredItems = project.deliverables.filter(
        deliverable => deliverable.status === 'Not Started'
      );
    } else if (activeKpi === 'dueThisWeek') {
      filteredItems = project.deliverables.filter(deliverable => {
        const dueDate = parseDate(deliverable.end_date);
        if (!dueDate || !today) return false;
        
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        
        return dueDate >= today && 
               dueDate <= weekFromNow && 
               deliverable.status !== 'Completed';
      });
    }
    
    setFilteredDeliverables(filteredItems);
  }, [activeKpi, project?.deliverables]);

  // Called after user saves changes in EditModal or adds/edits a deliverable
  const refreshProject = async () => {
    try {
      // Use the API module instead of direct axios calls
      const projectData = await projectsApi.fetchProjectById(id);
      setProject(projectData);
    } catch (err) {
      console.error("Error refreshing project:", err);
    }
  };

  // ----- Helper function to calculate KPIs -----
  const getKPIs = () => {
    if (!project) {
      return {
        notStartedDeliverables: 0,
        overdueDeliverables: 0,
        completedDeliverables: 0,
        totalDeliverables: 0,
        inProgressDeliverables: 0,
        dueThisWeekDeliverables: 0,
      };
    }

    const deliverables = project.deliverables || [];
    const total = deliverables.length;
    
    // Count completed deliverables
    const completed = deliverables.filter((d) => d.status === "Completed").length;
    
    // Count overdue deliverables (not completed and past due date)
    const overdue = deliverables.filter((d) => {
      if (!d.end_date) return false;
      const due = parseDate(d.end_date);
      if (!due) return false; // Skip invalid dates
      const now = new Date();
      return due < now && d.status !== "Completed";
    }).length;
    
    // Count in progress deliverables
    const inProgress = deliverables.filter((d) => d.status === "In Progress").length;
    
    // Count not started deliverables
    const notStarted = deliverables.filter((d) => d.status === "Not Started").length;
    
    // Count deliverables due this week
    const dueThisWeek = deliverables.filter((d) => {
      if (!d.end_date) return false;
      const due = parseDate(d.end_date);
      if (!due) return false; // Skip invalid dates
      
    const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(now.getDate() + 7);
      
      // Due date is between now and a week from now
      return due >= now && due <= weekFromNow && d.status !== "Completed";
    }).length;
    
    return {
      notStartedDeliverables: notStarted,
      overdueDeliverables: overdue,
      completedDeliverables: completed,
      totalDeliverables: total,
      inProgressDeliverables: inProgress,
      dueThisWeekDeliverables: dueThisWeek,
    };
  };

  const {
    notStartedDeliverables,
    overdueDeliverables,
    completedDeliverables,
    totalDeliverables,
    inProgressDeliverables,
    dueThisWeekDeliverables,
  } = getKPIs();

  // Format start/end dates
  const startDateStr = project?.start_date ? formatDate(parseDate(project.start_date)) : "N/A";
  const endDateStr = project?.end_date ? formatDate(parseDate(project.end_date)) : "N/A";

  // Functions for handling deliverable edit and delete
  const handleEditDeliverable = (deliverable) => {
    setSelectedDeliverable(deliverable);
    setShowDeliverableEditModal(true);
  };

  const handleDeleteDeliverable = async (deliverableId) => {
    try {
      if (!deliverableId) {
        console.error("No deliverable ID provided for deletion");
        return;
      }
      
      console.log("Deleting deliverable with ID:", deliverableId);
      // Use projectsApi instead of apiClient
      await projectsApi.deleteDeliverable(id, deliverableId);
      
      // Update the local state to remove the deleted deliverable
      const updatedDeliverables = project.deliverables.filter(d => d._id !== deliverableId);
      setProject({ ...project, deliverables: updatedDeliverables });
      // Also update filtered deliverables if they exist
      if (filteredDeliverables.length > 0) {
        setFilteredDeliverables(filteredDeliverables.filter(d => d._id !== deliverableId));
      }
    } catch (err) {
      console.error("Error deleting deliverable:", err);
      alert("Failed to delete deliverable. Please try again.");
    }
  };

  const initiateDocumentDelete = (documentType, deleteHandler) => {
    setSelectedDocumentToDelete({ type: documentType, handler: deleteHandler });
    setShowDeleteDocumentModal(true);
  };

  // Handle KPI card clicks
  const handleKpiClick = (kpiType) => {
    // Allow filtering for all KPI types
    if (activeKpi === kpiType) {
      // If clicking the active KPI, clear the filter
      setActiveKpi(null);
      setActiveTab("deliverables"); // Ensure we're on the deliverables tab
    } else {
      // Otherwise set the filter and go to deliverables tab
      setActiveKpi(kpiType);
      setActiveTab("deliverables");
    }
  };

  const handleDeleteProject = async () => {
    try {
      // Use projectsApi instead of direct axios
      await projectsApi.deleteProject(id);
      navigate('/dashboard', { state: { message: 'Project deleted successfully' } });
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  // Handle Project Plan deletion
  const handleDeleteProjectPlan = async () => {
    try {
      // Use apiClient instead of direct axios
      await apiClient.delete(`/projects/${project._id}/documents/project-plan`);
      refreshProject();
      return true;
    } catch (err) {
      console.error('Error deleting Project Plan:', err);
      alert('Failed to delete Project Plan. Please try again.');
      return false;
    }
  };

  // Handle Project Charter deletion
  const handleDeleteProjectCharter = async () => {
    try {
      // Use apiClient instead of direct axios
      await apiClient.delete(`/projects/${project._id}/documents/project-charter`);
      refreshProject();
      return true;
    } catch (err) {
      console.error('Error deleting Project Charter:', err);
      alert('Failed to delete Project Charter. Please try again.');
      return false;
    }
  };

  // Handle Risk Register deletion
  const handleDeleteRiskRegister = async () => {
    try {
      // Use apiClient instead of direct axios
      await apiClient.delete(`/projects/${project._id}/documents/risk-register`);
      refreshProject();
      return true;
    } catch (err) {
      console.error('Error deleting Risk Register:', err);
      alert('Failed to delete Risk Register. Please try again.');
      return false;
    }
  };
  
  // Handle Project Budget deletion
  const handleDeleteProjectBudget = async () => {
    try {
      // Use projectsApi instead of direct axios
      await projectsApi.deleteProjectBudgetReport(project._id);
      refreshProject();
      return true;
    } catch (err) {
      console.error('Error deleting Project Budget Report:', err);
      alert('Failed to delete Project Budget Report. Please try again.');
      return false;
    }
  };

  // Handle Lean Canvas deletion
  const handleDeleteLeanCanvas = async () => {
    try {
      // Use projectsApi instead of direct axios
      await projectsApi.deleteLeanCanvas(project._id);
      refreshProject();
      return true;
    } catch (err) {
      console.error('Error deleting Lean Canvas:', err);
      alert('Failed to delete Lean Canvas. Please try again.');
      return false;
    }
  };

  // Handle Close Out Report deletion
  const handleDeleteCloseOutReport = async () => {
    try {
      // Use apiClient instead of direct axios
      await apiClient.delete(`/projects/${project._id}/documents/close-out-report`);
      refreshProject();
      return true;
    } catch (err) {
      console.error('Error deleting Close Out Report:', err);
      alert('Failed to delete Close Out Report. Please try again.');
      return false;
    }
  };

  // Handle Stakeholder Register deletion
  const handleDeleteStakeholderRegister = async () => {
    try {
      // Use apiClient instead of direct axios
      await apiClient.delete(`/projects/${project._id}/documents/stakeholder-register`);
      refreshProject();
      return true;
    } catch (err) {
      console.error('Error deleting Stakeholder Register:', err);
      alert('Failed to delete Stakeholder Register. Please try again.');
      return false;
    }
  };

  // Handle WBS deletion
  const handleDeleteWBS = async () => {
    try {
      // Use apiClient instead of direct axios
      await apiClient.delete(`/projects/${project._id}/documents/wbs`);
      refreshProject();
      return true;
    } catch (err) {
      console.error('Error deleting WBS:', err);
      alert('Failed to delete WBS. Please try again.');
      return false;
    }
  };

  // Render conditionally (all hooks are called at the top, so early returns are fine if consistent)
  if (loading) return (
    <>
      <Navbar />
      <div className="project-details-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    </>
  );
  
  if (error) return (
    <>
      <Navbar />
      <div className="project-details-container">
        <div className="error-container">
          <p className="error-text">{error}</p>
        </div>
      </div>
    </>
  );
  
  if (!project) return null;

  return (
    <>
      <Navbar />
      <div className="project-details-container">
        {/* Project Header */}
        <div className="project-header">
          <div>
            <h1 className="project-title">{project.name}</h1>
            <p className="project-dates">
              {startDateStr} - {endDateStr}
            </p>
          </div>
          <div className="upper-buttons">
            <button className="edit-project-btn" onClick={() => setShowEditModal(true)}>
              Edit Project
            </button>
            <button className="delete-project-btn" onClick={() => setShowDeleteModal(true)}>
              Delete Project
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="project-kpi-row">
          {/* NOT STARTED KPI - Clickable for filtering */}
          <div 
            className={`project-kpi-card ${activeKpi === 'notStarted' ? 'kpi-card-active' : ''}`}
            onClick={() => handleKpiClick('notStarted')}
          >
            <div className="kpi-icon">
              <FaHourglass style={{ color: "var(--primary-color)" }} />
            </div>
            <h4>NOT STARTED</h4>
            <p style={{ color: "var(--primary-color)" }}>{notStartedDeliverables}</p>
          </div>
          
          {/* IN PROGRESS KPI - Clickable for filtering */}
          <div 
            className={`project-kpi-card ${activeKpi === 'inProgress' ? 'kpi-card-active' : ''}`}
            onClick={() => handleKpiClick('inProgress')}
          >
            <div className="kpi-icon">
              <FaSpinner style={{ color: "#FF9800" }} />
            </div>
            <h4>IN PROGRESS</h4>
            <p style={{ color: "#FF9800" }}>{inProgressDeliverables}</p>
          </div>
          
          {/* DUE THIS WEEK KPI - Clickable for filtering */}
          <div 
            className={`project-kpi-card ${activeKpi === 'dueThisWeek' ? 'kpi-card-active' : ''}`}
            onClick={() => handleKpiClick('dueThisWeek')}
          >
            <div className="kpi-icon">
              <FaCalendarWeek style={{ color: "#3ecbf5" }} />
            </div>
            <h4>DUE THIS WEEK</h4>
            <p style={{ color: "#3ecbf5" }}>{dueThisWeekDeliverables}</p>
          </div>
          
          {/* OVERDUE DELIVERABLES KPI - Clickable for filtering */}
          <div 
            className={`project-kpi-card ${activeKpi === 'overdue' ? 'kpi-card-active' : ''}`}
            onClick={() => handleKpiClick('overdue')}
          >
            <div className="kpi-icon">
              <FaExclamationTriangle style={{ color: "#f5a623" }} />
            </div>
            <h4>OVERDUE</h4>
            <p style={{ color: "#f5a623" }}>{overdueDeliverables}</p>
          </div>
          
          {/* COMPLETED DELIVERABLES KPI - Clickable for filtering */}
          <div 
            className={`project-kpi-card ${activeKpi === 'completed' ? 'kpi-card-active' : ''}`}
            onClick={() => handleKpiClick('completed')}
          >
            <div className="kpi-icon">
              <FaCheckCircle style={{ color: "var(--primary-color)" }} />
            </div>
            <h4>COMPLETED</h4>
            <p style={{ color: "var(--primary-color)" }}>
              {completedDeliverables} / {totalDeliverables}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs-container">
          <button
            className={activeTab === "deliverables" ? "tab active" : "tab"}
            onClick={() => setActiveTab("deliverables")}
          >
            DELIVERABLES
          </button>
          <button
            className={activeTab === "documentation" ? "tab active" : "tab"}
            onClick={() => setActiveTab("documentation")}
          >
            DOCUMENTATION
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "deliverables" && (
          <div className="deliverables-section">
            <h3>Deliverables</h3>
            <ul className="deliverable-list">
              {activeKpi && filteredDeliverables.length === 0 ? (
                <p className="no-deliverables-message">No deliverables match the selected filter.</p>
              ) : (!project.deliverables || project.deliverables.length === 0) ? (
                <div className="empty-deliverables-container">
                  <p className="no-deliverables-message">No deliverables added yet.</p>
                  <p className="empty-state-hint">Click "Add Deliverable" to get started.</p>
                </div>
              ) : (
                (activeKpi ? filteredDeliverables : project.deliverables).map((d, idx) => (
                <li key={d._id || idx} className="deliverable-item">
                    <div className="deliverable-info">
                  <h5 className="deliverable-title">{d.name}</h5>
                  <p className="deliverable-status">Status: <span>{d.status}</span></p>
                      {d.end_date && <p className="deliverable-date">Due: {parseDate(d.end_date)?.toLocaleDateString()}</p>}
                    </div>
                  
                  <div className="deliverable-buttons">
                    <button className="edit-btn" onClick={() => handleEditDeliverable(d)}>Edit</button>
                    <button 
                      className="delete-btn" 
                      onClick={() => {
                        console.log("Setting up delete for deliverable:", d._id);
                        setSelectedDeliverableToDelete(d._id);
                        setShowDeleteDeliverableModal(true);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
                ))
              )}
            </ul>

            <button className="add-deliverable-btn" onClick={() => setShowDeliverableModal(true)}>
              + Add Deliverable
            </button>
          </div>
        )}

          {activeTab === "documentation" && (
          <div className="documentation-section">
            <h3>Documentation</h3>
            <ul className="documentation-list">
              {project.documents && project.documents.length > 0 ? (
                project.documents.map((doc) => (
                  <li key={doc._id || Math.random()} className="document-item">
                    {doc.type === "ProjectBudgetReport" ? (
                      <>
                        <div>
                          <h5 className="document-title">Project Budget Report</h5>
                          <p className="document-dates">
                            Created: {formatDate(parseDate(doc.created_at))} | Last Updated: {formatDate(parseDate(doc.updated_at))}
                          </p>
                        </div>
                        <div className="document-buttons">
                          <button
                            className="view-btn"
                            onClick={() => navigate(`/projects/${project._id}/project-budget/view`)}
                          >
                            View
                          </button>
                          <button
                            className="delete-doc-btn"
                            onClick={() => initiateDocumentDelete("Project Budget Report", handleDeleteProjectBudget)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : doc.type === "LeanCanvas" ? (
                      <>
                        <div>
                          <h5 className="document-title">Lean Canvas</h5>
                          <p className="document-dates">
                            Created: {formatDate(parseDate(doc.created_at))} | Last Updated: {formatDate(parseDate(doc.updated_at))}
                          </p>
                        </div>
                        <div className="document-buttons">
                          <button
                            className="view-btn"
                            onClick={() => navigate(`/projects/${project._id}/lean-canvas/view`)}
                          >
                            View
                          </button>
                          <button
                            className="delete-doc-btn"
                            onClick={() => initiateDocumentDelete("Lean Canvas", handleDeleteLeanCanvas)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : doc.type === "ProjectPlan" ? (
                      <>
                        <div>
                          <h5 className="document-title">Project Plan</h5>
                          <p className="document-dates">
                            Created: {formatDate(parseDate(doc.created_at))} | Last Updated: {formatDate(parseDate(doc.updated_at))}
                          </p>
                        </div>
                        <div className="document-buttons">
                          <button
                            className="view-btn"
                            onClick={() => navigate(`/projects/${project._id}/project-plan/view`)}
                          >
                            View
                          </button>
                          <button
                            className="delete-doc-btn"
                            onClick={() => initiateDocumentDelete("Project Plan", handleDeleteProjectPlan)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : doc.type === "ProjectCharter" || doc.type === "PROJECT_CHARTER" ? (
                      <>
                        <div>
                          <h5 className="document-title">Project Charter</h5>
                          <p className="document-dates">
                            Created: {formatDate(parseDate(doc.created_at))} | Last Updated: {formatDate(parseDate(doc.updated_at))}
                          </p>
                        </div>
                        <div className="document-buttons">
                          <button
                            className="view-btn"
                            onClick={() => navigate(`/projects/${project._id}/project-charter/view`)}
                          >
                            View
                          </button>
                          <button
                            className="delete-doc-btn"
                            onClick={() => initiateDocumentDelete("Project Charter", handleDeleteProjectCharter)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : doc.type === "RiskRegister" ? (
                      <>
                        <div>
                          <h5 className="document-title">Risk Register</h5>
                          <p className="document-dates">
                            Created: {formatDate(parseDate(doc.created_at))} | Last Updated: {formatDate(parseDate(doc.updated_at))}
                          </p>
                        </div>
                        <div className="document-buttons">
                          <button
                            className="view-btn"
                            onClick={() => navigate(`/projects/${project._id}/risk-register/view`)}
                          >
                            View
                          </button>
                          <button
                            className="delete-doc-btn"
                            onClick={() => initiateDocumentDelete("Risk Register", handleDeleteRiskRegister)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : doc.type === "StakeholderRegister" ? (
                      <>
                        <div>
                          <h5 className="document-title">Stakeholder Register</h5>
                          <p className="document-dates">
                            Created: {formatDate(parseDate(doc.created_at))} | Last Updated: {formatDate(parseDate(doc.updated_at))}
                          </p>
                        </div>
                        <div className="document-buttons">
                          <button
                            className="view-btn"
                            onClick={() => navigate(`/projects/${project._id}/stakeholder-register/view`)}
                          >
                            View
                          </button>
                          <button
                            className="delete-doc-btn"
                            onClick={() => initiateDocumentDelete("Stakeholder Register", handleDeleteStakeholderRegister)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : doc.type === "CloseOutReport" || doc.type === "CLOSE_OUT_REPORT" ? (
                      <>
                        <div>
                          <h5 className="document-title">Close Out Report</h5>
                          <p className="document-dates">
                            Created: {formatDate(parseDate(doc.created_at))} | Last Updated: {formatDate(parseDate(doc.updated_at))}
                          </p>
                        </div>
                        <div className="document-buttons">
                          <button
                            className="view-btn"
                            onClick={() => navigate(`/projects/${project._id}/close-out-report/view`)}
                          >
                            View
                          </button>
                          <button
                            className="delete-doc-btn"
                            onClick={() => initiateDocumentDelete("Close Out Report", handleDeleteCloseOutReport)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : doc.type === "WBS" ? (
                      <>
                        <div>
                          <h5 className="document-title">WBS</h5>
                          <p className="document-dates">
                            Created: {formatDate(parseDate(doc.created_at))} | Last Updated: {formatDate(parseDate(doc.updated_at))}
                          </p>
                        </div>
                        <div className="document-buttons">
                          <button
                            className="view-btn"
                            onClick={() => navigate(`/projects/${project._id}/work-breakdown-structure/view`)}
                          >
                            View
                          </button>
                          <button
                            className="delete-doc-btn"
                            onClick={() => initiateDocumentDelete("WBS", handleDeleteWBS)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    ) : (
                      <p>Another document: {doc.type}</p>
                    )}
                  </li>
                ))
              ) : (
                <p className="no-deliverables-message">No documents yet.</p>
              )}
            </ul>
          </div>
        )}
       
      </div>

      {/* Modals */}
      {showEditModal && (
        <ProjectEditModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onProjectUpdated={refreshProject}
        />
      )}

      {showDeliverableModal && (
        <DeliverableModal
          projectId={project._id}
          onClose={() => setShowDeliverableModal(false)}
          onDeliverableAdded={refreshProject}
        />
      )}

      {showDeliverableEditModal && (
        <DeliverableEditModal
          projectId={project._id}
          deliverable={selectedDeliverable}
          onClose={() => setShowDeliverableEditModal(false)}
          onDeliverableUpdated={refreshProject}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false);
          handleDeleteProject();
        }}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
      />

      <ConfirmationModal
        isOpen={showDeleteDeliverableModal}
        onClose={() => {
          setShowDeleteDeliverableModal(false);
          setSelectedDeliverableToDelete(null);
        }}
        onConfirm={() => {
          console.log("Confirming delete for deliverable:", selectedDeliverableToDelete);
          handleDeleteDeliverable(selectedDeliverableToDelete);
          setShowDeleteDeliverableModal(false);
          setSelectedDeliverableToDelete(null);
        }}
        title="Delete Deliverable"
        message="Are you sure you want to delete this deliverable? This action cannot be undone."
      />

      <ConfirmationModal
        isOpen={showDeleteDocumentModal}
        onClose={() => {
          setShowDeleteDocumentModal(false);
          setSelectedDocumentToDelete({ type: null, handler: null });
        }}
        onConfirm={() => {
          setShowDeleteDocumentModal(false);
          selectedDocumentToDelete.handler();
          setSelectedDocumentToDelete({ type: null, handler: null });
        }}
        title={`Delete ${selectedDocumentToDelete.type}`}
        message={`Are you sure you want to delete this ${selectedDocumentToDelete.type}? This action cannot be undone.`}
      />
    </>
  );
};

export default ProjectDetails;
  