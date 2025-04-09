import React, { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp, FaPlus, FaTrash } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import Navbar from "../../components/Navbar";
import "./CloseOutReportTemplate.css";

const API_BASE = "http://localhost:5000/api";

const CloseOutReportTemplate = () => {
  const navigate = useNavigate();

  // Toggle for showing the customization form
  const [showCustomize, setShowCustomize] = useState(false);

  // Projects dropdown
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    projectSummary: true,
    performanceAnalysis: true,
    lessonsRecommendations: true,
    finalDeliverables: true,
    postProjectReflection: true
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  // Project Summary & Outcomes
  const [projectOverview, setProjectOverview] = useState("");
  const [finalStatus, setFinalStatus] = useState("");

  // Performance Analysis
  const [plannedVsActual, setPlannedVsActual] = useState({
    budget: { planned: "", actual: "", variance: "" },
    schedule: { planned: "", actual: "", variance: "" },
    scope: { planned: "", actual: "", variance: "" }
  });

  // Lessons Learned & Recommendations
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [recommendations, setRecommendations] = useState("");

  // Final Deliverables & Acceptance
  const [finalDeliverables, setFinalDeliverables] = useState([
    { name: "", completed: false }
  ]);
  
  const [stakeholderAcceptance, setStakeholderAcceptance] = useState([
    { name: "", role: "", acceptanceDate: "", comments: "" }
  ]);

  // Post-Project Reflection
  const [teamFeedback, setTeamFeedback] = useState("");
  const [clientFeedback, setClientFeedback] = useState("");
  const [futureActionItems, setFutureActionItems] = useState([""]);

  // Loading & error states
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Fetch all projects for the dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsApi.fetchProjects();
        // Handle different response formats and ensure we have an array
        if (Array.isArray(response)) {
          setProjects(response);
        } else if (response && response.data && Array.isArray(response.data)) {
          setProjects(response.data);
        } else {
          console.error("Unexpected response format:", response);
          setProjects([]); // Set empty array as fallback
        }
        setLoadingProjects(false);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again.");
        setProjects([]); // Set empty array on error
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Add/remove item handlers for arrays
  const addDeliverable = () => {
    setFinalDeliverables([...finalDeliverables, { name: "", completed: false }]);
  };

  const removeDeliverable = (index) => {
    const newDeliverables = finalDeliverables.filter((_, i) => i !== index);
    setFinalDeliverables(newDeliverables.length ? newDeliverables : [{ name: "", completed: false }]);
  };

  const updateDeliverable = (index, field, value) => {
    const newDeliverables = [...finalDeliverables];
    newDeliverables[index][field] = value;
    setFinalDeliverables(newDeliverables);
  };

  const addStakeholder = () => {
    setStakeholderAcceptance([...stakeholderAcceptance, { name: "", role: "", acceptanceDate: "", comments: "" }]);
  };

  const removeStakeholder = (index) => {
    const newStakeholders = stakeholderAcceptance.filter((_, i) => i !== index);
    setStakeholderAcceptance(
      newStakeholders.length ? newStakeholders : [{ name: "", role: "", acceptanceDate: "", comments: "" }]
    );
  };

  const updateStakeholder = (index, field, value) => {
    const newStakeholders = [...stakeholderAcceptance];
    newStakeholders[index][field] = value;
    setStakeholderAcceptance(newStakeholders);
  };

  const addActionItem = () => {
    setFutureActionItems([...futureActionItems, ""]);
  };

  const removeActionItem = (index) => {
    const newItems = futureActionItems.filter((_, i) => i !== index);
    setFutureActionItems(newItems.length ? newItems : [""]);
  };

  const updateActionItem = (index, value) => {
    const newItems = [...futureActionItems];
    newItems[index] = value;
    setFutureActionItems(newItems);
  };

  // Handle form submission
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!selectedProject) {
      setError("Please select a project to save this Close Out Report");
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage("Saving Close Out Report... Please wait.");
    
    try {
      const payload = {
        type: "CloseOutReport",
        projectOverview,
        finalStatus,
        plannedVsActual,
        lessonsLearned,
        recommendations,
        finalDeliverables,
        stakeholderAcceptance,
        teamFeedback,
        clientFeedback,
        futureActionItems,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Save to MongoDB via the API
      await projectsApi.updateCloseOutReport(selectedProject, payload);
      
      setMessage("Close Out Report saved successfully!");
      
      // Redirect to project details after a short delay
      setTimeout(() => {
        navigate(`/projects/${selectedProject}`);
      }, 1500);
      
    } catch (err) {
      console.error("Error saving Close Out Report:", err);
      
      // Show more detailed error message
      let errorMsg = "Failed to save Close Out Report. ";
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMsg += "The request timed out. Please try again.";
      } else if (err.message?.includes('User not authenticated')) {
        errorMsg += "You need to be logged in. Please refresh the page and try again.";
      } else if (err.message?.includes('Network Error')) {
        errorMsg += "There was a network error. Please check your connection.";
      } else {
        errorMsg += err.message || "An unknown error occurred.";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle performance analysis field updates
  const handlePerformanceChange = (category, field, value) => {
    setPlannedVsActual({
      ...plannedVsActual,
      [category]: {
        ...plannedVsActual[category],
        [field]: value
      }
    });
  };

  // Navigate to the dashboard on cancel
  const handleCancel = () => {
    navigate("/dashboard");
  };

  // Toggle customization view
  const handleCustomize = () => {
    setShowCustomize(true);
  };

  // Render initial template view
  if (!showCustomize) {
    return (
      <>
        <Navbar />
        <div className="template-initial-view">
          <div className="template-content">
            <h1 className="template-title">Close Out Report Template</h1>
            <p className="template-description">
              The Close Out Report documents the final outcomes of the project, including performance 
              versus objectives, lessons learned, and final deliverable acceptance. It serves as the 
              formal record of project completion and helps transfer knowledge for future projects.
            </p>
            <button className="template-customize-btn" onClick={handleCustomize}>
              Customize Template
            </button>
          </div>
        </div>
      </>
    );
  }

  // Render customization form
  return (
    <>
      <Navbar />
      <div className="report-customize-container">
        <div className="report-header">
          <h2>Close Out Report</h2>
        </div>

        {error && <div className="error-text">{error}</div>}
        {message && <div className="success-text">{message}</div>}

        <form onSubmit={handleSave} className="report-form">
          {/* Project selection */}
          <div className="form-group project-select-group">
            <label htmlFor="projectSelect">Select Project:</label>
            {loadingProjects ? (
              <p>Loading projects...</p>
            ) : (
              <select
                id="projectSelect"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="form-select"
              >
                <option value="">-- Choose Project --</option>
                {Array.isArray(projects) && projects.length > 0 ? (
                  projects.map((proj) => (
                    <option key={proj._id || Math.random()} value={proj._id}>
                      {proj.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No projects available</option>
                )}
              </select>
            )}
          </div>

          {/* Project Summary & Outcomes Section */}
          <div className="report-section">
            <div className="section-header" onClick={() => toggleSection('projectSummary')}>
              <h3>Project Summary & Outcomes</h3>
              {expandedSections.projectSummary ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedSections.projectSummary && (
              <div className="section-content">
                <div className="form-group">
                  <label htmlFor="projectOverview">Project Overview:</label>
                  <textarea
                    id="projectOverview"
                    value={projectOverview}
                    onChange={(e) => setProjectOverview(e.target.value)}
                    placeholder="Summarize the project's achievements and outcomes"
                    rows="4"
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="finalStatus">Final Status:</label>
                  <select
                    id="finalStatus"
                    value={finalStatus}
                    onChange={(e) => setFinalStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- Select Status --</option>
                    <option value="Completed">Completed</option>
                    <option value="Partially Completed">Partially Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Performance Analysis Section */}
          <div className="report-section">
            <div className="section-header" onClick={() => toggleSection('performanceAnalysis')}>
              <h3>Performance Analysis</h3>
              {expandedSections.performanceAnalysis ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedSections.performanceAnalysis && (
              <div className="section-content">
                <h4>Planned vs. Actual Comparison</h4>
                
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Planned</th>
                      <th>Actual</th>
                      <th>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="metric-name">Budget</td>
                      <td>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Planned budget"
                          value={plannedVsActual.budget.planned}
                          onChange={(e) => handlePerformanceChange('budget', 'planned', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Actual budget"
                          value={plannedVsActual.budget.actual}
                          onChange={(e) => handlePerformanceChange('budget', 'actual', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Variance"
                          value={plannedVsActual.budget.variance}
                          onChange={(e) => handlePerformanceChange('budget', 'variance', e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="metric-name">Schedule</td>
                      <td>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Planned schedule"
                          value={plannedVsActual.schedule.planned}
                          onChange={(e) => handlePerformanceChange('schedule', 'planned', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Actual schedule"
                          value={plannedVsActual.schedule.actual}
                          onChange={(e) => handlePerformanceChange('schedule', 'actual', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Variance"
                          value={plannedVsActual.schedule.variance}
                          onChange={(e) => handlePerformanceChange('schedule', 'variance', e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="metric-name">Scope</td>
                      <td>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Planned scope"
                          value={plannedVsActual.scope.planned}
                          onChange={(e) => handlePerformanceChange('scope', 'planned', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Actual scope"
                          value={plannedVsActual.scope.actual}
                          onChange={(e) => handlePerformanceChange('scope', 'actual', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Variance"
                          value={plannedVsActual.scope.variance}
                          onChange={(e) => handlePerformanceChange('scope', 'variance', e.target.value)}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Lessons Learned & Recommendations Section */}
          <div className="report-section">
            <div className="section-header" onClick={() => toggleSection('lessonsRecommendations')}>
              <h3>Lessons Learned & Recommendations</h3>
              {expandedSections.lessonsRecommendations ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedSections.lessonsRecommendations && (
              <div className="section-content">
                <div className="form-group">
                  <label htmlFor="lessonsLearned">Lessons Learned:</label>
                  <textarea
                    id="lessonsLearned"
                    value={lessonsLearned}
                    onChange={(e) => setLessonsLearned(e.target.value)}
                    placeholder="Describe key lessons learned during the project"
                    rows="4"
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="recommendations">Recommendations:</label>
                  <textarea
                    id="recommendations"
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="Provide recommendations for future projects"
                    rows="4"
                    className="form-textarea"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Final Deliverables & Acceptance Section */}
          <div className="report-section">
            <div className="section-header" onClick={() => toggleSection('finalDeliverables')}>
              <h3>Final Deliverables & Acceptance</h3>
              {expandedSections.finalDeliverables ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedSections.finalDeliverables && (
              <div className="section-content">
                {/* Final Deliverables */}
                <div className="form-group">
                  <label>Final Deliverables:</label>
                  
                  <div className="list-items">
                    {finalDeliverables.map((deliverable, index) => (
                      <div key={`deliverable-${index}`} className="list-item">
                        <div className="list-item-checkbox">
                          <input
                            type="checkbox"
                            checked={deliverable.completed}
                            onChange={(e) => updateDeliverable(index, 'completed', e.target.checked)}
                          />
                          <input
                            type="text"
                            value={deliverable.name}
                            onChange={(e) => updateDeliverable(index, 'name', e.target.value)}
                            placeholder="Deliverable name"
                            className="form-input"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDeliverable(index)}
                          className="remove-btn"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addDeliverable}
                      className="add-btn"
                    >
                      <FaPlus /> Add Deliverable
                    </button>
                  </div>
                </div>

                {/* Stakeholder Acceptance */}
                <div className="form-group">
                  <label>Stakeholder Acceptance:</label>
                  
                  <div className="acceptance-table">
                    <div className="acceptance-header">
                      <div>Name</div>
                      <div>Role</div>
                      <div>Acceptance Date</div>
                      <div>Comments</div>
                      <div>Actions</div>
                    </div>
                    
                    {stakeholderAcceptance.map((stakeholder, index) => (
                      <div key={`acceptance-${index}`} className="acceptance-row">
                        <div>
                          <input
                            type="text"
                            value={stakeholder.name}
                            onChange={(e) => updateStakeholder(index, 'name', e.target.value)}
                            placeholder="Stakeholder name"
                            className="form-input"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={stakeholder.role}
                            onChange={(e) => updateStakeholder(index, 'role', e.target.value)}
                            placeholder="Role/Position"
                            className="form-input"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            value={stakeholder.acceptanceDate}
                            onChange={(e) => updateStakeholder(index, 'acceptanceDate', e.target.value)}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={stakeholder.comments}
                            onChange={(e) => updateStakeholder(index, 'comments', e.target.value)}
                            placeholder="Comments"
                            className="form-input"
                          />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => removeStakeholder(index)}
                            className="remove-btn"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={addStakeholder}
                    className="add-btn"
                  >
                    <FaPlus /> Add Stakeholder
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Post-Project Reflection Section */}
          <div className="report-section">
            <div className="section-header" onClick={() => toggleSection('postProjectReflection')}>
              <h3>Post-Project Reflection</h3>
              {expandedSections.postProjectReflection ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedSections.postProjectReflection && (
              <div className="section-content">
                <div className="feedback-container">
                  <div className="feedback-card">
                    <div className="feedback-card-title">Team Feedback</div>
                    <textarea
                      value={teamFeedback}
                      onChange={(e) => setTeamFeedback(e.target.value)}
                      placeholder="Provide feedback from the project team"
                      rows="4"
                      className="form-textarea"
                    />
                  </div>
                  
                  <div className="feedback-card">
                    <div className="feedback-card-title">Client Feedback</div>
                    <textarea
                      value={clientFeedback}
                      onChange={(e) => setClientFeedback(e.target.value)}
                      placeholder="Provide feedback from the client"
                      rows="4"
                      className="form-textarea"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Future Action Items:</label>
                  
                  <div className="list-items">
                    {futureActionItems.map((item, index) => (
                      <div key={`action-${index}`} className="list-item">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateActionItem(index, e.target.value)}
                          placeholder="Future action item"
                          className="form-input"
                        />
                        <button
                          type="button"
                          onClick={() => removeActionItem(index)}
                          className="remove-btn"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addActionItem}
                      className="add-btn"
                    >
                      <FaPlus /> Add Action Item
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
            >
              Save Close Out Report
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CloseOutReportTemplate; 