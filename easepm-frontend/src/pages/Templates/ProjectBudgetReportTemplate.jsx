import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import CostVarianceChart from '../../components/CostVarianceChart';
import ExpenseAnalytics from '../../components/ExpenseAnalytics';
import ForecastingView from '../../components/ForecastingView';
import Navbar from "../../components/Navbar";
import PerformanceIndicesChart from '../../components/PerformanceIndicesChart';
import PerformanceMetricsCards from '../../components/PerformanceMetricsCards';
import ProgressGauge from '../../components/ProgressGauge';
import ResourceMatrix from '../../components/ResourceMatrix';
import ScheduleVarianceChart from '../../components/ScheduleVarianceChart';
import "./ProjectBudgetReportTemplate.css";

// Import placeholders for future components
// These will be actual component imports later
const MetricsDashboard = () => (
  <div className="chart-placeholder">
    Metrics Dashboard Visualization Coming Soon
  </div>
);

const API_BASE = "http://localhost:5000/api";

const ProjectBudgetReportTemplate = () => {
  const navigate = useNavigate();

  // Add showCustomize state
  const [showCustomize, setShowCustomize] = useState(false);
  
  // Core state management
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loading, setLoading] = useState(false);

  // Additional budget data states
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [budgetStatus, setBudgetStatus] = useState("On Budget");
  const [personnelCosts, setPersonnelCosts] = useState(0);
  const [equipmentCosts, setEquipmentCosts] = useState(0);
  const [materialCosts, setMaterialCosts] = useState(0);
  const [contractorCosts, setContractorCosts] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);
  const [majorVariances, setMajorVariances] = useState("");
  const [reasonsForVariance, setReasonsForVariance] = useState("");
  const [correctionActions, setCorrectionActions] = useState("");
  const [remainingCostsForecast, setRemainingCostsForecast] = useState("");
  const [completionEstimate, setCompletionEstimate] = useState("");
  const [approvals, setApprovals] = useState("");

  // Budget Metrics state with expanded properties
  const [budgetMetrics, setBudgetMetrics] = useState({
    percentComplete: 0,
    startDate: new Date('2024-01-01'), // Default dates - should be updated when project is selected
    endDate: new Date('2024-12-31'),
    plannedProgress: 0
  });

  // Calculate planned progress based on timeline
  const calculatePlannedProgress = () => {
    const { startDate, endDate } = budgetMetrics;
    const today = new Date();
    const totalDuration = endDate - startDate;
    const elapsed = today - startDate;
    return Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
  };

  // Update metrics calculation when dates change
  useEffect(() => {
    setBudgetMetrics(prev => ({
      ...prev,
      plannedProgress: calculatePlannedProgress()
    }));
  }, [budgetMetrics.startDate, budgetMetrics.endDate]);

  // Modified handleMetricsChange to handle all metric updates
  const handleMetricsChange = (field, value) => {
    setBudgetMetrics(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Modify expense state to include both expected and actual amounts
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    expectedAmount: 0,
    actualAmount: 0
  });

  // Updated Expense categories for IT projects
  const expenseCategories = [
    // Direct Project Costs
    // Technical Infrastructure
    'Infrastructure - Data Center & Hosting',
    'Infrastructure - Cloud Services (AWS/Azure/GCP)',
    'Infrastructure - Network & Security',
    'Infrastructure - Development Environment',
    
    // Software & Licenses
    'Software - Development Tools & IDEs',
    'Software - Project Management Tools',
    'Software - Testing Tools',
    'Software - Security Solutions',
    'Software - Third-party APIs',
    'Software - Database Licenses',
    'Software - Cloud Platform Subscriptions',
    
    // Hardware
    'Hardware - Development Workstations',
    'Hardware - Testing Devices',
    'Hardware - Servers',
    'Hardware - Network Equipment',
    
    // Professional Services
    'Services - Technical Consulting',
    'Services - Security Audit',
    'Services - Quality Assurance',
    'Services - User Testing',
    'Services - Legal & Compliance',
    
    // Sales & Marketing
    'Sales - Sales Team Commission',
    'Sales - Client Acquisition Costs',
    'Sales - Marketing Campaigns',
    'Sales - Lead Generation',
    'Sales - Client Entertainment',
    'Sales - Travel Expenses',
    'Sales - Demo Environment',
    
    // Training & Development
    'Training - Technical Team Training',
    'Training - Sales Team Training',
    'Training - Certifications',
    'Training - Documentation',
    'Training - Workshop Materials',
    
    // Office & Administrative
    'Office - Rent & Utilities',
    'Office - Workstation Setup',
    'Office - Internet & Communication',
    'Office - Equipment Maintenance',
    'Office - Cleaning Services',
    'Office - Insurance',
    'Office - Security Services',
    
    // Team Support & Welfare
    'Team - Food & Beverages',
    'Team - Office Supplies',
    'Team - Team Building Events',
    'Team - Health & Safety',
    'Team - Remote Work Allowance',
    'Team - Transportation',
    
    // Administrative
    'Admin - HR Services',
    'Admin - Accounting Services',
    'Admin - Legal Services',
    'Admin - Software Licenses (Office, etc.)',
    'Admin - Communication Tools',
    
    // Events & Meetings
    'Events - Client Meetings',
    'Events - Team Meetings',
    'Events - Conferences',
    'Events - Workshops',
    'Events - Product Launch',
    
    // Miscellaneous
    'Misc - Bank Charges',
    'Misc - Currency Exchange Fees',
    'Misc - Emergency Fund',
    'Misc - Contingency Reserve',
    'Other'
  ];

  // Add new state for resources
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({
    name: '',
    role: '',
    plannedHours: 0,
    actualHours: 0,
    costRate: 0
  });

  // IT Software Roles
  const softwareRoles = [
    // Development Roles
    'Software Engineer',
    'Senior Software Engineer',
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Mobile Developer',
    'DevOps Engineer',
    
    // Architecture Roles
    'Software Architect',
    'Solutions Architect',
    'Cloud Architect',
    'Enterprise Architect',
    
    // Management Roles
    'Project Manager',
    'Product Manager',
    'Scrum Master',
    'Technical Lead',
    'Engineering Manager',
    
    // Quality Roles
    'QA Engineer',
    'Test Automation Engineer',
    'Quality Assurance Lead',
    'Performance Test Engineer',
    
    // Specialized Roles
    'Database Administrator',
    'Business Analyst',
    'UI/UX Designer',
    'Security Engineer',
    'Data Scientist',
    'Machine Learning Engineer',
    
    // Support Roles
    'Technical Support Engineer',
    'System Administrator',
    'Network Engineer',
    'Cloud Operations Engineer',
    'Other'
  ];

  // Add these new state variables near the top with other state declarations
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [editingResource, setEditingResource] = useState(null);

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

  const handleExpenseChange = (field, value) => {
    setNewExpense(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (newExpense.category && newExpense.expectedAmount > 0) {
      setExpenses(prev => [...prev, { ...newExpense, id: Date.now() }]);
      setNewExpense({ category: '', description: '', expectedAmount: 0, actualAmount: 0 }); // Reset form
    }
  };

  const handleRemoveExpense = (id) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const handleResourceChange = (field, value) => {
    setNewResource(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddResource = (e) => {
    e.preventDefault();
    if (newResource.name && newResource.role) {
      setResources(prev => [...prev, { ...newResource, id: Date.now() }]);
      setNewResource({
        name: '',
        role: '',
        plannedHours: 0,
        actualHours: 0,
        costRate: 0
      });
    }
  };

  const handleRemoveResource = (id) => {
    setResources(prev => prev.filter(resource => resource.id !== id));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!selectedProject) {
      setError("Please select a project to save the Project Budget Report");
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      // Calculate financial metrics
      const totalPlannedCost = expenses.reduce((sum, expense) => sum + expense.expectedAmount, 0);
      const totalActualCost = expenses.reduce((sum, expense) => sum + expense.actualAmount, 0);
      
      // Create the project budget report payload with a simpler structure
      const projectBudgetData = {
        type: "ProjectBudgetReport",
        version: 1,
        updated_at: new Date().toISOString(),
        metrics: {
          percentComplete: budgetMetrics.percentComplete,
          plannedProgress: budgetMetrics.plannedProgress,
          startDate: budgetMetrics.startDate.toISOString(),
          endDate: budgetMetrics.endDate.toISOString()
        },
        expenses: expenses,
        resources: resources,
        summary: {
          executiveSummary: executiveSummary,
          totalBudget: totalBudget || totalPlannedCost,
          totalSpent: totalSpent || totalActualCost,
          remainingBudget: (totalBudget || totalPlannedCost) - (totalSpent || totalActualCost),
          budgetStatus: budgetStatus || "On Budget",
          notes: correctionActions
        }
      };
      
      const response = await projectsApi.updateProjectBudgetReport(selectedProject, projectBudgetData);
      
      setMessage("Project Budget Report saved successfully!");
      setLoading(false);
      
      // Redirect to project details after short delay
      setTimeout(() => {
        navigate(`/projects/${selectedProject}`);
      }, 2000);
      
    } catch (err) {
      console.error("Error saving Project Budget Report:", err);
      setError("Failed to save Project Budget Report. Please try again.");
      setLoading(false);
    }
  };

  // Add these new handler functions before the return statement
  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setEditingExpense({ ...expense });
  };

  const handleUpdateExpense = () => {
    if (editingExpense) {
      setExpenses(prev => prev.map(expense => 
        expense.id === editingExpenseId ? editingExpense : expense
      ));
      setEditingExpenseId(null);
      setEditingExpense(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setEditingExpense(null);
  };

  const handleEditResource = (resource) => {
    setEditingResourceId(resource.id);
    setEditingResource({ ...resource });
  };

  const handleUpdateResource = () => {
    if (editingResource) {
      setResources(prev => prev.map(resource => 
        resource.id === editingResourceId ? editingResource : resource
      ));
      setEditingResourceId(null);
      setEditingResource(null);
    }
  };

  const handleCancelResourceEdit = () => {
    setEditingResourceId(null);
    setEditingResource(null);
  };

  // Add these functions to calculate EV and AC
  const calculateEarnedValue = () => {
    // EV = BAC (Budget at Completion) × % Complete
    const totalPlannedCost = expenses.reduce((sum, expense) => sum + expense.expectedAmount, 0) +
      resources.reduce((sum, resource) => sum + (resource.plannedHours * resource.costRate), 0);
    return (totalPlannedCost * budgetMetrics.percentComplete) / 100;
  };

  const calculateActualCost = () => {
    // AC = Sum of all actual costs to date
    return expenses.reduce((sum, expense) => sum + expense.actualAmount, 0) +
      resources.reduce((sum, resource) => sum + (resource.actualHours * resource.costRate), 0);
  };

  const calculatePlannedValue = () => {
    // PV = BAC × Planned Progress %
    const totalPlannedCost = expenses.reduce((sum, expense) => sum + expense.expectedAmount, 0) +
      resources.reduce((sum, resource) => sum + (resource.plannedHours * resource.costRate), 0);
    return (totalPlannedCost * budgetMetrics.plannedProgress) / 100;
  };

  return (
    <>
      <Navbar />
      <div className="budget-container">
        {!showCustomize ? (
          <div className="template-initial-view">
            <div className="template-content">
              <h1 className="template-title">Project Budget Template</h1>
              <p className="template-description">
                The Project Budget template helps you track and monitor your project's financial health, including expenses, resources, and performance metrics.
              </p>
              <button 
                className="template-customize-btn" 
                onClick={() => setShowCustomize(true)}
              >
                Customize Project Budget
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Top Section */}
            <div className="top-section">
              <h1 className="text-center mb-20">Project Budget Template</h1>
              
              <div className="project-selection">
                <div className="input-group">
                  <label htmlFor="projectSelect">Select Project:</label>
                  {loadingProjects ? (
                    <div className="loading">
                      <div className="loading-spinner"></div>
                      <p>Loading projects...</p>
                    </div>
                  ) : (
                    <select
                      id="projectSelect"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="form-select"
                    >
                      <option value="">-- Choose Project --</option>
                      {projects.map((proj) => (
                        <option key={proj._id} value={proj._id}>
                          {proj.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                {/* Executive Summary */}
                <div className="input-group mt-3">
                  <label htmlFor="executiveSummary">Executive Summary:</label>
                  <textarea
                    id="executiveSummary"
                    value={executiveSummary}
                    onChange={(e) => setExecutiveSummary(e.target.value)}
                    className="form-textarea"
                    placeholder="Provide a brief summary of the project budget..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-metrics">
                  <div className="progress-input">
                    <div className="range-input-group">
                      <label htmlFor="percentComplete">Project Completion</label>
                      <input
                        type="range"
                        id="percentComplete"
                        value={budgetMetrics.percentComplete}
                        onChange={(e) => handleMetricsChange('percentComplete', parseInt(e.target.value))}
                        min="0"
                        max="100"
                      />
                      <div className="input-group">
                        <input
                          type="number"
                          value={budgetMetrics.percentComplete}
                          onChange={(e) => handleMetricsChange('percentComplete', parseInt(e.target.value))}
                          min="0"
                          max="100"
                        />
                        <span className="tooltip">
                          %
                          <span className="tooltip-text">Project completion percentage</span>
                        </span>
                      </div>
                    </div>
                    {/* Add date inputs for project timeline */}
                    <div className="date-inputs">
                      <div className="input-group">
                        <label htmlFor="startDate">Start Date</label>
                        <input
                          type="date"
                          id="startDate"
                          value={budgetMetrics.startDate.toISOString().split('T')[0]}
                          onChange={(e) => handleMetricsChange('startDate', new Date(e.target.value))}
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="endDate">End Date</label>
                        <input
                          type="date"
                          id="endDate"
                          value={budgetMetrics.endDate.toISOString().split('T')[0]}
                          onChange={(e) => handleMetricsChange('endDate', new Date(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="gauge-container">
                    <ProgressGauge
                      percentComplete={budgetMetrics.percentComplete}
                      plannedProgress={budgetMetrics.plannedProgress}
                      startDate={budgetMetrics.startDate}
                      endDate={budgetMetrics.endDate}
                      theme="default"
                    />
                  </div>
                </div>
                <PerformanceMetricsCards
                  expenses={expenses}
                  resources={resources}
                  percentComplete={budgetMetrics.percentComplete}
                />
              </div>
            </div>

            {/* Expense Management Section */}
            <div className="form-section">
              <h2 className="mb-20">Expense Management</h2>
              
              <form onSubmit={handleAddExpense} className="expense-grid">
                <div className="input-group">
                  <label htmlFor="category">Expense Category</label>
                  <select
                    id="category"
                    value={newExpense.category}
                    onChange={(e) => handleExpenseChange('category', e.target.value)}
                    required
                  >
                    <option value="">Select Category</option>
                    {expenseCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="description">Description</label>
                  <input
                    type="text"
                    id="description"
                    value={newExpense.description}
                    onChange={(e) => handleExpenseChange('description', e.target.value)}
                    placeholder="Enter expense description"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="expectedAmount">Expected Amount ($)</label>
                  <input
                    type="number"
                    id="expectedAmount"
                    value={newExpense.expectedAmount}
                    onChange={(e) => handleExpenseChange('expectedAmount', parseFloat(e.target.value))}
                    min="0"
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="actualAmount">Actual Amount ($)</label>
                  <input
                    type="number"
                    id="actualAmount"
                    value={newExpense.actualAmount}
                    onChange={(e) => handleExpenseChange('actualAmount', parseFloat(e.target.value))}
                    min="0"
                    required
                  />
                </div>

                <button type="submit" className="add-button">Add Expense</button>
              </form>

              {/* Expense List */}
              <div className="mt-20">
                <h3 className="mb-20">Added Expenses</h3>
                {expenses.length === 0 ? (
                  <p>No expenses added yet</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Expected Amount</th>
                        <th>Actual Amount</th>
                        <th>Variance</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(expense => {
                        const variance = expense.expectedAmount - expense.actualAmount;
                        const varianceClass = variance > 0 ? 'variance-positive' : 'variance-negative';
                        
                        return (
                          <tr key={expense.id}>
                            {editingExpenseId === expense.id ? (
                              // Edit mode
                              <>
                                <td>
                                  <select
                                    value={editingExpense.category}
                                    onChange={(e) => setEditingExpense({...editingExpense, category: e.target.value})}
                                    required
                                  >
                                    {expenseCategories.map(category => (
                                      <option key={category} value={category}>
                                        {category}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={editingExpense.description}
                                    onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={editingExpense.expectedAmount}
                                    onChange={(e) => setEditingExpense({...editingExpense, expectedAmount: parseFloat(e.target.value)})}
                                    min="0"
                                    required
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={editingExpense.actualAmount}
                                    onChange={(e) => setEditingExpense({...editingExpense, actualAmount: parseFloat(e.target.value)})}
                                    min="0"
                                    required
                                  />
                                </td>
                                <td className={varianceClass}>
                                  ${Math.abs(editingExpense.expectedAmount - editingExpense.actualAmount).toFixed(2)}
                                  {(editingExpense.expectedAmount - editingExpense.actualAmount) !== 0 && 
                                    ((editingExpense.expectedAmount - editingExpense.actualAmount) > 0 ? ' under' : ' over')}
                                </td>
                                <td>
                                  <div className="action-buttons">
                                    <button onClick={handleUpdateExpense} className="edit-button">
                                      Save
                                    </button>
                                    <button onClick={handleCancelEdit} className="remove-button">
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              // View mode
                              <>
                                <td>{expense.category}</td>
                                <td>{expense.description}</td>
                                <td>${expense.expectedAmount.toFixed(2)}</td>
                                <td>${expense.actualAmount.toFixed(2)}</td>
                                <td className={varianceClass}>
                                  ${Math.abs(variance).toFixed(2)}
                                  {variance !== 0 && (variance > 0 ? ' under' : ' over')}
                                </td>
                                <td>
                                  <div className="action-buttons">
                                    <button
                                      onClick={() => handleEditExpense(expense)}
                                      className="edit-button"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleRemoveExpense(expense.id)}
                                      className="remove-button"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="expense-section">
                <h2>Expense Analytics</h2>
                <ExpenseAnalytics expenses={expenses} />
              </div>
            </div>

            {/* Resource Management Section */}
            <div className="form-section">
              <h2 className="mb-20">Resource Management</h2>
              
              <form onSubmit={handleAddResource} className="resource-grid">
                <div className="input-group">
                  <label htmlFor="resourceName">Resource Name</label>
                  <input
                    type="text"
                    id="resourceName"
                    value={newResource.name}
                    onChange={(e) => handleResourceChange('name', e.target.value)}
                    placeholder="Enter resource name"
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="resourceRole">Role</label>
                  <select
                    id="resourceRole"
                    value={newResource.role}
                    onChange={(e) => handleResourceChange('role', e.target.value)}
                    required
                  >
                    <option value="">Select Role</option>
                    {softwareRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="plannedHours">Planned Hours</label>
                  <input
                    type="number"
                    id="plannedHours"
                    value={newResource.plannedHours}
                    onChange={(e) => handleResourceChange('plannedHours', parseFloat(e.target.value))}
                    min="0"
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="actualHours">Actual Hours</label>
                  <input
                    type="number"
                    id="actualHours"
                    value={newResource.actualHours}
                    onChange={(e) => handleResourceChange('actualHours', parseFloat(e.target.value))}
                    min="0"
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="costRate">Hourly Rate ($)</label>
                  <input
                    type="number"
                    id="costRate"
                    value={newResource.costRate}
                    onChange={(e) => handleResourceChange('costRate', parseFloat(e.target.value))}
                    min="0"
                    required
                  />
                </div>

                <button type="submit" className="add-button">Add Resource</button>
              </form>

              {/* Resource List */}
              <div className="mt-20">
                <h3 className="mb-20">Added Resources</h3>
                {resources.length === 0 ? (
                  <p>No resources added yet</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Planned Hours</th>
                        <th>Actual Hours</th>
                        <th>Hourly Rate</th>
                        <th>Total Cost</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map(resource => (
                        <tr key={resource.id}>
                          {editingResourceId === resource.id ? (
                            // Edit mode
                            <>
                              <td>
                                <input
                                  type="text"
                                  value={editingResource.name}
                                  onChange={(e) => setEditingResource({...editingResource, name: e.target.value})}
                                  required
                                />
                              </td>
                              <td>
                                <select
                                  value={editingResource.role}
                                  onChange={(e) => setEditingResource({...editingResource, role: e.target.value})}
                                  required
                                >
                                  {softwareRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={editingResource.plannedHours}
                                  onChange={(e) => setEditingResource({...editingResource, plannedHours: parseFloat(e.target.value)})}
                                  min="0"
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={editingResource.actualHours}
                                  onChange={(e) => setEditingResource({...editingResource, actualHours: parseFloat(e.target.value)})}
                                  min="0"
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={editingResource.costRate}
                                  onChange={(e) => setEditingResource({...editingResource, costRate: parseFloat(e.target.value)})}
                                  min="0"
                                  required
                                />
                              </td>
                              <td>${(editingResource.actualHours * editingResource.costRate).toFixed(2)}</td>
                              <td>
                                <div className="action-buttons">
                                  <button onClick={handleUpdateResource} className="edit-button">
                                    Save
                                  </button>
                                  <button onClick={handleCancelResourceEdit} className="remove-button">
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // View mode
                            <>
                              <td>{resource.name}</td>
                              <td>{resource.role}</td>
                              <td>{resource.plannedHours}</td>
                              <td>{resource.actualHours}</td>
                              <td>${resource.costRate}</td>
                              <td>${(resource.actualHours * resource.costRate).toFixed(2)}</td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    onClick={() => handleEditResource(resource)}
                                    className="edit-button"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleRemoveResource(resource.id)}
                                    className="remove-button"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="resource-section">
                <h2>Resource Utilization Matrix</h2>
                <ResourceMatrix resources={resources} />
              </div>
            </div>

            {/* Performance Metrics Section */}
            <div className="performance-metrics">
              <div className="performance-metrics-left">
                <div className="performance-card">
                  <h3>Cost Performance</h3>
                  <CostVarianceChart 
                    earnedValue={calculateEarnedValue()}
                    actualCost={calculateActualCost()}
                  />
                </div>
                <div className="performance-card">
                  <h3>Schedule Performance</h3>
                  <ScheduleVarianceChart 
                    earnedValue={calculateEarnedValue()}
                    plannedValue={calculatePlannedValue()}
                  />
                </div>
              </div>
              <div className="performance-metrics-right">
                <div className="performance-card full-height">
                  <h3>Performance Indices</h3>
                  <PerformanceIndicesChart
                    earnedValue={calculateEarnedValue()}
                    actualCost={calculateActualCost()}
                    plannedValue={calculatePlannedValue()}
                  />
                </div>
              </div>
            </div>

            {/* Forecasting Section */}
            <div className="forecasting-section">
              <h2>Forecasting Metrics</h2>
              <ForecastingView 
                earnedValue={calculateEarnedValue()}
                actualCost={calculateActualCost()}
                bac={expenses.reduce((sum, expense) => sum + expense.expectedAmount, 0) +
                     resources.reduce((sum, resource) => sum + (resource.plannedHours * resource.costRate), 0)}
                cpi={calculateActualCost() === 0 ? 1 : calculateEarnedValue() / calculateActualCost()}
              />
            </div>

            {/* Bottom Section - Save Button */}
            <div className="form-section mt-20 form-buttons">
              {message && <div className="success-message">{message}</div>}
              {error && <div className="error-message">{error}</div>}
              <div className="button-row">
                <button type="button" className="btn-cancel" onClick={() => setShowCustomize(false)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-save"
                  onClick={handleSave}
                  disabled={loading || !selectedProject}
                >
                  {loading ? "Saving..." : "Save Budget Report"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ProjectBudgetReportTemplate;
