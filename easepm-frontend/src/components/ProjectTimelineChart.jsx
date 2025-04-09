import React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const ProjectTimelineChart = ({ phases, projectDurationInWeeks }) => {
  // Ensure projectDurationInWeeks is a number and has a fallback
  const duration = Number(projectDurationInWeeks) || 6;

  // Prepare data focusing only on phase names and durations
  const chartData = phases.map(phase => {
    const start = parseInt(phase.startWeek) || 0;
    const end = parseInt(phase.endWeek) || 0;
    return {
      name: phase.name,
      duration: start && end ? end - start + 1 : 0
    };
  });

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ color: '#f5a623', margin: '0 0 5px 0' }}><strong>{data.name}</strong></p>
          <p style={{ margin: '0' }}>Duration: {data.duration || 0} weeks</p>
        </div>
      );
    }
    return null;
  };

  // Calculate minimum height based on number of phases
  const minimumHeight = Math.max(250, phases.length * 35 + 80);

  return (
    <div>
      {/* Header for Timeline Chart */}
      <div style={{
        padding: '10px',
        marginBottom: '5px',
        borderLeft: '4px solid #f5a623',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{ color: '#f5a623', fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
          Project Phase Duration Overview
        </h3>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          Shows the duration of each project phase in weeks. Hover over bars for detailed information.
        </p>
      </div>
      <div style={{ width: '100%', minHeight: `${minimumHeight}px`, height: '100%' }}>
        <ResponsiveContainer width="100%" height={minimumHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 15, right: 30, left: 100, bottom: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, duration]}
              ticks={[...Array(duration + 1)].map((_, i) => i)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#666' }}
              interval={0}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="duration"
              fill="#f5a623"
              background={{ fill: '#eee' }}
              radius={[4, 4, 4, 4]}
              name="Duration (weeks)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectTimelineChart; 