// src/pages/Documents/ViewRiskRegister.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import Navbar from "../../components/Navbar";
import "./ViewRiskRegister.css";

// Function to calculate opacity based on severity score
const calculateOpacity = (severity) => {
  return 0.3 + ((severity - 1) / 24) * 0.7;
};

// Function to get cell background color based on severity
const getCellBackgroundColor = (severity) => {
  // Low-to-Moderate Severity (≤ 9): Blue (#3ecbf5)
  // High Severity (> 9): Orange (#f5a623)
  const baseColor = severity <= 9 ? "62, 203, 245" : "245, 166, 35"; // RGB for #3ecbf5 and #f5a623
  const opacity = calculateOpacity(severity);
  return `rgba(${baseColor}, ${opacity})`;
};

// Function to get severity class name
const getSeverityClassName = (score) => {
  const numScore = Number(score);
  if (numScore >= 1 && numScore <= 4) return 'severity-low';
  if (numScore >= 5 && numScore <= 9) return 'severity-moderate';
  if (numScore >= 10 && numScore <= 16) return 'severity-high';
  if (numScore >= 17 && numScore <= 25) return 'severity-extreme';
  return '';
};

// Column definitions with explanations
const riskColumns = [
  {
    id: "riskId",
    name: "Risk ID",
    description: "A unique identifier for each risk (e.g., 10001, RISK-001, etc.). Helps with easy referencing and tracking across reports or communications."
  },
  {
    id: "dateRaised",
    name: "Date Raised",
    description: "The specific date when a risk was first identified and entered into the risk register. Helps track the risk's lifecycle and evaluate how quickly mitigation actions are implemented."
  },
  {
    id: "category",
    name: "Risk Category",
    description: "The general area the risk belongs to. Categorizing helps you quickly see patterns (e.g., too many Technical risks) and assign the right mitigation strategies or owners."
  },
  {
    id: "description",
    name: "Risk Description",
    description: "A concise statement describing the risk. Often includes Cause (why the risk might occur) and Potential Impact (what happens if the risk materializes). Ensures everyone understands exactly what the risk entails and its implications."
  },
  {
    id: "probability",
    name: "Probability (1-5)",
    description: "A numerical rating (1-5) that reflects how likely the risk is to occur: 1 = Very Low Probability, 5 = Very High Probability. One of the two key dimensions for assessing risk severity."
  },
  {
    id: "impact",
    name: "Impact (1-5)",
    description: "A numerical rating (1-5) that reflects the severity of consequences if the risk occurs: 1 = Minimal Impact, 5 = Extremely High Impact. The second dimension for risk severity. Combined with Probability, it forms the basis for prioritization."
  },
  {
    id: "riskScore",
    name: "Risk Severity Score",
    description: "The product of Probability × Impact. Quickly flags high-priority risks (higher scores)."
  },
  {
    id: "timing",
    name: "Likely Timing of Risk",
    description: "Indicates when the risk is most likely to occur (e.g., During requirements phase, After contract signing, Deployment phase, etc.). Helps the team anticipate when to enact mitigations or monitor triggers more closely."
  },
  {
    id: "trigger",
    name: "Risk Trigger",
    description: "A specific event or condition that signals the risk is about to materialize (e.g., \"Critical resource leaves the project\"). Ensures proactive monitoring. Once a trigger is observed, the team knows to escalate or implement the response plan."
  },
  {
    id: "mitigationStrategy",
    name: "Mitigation Strategy",
    description: "Choose one of these 4 strategies: Risk Avoidance (eliminate the risk), Risk Reduction (decrease likelihood/impact), Risk Transference (shift impact to third party), or Risk Acceptance (proceed without specific mitigation actions)."
  },
  {
    id: "mitigationPlan",
    name: "Mitigation Plan",
    description: "Documents how you'll handle each risk in detail according to the strategy you chose. This is the actionable part of risk management."
  },
  {
    id: "status",
    name: "Status",
    description: "Current state of the risk: Identified/New, Active, Under Review, In Mitigation/In Progress, Mitigated/Reduced, Transferred, Accepted, Escalated, Closed/Resolved, or Deferred."
  },
  {
    id: "owner",
    name: "Owner",
    description: "The person or role responsible for monitoring the risk and executing the mitigation plan. Accountability is key to effective risk management."
  },
  {
    id: "notes",
    name: "Other Notes",
    description: "A flexible column for additional context, such as links to documents, references to lessons learned, or updates not covered in the main columns. Gives space for any extra details relevant to the risk's history or resolution."
  }
];

