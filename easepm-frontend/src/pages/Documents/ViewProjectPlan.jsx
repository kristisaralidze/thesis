// src/pages/ViewProjectPlan.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import DependencyFlowchart from "../../components/DependencyFlowchart";
import GanttChart from "../../components/GanttChart";
import Navbar from "../../components/Navbar";
import ProjectTimelineChart from '../../components/ProjectTimelineChart';
import ResourceAllocationChart from "../../components/ResourceAllocationChart";
import "./ViewProjectPlan.css"; // Customize this CSS file for your styling

const API_BASE = "http://localhost:5000/api";

// Add critical path calculation functions
const calculateCriticalPath = (milestones, dependencies) => {
  // Create a graph representation
  const graph = {};
  const durations = {};
  
  // Initialize graph
  milestones.forEach(milestone => {
    graph[milestone.name] = [];
    durations[milestone.name] = new Date(milestone.date).getTime();
  });

  // Build dependency graph
  dependencies.forEach(dep => {
    if (dep.source && dep.target) {
      graph[dep.source].push(dep.target);
    }
  });

  // Find all paths from start to end nodes
  const findAllPaths = (start, end, path = [], visited = new Set()) => {
    path.push(start);
    visited.add(start);
    
    if (start === end) {
      return [path.slice()];
    }
    
    const paths = [];
    for (const next of graph[start]) {
      if (!visited.has(next)) {
        paths.push(...findAllPaths(next, end, path, visited));
      }
    }
    
    path.pop();
    visited.delete(start);
    return paths;
  };

  // Calculate duration for each path
  const calculatePathDuration = (path) => {
    let duration = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];
      duration += durations[next] - durations[current];
    }
    return duration;
  };

  // Find start and end nodes
  const startNodes = new Set(Object.keys(graph));
  const endNodes = new Set(Object.keys(graph));
  
  dependencies.forEach(dep => {
    if (dep.target) endNodes.delete(dep.source);
    if (dep.source) startNodes.delete(dep.target);
  });

  // Calculate all paths and find the critical path
  let criticalPath = [];
  let maxDuration = 0;
  
  for (const start of startNodes) {
    for (const end of endNodes) {
      const paths = findAllPaths(start, end);
      paths.forEach(path => {
        const duration = calculatePathDuration(path);
        if (duration > maxDuration) {
          maxDuration = duration;
          criticalPath = path;
        }
      });
    }
  }

  return {
    path: criticalPath,
    duration: maxDuration,
  };
};

const IT_PROJECT_ROLES = [
  "Project Manager",
  "Product Manager",
  "Scrum Master",
  // ... existing code ...
  "Other"
];

