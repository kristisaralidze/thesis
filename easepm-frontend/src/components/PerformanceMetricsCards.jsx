/**
 * PerformanceMetricsCards Component
 * 
 * Purpose:
 * - Displays key project performance metrics in visually appealing cards
 * - Provides quick insights into project financial health
 * - Shows real-time calculations of BAC, AC, and EV
 * 
 * Features:
 * - Individual cards for each metric with descriptions
 * - Color-coded indicators for value changes
 * - Tooltips explaining calculation methods
 * - Responsive layout that adapts to container size
 * 
 * Data Visualization:
 * - BAC (Budget at Completion):
 *   - Sum of all planned expenses and labor costs
 *   - Formula: Total Planned Expenses + Total Planned Labor Costs
 * 
 * - AC (Actual Cost):
 *   - Total spent to date
 *   - Formula: Sum of Actual Expenses + Actual Labor Costs
 * 
 * - EV (Earned Value):
 *   - Value of work completed
 *   - Formula: PV × (Progress / 100)
 * 
 * Props:
 * @param {Object[]} expenses - Array of project expenses
 * @param {Object[]} resources - Array of project resources
 * @param {number} percentComplete - Current project completion percentage
 */

import React from 'react';
import './PerformanceMetricsCards.css';

const PerformanceMetricsCards = ({ expenses = [], resources = [], percentComplete = 0 }) => {
  // Calculate BAC (Budget at Completion)
  const calculateBAC = () => {
    const plannedExpenses = expenses.reduce((sum, expense) => sum + (expense.expectedAmount || 0), 0);
    const plannedLabor = resources.reduce((sum, resource) => 
      sum + ((resource.plannedHours || 0) * (resource.costRate || 0)), 0);
    return plannedExpenses + plannedLabor;
  };

  // Calculate AC (Actual Cost)
  const calculateAC = () => {
    const actualExpenses = expenses.reduce((sum, expense) => sum + (expense.actualAmount || 0), 0);
    const actualLabor = resources.reduce((sum, resource) => 
      sum + ((resource.actualHours || 0) * (resource.costRate || 0)), 0);
    return actualExpenses + actualLabor;
  };

  // Calculate EV (Earned Value)
  const calculateEV = () => {
    const bac = calculateBAC();
    return (bac * (percentComplete / 100));
  };

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const metrics = [
    {
      title: 'BAC',
      fullName: 'Budget at Completion',
      value: calculateBAC(),
      description: 'Total planned budget including expenses and labor costs',
      formula: 'Total Planned Expenses + Total Planned Labor Costs'
    },
    {
      title: 'AC',
      fullName: 'Actual Cost',
      value: calculateAC(),
      description: 'Total costs incurred to date',
      formula: 'Sum of Actual Expenses + Actual Labor Costs'
    },
    {
      title: 'EV',
      fullName: 'Earned Value',
      value: calculateEV(),
      description: 'Value of work completed based on % progress',
      formula: 'BAC × (Progress / 100)'
    }
  ];

  return (
    <div className="performance-metrics-cards">
      {metrics.map((metric) => (
        <div key={metric.title} className="metric-card">
          <div className="metric-header">
            <h3>{metric.title}</h3>
            <span className="metric-full-name">{metric.fullName}</span>
          </div>
          <div className="metric-value">{formatCurrency(metric.value)}</div>
          <div className="metric-info">
            <p className="metric-description">{metric.description}</p>
            <div className="metric-formula">
              <span className="formula-label">Formula:</span>
              <span className="formula-text">{metric.formula}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PerformanceMetricsCards; 