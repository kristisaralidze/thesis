    // src/pages/Documents/ViewStakeholderRegister.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as projectsApi from "../../api/projects"; // Import projectsApi
import Navbar from "../../components/Navbar";
import "./ViewStakeholderRegister.css"; // Create and adjust this CSS file as needed

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

const ViewStakeholderRegister = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // State variables
  const [stakeholders, setStakeholders] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [registerData, setRegisterData] = useState(null);
  const [communicationPlan, setCommunicationPlan] = useState({
    frequency: "As Needed",
    channels: [],
    notes: ""
  });

  // Function to fetch stakeholder register data
  const fetchStakeholderRegister = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching stakeholder register for project:', projectId);
      
      // Use the API function from the projects service
      const response = await projectsApi.fetchStakeholderRegister(projectId);
      console.log('Fetched stakeholder register data:', response);
      
      // Store the whole response
      setRegisterData(response);
      
      // Handle different possible data structures
      let stakeholderData;
      
      if (response) {
        if (response.data) {
          // Standard API response
          const data = response.data;
          
          if (data === null) {
            // No register exists yet
            console.log('No Stakeholder Register data found');
            setLoading(false);
            return;
          }
          
          // Check for content wrapper (this is how newer documents are structured)
          if (data.content) {
            stakeholderData = data.content;
            console.log('Using response.data.content format');
          } else {
            // Older format or direct data
            stakeholderData = data;
            console.log('Using response.data format directly');
          }
        } else if (response.content) {
          // Direct response with content field
          stakeholderData = response.content;
          console.log('Using response.content format');
        } else {
          // Direct document without nesting
          stakeholderData = response;
          console.log('Using direct document format');
        }
      } else {
        console.warn('Empty response received');
        setLoading(false);
        return;
      }
      
      // Make sure we actually have data at this point
      if (!stakeholderData) {
        console.warn('No stakeholder data could be extracted from the response');
        setLoading(false);
        return;
      }
      
      // Set stakeholders data
      if (Array.isArray(stakeholderData.stakeholders)) {
        setStakeholders(stakeholderData.stakeholders);
      } else {
        // Handle case where stakeholders might be in a different location
        if (Array.isArray(response.stakeholders)) {
          setStakeholders(response.stakeholders);
        } else if (response.data && Array.isArray(response.data.stakeholders)) {
          setStakeholders(response.data.stakeholders);
        } else {
          console.warn('No stakeholders array found in the response');
          setStakeholders([]);
        }
      }
      
      // Set communication plan data if it exists
      if (stakeholderData.communicationPlan) {
        setCommunicationPlan(stakeholderData.communicationPlan);
      } else {
        // Default empty communication plan
        setCommunicationPlan({
          frequency: "As Needed",
          channels: [],
          notes: ""
        });
      }
    } catch (err) {
      console.error("Error fetching Stakeholder Register:", err);
      setError("Failed to load Stakeholder Register. Please try again later.");
      setStakeholders([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch the existing Stakeholder Register on mount
  useEffect(() => {
    fetchStakeholderRegister();
  }, [fetchStakeholderRegister]);

  // Handler to update a stakeholder field in edit mode
  const handleStakeholderChange = (index, field, value) => {
    const updated = [...stakeholders];
    updated[index][field] = value;
    setStakeholders(updated);
  };

  // Handler to add a new stakeholder row
  const handleAddStakeholder = () => {
    setStakeholders([
      ...stakeholders,
      {
        stakeholderName: "",
        roleTitle: "",
        contactInfo: "",
        influenceInterest: "",
        requirements: "",
        communicationNeeds: "",
        engagementStrategy: "",
        comments: ""
      }
    ]);
  };

  // Handler to remove a stakeholder row
  const handleRemoveStakeholder = (index) => {
    const updated = stakeholders.filter((_, i) => i !== index);
    setStakeholders(updated);
  };

  // Save updated Stakeholder Register
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      // Calculate current version
      let currentVersion = 1;
      if (registerData) {
        // Try to find version in all possible locations
        if (registerData.version) {
          currentVersion = registerData.version;
        } else if (registerData.data?.version) {
          currentVersion = registerData.data.version;
        } else if (registerData.content?.version) {
          currentVersion = registerData.content.version;
        }
        currentVersion = (parseInt(currentVersion) || 0) + 1;
      }
      
      // Create the payload to match what StakeholderRegisterTemplate.jsx does
      const stakeholderRegisterData = {
        type: "StakeholderRegister",
        stakeholders: stakeholders,
        communicationPlan: communicationPlan,
        version: currentVersion,
        updated_at: new Date().toISOString()
      };
      
      // Add created_at if this is the first version
      if (currentVersion === 1) {
        stakeholderRegisterData.created_at = new Date().toISOString();
      } else if (registerData && registerData.data && registerData.data.created_at) {
        // Preserve created_at from the original data
        stakeholderRegisterData.created_at = registerData.data.created_at;
      }
      
      // Use the API function from the projects service
      console.log(`Updating Stakeholder Register for project: ${projectId}`);
      console.log('Payload:', JSON.stringify(stakeholderRegisterData, null, 2));
      
      await projectsApi.updateStakeholderRegister(projectId, stakeholderRegisterData);
      
      // Refresh data
      await fetchStakeholderRegister();
      
      setIsEditMode(false);
      setMessage("Stakeholder Register updated successfully!");
    } catch (err) {
      console.error("Error saving Stakeholder Register:", err);
      setError(`Failed to save Stakeholder Register: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit mode by re-fetching the original data
  const handleCancel = () => {
    fetchStakeholderRegister();
    setIsEditMode(false);
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

  // Stakeholder Table component for both view and edit modes
  const StakeholderTable = () => {
    // State to track which stakeholder is being edited (if any)
    const [editingStakeholderIndex, setEditingStakeholderIndex] = useState(null);
    
    // If editing a stakeholder, we'll store a temporary copy here for editing
    const [editingStakeholder, setEditingStakeholder] = useState(null);
    
    // Sorting state
    const [sortField, setSortField] = useState("stakeholderNumber");
    const [sortDirection, setSortDirection] = useState("asc");
    
    // Filtering state
    const [filters, setFilters] = useState({
      organization: "",
      role: "",
      category: "",
      commsFrequency: ""
    });
    
    // Global search state
    const [searchTerm, setSearchTerm] = useState("");
    
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
      setSearchTerm("");
    };
    
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
      if (isEditMode) {
        setEditingStakeholderIndex(index);
        setEditingStakeholder({...stakeholders[index]});
      }
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
    
    // Update a field in the editing stakeholder
    const handleFieldChange = (field, value) => {
      if (editingStakeholder) {
        const updatedStakeholder = {...editingStakeholder};
        updatedStakeholder[field] = value;
        setEditingStakeholder(updatedStakeholder);
      }
    };
    
    // Add a new stakeholder
    const handleAddNewStakeholder = () => {
      // Only allow adding stakeholders in edit mode
      if (!isEditMode) return;
      
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
    
    // Remove a stakeholder
    const handleRemoveStakeholder = (index) => {
      if (!isEditMode) return;
      
      if (window.confirm("Are you sure you want to remove this stakeholder?")) {
        const updatedStakeholders = [...stakeholders];
        updatedStakeholders.splice(index, 1);
        setStakeholders(updatedStakeholders);
      }
    };

    // If there are no stakeholders, show an empty state message
    if (stakeholders.length === 0) {
      return (
        <div className="empty-state">
          <p>No stakeholders have been added yet.</p>
          {isEditMode && (
            <>
              <p>Click the "Add Stakeholder" button below to create your first stakeholder entry.</p>
              <button 
                type="button" 
                className="btn-add-stakeholder"
                onClick={handleAddNewStakeholder}
              >
                + Add Stakeholder
              </button>
            </>
          )}
          {!isEditMode && (
            <p>This stakeholder register is empty. Switch to edit mode to add stakeholders.</p>
          )}
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
              <button type="button" className="btn-clear-filters" onClick={clearFilters}>
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
                  {isEditMode && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredStakeholders.map((stakeholder, index) => {
                  // Find the original index in the stakeholders array
                  const originalIndex = stakeholders.findIndex(s => 
                    s.stakeholderNumber === stakeholder.stakeholderNumber && 
                    s.name === stakeholder.name
                  );
                  
                  // Check if this row is being edited
                  const isEditing = originalIndex === editingStakeholderIndex;
                  
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
                      {isEditMode && (
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
                                  onClick={() => handleStartEdit(originalIndex)}
                                >
                                  Edit
                                </button>
                                <button 
                                  type="button" 
                                  className="btn-remove" 
                                  onClick={() => handleRemoveStakeholder(originalIndex)}
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
              className="btn-add-stakeholder"
              onClick={handleAddNewStakeholder}
            >
              + Add Stakeholder
            </button>
          </div>
        )}
      </div>
    );
  };

  // StakeholderMatrix component
  const StakeholderMatrix = () => {
    const CONTAINER_SIZE = 500; // Fixed size for the matrix
    const CELL_SIZE = CONTAINER_SIZE / 5;
    const ICON_SIZE = 20;
  
    // Calculate stakeholder position
    const calculatePosition = (interest, influence) => {
      if (!interest || !influence) return null;
      
      // Calculate centered positions within cells
      const x = (Number(interest) - 0.5) * CELL_SIZE - (ICON_SIZE / 2);
      const y = (5 - Number(influence) + 0.5) * CELL_SIZE - (ICON_SIZE / 2);
      
      return { x, y };
    };
  
    // Get quadrant label based on position
    const getQuadrantLabel = (influence, interest) => {
      const highInfluence = Number(influence) >= 3;
      const highInterest = Number(interest) >= 3;
  
      if (highInfluence && highInterest) return "Manage Closely";
      if (highInfluence && !highInterest) return "Keep Satisfied";
      if (!highInfluence && highInterest) return "Keep Informed";
      return "Monitor";
    };
  
    // Get stakeholder initials
    const getInitials = (name) => {
      if (!name) return "?";
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };
  
    return (
      <div className="stakeholder-matrix-container">
        {/* Matrix Title */}
        <h3 className="matrix-title">Stakeholder Influence-Interest Matrix</h3>
        
        {/* Matrix Container */}
        <div className="matrix-wrapper">
          {/* Y-Axis Label */}
          <div className="y-axis-label">Influence</div>
          
          {/* Matrix Grid */}
          <div 
            className="matrix-grid" 
            style={{ 
              width: CONTAINER_SIZE, 
              height: CONTAINER_SIZE 
            }}
          >
            {/* Quadrant Labels */}
            <div className="quadrant-labels">
              <div className="quadrant-label top-left">Keep Satisfied</div>
              <div className="quadrant-label top-right">Manage Closely</div>
              <div className="quadrant-label bottom-left">Monitor</div>
              <div className="quadrant-label bottom-right">Keep Informed</div>
            </div>
  
            {/* Grid Lines */}
            <div className="grid-lines">
              {[...Array(6)].map((_, i) => (
                <React.Fragment key={i}>
                  <div 
                    className="grid-line horizontal" 
                    style={{ top: `${i * 20}%` }} 
                  />
                  <div 
                    className="grid-line vertical" 
                    style={{ left: `${i * 20}%` }} 
                  />
                </React.Fragment>
              ))}
            </div>
  
            {/* Axis Values */}
            <div className="axis-values">
              {/* X-Axis Values */}
              {[1, 2, 3, 4, 5].map(value => (
                <div 
                  key={`x-${value}`}
                  className="x-axis-value"
                  style={{ left: `${(value - 0.5) * 20}%` }}
                >
                  {value}
                </div>
              ))}
              {/* Y-Axis Values */}
              {[1, 2, 3, 4, 5].map(value => (
                <div 
                  key={`y-${value}`}
                  className="y-axis-value"
                  style={{ top: `${(5 - value + 0.5) * 20}%` }}
                >
                  {value}
                </div>
              ))}
            </div>
  
            {/* Stakeholder Icons */}
            {stakeholders.map((stakeholder, index) => {
              const position = calculatePosition(stakeholder.interest, stakeholder.influence);
              if (!position) return null;
  
              return (
                <div
                  key={index}
                  className="stakeholder-icon"
                  style={{
                    left: position.x,
                    top: position.y,
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                  }}
                  title={`${stakeholder.name}\nInfluence: ${stakeholder.influence}\nInterest: ${stakeholder.interest}`}
                >
                  {getInitials(stakeholder.name)}
                  <div className="stakeholder-tooltip">
                    <div className="tooltip-name">{stakeholder.name}</div>
                    <div className="tooltip-details">
                      <div>Role: {stakeholder.role}</div>
                      <div>Organization: {stakeholder.organization}</div>
                      <div>Influence: {stakeholder.influence}</div>
                      <div>Interest: {stakeholder.interest}</div>
                      <div className="tooltip-quadrant">
                        {getQuadrantLabel(stakeholder.influence, stakeholder.interest)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
  
          {/* X-Axis Label */}
          <div className="x-axis-label">Interest</div>
        </div>
      </div>
    );
  };

  // Main component render
  return (
    <>
      <Navbar />
      <div className="view-stakeholder-container">
        {loading ? (
          <div className="loading-spinner">Loading Stakeholder Register...</div>
        ) : error ? (
          <div className="error-text">{error}</div>
        ) : (
          <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header with project name and control buttons */}
            <div className="view-stakeholder-header">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1>Stakeholder Register: {projectName}</h1>
                  <p className="text-gray-600">
                    {isEditMode ? "Edit Mode - Make changes and save when done" : "View Mode - Stakeholder insights and analysis"}
                  </p>
                </div>
                <div className="button-group">
                  {isEditMode ? (
                    <div className="form-actions">
                      <button 
                        type="button" 
                        onClick={handleSave} 
                        className="btn-save"
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                      <button 
                        type="button" 
                        onClick={handleCancel} 
                        className="btn-cancel"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="btn-primary"
                        onClick={toggleEditMode}
                        disabled={loading}
                      >
                        Edit Register
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={handleBackToProject}
                        disabled={loading}
                      >
                        Back to Project
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Success or error messages */}
              {message && <div className="success-text">{message}</div>}
              {error && <div className="error-text">{error}</div>}
            </div>
            
            {/* Main content layout with two sections */}
            <div className="main-content-layout">
              {/* Left section: Stakeholder Register */}
              <div className="stakeholder-register-section">
                <div className="section-header">
                  <h3>Stakeholder Register</h3>
                  <p>View and manage your project stakeholders</p>
                </div>
                
                {/* Stakeholder Table */}
                <StakeholderTable />
              </div>

              {/* Right section: Stakeholder Matrix */}
              <div className="stakeholder-matrix-section">
                <div className="section-header">
                  <h3>Stakeholder Matrix</h3>
                  <p>Visualize stakeholders by influence and interest</p>
                </div>
                
                <StakeholderMatrix />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ViewStakeholderRegister;
