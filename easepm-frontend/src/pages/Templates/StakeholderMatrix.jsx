import React, { useRef } from 'react';
import './StakeholderMatrix.css';

const StakeholderMatrix = ({ stakeholders }) => {
  const containerRef = useRef(null);
  const CONTAINER_SIZE = 500; // Fixed size for the matrix
  const CELL_SIZE = CONTAINER_SIZE / 5;
  const ICON_SIZE = 20;

  // Calculate stakeholder position
  const calculatePosition = (interest, influence) => {
    if (!interest || !influence) return null;
    
    // Calculate centered positions within cells
    const x = (Number(interest) - 0.5) * CELL_SIZE - (ICON_SIZE / 2);
    const y = (5 - Number(influence) + 0.5) * CELL_SIZE - (ICON_SIZE / 2);
    
    return { x, y };
  };

  // Get quadrant label based on position
  const getQuadrantLabel = (influence, interest) => {
    const highInfluence = Number(influence) >= 3;
    const highInterest = Number(interest) >= 3;

    if (highInfluence && highInterest) return "Manage Closely";
    if (highInfluence && !highInterest) return "Keep Satisfied";
    if (!highInfluence && highInterest) return "Keep Informed";
    return "Monitor";
  };

  // Get stakeholder initials
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="stakeholder-matrix-container">
      {/* Matrix Title */}
      <h3 className="matrix-title">Stakeholder Influence-Interest Matrix</h3>
      
      {/* Matrix Container */}
      <div className="matrix-wrapper">
        {/* Y-Axis Label */}
        <div className="y-axis-label">Influence</div>
        
        {/* Matrix Grid */}
        <div 
          className="matrix-grid" 
          ref={containerRef}
          style={{ 
            width: CONTAINER_SIZE, 
            height: CONTAINER_SIZE 
          }}
        >
          {/* Quadrant Labels */}
          <div className="quadrant-labels">
            <div className="quadrant-label top-left">Keep Satisfied</div>
            <div className="quadrant-label top-right">Manage Closely</div>
            <div className="quadrant-label bottom-left">Monitor</div>
            <div className="quadrant-label bottom-right">Keep Informed</div>
          </div>

          {/* Grid Lines */}
          <div className="grid-lines">
            {[...Array(6)].map((_, i) => (
              <React.Fragment key={i}>
                <div 
                  className="grid-line horizontal" 
                  style={{ top: `${i * 20}%` }} 
                />
                <div 
                  className="grid-line vertical" 
                  style={{ left: `${i * 20}%` }} 
                />
              </React.Fragment>
            ))}
          </div>

          {/* Axis Values */}
          <div className="axis-values">
            {/* X-Axis Values */}
            {[1, 2, 3, 4, 5].map(value => (
              <div 
                key={`x-${value}`}
                className="x-axis-value"
                style={{ left: `${(value - 0.5) * 20}%` }}
              >
                {value}
              </div>
            ))}
            {/* Y-Axis Values */}
            {[1, 2, 3, 4, 5].map(value => (
              <div 
                key={`y-${value}`}
                className="y-axis-value"
                style={{ top: `${(5 - value + 0.5) * 20}%` }}
              >
                {value}
              </div>
            ))}
          </div>

          {/* Stakeholder Icons */}
          {stakeholders.map((stakeholder, index) => {
            const position = calculatePosition(stakeholder.interest, stakeholder.influence);
            if (!position) return null;

            return (
              <div
                key={index}
                className="stakeholder-icon"
                style={{
                  left: position.x,
                  top: position.y,
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                }}
                title={`${stakeholder.name}\nInfluence: ${stakeholder.influence}\nInterest: ${stakeholder.interest}`}
              >
                {getInitials(stakeholder.name)}
                <div className="stakeholder-tooltip">
                  <div className="tooltip-name">{stakeholder.name}</div>
                  <div className="tooltip-details">
                    <div>Role: {stakeholder.role}</div>
                    <div>Organization: {stakeholder.organization}</div>
                    <div>Influence: {stakeholder.influence}</div>
                    <div>Interest: {stakeholder.interest}</div>
                    <div className="tooltip-quadrant">
                      {getQuadrantLabel(stakeholder.influence, stakeholder.interest)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis Label */}
        <div className="x-axis-label">Interest</div>
      </div>
    </div>
  );
};

export default StakeholderMatrix; 