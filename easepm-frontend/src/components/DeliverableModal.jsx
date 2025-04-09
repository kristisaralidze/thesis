// src/pages/Dashboard/DeliverableModal.jsx
import React, { useState } from "react";
import * as projectsApi from "../api/projects";
import "./DeliverableModal.css";

const DeliverableModal = ({ projectId, onClose, onDeliverableAdded }) => {
  const [form, setForm] = useState({
    name: "",
    status: "Not Started",
    end_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddDeliverable = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage("Creating deliverable...");

    try {
      // Create a deliverable object
      const newDeliverable = {
        name: form.name,
        status: form.status,
        end_date: form.end_date,
      };

      console.log(`🔄 Creating new deliverable for project ${projectId}...`, newDeliverable);

      // Use the projectsApi method to create a deliverable
      const result = await projectsApi.createDeliverable(projectId, newDeliverable);
      
      console.log(`✅ Deliverable created successfully:`, result);
      setStatusMessage("Deliverable created successfully!");
      
      // Brief delay to show success message
      setTimeout(() => {
        onDeliverableAdded(); // refresh the project in the parent
        onClose(); // close the modal
      }, 600);
      
    } catch (err) {
      console.error("❌ Error adding deliverable:", err);
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        // Handle timeout specifically
        setError("Operation timed out. The deliverable might still be created in the background. Please check the project list after closing this dialog.");
      } else if (err.code === 'ERR_NETWORK') {
        setError("Network connection issue. Please check your internet connection and try again.");
      } else {
        setError("Failed to add deliverable: " + (err.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Add Deliverable</h2>
        {error && <p className="error-text">{error}</p>}
        {statusMessage && !error && <p className="status-text">{statusMessage}</p>}

        <form onSubmit={handleAddDeliverable}>
          <label>Deliverable Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            disabled={loading}
          />

          <label>Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <label>Due Date</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            disabled={loading}
          />

          <div className="button-row">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Adding...
                </>
              ) : "Add Deliverable"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliverableModal;
// src/pages/Dashboard/DeliverableModal.css