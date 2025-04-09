/**
 * ForecastingView Component
 * 
 * Purpose:
 * - Visualizes project forecasting metrics including EAC, VAC, and ETC
 * - Provides a visual bar chart for EAC showing the relationship to BAC
 * - Displays forecast variance with color-coded indicators
 * 
 * Props:
 * @param {number} earnedValue (EV) - Earned Value of the project
 * @param {number} actualCost (AC) - Actual Cost of the project
 * @param {number} bac - Budget at Completion (total budget)
 * @param {number} cpi - Cost Performance Index (pass 1 if not available)
 */

import React, { useEffect, useRef } from 'react';
import './ForecastingView.css';

const ForecastingView = ({ earnedValue = 0, actualCost = 0, bac = 0, cpi = 0 }) => {
  const barChartRef = useRef(null);
  
  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Calculate forecasting metrics
  // EAC = AC + (BAC - EV) / CPI
  const calculateEAC = () => {
    if (!cpi || cpi === 0) return 0;
    return actualCost + ((bac - earnedValue) / cpi);
  };
  
  // VAC = BAC - EAC
  const calculateVAC = (eac) => {
    return bac - eac;
  };
  
  // ETC = EAC - AC
  const calculateETC = (eac) => {
    return eac - actualCost;
  };
  
  const eac = calculateEAC();
  const vac = calculateVAC(eac);
  const etc = calculateETC(eac);
  
  // Determine if data is available for meaningful calculations
  const hasData = bac > 0 && (earnedValue > 0 || actualCost > 0) && cpi !== 0;
  
  // Render the EAC bar chart
  useEffect(() => {
    if (!barChartRef.current || !hasData) return;
    
    const barChart = barChartRef.current;
    barChart.innerHTML = '';
    
    // Create bar chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'eac-bar-chart';
    
    // Calculate percentages for visualization
    const bacTotal = bac;
    const eacTotal = eac;
    const eacPercent = Math.min(Math.round((eacTotal / bacTotal) * 100), 200); // Cap at 200% for display
    
    // BAC reference line
    const bacLine = document.createElement('div');
    bacLine.className = 'bac-reference-line';
    bacLine.style.left = '100%';
    const bacLabel = document.createElement('div');
    bacLabel.className = 'bac-label';
    bacLabel.textContent = 'BAC';
    bacLine.appendChild(bacLabel);
    
    // Create the bar visualization
    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';
    
    const bar = document.createElement('div');
    bar.className = 'eac-bar';
    
    // Split the bar into AC (already spent) and ETC (to be spent)
    const acBar = document.createElement('div');
    acBar.className = 'ac-portion';
    acBar.style.width = `${Math.min(Math.round((actualCost / bacTotal) * 100), 100)}%`;
    acBar.setAttribute('data-tooltip', `Actual Cost: ${formatCurrency(actualCost)}`);
    
    const etcBar = document.createElement('div');
    etcBar.className = 'etc-portion';
    // If EAC is over budget (> BAC), color the overrun portion orange
    if (eacTotal > bacTotal) {
      const withinBudgetWidth = Math.max(0, 100 - Math.round((actualCost / bacTotal) * 100));
      const overBudgetWidth = Math.min(100, Math.round(((eacTotal - bacTotal) / bacTotal) * 100));
      
      if (withinBudgetWidth > 0) {
        etcBar.style.width = `${withinBudgetWidth}%`;
        
        const overBudgetBar = document.createElement('div');
        overBudgetBar.className = 'over-budget-portion';
        overBudgetBar.style.width = `${overBudgetWidth}%`;
        bar.appendChild(overBudgetBar);
      } else {
        // All remaining is over budget
        etcBar.style.width = '0%';
        
        const overBudgetBar = document.createElement('div');
        overBudgetBar.className = 'over-budget-portion';
        overBudgetBar.style.width = `${overBudgetWidth}%`;
        bar.appendChild(overBudgetBar);
      }
    } else {
      // Within budget
      etcBar.style.width = `${Math.round(((eacTotal - actualCost) / bacTotal) * 100)}%`;
    }
    etcBar.setAttribute('data-tooltip', `Estimate To Complete: ${formatCurrency(etc)}`);
    
    // Assemble the bars
    bar.appendChild(acBar);
    bar.appendChild(etcBar);
    barContainer.appendChild(bar);
    
    // EAC Label
    const eacLabel = document.createElement('div');
    eacLabel.className = 'eac-label';
    eacLabel.textContent = `EAC: ${formatCurrency(eacTotal)}`;
    eacLabel.style.left = `${Math.min(eacPercent, 100)}%`;
    if (eacPercent > 100) {
      eacLabel.classList.add('over-budget');
    }
    
    // Add to DOM
    chartContainer.appendChild(barContainer);
    chartContainer.appendChild(bacLine);
    chartContainer.appendChild(eacLabel);
    
    // Add percentage scale markers
    const scaleMarkers = document.createElement('div');
    scaleMarkers.className = 'scale-markers';
    
    for (let i = 0; i <= 100; i += 25) {
      const marker = document.createElement('div');
      marker.className = 'scale-marker';
      marker.style.left = `${i}%`;
      
      const label = document.createElement('div');
      label.className = 'scale-label';
      label.textContent = `${i}%`;
      
      marker.appendChild(label);
      scaleMarkers.appendChild(marker);
    }
    
    chartContainer.appendChild(scaleMarkers);
    barChart.appendChild(chartContainer);
    
  }, [earnedValue, actualCost, bac, cpi, eac, etc, hasData]);
  
  return (
    <div className="forecasting-view">
      {!hasData ? (
        <div className="forecast-placeholder">
          <div className="placeholder-content">
            <i className="fas fa-chart-line placeholder-icon"></i>
            <p>Add project metrics to see forecasting calculations</p>
            <p className="placeholder-subtext">
              Enter budget, costs, and progress data to generate EAC, VAC, and ETC projections
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="forecast-metrics">
            <div className="metric-card">
              <h4>Estimate at Completion (EAC)</h4>
              <div className={`forecast-value ${eac > bac ? 'over-budget' : 'under-budget'}`}>
                {formatCurrency(eac)}
              </div>
              <div className="calculation-formula">
                EAC = AC + (BAC − EV) / CPI
              </div>
              <div className="calculation-note">
                {eac > bac 
                  ? 'Project is forecasted to exceed the budget'
                  : 'Project is forecasted to complete within budget'}
              </div>
            </div>
            
            <div className="metric-card">
              <h4>Variance at Completion (VAC)</h4>
              <div className={`forecast-value ${vac >= 0 ? 'under-budget' : 'over-budget'}`}>
                {formatCurrency(vac)}
              </div>
              <div className="calculation-formula">
                VAC = BAC − EAC
              </div>
              <div className="calculation-note">
                {vac >= 0 
                  ? 'Positive variance: Project forecasted to finish under budget'
                  : 'Negative variance: Project forecasted to exceed budget'}
              </div>
            </div>
            
            <div className="metric-card">
              <h4>Estimate to Complete (ETC)</h4>
              <div className="forecast-value">
                {formatCurrency(etc)}
              </div>
              <div className="calculation-formula">
                ETC = EAC − AC
              </div>
              <div className="calculation-note">
                Amount still needed to complete the project from now until the end
              </div>
            </div>
          </div>
          
          <div className="eac-visualization">
            <h4>EAC Visualization (Budget Reference Line at 100%)</h4>
            <div ref={barChartRef} className="eac-chart-container"></div>
          </div>
        </>
      )}
    </div>
  );
};

export default ForecastingView;