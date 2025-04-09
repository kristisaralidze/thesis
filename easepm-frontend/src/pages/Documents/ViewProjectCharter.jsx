// src/pages/Documents/ViewProjectCharter.jsx
import React, { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import Navbar from "../../components/Navbar";
import "./ViewProjectCharter.css"; // Create this CSS file to style the page

const ViewProjectCharter = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Data states
  const [charter, setCharter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Toggle between read-only and edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    projectSummary: true,
    objectivesScope: true,
    stakeholdersRoles: true,
    assumptionsConstraints: true,
    milestonesTimeline: true
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  // Local state for Project Charter fields (for editing)
  const [projectTitle, setProjectTitle] = useState("");
  const [projectSummary, setProjectSummary] = useState("");

  // Objectives & Scope
  const [objectives, setObjectives] = useState([""]);
  const [scopeStatement, setScopeStatement] = useState("");
  const [majorDeliverables, setMajorDeliverables] = useState([""]);

  // Stakeholders & Roles
  const [stakeholders, setStakeholders] = useState([
    { name: "", role: "", contact: "" }
  ]);

  // Assumptions & Constraints
  const [assumptions, setAssumptions] = useState("");
  const [constraints, setConstraints] = useState("");

  // Milestones & Timeline
  const [milestones, setMilestones] = useState([
    { name: "", date: "", description: "" }
  ]);

  // Add new item functions
  const addObjective = () => {
    setObjectives([...objectives, ""]);
  };

  const addDeliverable = () => {
    setMajorDeliverables([...majorDeliverables, ""]);
  };

  const addStakeholder = () => {
    setStakeholders([...stakeholders, { name: "", role: "", contact: "" }]);
  };

  const addMilestone = () => {
    setMilestones([...milestones, { name: "", date: "", description: "" }]);
  };

  // Remove item functions
  const removeObjective = (index) => {
    const newObjectives = objectives.filter((_, i) => i !== index);
    setObjectives(newObjectives.length ? newObjectives : [""]);
  };

  const removeDeliverable = (index) => {
    const newDeliverables = majorDeliverables.filter((_, i) => i !== index);
    setMajorDeliverables(newDeliverables.length ? newDeliverables : [""]);
  };

  const removeStakeholder = (index) => {
    const newStakeholders = stakeholders.filter((_, i) => i !== index);
    setStakeholders(newStakeholders.length ? newStakeholders : [{ name: "", role: "", contact: "" }]);
  };

  const removeMilestone = (index) => {
    const newMilestones = milestones.filter((_, i) => i !== index);
    setMilestones(newMilestones.length ? newMilestones : [{ name: "", date: "", description: "" }]);
  };

  // Update list item functions
  const updateObjective = (index, value) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };

  const updateDeliverable = (index, value) => {
    const newDeliverables = [...majorDeliverables];
    newDeliverables[index] = value;
    setMajorDeliverables(newDeliverables);
  };

  const updateStakeholder = (index, field, value) => {
    const newStakeholders = [...stakeholders];
    newStakeholders[index][field] = value;
    setStakeholders(newStakeholders);
  };

  const updateMilestone = (index, field, value) => {
    const newMilestones = [...milestones];
    newMilestones[index][field] = value;
    setMilestones(newMilestones);
  };

  // Fetch the existing Project Charter on mount
  useEffect(() => {
    const fetchCharter = async () => {
      try {
        setLoading(true);
        // Try to fetch the charter data
        const response = await projectsApi.fetchProjectCharter(projectId);
        console.log('Fetched charter data:', response);
        
        // Store the whole response
        setCharter(response);
        
        // Handle different possible data structures
        let charterData;
        
        if (response && response.data) {
          // Format 1: Standard API response
          const data = response.data;
          if (data === null) {
            // No charter exists yet
            console.log('No charter data found');
            setLoading(false);
            return;
          } else if (data.content) {
            // Response has data.content structure
            charterData = data.content;
            console.log('Using response.data.content format');
          } else {
            // Response has direct data structure
            charterData = data;
            console.log('Using response.data format');
          }
        } else if (response && response.content) {
          // Format 2: Document with content field
          charterData = response.content;
          console.log('Using document response with content field format');
        } else if (typeof response === 'object' && !response.data && !response.content) {
          // Format 3: Direct document
          charterData = response;
          console.log('Using direct document format');
        } else {
          console.warn('Unexpected charter data format:', response);
          // Try to extract data from any possible location as a fallback
          charterData = response || {};
          console.log('Attempting to use fallback data format');
        }
        
        // Set all state variables with fetched data and proper fallbacks
        setProjectTitle(charterData.projectTitle || "");
        setProjectSummary(charterData.projectSummary || "");
        
        // Handle arrays with proper default values
        setObjectives(Array.isArray(charterData.objectives) && charterData.objectives.length > 0 
          ? charterData.objectives 
          : [""]
        );
        
        setScopeStatement(charterData.scopeStatement || "");
        
        setMajorDeliverables(Array.isArray(charterData.majorDeliverables) && charterData.majorDeliverables.length > 0 
          ? charterData.majorDeliverables 
          : [""]
        );
        
        setStakeholders(Array.isArray(charterData.stakeholders) && charterData.stakeholders.length > 0 
          ? charterData.stakeholders 
          : [{ name: "", role: "", contact: "" }]
        );
        
        setAssumptions(charterData.assumptions || "");
        setConstraints(charterData.constraints || "");
        
        setMilestones(Array.isArray(charterData.milestones) && charterData.milestones.length > 0 
          ? charterData.milestones 
          : [{ name: "", date: "", description: "" }]
        );
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching Project Charter:", err);
        setError("Error loading Project Charter. Please try again.");
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchCharter();
    }
  }, [projectId]);

  // Toggle edit mode
  const handleToggleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  // Save updated Project Charter
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      // Calculate the current version
      let currentVersion = 0;
      if (charter) {
        // Try to find version in all possible locations
        if (charter.version) {
          currentVersion = charter.version;
        } else if (charter.data?.version) {
          currentVersion = charter.data.version;
        } else if (charter.content?.version) {
          currentVersion = charter.content.version;
        }
        // Default to zero if not found
      }
      
      const payload = {
        projectTitle,
        projectSummary,
        objectives,
        scopeStatement,
        majorDeliverables,
        stakeholders,
        assumptions,
        constraints,
        milestones,
        type: "PROJECT_CHARTER",
        version: currentVersion + 1,
        updated_at: new Date().toISOString()
      };

      // Use the high-level update function for better error handling
      console.log(`Updating Project Charter for project: ${projectId}`);
      await projectsApi.updateProjectCharter(projectId, payload);
      
      // Refresh the data
      const updatedCharter = await projectsApi.fetchProjectCharter(projectId);
      setCharter(updatedCharter);
      
      setIsEditMode(false);
      setMessage("Project Charter updated successfully!");
      setLoading(false);
    } catch (err) {
      console.error("Failed to update Project Charter:", err);
      setError(`Failed to update Project Charter: ${err.message}`);
      setLoading(false);
    }
  };

  // Cancel edit mode: reset local fields to current charter values
  const handleCancel = () => {
    if (charter) {
      // Extract data based on structure
      let data;
      
      if (charter && charter.data && charter.data.content) {
        // API response with data.content
        data = charter.data.content;
      } else if (charter && charter.data) {
        // API response with direct data
        data = charter.data;
      } else if (charter && charter.content) {
        // Document with content field
        data = charter.content;
      } else if (typeof charter === 'object') {
        // Direct document
        data = charter;
      } else {
        // Fallback: use whatever we have
        data = charter;
      }
      
      // Reset all state variables to original values
      setProjectTitle(data.projectTitle || "");
      setProjectSummary(data.projectSummary || "");
      
      setObjectives(Array.isArray(data.objectives) && data.objectives.length > 0 
        ? data.objectives 
        : [""]
      );
      
      setScopeStatement(data.scopeStatement || "");
      
      setMajorDeliverables(Array.isArray(data.majorDeliverables) && data.majorDeliverables.length > 0 
        ? data.majorDeliverables 
        : [""]
      );
      
      setStakeholders(Array.isArray(data.stakeholders) && data.stakeholders.length > 0 
        ? data.stakeholders 
        : [{ name: "", role: "", contact: "" }]
      );
      
      setAssumptions(data.assumptions || "");
      setConstraints(data.constraints || "");
      
      setMilestones(Array.isArray(data.milestones) && data.milestones.length > 0 
        ? data.milestones 
        : [{ name: "", date: "", description: "" }]
      );
    }
    
    setIsEditMode(false);
  };

  // Return to the Project Details page
  const handleBackToProject = () => {
    navigate(`/projects/${projectId}`);
  };

  // Loading and error handling
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-charter-wrapper">
          <p>Loading Project Charter...</p>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-charter-wrapper">
          <p className="error-text">{error}</p>
        </div>
      </>
    );
  }
  
  if (!charter) {
    return (
      <>
        <Navbar />
        <div className="view-charter-wrapper">
          <p>No Project Charter found.</p>
        </div>
      </>
    );
  }

  // Render read-only view
  const renderReadOnlyView = () => (
    <div className="view-charter-container">
      <div className="charter-header">
        <h2>Project Charter</h2>
        <div className="charter-meta">
          {charter?.updated_at && (
            <p className="charter-timestamp">Last updated: {new Date(charter.updated_at).toLocaleString()}</p>
          )}
        </div>
      </div>

      {message && <div className="success-text">{message}</div>}

      <div className="form-group">
        <label>Project Title:</label>
        <p>{projectTitle || "No title specified"}</p>
      </div>

      {/* Project Summary Section */}
      <div className="charter-section">
        <div className="section-header" onClick={() => toggleSection('projectSummary')}>
          <h3>Project Summary</h3>
          {expandedSections.projectSummary ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        
        {expandedSections.projectSummary && (
          <div className="section-content">
            <div className="charter-content">
              <p>{projectSummary || "No project summary specified"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Objectives & Scope Section */}
      <div className="charter-section">
        <div className="section-header" onClick={() => toggleSection('objectivesScope')}>
          <h3>Objectives & Scope</h3>
          {expandedSections.objectivesScope ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        
        {expandedSections.objectivesScope && (
          <div className="section-content">
            <div className="charter-content">
              <h4>Objectives</h4>
              {objectives && objectives.length > 0 && objectives[0] ? (
                <ul>
                  {objectives.map((objective, index) => (
                    <li key={`objective-${index}`}>{objective}</li>
                  ))}
                </ul>
              ) : (
                <p>No objectives specified</p>
              )}
              
              <h4>Scope Statement</h4>
              <p>{scopeStatement || "No scope statement specified"}</p>
              
              <h4>Major Deliverables</h4>
              {majorDeliverables && majorDeliverables.length > 0 && majorDeliverables[0] ? (
                <ul>
                  {majorDeliverables.map((deliverable, index) => (
                    <li key={`deliverable-${index}`}>{deliverable}</li>
                  ))}
                </ul>
              ) : (
                <p>No deliverables specified</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stakeholders & Roles Section */}
      <div className="charter-section">
        <div className="section-header" onClick={() => toggleSection('stakeholdersRoles')}>
          <h3>Stakeholders & Roles</h3>
          {expandedSections.stakeholdersRoles ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        
        {expandedSections.stakeholdersRoles && (
          <div className="section-content">
            <div className="charter-content">
              <h4>Key Stakeholders</h4>
              {stakeholders && stakeholders.length > 0 && stakeholders[0].name ? (
                <div className="stakeholder-table">
                  <div className="stakeholder-header">
                    <div>Name</div>
                    <div>Role</div>
                    <div>Contact Info</div>
                  </div>
                  
                  {stakeholders.map((stakeholder, index) => (
                    <div key={`stakeholder-${index}`} className="stakeholder-row">
                      <div>{stakeholder.name}</div>
                      <div>{stakeholder.role}</div>
                      <div>{stakeholder.contact}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No stakeholders specified</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assumptions & Constraints Section */}
      <div className="charter-section">
        <div className="section-header" onClick={() => toggleSection('assumptionsConstraints')}>
          <h3>Assumptions & Constraints</h3>
          {expandedSections.assumptionsConstraints ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        
        {expandedSections.assumptionsConstraints && (
          <div className="section-content">
            <div className="charter-content">
              <h4>Assumptions</h4>
              <p>{assumptions || "No assumptions specified"}</p>
              
              <h4>Constraints</h4>
              <p>{constraints || "No constraints specified"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Milestones & Timeline Section */}
      <div className="charter-section">
        <div className="section-header" onClick={() => toggleSection('milestonesTimeline')}>
          <h3>Milestones & Timeline</h3>
          {expandedSections.milestonesTimeline ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        
        {expandedSections.milestonesTimeline && (
          <div className="section-content">
            <div className="charter-content">
              <h4>Key Milestones</h4>
              {milestones && milestones.length > 0 && milestones[0].name ? (
                <div className="milestone-table">
                  <div className="milestone-header">
                    <div>Name</div>
                    <div>Target Date</div>
                    <div>Description</div>
                  </div>
                  
                  {milestones.map((milestone, index) => (
                    <div key={`milestone-${index}`} className="milestone-row">
                      <div>{milestone.name}</div>
                      <div>{milestone.date && new Date(milestone.date).toLocaleDateString()}</div>
                      <div>{milestone.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No milestones specified</p>
              )}
              
              {/* Simple Timeline Visualization */}
              {milestones && milestones.length > 0 && milestones[0].name && milestones[0].date && (
                <div className="timeline-visualization">
                  <h4>Timeline Overview</h4>
                  <div className="timeline-container">
                    {milestones
                      .filter(m => m.date && m.name)
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((milestone, index) => (
                        <div key={`timeline-${index}`} className="timeline-item">
                          <div className="timeline-date">
                            {new Date(milestone.date).toLocaleDateString()}
                          </div>
                          <div className="timeline-marker"></div>
                          <div className="timeline-content">
                            {milestone.name}
                          </div>
                        </div>
                      ))}
                    <div className="timeline-line"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="button-group">
        <button className="btn-primary" onClick={handleToggleEdit}>
          Edit
        </button>
        <button className="btn-secondary" onClick={handleBackToProject}>
          Back to Project
        </button>
      </div>
    </div>
  );

  // Render edit mode
  const renderEditMode = () => (
    <div className="edit-charter-container">
      <div className="charter-header">
        <h2>Edit Project Charter (Version {charter?.version || 1})</h2>
      </div>

      {error && <div className="error-text">{error}</div>}

      <form className="charter-form">
        {/* Project Title */}
        <div className="form-group">
          <label htmlFor="projectTitle">Project Title:</label>
          <input
            id="projectTitle"
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="Enter the official title of your project"
            className="form-input"
          />
        </div>

        {/* Project Summary Section */}
        <div className="charter-section">
          <div className="section-header" onClick={() => toggleSection('projectSummary')}>
            <h3>Project Summary</h3>
            {expandedSections.projectSummary ? <FaChevronUp /> : <FaChevronDown />}
          </div>

          {expandedSections.projectSummary && (
            <div className="section-content">
              <div className="form-group">
                <label htmlFor="projectSummary">
                  A brief narrative that describes the project
                </label>
                <textarea
                  id="projectSummary"
                  value={projectSummary}
                  onChange={(e) => setProjectSummary(e.target.value)}
                  placeholder="Provide a concise overview of what this project aims to accomplish"
                  rows="4"
                  className="form-textarea"
                />
              </div>
            </div>
          )}
        </div>

        {/* Objectives & Scope Section */}
        <div className="charter-section">
          <div className="section-header" onClick={() => toggleSection('objectivesScope')}>
            <h3>Objectives & Scope</h3>
            {expandedSections.objectivesScope ? <FaChevronUp /> : <FaChevronDown />}
          </div>

          {expandedSections.objectivesScope && (
            <div className="section-content">
              {/* Objectives */}
              <div className="form-group">
                <label>
                  Objectives
                </label>
                
                <div className="list-items">
                  {objectives.map((objective, index) => (
                    <div key={`objective-${index}`} className="list-item">
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        placeholder="Enter project objective"
                        className="form-input"
                      />
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className="remove-btn"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addObjective}
                    className="add-btn"
                  >
                    <FaPlus /> Add Objective
                  </button>
                </div>
              </div>

              {/* Scope Statement */}
              <div className="form-group">
                <label htmlFor="scopeStatement">Scope Statement</label>
                <textarea
                  id="scopeStatement"
                  value={scopeStatement}
                  onChange={(e) => setScopeStatement(e.target.value)}
                  placeholder="Define what is included in (and excluded from) this project"
                  rows="4"
                  className="form-textarea"
                />
              </div>

              {/* Major Deliverables */}
              <div className="form-group">
                <label>Major Deliverables</label>
                
                <div className="list-items">
                  {majorDeliverables.map((deliverable, index) => (
                    <div key={`deliverable-${index}`} className="list-item">
                      <input
                        type="text"
                        value={deliverable}
                        onChange={(e) => updateDeliverable(index, e.target.value)}
                        placeholder="Enter major deliverable"
                        className="form-input"
                      />
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
            </div>
          )}
        </div>

        {/* Stakeholders & Roles Section */}
        <div className="charter-section">
          <div className="section-header" onClick={() => toggleSection('stakeholdersRoles')}>
            <h3>Stakeholders & Roles</h3>
            {expandedSections.stakeholdersRoles ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          
          {expandedSections.stakeholdersRoles && (
            <div className="section-content">
              <div className="form-group">
                <label>
                  Key Stakeholders
                </label>
                
                <div className="stakeholder-table">
                  <div className="stakeholder-header">
                    <div>Name</div>
                    <div>Role</div>
                    <div>Contact Info</div>
                    <div>Actions</div>
                  </div>
                  
                  {stakeholders.map((stakeholder, index) => (
                    <div key={`stakeholder-${index}`} className="stakeholder-row">
                      <div>
                        <input
                          type="text"
                          value={stakeholder.name}
                          onChange={(e) => updateStakeholder(index, 'name', e.target.value)}
                          placeholder="Name"
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
                          type="text"
                          value={stakeholder.contact}
                          onChange={(e) => updateStakeholder(index, 'contact', e.target.value)}
                          placeholder="Email/Phone"
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

        {/* Assumptions & Constraints Section */}
        <div className="charter-section">
          <div className="section-header" onClick={() => toggleSection('assumptionsConstraints')}>
            <h3>Assumptions & Constraints</h3>
            {expandedSections.assumptionsConstraints ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          
          {expandedSections.assumptionsConstraints && (
            <div className="section-content">
              {/* Assumptions */}
              <div className="form-group">
                <label htmlFor="assumptions">
                  Assumptions
                </label>
                <textarea
                  id="assumptions"
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value)}
                  placeholder="List any assumptions the project is making"
                  rows="4"
                  className="form-textarea"
                />
              </div>

              {/* Constraints */}
              <div className="form-group">
                <label htmlFor="constraints">
                  Constraints
                </label>
                <textarea
                  id="constraints"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="List any constraints that might impact the project"
                  rows="4"
                  className="form-textarea"
                />
              </div>
            </div>
          )}
        </div>

        {/* Milestones & Timeline Section */}
        <div className="charter-section">
          <div className="section-header" onClick={() => toggleSection('milestonesTimeline')}>
            <h3>Milestones & Timeline</h3>
            {expandedSections.milestonesTimeline ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          
          {expandedSections.milestonesTimeline && (
            <div className="section-content">
              <div className="form-group">
                <label>
                  Key Milestones
                </label>
                
                <div className="milestone-table">
                  <div className="milestone-header">
                    <div>Name</div>
                    <div>Target Date</div>
                    <div>Description</div>
                    <div>Actions</div>
                  </div>
                  
                  {milestones.map((milestone, index) => (
                    <div key={`milestone-${index}`} className="milestone-row">
                      <div>
                        <input
                          type="text"
                          value={milestone.name}
                          onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                          placeholder="Milestone name"
                          className="form-input"
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          value={milestone.date}
                          onChange={(e) => updateMilestone(index, 'date', e.target.value)}
                          className="form-input date-input"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          placeholder="Brief description"
                          className="form-input"
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
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
                  onClick={addMilestone}
                  className="add-btn"
                >
                  <FaPlus /> Add Milestone
                </button>
              </div>

              {/* Simple Timeline Visualization */}
              {milestones.length > 0 && milestones[0].date && (
                <div className="timeline-visualization">
                  <h4>Timeline Overview</h4>
                  <div className="timeline-container">
                    {milestones
                      .filter(m => m.date && m.name)
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((milestone, index) => (
                        <div key={`timeline-${index}`} className="timeline-item">
                          <div className="timeline-date">
                            {new Date(milestone.date).toLocaleDateString()}
                          </div>
                          <div className="timeline-marker"></div>
                          <div className="timeline-content">
                            {milestone.name}
                          </div>
                        </div>
                      ))}
                    <div className="timeline-line"></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" onClick={handleSave} className="btn-save">
            Save Changes
          </button>
          <button
            type="button"
            className="btn-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="view-charter-wrapper">
        {isEditMode ? renderEditMode() : renderReadOnlyView()}
      </div>
    </>
  );
};

export default ViewProjectCharter;
