// src/pages/ProjectCharterTemplate.jsx
import React, { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp, FaPlus, FaTrash } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import Navbar from "../../components/Navbar";
import "./ProjectCharterTemplate.css"; // Create and customize this CSS file as needed

const API_BASE = "http://localhost:5000/api";

const ProjectCharterTemplate = () => {
  const navigate = useNavigate();

  // Toggle for showing the customization form
  const [showCustomize, setShowCustomize] = useState(false);

  // Projects dropdown
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // Project Charter fields - keep these for data handling
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

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await projectsApi.fetchProjects();
        if (Array.isArray(response)) {
          setProjects(response);
        } else if (response && response.data && Array.isArray(response.data)) {
          setProjects(response.data);
        } else {
          console.error("Invalid projects response format:", response);
          setError("Failed to load projects. Unexpected response format.");
        }
        setLoadingProjects(false);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again.");
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

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

  // Handle form submission
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!selectedProject) {
      setError("Please select a project to save the Project Charter");
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      // Create the project charter payload
      const projectCharterData = {
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
        version: 1,
        updated_at: new Date().toISOString()
      };
      
      // Use the high-level update function for better error handling
      console.log(`Saving Project Charter to project: ${selectedProject}`);
      await projectsApi.updateProjectCharter(selectedProject, projectCharterData);
      
      setMessage("Project Charter saved successfully!");
      
      // Redirect to project details after short delay
      setTimeout(() => {
        navigate(`/projects/${selectedProject}`);
      }, 2000);
    } catch (err) {
      console.error("Error saving Project Charter:", err);
      setError(`Failed to save Project Charter: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Render
  return (
    <>
      <Navbar />
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Template Overview */}
        {!showCustomize && (
          <div className="template-initial-view">
            <div className="template-content">
              <h1 className="template-title">Project Charter</h1>
            <p className="template-description">
                The Project Charter outlines the project's purpose, scope, stakeholders, and key milestones. It authorizes the project, defines its objectives, and sets expectations for all team members.
              </p>
            <button
                className="template-customize-btn" 
              onClick={() => setShowCustomize(true)}
            >
                Customize Project Charter
            </button>
            </div>
          </div>
        )}

        {/* Customization Form */}
        {showCustomize && (
          <div className="charter-customize-container">
            <div className="charter-header">
              <h2>Project Charter</h2>
            </div>

            {error && <div className="error-text">{error}</div>}
            {message && <div className="success-text">{message}</div>}

            <form onSubmit={handleSave} className="charter-form">
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
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map((proj) => (
                      <option key={proj._id || proj.id} value={proj.id || proj._id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

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

              {/* Form actions */}
              <div className="charter-form-actions">
                <button 
                  type="submit" 
                  className="btn-save" 
                  disabled={loading || !selectedProject}
                >
                  {loading ? 'Saving...' : 'Save Project Charter'}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowCustomize(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectCharterTemplate;
