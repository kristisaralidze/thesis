import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import DependencyFlowchart from "../../components/DependencyFlowchart"; // Assuming you have this component
import GanttChart from "../../components/GanttChart"; // Assuming you have this component
import Navbar from "../../components/Navbar";
import ProjectTimelineChart from '../../components/ProjectTimelineChart';
import ResourceAllocationChart from "../../components/ResourceAllocationChart"; // Assuming you have this component
import "./ProjectPlanTemplate.css";

const API_BASE = "http://localhost:5000/api";

// Default values for phases, milestones, and resources
const defaultPhases = [
  { name: "Planning", startWeek: "", endWeek: "" },
  { name: "Design", startWeek: "", endWeek: "" },
  { name: "Development", startWeek: "", endWeek: "" },
  { name: "Testing", startWeek: "", endWeek: "" },
  { name: "Deployment", startWeek: "", endWeek: "" },
];

const defaultMilestones = [
  { name: "Milestone 1", date: "" },
  { name: "Milestone 2", date: "" },
  { name: "Milestone 3", date: "" },
];

const defaultResources = [
  {
    name: "Developer 1",
    role: "",
    allocationPercentages: [0, 0, 0, 0, 0],
  },
  {
    name: "Developer 2",
    role: "",
    allocationPercentages: [0, 0, 0, 0, 0],
  },
  {
    name: "Developer 3",
    role: "",
    allocationPercentages: [0, 0, 0, 0, 0],
  },
];

const defaultDependencies = [
  { source: "", target: "" },
];

