import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import Navbar from "../../components/Navbar";
import "./RiskRegisterTemplate.css";

const API_BASE = "http://localhost:5000/api";

// Function to calculate opacity based on severity score
const calculateOpacity = (severity) => {
  return 0.3 + ((severity - 1) / 24) * 0.7;
};

// Function to get cell background color based on severity
const getCellBackgroundColor = (severity) => {
  const score = Number(severity);
  // Low Risk (1-4): Light Blue
  if (score >= 1 && score <= 4) {
    return "rgba(62, 203, 245, 0.3)";
  }
  // Moderate Risk (5-9): Dark Blue
  else if (score >= 5 && score <= 9) {
    return "rgba(62, 203, 245, 0.7)";
  }
  // High Risk (10-16): Light Orange
  else if (score >= 10 && score <= 16) {
    return "rgba(245, 166, 35, 0.3)";
  }
  // Extreme Risk (17-25): Dark Orange
  else if (score >= 17 && score <= 25) {
    return "rgba(245, 166, 35, 0.7)";
  }
  return "transparent";
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
  'Technical',
  'Schedule',
  'Cost',
  'Resource',
  'Quality',
  'Scope',
  'Stakeholder',
  'Communication',
  'Regulatory',
  'External',
  'Organizational',
  'Business',
  'Security',
  'Other'
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

// Default empty risk object with all required fields
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

const RiskRegisterTemplate = () => {
  const navigate = useNavigate();

  // Toggle customization form visibility
  const [showCustomize, setShowCustomize] = useState(false);

  // Projects dropdown
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");

  // Risk Register: an array of risk items.
  const [risks, setRisks] = useState([]);
  
  // Loading & error states
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // For accordion-style column explanations
  const [expandedColumn, setExpandedColumn] = useState(null);

  // Filtering state
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    riskScore: "",
    owner: ""
  });
  
  // Global search state
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await projectsApi.fetchProjects();
        
        if (Array.isArray(response)) {
          setProjects(response);
        } else {
          setError('Failed to fetch projects. Unexpected response format.');
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to fetch projects. Please try again later.');
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Remove a risk
  const handleRemoveRisk = (index) => {
    if (window.confirm("Are you sure you want to remove this risk?")) {
      const updatedRisks = [...risks];
      updatedRisks.splice(index, 1);
      setRisks(updatedRisks);
    }
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

  // Risk Table component
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
      setEditingRiskIndex(index);
      setEditingRisk({...risks[index]});
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
    
    // Add a new risk directly to the table
    const handleAddNewRisk = () => {
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

    // If there are no risks, show an empty state message
    if (risks.length === 0) {
      return (
        <div className="empty-state">
          <p>No risks have been added yet.</p>
          <p>Click the "Add Risk" button below to create your first risk entry.</p>
          <button 
            type="button" 
            className="btn-add-risk"
            onClick={handleAddNewRisk}
          >
            + Add Risk
          </button>
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
              <button type="button" className="btn-clear-filters" onClick={() => {
                clearFilters();
                setSearchTerm("");
              }}>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRisks.map((risk, index) => {
                  // Calculate background color for the row based on risk score
                  const rowStyle = risk.riskScore ? 
                    { backgroundColor: `${getCellBackgroundColor(Number(risk.riskScore))}20` } : // 20 = 12.5% opacity
                    {};
                  
                  // Check if this row is being edited
                  const isEditing = index === editingRiskIndex;

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
                                onClick={() => handleStartEdit(index)}
                              >
                                Edit
                              </button>
                              <button 
                                type="button" 
                                className="btn-remove" 
                                onClick={() => handleRemoveRisk(index)}
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="table-controls">
          <button 
            type="button" 
            className="btn-add-risk"
            onClick={handleAddNewRisk}
          >
            + Add Risk
          </button>
        </div>
      </div>
    );
  };

  // Handle form submission to save Risk Register
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    
    if (!selectedProject) {
      setError('Please select a project to save this risk register');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);
      
      // Create a properly structured payload for consistency with other templates
      const riskRegisterData = {
        type: "RiskRegister",
        risks: risks.filter(risk => risk.riskId && risk.description), // Only include risks with at least an ID and description
        version: 1,
        updated_at: new Date().toISOString()
      };
      
      // Use the high-level update function for better error handling
      console.log(`Saving Risk Register to project: ${selectedProject}`);
      await projectsApi.updateRiskRegister(selectedProject, riskRegisterData);
      
      setMessage("Risk Register saved successfully!");
      
      // Redirect to project details after short delay
      setTimeout(() => {
        navigate(`/projects/${selectedProject}`);
      }, 2000);
    } catch (error) {
      console.error('Error saving risk register:', error);
      setError(`Failed to save Risk Register: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Template Overview */}
        {!showCustomize && (
          <div className="template-initial-view">
            <div className="template-content">
              <h1 className="template-title">Risk Register</h1>
            <p className="template-description">
                The Risk Register template helps you identify, track, and manage potential project risks throughout the lifecycle of your project.
              </p>
              <button 
                className="template-customize-btn" 
                onClick={() => setShowCustomize(true)}
              >
                Customize Risk Register
            </button>
            </div>
          </div>
        )}

        {/* Customization Form */}
        {showCustomize && (
          <div className="w-full" style={{ paddingTop: "10px" }}>
            <h2 className="text-2xl mb-4">Customize Risk Register</h2>
            <p className="mb-6">Select a project to store this Risk Register, then add risk entries below.</p>

            {error && <div className="error-text">{error}</div>}
            {message && <div className="success-text">{message}</div>}

            {/* Project Selection */}
            <div className="w-full mb-6">
              <label htmlFor="projectSelect" className="font-semibold">Select Project:</label>
                {loadingProjects ? (
                  <p>Loading projects...</p>
                ) : (
                  <select
                    id="projectSelect"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full mt-2 p-2 border rounded"
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map((proj) => (
                      <option key={proj._id} value={proj._id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

            <form onSubmit={handleSave} className="w-full space-y-8">
              {/* Layout - Two column approach */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left column - Risk Register Form (70% width) */}
                <div className="lg:w-8/12">
                  <div className="section-box">
                    <h3 className="text-xl mb-4 font-semibold"></h3>
                    
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

              {/* Form Actions - Save & Cancel buttons */}
              <div className="flex justify-end space-x-4 mt-8 mb-8">
                <button type="submit" className="btn-save-1">
                  Save Risk Register
                </button>
                <button
                  type="button"
                  className="btn-cancel-1"
                  onClick={() => setShowCustomize(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default RiskRegisterTemplate;