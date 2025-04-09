import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import "./ViewProjectBudgetReport.css";

const ViewProjectBudgetReport = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // Data states
  const [budgetReport, setBudgetReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  // Toggle between read-only and edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  // Local state for budget metrics (for editing)
  const [budgetMetrics, setBudgetMetrics] = useState({
    percentComplete: 0,
    startDate: new Date(),
    endDate: new Date(),
    plannedProgress: 0
  });
  
  // Function to safely format dates
  const formatDateValue = (date) => {
    try {
      // Check if date is valid
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn("Invalid date encountered, using current date instead");
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch (err) {
      console.error("Error formatting date:", err);
      return new Date().toISOString().split('T')[0];
    }
  };
  
  // State for expenses and resources
  const [expenses, setExpenses] = useState([]);
  const [resources, setResources] = useState([]);
  
  // State for editing individual items
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [editingResource, setEditingResource] = useState(null);
  
  // Constants for dropdown options
  const expenseCategories = [
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
    
    // Miscellaneous
    'Misc - Bank Charges',
    'Misc - Currency Exchange Fees',
    'Misc - Emergency Fund',
    'Misc - Contingency Reserve',
    'Other'
  ];
  
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

  // Calculate planned progress based on timeline
  const calculatePlannedProgress = () => {
    const { startDate, endDate } = budgetMetrics;
    const today = new Date();
    const totalDuration = endDate - startDate;
    const elapsed = today - startDate;
    return Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
  };

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    const amount = parseFloat(value) || 0;
    return `$${amount.toFixed(2)}`;
  };

  // Fetch the existing Project Budget Report on mount
  useEffect(() => {
    const fetchProjectBudget = async () => {
      try {
        // Use the projectsApi module instead of direct axios calls
        const res = await projectsApi.fetchProjectBudgetReport(projectId);
        setBudgetReport(res.data || res);
        
        console.log('Fetched project budget data:', JSON.stringify(res.data || res));

        // Populate state with existing data
        const responseData = res.data || res;
        if (responseData) {
          // Extract data based on different possible response structures
          const data = responseData.data || responseData.content || responseData;
          
          console.log('Budget metrics:', JSON.stringify(data.budgetMetrics || data.metrics));
          console.log('Expenses:', JSON.stringify(data.expenses));
          console.log('Resources:', JSON.stringify(data.resources));
          
          // Set budget metrics with proper defaults
          setBudgetMetrics({
            percentComplete: (data.budgetMetrics || data.metrics)?.percentComplete ?? 0,
            startDate: (data.budgetMetrics || data.metrics)?.startDate ? new Date((data.budgetMetrics || data.metrics).startDate) : new Date(),
            endDate: (data.budgetMetrics || data.metrics)?.endDate ? new Date((data.budgetMetrics || data.metrics).endDate) : new Date(),
            plannedProgress: (data.budgetMetrics || data.metrics)?.plannedProgress ?? calculatePlannedProgress()
          });
          
          // Ensure expenses have proper structure
          if (Array.isArray(data.expenses)) {
            // Make sure all expenses have required properties with proper number type handling
            const processedExpenses = data.expenses.map(expense => ({
              id: expense.id || Date.now(),
              category: expense.category || '',
              description: expense.description || '',
              expectedAmount: parseFloat(expense.expectedAmount) || 0,
              actualAmount: parseFloat(expense.actualAmount) || 0
            }));
            setExpenses(processedExpenses);
          } else {
            console.log('No expenses array found, setting empty array');
            setExpenses([]);
          }
          
          // Ensure resources have proper structure
          if (Array.isArray(data.resources)) {
            // Make sure all resources have required properties with proper number type handling
            const processedResources = data.resources.map(resource => ({
              id: resource.id || Date.now(),
              name: resource.name || '',
              role: resource.role || '',
              plannedHours: parseFloat(resource.plannedHours) || 0,
              actualHours: parseFloat(resource.actualHours) || 0,
              costRate: parseFloat(resource.costRate) || 0
            }));
            setResources(processedResources);
          } else {
            console.log('No resources array found, setting empty array');
            setResources([]);
          }
        } else {
          console.log('No data found in response');
        }
      } catch (err) {
        console.error("Error fetching Project Budget:", err);
        setError("Project Budget Report not found or access denied.");
      } finally {
        setLoading(false);
      }
    };
    fetchProjectBudget();
  }, [projectId]);

  // Handle expense editing
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

  const handleRemoveExpense = (id) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  // Handle resource editing
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

  const handleRemoveResource = (id) => {
    setResources(prev => prev.filter(resource => resource.id !== id));
  };

  // Save updated Project Budget
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      // Create a structured payload matching what the template would create
      const payload = {
        type: "ProjectBudgetReport",
        version: 1,
        updated_at: new Date().toISOString(),
        metrics: {
          percentComplete: parseInt(budgetMetrics.percentComplete || 0),
          startDate: budgetMetrics.startDate instanceof Date ? budgetMetrics.startDate.toISOString() : new Date().toISOString(),
          endDate: budgetMetrics.endDate instanceof Date ? budgetMetrics.endDate.toISOString() : new Date().toISOString(),
          plannedProgress: parseInt(budgetMetrics.plannedProgress || calculatePlannedProgress())
        },
        expenses: expenses.map(expense => ({
          id: expense.id || Date.now(),
          category: expense.category || '',
          description: expense.description || '',
          expectedAmount: parseFloat(expense.expectedAmount) || 0,
          actualAmount: parseFloat(expense.actualAmount) || 0
        })),
        resources: resources.map(resource => ({
          id: resource.id || Date.now(),
          name: resource.name || '',
          role: resource.role || '',
          plannedHours: parseFloat(resource.plannedHours) || 0,
          actualHours: parseFloat(resource.actualHours) || 0, 
          costRate: parseFloat(resource.costRate) || 0
        }))
      };

      console.log('Saving project budget with payload:', JSON.stringify(payload));
      
      // Use the projectsApi module instead of direct axios calls
      await projectsApi.updateProjectBudgetReport(projectId, payload);

      // Refetch updated data
      const updatedRes = await projectsApi.fetchProjectBudgetReport(projectId);
      setBudgetReport(updatedRes.data || updatedRes);
      
      console.log('Received updated budget data:', JSON.stringify(updatedRes.data || updatedRes));

      // Repopulate state with the updated data
      const responseData = updatedRes.data || updatedRes;
      if (responseData) {
        // Extract data based on different possible response structures
        const data = responseData.data || responseData.content || responseData;
        
        // Update budget metrics from response
        setBudgetMetrics({
          percentComplete: (data.budgetMetrics || data.metrics)?.percentComplete ?? 0,
          startDate: (data.budgetMetrics || data.metrics)?.startDate ? new Date((data.budgetMetrics || data.metrics).startDate) : new Date(),
          endDate: (data.budgetMetrics || data.metrics)?.endDate ? new Date((data.budgetMetrics || data.metrics).endDate) : new Date(),
          plannedProgress: (data.budgetMetrics || data.metrics)?.plannedProgress ?? calculatePlannedProgress()
        });
        
        // Update expenses from response
        if (Array.isArray(data.expenses)) {
          const processedExpenses = data.expenses.map(expense => ({
            id: expense.id || Date.now(),
            category: expense.category || '',
            description: expense.description || '',
            expectedAmount: parseFloat(expense.expectedAmount) || 0,
            actualAmount: parseFloat(expense.actualAmount) || 0
          }));
          setExpenses(processedExpenses);
        }
        
        // Update resources from response
        if (Array.isArray(data.resources)) {
          const processedResources = data.resources.map(resource => ({
            id: resource.id || Date.now(),
            name: resource.name || '',
            role: resource.role || '',
            plannedHours: parseFloat(resource.plannedHours) || 0,
            actualHours: parseFloat(resource.actualHours) || 0,
            costRate: parseFloat(resource.costRate) || 0
          }));
          setResources(processedResources);
        }
      }

      setIsEditMode(false);
      setMessage("Project Budget updated successfully!");
      setLoading(false);
    } catch (err) {
      console.error("Failed to update Project Budget:", err);
      setError("Failed to update Project Budget.");
      setLoading(false);
    }
  };

  // Cancel edit mode
  const handleCancel = () => {
    if (budgetReport && budgetReport.data) {
      const data = budgetReport.data;
      
      // Reset to original values with proper defaults
      setBudgetMetrics({
        percentComplete: data.budgetMetrics?.percentComplete ?? 0,
        startDate: data.budgetMetrics?.startDate ? new Date(data.budgetMetrics.startDate) : new Date(),
        endDate: data.budgetMetrics?.endDate ? new Date(data.budgetMetrics.endDate) : new Date(),
        plannedProgress: data.budgetMetrics?.plannedProgress ?? calculatePlannedProgress()
      });
      
      // Reset expenses with proper structure
      if (Array.isArray(data.expenses)) {
        const processedExpenses = data.expenses.map(expense => ({
          id: expense.id || Date.now(),
          category: expense.category || '',
          description: expense.description || '',
          expectedAmount: parseFloat(expense.expectedAmount) || 0,
          actualAmount: parseFloat(expense.actualAmount) || 0
        }));
        setExpenses(processedExpenses);
      } else {
        setExpenses([]);
      }
      
      // Reset resources with proper structure
      if (Array.isArray(data.resources)) {
        const processedResources = data.resources.map(resource => ({
          id: resource.id || Date.now(),
          name: resource.name || '',
          role: resource.role || '',
          plannedHours: parseFloat(resource.plannedHours) || 0,
          actualHours: parseFloat(resource.actualHours) || 0,
          costRate: parseFloat(resource.costRate) || 0
        }));
        setResources(processedResources);
      } else {
        setResources([]);
      }
    }
    
    // Reset form for new entries
    setNewExpense({
      category: '',
      description: '',
      expectedAmount: 0,
      actualAmount: 0
    });
    
    setNewResource({
      name: '',
      role: '',
      plannedHours: 0,
      actualHours: 0,
      costRate: 0
    });
    
    // Reset form state
    setEditingExpenseId(null);
    setEditingExpense(null);
    setEditingResourceId(null);
    setEditingResource(null);
    setIsEditMode(false);
  };

  // Return to Project Details
  const handleBackToProject = () => {
    navigate(`/projects/${projectId}`);
  };

  // Calculate metrics for charts
  const calculateEarnedValue = () => {
    // EV = BAC (Budget at Completion) × % Complete
    if (!expenses || !resources || !Array.isArray(expenses) || !Array.isArray(resources)) {
      return 0;
    }
    
    const totalPlannedCost = expenses.reduce((sum, expense) => sum + (parseFloat(expense.expectedAmount) || 0), 0) +
      resources.reduce((sum, resource) => sum + ((parseFloat(resource.plannedHours) || 0) * (parseFloat(resource.costRate) || 0)), 0);
    return (totalPlannedCost * (budgetMetrics?.percentComplete || 0)) / 100;
  };

  const calculateActualCost = () => {
    // AC = Sum of all actual costs to date
    if (!expenses || !resources || !Array.isArray(expenses) || !Array.isArray(resources)) {
      return 0;
    }
    
    return expenses.reduce((sum, expense) => sum + (parseFloat(expense.actualAmount) || 0), 0) +
      resources.reduce((sum, resource) => sum + ((parseFloat(resource.actualHours) || 0) * (parseFloat(resource.costRate) || 0)), 0);
  };

  const calculatePlannedValue = () => {
    // PV = BAC × Planned Progress %
    if (!expenses || !resources || !Array.isArray(expenses) || !Array.isArray(resources)) {
      return 0;
    }
    
    const totalPlannedCost = expenses.reduce((sum, expense) => sum + (parseFloat(expense.expectedAmount) || 0), 0) +
      resources.reduce((sum, resource) => sum + ((parseFloat(resource.plannedHours) || 0) * (parseFloat(resource.costRate) || 0)), 0);
    return (totalPlannedCost * (budgetMetrics?.plannedProgress || 0)) / 100;
  };

  // Handle metrics changes
  const handleMetricsChange = (field, value) => {
    setBudgetMetrics(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // State for adding new expense and resource
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    expectedAmount: 0,
    actualAmount: 0
  });

  const [newResource, setNewResource] = useState({
    name: '',
    role: '',
    plannedHours: 0,
    actualHours: 0,
    costRate: 0
  });

  // Add handler functions for adding new expenses and resources
  const handleExpenseChange = (field, value) => {
    setNewExpense(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddExpense = () => {
    // Add expense regardless of field values
    setExpenses(prev => [...prev, { 
      ...newExpense, 
      id: Date.now(),
      category: newExpense.category || 'Uncategorized',
      description: newExpense.description || '',
      expectedAmount: parseFloat(newExpense.expectedAmount) || 0,
      actualAmount: parseFloat(newExpense.actualAmount) || 0
    }]);
    setNewExpense({ category: '', description: '', expectedAmount: 0, actualAmount: 0 }); // Reset form
  };

  const handleResourceChange = (field, value) => {
    setNewResource(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddResource = () => {
    // Add resource regardless of field values
    setResources(prev => [...prev, { 
      ...newResource, 
      id: Date.now(),
      name: newResource.name || 'Unnamed Resource',
      role: newResource.role || 'Unspecified Role',
      plannedHours: parseFloat(newResource.plannedHours) || 0,
      actualHours: parseFloat(newResource.actualHours) || 0,
      costRate: parseFloat(newResource.costRate) || 0
    }]);
    setNewResource({
      name: '',
      role: '',
      plannedHours: 0,
      actualHours: 0,
      costRate: 0
    });
  };

  // Render read-only view
  const renderReadOnly = () => (
    <div className="budget-customization-section">
      <h2 className="budget-title">Project Budget Report (Version {budgetReport?.version || 1})</h2>
      {message && <div className="success-message">{message}</div>}

      {/* Top Section - Progress Metrics */}
      <div className="progress-section">
        <div className="progress-metrics">
          <div className="progress-input">
            <div className="range-input-group">
              <label>Project Completion</label>
              <div className="input-display">{budgetMetrics?.percentComplete || 0}%</div>
            </div>
            <div className="date-inputs">
              <div className="input-group">
                <label>Start Date</label>
                <div className="input-display">
                  {budgetMetrics?.startDate instanceof Date && !isNaN(budgetMetrics.startDate.getTime()) 
                    ? budgetMetrics.startDate.toLocaleDateString() 
                    : 'Not set'}
                </div>
              </div>
              <div className="input-group">
                <label>End Date</label>
                <div className="input-display">
                  {budgetMetrics?.endDate instanceof Date && !isNaN(budgetMetrics.endDate.getTime()) 
                    ? budgetMetrics.endDate.toLocaleDateString() 
                    : 'Not set'}
                </div>
              </div>
            </div>
          </div>
          <div className="gauge-container">
            <ProgressGauge
              percentComplete={budgetMetrics?.percentComplete || 0}
              plannedProgress={budgetMetrics?.plannedProgress || 0}
              startDate={budgetMetrics?.startDate instanceof Date && !isNaN(budgetMetrics.startDate.getTime()) 
                ? budgetMetrics.startDate : new Date()}
              endDate={budgetMetrics?.endDate instanceof Date && !isNaN(budgetMetrics.endDate.getTime()) 
                ? budgetMetrics.endDate : new Date()}
              theme="default"
            />
          </div>
        </div>
        <PerformanceMetricsCards
          expenses={expenses || []}
          resources={resources || []}
          percentComplete={budgetMetrics?.percentComplete || 0}
        />
      </div>

      {/* Expense Management Section */}
      <div className="form-section">
        <h2>Expense Management</h2>
        
        <div className="mt-20">
          <h3 className="mb-20">Project Expenses</h3>
          {expenses.length === 0 ? (
            <p>No expenses recorded</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Expected Amount</th>
                  <th>Actual Amount</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => {
                  const variance = expense.expectedAmount - expense.actualAmount;
                  const varianceClass = variance > 0 ? 'variance-positive' : 'variance-negative';

                  return (
                    <tr key={expense.id}>
                      <td>{expense.category || ''}</td>
                      <td>{expense.description || ''}</td>
                      <td>{formatCurrency(expense.expectedAmount)}</td>
                      <td>{formatCurrency(expense.actualAmount)}</td>
                      <td className={varianceClass}>
                        {formatCurrency(Math.abs(variance))}
                        {variance !== 0 && (variance > 0 ? ' under' : ' over')}
                      </td>
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
        <h2>Resource Management</h2>
        
        <div className="mt-20">
          <h3 className="mb-20">Project Resources</h3>
          {resources.length === 0 ? (
            <p>No resources recorded</p>
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
                </tr>
              </thead>
              <tbody>
                {resources.map(resource => (
                  <tr key={resource.id}>
                    <td>{resource.name || ''}</td>
                    <td>{resource.role || ''}</td>
                    <td>{parseFloat(resource.plannedHours) || 0}</td>
                    <td>{parseFloat(resource.actualHours) || 0}</td>
                    <td>{formatCurrency(resource.costRate)}</td>
                    <td>{formatCurrency((parseFloat(resource.actualHours) || 0) * (parseFloat(resource.costRate) || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="resource-section">
          <h2>Resource Utilization Matrix</h2>
          <ResourceMatrix resources={resources || []} />
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
          bac={
            Array.isArray(expenses) && Array.isArray(resources) ?
            expenses.reduce((sum, expense) => sum + (parseFloat(expense.expectedAmount) || 0), 0) +
            resources.reduce((sum, resource) => sum + ((parseFloat(resource.plannedHours) || 0) * (parseFloat(resource.costRate) || 0)), 0)
            : 0
          }
          cpi={calculateActualCost() === 0 ? 1 : calculateEarnedValue() / calculateActualCost()}
        />
      </div>

      <div className="budget-button-group">
        <button className="budget-btn-edit" onClick={() => setIsEditMode(true)}>Edit</button>
        <button className="budget-btn-back" onClick={handleBackToProject}>Back to Project</button>
      </div>
    </div>
  );

  // Render edit mode
  const renderEditMode = () => (
    <div className="budget-edit-container">
      <h2 className="budget-edit-title">Editing Project Budget Report (Version {budgetReport?.version || 1})</h2>
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}
      
      <div className="edit-instructions">
        <p>You are in edit mode. Make changes to the budget metrics, expenses, and resources below, then click 'Save Changes' when you're done. All charts and analytics will update as you make changes.</p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }} className="budget-form">
        {/* Progress Metrics Section */}
        <div className="progress-section">
          <div className="progress-metrics">
            <div className="progress-input">
              <div className="range-input-group">
                <label htmlFor="percentComplete">Project Completion</label>
                <input
                  type="range"
                  id="percentComplete"
                  value={budgetMetrics?.percentComplete || 0}
                  onChange={(e) => handleMetricsChange('percentComplete', parseInt(e.target.value))}
                  min="0"
                  max="100"
                />
                <div className="input-group">
                  <input
                    type="number"
                    value={budgetMetrics?.percentComplete || 0}
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
              {/* Date inputs for project timeline */}
              <div className="date-inputs">
                <div className="input-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    value={formatDateValue(budgetMetrics?.startDate)}
                    onChange={(e) => handleMetricsChange('startDate', new Date(e.target.value))}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="endDate">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    value={formatDateValue(budgetMetrics?.endDate)}
                    onChange={(e) => handleMetricsChange('endDate', new Date(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <div className="gauge-container">
              <ProgressGauge
                percentComplete={budgetMetrics?.percentComplete || 0}
                plannedProgress={budgetMetrics?.plannedProgress || 0}
                startDate={budgetMetrics?.startDate instanceof Date && !isNaN(budgetMetrics.startDate.getTime()) 
                  ? budgetMetrics.startDate : new Date()}
                endDate={budgetMetrics?.endDate instanceof Date && !isNaN(budgetMetrics.endDate.getTime()) 
                  ? budgetMetrics.endDate : new Date()}
                theme="default"
              />
            </div>
          </div>
          <PerformanceMetricsCards
            expenses={expenses || []}
            resources={resources || []}
            percentComplete={budgetMetrics?.percentComplete || 0}
          />
        </div>

        {/* Expense Management Section */}
        <div className="form-section">
          <h2 className="mb-20">Expense Management</h2>
          
          {/* Add Expense Form - Changed from form to div */}
          <div className="expense-grid">
            <div className="input-group">
              <label htmlFor="category">Expense Category</label>
              <select
                id="category"
                value={newExpense.category}
                onChange={(e) => handleExpenseChange('category', e.target.value)}
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
              />
            </div>

            <button type="button" onClick={handleAddExpense} className="add-button">Add Expense</button>
          </div>
          
          <div className="mt-20">
            <h3 className="mb-20">Project Expenses</h3>
            {expenses.length === 0 ? (
              <p>No expenses recorded</p>
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
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={editingExpense.actualAmount}
                                onChange={(e) => setEditingExpense({...editingExpense, actualAmount: parseFloat(e.target.value)})}
                                min="0"
                              />
                            </td>
                            <td className={varianceClass}>
                              {formatCurrency(Math.abs(editingExpense.expectedAmount - editingExpense.actualAmount))}
                              {(editingExpense.expectedAmount - editingExpense.actualAmount) !== 0 && 
                                (editingExpense.expectedAmount - editingExpense.actualAmount > 0 ? ' under' : ' over')}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button type="button" onClick={handleUpdateExpense} className="edit-button">
                                  Save
                                </button>
                                <button type="button" onClick={handleCancelEdit} className="remove-button">
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          // View mode
                          <>
                            <td>{expense.category || ''}</td>
                            <td>{expense.description || ''}</td>
                            <td>{formatCurrency(expense.expectedAmount)}</td>
                            <td>{formatCurrency(expense.actualAmount)}</td>
                            <td className={varianceClass}>
                              {formatCurrency(Math.abs(variance))}
                              {variance !== 0 && (variance > 0 ? ' under' : ' over')}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  type="button"
                                  onClick={() => handleEditExpense(expense)}
                                  className="edit-button"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
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
          
          {/* Add Resource Form - Changed from form to div */}
          <div className="resource-grid">
            <div className="input-group">
              <label htmlFor="resourceName">Resource Name</label>
              <input
                type="text"
                id="resourceName"
                value={newResource.name}
                onChange={(e) => handleResourceChange('name', e.target.value)}
                placeholder="Enter resource name"
              />
            </div>

            <div className="input-group">
              <label htmlFor="resourceRole">Role</label>
              <select
                id="resourceRole"
                value={newResource.role}
                onChange={(e) => handleResourceChange('role', e.target.value)}
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
              />
            </div>

            <button type="button" onClick={handleAddResource} className="add-button">Add Resource</button>
          </div>
          
          <div className="mt-20">
            <h3 className="mb-20">Project Resources</h3>
            {resources.length === 0 ? (
              <p>No resources recorded</p>
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
                            />
                          </td>
                          <td>
                            <select
                              value={editingResource.role}
                              onChange={(e) => setEditingResource({...editingResource, role: e.target.value})}
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
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={editingResource.actualHours}
                              onChange={(e) => setEditingResource({...editingResource, actualHours: parseFloat(e.target.value)})}
                              min="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={editingResource.costRate}
                              onChange={(e) => setEditingResource({...editingResource, costRate: parseFloat(e.target.value)})}
                              min="0"
                            />
                          </td>
                          <td>{formatCurrency((parseFloat(editingResource.actualHours) || 0) * (parseFloat(editingResource.costRate) || 0))}</td>
                          <td>
                            <div className="action-buttons">
                              <button type="button" onClick={handleUpdateResource} className="edit-button">
                                Save
                              </button>
                              <button type="button" onClick={handleCancelResourceEdit} className="remove-button">
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // View mode
                        <>
                          <td>{resource.name || ''}</td>
                          <td>{resource.role || ''}</td>
                          <td>{parseFloat(resource.plannedHours) || 0}</td>
                          <td>{parseFloat(resource.actualHours) || 0}</td>
                          <td>{formatCurrency(resource.costRate)}</td>
                          <td>{formatCurrency((parseFloat(resource.actualHours) || 0) * (parseFloat(resource.costRate) || 0))}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                onClick={() => handleEditResource(resource)}
                                className="edit-button"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
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
            <ResourceMatrix resources={resources || []} />
          </div>
        </div>

        {/* Performance Metrics Section - Added to Edit Mode */}
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
            bac={
              Array.isArray(expenses) && Array.isArray(resources) ?
              expenses.reduce((sum, expense) => sum + (parseFloat(expense.expectedAmount) || 0), 0) +
              resources.reduce((sum, resource) => sum + ((parseFloat(resource.plannedHours) || 0) * (parseFloat(resource.costRate) || 0)), 0)
              : 0
            }
            cpi={calculateActualCost() === 0 ? 1 : calculateEarnedValue() / calculateActualCost()}
          />
        </div>

        {/* Form Actions */}
        <div className="budget-form-actions">
          <button type="button" onClick={handleSave} className="budget-btn-save">
            Save Changes
          </button>
          <button
            type="button"
            className="budget-btn-cancel"
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
      <div className="budget-container">
        {loading ? (
          <div className="loading-message">Loading Project Budget...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          isEditMode ? renderEditMode() : renderReadOnly()
        )}
      </div>
    </>
  );
};

export default ViewProjectBudgetReport;