// Add critical path calculation functions
const calculateCriticalPath = (milestones, dependencies) => {
  console.log('Starting critical path calculation');
  // Create a graph representation
  const graph = {};
  const durations = {};
  
  // Initialize graph
  milestones.forEach(milestone => {
    graph[milestone.name] = [];
    durations[milestone.name] = new Date(milestone.date).getTime();
    console.log(`Milestone ${milestone.name} duration: ${durations[milestone.name]}`);
  });

  // Build dependency graph
  dependencies.forEach(dep => {
    if (dep.source && dep.target) {
      graph[dep.source].push(dep.target);
      console.log(`Added dependency: ${dep.source} -> ${dep.target}`);
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

  console.log('Start nodes:', Array.from(startNodes));
  console.log('End nodes:', Array.from(endNodes));

  // Calculate all paths and find the critical path
  let criticalPath = [];
  let maxDuration = 0;
  
  for (const start of startNodes) {
    for (const end of endNodes) {
      const paths = findAllPaths(start, end);
      console.log(`Paths from ${start} to ${end}:`, paths);
      paths.forEach(path => {
        const duration = calculatePathDuration(path);
        console.log(`Path ${path.join(' -> ')} duration: ${duration}`);
        if (duration > maxDuration) {
          maxDuration = duration;
          criticalPath = path;
          console.log('New critical path found:', path);
        }
      });
    }
  }

  console.log('Final critical path:', criticalPath);
  console.log('Final duration:', maxDuration);

  return {
    path: criticalPath,
    duration: maxDuration,
  };
};

const IT_PROJECT_ROLES = [
  "Project Manager",
  "Product Manager",
  "Scrum Master",
  "Business Analyst",
  "System Analyst",
  "Software Architect",
  "UI/UX Designer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer",
  "Web Developer",
  "Database Administrator",
  "DevOps Engineer",
  "QA Engineer",
  "Test Automation Engineer",
  "Security Engineer",
  "Cloud Engineer",
  "Infrastructure Engineer",
  "Network Engineer",
  "Data Engineer",
  "Data Scientist",
  "ML Engineer",
  "AI Specialist",
  "Technical Writer",
  "Configuration Manager",
  "Release Manager",
  "Support Engineer",
  "IT Operations",
  "Technical Lead",
  "Integration Specialist",
  "CRM Specialist",
  "ERP Consultant",
  "Solution Architect",
  "Platform Engineer",
  "Quality Manager",
  "IT Compliance Officer",
  "Cybersecurity Specialist",
  "Software Tester",
  "Accessibility Expert",
  "Performance Engineer",
  "API Developer",
  "SRE (Site Reliability Engineer)",
  "Penetration Tester",
  "Cloud Architect",
  "Migration Specialist",
  "Observability Engineer",
  "RPA Developer",
  "Other"
];

const getWeeksBetween = (start, end) => {
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s) || isNaN(e)) return 1;
  return Math.max(1, Math.ceil((e - s) / oneWeek));
};

const ProjectPlanTemplate = () => {
  const navigate = useNavigate();

  const [projectStartDate, setProjectStartDate] = useState("");  // Default empty string
  const [projectEndDate, setProjectEndDate] = useState("");  // Default empty string
  const [criticalPathInfo, setCriticalPathInfo] = useState({ path: [], duration: 0 });

  const [showCustomize, setShowCustomize] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [phases, setPhases] = useState(defaultPhases);
  const [milestones, setMilestones] = useState(defaultMilestones);
  const [dependencies, setDependencies] = useState(defaultDependencies);
  const [resources, setResources] = useState(defaultResources);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projectDurationInWeeks, setProjectDurationInWeeks] = useState(6); // Default value

  const handleResourceChange = (idx, phaseIdx, value) => {
    // Make sure the resource has an estimatedHours array
    const updatedResources = [...resources];
  
    if (!updatedResources[idx].estimatedHours) {
      updatedResources[idx].estimatedHours = Array(phases.length).fill(0); // Initialize if undefined
    }
  
    // Ensure the value is within bounds
    if (value < 0) value = 0;
    if (value > 40) value = 40;
  
    updatedResources[idx].estimatedHours[phaseIdx] = value;
    setResources(updatedResources);
  };

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await projectsApi.fetchProjects();
        // Handle different response formats
        if (Array.isArray(response)) {
          setProjects(response);
        } else if (response && Array.isArray(response.data)) {
          setProjects(response.data);
        } else {
          setProjects([]);
        }
        setLoadingProjects(false);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again.");
        setLoadingProjects(false);
        setProjects([]); // Initialize with empty array on error
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (phases.length > 0) {
      // Filter out phases with empty start or end dates
      const validPhases = phases.filter(phase => phase.startDate && phase.endDate);
      
      if (validPhases.length > 0) {
        const startDate = new Date(Math.min(...validPhases.map(phase => new Date(phase.startDate)))); 
        const endDate = new Date(Math.max(...validPhases.map(phase => new Date(phase.endDate))));
        
        // Check if the calculated dates are valid
        if (!isNaN(startDate) && !isNaN(endDate)) {
          setProjectStartDate(startDate.toISOString().split('T')[0]);  // Format the date to "YYYY-MM-DD"
          setProjectEndDate(endDate.toISOString().split('T')[0]);      // Format the date to "YYYY-MM-DD"
        } else {
          console.error("Invalid start or end date.");
        }
      }
    }
  }, [phases]);  // Recalculate when phases change

  // Add useEffect to calculate critical path when dependencies or milestones change
  useEffect(() => {
    if (milestones.some(m => !m.date) || dependencies.some(d => !d.source || !d.target)) {
      console.log('Skipping critical path calculation - incomplete data');
      console.log('Milestones:', milestones);
      console.log('Dependencies:', dependencies);
      return;
    }
    console.log('Calculating critical path...');
    console.log('Milestones:', milestones);
    console.log('Dependencies:', dependencies);
    const result = calculateCriticalPath(milestones, dependencies);
    console.log('Critical path result:', result);
    setCriticalPathInfo(result);
  }, [milestones, dependencies]);

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!selectedProject) {
      setError("Please select a project to save the Project Plan");
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      // Create the project plan payload with the actual data we have in this component
      const projectPlanData = {
        type: "ProjectPlan",
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        projectDuration: {
          weeks: projectDurationInWeeks,
          startDate: projectStartDate,
          endDate: projectEndDate
        },
        phases: phases,
        milestones: milestones,
        dependencies: dependencies,
        resources: resources,
        criticalPath: criticalPathInfo
      };
      
      const response = await projectsApi.updateProjectPlan(selectedProject, projectPlanData);
      
      setMessage("Project Plan saved successfully!");
      setLoading(false);
      
      // Redirect to project details after short delay
      setTimeout(() => {
        navigate(`/projects/${selectedProject}`);
      }, 2000);
      
    } catch (err) {
      console.error("Error saving Project Plan:", err);
      setError("Failed to save Project Plan. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      {/* Main container - full width, centered */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        {!showCustomize && (
          <div className="template-initial-view">
            <div className="template-content">
              <h1 className="template-title">Project Plan Template</h1>
              <p className="template-description">
                The Project Plan defines the phases, milestones, and resources of the project.
              </p>
              <button 
                className="template-customize-btn" 
                onClick={() => setShowCustomize(true)}
              >
                Customize Project Plan
              </button>
            </div>
          </div>
        )}

        {showCustomize && (
          <div className="w-full" style={{ paddingTop: "10px" }} >
            <h2 className="text-2xl mb-4">Customize Project Plan</h2>
            <p className="mb-6">Select a project to store this plan, then fill in the details below.</p>

            {error && <div className="error-text">{error}</div>}
            {message && <div className="success-text">{message}</div>}

            {/* Project Selection - full width */}
            <div className="w-full mb-6">
              <label htmlFor="projectSelect">Select Project:</label>
              {loadingProjects ? (
                <p>Loading projects...</p>
              ) : (
                <select
                  id="projectSelect"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full"
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

            <form onSubmit={handleSave} className="w-full space-y-8">
              {/* Section 1: Project Duration and Gantt Chart */}
              <div className="flex flex-row gap-6">
                <div className="w-1/3">
                  <div className="section-box">
                    <h3 className="text-xl mb-4">Project Duration and Phases</h3>
                    <div className="form-group">
                      <label>Project Duration (Weeks):</label>
                      <input
                        type="number"
                        min="1"
                        value={projectDurationInWeeks}
                        onChange={(e) => setProjectDurationInWeeks(Number(e.target.value))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Project Phases</label>
                      {phases.map((phase, idx) => (
                        <div key={idx} className="phase">
                          <input
                            type="text"
                            value={phase.name}
                            onChange={(e) => {
                              const updatedPhases = [...phases];
                              updatedPhases[idx].name = e.target.value;
                              setPhases(updatedPhases);
                            }}
                            placeholder="Phase Name"
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
                          />
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => {
                              const updatedPhases = phases.filter((_, i) => i !== idx);
                              setPhases(updatedPhases);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPhases([...phases, { name: "", startWeek: "", endWeek: "" }])}
                      >
                        + Add Phase
                      </button>
                    </div>
                  </div>
                </div>
                <div className="w-2/3">
                  <div style={{ height: '50%' }}>
                    <GanttChart 
                      phases={phases} 
                      projectStartDate={projectStartDate} 
                      projectEndDate={projectEndDate} 
                      projectDurationInWeeks={projectDurationInWeeks}
                    />
                  </div>
                  <div style={{ height: '300px', marginTop: '10px' }}>
                    <ProjectTimelineChart 
                      phases={phases}
                      projectDurationInWeeks={projectDurationInWeeks}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Resources and Resource Allocation Chart */}
              <div className="flex flex-row gap-6">
                <div className="w-1/3">
                  <div className="section-box">
                    <h3 className="text-xl mb-4">Resource Allocation</h3>
                    <div className="form-group">
                      <label>Resource Allocation</label>
                      {resources.map((resource, idx) => (
                        <div key={idx} className="resource">
                          <div className="resource-header">
                            <input
                              type="text"
                              value={resource.name}
                              onChange={(e) => {
                                const updatedResources = [...resources];
                                updatedResources[idx].name = e.target.value;
                                setResources(updatedResources);
                              }}
                              placeholder="Resource Name"
                            />
                            <select
                              value={resource.role}
                              onChange={(e) => {
                                const updatedResources = [...resources];
                                updatedResources[idx].role = e.target.value;
                                setResources(updatedResources);
                              }}
                            >
                              <option value="">Select Role</option>
                              {IT_PROJECT_ROLES.map((role, i) => (
                                <option key={i} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn-remove"
                              onClick={() => {
                                const updatedResources = resources.filter((_, i) => i !== idx);
                                setResources(updatedResources);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                          <table>
                            <thead>
                              <tr>
                                <th>Phase</th>
                                <th>Estimated Hours</th>
                              </tr>
                            </thead>
                            <tbody>
                              {phases.map((phase, pidx) => {
                                const estimatedHours = (resource.estimatedHours && resource.estimatedHours[pidx]) || 0;
                                return (
                                  <tr key={pidx}>
                                    <td>{phase.name}</td>
                                    <td>
                                      <input
                                        type="number"
                                        value={estimatedHours}
                                        onChange={(e) => handleResourceChange(idx, pidx, Math.min(40, parseFloat(e.target.value)))}
                                        max="40"
                                        placeholder="Estimated Hours"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setResources([
                          ...resources,
                          { 
                            name: "", 
                            role: "", 
                            estimatedHours: Array(phases.length).fill(0) 
                          }
                        ])}
                      >
                        + Add Resource
                      </button>
                    </div>
                  </div>
                </div>
                <div className="w-2/3">
                  <div style={{ height: '400px', marginTop: '10px' }}>
                    <ResourceAllocationChart resources={resources} phases={phases} />
                  </div>
                </div>
              </div>

              {/* Section 3: Milestones/Dependencies and Flowchart */}
              <div className="flex flex-row gap-6">
                <div className="w-1/3">
                  <div className="section-box">
                    <h3 className="text-xl mb-4">Milestones and Dependencies</h3>
                    <div className="form-group">
                      <label>Project Milestones</label>
                      {milestones.map((milestone, idx) => (
                        <div key={idx} className="milestone">
                          <input
                            type="text"
                            value={milestone.name}
                            onChange={(e) => {
                              const updatedMilestones = [...milestones];
                              updatedMilestones[idx].name = e.target.value;
                              setMilestones(updatedMilestones);
                            }}
                            placeholder="Enter milestone name"
                          />
                          <input
                            type="date"
                            value={milestone.date}
                            onChange={(e) => {
                              const updatedMilestones = [...milestones];
                              updatedMilestones[idx].date = e.target.value;
                              setMilestones(updatedMilestones);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updatedMilestones = milestones.filter((_, i) => i !== idx);
                              setMilestones(updatedMilestones);
                            }}
                          >
                            Remove Milestone
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setMilestones([...milestones, { name: "", date: "" }])}
                      >
                        + Add Milestone
                      </button>
                    </div>

                    <div className="form-group">
                      <label>Dependencies</label>
                      {dependencies.map((dependency, idx) => (
                        <div key={idx} className="dependency">
                          <select
                            value={dependency.source}
                            onChange={(e) => {
                              const updatedDependencies = [...dependencies];
                              updatedDependencies[idx].source = e.target.value;
                              setDependencies(updatedDependencies);
                            }}
                          >
                            <option value="">Select Source Milestone</option>
                            {milestones.map((milestone, i) => (
                              <option key={i} value={milestone.name}>
                                {milestone.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={dependency.target}
                            onChange={(e) => {
                              const updatedDependencies = [...dependencies];
                              updatedDependencies[idx].target = e.target.value;
                              setDependencies(updatedDependencies);
                            }}
                          >
                            <option value="">Select Target Milestone</option>
                            {milestones.map((milestone, i) => (
                              <option key={i} value={milestone.name}>
                                {milestone.name}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              const updatedDependencies = dependencies.filter((_, i) => i !== idx);
                              setDependencies(updatedDependencies);
                            }}
                          >
                            Remove Dependency
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setDependencies([...dependencies, { source: "", target: "" }])}
                      >
                        + Add Dependency
                      </button>
                    </div>
                  </div>
                </div>
                <div className="w-2/3">
                  <DependencyFlowchart milestones={milestones} dependencies={dependencies} projectId={selectedProject} />
                  
                  {/* Critical Path Display */}
                  {criticalPathInfo.path.length > 0 && (
                    <div className="critical-path-info mt-4" style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '10px',
                      padding: '20px',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <h4 className="text-xl font-bold mb-3" style={{ color: '#f5a623', borderBottom: '2px solid #3ecbf5', paddingBottom: '8px' }}>
                        Critical Path Analysis
                      </h4>
                      
                      <div style={{ 
                        backgroundColor: 'rgba(62, 203, 245, 0.1)', 
                        borderRadius: '8px', 
                        padding: '15px',
                        marginBottom: '15px',
                        borderLeft: '4px solid #3ecbf5'
                      }}>
                        <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#444' }}>
                          The critical path is the longest sequence of essential tasks from project start to finish, determining the minimum time required to complete the project. Any delays in these critical tasks will directly extend the project's overall duration, making timely completion crucial.
                        </p>
                      </div>
                      
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px'
                      }}>
                        <div style={{
                          background: '#3ecbf5',
                          borderRadius: '8px',
                          padding: '15px',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ fontWeight: 600, marginRight: '10px' }}>Path:</div>
                          <div style={{ flex: 1 }}>{criticalPathInfo.path.join(" → ")}</div>
                        </div>
                        
                        <div style={{
                          background: '#f5a623',
                          borderRadius: '8px',
                          padding: '15px',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ fontWeight: 600, marginRight: '10px' }}>Duration:</div>
                          <div style={{ flex: 1 }}>{Math.ceil(criticalPathInfo.duration / (1000 * 60 * 60 * 24))} days</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 mt-8">
                <button type="submit" className="btn-save-1">
                  Save Plan
                </button>
                <button
                  type="button"
                  className="btn-cancel-1"
                  onClick={() => setShowCustomize(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPlanTemplate;
