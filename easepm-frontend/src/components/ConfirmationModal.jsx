import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}
      >
        <h3 style={{ 
          margin: '0 0 16px 0',
          color: '#f5a623',
          fontSize: '1.2rem',
          fontWeight: 'bold'
        }}>
          {title}
        </h3>
        <p style={{ 
          margin: '0 0 24px 0',
          color: '#333',
          fontSize: '1rem'
        }}>
          {message}
        </p>
        <div style={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #f5a623',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#f5a623',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#fff8ef'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#3ecbf5',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1ebce6'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3ecbf5'}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 