const ViewProjectPlan = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Data states
  const [projectPlan, setProjectPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [criticalPathInfo, setCriticalPathInfo] = useState({ path: [], duration: 0 });

  // Toggle between read-only and edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  // Local state for Project Plan fields (for editing)
  const [phases, setPhases] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [resources, setResources] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [projectDurationInWeeks, setProjectDurationInWeeks] = useState(6);
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");

  // Add useEffect to calculate critical path when dependencies or milestones change
  useEffect(() => {
    if (milestones.some(m => !m.date) || dependencies.some(d => !d.source || !d.target)) {
      return;
    }
    const result = calculateCriticalPath(milestones, dependencies);
    setCriticalPathInfo(result);
  }, [milestones, dependencies]);

  // Fetch the existing Project Plan on mount
  useEffect(() => {
    const fetchProjectPlan = async () => {
      try {
        setLoading(true);
        // Use the projectsApi method instead of direct axios call
        const response = await projectsApi.fetchProjectPlan(projectId);
        console.log('Fetched project plan data:', response);
        
        // Set the full response for reference
        setProjectPlan(response);
        
        // Handle different possible data structures
        let planData = null;
        
        if (response) {
          if (response.data) {
            // Standard API response with data field
            const data = response.data;
            
            if (data === null) {
              // No plan exists yet
              console.log('No Project Plan data found');
              setLoading(false);
              return;
            }
            
            // Check for content wrapper (older format)
            if (data.content) {
              planData = data.content;
              console.log('Using response.data.content format');
            } 
            // Direct data in response.data (newer format)
            else if (data.phases || data.milestones) {
              planData = data;
              console.log('Using direct data in response.data format');
            }
          } 
          // Direct response is the document
          else if (response.content) {
            planData = response.content;
            console.log('Using response.content format');
          } 
          // Direct response contains the data fields
          else if (response.phases || response.milestones) {
            planData = response;
            console.log('Using direct response format');
          }
        }
        
        if (!planData) {
          console.warn('Could not extract plan data from response:', response);
          setError("Invalid Project Plan data format");
          setLoading(false);
          return;
        }
        
        // Set all fields with data from the plan
        setPhases(planData.phases || []);
        setMilestones(planData.milestones || []);
        setResources(planData.resources || []);
        setDependencies(planData.dependencies || []);
        
        // Set project duration information if available
        if (planData.projectDuration) {
          setProjectDurationInWeeks(planData.projectDuration.weeks || 6);
          setProjectStartDate(planData.projectDuration.startDate || "");
          setProjectEndDate(planData.projectDuration.endDate || "");
        }
        
      } catch (err) {
        console.error("Error fetching Project Plan:", err);
        setError("Project Plan not found or access denied.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectPlan();
  }, [projectId]);

  // Handle resource allocation changes
  const handleResourceChange = (idx, phaseIdx, value) => {
    const updatedResources = [...resources];
    if (!updatedResources[idx].estimatedHours) {
      updatedResources[idx].estimatedHours = Array(phases.length).fill(0);
    }
    if (value < 0) value = 0;
    if (value > 40) value = 40;
    updatedResources[idx].estimatedHours[phaseIdx] = value;
    setResources(updatedResources);
  };

  // Save updated Project Plan
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      // Calculate current version
      let currentVersion = 1;
      if (projectPlan) {
        // Try to find version in all possible locations
        if (projectPlan.version) {
          currentVersion = projectPlan.version;
        } else if (projectPlan.data?.version) {
          currentVersion = projectPlan.data.version;
        }
        currentVersion = (parseInt(currentVersion) || 0) + 1;
      }
      
      // Create the payload to match what ProjectPlanTemplate.jsx does
      const projectPlanData = {
        type: "ProjectPlan",
        projectDuration: {
          weeks: projectDurationInWeeks,
          startDate: projectStartDate,
          endDate: projectEndDate
        },
        phases: phases,
        milestones: milestones,
        dependencies: dependencies,
        resources: resources,
        criticalPath: criticalPathInfo,
        version: currentVersion,
        updated_at: new Date().toISOString()
      };
      
      // Add created_at if this is the first version
      if (currentVersion === 1) {
        projectPlanData.created_at = new Date().toISOString();
      } else if (projectPlan?.data?.created_at) {
        // Preserve created_at from the original data
        projectPlanData.created_at = projectPlan.data.created_at;
      }
      
      console.log('Saving Project Plan with data:', projectPlanData);
      
      // Use the projectsApi method to update
      await projectsApi.updateProjectPlan(projectId, projectPlanData);
      
      // Refetch the updated plan
      const updatedResponse = await projectsApi.fetchProjectPlan(projectId);
      setProjectPlan(updatedResponse);
      
      setIsEditMode(false);
      setMessage("Project Plan updated successfully!");
    } catch (err) {
      console.error("Failed to update Project Plan:", err);
      setError(`Failed to update Project Plan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit mode
  const handleCancel = async () => {
    try {
      setLoading(true);
      // Refetch the plan data using the API
      const response = await projectsApi.fetchProjectPlan(projectId);
      
      // Set the full response
      setProjectPlan(response);
      
      // Extract data from response
      let planData = null;
      
      if (response?.data) {
        planData = response.data.content || response.data;
      } else if (response?.content) {
        planData = response.content;
      } else if (response?.phases || response?.milestones) {
        planData = response;
      }
      
      if (planData) {
        // Reset all the local state
        setPhases(planData.phases || []);
        setMilestones(planData.milestones || []);
        setResources(planData.resources || []);
        setDependencies(planData.dependencies || []);
        
        if (planData.projectDuration) {
          setProjectDurationInWeeks(planData.projectDuration.weeks || 6);
          setProjectStartDate(planData.projectDuration.startDate || "");
          setProjectEndDate(planData.projectDuration.endDate || "");
        }
      }
    } catch (err) {
      console.error("Error refetching Project Plan:", err);
    } finally {
      setLoading(false);
      setIsEditMode(false);
    }
  };

  // Return to Project Details
  const handleBackToProject = () => {
    navigate(`/projects/${projectId}`);
  };

  if (loading) return (
      <>
        <Navbar />
      <div className="view-plan-container">
        <p>Loading Project Plan...</p>
      </div>
      </>
    );

  if (error) return (
      <>
        <Navbar />
      <div className="view-plan-container">
        <div className="error-text">{error}</div>
      </div>
      </>
    );

  // Render read-only view
  const renderReadOnly = () => (
    <div className="view-plan-customization-section">
      <h2 className="view-plan-title">Project Plan (Version {projectPlan.version || 1})</h2>
      {message && <div className="view-plan-success-text">{message}</div>}

      {/* Project Duration and Phases Section */}
      <div className="view-plan-flex-row">
        <div className="view-plan-col-1-3">
          <div className="view-plan-section-box">
            <h3 className="view-plan-section-title">Project Duration and Phases</h3>
            <p className="view-plan-text">
              <span style={{ fontWeight: 600 }}>Project Duration:</span> {projectDurationInWeeks} weeks 
              <span style={{ fontSize: '0.9rem', marginLeft: '8px', color: '#666' }}>
                ({projectStartDate} to {projectEndDate})
              </span>
            </p>
            <div className="view-plan-phases-list">
              {phases.map((phase, idx) => (
                <div key={idx} className="view-plan-phase-item">
                  <strong>{phase.name}</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Start Week:</span> 
                    <span style={{ fontWeight: 500 }}>{phase.startWeek}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>End Week:</span> 
                    <span style={{ fontWeight: 500 }}>{phase.endWeek}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="view-plan-col-2-3">
          <div className="view-plan-chart-container">
            <GanttChart 
              phases={phases}
              projectStartDate={projectStartDate}
              projectEndDate={projectEndDate}
              projectDurationInWeeks={projectDurationInWeeks}
            />
          </div>
          <div className="view-plan-timeline-container">
            <ProjectTimelineChart 
              phases={phases}
              projectDurationInWeeks={projectDurationInWeeks}
            />
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <div className="view-plan-flex-row">
        <div className="view-plan-col-1-3">
          <div className="view-plan-section-box">
            <h3 className="view-plan-section-title">Resource Allocation</h3>
            {resources.map((resource, idx) => (
              <div key={idx} className="view-plan-resource-item">
                <strong>
                  {resource.name}
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'normal', 
                    color: '#3ecbf5',
                    marginLeft: '8px',
                    backgroundColor: 'rgba(62, 203, 245, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '12px'
                  }}>
                    {resource.role}
                  </span>
                </strong>
                <div>Estimated Hours per Phase:</div>
                <ul className="view-plan-hours-list">
                  {phases.map((phase, pidx) => (
                    <li key={pidx}>
                      <span>{phase.name}:</span>
                      <span style={{ 
                        fontWeight: '500', 
                        color: resource.estimatedHours?.[pidx] > 30 ? '#f5a623' : '#333'
                      }}>
                        {resource.estimatedHours?.[pidx] || 0} hours
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="view-plan-col-2-3">
          <div className="view-plan-resource-chart">
            <ResourceAllocationChart resources={resources} phases={phases} />
          </div>
        </div>
      </div>

      {/* Milestones and Dependencies Section */}
      <div className="view-plan-flex-row">
        <div className="view-plan-col-1-3">
          <div className="view-plan-section-box">
            <h3 className="view-plan-section-title">Milestones</h3>
            {milestones.map((milestone, idx) => (
              <div key={idx} className="view-plan-milestone-item">
                <strong>{milestone.name}</strong>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ 
                    marginRight: '8px',
                    color: '#666'
                  }}>Date:</span>
                  <span style={{ 
                    fontWeight: '500',
                    backgroundColor: 'rgba(245, 166, 35, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    color: '#f5a623'
                  }}>
                    {milestone.date}
                  </span>
                </div>
              </div>
            ))}

            <h3 className="view-plan-section-title">Dependencies</h3>
            {dependencies.length > 0 ? (
              dependencies.map((dep, idx) => (
                <div key={idx} className="view-plan-dependency-item">
                  <strong>{dep.source}</strong>
                  <span className="view-plan-dependency-arrow">→</span>
                  <span>{dep.target}</span>
                </div>
              ))
            ) : (
              <p className="view-plan-text">No dependencies defined</p>
            )}
          </div>
        </div>
        <div className="view-plan-col-2-3">
          <div className="view-plan-dependency-chart">
            <DependencyFlowchart milestones={milestones} dependencies={dependencies} projectId={projectId} />
          </div>
          
          {/* Critical Path Display in read-only view */}
          {criticalPathInfo.path.length > 0 && (
            <div className="view-plan-critical-path">
              <h4 className="view-plan-section-title">Critical Path Analysis</h4>
              
              <div className="info-box">
                <p>
                  The critical path is the longest sequence of essential tasks from project start to finish, determining the minimum time required to complete the project. Any delays in these critical tasks will directly extend the project's overall duration, making timely completion crucial.
                </p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="path-box">
                  <div className="label">Path:</div>
                  <div>{criticalPathInfo.path.join(" → ")}</div>
                </div>
                
                <div className="duration-box">
                  <div className="label">Duration:</div>
                  <div>{Math.ceil(criticalPathInfo.duration / (1000 * 60 * 60 * 24))} days</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="view-plan-button-group">
        <button className="view-plan-btn-edit" onClick={() => setIsEditMode(true)}>Edit</button>
        <button className="view-plan-btn-back" onClick={handleBackToProject}>Back to Project</button>
      </div>
    </div>
  );

  // Render edit mode
  const renderEditMode = () => (
    <div className="view-plan-edit-container">
      <h2 className="view-plan-edit-title">Editing Project Plan (Version {projectPlan.version || 1})</h2>
      {error && <div className="view-plan-error-text">{error}</div>}
      {message && <div className="view-plan-success-text">{message}</div>}

      <form onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }} className="view-plan-form">
        {/* Section 1: Project Duration and Gantt Chart */}
        <div className="view-plan-flex-row">
          <div className="view-plan-col-1-3">
            <div className="view-plan-section-box">
              <h3 className="view-plan-section-title">Project Duration and Phases</h3>
              <div className="view-plan-form-group">
                <label className="view-plan-label">Project Duration (Weeks):</label>
                <input
                  type="number"
                  min="1"
                  value={projectDurationInWeeks}
                  onChange={(e) => setProjectDurationInWeeks(Number(e.target.value))}
                  className="view-plan-input"
                />
              </div>

              <div className="view-plan-form-group">
                <label className="view-plan-label">Project Phases</label>
        {phases.map((phase, idx) => (
                  <div key={idx} className="view-plan-phase-input">
            <input
              type="text"
              value={phase.name}
              onChange={(e) => {
                const updatedPhases = [...phases];
                updatedPhases[idx].name = e.target.value;
                setPhases(updatedPhases);
              }}
                      placeholder="Phase Name"
                      className="view-plan-input"
            />
            <input
                      type="number"
                      value={phase.startWeek}
                      min={1}
                      max={projectDurationInWeeks}
              onChange={(e) => {
                const updatedPhases = [...phases];
                        updatedPhases[idx].startWeek = e.target.value;
                setPhases(updatedPhases);
              }}
                      placeholder="Start Week"
                      className="view-plan-input"
            />
            <input
                      type="number"
                      value={phase.endWeek}
                      min={1}
                      max={projectDurationInWeeks}
              onChange={(e) => {
                const updatedPhases = [...phases];
                        updatedPhases[idx].endWeek = e.target.value;
                setPhases(updatedPhases);
              }}
                      placeholder="End Week"
                      className="view-plan-input"
                    />
                    <button
                      type="button"
                      className="view-plan-btn-remove"
                      onClick={() => setPhases(phases.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="view-plan-btn-add"
                  onClick={() => setPhases([...phases, { name: "", startWeek: "", endWeek: "" }])}
                >
                  + Add Phase
                </button>
              </div>
            </div>
          </div>
          <div className="view-plan-col-2-3">
            <div className="view-plan-chart-container">
              <GanttChart 
                phases={phases}
                projectStartDate={projectStartDate}
                projectEndDate={projectEndDate}
                projectDurationInWeeks={projectDurationInWeeks}
              />
            </div>
            <div className="view-plan-timeline-container">
              <ProjectTimelineChart 
                phases={phases}
                projectDurationInWeeks={projectDurationInWeeks}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Resources and Resource Allocation Chart */}
        <div className="view-plan-flex-row">
          <div className="view-plan-col-1-3">
            <div className="view-plan-section-box">
              <h3 className="view-plan-section-title">Resource Allocation</h3>
              <div className="view-plan-form-group">
                {resources.map((resource, idx) => (
                  <div key={idx} className="view-plan-resource">
                    <div className="view-plan-resource-header">
                      <input
                        type="text"
                        value={resource.name}
                        onChange={(e) => {
                          const updatedResources = [...resources];
                          updatedResources[idx].name = e.target.value;
                          setResources(updatedResources);
                        }}
                        placeholder="Resource Name"
                        className="view-plan-input"
                      />
                      <select
                        value={resource.role}
                        onChange={(e) => {
                          const updatedResources = [...resources];
                          updatedResources[idx].role = e.target.value;
                          setResources(updatedResources);
                        }}
                        className="view-plan-input"
                      >
                        <option value="">Select Role</option>
                        {IT_PROJECT_ROLES.map((role, i) => (
                          <option key={i} value={role}>{role}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="view-plan-btn-remove"
                        onClick={() => setResources(resources.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </button>
                    </div>
                    <table className="view-plan-table">
                      <thead>
                        <tr>
                          <th>Phase</th>
                          <th>Estimated Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {phases.map((phase, pidx) => (
                          <tr key={pidx}>
                            <td>{phase.name}</td>
                            <td>
                              <input
                                type="number"
                                value={resource.estimatedHours?.[pidx] || 0}
                                onChange={(e) => handleResourceChange(idx, pidx, parseFloat(e.target.value))}
                                max="40"
                                placeholder="Hours"
                                className="view-plan-input"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
          </div>
        ))}
                <button
                  type="button"
                  className="view-plan-btn-add"
                  onClick={() => setResources([
                    ...resources,
                    { name: "", role: "", estimatedHours: Array(phases.length).fill(0) }
                  ])}
                >
                  + Add Resource
                </button>
              </div>
            </div>
          </div>
          <div className="view-plan-col-2-3">
            <div className="view-plan-resource-chart">
              <ResourceAllocationChart resources={resources} phases={phases} />
            </div>
          </div>
      </div>

        {/* Section 3: Milestones/Dependencies and Flowchart */}
        <div className="view-plan-flex-row">
          <div className="view-plan-col-1-3">
            <div className="view-plan-section-box">
              <h3 className="view-plan-section-title">Milestones and Dependencies</h3>
              <div className="view-plan-form-group">
                <label className="view-plan-label">Project Milestones</label>
        {milestones.map((milestone, idx) => (
                  <div key={idx} className="view-plan-milestone">
            <input
              type="text"
              value={milestone.name}
              onChange={(e) => {
                const updatedMilestones = [...milestones];
                updatedMilestones[idx].name = e.target.value;
                setMilestones(updatedMilestones);
              }}
                      placeholder="Milestone Name"
                      className="view-plan-input"
            />
            <input
              type="date"
              value={milestone.date}
              onChange={(e) => {
                const updatedMilestones = [...milestones];
                updatedMilestones[idx].date = e.target.value;
                setMilestones(updatedMilestones);
              }}
                      className="view-plan-input"
                    />
                    <button
                      type="button"
                      className="view-plan-btn-remove"
                      onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
          </div>
        ))}
                <button
                  type="button"
                  className="view-plan-btn-add"
                  onClick={() => setMilestones([...milestones, { name: "", date: "" }])}
                >
                  + Add Milestone
                </button>
      </div>

              <div className="view-plan-form-group">
                <label className="view-plan-label">Dependencies</label>
        {dependencies.map((dep, idx) => (
                  <div key={idx} className="view-plan-dependency">
                    <select
                      value={dep.source}
              onChange={(e) => {
                const updatedDeps = [...dependencies];
                        updatedDeps[idx].source = e.target.value;
                setDependencies(updatedDeps);
              }}
                      className="view-plan-input"
                    >
                      <option value="">Select Source Milestone</option>
                      {milestones.map((m, i) => (
                        <option key={i} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <select
                      value={dep.target}
              onChange={(e) => {
                const updatedDeps = [...dependencies];
                        updatedDeps[idx].target = e.target.value;
                setDependencies(updatedDeps);
              }}
                      className="view-plan-input"
                    >
                      <option value="">Select Target Milestone</option>
                      {milestones.map((m, i) => (
                        <option key={i} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="view-plan-btn-remove"
                      onClick={() => setDependencies(dependencies.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="view-plan-btn-add"
                  onClick={() => setDependencies([...dependencies, { source: "", target: "" }])}
                >
                  + Add Dependency
                </button>
              </div>
            </div>
          </div>
          <div className="view-plan-col-2-3">
            <div className="view-plan-dependency-chart">
              <DependencyFlowchart milestones={milestones} dependencies={dependencies} projectId={projectId} />
            </div>
            
            {/* Critical Path Display in edit mode */}
            {criticalPathInfo.path.length > 0 && (
              <div className="view-plan-critical-path">
                <h4 className="view-plan-section-title">Critical Path Analysis</h4>
                
                <div className="info-box">
                  <p>
                    The critical path is the longest sequence of essential tasks from project start to finish, determining the minimum time required to complete the project. Any delays in these critical tasks will directly extend the project's overall duration, making timely completion crucial.
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="path-box">
                    <div className="label">Path:</div>
                    <div>{criticalPathInfo.path.join(" → ")}</div>
                  </div>
                  
                  <div className="duration-box">
                    <div className="label">Duration:</div>
                    <div>{Math.ceil(criticalPathInfo.duration / (1000 * 60 * 60 * 24))} days</div>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>

        {/* Form Actions */}
        <div className="view-plan-form-actions">
          <button type="submit" className="view-plan-btn-save">
            Save Changes
          </button>
          <button
            type="button"
            className="view-plan-btn-cancel"
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
      <div className="view-plan-container">
        {isEditMode ? renderEditMode() : renderReadOnly()}
      </div>
    </>
  );
};

export default ViewProjectPlan;
