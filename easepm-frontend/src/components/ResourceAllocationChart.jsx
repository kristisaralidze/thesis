import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js';
import React, { useEffect } from "react";
import { Bar } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ResourceAllocationChart = ({ resources, phases }) => {
  const resourceNames = resources.map((resource) => resource.name);
  const phaseNames = phases.map((phase) => phase.name);

  // Generate data based on resource allocations and phases
  const data = resources.map((resource) => {
    return phases.map((phase, idx) => {
      // Ensure that estimatedHours is defined and that we don't try to access undefined values
      if (!resource.estimatedHours || !resource.estimatedHours[idx]) {
        // Default to 0 if estimatedHours or the specific value for that phase is undefined
        return 0;
      }
      return resource.estimatedHours[idx]; // Return hours based on input, no scaling here
    });
  });

  const chartData = {
    labels: phaseNames,
    datasets: resources.map((resource, idx) => {
      const color = idx % 2 === 0 ? `rgba(245, 166, 35, 0.6)` : `rgba(62, 203, 245, 0.6)`; // Lightened version with opacity 0.6

      return {
        label: `${resource.name} (${resource.role || 'No role'})`, // Display both name and role in the label
        data: data[idx],
        backgroundColor: color,
        borderColor: color.replace('0.6', '1'),
        borderWidth: 1,
        hoverBackgroundColor: color.replace('0.6', '0.9'),
      };
    }),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 40, // Set the maximum value for the Y-axis to 40 hours
        min: 0,  // Set the minimum value to 0
        title: {
          display: true,
          text: 'Hours per Week'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Project Phases'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Resource Allocation by Phase'
      }
    }
  };

  useEffect(() => {
    // Cleanup function
    return () => {
      // Destroy all chart instances
      ChartJS.instances = {};
    };
  }, []);

  return (
    <div>
      {/* Header for Resource Allocation Chart */}
      <div style={{
        padding: '10px',
        marginBottom: '5px',
        borderLeft: '4px solid #3ecbf5',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{ color: '#3ecbf5', fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
          Resource Allocation Overview
        </h3>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          Displays weekly hour allocation for each team member across project phases. Orange and blue bars represent different resources, with a maximum of 40 hours per week.
        </p>
      </div>
      <div style={{ height: '400px', width: '100%' }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default ResourceAllocationChart;
