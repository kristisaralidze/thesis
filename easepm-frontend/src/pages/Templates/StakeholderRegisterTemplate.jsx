// src/pages/StakeholderRegisterTemplate.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import Navbar from "../../components/Navbar";
import StakeholderMatrix from './StakeholderMatrix';
import "./StakeholderRegisterTemplate.css";

const API_BASE = "http://localhost:5000/api";

// Default empty stakeholder object with all required fields
const getEmptyStakeholder = () => ({
  stakeholderNumber: "",
  name: "",
  organization: "",
  role: "",
  influence: "",
  interest: "",
  contactPhone: "",
  contactEmail: "",
  category: "internal", // Default value
  address: "",
  mainRequirements: "",
  mainExpectations: "",
  engagementStrategy: "",
  commsFrequency: "As Needed / On Demand", // Default value
  commsChannels: "Email", // Default value
  concerns: ""
});

// Category options
const categoryOptions = ["internal", "external"];

// Communication frequency options
const commsFrequencyOptions = [
  "Hourly", 
  "Daily", 
  "Every Other Day", 
  "Weekly", 
  "Bi-Weekly", 
  "Monthly", 
  "Quarterly", 
  "Semi-Annually", 
  "Annually", 
  "As Needed / On Demand"
];

// Communication channels options
const commsChannelsOptions = [
  "Email", 
  "Phone (Voice Call)", 
  "In-Person Meetings", 
  "Video Conferencing (e.g., Zoom)", 
  "Instant Messaging / Chat", 
  "SMS / Text Messaging", 
  "Social Media Messaging", 
  "Postal Mail", 
  "Fax", 
  "Web Conferencing", 
  "Collaboration Platforms (e.g., Slack, Microsoft Teams)", 
  "Other"
];

