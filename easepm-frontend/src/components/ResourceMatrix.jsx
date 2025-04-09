/**
 * ResourceMatrix Component
 * 
 * Purpose:
 * - Visualizes resource allocation, costs, and utilization in a heat map format
 * - Helps project managers identify over/under-utilized resources
 * - Provides cost variance analysis across team members
 * 
 * Features:
 * - Heat Map:
 *   - Rows: Individual resources
 *   - Columns: Key metrics (Planned Hours, Actual Hours, Planned Cost, Actual Cost, Cost Variance, Utilization)
 *   - Color intensity indicates value magnitude
 *   - Interactive tooltips with detailed information
 * 
 * Props:
 * @param {Object[]} resources - Array of resource objects with name, role, plannedHours, actualHours, costRate
 */

import * as d3 from 'd3';
import React, { useEffect, useRef, useState } from 'react';
import './ResourceMatrix.css';

const ResourceMatrix = ({ resources = [] }) => {
  const matrixRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [filterRole, setFilterRole] = useState('');
  const [allRoles, setAllRoles] = useState([]);

  // Calculate derived metrics for each resource
  const prepareMatrixData = () => {
    const data = resources.map(resource => {
      const plannedCost = resource.plannedHours * resource.costRate;
      const actualCost = resource.actualHours * resource.costRate;
      const costVariance = actualCost - plannedCost;
      const utilization = resource.plannedHours > 0 ? resource.actualHours / resource.plannedHours : 0;

      return {
        ...resource,
        plannedCost,
        actualCost,
        costVariance,
        utilization
      };
    });

    // Extract all unique roles for the filter dropdown
    const roles = [...new Set(resources.map(r => r.role))].filter(Boolean).sort();
    setAllRoles(roles);

    // Apply role filtering
    let filteredData = data;
    if (filterRole) {
      filteredData = data.filter(d => d.role === filterRole);
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  };

  // Request sort
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
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

  // Format percentage values
  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Draw heat map
  useEffect(() => {
    if (!matrixRef.current) return;

    // Clear previous content
    d3.select(matrixRef.current).selectAll('*').remove();

    if (resources.length === 0) {
      // Add placeholder for empty state
      const placeholder = d3.select(matrixRef.current)
        .append('div')
        .attr('class', 'chart-placeholder')
        .html(`
          <div class="placeholder-content">
            <i class="fas fa-th placeholder-icon"></i>
            <p>Add resources to see utilization metrics</p>
            <p class="placeholder-subtext">The heat map will show resource allocation, costs, and utilization patterns across your team</p>
          </div>
        `);
      return;
    }

    const data = prepareMatrixData();
    const margin = { top: 30, right: 40, bottom: 50, left: 160 };
    const width = matrixRef.current.clientWidth - margin.left - margin.right;
    const height = Math.max(300, data.length * 50) - margin.top - margin.bottom;

    const svg = d3.select(matrixRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define metrics to display
    const metrics = [
      { key: 'plannedHours', label: 'Planned Hours', format: d => d.toFixed(1) },
      { key: 'actualHours', label: 'Actual Hours', format: d => d.toFixed(1) },
      { key: 'plannedCost', label: 'Planned Cost', format: formatCurrency },
      { key: 'actualCost', label: 'Actual Cost', format: formatCurrency },
      { key: 'costVariance', label: 'Cost Variance', format: formatCurrency },
      { key: 'utilization', label: 'Utilization', format: d => formatPercentage(d) }
    ];

    // Set up scales
    const x = d3.scaleBand()
      .domain(metrics.map(d => d.key))
      .range([0, width])
      .padding(0.05);

    const y = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, height])
      .padding(0.05);

    // Create a scale for each metric
    const colorScales = {};
    const primaryColor = '#3ecbf5';  // Blue
    const secondaryColor = '#f5a623'; // Orange

    // Group related metrics with the same color but different intensities
    metrics.forEach((metric, i) => {
      const values = data.map(d => d[metric.key]);
      
      // Hours columns (orange)
      if (metric.key === 'plannedHours' || metric.key === 'actualHours') {
        const allHoursValues = data.flatMap(d => [d.plannedHours, d.actualHours]);
        const minHours = d3.min(allHoursValues);
        const maxHours = d3.max(allHoursValues);
        
        colorScales[metric.key] = d3.scaleLinear()
          .domain([minHours, maxHours])
          .range(['rgba(245, 166, 35, 0.2)', 'rgba(245, 166, 35, 1)'])
          .clamp(true);
      } 
      // Cost columns (blue)
      else if (metric.key === 'plannedCost' || metric.key === 'actualCost') {
        const allCostValues = data.flatMap(d => [d.plannedCost, d.actualCost]);
        const minCost = d3.min(allCostValues);
        const maxCost = d3.max(allCostValues);
        
        colorScales[metric.key] = d3.scaleLinear()
          .domain([minCost, maxCost])
          .range(['rgba(62, 203, 245, 0.2)', 'rgba(62, 203, 245, 1)'])
          .clamp(true);
      }
      // Cost variance (diverging scale)
      else if (metric.key === 'costVariance') {
        const max = Math.max(Math.abs(d3.min(values)), Math.abs(d3.max(values)));
        colorScales[metric.key] = d3.scaleLinear()
          .domain([-max, 0, max])
          .range([primaryColor, '#ffffff', secondaryColor])
          .clamp(true);
      } 
      // Utilization (orange to make it stand out)
      else if (metric.key === 'utilization') {
        colorScales[metric.key] = d3.scaleLinear()
          .domain([0, 0.8, 1, Math.max(1.2, d3.max(values))])
          .range([
            'rgba(245, 166, 35, 0.2)', // under-utilized
            'rgba(245, 166, 35, 0.6)', // well-utilized (low)
            'rgba(245, 166, 35, 0.8)', // well-utilized (target)
            'rgba(245, 166, 35, 1)'    // over-utilized
          ])
          .clamp(true);
      }
    });

    // Add tooltip
    const tooltip = d3.select(matrixRef.current)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0);

    // Add column headers with sorting indicators
    const headers = svg.append('g')
      .selectAll('g')
      .data(metrics)
      .enter()
      .append('g')
      .attr('class', 'column-header')
      .attr('transform', d => `translate(${x(d.key) + x.bandwidth() / 2}, -10)`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        requestSort(d.key);
      });
      
    headers.append('text')
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(d => d.label)
      .style('fill', '#333');
      
    headers.append('text')
      .attr('class', 'sort-indicator')
      .attr('text-anchor', 'middle')
      .attr('dy', '-1em')
      .style('font-size', '10px')
      .style('fill', d => sortConfig.key === d.key ? '#333' : '#ccc')
      .text(d => {
        if (sortConfig.key !== d.key) return '⇅';
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
      });

    // Add row labels
    svg.append('g')
      .selectAll('text')
      .data(data)
      .enter()
      .append('text')
      .attr('x', -10)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(d => d.name)
      .style('fill', '#333')
      .append('tspan')
      .attr('x', -10)
      .attr('dy', '1.2em')
      .style('font-size', '10px')
      .style('font-weight', 'normal')
      .style('fill', '#666')
      .text(d => d.role);

    // Create cells
    const cells = svg.selectAll()
      .data(data.flatMap(resource => 
        metrics.map(metric => ({
          resource,
          metric,
          value: resource[metric.key]
        }))
      ))
      .enter()
      .append('g');

    cells.append('rect')
      .attr('x', d => x(d.metric.key))
      .attr('y', d => y(d.resource.name))
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .style('fill', d => {
        if (isNaN(d.value)) return '#ffffff';
        return colorScales[d.metric.key](d.value);
      })
      .style('stroke', 'white')
      .style('stroke-width', 2)
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).style('stroke', '#333');
        
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
          
        tooltip.html(`
          <strong>${d.resource.name}</strong> (${d.resource.role})<br/>
          <strong>${d.metric.label}:</strong> ${d.metric.format(d.value)}
          ${d.metric.key === 'costVariance' ? 
            `<br/><span class="${d.value > 0 ? 'negative' : 'positive'}">${d.value > 0 ? 'Over budget' : 'Under budget'}</span>` : 
            ''}
          ${d.metric.key === 'utilization' ? 
            `<br/><span class="${d.value > 1 ? 'negative' : d.value < 0.8 ? 'positive' : 'neutral'}">${d.value > 1 ? 'Over-utilized' : d.value < 0.8 ? 'Under-utilized' : 'Well-utilized'}</span>` : 
            ''}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).style('stroke', 'white');
        
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add cell values
    cells.append('text')
      .attr('x', d => x(d.metric.key) + x.bandwidth() / 2)
      .attr('y', d => y(d.resource.name) + y.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .style('font-size', '11px')
      .style('fill', d => {
        // Ensure text is readable on various background colors
        if (d.metric.key === 'costVariance') {
          return d.value === 0 ? '#333' : 
                 Math.abs(d.value) > (d3.max(data, r => Math.abs(r.costVariance)) * 0.5) ? 'white' : '#333';
        }
        
        // For hours and costs, check intensity
        if (['plannedHours', 'actualHours', 'plannedCost', 'actualCost'].includes(d.metric.key)) {
          const maxValue = d3.max(data, r => r[d.metric.key]);
          return d.value > (maxValue * 0.7) ? 'white' : '#333';
        }
        
        // For utilization, dark text below 100%, white text above
        if (d.metric.key === 'utilization') {
          return d.value > 1 ? 'white' : '#333';
        }
        
        return '#333';
      })
      .text(d => {
        // Abbreviate long values
        const value = d.metric.format(d.value);
        if (d.metric.key === 'plannedCost' || d.metric.key === 'actualCost') {
          return value.replace(/,000$/, 'k');
        }
        return value;
      });

  }, [resources, sortConfig, filterRole]);

  return (
    <div className="resource-matrix">
      <div className="matrix-controls">
        <div className="filter-control">
          <label htmlFor="roleFilter">Filter by Role:</label>
          <select 
            id="roleFilter" 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            {allRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div className="sorting-info">
          {sortConfig.key && (
            <span>
              Sorted by {sortConfig.key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
              ({sortConfig.direction})
              <button onClick={() => setSortConfig({ key: null, direction: 'ascending' })}>
                Clear
              </button>
            </span>
          )}
        </div>
      </div>
      <div ref={matrixRef} className="matrix-container"></div>
    </div>
  );
};

export default ResourceMatrix; 