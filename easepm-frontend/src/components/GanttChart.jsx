import React from "react";
import "./GanttChart.css";

const GanttChart = ({ phases, projectDurationInWeeks, className = "" }) => {
  const weeks = Array.from({ length: projectDurationInWeeks }, (_, i) => i + 1);

  return (
    <div>
      {/* Header for Gantt Chart */}
      <div style={{
        padding: '10px',
        marginBottom: '5px',
        borderLeft: '4px solid #3ecbf5',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{ color: '#3ecbf5', fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
          Project Phase Timeline (Gantt View)
        </h3>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          Visualizes project phases across weeks, showing when each phase starts and ends. Blue bars indicate active phase periods.
        </p>
      </div>
      <div className={`gantt-table-wrapper ${className}`}>
        <table className="gantt-table">
          <thead>
            <tr>
              <th className="task-header">Phase</th>
              {weeks.map((week) => (
                <th key={week} className="week-header">
                  W{week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {phases.map((phase, idx) => (
              <tr key={idx}>
                <td className="task-name">{phase.name}</td>
                {weeks.map((week) => {
                  const inRange = week >= phase.startWeek && week <= phase.endWeek;
                  return (
                    <td
                      key={week}
                      className="week-cell"
                      style={{
                        backgroundColor: inRange ? phase.color || "#3ecbf5" : "#fff",
                      }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GanttChart;
