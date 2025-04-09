import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- Make sure this is imported
import { createProject } from "../../api/projects";
import "./NewProjectModal.css"; // <--- Import our custom CSS here

const NewProjectModal = ({ onClose, onProjectAdded }) => {
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    status: "Not Started", // default
  });
  // const [form, setForm] = useState({ name: "", start_date: "", end_date: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createProject(form);
      onProjectAdded(); // Refresh dashboard
      setForm({ name: "", start_date: "", end_date: "" });
      navigate("/dashboard");
      onClose(); // Close modal
    } catch (err) {
      setError("Failed to create project. Please try again.");
      console.error("Error creating project:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="modal-title">Add New Project</h2>

        {error && <p className="modal-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Project Name"
            value={form.name}
            onChange={handleChange}
            required
            className="modal-input"
          />

          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            required
            className="modal-input"
          />

          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            required
            className="modal-input"
          />

          {/* New Status field (optional) */}
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="modal-input"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <div className="modal-buttons">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
        {/* <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Project Name"
            value={form.name}
            onChange={handleChange}
            required
            className="modal-input"
          />

          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            required
            className="modal-input"
          />

          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            required
            className="modal-input"
          />

          <div className="modal-buttons">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form> */}
      </div>
    </div>
  );
};

export { NewProjectModal };

