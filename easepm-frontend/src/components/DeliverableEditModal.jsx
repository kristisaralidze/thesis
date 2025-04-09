// src/pages/Dashboard/DeliverableEditModal.jsx
import React, { useState } from "react";
import * as projectsApi from "../api/projects";
import "./DeliverableEditModal.css"; // or use DeliverableModal.css

const DeliverableEditModal = ({ projectId, deliverable, onClose, onDeliverableUpdated }) => {
  const [form, setForm] = useState({
    name: deliverable.name,
    status: deliverable.status,
    end_date: deliverable.end_date || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage("Updating deliverable...");

    try {
      console.log(`🔄 Updating deliverable ${deliverable._id} for project ${projectId}...`);
      
      // Use the projectsApi method to update a deliverable
      const result = await projectsApi.updateDeliverable(
        projectId,
        deliverable._id,
        {
          name: form.name,
          status: form.status,
          end_date: form.end_date,
        }
      );
      
      console.log(`✅ Deliverable updated successfully:`, result);
      setStatusMessage("Deliverable updated successfully!");
      
      // Brief delay to show success message
      setTimeout(() => {
        onDeliverableUpdated(); // e.g. refreshProject in parent
        onClose();             // close the modal
      }, 600);
    } catch (err) {
      console.error("❌ Error updating deliverable:", err);
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        // Handle timeout specifically
        setError("Operation timed out. The deliverable might still be updated in the background. Please check the project after closing this dialog.");
      } else if (err.code === 'ERR_NETWORK') {
        setError("Network connection issue. Please check your internet connection and try again.");
      } else {
        setError("Failed to update deliverable: " + (err.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Edit Deliverable</h2>
        {error && <p className="error-text">{error}</p>}
        {statusMessage && !error && <p className="status-text">{statusMessage}</p>}

        <form onSubmit={handleSave}>
          <label>Name</label>
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
                  Saving...
                </>
              ) : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliverableEditModal;
