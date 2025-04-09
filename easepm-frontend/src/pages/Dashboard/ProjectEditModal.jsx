// src/pages/Dashboard/ProjectEditModal.jsx
import React, { useState } from "react";
import * as projectsApi from "../../api/projects";
import "./ProjectEditModal.css";

const ProjectEditModal = ({ project, onClose, onProjectUpdated }) => {
  const [form, setForm] = useState({
    name: project.name || "",
    status: project.status || "Not Started",
    start_date: project.start_date || "",
    end_date: project.end_date || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use the projectsApi updateProject method instead of direct axios call
      await projectsApi.updateProject(project._id, form);
      onProjectUpdated(); // Refresh parent data
      onClose(); // Close modal
    } catch (err) {
      setError("Failed to update project. Please try again.");
      console.error("Error updating project:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Edit Project</h2>
        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSave}>
          <label>Project Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <label>Start Date</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            required
          />

          <label>End Date</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            required
          />

          <div className="button-row">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectEditModal;