const StakeholderRegisterTemplate = () => {
  const navigate = useNavigate();

  // Toggle for showing the customization form
  const [showCustomize, setShowCustomize] = useState(false);

  // Projects dropdown
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");

  // Stakeholder Register data: an array of stakeholder entries.
  const [stakeholders, setStakeholders] = useState([]);
  
  // Communication plan state
  const [communicationPlan, setCommunicationPlan] = useState({});
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await projectsApi.fetchProjects();
        // Handle different response formats
        if (Array.isArray(response)) {
          setProjects(response);
        } else if (response && Array.isArray(response.data)) {
          setProjects(response.data);
        } else {
          setProjects([]);
        }
        setLoadingProjects(false);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again.");
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Stakeholder Table component
  const StakeholderTable = () => {
    // State to track which stakeholder is being edited (if any)
    const [editingStakeholderIndex, setEditingStakeholderIndex] = useState(null);
    
    // If editing a stakeholder, we'll store a temporary copy here for editing
    const [editingStakeholder, setEditingStakeholder] = useState(null);
    
    // Sorting state
    const [sortField, setSortField] = useState("stakeholderNumber");
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
    
    // Email validation
    const validateEmail = (email) => {
      return String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    };
    
    // Phone validation
    const validatePhone = (phone) => {
      return String(phone).match(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/);
    };
    
    // Function to handle filtering
    const [filters, setFilters] = useState({
      organization: "",
      role: "",
      category: "",
      commsFrequency: ""
    });
    
    const handleFilterChange = (field, value) => {
      setFilters({
        ...filters,
        [field]: value
      });
    };
    
    // Function to clear all filters
    const clearFilters = () => {
      setFilters({
        organization: "",
        role: "",
        category: "",
        commsFrequency: ""
      });
    };
    
    // Global search state
    const [searchTerm, setSearchTerm] = useState("");
    
    // Get sorted and filtered stakeholders
    const getSortedAndFilteredStakeholders = () => {
      // First, filter the stakeholders
      let filteredStakeholders = [...stakeholders];
      
      // Apply global search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredStakeholders = filteredStakeholders.filter(stakeholder => {
          // Search across all string fields
          return Object.keys(stakeholder).some(key => {
            if (typeof stakeholder[key] === 'string') {
              return stakeholder[key].toLowerCase().includes(searchLower);
            }
            return false;
          });
        });
      }
      
      if (filters.organization) {
        filteredStakeholders = filteredStakeholders.filter(stakeholder => 
          stakeholder.organization.toLowerCase().includes(filters.organization.toLowerCase())
        );
      }
      
      if (filters.role) {
        filteredStakeholders = filteredStakeholders.filter(stakeholder => 
          stakeholder.role.toLowerCase().includes(filters.role.toLowerCase())
        );
      }
      
      if (filters.category) {
        filteredStakeholders = filteredStakeholders.filter(stakeholder => 
          stakeholder.category === filters.category
        );
      }
      
      if (filters.commsFrequency) {
        filteredStakeholders = filteredStakeholders.filter(stakeholder => 
          stakeholder.commsFrequency === filters.commsFrequency
        );
      }
      
      // Then, sort the filtered stakeholders
      filteredStakeholders.sort((a, b) => {
        let valueA = a[sortField];
        let valueB = b[sortField];
        
        // Special handling for numeric fields
        if (["stakeholderNumber", "influence", "interest"].includes(sortField)) {
          valueA = Number(valueA) || 0;
          valueB = Number(valueB) || 0;
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
      
      return filteredStakeholders;
    };
    
    // Start editing a stakeholder
    const handleStartEdit = (index) => {
      setEditingStakeholderIndex(index);
      setEditingStakeholder({...stakeholders[index]});
    };
    
    // Cancel editing a stakeholder
    const handleCancelEdit = () => {
      setEditingStakeholderIndex(null);
      setEditingStakeholder(null);
    };
    
    // Save edited stakeholder
    const handleSaveEdit = () => {
      if (editingStakeholder) {
        const updatedStakeholders = [...stakeholders];
        updatedStakeholders[editingStakeholderIndex] = editingStakeholder;
        setStakeholders(updatedStakeholders);
        setEditingStakeholderIndex(null);
        setEditingStakeholder(null);
      }
    };
    
    // Handle field change with validation for email and phone
    const handleFieldChange = (field, value) => {
      if (editingStakeholder) {
        const updatedStakeholder = {...editingStakeholder};
        
        // Special validation for email and phone
        if (field === 'contactEmail') {
          // Store the value regardless of validation to allow for partial input
          updatedStakeholder[field] = value;
          
          // If there's a value and it doesn't validate, we'd handle this in the UI
          // by showing an error message rather than preventing input
        } else if (field === 'contactPhone') {
          // Store the value regardless of validation to allow for partial input
          updatedStakeholder[field] = value;
          
          // Similar approach for phone - allow input but show validation in UI
        } else {
          updatedStakeholder[field] = value;
        }
        
        setEditingStakeholder(updatedStakeholder);
      }
    };
    
    // Add a new stakeholder directly to the table
    const handleAddNewStakeholder = () => {
      // Generate a simple stakeholder ID based on existing stakeholders
      let maxId = 0;
      stakeholders.forEach(stakeholder => {
        const stakeholderIdNumber = parseInt(stakeholder.stakeholderNumber, 10);
        if (!isNaN(stakeholderIdNumber) && stakeholderIdNumber > maxId) {
          maxId = stakeholderIdNumber;
        }
      });
      
      const newStakeholder = {
        ...getEmptyStakeholder(),
        stakeholderNumber: (maxId + 1).toString()
      };
      
      const newStakeholders = [...stakeholders, newStakeholder];
      setStakeholders(newStakeholders);
      
      // Start editing the new stakeholder
      const newIndex = newStakeholders.length - 1;
      handleStartEdit(newIndex);
    };

    // If there are no stakeholders, show an empty state message
    if (stakeholders.length === 0) {
      return (
        <div className="empty-state">
          <p>No stakeholders have been added yet.</p>
          <p>Click the "Add Stakeholder" button below to create your first stakeholder entry.</p>
          <button 
            type="button" 
            className="btn-add-stakeholder"
            onClick={handleAddNewStakeholder}
            style={{ 
              backgroundColor: '#f5a623',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s ease',
              ':hover': {
                backgroundColor: '#e69512'
              }
            }}
          >
            + Add Stakeholder
          </button>
        </div>
      );
    }

    // Get filtered and sorted stakeholders
    const filteredStakeholders = getSortedAndFilteredStakeholders();

    return (
      <div>
        <div className="table-header">
          <h3 className="table-title">Stakeholder Register Table</h3>
          <p className="table-subtitle">Manage, track, and prioritize project stakeholders</p>
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
            {(filters.organization || filters.role || filters.category || filters.commsFrequency || searchTerm) && (
              <button type="button" className="btn-clear-filters" onClick={() => {
                clearFilters();
                setSearchTerm("");
              }}>
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {(filters.organization || filters.role || filters.category || filters.commsFrequency || searchTerm) && (
          <div className="results-count">
            Showing {filteredStakeholders.length} of {stakeholders.length} stakeholders
          </div>
        )}

        {filteredStakeholders.length === 0 ? (
          <div className="no-results-message">
            <p>No matching stakeholders found.</p>
            <p>Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="stakeholder-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("stakeholderNumber")} className="sortable-header">
                    Number {sortField === "stakeholderNumber" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("name")} className="sortable-header">
                    Stakeholder Name {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("organization")} className="sortable-header">
                    <span className="header-text">Organization/Department {sortField === "organization" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                    <div className="filter-control">
                      <input
                        type="text"
                        placeholder="Filter by organization"
                        value={filters.organization}
                        onChange={(e) => handleFilterChange("organization", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </th>
                  <th onClick={() => handleSort("role")} className="sortable-header">
                    <span className="header-text">Role(s) in Project {sortField === "role" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                    <div className="filter-control">
                      <input
                        type="text"
                        placeholder="Filter by role"
                        value={filters.role}
                        onChange={(e) => handleFilterChange("role", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </th>
                  <th onClick={() => handleSort("influence")} className="sortable-header">
                    Influence (1-5) {sortField === "influence" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("interest")} className="sortable-header">
                    Interest (1-5) {sortField === "interest" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("contactPhone")} className="sortable-header">
                    Contact Phone {sortField === "contactPhone" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("contactEmail")} className="sortable-header">
                    Contact Email {sortField === "contactEmail" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("category")} className="sortable-header">
                    <span className="header-text">Category {sortField === "category" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                    <div className="filter-control">
                      <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange("category", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">All Categories</option>
                        {categoryOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th onClick={() => handleSort("address")} className="sortable-header">
                    Address {sortField === "address" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("mainRequirements")} className="sortable-header">
                    Main Requirements {sortField === "mainRequirements" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("mainExpectations")} className="sortable-header">
                    Main Expectations {sortField === "mainExpectations" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("engagementStrategy")} className="sortable-header">
                    Engagement Strategy {sortField === "engagementStrategy" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("commsFrequency")} className="sortable-header">
                    <span className="header-text">Comms Frequency {sortField === "commsFrequency" && (sortDirection === "asc" ? "▲" : "▼")}</span>
                    <div className="filter-control">
                      <select
                        value={filters.commsFrequency}
                        onChange={(e) => handleFilterChange("commsFrequency", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">All Frequencies</option>
                        {commsFrequencyOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th onClick={() => handleSort("commsChannels")} className="sortable-header">
                    Comms Channels {sortField === "commsChannels" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("concerns")} className="sortable-header">
                    Concerns {sortField === "concerns" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStakeholders.map((stakeholder, index) => {
                  // Check if this row is being edited
                  const isEditing = index === editingStakeholderIndex;
                  
                  // Email validation state
                  const isEmailValid = !editingStakeholder?.contactEmail || validateEmail(editingStakeholder?.contactEmail);
                  
                  // Phone validation state
                  const isPhoneValid = !editingStakeholder?.contactPhone || validatePhone(editingStakeholder?.contactPhone);

                  return (
                    <tr 
                      key={index}
                    >
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingStakeholder.stakeholderNumber || ''}
                            onChange={(e) => handleFieldChange('stakeholderNumber', e.target.value)}
                            style={{ width: '60px' }}
                          />
                        ) : (
                          stakeholder.stakeholderNumber
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingStakeholder.name || ''}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                          />
                        ) : (
                          stakeholder.name
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingStakeholder.organization || ''}
                            onChange={(e) => handleFieldChange('organization', e.target.value)}
                          />
                        ) : (
                          stakeholder.organization
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingStakeholder.role || ''}
                            onChange={(e) => handleFieldChange('role', e.target.value)}
                          />
                        ) : (
                          stakeholder.role
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editingStakeholder.influence || ''}
                            onChange={(e) => handleFieldChange('influence', e.target.value)}
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
                          <div style={{ textAlign: 'center', fontWeight: '600' }}>{stakeholder.influence}</div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editingStakeholder.interest || ''}
                            onChange={(e) => handleFieldChange('interest', e.target.value)}
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
                          <div style={{ textAlign: 'center', fontWeight: '600' }}>{stakeholder.interest}</div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="validation-input">
                            <input
                              type="tel"
                              value={editingStakeholder.contactPhone || ''}
                              onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                              className={!isPhoneValid ? 'invalid-input' : ''}
                            />
                            {!isPhoneValid && editingStakeholder.contactPhone && (
                              <div className="validation-error">Invalid phone format</div>
                            )}
                          </div>
                        ) : (
                          stakeholder.contactPhone
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="validation-input">
                            <input
                              type="email"
                              value={editingStakeholder.contactEmail || ''}
                              onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                              className={!isEmailValid ? 'invalid-input' : ''}
                            />
                            {!isEmailValid && editingStakeholder.contactEmail && (
                              <div className="validation-error">Invalid email format</div>
                            )}
                          </div>
                        ) : (
                          stakeholder.contactEmail
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editingStakeholder.category || 'internal'}
                            onChange={(e) => handleFieldChange('category', e.target.value)}
                          >
                            {categoryOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          stakeholder.category
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingStakeholder.address || ''}
                            onChange={(e) => handleFieldChange('address', e.target.value)}
                          />
                        ) : (
                          stakeholder.address
                        )}
                      </td>
                      <td className="requirements-cell">
                        {isEditing ? (
                          <textarea
                            value={editingStakeholder.mainRequirements || ''}
                            onChange={(e) => handleFieldChange('mainRequirements', e.target.value)}
                            rows="3"
                          />
                        ) : (
                          <div className="cell-content">{stakeholder.mainRequirements}</div>
                        )}
                      </td>
                      <td className="expectations-cell">
                        {isEditing ? (
                          <textarea
                            value={editingStakeholder.mainExpectations || ''}
                            onChange={(e) => handleFieldChange('mainExpectations', e.target.value)}
                            rows="3"
                          />
                        ) : (
                          <div className="cell-content">{stakeholder.mainExpectations}</div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <textarea
                            value={editingStakeholder.engagementStrategy || ''}
                            onChange={(e) => handleFieldChange('engagementStrategy', e.target.value)}
                            rows="3"
                          />
                        ) : (
                          <div className="cell-content">{stakeholder.engagementStrategy}</div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editingStakeholder.commsFrequency || 'As Needed / On Demand'}
                            onChange={(e) => handleFieldChange('commsFrequency', e.target.value)}
                          >
                            {commsFrequencyOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          stakeholder.commsFrequency
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editingStakeholder.commsChannels || 'Email'}
                            onChange={(e) => handleFieldChange('commsChannels', e.target.value)}
                          >
                            {commsChannelsOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          stakeholder.commsChannels
                        )}
                      </td>
                      <td className="concerns-cell">
                        {isEditing ? (
                          <textarea
                            value={editingStakeholder.concerns || ''}
                            onChange={(e) => handleFieldChange('concerns', e.target.value)}
                            rows="3"
                          />
                        ) : (
                          <div className="cell-content">{stakeholder.concerns}</div>
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
                                disabled={!isEmailValid || !isPhoneValid}
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
                                onClick={() => handleRemoveStakeholder(index)}
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
            className="btn-add-stakeholder"
            onClick={handleAddNewStakeholder}
            style={{ 
              backgroundColor: '#f5a623',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s ease',
              ':hover': {
                backgroundColor: '#e69512'
              }
            }}
          >
            + Add Stakeholder
          </button>
        </div>
      </div>
    );
  };

  // Remove a stakeholder
  const handleRemoveStakeholder = (index) => {
    if (window.confirm("Are you sure you want to remove this stakeholder?")) {
      const updatedStakeholders = [...stakeholders];
      updatedStakeholders.splice(index, 1);
      setStakeholders(updatedStakeholders);
    }
  };

  // Handle form submission
  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validation - make sure a project is selected
    if (!selectedProject) {
      setError("Please select a project to save the Stakeholder Register");
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      console.log(`DEBUG: First getting project details to verify ID format`);
      try {
        const projectDetails = await projectsApi.fetchProjectById(selectedProject);
        console.log(`DEBUG: Successfully retrieved project details:`, projectDetails);
        // Now we know this project exists and we have its correct ID
      } catch (projectErr) {
        console.log(`DEBUG: Error getting project: ${projectErr.message}, will try to save anyway`);
      }
      
      // Create the stakeholder register payload with proper structure (no content wrapper)
      const stakeholderRegisterData = {
        type: "StakeholderRegister",
        stakeholders: stakeholders,
        communicationPlan: communicationPlan,
        version: 1,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      console.log(`DEBUG: Stakeholder data contains ${stakeholders.length} stakeholders`);
      console.log(`DEBUG: Calling updateStakeholderRegister API with project ID: ${selectedProject}`);
      
      const response = await projectsApi.updateStakeholderRegister(selectedProject, stakeholderRegisterData);
      
      console.log(`DEBUG: Received successful response:`, response);
      setMessage("Stakeholder Register saved successfully!");
      setLoading(false);
      
      // Redirect to project details after short delay
      setTimeout(() => {
        navigate(`/projects/${selectedProject}`);
      }, 2000);
      
    } catch (err) {
      console.error("Error saving Stakeholder Register:", err);
      console.log(`DEBUG: Error type: ${err.name}, message: ${err.message}`);
      if (err.stack) {
        console.log(`DEBUG: Error stack: ${err.stack}`);
      }
      
      // If it's a project not found error, try to fetch all projects and find a match
      if (err.message && err.message.includes("Project not found")) {
        try {
          console.log(`DEBUG: Project not found, trying to fetch all projects to find a match`);
          const allProjects = await projectsApi.fetchProjects();
          console.log(`DEBUG: Got ${allProjects.length} projects`);
          
          // Find the project by name or ID 
          const projectMatch = allProjects.find(p => 
            p._id === selectedProject || 
            p.id === selectedProject ||
            p.name === projects.find(proj => proj._id === selectedProject)?.name
          );
          
          if (projectMatch) {
            console.log(`DEBUG: Found matching project with ID: ${projectMatch._id || projectMatch.id}`);
            // Try again with the correct ID
            const correctId = projectMatch._id || projectMatch.id;
            if (correctId !== selectedProject) {
              console.log(`DEBUG: Trying again with correct ID: ${correctId}`);
              const secondResponse = await projectsApi.updateStakeholderRegister(correctId, {
                type: "StakeholderRegister",
                stakeholders: stakeholders,
                communicationPlan: communicationPlan,
                version: 1,
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString()
              });
              
              console.log(`DEBUG: Second attempt successful:`, secondResponse);
              setMessage("Stakeholder Register saved successfully!");
              setLoading(false);
              
              // Redirect to project details after short delay
              setTimeout(() => {
                navigate(`/projects/${correctId}`);
              }, 2000);
              return;
            }
          }
        } catch (secondErr) {
          console.log(`DEBUG: Second attempt also failed: ${secondErr.message}`);
        }
      }
      
      let errorMessage = "Failed to save Stakeholder Register. Please try again.";
      
      // If it's a project not found error, provide more helpful message
      if (err.message && err.message.includes("Project not found")) {
        errorMessage = "Project not found. Please select a different project or refresh the page.";
      }
      
      setError(errorMessage);
      setLoading(false);
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
              <h1 className="template-title">Stakeholder Register</h1>
            <p className="template-description">
              A Stakeholder Register identifies, categorizes, and manages individuals and organizations that can impact or be impacted by the project. It is essential for planning communication and engagement.
            </p>
              <button 
                className="template-customize-btn" 
                onClick={() => setShowCustomize(true)}
              >
                Customize Stakeholder Register
            </button>
            </div>
          </div>
        )}

        {/* Customization Form */}
        {showCustomize && (
          <div className="customization-section">
            <h2>Customize Stakeholder Register</h2>
            <p>Select a project to store this Stakeholder Register, then add or update stakeholder entries below.</p>

            {error && <div className="error-text">{error}</div>}
            {message && <div className="success-text">{message}</div>}

            <form onSubmit={handleSave} className="stakeholder-form">
              {/* Project selection */}
              <div className="form-group">
                <label htmlFor="projectSelect">Select Project:</label>
                {loadingProjects ? (
                  <p>Loading projects...</p>
                ) : (
                  <select
                    id="projectSelect"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="project-select"
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

              {/* Main content layout with two sections */}
              <div className="main-content-layout">
                {/* Left section: Stakeholder Register */}
                <div className="stakeholder-register-section">
                  <div className="section-header">
                    <h3>Stakeholder Register</h3>
                    <p>Add and manage your project stakeholders</p>
                  </div>
                  
                  {/* Replace placeholder with actual Stakeholder Table */}
                  <StakeholderTable />
                </div>

                {/* Right section: Stakeholder Matrix */}
                <div className="stakeholder-matrix-section">
                  <div className="section-header">
                    <h3>Stakeholder Matrix</h3>
                    <p>Visualize stakeholders by influence and interest</p>
                  </div>
                  
                  <StakeholderMatrix stakeholders={stakeholders} />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="stakeholder-btn-save">Save Stakeholder Register</button>
                <button type="button" className="stakeholder-btn-cancel" onClick={() => setShowCustomize(false)}>
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

export default StakeholderRegisterTemplate;
