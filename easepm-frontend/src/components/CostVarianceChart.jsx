/**
 * CostVarianceChart Component
 * 
 * Purpose:
 * - Visualizes Cost Variance (CV = EV - AC) in a diverging horizontal bar chart
 * - Helps project managers quickly identify budget status (over or under budget)
 * - Shows magnitude of variance through bar length
 * 
 * Features:
 * - Diverging bar chart with center at 0
 * - Color coding: blue for under budget (positive CV), orange for over budget (negative CV)
 * - Interactive tooltips with detailed information
 * - Real-time updates when EV or AC changes
 * - Placeholder for empty state
 * 
 * Props:
 * @param {number} earnedValue (EV) - Earned Value of the project
 * @param {number} actualCost (AC) - Actual Cost of the project
 */

import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';
import './CostVarianceChart.css';

const CostVarianceChart = ({ earnedValue = 0, actualCost = 0 }) => {
  const chartRef = useRef(null);
  const costVariance = earnedValue - actualCost;
  
  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Determine if data is available
  const hasData = earnedValue !== 0 || actualCost !== 0;

  useEffect(() => {
    if (!chartRef.current) return;
    
    // Clear previous content
    d3.select(chartRef.current).selectAll('*').remove();
    
    // If no data is available, show placeholder
    if (!hasData) {
      d3.select(chartRef.current)
        .append('div')
        .attr('class', 'chart-placeholder')
        .html(`
          <div class="placeholder-content">
            <i class="fas fa-chart-bar placeholder-icon"></i>
            <p>Add project metrics to see cost variance</p>
            <p class="placeholder-subtext">The chart will show whether your project is over or under budget based on Earned Value (EV) and Actual Cost (AC)</p>
          </div>
        `);
      return;
    }
    
    // Chart dimensions and margins
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 160 - margin.top - margin.bottom;
    
    // Create SVG container
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Define scale for x-axis (CV values)
    // Make sure the scale is symmetric around zero for visual balance
    const maxAbsValue = Math.max(Math.abs(costVariance), 1000); // Minimum range for small values
    const x = d3.scaleLinear()
      .domain([-maxAbsValue, maxAbsValue])
      .range([0, width])
      .nice();
      
    // Add x-axis
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height/2})`)
      .call(d3.axisBottom(x)
        .tickFormat(d => formatCurrency(d))
        .ticks(5));
      
    // Add center line
    svg.append('line')
      .attr('x1', x(0))
      .attr('y1', 0)
      .attr('x2', x(0))
      .attr('y2', height)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4');
      
    // Add labels
    svg.append('text')
      .attr('x', x(-maxAbsValue/2))
      .attr('y', height/2 - 30)
      .attr('text-anchor', 'middle')
      .attr('class', 'over-budget-label')
      .text('Over Budget');
      
    svg.append('text')
      .attr('x', x(maxAbsValue/2))
      .attr('y', height/2 - 30)
      .attr('text-anchor', 'middle')
      .attr('class', 'under-budget-label')
      .text('Under Budget');
      
    // Bar height
    const barHeight = height * 0.4;
    
    // Add bar for Cost Variance
    const bar = svg.append('rect')
      .attr('class', 'cv-bar')
      .attr('x', costVariance < 0 ? x(costVariance) : x(0))
      .attr('y', height/2 - barHeight/2)
      .attr('width', Math.abs(x(costVariance) - x(0)))
      .attr('height', barHeight)
      .attr('fill', costVariance < 0 ? '#f5a623' : '#3ecbf5')
      .attr('rx', 4)
      .attr('ry', 4);
      
    // Add value label on bar
    svg.append('text')
      .attr('x', costVariance < 0 ? x(costVariance/2) : x(costVariance/2))
      .attr('y', height/2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('class', 'cv-value')
      .style('fill', Math.abs(costVariance) > maxAbsValue * 0.3 ? 'white' : '#333')
      .text(formatCurrency(costVariance));
      
    // Add title
    svg.append('text')
      .attr('x', width/2)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('class', 'chart-title')
      .text('Cost Variance (CV)');
      
    // Add tooltip
    const tooltip = d3.select(chartRef.current)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0);
      
    // Add hover interaction
    bar.on('mouseover', (event) => {
      // Highlight bar
      bar.attr('opacity', 0.8);
      
      // Show tooltip
      tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);
        
      tooltip.html(`
        <strong>Cost Variance (CV):</strong> ${formatCurrency(costVariance)}<br/>
        <strong>Earned Value (EV):</strong> ${formatCurrency(earnedValue)}<br/>
        <strong>Actual Cost (AC):</strong> ${formatCurrency(actualCost)}<br/>
        <strong>Status:</strong> <span class="${costVariance < 0 ? 'negative' : 'positive'}">
          ${costVariance < 0 ? 'Over Budget' : costVariance > 0 ? 'Under Budget' : 'On Budget'}
        </span>
      `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => {
      // Restore bar opacity
      bar.attr('opacity', 1);
      
      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    });
    
    // Add performance indicator
    const indicator = svg.append('g')
      .attr('class', 'performance-indicator')
      .attr('transform', `translate(${width/2}, ${height + 25})`);
      
    indicator.append('text')
      .attr('text-anchor', 'middle')
      .attr('class', costVariance < 0 ? 'negative' : 'positive')
      .text(() => {
        if (Math.abs(costVariance) < 0.01) return 'On Budget';
        const percentage = Math.abs(costVariance) / earnedValue * 100;
        return `${costVariance < 0 ? 'Over' : 'Under'} budget by ${percentage.toFixed(1)}%`;
      });
      
  }, [earnedValue, actualCost, costVariance, hasData]);
  
  return (
    <div className="cost-variance-chart">
      <div className="metrics-summary">
        <div className="metric">
          <span className="metric-label">EV:</span>
          <span className="metric-value">{formatCurrency(earnedValue)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">AC:</span>
          <span className="metric-value">{formatCurrency(actualCost)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">CV:</span>
          <span className={`metric-value ${costVariance < 0 ? 'negative' : 'positive'}`}>
            {formatCurrency(costVariance)}
          </span>
        </div>
        <div className="calculation-note">Cost Variance (CV = EV - AC) shows whether you're over or under budget based on work completed.</div>
      </div>
      <div ref={chartRef} className="chart-container"></div>
    </div>
  );
};

export default CostVarianceChart;