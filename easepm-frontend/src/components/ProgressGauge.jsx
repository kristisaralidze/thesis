/**
 * ProgressGauge Component
 * 
 * Purpose:
 * - Visualizes project completion progress using an interactive liquid fill gauge
 * - Provides immediate visual feedback on project timeline adherence
 * - Helps project managers quickly assess project status
 * 
 * Features:
 * - Animated liquid fill effect showing completion percentage
 * - Color-coded status indicators using consistent brand colors:
 *   - Primary Blue (#3ecbf5) for on-track status
 *   - Primary Orange (#f5a623) for attention needed
 * - Gradient animations for engaging user experience
 * - Responsive design that adapts to container size
 * - Interactive tooltips with detailed progress information
 * 
 * Data Visualization:
 * - Primary Metric: Project completion percentage (0-100%)
 * - Secondary Metrics:
 *   - Planned vs Actual timeline comparison
 *   - Schedule variance indicator
 *   - Time elapsed vs total duration
 * 
 * Props:
 * @param {number} percentComplete - Current project completion percentage (0-100)
 * @param {number} plannedProgress - Expected completion percentage at current date
 * @param {Date} startDate - Project start date
 * @param {Date} endDate - Project end date
 * @param {string} [theme='default'] - Color theme for the gauge
 */

import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';
import './ProgressGauge.css';

const ProgressGauge = ({ 
  percentComplete = 0,
  plannedProgress = 0,
  startDate = new Date(),
  endDate = new Date(),
  theme = 'default'
}) => {
  const gaugeRef = useRef(null);
  const tooltipRef = useRef(null);

  // Calculate timeline metrics
  const today = new Date();
  const totalDuration = endDate - startDate;
  const elapsed = today - startDate;
  const timeProgress = Math.min(100, (elapsed / totalDuration) * 100);

  // Determine project status
  const getStatus = () => {
    const variance = percentComplete - plannedProgress;
    if (variance >= 5) return 'ahead';
    if (variance <= -5) return 'behind';
    return 'on-track';
  };

  // Color configurations using only brand colors
  const themeColors = {
    default: {
      ahead: '#3ecbf5', // Primary Blue
      'on-track': '#3ecbf5', // Primary Blue
      behind: '#f5a623', // Primary Orange
      background: '#f0f0f0',
      text: '#333333'
    }
  };

  // Get color with opacity
  const getColorWithOpacity = (color, opacity) => {
    return color === '#3ecbf5' 
      ? `rgba(62, 203, 245, ${opacity})`
      : `rgba(245, 166, 35, ${opacity})`;
  };

  useEffect(() => {
    if (!gaugeRef.current) return;

    // Clear previous content
    d3.select(gaugeRef.current).selectAll('*').remove();

    // Set up dimensions
    const width = gaugeRef.current.clientWidth;
    const height = gaugeRef.current.clientHeight;
    const radius = Math.min(width, height) / 2;

    // Create SVG container
    const svg = d3.select(gaugeRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Create gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'gaugeGradient')
      .attr('gradientTransform', 'rotate(90)');

    const statusColor = themeColors[theme][getStatus()];
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', statusColor);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', getColorWithOpacity(statusColor, 0.6));

    // Create gauge background
    svg.append('path')
      .attr('class', 'gauge-background')
      .attr('d', d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.8)
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI / 2))
      .attr('fill', themeColors[theme].background);

    // Create liquid fill
    const wave = svg.append('path')
      .attr('class', 'gauge-fill')
      .attr('fill', 'url(#gaugeGradient)');

    // Animation function for liquid effect
    function updateWave() {
      const fillPercentage = percentComplete / 100;
      const angularRange = Math.PI;
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (angularRange * fillPercentage);

      wave.transition()
        .duration(750)
        .attrTween('d', () => {
          return (t) => {
            const currentAngle = startAngle + (endAngle - startAngle) * t;
            return d3.arc()
              .innerRadius(radius * 0.6)
              .outerRadius(radius * 0.8)
              .startAngle(startAngle)
              .endAngle(currentAngle)();
          };
        });
    }

    // Add percentage text
    svg.append('text')
      .attr('class', 'gauge-text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .text(`${Math.round(percentComplete)}%`)
      .style('font-size', `${radius * 0.3}px`)
      .style('fill', themeColors[theme].text);

    // Add status indicator
    svg.append('text')
      .attr('class', 'gauge-status')
      .attr('text-anchor', 'middle')
      .attr('dy', `${radius * 0.4}px`)
      .text(getStatus().replace('-', ' ').toUpperCase())
      .style('font-size', `${radius * 0.15}px`)
      .style('fill', statusColor);

    // Initialize wave animation
    updateWave();

    // Setup tooltip interactions
    const tooltip = d3.select(tooltipRef.current);

    svg.on('mousemove', (event) => {
      tooltip
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 10}px`)
        .style('opacity', 1)
        .style('background-color', getColorWithOpacity(statusColor, 0.1))
        .style('border', `1px solid ${statusColor}`);
    }).on('mouseleave', () => {
      tooltip.style('opacity', 0);
    });

  }, [percentComplete, plannedProgress, theme]);

  return (
    <div className="progress-gauge-container">
      <div ref={gaugeRef} className="gauge"></div>
      <div ref={tooltipRef} className="gauge-tooltip">
        <div className="tooltip-content">
          <div>Completion: {Math.round(percentComplete)}%</div>
          <div>Planned: {Math.round(plannedProgress)}%</div>
          <div>Time Elapsed: {Math.round(timeProgress)}%</div>
          <div>Status: {getStatus().replace('-', ' ')}</div>
        </div>
      </div>
    </div>
  );
};

export default ProgressGauge; 