// Risk category options
const riskCategories = [
  "Technical Risks",
  "Project Management Risks",
  "Resource Risks",
  "Vendor/Supplier Risks",
  "Security Risks",
  "Operational Risks",
  "Financial Risks",
  "Legal & Compliance Risks",
  "Stakeholder & Communication Risks",
  "Change Management Risks",
  "Other"
];

// Mitigation strategy options
const mitigationStrategies = [
  "Avoidance",
  "Reduction",
  "Transfer",
  "Acceptance"
];

// Status options
const statusOptions = [
  "Identified / New",
  "Active",
  "Under Review",
  "In Mitigation / In Progress",
  "Mitigated / Reduced",
  "Transferred",
  "Accepted",
  "Escalated",
  "Closed / Resolved",
  "Deferred"
];

// Empty risk template
const getEmptyRisk = () => ({
  riskId: "",
  dateRaised: new Date().toISOString().split('T')[0], // Today's date
  category: "",
  description: "",
  probability: "",
  impact: "",
  riskScore: "",
  timing: "",
  trigger: "",
  mitigationStrategy: "",
  mitigationPlan: "",
  status: "Identified / New", // Default status
  owner: "",
  notes: ""
});

const ViewRiskRegister = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Initialize risks as an array
  const [risks, setRisks] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedColumn, setExpandedColumn] = useState(null);
  
  // For filtering and searching
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    riskScore: "",
    owner: ""
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch the existing Risk Register on mount
  useEffect(() => {
    const fetchRiskRegister = async () => {
      try {
        // First get project details to display the name
        const projectRes = await projectsApi.fetchProjectById(projectId);
        if (projectRes && projectRes.name) {
          setProjectName(projectRes.name || "");
        }

        // Then get the risk register
        const res = await projectsApi.fetchRiskRegister(projectId);
        
        // Handle different possible data structures
        let risksArray = [];
        
        if (res && res.data) {
          // Format 1: Standard API response
          const data = res.data;
          
          if (data === null) {
            // No risk register exists yet
            console.log('No risk register data found');
          } else if (data.content && data.content.risks) {
            // Response has data.content.risks structure
            risksArray = data.content.risks;
            console.log('Using response.data.content.risks format');
          } else if (data.content) {
            // Response has data.content structure but no risks field
            risksArray = Array.isArray(data.content) ? data.content : [];
            console.log('Using response.data.content format');
          } else if (data.risks) {
            // Response has direct data.risks structure
            risksArray = data.risks;
            console.log('Using response.data.risks format');
          } else {
            // Unknown structure, check if data itself is an array
            risksArray = Array.isArray(data) ? data : [];
            console.log('Using response.data as array format');
          }
        } else if (res && res.content && res.content.risks) {
          // Format 2: Document with content.risks field
          risksArray = res.content.risks;
          console.log('Using document response with content.risks field format');
        } else if (res && res.risks) {
          // Format 3: Document with direct risks field
          risksArray = res.risks;
          console.log('Using document with risks field format');
        } else if (Array.isArray(res)) {
          // Format 4: Direct array
          risksArray = res;
          console.log('Using direct array format');
        }
        
        console.log('Parsed risks array:', risksArray);
        setRisks(Array.isArray(risksArray) ? risksArray : []);
      } catch (err) {
        console.error("Error fetching Risk Register:", err);
        setError("Risk Register not found or access denied.");
      } finally {
        setLoading(false);
      }
    };
    fetchRiskRegister();
  }, [projectId]);

  // Save updated Risk Register
  const handleSave = async () => {
    try {
      setError(null);
      setMessage(null);
      
      // Format the payload according to what the API expects
      const payload = {
        type: "RiskRegister",
        version: 1,
        risks: risks,
        updated_at: new Date().toISOString()
      };
      
      // Use projectsApi to update risk register
      await projectsApi.updateRiskRegister(projectId, payload);
      setIsEditMode(false);
      setMessage("Risk Register updated successfully!");
    } catch (err) {
      console.error("Failed to update Risk Register:", err);
      setError("Failed to update Risk Register.");
    }
  };

  const handleBackToProject = () => {
    navigate(`/projects/${projectId}`);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    // Reset any error or success messages when toggling modes
    setError(null);
    setMessage(null);
  };

  // Heat Map component
  const RiskHeatMap = () => {
    // Create array of 1-5 for probability and impact
    const levels = [5, 4, 3, 2, 1]; // Reversed for display (5 at top)
    
    // Labels for probability and impact
    const probabilityLabels = {
      1: "Rare",
      2: "Unlikely",
      3: "Possible",
      4: "Likely",
      5: "Certain"
    };
    
    const impactLabels = {
      1: "Insignificant",
      2: "Minor",
      3: "Moderate",
      4: "Major",
      5: "Severe"
    };
    
    return (
      <div className="risk-heat-map">
        <div className="heat-map-labels">
          <div className="probability-label">Probability</div>
          <div className="impact-label">Impact</div>
        </div>
        
        <div className="heat-map-grid">
          {/* Column Headers (Impact) */}
          <div className="heat-map-row header-row">
            <div className="heat-map-cell corner-cell"></div>
            {[1, 2, 3, 4, 5].map(impact => (
              <div key={`impact-${impact}`} className="heat-map-cell header-cell">
                {impact}
              </div>
            ))}
            <div className="heat-map-cell impact-label-cell"></div>
          </div>
          
          {/* Grid Rows with Row Headers (Probability) */}
          {levels.map(probability => (
            <div key={`prob-${probability}`} className="heat-map-row">
              {/* Row Header (Probability) */}
              <div className="heat-map-cell header-cell">
                {probability}
              </div>
              
              {/* Severity Cells */}
              {[1, 2, 3, 4, 5].map(impact => {
                const severity = probability * impact;
                return (
                  <div 
                    key={`cell-${probability}-${impact}`} 
                    className="heat-map-cell severity-cell"
                    style={{ 
                      backgroundColor: getCellBackgroundColor(severity)
                    }}
                  >
                    {severity}
                  </div>
                );
              })}
              
              {/* Probability Label on the right */}
              <div className="heat-map-cell probability-label-cell">
                {probabilityLabels[probability]}
              </div>
            </div>
          ))}
          
          {/* Impact labels row at the bottom */}
          <div className="heat-map-row impact-labels-row">
            <div className="heat-map-cell corner-cell"></div>
            {[1, 2, 3, 4, 5].map(impact => (
              <div key={`impact-label-${impact}`} className="heat-map-cell impact-label-cell">
                {impactLabels[impact]}
              </div>
            ))}
            <div className="heat-map-cell corner-cell"></div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="heat-map-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "rgba(62, 203, 245, 0.3)" }}></div>
            <span>Low Risk (1-4)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "rgba(62, 203, 245, 0.7)" }}></div>
            <span>Moderate Risk (5-9)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "rgba(245, 166, 35, 0.3)" }}></div>
            <span>High Risk (10-16)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "rgba(245, 166, 35, 0.7)" }}></div>
            <span>Extreme Risk (17-25)</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Risk Count Summary component
  const RiskCountSummary = () => {
    // Count risks by severity category
    const lowRisks = risks.filter(risk => {
      const score = Number(risk.riskScore);
      return score >= 1 && score <= 4;
    }).length;
    
    const moderateRisks = risks.filter(risk => {
      const score = Number(risk.riskScore);
      return score >= 5 && score <= 9;
    }).length;
    
    const highRisks = risks.filter(risk => {
      const score = Number(risk.riskScore);
      return score >= 10 && score <= 16;
    }).length;
    
    const extremeRisks = risks.filter(risk => {
      const score = Number(risk.riskScore);
      return score >= 17 && score <= 25;
    }).length;
    
    const totalRisks = risks.length;
    
    return (
      <div className="risk-count-summary">
        <h3 className="summary-title">Risk Summary</h3>
        
        <div className="count-boxes">
          <div className="count-box extreme">
            <div className="count-number">{extremeRisks}</div>
            <div className="count-label">Extreme Risk</div>
            <div className="count-percent">
              {totalRisks ? Math.round((extremeRisks / totalRisks) * 100) : 0}%
            </div>
          </div>
          
          <div className="count-box high">
            <div className="count-number">{highRisks}</div>
            <div className="count-label">High Risk</div>
            <div className="count-percent">
              {totalRisks ? Math.round((highRisks / totalRisks) * 100) : 0}%
            </div>
          </div>
          
          <div className="count-box moderate">
            <div className="count-number">{moderateRisks}</div>
            <div className="count-label">Moderate Risk</div>
            <div className="count-percent">
              {totalRisks ? Math.round((moderateRisks / totalRisks) * 100) : 0}%
            </div>
          </div>
          
          <div className="count-box low">
            <div className="count-number">{lowRisks}</div>
            <div className="count-label">Low Risk</div>
            <div className="count-percent">
              {totalRisks ? Math.round((lowRisks / totalRisks) * 100) : 0}%
            </div>
          </div>
        </div>
        
        <div className="total-risks">
          <span className="total-label">Total Risks:</span>
          <span className="total-number">{totalRisks}</span>
        </div>
      </div>
    );
  };

  // Column Explanations component
  const ColumnExplanations = () => {
    const toggleColumn = (columnId) => {
      if (expandedColumn === columnId) {
        setExpandedColumn(null);
      } else {
        setExpandedColumn(columnId);
      }
    };
    
    return (
      <div className="column-explanations">
        <p>Click on a column name to understand its importance and purpose in risk management:</p>
        <div className="explanation-accordion">
          {riskColumns.map((column) => (
            <div key={column.id} className="accordion-item">
              <button 
                className={`accordion-header ${expandedColumn === column.id ? 'expanded' : ''}`}
                onClick={() => toggleColumn(column.id)}
              >
                {column.name}
                <span className="accordion-icon">{expandedColumn === column.id ? '−' : '+'}</span>
              </button>
              {expandedColumn === column.id && (
                <div className="accordion-content">
                  {column.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Risk Table component for both view and edit modes
  const RiskTable = () => {
    // State to track which risk is being edited (if any)
    const [editingRiskIndex, setEditingRiskIndex] = useState(null);
    
    // If editing a risk, we'll store a temporary copy here for editing
    const [editingRisk, setEditingRisk] = useState(null);
    
    // Sorting state
    const [sortField, setSortField] = useState("riskId");
    const [sortDirection, setSortDirection] = useState("asc");
    
    // Function to handle sorting
    const handleSort = (field) => {
      if (sortField === field) {
        // If already sorting by this field, toggle direction
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        // If sorting by a new field, set it and default to ascending
        setSortField(field);
        setSortDirection("asc");
      }
    };
    
    // Function to handle filtering
    const handleFilterChange = (field, value) => {
      setFilters({
        ...filters,
        [field]: value
      });
    };
    
    // Function to clear all filters
    const clearFilters = () => {
      setFilters({
        category: "",
        status: "",
        riskScore: "",
        owner: ""
      });
      setSearchTerm("");
    };
    
    // Get sorted and filtered risks
    const getSortedAndFilteredRisks = () => {
      // First, filter the risks
      let filteredRisks = [...risks];
      
      // Apply global search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredRisks = filteredRisks.filter(risk => {
          // Search across all string fields
          return Object.keys(risk).some(key => {
            if (typeof risk[key] === 'string') {
              return risk[key].toLowerCase().includes(searchLower);
            }
            return false;
          });
        });
      }
      
      if (filters.category) {
        filteredRisks = filteredRisks.filter(risk => 
          risk.category.toLowerCase().includes(filters.category.toLowerCase())
        );
      }
      
      if (filters.status) {
        filteredRisks = filteredRisks.filter(risk => 
          risk.status.toLowerCase().includes(filters.status.toLowerCase())
        );
      }
      
      if (filters.riskScore) {
        filteredRisks = filteredRisks.filter(risk => {
          const score = Number(risk.riskScore);
          const filterVal = Number(filters.riskScore);
          
          // Filter by severity category
          if (filters.riskScore === "low") return score >= 1 && score <= 4;
          if (filters.riskScore === "moderate") return score >= 5 && score <= 9;
          if (filters.riskScore === "high") return score >= 10 && score <= 16;
          if (filters.riskScore === "extreme") return score >= 17 && score <= 25;
          
          // If not a category, filter by exact score
          return score === filterVal;
        });
      }
      
      if (filters.owner) {
        filteredRisks = filteredRisks.filter(risk => 
          risk.owner.toLowerCase().includes(filters.owner.toLowerCase())
        );
      }
      
      // Then, sort the filtered risks
      filteredRisks.sort((a, b) => {
        let valueA = a[sortField];
        let valueB = b[sortField];
        
        // Special handling for numeric fields
        if (["riskId", "probability", "impact", "riskScore"].includes(sortField)) {
          valueA = Number(valueA) || 0;
          valueB = Number(valueB) || 0;
        } 
        // Special handling for date fields
        else if (sortField === "dateRaised") {
          valueA = new Date(valueA).getTime();
          valueB = new Date(valueB).getTime();
        }
        // String comparison
        else {
          valueA = String(valueA).toLowerCase();
          valueB = String(valueB).toLowerCase();
        }
        
        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
      
      return filteredRisks;
    };
    
    // Start editing a risk
    const handleStartEdit = (index) => {
      if (isEditMode) {
        setEditingRiskIndex(index);
        setEditingRisk({...risks[index]});
      }
    };
    
    // Cancel editing a risk
    const handleCancelEdit = () => {
      setEditingRiskIndex(null);
      setEditingRisk(null);
    };
    
    // Save edited risk
    const handleSaveEdit = () => {
      if (editingRisk) {
        const updatedRisks = [...risks];
        updatedRisks[editingRiskIndex] = editingRisk;
        setRisks(updatedRisks);
        setEditingRiskIndex(null);
        setEditingRisk(null);
      }
    };
    
    // Update a field in the editing risk
    const handleFieldChange = (field, value) => {
      if (editingRisk) {
        const updatedRisk = {...editingRisk};
        updatedRisk[field] = value;
        
        // If probability or impact changed, update risk score
        if (field === 'probability' || field === 'impact') {
          const probability = field === 'probability' ? value : editingRisk.probability;
          const impact = field === 'impact' ? value : editingRisk.impact;
          
          if (probability && impact) {
            const probNum = Number(probability);
            const impactNum = Number(impact);
            
            if (probNum >= 1 && probNum <= 5 && impactNum >= 1 && impactNum <= 5) {
              updatedRisk.riskScore = (probNum * impactNum).toString();
            }
          }
        }
        
        setEditingRisk(updatedRisk);
      }
    };
    
    // Add a new risk
    const handleAddNewRisk = () => {
      // Only allow adding risks in edit mode
      if (!isEditMode) return;
      
      // Generate a simple risk ID based on existing risks
      let maxId = 0;
      risks.forEach(risk => {
        const riskIdNumber = parseInt(risk.riskId, 10);
        if (!isNaN(riskIdNumber) && riskIdNumber > maxId) {
          maxId = riskIdNumber;
        }
      });
      
      const newRisk = {
        ...getEmptyRisk(),
        riskId: (maxId + 1).toString()
      };
      
      const newRisks = [...risks, newRisk];
      setRisks(newRisks);
      
      // Start editing the new risk
      const newIndex = newRisks.length - 1;
      handleStartEdit(newIndex);
    };
    
    // Remove a risk
    const handleRemoveRisk = (index) => {
      if (!isEditMode) return;
      
      if (window.confirm("Are you sure you want to remove this risk?")) {
        const updatedRisks = [...risks];
        updatedRisks.splice(index, 1);
        setRisks(updatedRisks);
      }
    };

    // If there are no risks, show an empty state message
    if (risks.length === 0) {
      return (
        <div className="empty-state">
          <p>No risks have been added yet.</p>
          {isEditMode && (
            <>
              <p>Click the "Add Risk" button below to create your first risk entry.</p>
              <button 
                type="button" 
                className="btn-add-risk"
                onClick={handleAddNewRisk}
              >
                + Add Risk
              </button>
            </>
          )}
          {!isEditMode && (
            <p>This risk register is empty. Switch to edit mode to add risks.</p>
          )}
        </div>
      );
    }

    // Get filtered and sorted risks
    const filteredRisks = getSortedAndFilteredRisks();

    return (
      <div>
        <div className="table-header">
          <h3 className="table-title">Risk Register Table</h3>
          <p className="table-subtitle">Manage, track, and prioritize project risks</p>
        </div>
      
        <div className="table-controls">
          <div className="filter-actions">
            <div className="global-search">
              <input
                type="text"
                placeholder="Search across all fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="global-search-input"
              />
              {searchTerm && (
                <button 
                  type="button" 
                  className="search-clear-btn" 
                  onClick={() => setSearchTerm("")}
                >
                  ×
                </button>
              )}
            </div>
            {(filters.category || filters.status || filters.riskScore || filters.owner || searchTerm) && (
              <button type="button" className="btn-clear-filters" onClick={clearFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {(filters.category || filters.status || filters.riskScore || filters.owner || searchTerm) && (
          <div className="results-count">
            Showing {filteredRisks.length} of {risks.length} risks
          </div>
        )}

        {filteredRisks.length === 0 ? (
          <div className="no-results-message">
            <p>No matching risks found.</p>
            <p>Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="risk-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("riskId")} className="sortable-header">
                    Risk ID {sortField === "riskId" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("dateRaised")} className="sortable-header">
                    Date Raised {sortField === "dateRaised" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("category")} className="sortable-header">
                    <span className="header-text">Risk Category {sortField === "category" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                    <div className="filter-control">
                      <select 
                        value={filters.category} 
                        onChange={(e) => handleFilterChange("category", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">All Categories</option>
                        {riskCategories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th onClick={() => handleSort("description")} className="sortable-header">
                    Description {sortField === "description" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("probability")} className="sortable-header">
                    Probability {sortField === "probability" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("impact")} className="sortable-header">
                    Impact {sortField === "impact" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("riskScore")} className="sortable-header">
                    <span className="header-text">Severity {sortField === "riskScore" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                    <div className="filter-control">
                      <select 
                        value={filters.riskScore} 
                        onChange={(e) => handleFilterChange("riskScore", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">All Severities</option>
                        <option value="low">Low (1-4)</option>
                        <option value="moderate">Moderate (5-9)</option>
                        <option value="high">High (10-16)</option>
                        <option value="extreme">Extreme (17-25)</option>
                      </select>
                    </div>
                  </th>
                  <th onClick={() => handleSort("timing")} className="sortable-header">
                    Likely Timing {sortField === "timing" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("trigger")} className="sortable-header">
                    Risk Trigger {sortField === "trigger" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("mitigationStrategy")} className="sortable-header">
                    Strategy {sortField === "mitigationStrategy" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("mitigationPlan")} className="sortable-header">
                    Mitigation Plan {sortField === "mitigationPlan" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("status")} className="sortable-header">
                    <span className="header-text">Status {sortField === "status" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                    <div className="filter-control">
                      <select 
                        value={filters.status} 
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">All Statuses</option>
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th onClick={() => handleSort("owner")} className="sortable-header">
                    <span className="header-text">Owner {sortField === "owner" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                    <div className="filter-control">
                      <input
                        type="text"
                        placeholder="Filter by owner"
                        value={filters.owner}
                        onChange={(e) => handleFilterChange("owner", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </th>
                  <th onClick={() => handleSort("notes")} className="sortable-header">
                    Other Notes {sortField === "notes" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  {isEditMode && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRisks.map((risk, index) => {
                  // Find the original index in the risks array
                  const originalIndex = risks.findIndex(r => 
                    r.riskId === risk.riskId && 
                    r.description === risk.description
                  );
                  
                  // Calculate background color for the row based on risk score
                  const rowStyle = risk.riskScore ? 
                    { backgroundColor: `${getCellBackgroundColor(Number(risk.riskScore))}20` } : // 20 = 12.5% opacity
                    {};
                  
                  // Check if this row is being edited
                  const isEditing = originalIndex === editingRiskIndex;

                  return (
                    <tr key={index} style={rowStyle}>
                      <td>{risk.riskId}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editingRisk.dateRaised || ''}
                            onChange={(e) => handleFieldChange('dateRaised', e.target.value)}
                          />
                        ) : (
                          new Date(risk.dateRaised).toLocaleDateString()
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editingRisk.category || ''}
                            onChange={(e) => handleFieldChange('category', e.target.value)}
                          >
                            <option value="">-- Select --</option>
                            {riskCategories.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        ) : (
                          risk.category
                        )}
                      </td>
                      <td className="description-cell">
                        {isEditing ? (
                          <textarea
                            value={editingRisk.description || ''}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            rows="4"
                          />
                        ) : (
                          <div className="cell-content">{risk.description}</div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editingRisk.probability || ''}
                            onChange={(e) => handleFieldChange('probability', e.target.value)}
                            style={{ 
                              width: '60px', 
                              padding: '0.375rem 0.5rem', 
                              textAlign: 'center',
                              fontWeight: '600',
                              margin: '0 auto',
                              display: 'block'
                            }}
                          >
                            <option value="">--</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>
                        ) : (
                          <div style={{ textAlign: 'center', fontWeight: '600' }}>{risk.probability}</div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editingRisk.impact || ''}
                            onChange={(e) => handleFieldChange('impact', e.target.value)}
                            style={{ 
                              width: '60px', 
                              padding: '0.375rem 0.5rem', 
                              textAlign: 'center',
                              fontWeight: '600',
                              margin: '0 auto',
                              display: 'block'
                            }}
                          >
                            <option value="">--</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>
                        ) : (
                          <div style={{ textAlign: 'center', fontWeight: '600' }}>{risk.impact}</div>
                        )}
                      </td>
                      <td className={getSeverityClassName(risk.riskScore)}>
                        {isEditing ? editingRisk.riskScore : risk.riskScore}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingRisk.timing || ''}
                            onChange={(e) => handleFieldChange('timing', e.target.value)}
                          />
                        ) : (
                          risk.timing
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingRisk.trigger || ''}
                            onChange={(e) => handleFieldChange('trigger', e.target.value)}
                          />
                        ) : (
                          risk.trigger
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editingRisk.mitigationStrategy || ''}
                            onChange={(e) => handleFieldChange('mitigationStrategy', e.target.value)}
                          >
                            <option value="">-- Select --</option>
                            {mitigationStrategies.map((strategy) => (
                              <option key={strategy} value={strategy}>{strategy}</option>
                            ))}
                          </select>
                        ) : (
                          risk.mitigationStrategy
                        )}
                      </td>
                      <td className="mitigation-cell">
                        {isEditing ? (
                          <textarea
                            value={editingRisk.mitigationPlan || ''}
                            onChange={(e) => handleFieldChange('mitigationPlan', e.target.value)}
                            rows="4"
                          />
                        ) : (
                          <div className="cell-content">{risk.mitigationPlan}</div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editingRisk.status || ''}
                            onChange={(e) => handleFieldChange('status', e.target.value)}
                          >
                            <option value="">-- Select --</option>
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`status-badge status-${risk.status?.toLowerCase().replace(/\s+/g, '-').replace('/', '-')}`}>
                            {risk.status}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingRisk.owner || ''}
                            onChange={(e) => handleFieldChange('owner', e.target.value)}
                          />
                        ) : (
                          risk.owner
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <textarea
                            value={editingRisk.notes || ''}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                            rows="3"
                            style={{ width: "180px", maxWidth: "180px" }}
                          />
                        ) : (
                          <div className="cell-content">{risk.notes}</div>
                        )}
                      </td>
                      {isEditMode && (
                        <td>
                          <div className="action-buttons">
                            {isEditing ? (
                              <>
                                <button 
                                  type="button" 
                                  className="btn-table-save" 
                                  onClick={handleSaveEdit}
                                >
                                  Save
                                </button>
                                <button 
                                  type="button" 
                                  className="btn-table-cancel" 
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  type="button" 
                                  className="btn-edit" 
                                  onClick={() => handleStartEdit(originalIndex)}
                                >
                                  Edit
                                </button>
                                <button 
                                  type="button" 
                                  className="btn-remove" 
                                  onClick={() => handleRemoveRisk(originalIndex)}
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {isEditMode && (
          <div className="table-controls">
            <button 
              type="button" 
              className="btn-add-risk"
              onClick={handleAddNewRisk}
            >
              + Add Risk
            </button>
          </div>
        )}
      </div>
    );
  };

  // Main component render
  return (
    <>
      <Navbar />
      <div className="view-risk-container">
        {loading ? (
          <div className="loading-spinner">Loading Risk Register...</div>
        ) : error ? (
          <div className="error-text">{error}</div>
        ) : (
          <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header with project name and control buttons */}
            <div className="view-risk-header">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1>Risk Register: {projectName}</h1>
                  <p className="text-gray-600">
                    {isEditMode ? "Edit Mode - Make changes and save when done" : "View Mode - Risk insights and analysis"}
                  </p>
                </div>
                <div className="button-group">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleBackToProject}
                  >
                    ← Back to Project
                  </button>
                  
                  {isEditMode ? (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSave}
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={toggleEditMode}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={toggleEditMode}
                    >
                      Edit Risk Register
                    </button>
                  )}
                </div>
              </div>
              
              {/* Success or error messages */}
              {message && <div className="success-text">{message}</div>}
              {error && <div className="error-text">{error}</div>}
            </div>
            
            {/* Layout - Two column approach */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left column - Risk Register Table (70% width) */}
              <div className="lg:w-8/12">
                <div className="section-box">
                  {/* Risk Table with Horizontal Scroll */}
                  <div className="overflow-x-auto">
                    <RiskTable />
                  </div>
                </div>
              </div>

              {/* Right column - Heat Map and Explanations (30% width) */}
              <div className="lg:w-4/12">
                {/* Heat Map and Risk Count Summary in a flexbox on larger screens */}
                <div className="heatmap-summary-container">
                  {/* Heat Map */}
                  <div className="section-box">
                    <h3 className="text-xl mb-4 font-semibold">Probability/Impact Heat Map</h3>
                    <RiskHeatMap />
                  </div>

                  {/* Risk Count Summary */}
                  <div className="section-box mt-6">
                    <h3 className="text-xl mb-4 font-semibold">Risk Count Summary</h3>
                    <RiskCountSummary />
                  </div>
                </div>

                {/* Column Explanations */}
                <div className="section-box mt-6">
                  <h3 className="text-xl mb-4 font-semibold">Column Explanations</h3>
                  <ColumnExplanations />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ViewRiskRegister;


