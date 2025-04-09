import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import Navbar from "../../components/Navbar";
import "./ViewLeanCanvas.css";

// Channel options for dropdown
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

// Revenue options for dropdown
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

const ViewLeanCanvas = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Data state
  const [leanCanvas, setLeanCanvas] = useState(null);
  
  // Form state for Lean Canvas sections
  const [problems, setProblems] = useState([""]);
  const [customerSegments, setCustomerSegments] = useState([""]);
  const [uniqueValueProposition, setUniqueValueProposition] = useState("");
  const [solutions, setSolutions] = useState([""]);
  const [channels, setChannels] = useState([{ value: "", isCustom: false, customValue: "" }]);
  const [revenueStreams, setRevenueStreams] = useState([{ value: "", isCustom: false, customValue: "" }]);
  const [costStructure, setCostStructure] = useState([""]);
  const [keyMetrics, setKeyMetrics] = useState([""]);
  const [unfairAdvantage, setUnfairAdvantage] = useState("");

  // Fetch lean canvas data on component mount
  useEffect(() => {
    fetchLeanCanvas();
  }, [projectId]);

  const fetchLeanCanvas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the API function from the projects service
      const response = await projectsApi.fetchLeanCanvas(projectId);
      console.log('Fetched Lean Canvas data:', response);
      
      // Store the whole response
      setLeanCanvas(response);
      
      // Handle different possible data structures
      let canvasData;
      
      if (response) {
        if (response.data) {
          // Standard API response
          const data = response.data;
          
          if (data === null) {
            // No canvas exists yet
            console.log('No Lean Canvas data found');
            setLoading(false);
            return;
          }
          
          // Check for content wrapper (this is how newer documents are structured)
          if (data.content) {
            canvasData = data.content;
            console.log('Using response.data.content format');
          } else {
            // Older format or direct data
            canvasData = data;
            console.log('Using response.data format directly');
          }
        } else if (response.content) {
          // Direct response with content field
          canvasData = response.content;
          console.log('Using response.content format');
        } else {
          // Direct document without nesting
          canvasData = response;
          console.log('Using direct document format');
        }
      } else {
        console.warn('Empty response received');
        setLoading(false);
        return;
      }
      
      // Make sure we actually have data at this point
      if (!canvasData) {
        console.warn('No canvas data could be extracted from the response');
        setLoading(false);
        return;
      }
      
      // Handle property naming differences (problem vs problems)
      const problemData = Array.isArray(canvasData.problem) ? canvasData.problem : 
                         Array.isArray(canvasData.problems) ? canvasData.problems : [];
                         
      const solutionData = Array.isArray(canvasData.solution) ? canvasData.solution : 
                          Array.isArray(canvasData.solutions) ? canvasData.solutions : [];
      
      // Initialize array fields with data or empty arrays
      setProblems(problemData.length > 0 ? [...problemData] : [""]);
      setCustomerSegments(Array.isArray(canvasData.customerSegments) && canvasData.customerSegments.length > 0 ? 
        [...canvasData.customerSegments] : [""]);
      setSolutions(solutionData.length > 0 ? [...solutionData] : [""]);
      setCostStructure(Array.isArray(canvasData.costStructure) && canvasData.costStructure.length > 0 ? 
        [...canvasData.costStructure] : [""]);
      setKeyMetrics(Array.isArray(canvasData.keyMetrics) && canvasData.keyMetrics.length > 0 ? 
        [...canvasData.keyMetrics] : [""]);
      
      // Initialize text fields
      setUniqueValueProposition(canvasData.uniqueValueProposition || "");
      setUnfairAdvantage(canvasData.unfairAdvantage || "");
      
      // Process channels data
      if (Array.isArray(canvasData.channels) && canvasData.channels.length > 0) {
        const processedChannels = canvasData.channels.map(channel => {
          if (typeof channel === 'object' && channel.value) {
            // Already in the right format
            return channel;
          } else {
            const isInOptions = channelOptions.includes(channel);
            return {
              value: isInOptions ? channel : "custom",
              isCustom: !isInOptions,
              customValue: isInOptions ? "" : channel
            };
          }
        });
        setChannels(processedChannels);
      } else {
        setChannels([{ value: "", isCustom: false, customValue: "" }]);
      }
      
      // Process revenue streams data
      if (Array.isArray(canvasData.revenueStreams) && canvasData.revenueStreams.length > 0) {
        const processedStreams = canvasData.revenueStreams.map(stream => {
          if (typeof stream === 'object' && stream.value) {
            // Already in the right format
            return stream;
          } else {
            const isInOptions = revenueOptions.includes(stream);
            return {
              value: isInOptions ? stream : "custom",
              isCustom: !isInOptions,
              customValue: isInOptions ? "" : stream
            };
          }
        });
        setRevenueStreams(processedStreams);
      } else {
        setRevenueStreams([{ value: "", isCustom: false, customValue: "" }]);
      }
    } catch (err) {
      console.error("Error fetching Lean Canvas:", err);
      setError("Failed to load Lean Canvas data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // General handler for adding items to simple arrays
  const handleAddItem = (currentItems, setItemsFunction) => {
    setItemsFunction([...currentItems, ""]);
  };

  // General handler for removing items from simple arrays
  const handleRemoveItem = (index, currentItems, setItemsFunction) => {
    const newItems = [...currentItems];
    newItems.splice(index, 1);
    
    // If removing the last item, add an empty one
    if (newItems.length === 0) {
      newItems.push("");
    }
    
    setItemsFunction(newItems);
  };

  // General handler for updating items in simple arrays
  const handleItemChange = (index, newValue, currentItems, setItemsFunction) => {
    const newItems = [...currentItems];
    newItems[index] = newValue;
    setItemsFunction(newItems);
  };

  // Handler for adding items to complex arrays (channels, revenue streams)
  const handleAddSpecialItem = (currentItems, setItemsFunction) => {
    setItemsFunction([...currentItems, { value: "", isCustom: false, customValue: "" }]);
  };

  // Handler for updating items in complex arrays (channels, revenue streams)
  const handleSpecialItemChange = (index, field, newValue, currentItems, setItemsFunction) => {
    const newItems = [...currentItems];
    
    if (field === "value") {
      newItems[index].value = newValue;
      newItems[index].isCustom = newValue === "custom";
      
      // Reset custom value if changing away from custom
      if (newValue !== "custom") {
        newItems[index].customValue = "";
      }
    } else if (field === "customValue") {
      newItems[index].customValue = newValue;
    }
    
    setItemsFunction(newItems);
  };

  // Handle form submission 
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      // Process the special fields (channels and revenue streams)
      const processedChannels = channels
        .map(ch => ch.isCustom ? ch.customValue : ch.value)
        .filter(Boolean); // Remove empty values
      
      const processedRevenues = revenueStreams
        .map(rev => rev.isCustom ? rev.customValue : rev.value)
        .filter(Boolean); // Remove empty values
      
      // Calculate current version
      let currentVersion = 1;
      if (leanCanvas) {
        // Try to find version in all possible locations
        if (leanCanvas.version) {
          currentVersion = leanCanvas.version;
        } else if (leanCanvas.data?.version) {
          currentVersion = leanCanvas.data.version;
        } else if (leanCanvas.content?.version) {
          currentVersion = leanCanvas.content.version;
        }
        currentVersion = (parseInt(currentVersion) || 0) + 1;
      }
      
      // Create the payload to match what LeanCanvasTemplate.jsx does
      const leanCanvasData = {
        type: "LeanCanvas",
        problem: problems.filter(p => p.trim()),
        customerSegments: customerSegments.filter(s => s.trim()),
        uniqueValueProposition: uniqueValueProposition.trim(),
        solution: solutions.filter(s => s.trim()),
        channels: processedChannels,
        revenueStreams: processedRevenues,
        costStructure: costStructure.filter(c => c.trim()),
        keyMetrics: keyMetrics.filter(k => k.trim()),
        unfairAdvantage: unfairAdvantage.trim(),
        version: currentVersion,
        updated_at: new Date().toISOString()
      };
      
      // Add created_at if this is the first version
      if (currentVersion === 1) {
        leanCanvasData.created_at = new Date().toISOString();
      }
      
      // Use the API function from the projects service
      console.log(`Updating Lean Canvas for project: ${projectId}`);
      console.log('Payload:', JSON.stringify(leanCanvasData, null, 2));
      await projectsApi.updateLeanCanvas(projectId, leanCanvasData);
      
      // Refresh data
      await fetchLeanCanvas();
      
      setIsEditMode(false);
      setMessage("Lean Canvas updated successfully!");
      setLoading(false);
    } catch (err) {
      console.error("Error saving Lean Canvas:", err);
      setError(`Failed to save Lean Canvas: ${err.message}`);
      setLoading(false);
    }
  };

  // Cancel edit mode and reset form
  const handleCancel = () => {
    // Reset form with current data
    fetchLeanCanvas();
    setIsEditMode(false);
    setError(null);
  };

  // Navigate back to project details
  const handleBackToProject = () => {
    navigate(`/projects/${projectId}`);
  };

  // Read-only view rendering
  const renderReadOnlyView = () => (
    <div className="view-lean-container">
      <h2>Lean Canvas {leanCanvas?.version ? `(Version ${leanCanvas.version})` : ""}</h2>
      {message && <div className="success-text">{message}</div>}

      <div className="lean-canvas-grid">
        {/* Problem Block */}
        <div className="canvas-block problem-block">
          <div className="block-header">
            <h3>Problem</h3>
          </div>
          <div className="block-content">
            {problems.some(p => p.trim()) ? (
              <ul className="item-list">
                {problems.map((problem, index) => 
                  problem.trim() ? (
                    <li key={`problem-${index}`}>{problem}</li>
                  ) : null
                )}
              </ul>
            ) : (
              <p className="empty-state">No problems defined</p>
            )}
          </div>
        </div>

        {/* Customer Segments Block */}
        <div className="canvas-block segments-block">
          <div className="block-header">
            <h3>Customer Segments</h3>
          </div>
          <div className="block-content">
            {customerSegments.some(s => s.trim()) ? (
              <ul className="item-list">
                {customerSegments.map((segment, index) => 
                  segment.trim() ? (
                    <li key={`segment-${index}`}>{segment}</li>
                  ) : null
                )}
              </ul>
            ) : (
              <p className="empty-state">No customer segments defined</p>
            )}
          </div>
        </div>

        {/* Unique Value Proposition Block */}
        <div className="canvas-block uvp-block">
          <div className="block-header">
            <h3>Unique Value Proposition</h3>
          </div>
          <div className="block-content">
            {uniqueValueProposition ? (
              <p className="value-proposition">{uniqueValueProposition}</p>
            ) : (
              <p className="empty-state">No value proposition defined</p>
            )}
          </div>
        </div>

        {/* Solution Block */}
        <div className="canvas-block solution-block">
          <div className="block-header">
            <h3>Solution</h3>
          </div>
          <div className="block-content">
            {solutions.some(s => s.trim()) ? (
              <ul className="item-list">
                {solutions.map((solution, index) => 
                  solution.trim() ? (
                    <li key={`solution-${index}`}>{solution}</li>
                  ) : null
                )}
              </ul>
            ) : (
              <p className="empty-state">No solutions defined</p>
            )}
          </div>
        </div>

        {/* Channels Block */}
        <div className="canvas-block channels-block">
          <div className="block-header">
            <h3>Channels</h3>
          </div>
          <div className="block-content">
            {channels.some(ch => ch.value || ch.customValue) ? (
              <ul className="item-list">
                {channels.map((channel, index) => {
                  const displayValue = channel.isCustom ? channel.customValue : channel.value;
                  return displayValue ? (
                    <li key={`channel-${index}`}>{displayValue}</li>
                  ) : null;
                })}
              </ul>
            ) : (
              <p className="empty-state">No channels defined</p>
            )}
          </div>
        </div>

        {/* Key Metrics Block */}
        <div className="canvas-block metrics-block">
          <div className="block-header">
            <h3>Key Metrics</h3>
          </div>
          <div className="block-content">
            {keyMetrics.some(m => m.trim()) ? (
              <ul className="item-list">
                {keyMetrics.map((metric, index) => 
                  metric.trim() ? (
                    <li key={`metric-${index}`}>{metric}</li>
                  ) : null
                )}
              </ul>
            ) : (
              <p className="empty-state">No key metrics defined</p>
            )}
          </div>
        </div>

        {/* Unfair Advantage Block */}
        <div className="canvas-block advantage-block">
          <div className="block-header">
            <h3>Unfair Advantage</h3>
          </div>
          <div className="block-content">
            {unfairAdvantage ? (
              <p className="advantage-text">{unfairAdvantage}</p>
            ) : (
              <p className="empty-state">No unfair advantage defined</p>
            )}
          </div>
        </div>

        {/* Cost Structure Block */}
        <div className="canvas-block cost-block">
          <div className="block-header">
            <h3>Cost Structure</h3>
          </div>
          <div className="block-content">
            {costStructure.some(c => c.trim()) ? (
              <ul className="item-list">
                {costStructure.map((cost, index) => 
                  cost.trim() ? (
                    <li key={`cost-${index}`}>{cost}</li>
                  ) : null
                )}
              </ul>
            ) : (
              <p className="empty-state">No cost structure defined</p>
            )}
          </div>
        </div>

        {/* Revenue Streams Block */}
        <div className="canvas-block revenue-block">
          <div className="block-header">
            <h3>Revenue Streams</h3>
          </div>
          <div className="block-content">
            {revenueStreams.some(rs => rs.value || rs.customValue) ? (
              <ul className="item-list">
                {revenueStreams.map((stream, index) => {
                  const displayValue = stream.isCustom ? stream.customValue : stream.value;
                  return displayValue ? (
                    <li key={`stream-${index}`}>{displayValue}</li>
                  ) : null;
                })}
              </ul>
            ) : (
              <p className="empty-state">No revenue streams defined</p>
            )}
          </div>
        </div>
      </div>

      <div className="button-group">
        <button className="btn-primary" onClick={() => setIsEditMode(true)}>
          Edit
        </button>
        <button className="btn-secondary" onClick={handleBackToProject}>
          Back to Project
        </button>
      </div>
    </div>
  );

  // Edit mode rendering
  const renderEditMode = () => (
    <div className="edit-lean-container">
      <h2>Edit Lean Canvas {leanCanvas?.version ? `(Version ${leanCanvas.version})` : ""}</h2>
      {error && <div className="error-text">{error}</div>}

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
                      value={channel.customValue || ""}
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
                      value={revenue.customValue || ""}
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

      <div className="form-actions">
        <button type="button" onClick={handleSave} className="btn-save">
          Save Changes
        </button>
        <button type="button" onClick={handleCancel} className="btn-cancel">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="view-lean-wrapper">
        {loading ? (
          <p>Loading Lean Canvas...</p>
        ) : error && !isEditMode ? (
          <div className="error-text">{error}</div>
        ) : (
          isEditMode ? renderEditMode() : renderReadOnlyView()
        )}
      </div>
    </>
  );
};

export default ViewLeanCanvas;
