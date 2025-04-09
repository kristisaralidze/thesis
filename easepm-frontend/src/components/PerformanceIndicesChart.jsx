/**
 * PerformanceIndicesChart Component
 * 
 * Purpose:
 * - Visualizes Cost Performance Index (CPI) and Schedule Performance Index (SPI) in a quadrant chart
 * - Helps project managers assess both cost and schedule performance simultaneously
 * - Provides clear interpretation of project status based on quadrant position
 * 
 * Features:
 * - Four-quadrant scatter plot with center at (1,1)
 * - Color-coded quadrants for different performance combinations
 * - Reference lines at CPI=1 and SPI=1
 * - Interactive tooltip with detailed information
 * - Placeholder for empty state
 * 
 * Props:
 * @param {number} earnedValue (EV) - Earned Value of the project
 * @param {number} actualCost (AC) - Actual Cost of the project
 * @param {number} plannedValue (PV) - Planned Value of the project
 */

import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';
import './PerformanceIndicesChart.css';

const PerformanceIndicesChart = ({ earnedValue = 0, actualCost = 0, plannedValue = 0 }) => {
  const chartRef = useRef(null);
  
  // Calculate CPI and SPI
  const cpi = actualCost === 0 ? 0 : earnedValue / actualCost;
  const spi = plannedValue === 0 ? 0 : earnedValue / plannedValue;
  
  // Format decimal values
  const formatValue = (value) => {
    return value.toFixed(2);
  };
  
  // Determine if data is available
  const hasData = earnedValue !== 0 && (actualCost !== 0 || plannedValue !== 0);

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
            <i class="fas fa-chart-scatter placeholder-icon"></i>
            <p>Add project metrics to see performance indices</p>
            <p class="placeholder-subtext">The chart will show project performance based on Cost Performance Index (CPI) and Schedule Performance Index (SPI)</p>
          </div>
        `);
      return;
    }
    
    // Chart dimensions and margins
    const margin = { top: 50, right: 50, bottom: 70, left: 70 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG container
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Define scales
    // Add padding to domain for better visualization
    const xDomain = [Math.min(0.5, cpi * 0.8), Math.max(1.5, cpi * 1.2)];
    const yDomain = [Math.min(0.5, spi * 0.8), Math.max(1.5, spi * 1.2)];
    
    const x = d3.scaleLinear()
      .domain(xDomain)
      .range([0, width])
      .nice();
      
    const y = d3.scaleLinear()
      .domain(yDomain)
      .range([height, 0])
      .nice();
    
    // Add quadrant backgrounds
    // Top Right - Under budget & ahead of schedule (blue)
    svg.append('rect')
      .attr('x', x(1))
      .attr('y', 0)
      .attr('width', width - x(1))
      .attr('height', y(1))
      .attr('fill', '#3ecbf5')
      .attr('opacity', 0.1);
      
    // Top Left - Under budget & behind schedule (light blue with orange)
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', x(1))
      .attr('height', y(1))
      .attr('fill', '#3ecbf5')
      .attr('opacity', 0.05);
      
    // Bottom Right - Over budget & ahead of schedule (orange with blue)
    svg.append('rect')
      .attr('x', x(1))
      .attr('y', y(1))
      .attr('width', width - x(1))
      .attr('height', height - y(1))
      .attr('fill', '#f5a623')
      .attr('opacity', 0.05);
      
    // Bottom Left - Over budget & behind schedule (orange)
    svg.append('rect')
      .attr('x', 0)
      .attr('y', y(1))
      .attr('width', x(1))
      .attr('height', height - y(1))
      .attr('fill', '#f5a623')
      .attr('opacity', 0.1);
    
    // Add x-axis
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));
      
    // Add y-axis
    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y).ticks(5));
    
    // Add grid lines
    svg.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line.grid-line')
      .data(x.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', d => x(d))
      .attr('y1', 0)
      .attr('x2', d => x(d))
      .attr('y2', height)
      .attr('stroke', '#eee')
      .attr('stroke-width', 1);
      
    svg.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line.grid-line')
      .data(y.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('y1', d => y(d))
      .attr('x2', width)
      .attr('y2', d => y(d))
      .attr('stroke', '#eee')
      .attr('stroke-width', 1);
    
    // Add reference lines at CPI=1 and SPI=1
    svg.append('line')
      .attr('class', 'reference-line')
      .attr('x1', x(1))
      .attr('y1', 0)
      .attr('x2', x(1))
      .attr('y2', height)
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');
      
    svg.append('line')
      .attr('class', 'reference-line')
      .attr('x1', 0)
      .attr('y1', y(1))
      .attr('x2', width)
      .attr('y2', y(1))
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');
    
    // Add axis labels
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .text('Cost Performance Index (CPI)');
      
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .text('Schedule Performance Index (SPI)');
    
    // Add quadrant labels
    svg.append('text')
      .attr('class', 'quadrant-label good')
      .attr('x', x(1) + (width - x(1)) / 2)
      .attr('y', y(1) / 2)
      .attr('text-anchor', 'middle')
      .text('Under Budget & Ahead of Schedule');
      
    svg.append('text')
      .attr('class', 'quadrant-label mixed')
      .attr('x', x(1) / 2)
      .attr('y', y(1) / 2)
      .attr('text-anchor', 'middle')
      .text('Under Budget & Behind Schedule');
      
    svg.append('text')
      .attr('class', 'quadrant-label mixed')
      .attr('x', x(1) + (width - x(1)) / 2)
      .attr('y', y(1) + (height - y(1)) / 2)
      .attr('text-anchor', 'middle')
      .text('Over Budget & Ahead of Schedule');
      
    svg.append('text')
      .attr('class', 'quadrant-label bad')
      .attr('x', x(1) / 2)
      .attr('y', y(1) + (height - y(1)) / 2)
      .attr('text-anchor', 'middle')
      .text('Over Budget & Behind Schedule');
    
    // Add current performance point
    const point = svg.append('circle')
      .attr('class', 'performance-point')
      .attr('cx', x(cpi))
      .attr('cy', y(spi))
      .attr('r', 8)
      .attr('fill', () => {
        if (cpi >= 1 && spi >= 1) return '#3ecbf5'; // Blue for good
        if (cpi < 1 && spi < 1) return '#f5a623'; // Orange for bad
        return '#6c757d'; // Grey for mixed
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
    
    // Add tooltip
    const tooltip = d3.select(chartRef.current)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0);
    
    // Add hover interaction
    point.on('mouseover', (event) => {
      // Highlight point
      point.attr('r', 10);
      
      // Show tooltip
      tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);
        
      // Determine status text
      let statusText = '';
      let statusClass = '';
      
      if (cpi >= 1 && spi >= 1) {
        statusText = 'Great! Under budget and ahead of schedule';
        statusClass = 'positive';
      } else if (cpi >= 1 && spi < 1) {
        statusText = 'Mixed: Under budget but behind schedule';
        statusClass = 'mixed';
      } else if (cpi < 1 && spi >= 1) {
        statusText = 'Mixed: Over budget but ahead of schedule';
        statusClass = 'mixed';
      } else {
        statusText = 'Warning: Over budget and behind schedule';
        statusClass = 'negative';
      }
      
      tooltip.html(`
        <strong>Cost Performance Index (CPI):</strong> ${formatValue(cpi)}<br/>
        <strong>Schedule Performance Index (SPI):</strong> ${formatValue(spi)}<br/>
        <strong>Status:</strong> <span class="${statusClass}">${statusText}</span><br/>
        <strong>EV:</strong> $${earnedValue.toFixed(0)} | <strong>AC:</strong> $${actualCost.toFixed(0)} | <strong>PV:</strong> $${plannedValue.toFixed(0)}
      `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => {
      // Restore point size
      point.attr('r', 8);
      
      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    });
    
    // Add chart title
    svg.append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .text('Performance Indices Quadrant Chart');
    
    // Add CPI=1, SPI=1 labels
    svg.append('text')
      .attr('class', 'reference-label')
      .attr('x', x(1) + 5)
      .attr('y', 15)
      .text('CPI = 1');
      
    svg.append('text')
      .attr('class', 'reference-label')
      .attr('x', 5)
      .attr('y', y(1) - 5)
      .text('SPI = 1');
    
  }, [earnedValue, actualCost, plannedValue, cpi, spi, hasData]);
  
  return (
    <div className="performance-indices-chart">
      <div className="metrics-summary">
        <div className="metric">
          <span className="metric-label">CPI:</span>
          <span className={`metric-value ${cpi >= 1 ? 'positive' : 'negative'}`}>
            {formatValue(cpi)}
          </span>
          <span className="metric-desc">
            {cpi >= 1 ? 'Under Budget' : 'Over Budget'}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">SPI:</span>
          <span className={`metric-value ${spi >= 1 ? 'positive' : 'negative'}`}>
            {formatValue(spi)}
          </span>
          <span className="metric-desc">
            {spi >= 1 ? 'Ahead of Schedule' : 'Behind Schedule'}
          </span>
        </div>
        <div className="calculation-note">Performance Indices compare work completed value to cost (CPI = EV/AC) and schedule (SPI = EV/PV)</div>
      </div>
      <div ref={chartRef} className="chart-container"></div>
    </div>
  );
};

export default PerformanceIndicesChart; 