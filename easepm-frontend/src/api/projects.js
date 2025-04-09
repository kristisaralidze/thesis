// projects.js
import { apiClient } from './apiClient';

const API_PATH = '/projects';

// Fetch all projects for the current user
export const fetchProjects = async () => {
  try {
    console.log('🔄 Fetching projects from MongoDB API...');
    const response = await apiClient.get(API_PATH);
    console.log('✅ Successfully fetched projects from MongoDB API');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    throw error;
  }
};

// Fetch a specific project by ID
export const fetchProjectById = async (projectId) => {
  if (!projectId) {
    console.error("fetchProjectById called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Fetching project ${projectId} from MongoDB API...`);
    const response = await apiClient.get(`${API_PATH}/${projectId}`);
    console.log(`✅ Successfully fetched project ${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching project ${projectId}:`, error);
    throw error;
  }
};

// Create a new project
export const createProject = async (projectData) => {
  try {
    console.log('🔄 Creating project via MongoDB API...');
    const response = await apiClient.post(API_PATH, projectData);
    console.log('✅ Successfully created project');
    return response.data;
  } catch (error) {
    console.error('❌ Error creating project:', error);
    throw error;
  }
};

// Update an existing project
export const updateProject = async (projectId, projectData) => {
  if (!projectId) {
    console.error("updateProject called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Updating project ${projectId}...`);
    const response = await apiClient.put(`${API_PATH}/${projectId}`, projectData);
    console.log(`✅ Successfully updated project ${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error updating project ${projectId}:`, error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (projectId) => {
  if (!projectId) {
    console.error("deleteProject called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Deleting project ${projectId}...`);
    const response = await apiClient.delete(`${API_PATH}/${projectId}`);
    console.log(`✅ Successfully deleted project ${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error deleting project ${projectId}:`, error);
    throw error;
  }
};

// Create a deliverable for a project
export const createDeliverable = async (projectId, deliverableData) => {
  if (!projectId) {
    console.error("createDeliverable called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Creating deliverable for project ${projectId}...`);
    const response = await apiClient.post(`${API_PATH}/${projectId}/deliverables`, deliverableData);
    console.log(`✅ Successfully created deliverable for project ${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error creating deliverable for project ${projectId}:`, error);
    throw error;
  }
};

// Update a deliverable
export const updateDeliverable = async (projectId, deliverableId, deliverableData) => {
  if (!projectId || !deliverableId) {
    console.error(`updateDeliverable called with invalid projectId: ${projectId} or deliverableId: ${deliverableId}`);
    throw new Error("Invalid project ID or deliverable ID");
  }
  
  try {
    console.log(`🔄 Updating deliverable ${deliverableId} for project ${projectId}...`);
    const response = await apiClient.put(
      `${API_PATH}/${projectId}/deliverables/${deliverableId}`, 
      deliverableData
    );
    console.log(`✅ Successfully updated deliverable ${deliverableId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error updating deliverable ${deliverableId}:`, error);
    throw error;
  }
};

// Delete a deliverable
export const deleteDeliverable = async (projectId, deliverableId) => {
  if (!projectId || !deliverableId) {
    console.error(`deleteDeliverable called with invalid projectId: ${projectId} or deliverableId: ${deliverableId}`);
    throw new Error("Invalid project ID or deliverable ID");
  }
  
  try {
    console.log(`🔄 Deleting deliverable ${deliverableId} from project ${projectId}...`);
    const response = await apiClient.delete(
      `${API_PATH}/${projectId}/deliverables/${deliverableId}`
    );
    console.log(`✅ Successfully deleted deliverable ${deliverableId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error deleting deliverable ${deliverableId}:`, error);
    throw error;
  }
};

// Project Plan APIs
export const fetchProjectPlan = async (projectId) => {
  if (!projectId) {
    console.error("fetchProjectPlan called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Fetching Project Plan for project ${projectId}...`);
    const response = await apiClient.get(`${API_PATH}/${projectId}/documents/project-plan`);
    console.log(`✅ Successfully fetched Project Plan`);
    return response;
  } catch (error) {
    console.error(`❌ Error fetching Project Plan for project ${projectId}:`, error);
    
    // Return a consistent format for error handling in the component
    if (error.response?.status === 404) {
      console.log(`Project Plan not found for project ${projectId}`);
      return { data: null };
    }
    
    throw error;
  }
};

export const updateProjectPlan = async (projectId, data) => {
  if (!projectId) {
    console.error("updateProjectPlan called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Updating Project Plan for project ${projectId}...`);
    
    // Ensure the data includes the type expected by the backend
    const payload = {
      ...data,
      type: "ProjectPlan" // Explicitly set the type expected by the backend
    };
    
    const response = await apiClient.put(
      `${API_PATH}/${projectId}/documents/project-plan`, 
      payload
    );
    console.log(`✅ Successfully updated Project Plan`);
    return response;
  } catch (error) {
    console.error(`❌ Error updating Project Plan for project ${projectId}:`, error);
    throw error;
  }
};

export const deleteProjectPlan = async (projectId) => {
  if (!projectId) {
    console.error("deleteProjectPlan called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Deleting Project Plan for project ${projectId}...`);
    const response = await apiClient.delete(`${API_PATH}/${projectId}/documents/project-plan`);
    console.log(`✅ Successfully deleted Project Plan`);
    return response;
  } catch (error) {
    console.error(`❌ Error deleting Project Plan for project ${projectId}:`, error);
    throw error;
  }
};

// Project Charter APIs
export const fetchProjectCharter = async (projectId) => {
  if (!projectId) {
    console.error("fetchProjectCharter called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Fetching Project Charter for project ${projectId}...`);
    const response = await apiClient.get(`${API_PATH}/${projectId}/documents/project-charter`);
    return response;
  } catch (error) {
    console.error(`❌ Error fetching Project Charter for project ${projectId}:`, error);
    
    // Return a consistent format for error handling in the component
    if (error.response?.status === 404) {
      console.log(`Project Charter not found for project ${projectId}`);
      return { data: null };
    }
    
    throw error;
  }
};

export const updateProjectCharter = async (projectId, data) => {
  if (!projectId) {
    console.error("updateProjectCharter called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Updating Project Charter for project ${projectId}...`);
    const response = await apiClient.put(
      `${API_PATH}/${projectId}/documents/project-charter`, 
      data
    );
    return response;
  } catch (error) {
    console.error(`❌ Error updating Project Charter for project ${projectId}:`, error);
    throw error;
  }
};

export const deleteProjectCharter = async (projectId) => {
  if (!projectId) {
    console.error("deleteProjectCharter called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Deleting Project Charter for project ${projectId}...`);
    const response = await apiClient.delete(`${API_PATH}/${projectId}/documents/project-charter`);
    return response;
  } catch (error) {
    console.error(`❌ Error deleting Project Charter for project ${projectId}:`, error);
    throw error;
  }
};

// Stakeholder Register APIs
export const fetchStakeholderRegister = async (projectId) => {
  if (!projectId) {
    console.error("fetchStakeholderRegister called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Fetching Stakeholder Register from MongoDB API for project ${projectId}...`);
    const response = await apiClient.get(
      `${API_PATH}/${projectId}/documents/stakeholder-register`
    );
    console.log(`✅ Successfully fetched Stakeholder Register`);
    return response;
  } catch (error) {
    console.error(`❌ Error fetching Stakeholder Register for project ${projectId}:`, error);
    
    // Return a consistent format for error handling in the component
    if (error.response?.status === 404) {
      console.log(`Stakeholder Register not found in MongoDB for project ${projectId}`);
      return { 
        data: null
      };
    }
    
    throw error;
  }
};

export const updateStakeholderRegister = async (projectId, data) => {
  if (!projectId) {
    console.error("updateStakeholderRegister called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Updating Stakeholder Register for project ${projectId} via MongoDB API...`);
    
    // Ensure the data includes the type expected by the backend
    const payload = {
      ...data,
      type: "StakeholderRegister" // Explicitly set the type expected by the backend
    };
    
    const response = await apiClient.put(
      `${API_PATH}/${projectId}/documents/stakeholder-register`, 
      payload
    );
    return response;
  } catch (error) {
    console.error(`❌ Error updating Stakeholder Register for project ${projectId}:`, error);
    throw error;
  }
};

export const deleteStakeholderRegister = async (projectId) => {
  if (!projectId) {
    console.error("deleteStakeholderRegister called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Deleting Stakeholder Register for project ${projectId} via MongoDB API...`);
    const response = await apiClient.delete(
      `${API_PATH}/${projectId}/documents/stakeholder-register`
    );
    return response;
  } catch (error) {
    console.error(`❌ Error deleting Stakeholder Register for project ${projectId}:`, error);
    throw error;
  }
};

// Work Breakdown Structure (WBS) APIs
export const fetchWBS = async (projectId) => {
  if (!projectId) {
    console.error("fetchWBS called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Fetching WBS for project ${projectId}...`);
    const response = await apiClient.get(`${API_PATH}/${projectId}/documents/wbs`);
    console.log(`✅ Successfully fetched WBS`);
    return response;
  } catch (error) {
    console.error(`❌ Error fetching WBS for project ${projectId}:`, error);
    
    // Return a consistent format for error handling in the component
    if (error.response?.status === 404) {
      console.log(`WBS not found for project ${projectId}`);
      return { data: null };
    }
    
    throw error;
  }
};

export const updateWBS = async (projectId, data) => {
  if (!projectId) {
    console.error("updateWBS called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Updating WBS for project ${projectId}...`);
    const response = await apiClient.put(
      `${API_PATH}/${projectId}/documents/wbs`, 
      data
    );
    console.log(`✅ Successfully updated WBS`);
    return response;
  } catch (error) {
    console.error(`❌ Error updating WBS for project ${projectId}:`, error);
    throw error;
  }
};

export const deleteWBS = async (projectId) => {
  if (!projectId) {
    console.error("deleteWBS called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Deleting WBS for project ${projectId}...`);
    const response = await apiClient.delete(`${API_PATH}/${projectId}/documents/wbs`);
    console.log(`✅ Successfully deleted WBS`);
    return response;
  } catch (error) {
    console.error(`❌ Error deleting WBS for project ${projectId}:`, error);
    throw error;
  }
};

// Close Out Report APIs
export const fetchCloseOutReport = async (projectId) => {
  if (!projectId) {
    console.error("fetchCloseOutReport called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Fetching Close Out Report for project ${projectId}...`);
    const response = await apiClient.get(`${API_PATH}/${projectId}/documents/close-out-report`);
    console.log(`✅ Successfully fetched Close Out Report`);
    return response;
  } catch (error) {
    console.error(`❌ Error fetching Close Out Report for project ${projectId}:`, error);
    
    // Return a consistent format for error handling in the component
    if (error.response?.status === 404) {
      console.log(`Close Out Report not found for project ${projectId}`);
      return { data: null };
    }
    
    throw error;
  }
};

export const updateCloseOutReport = async (projectId, data) => {
  if (!projectId) {
    console.error("updateCloseOutReport called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Updating Close Out Report for project ${projectId}...`);
    
    // Ensure the data includes the type expected by the backend
    const payload = {
      ...data,
      type: "CloseOutReport" // Explicitly set the type expected by the backend
    };
    
    const response = await apiClient.put(
      `${API_PATH}/${projectId}/documents/close-out-report`, 
      payload
    );
    console.log(`✅ Successfully updated Close Out Report`);
    return response;
  } catch (error) {
    console.error(`❌ Error updating Close Out Report for project ${projectId}:`, error);
    throw error;
  }
};

export const deleteCloseOutReport = async (projectId) => {
  if (!projectId) {
    console.error("deleteCloseOutReport called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Deleting Close Out Report for project ${projectId}...`);
    const response = await apiClient.delete(`${API_PATH}/${projectId}/documents/close-out-report`);
    console.log(`✅ Successfully deleted Close Out Report`);
    return response;
  } catch (error) {
    console.error(`❌ Error deleting Close Out Report for project ${projectId}:`, error);
    throw error;
  }
};

// Risk Register APIs
export const fetchRiskRegister = async (projectId) => {
  if (!projectId) {
    console.error("fetchRiskRegister called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Fetching Risk Register for project ${projectId}...`);
    const response = await apiClient.get(`${API_PATH}/${projectId}/documents/risk-register`);
    console.log(`✅ Successfully fetched Risk Register`);
    return response;
  } catch (error) {
    console.error(`❌ Error fetching Risk Register for project ${projectId}:`, error);
    
    // Return a consistent format for error handling in the component
    if (error.response?.status === 404) {
      console.log(`Risk Register not found for project ${projectId}`);
      return { data: null };
    }
    
    throw error;
  }
};

export const updateRiskRegister = async (projectId, data) => {
  if (!projectId) {
    console.error("updateRiskRegister called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Updating Risk Register for project ${projectId}...`);
    const response = await apiClient.put(
      `${API_PATH}/${projectId}/documents/risk-register`, 
      data
    );
    console.log(`✅ Successfully updated Risk Register`);
    return response;
  } catch (error) {
    console.error(`❌ Error updating Risk Register for project ${projectId}:`, error);
    throw error;
  }
};

export const deleteRiskRegister = async (projectId) => {
  if (!projectId) {
    console.error("deleteRiskRegister called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Deleting Risk Register for project ${projectId}...`);
    const response = await apiClient.delete(`${API_PATH}/${projectId}/documents/risk-register`);
    console.log(`✅ Successfully deleted Risk Register`);
    return response;
  } catch (error) {
    console.error(`❌ Error deleting Risk Register for project ${projectId}:`, error);
    throw error;
  }
};

// Project Budget Report APIs
export const fetchProjectBudgetReport = async (projectId) => {
  if (!projectId) {
    console.error("fetchProjectBudgetReport called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Fetching Project Budget Report for project ${projectId}...`);
    const response = await apiClient.get(`${API_PATH}/${projectId}/documents/project-budget-report`);
    console.log(`✅ Successfully fetched Project Budget Report`);
    return response;
  } catch (error) {
    console.error(`❌ Error fetching Project Budget Report for project ${projectId}:`, error);
    
    // Return a consistent format for error handling in the component
    if (error.response?.status === 404) {
      console.log(`Project Budget Report not found for project ${projectId}`);
      return { data: null };
    }
    
    throw error;
  }
};

export const updateProjectBudgetReport = async (projectId, data) => {
  if (!projectId) {
    console.error("updateProjectBudgetReport called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Updating Project Budget Report for project ${projectId}...`);
    const response = await apiClient.put(
      `${API_PATH}/${projectId}/documents/project-budget-report`, 
      data
    );
    console.log(`✅ Successfully updated Project Budget Report`);
    return response;
  } catch (error) {
    console.error(`❌ Error updating Project Budget Report for project ${projectId}:`, error);
    throw error;
  }
};

export const deleteProjectBudgetReport = async (projectId) => {
  if (!projectId) {
    console.error("deleteProjectBudgetReport called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Deleting Project Budget Report for project ${projectId}...`);
    const response = await apiClient.delete(`${API_PATH}/${projectId}/documents/project-budget-report`);
    console.log(`✅ Successfully deleted Project Budget Report`);
    return response;
  } catch (error) {
    console.error(`❌ Error deleting Project Budget Report for project ${projectId}:`, error);
    throw error;
  }
};

// Lean Canvas APIs
export const fetchLeanCanvas = async (projectId) => {
  if (!projectId) {
    console.error("fetchLeanCanvas called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Fetching Lean Canvas for project ${projectId}...`);
    const response = await apiClient.get(`${API_PATH}/${projectId}/documents/lean-canvas`);
    console.log(`✅ Successfully fetched Lean Canvas`);
    return response;
  } catch (error) {
    console.error(`❌ Error fetching Lean Canvas for project ${projectId}:`, error);
    
    // Return a consistent format for error handling in the component
    if (error.response?.status === 404) {
      console.log(`Lean Canvas not found for project ${projectId}`);
      return { data: null };
    }
    
    throw error;
  }
};

export const updateLeanCanvas = async (projectId, data) => {
  if (!projectId) {
    console.error("updateLeanCanvas called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Updating Lean Canvas for project ${projectId}...`);
    const response = await apiClient.put(
      `${API_PATH}/${projectId}/documents/lean-canvas`, 
      data
    );
    console.log(`✅ Successfully updated Lean Canvas`);
    return response;
  } catch (error) {
    console.error(`❌ Error updating Lean Canvas for project ${projectId}:`, error);
    throw error;
  }
};

export const deleteLeanCanvas = async (projectId) => {
  if (!projectId) {
    console.error("deleteLeanCanvas called with invalid projectId:", projectId);
    throw new Error("Invalid project ID");
  }
  
  try {
    console.log(`🔄 Deleting Lean Canvas for project ${projectId}...`);
    const response = await apiClient.delete(`${API_PATH}/${projectId}/documents/lean-canvas`);
    console.log(`✅ Successfully deleted Lean Canvas`);
    return response;
  } catch (error) {
    console.error(`❌ Error deleting Lean Canvas for project ${projectId}:`, error);
    throw error;
  }
};