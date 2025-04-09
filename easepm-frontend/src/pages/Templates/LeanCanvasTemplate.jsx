// src/pages/LeanCanvasTemplate.jsx
import {
    faMinus,
    faPlus
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import Navbar from "../../components/Navbar";
import "./LeanCanvasTemplate.css";

const LeanCanvasTemplate = () => {
  const navigate = useNavigate();
  const [showCustomize, setShowCustomize] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Common options for dropdown selects
  const channelOptions = [
    "Social Media",
    "Content Marketing",
    "SEO",
    "Email Campaigns",
    "Trade Shows",
    "Direct Sales",
    "Partner Programs",
    "Online Advertising",
    "Mobile App",
    "Website",
  ];
  
  const revenueOptions = [
    "Subscription",
    "Freemium",
    "License Fee",
    "Usage Fee",
    "Asset Sale",
    "Advertising",
    "Commission",
    "Membership",
    "Rental/Leasing",
    "Transaction Fee",
  ];
  
  // State for Lean Canvas sections
  const [problems, setProblems] = useState([""]);
  const [customerSegments, setCustomerSegments] = useState([""]);
  const [uniqueValueProposition, setUniqueValueProposition] = useState("");
  const [solutions, setSolutions] = useState([""]);
  const [channels, setChannels] = useState([{ value: "", isCustom: false, customValue: "" }]);
  const [revenueStreams, setRevenueStreams] = useState([{ value: "", isCustom: false, customValue: "" }]);
  const [costStructure, setCostStructure] = useState([""]);
  const [keyMetrics, setKeyMetrics] = useState([""]);
  const [unfairAdvantage, setUnfairAdvantage] = useState("");

  // Fetch projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, []);
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.fetchProjects();
      
      // Handle different possible response formats
      if (Array.isArray(response)) {
        setProjects(response);
        if (response.length > 0) {
          setSelectedProject(response[0]._id);
        }
      } else if (response && Array.isArray(response.data)) {
        setProjects(response.data);
        if (response.data.length > 0) {
          setSelectedProject(response.data[0]._id);
        }
      } else {
        console.error("Invalid projects response format:", response);
        setErrorMsg("Failed to load projects. Unexpected response format.");
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setErrorMsg("Failed to fetch projects. Please try again.");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Generic handler for adding items to an array
  const handleAddItem = (items, setItems) => {
    setItems([...items, ""]);
  };
  
  // Generic handler for removing items from an array
  const handleRemoveItem = (index, items, setItems) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  
  // Generic handler for updating items in an array
  const handleItemChange = (index, value, items, setItems) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };
  
  // Handlers for special fields (channels and revenue streams) with dropdown options
  const handleSpecialItemChange = (index, field, value, items, setItems) => {
    const newItems = [...items];
    
    if (field === "value") {
      newItems[index].value = value;
      newItems[index].isCustom = value === "custom";
    } else if (field === "customValue") {
      newItems[index].customValue = value;
    }
    
    setItems(newItems);
  };
  
  const handleAddSpecialItem = (items, setItems) => {
    setItems([...items, { value: "", isCustom: false, customValue: "" }]);
  };

  // Handle form submission
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!selectedProject) {
      setErrorMsg("Please select a project to save the Lean Canvas");
      return;
    }
    
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      // Process the data to match the expected format by the backend
      // The backend expects the content to be wrapped in a structure similar to ProjectCharter
      const leanCanvasData = {
        type: "LeanCanvas",
        problem: problems.filter(p => p.trim()),
        customerSegments: customerSegments.filter(s => s.trim()),
        uniqueValueProposition: uniqueValueProposition.trim(),
        solution: solutions.filter(s => s.trim()),
        channels: channels.map(ch => ch.isCustom ? ch.customValue : ch.value).filter(Boolean),
        revenueStreams: revenueStreams.map(rev => rev.isCustom ? rev.customValue : rev.value).filter(Boolean),
        costStructure: costStructure.filter(c => c.trim()),
        keyMetrics: keyMetrics.filter(k => k.trim()),
        unfairAdvantage: unfairAdvantage.trim(),
        version: 1,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      // Use the high-level update function for better error handling
      console.log(`Saving Lean Canvas to project: ${selectedProject}`);
      await projectsApi.updateLeanCanvas(selectedProject, leanCanvasData);
      
      setSuccessMsg("Lean Canvas saved successfully!");
      
      // Redirect to project details after short delay
      setTimeout(() => {
        navigate(`/projects/${selectedProject}`);
      }, 2000);
      
    } catch (err) {
      console.error("Error saving Lean Canvas:", err);
      setErrorMsg(`Failed to save Lean Canvas: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for Cancel button
  const handleCancel = () => {
    navigate("/dashboard");
  };
  
  // Toggle customization view
  const handleCustomize = () => {
    setShowCustomize(true);
  };
  
  // Render initial template view
  if (!showCustomize) {
  return (
      <div className="template-initial-view">
        <Navbar />
        <div className="template-content">
          <h1 className="template-title">Lean Canvas Template</h1>
            <p className="template-description">
            The Lean Canvas is a strategic management template that helps you
            break down your business model into key assumptions. It's a 
            one-page document that outlines the core elements of your product, 
            service, or project. Use it to validate your business idea, 
            identify risks, and prioritize what to build first.
          </p>
          <button className="template-customize-btn" onClick={handleCustomize}>
            Customize Template
            </button>
          </div>
      </div>
    );
  }
  
  // Render customization form
  return (
    <div className="lean-canvas-container">
      <Navbar />
      {/* Header - remove Print Button */}
      <div className="lean-canvas-header">
        <h2>Lean Canvas</h2>
      </div>
      
      {/* Project Selection */}
      <div className="project-select-container">
        <label htmlFor="project-select">Select Project:</label>
        {loading ? (
          <p>Loading projects...</p>
        ) : (
          <select
            id="project-select"
            className="project-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">-- Select a Project --</option>
            {projects.map((project) => (
              <option key={project._id || project.id} value={project._id || project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Error and Success Messages */}
      {errorMsg && <div className="error-text">{errorMsg}</div>}
      {successMsg && <div className="success-text">{successMsg}</div>}
      
      <form onSubmit={handleSave}>
        {/* Lean Canvas Grid Layout */}
        <div className="lean-canvas-grid">
          {/* Problem Block */}
          <div className="canvas-block problem-block">
            <div className="block-header">
              <h3>Problem</h3>
            </div>
            <div className="block-content">
              {problems.map((problem, index) => (
                <div key={`problem-${index}`} className="canvas-item">
                  <input
                    type="text"
                    className="form-input"
                  value={problem}
                    onChange={(e) => handleItemChange(index, e.target.value, problems, setProblems)}
                    placeholder="Enter a problem"
                  />
                  {problems.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveItem(index, problems, setProblems)}
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={() => handleAddItem(problems, setProblems)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Problem
              </button>
            </div>
              </div>

          {/* Customer Segments Block */}
          <div className="canvas-block segments-block">
            <div className="block-header">
              <h3>Customer Segments</h3>
            </div>
            <div className="block-content">
              {customerSegments.map((segment, index) => (
                <div key={`segment-${index}`} className="canvas-item">
                  <input
                    type="text"
                    className="form-input"
                    value={segment}
                    onChange={(e) => handleItemChange(index, e.target.value, customerSegments, setCustomerSegments)}
                    placeholder="Enter a customer segment"
                  />
                  {customerSegments.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveItem(index, customerSegments, setCustomerSegments)}
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={() => handleAddItem(customerSegments, setCustomerSegments)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Segment
              </button>
            </div>
              </div>

          {/* Unique Value Proposition Block */}
          <div className="canvas-block uvp-block">
            <div className="block-header">
              <h3>Unique Value Proposition</h3>
            </div>
            <div className="block-content">
              <div className="canvas-special-item">
                <textarea
                  className="form-textarea"
                  value={uniqueValueProposition}
                  onChange={(e) => setUniqueValueProposition(e.target.value)}
                  placeholder="What makes your solution unique and valuable?"
                  rows={4}
                />
                <div className="uvp-examples">
                  <h4 className="examples-header">Tips for a Strong UVP:</h4>
                  <ul className="examples-list">
                    <li>Focus on customer benefits, not features</li>
                    <li>Be specific and clear, not generic</li>
                    <li>Communicate what problem you solve</li>
                    <li>Consider using the formula: [Outcome] + [Time Period] + [Objection Handler]</li>
                  </ul>
                </div>
              </div>
            </div>
              </div>

          {/* Solution Block */}
          <div className="canvas-block solution-block">
            <div className="block-header">
              <h3>Solution</h3>
            </div>
            <div className="block-content">
              {solutions.map((solution, index) => (
                <div key={`solution-${index}`} className="canvas-item">
                  <input
                    type="text"
                    className="form-input"
                    value={solution}
                    onChange={(e) => handleItemChange(index, e.target.value, solutions, setSolutions)}
                    placeholder="Enter a solution"
                  />
                  {solutions.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveItem(index, solutions, setSolutions)}
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={() => handleAddItem(solutions, setSolutions)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Solution
              </button>
            </div>
              </div>

          {/* Channels Block */}
          <div className="canvas-block channels-block">
            <div className="block-header">
              <h3>Channels</h3>
            </div>
            <div className="block-content">
              {channels.map((channel, index) => (
                <div key={`channel-${index}`} className="canvas-item">
                  <div className="select-with-options">
                    <select
                      className="form-select"
                      value={channel.value}
                      onChange={(e) => handleSpecialItemChange(index, "value", e.target.value, channels, setChannels)}
                    >
                      <option value="">Select a Channel</option>
                      {channelOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>
                    {channel.isCustom && (
                      <input
                        type="text"
                        className="form-input custom-input"
                        value={channel.customValue}
                        onChange={(e) => handleSpecialItemChange(index, "customValue", e.target.value, channels, setChannels)}
                        placeholder="Enter custom channel"
                      />
                    )}
                  </div>
                  {channels.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveItem(index, channels, setChannels)}
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={() => handleAddSpecialItem(channels, setChannels)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Channel
              </button>
            </div>
              </div>

          {/* Key Metrics Block */}
          <div className="canvas-block metrics-block">
            <div className="block-header">
              <h3>Key Metrics</h3>
            </div>
            <div className="block-content">
              {keyMetrics.map((metric, index) => (
                <div key={`metric-${index}`} className="canvas-item">
                  <input
                    type="text"
                    className="form-input"
                    value={metric}
                    onChange={(e) => handleItemChange(index, e.target.value, keyMetrics, setKeyMetrics)}
                    placeholder="Enter a key metric"
                  />
                  {keyMetrics.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveItem(index, keyMetrics, setKeyMetrics)}
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={() => handleAddItem(keyMetrics, setKeyMetrics)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Metric
              </button>
            </div>
              </div>

          {/* Unfair Advantage Block */}
          <div className="canvas-block advantage-block">
            <div className="block-header">
              <h3>Unfair Advantage</h3>
              </div>
            <div className="block-content">
              <div className="canvas-special-item">
                <textarea
                  className="form-textarea"
                  value={unfairAdvantage}
                  onChange={(e) => setUnfairAdvantage(e.target.value)}
                  placeholder="What is your unfair advantage?"
                  rows={4}
                />
                <div className="advantage-examples">
                  <h4 className="examples-header">Unfair Advantage Examples:</h4>
                  <ul className="examples-list">
                    <li>Insider information</li>
                    <li>Personal authority/reputation</li>
                    <li>Existing customers/community</li>
                    <li>Unique IP or technology</li>
                    <li>Special team experience</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Cost Structure Block */}
          <div className="canvas-block cost-block">
            <div className="block-header">
              <h3>Cost Structure</h3>
            </div>
            <div className="block-content">
              {costStructure.map((cost, index) => (
                <div key={`cost-${index}`} className="canvas-item">
                  <input
                    type="text"
                    className="form-input"
                    value={cost}
                    onChange={(e) => handleItemChange(index, e.target.value, costStructure, setCostStructure)}
                    placeholder="Enter a cost item"
                  />
                  {costStructure.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveItem(index, costStructure, setCostStructure)}
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={() => handleAddItem(costStructure, setCostStructure)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Cost
              </button>
            </div>
          </div>
          
          {/* Revenue Streams Block */}
          <div className="canvas-block revenue-block">
            <div className="block-header">
              <h3>Revenue Streams</h3>
            </div>
            <div className="block-content">
              {revenueStreams.map((revenue, index) => (
                <div key={`revenue-${index}`} className="canvas-item">
                  <div className="select-with-options">
                    <select
                      className="form-select"
                      value={revenue.value}
                      onChange={(e) => handleSpecialItemChange(index, "value", e.target.value, revenueStreams, setRevenueStreams)}
                    >
                      <option value="">Select Revenue Stream</option>
                      {revenueOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>
                    {revenue.isCustom && (
                      <input
                        type="text"
                        className="form-input custom-input"
                        value={revenue.customValue}
                        onChange={(e) => handleSpecialItemChange(index, "customValue", e.target.value, revenueStreams, setRevenueStreams)}
                        placeholder="Enter custom revenue stream"
                      />
                    )}
                  </div>
                  {revenueStreams.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveItem(index, revenueStreams, setRevenueStreams)}
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={() => handleAddSpecialItem(revenueStreams, setRevenueStreams)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Revenue Stream
              </button>
            </div>
          </div>
              </div>

        {/* Buttons: Cancel and Save */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-save"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Canvas"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeanCanvasTemplate;
