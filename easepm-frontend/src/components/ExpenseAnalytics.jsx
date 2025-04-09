/**
 * ExpenseAnalytics Component
 * 
 * Purpose:
 * - Visualizes expense distribution and comparisons
 * - Helps project managers understand spending patterns
 * - Enables quick identification of budget variances
 * 
 * Features:
 * - Pie Chart:
 *   - Shows expense distribution by category
 *   - Interactive tooltips with category details
 *   - Animated transitions on data updates
 * 
 * - Stacked Bar Chart:
 *   - Compares planned vs actual expenses
 *   - Category-wise comparison
 *   - Visual indication of variances
 * 
 * Props:
 * @param {Object[]} expenses - Array of expense objects
 */

import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';
import './ExpenseAnalytics.css';

const ExpenseAnalytics = ({ expenses = [] }) => {
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);

  // Process data for pie chart
  const preparePieData = () => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category.split(' - ')[0];
      acc[category] = (acc[category] || 0) + expense.actualAmount;
      return acc;
    }, {});

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      value: total
    }));
  };

  // Process data for stacked bar chart
  const prepareBarData = () => {
    const categoryData = expenses.reduce((acc, expense) => {
      const category = expense.category.split(' - ')[0];
      if (!acc[category]) {
        acc[category] = {
          category,
          planned: 0,
          actual: 0
        };
      }
      acc[category].planned += expense.expectedAmount;
      acc[category].actual += expense.actualAmount;
      return acc;
    }, {});

    return Object.values(categoryData);
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

  // Format percentage
  const formatPercentage = (value, total) => {
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Draw pie chart
  useEffect(() => {
    if (!pieChartRef.current) return;

    // Clear previous content
    d3.select(pieChartRef.current).selectAll('*').remove();

    if (expenses.length === 0) {
      // Add placeholder for empty state
      const placeholder = d3.select(pieChartRef.current)
        .append('div')
        .attr('class', 'chart-placeholder')
        .html(`
          <div class="placeholder-content">
            <i class="fas fa-chart-pie placeholder-icon"></i>
            <p>Add expenses to see their distribution</p>
            <p class="placeholder-subtext">The pie chart will show the percentage breakdown of your actual expenses by category</p>
          </div>
        `);
      return;
    }

    const width = pieChartRef.current.clientWidth;
    const height = pieChartRef.current.clientHeight;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(pieChartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pieData = preparePieData();
    const total = d3.sum(pieData, d => d.value);
    
    // Use only two colors alternating
    const colors = ['#3ecbf5', '#f5a623'];
    const color = d3.scaleOrdinal()
      .domain(pieData.map(d => d.category))
      .range(pieData.map((_, i) => colors[i % 2]));

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(radius * 0.3)
      .outerRadius(radius * 0.8);

    const tooltip = d3.select(pieChartRef.current)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0);

    const arcs = svg.selectAll('path')
      .data(pie(pieData))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.category))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('transition', 'opacity 0.3s')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).style('opacity', 0.8);
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        tooltip.html(`
          <strong>${d.data.category}</strong><br/>
          Amount: ${formatCurrency(d.data.value)}<br/>
          Percentage: ${formatPercentage(d.data.value, total)}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).style('opacity', 1);
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });

    // Add labels with connecting lines
    const labelArc = d3.arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);

    const lines = arcs.append('polyline')
      .attr('stroke', 'gray')
      .attr('fill', 'none')
      .attr('stroke-width', 1)
      .attr('points', d => {
        const pos = labelArc.centroid(d);
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        const x = Math.sin(midAngle) * (radius * 0.95);
        const y = -Math.cos(midAngle) * (radius * 0.95);
        const x2 = Math.sin(midAngle) * (radius * 1.15);
        const y2 = -Math.cos(midAngle) * (radius * 1.15);
        return [arc.centroid(d), pos, [x2, y2]];
      });

    const labels = arcs.append('text')
      .attr('transform', d => {
        const pos = labelArc.centroid(d);
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        const x = Math.sin(midAngle) * (radius * 1.2);
        const y = -Math.cos(midAngle) * (radius * 1.2);
        return `translate(${x},${y})`;
      })
      .attr('dy', '0.35em')
      .style('text-anchor', d => {
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midAngle < Math.PI ? 'start' : 'end';
      })
      .style('font-size', '12px')
      .style('fill', '#333')
      .each(function(d) {
        const text = d3.select(this);
        const lines = [
          d.data.category,
          formatPercentage(d.data.value, total)
        ];
        
        text.selectAll('tspan')
          .data(lines)
          .enter()
          .append('tspan')
          .attr('x', 0)
          .attr('dy', (_, i) => i === 0 ? 0 : '1.2em')
          .text(d => d);
      });

  }, [expenses]);

  // Draw bar chart
  useEffect(() => {
    if (!barChartRef.current) return;

    // Clear previous content
    d3.select(barChartRef.current).selectAll('*').remove();

    if (expenses.length === 0) {
      // Add placeholder for empty state
      const placeholder = d3.select(barChartRef.current)
        .append('div')
        .attr('class', 'chart-placeholder')
        .html(`
          <div class="placeholder-content">
            <i class="fas fa-chart-bar placeholder-icon"></i>
            <p>Add expenses to compare planned vs actual</p>
            <p class="placeholder-subtext">The bar chart will show planned and actual expenses side by side for each category</p>
          </div>
        `);
      return;
    }

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = barChartRef.current.clientWidth - margin.left - margin.right;
    const height = barChartRef.current.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(barChartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const barData = prepareBarData();

    const x = d3.scaleBand()
      .domain(barData.map(d => d.category))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(barData, d => Math.max(d.planned, d.actual))])
      .range([height, 0]);

    const tooltip = d3.select(barChartRef.current)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0);

    const drawBars = (data, type, color) => {
      const total = d3.sum(data, d => d[type]);
      
      svg.selectAll(`.bar-${type}`)
        .data(data)
        .enter()
        .append('rect')
        .attr('class', `bar-${type}`)
        .attr('x', d => x(d.category) + (type === 'actual' ? x.bandwidth() / 2 : 0))
        .attr('y', d => y(d[type]))
        .attr('width', x.bandwidth() / 2)
        .attr('height', d => height - y(d[type]))
        .attr('fill', color)
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget).style('opacity', 0.8);
          tooltip.transition()
            .duration(200)
            .style('opacity', 0.9);
          tooltip.html(`
            <strong>${d.category}</strong><br/>
            ${type.charAt(0).toUpperCase() + type.slice(1)}: ${formatCurrency(d[type])}<br/>
            Percentage of Total: ${formatPercentage(d[type], total)}
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget).style('opacity', 1);
          tooltip.transition()
            .duration(500)
            .style('opacity', 0);
        });
    };

    drawBars(barData, 'planned', '#3ecbf5');
    drawBars(barData, 'actual', '#f5a623');

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(d => formatCurrency(d)));

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 100}, 0)`);

    const legendData = [
      { label: 'Planned', color: '#3ecbf5' },
      { label: 'Actual', color: '#f5a623' }
    ];

    legend.selectAll('rect')
      .data(legendData)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d, i) => i * 20)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', d => d.color);

    legend.selectAll('text')
      .data(legendData)
      .enter()
      .append('text')
      .attr('x', 20)
      .attr('y', (d, i) => i * 20 + 10)
      .text(d => d.label)
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle');

  }, [expenses]);

  return (
    <div className="expense-analytics">
      <div className="charts-container">
        <div className="chart-wrapper pie-chart">
          <h3>Expense Distribution</h3>
          <div ref={pieChartRef} className="chart"></div>
        </div>
        <div className="chart-wrapper bar-chart">
          <h3>Planned vs Actual Expenses</h3>
          <div ref={barChartRef} className="chart"></div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseAnalytics; 