import React, { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import Navbar from "../../components/Navbar";
import "./ViewCloseOutReport.css";

const ViewCloseOutReport = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Data states
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Toggle between read-only and edit mode
  const [isEditMode, setIsEditMode] = useState(false);

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

  // Function to fetch close out report data
  const fetchCloseOutReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching close out report for project:', projectId);
      
      // Use the API function from the projects service
      const response = await projectsApi.fetchCloseOutReport(projectId);
      console.log('Fetched close out report data:', response);
      
      // Store the whole response
      setReport(response);
      
      // Handle different possible data structures
      let reportData = null;
      
      if (response) {
        if (response.data) {
          // Standard API response with data field
          const data = response.data;
          
          if (data === null) {
            // No report exists yet
            console.log('No Close Out Report data found');
            setLoading(false);
            return;
          }
          
          // Check for content wrapper (older format)
          if (data.content) {
            reportData = data.content;
            console.log('Using response.data.content format');
          } 
          // Direct data in response.data (newer format)
          else {
            reportData = data;
            console.log('Using direct data in response.data format');
          }
        } 
        // Direct response with content field
        else if (response.content) {
          reportData = response.content;
          console.log('Using response.content format');
        } 
        // Direct response contains the data fields
        else {
          reportData = response;
          console.log('Using direct response format');
        }
      }
      
      if (!reportData) {
        console.warn('Could not extract report data from response:', response);
        setError("Invalid Close Out Report data format");
        setLoading(false);
        return;
      }
      
      // Set all state variables with fetched data
      setProjectOverview(reportData.projectOverview || "");
      setFinalStatus(reportData.finalStatus || "");
      
      // Set planned vs actual data
      setPlannedVsActual(reportData.plannedVsActual || {
        budget: { planned: "", actual: "", variance: "" },
        schedule: { planned: "", actual: "", variance: "" },
        scope: { planned: "", actual: "", variance: "" }
      });
      
      // Set lessons learned data
      setLessonsLearned(reportData.lessonsLearned || "");
      setRecommendations(reportData.recommendations || "");
      
      // Set deliverables and stakeholder acceptance
      setFinalDeliverables(Array.isArray(reportData.finalDeliverables) && reportData.finalDeliverables.length > 0 
        ? reportData.finalDeliverables 
        : [{ name: "", completed: false }]
      );
      
      setStakeholderAcceptance(Array.isArray(reportData.stakeholderAcceptance) && reportData.stakeholderAcceptance.length > 0 
        ? reportData.stakeholderAcceptance 
        : [{ name: "", role: "", acceptanceDate: "", comments: "" }]
      );
      
      // Set reflection data
      setTeamFeedback(reportData.teamFeedback || "");
      setClientFeedback(reportData.clientFeedback || "");
      
      setFutureActionItems(Array.isArray(reportData.futureActionItems) && reportData.futureActionItems.length > 0 
        ? reportData.futureActionItems 
        : [""]
      );
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching Close Out Report:", err);
      setError("Close Out Report not found or access denied.");
      setLoading(false);
    }
  };
  
  // Fetch the close out report data
  useEffect(() => {
    if (projectId) {
      fetchCloseOutReport();
    }
  }, [projectId]);

  // State variables for all editable fields
  const [projectOverview, setProjectOverview] = useState("");
  const [finalStatus, setFinalStatus] = useState("");
  const [plannedVsActual, setPlannedVsActual] = useState({
    budget: { planned: "", actual: "", variance: "" },
    schedule: { planned: "", actual: "", variance: "" },
    scope: { planned: "", actual: "", variance: "" }
  });
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [finalDeliverables, setFinalDeliverables] = useState([
    { name: "", completed: false }
  ]);
  const [stakeholderAcceptance, setStakeholderAcceptance] = useState([
    { name: "", role: "", acceptanceDate: "", comments: "" }
  ]);
  const [teamFeedback, setTeamFeedback] = useState("");
  const [clientFeedback, setClientFeedback] = useState("");
  const [futureActionItems, setFutureActionItems] = useState([""]);

  // Toggle edit mode
  const handleToggleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  // Add/Remove/Update item handlers
  const addDeliverable = () => {
    setFinalDeliverables([...finalDeliverables, { name: "", completed: false }]);
  };

  const removeDeliverable = (index) => {
    const newDeliverables = [...finalDeliverables];
    newDeliverables.splice(index, 1);
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
    const newStakeholders = [...stakeholderAcceptance];
    newStakeholders.splice(index, 1);
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
    const newItems = [...futureActionItems];
    newItems.splice(index, 1);
    setFutureActionItems(newItems.length ? newItems : [""]); 
  };

  const updateActionItem = (index, value) => {
    const newItems = [...futureActionItems];
    newItems[index] = value;
    setFutureActionItems(newItems);
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

  // Save updated Close Out Report
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      // Calculate current version
      let currentVersion = 1;
      if (report) {
        // Try to find version in all possible locations
        if (report.version) {
          currentVersion = report.version;
        } else if (report.data?.version) {
          currentVersion = report.data.version;
        } else if (report.content?.version) {
          currentVersion = report.content.version;
        }
        currentVersion = (parseInt(currentVersion) || 0) + 1;
      }
      
      // Create a properly structured payload
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
        version: currentVersion,
        updated_at: new Date().toISOString()
      };
      
      // Add created_at if this is the first version
      if (currentVersion === 1) {
        payload.created_at = new Date().toISOString();
      } else {
        // Preserve created_at from the original data if it exists
        if (report.created_at) {
          payload.created_at = report.created_at;
        } else if (report.data?.created_at) {
          payload.created_at = report.data.created_at;
        } else if (report.content?.created_at) {
          payload.created_at = report.content.created_at;
        }
      }
      
      console.log('Saving Close Out Report with data:', payload);

      // Save to MongoDB via the API
      await projectsApi.updateCloseOutReport(projectId, payload);
      
      // Refetch the updated data
      await fetchCloseOutReport();
      
      setIsEditMode(false);
      setMessage("Close Out Report updated successfully!");
    } catch (err) {
      console.error("Error saving Close Out Report:", err);
      setError(`Failed to save Close Out Report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit mode
  const handleCancel = async () => {
    try {
      setLoading(true);
      // Refetch the data from the server
      await fetchCloseOutReport();
    } catch (err) {
      console.error("Error refetching Close Out Report:", err);
    } finally {
      setLoading(false);
      setIsEditMode(false);
    }
  };

  // Return to Project Details page
  const handleBackToProject = () => {
    navigate(`/projects/${projectId}`);
  };

  // Loading and error handling
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-report-wrapper">
          <p>Loading Close Out Report...</p>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-report-wrapper">
          <p className="error-text">{error}</p>
        </div>
      </>
    );
  }

  // Render the read-only view
  const renderReadOnlyView = () => (
    <div className="view-report-container">
      <div className="report-header">
        <h2>Close Out Report {report?.version ? `(Version ${report.version})` : ''}</h2>
        <div>
          <button className="btn-primary" onClick={handleToggleEdit}>
            Edit Report
          </button>
        </div>
      </div>
      
      {message && <div className="success-text">{message}</div>}
      
      {/* Project Summary & Outcomes Section */}
      <div className="report-section">
        <div className="section-header" onClick={() => toggleSection('projectSummary')}>
          <h3>Project Summary & Outcomes</h3>
          {expandedSections.projectSummary ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        
        {expandedSections.projectSummary && (
          <div className="section-content">
            <div className="summary-card">
              <div className="summary-card-title">Project Status</div>
              <div className="summary-card-content">
                <div className="summary-stat">
                  <div className="summary-stat-label">Final Status</div>
                  <div className="summary-stat-value">
                    {finalStatus ? (
                      <span className={`status-badge ${
                        finalStatus === "Completed" ? "completed" : 
                        finalStatus === "Partially Completed" ? "partial" : 
                        "cancelled"
                      }`}>
                        {finalStatus}
                      </span>
                    ) : "Not specified"}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="report-content">
              <h4>Project Overview</h4>
              <p>{projectOverview || "No project overview provided."}</p>
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
            <div className="report-content">
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
                    <td>{plannedVsActual?.budget?.planned || "N/A"}</td>
                    <td>{plannedVsActual?.budget?.actual || "N/A"}</td>
                    <td className={
                      plannedVsActual?.budget?.variance?.startsWith("-") ? "negative" : 
                      plannedVsActual?.budget?.variance?.startsWith("+") ? "positive" : ""
                    }>
                      {plannedVsActual?.budget?.variance || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="metric-name">Schedule</td>
                    <td>{plannedVsActual?.schedule?.planned || "N/A"}</td>
                    <td>{plannedVsActual?.schedule?.actual || "N/A"}</td>
                    <td className={
                      plannedVsActual?.schedule?.variance?.startsWith("-") ? "negative" : 
                      plannedVsActual?.schedule?.variance?.startsWith("+") ? "positive" : ""
                    }>
                      {plannedVsActual?.schedule?.variance || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="metric-name">Scope</td>
                    <td>{plannedVsActual?.scope?.planned || "N/A"}</td>
                    <td>{plannedVsActual?.scope?.actual || "N/A"}</td>
                    <td className={
                      plannedVsActual?.scope?.variance?.startsWith("-") ? "negative" : 
                      plannedVsActual?.scope?.variance?.startsWith("+") ? "positive" : ""
                    }>
                      {plannedVsActual?.scope?.variance || "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
            <div className="report-content">
              <h4>Lessons Learned</h4>
              <p>{lessonsLearned || "No lessons learned have been documented."}</p>
              
              <h4>Recommendations</h4>
              <p>{recommendations || "No recommendations have been documented."}</p>
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
            <div className="report-content">
              <h4>Final Deliverables</h4>
              
              {finalDeliverables && finalDeliverables.length > 0 && finalDeliverables[0].name ? (
                <ul className="deliverables-list">
                  {finalDeliverables.map((deliverable, index) => (
                    <li 
                      key={`deliverable-${index}`} 
                      className={`deliverable-item ${deliverable.completed ? 'completed' : ''}`}
                    >
                      <span className="deliverable-item-checkbox">
                        <input type="checkbox" checked={deliverable.completed} readOnly />
                      </span>
                      <span className="deliverable-item-name">
                        {deliverable.name}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No deliverables have been specified.</p>
              )}
              
              <h4>Stakeholder Acceptance</h4>
              
              {stakeholderAcceptance && stakeholderAcceptance.length > 0 && stakeholderAcceptance[0].name ? (
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Acceptance Date</th>
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakeholderAcceptance.map((stakeholder, index) => (
                      <tr key={`stakeholder-${index}`}>
                        <td>{stakeholder.name}</td>
                        <td>{stakeholder.role}</td>
                        <td>{stakeholder.acceptanceDate || "N/A"}</td>
                        <td>{stakeholder.comments || "No comments"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No stakeholder acceptance records have been added.</p>
              )}
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
                <p>{teamFeedback || "No team feedback has been provided."}</p>
              </div>
              
              <div className="feedback-card">
                <div className="feedback-card-title">Client Feedback</div>
                <p>{clientFeedback || "No client feedback has been provided."}</p>
              </div>
            </div>
            
            <div className="report-content">
              <h4>Future Action Items</h4>
              
              {futureActionItems && futureActionItems.length > 0 && futureActionItems[0] ? (
                <ul>
                  {futureActionItems.map((item, index) => (
                    <li key={`action-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No future action items have been specified.</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="button-group">
        <button className="btn-secondary" onClick={handleBackToProject}>
          Back to Project
        </button>
      </div>
    </div>
  );

  // Render the edit mode view
  const renderEditMode = () => (
    <div className="edit-report-container">
      <div className="report-header">
        <h2>Edit Close Out Report</h2>
      </div>
      
      {error && <div className="error-text">{error}</div>}
      
      <form className="report-form">
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
                        value={plannedVsActual?.budget?.planned || ""}
                        onChange={(e) => handlePerformanceChange('budget', 'planned', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Actual budget"
                        value={plannedVsActual?.budget?.actual || ""}
                        onChange={(e) => handlePerformanceChange('budget', 'actual', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Variance (+/-)"
                        value={plannedVsActual?.budget?.variance || ""}
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
                        value={plannedVsActual?.schedule?.planned || ""}
                        onChange={(e) => handlePerformanceChange('schedule', 'planned', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Actual schedule"
                        value={plannedVsActual?.schedule?.actual || ""}
                        onChange={(e) => handlePerformanceChange('schedule', 'actual', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Variance (+/-)"
                        value={plannedVsActual?.schedule?.variance || ""}
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
                        value={plannedVsActual?.scope?.planned || ""}
                        onChange={(e) => handlePerformanceChange('scope', 'planned', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Actual scope"
                        value={plannedVsActual?.scope?.actual || ""}
                        onChange={(e) => handlePerformanceChange('scope', 'actual', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Variance (+/-)"
                        value={plannedVsActual?.scope?.variance || ""}
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
            type="button"
            className="btn-save"
            onClick={handleSave}
          >
            Save Close Out Report
          </button>
        </div>
      </form>
    </div>
  );

  // Render the main component
  return (
    <>
      <Navbar />
      <div className="view-report-wrapper">
        {isEditMode ? (
          renderEditMode()
        ) : (
          renderReadOnlyView()
        )}
      </div>
    </>
  );
};

export default ViewCloseOutReport; 