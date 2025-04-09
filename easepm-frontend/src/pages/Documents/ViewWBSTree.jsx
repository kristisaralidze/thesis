// src/pages/Documents/ViewWBSTree.jsx
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as projectsApi from "../../api/projects";
import Navbar from "../../components/Navbar";
import "./ViewWBSTree.css";

/**
 * Normalize a node so that children is always an array.
 */
function normalizeWBSItem(item) {
  if (!Array.isArray(item.children)) {
    item.children = [];
  } else {
    item.children = item.children.map(normalizeWBSItem);
  }
  return item;
}

/**
 * Helper: Handle drag end to reorder siblings at the same level.
 */
function handleDragEnd(event, items, setItems) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const oldIndex = items.findIndex((item) => item.id === active.id);
  const newIndex = items.findIndex((item) => item.id === over.id);
  if (oldIndex < 0 || newIndex < 0) return;
  const newArray = arrayMove(items, oldIndex, newIndex);
  setItems([...newArray]);
}

// Read-only WBS Item Component
const ReadOnlyWBSItem = ({ item, level = 1 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const displayLevel = level > 12 ? ((level - 1) % 12) + 1 : level;

  return (
    <div className={`wbs-item wbs-level-${displayLevel}`}>
      <div className="wbs-item-content" data-level={level}>
        {hasChildren && (
          <button 
            className="wbs-expand-btn" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
        <div className="wbs-item-title">
          {item.title}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="wbs-children">
          {item.children.map(child => (
            <ReadOnlyWBSItem 
              key={child.id} 
              item={child} 
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// WBS Item Component (Draggable)
const WBSItem = ({ item, onUpdate, onDelete, onAddChild, level = 1 }) => {
  // Normalize level for display - if level > 12, use modulo to cycle back through our styles
  const displayLevel = level > 12 ? ((level - 1) % 12) + 1 : level;
  
  const { 
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : 'auto'
  };
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.title);
  
  const hasChildren = item.children && item.children.length > 0;
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    onUpdate({ ...item, title: editValue });
    setIsEditing(false);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`wbs-item wbs-level-${displayLevel}`}
    >
      <div className="wbs-item-content" data-level={level}>
        <div className="wbs-item-drag-handle" {...attributes} {...listeners}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 4H6V6H4V4ZM10 4H12V6H10V4ZM4 7H6V9H4V7ZM10 7H12V9H10V7ZM4 10H6V12H4V10ZM10 10H12V12H10V10Z" />
          </svg>
        </div>
        
        {hasChildren && (
          <button 
            className="wbs-expand-btn" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
        
        {isEditing ? (
          <input
            type="text"
            className="wbs-item-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <div className="wbs-item-title" onClick={handleEdit}>
            {item.title}
          </div>
        )}
        
        <div className="wbs-item-actions">
          <button className="wbs-btn wbs-add-child-btn" onClick={() => onAddChild(item.id)}>
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
            </svg>
            Add Child
          </button>
          <button className="wbs-btn wbs-delete-btn" onClick={() => onDelete(item.id)}>
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
            </svg>
            Delete
          </button>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="wbs-children">
          <WBSList 
            items={item.children} 
            onUpdate={(updatedChild) => {
              const updatedChildren = item.children.map(child => 
                child.id === updatedChild.id ? updatedChild : child
              );
              onUpdate({ ...item, children: updatedChildren });
            }}
            onDelete={(childId) => {
              const updatedChildren = item.children.filter(child => child.id !== childId);
              onUpdate({ ...item, children: updatedChildren });
            }}
            onAddChild={(childId) => {
              const childIndex = item.children.findIndex(child => child.id === childId);
              if (childIndex >= 0) {
                const newChildren = [...item.children];
                if (!Array.isArray(newChildren[childIndex].children)) {
                  newChildren[childIndex].children = [];
                }
                newChildren[childIndex].children.push({
                  id: Math.random().toString(36).slice(2),
                  title: "New Task",
                  children: []
                });
                onUpdate({ ...item, children: newChildren });
              }
            }}
            onReorder={(newChildren) => {
              onUpdate({ ...item, children: newChildren });
            }}
            level={level + 1}
          />
        </div>
      )}
    </div>
  );
};

// WBS List Component (Container for Sortable Items)
const WBSList = ({ items = [], onUpdate, onDelete, onAddChild, onReorder, level = 1 }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove([...items], oldIndex, newIndex);
      
      // If onReorder is provided, use it to update the parent's state
      if (onReorder) {
        onReorder(newItems);
      } else {
        // Otherwise, update each item individually
        newItems.forEach(item => onUpdate(item));
      }
    }
  };
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={items.map(item => item.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="wbs-list">
          {items.map(item => (
            <WBSItem 
              key={item.id} 
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              level={level}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

function ViewWBSTree() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [wbsData, setWbsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchWBS = async () => {
      try {
        const res = await projectsApi.fetchWBS(projectId);
        
        // Handle different response formats
        const responseData = res.data || res;
        
        // Check if we have a valid response with WBS items
        if (responseData && responseData.data && Array.isArray(responseData.data.wbsItems)) {
          // Format 1: Standard API response
          const normalized = responseData.data.wbsItems.map(normalizeWBSItem);
          setWbsData(normalized);
        } else if (responseData && Array.isArray(responseData.wbsItems)) {
          // Format 2: WBS items directly in response
          const normalized = responseData.wbsItems.map(normalizeWBSItem);
          setWbsData(normalized);
        } else if (responseData && responseData.content && Array.isArray(responseData.content.wbsItems)) {
          // Format 3: WBS items in content field
          const normalized = responseData.content.wbsItems.map(normalizeWBSItem);
          setWbsData(normalized);
        } else {
          // No valid WBS data found
          setError("WBS not found or invalid format.");
          setWbsData([]);
        }
      } catch (err) {
        console.error("Error fetching WBS:", err);
        setError("WBS not found or access denied.");
        setWbsData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWBS();
  }, [projectId]);

  // Update a WBS item at any level of the tree
  const updateWBSItem = (updatedItem) => {
    const updateItemInTree = (items) => {
      return items.map(item => {
        if (item.id === updatedItem.id) {
          return updatedItem;
        }
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: updateItemInTree(item.children)
          };
        }
        return item;
      });
    };
    
    setWbsData(updateItemInTree(wbsData));
  };
  
  // Delete a WBS item at any level of the tree
  const deleteWBSItem = (itemId) => {
    const deleteItemFromTree = (items) => {
      const filteredItems = items.filter(item => item.id !== itemId);
      return filteredItems.map(item => {
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: deleteItemFromTree(item.children)
          };
        }
        return item;
      });
    };
    
    setWbsData(deleteItemFromTree(wbsData));
  };
  
  // Add a new top-level WBS item
  const addTopLevelItem = () => {
    const newItem = {
      id: Math.random().toString(36).slice(2),
      title: "New Deliverable",
      children: []
    };
    setWbsData([...wbsData, newItem]);
  };

  // Save WBS to server
  const handleSave = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const normalized = wbsData.map(normalizeWBSItem);
      const payload = { 
        wbsItems: normalized,
        type: "WBS",
        version: 1,
        updated_at: new Date().toISOString()
      };

      await projectsApi.updateWBS(projectId, payload);
      
      // Refetch the data to ensure we have the latest version
      const res = await projectsApi.fetchWBS(projectId);
      
      // Handle different response formats
      const responseData = res.data || res;
      
      // Update the local state with the refreshed data
      if (responseData && responseData.data && Array.isArray(responseData.data.wbsItems)) {
        const normalized = responseData.data.wbsItems.map(normalizeWBSItem);
        setWbsData(normalized);
      } else if (responseData && Array.isArray(responseData.wbsItems)) {
        const normalized = responseData.wbsItems.map(normalizeWBSItem);
        setWbsData(normalized);
      } else if (responseData && responseData.content && Array.isArray(responseData.content.wbsItems)) {
        const normalized = responseData.content.wbsItems.map(normalizeWBSItem);
        setWbsData(normalized);
      }
      
      setMessage("WBS saved successfully!");
      setIsEditMode(false);
    } catch (err) {
      console.error("Error saving WBS:", err);
      setError("Failed to save WBS: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="wbs-tree-dndkit-container">
          <p>Loading WBS...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="wbs-tree-dndkit-container">
          <p className="error-text">{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="wbs-tree-dndkit-container">
        {!isEditMode ? (
          <div className="customization-section">
            <h2>Work Breakdown Structure</h2>
            {error && <div className="error-text">{error}</div>}
            {message && <div className="success-text">{message}</div>}
            
            <div className="wbs-editor-container">
              <div className="wbs-editor-header">
                <h3>Project Deliverables and Tasks</h3>
                <p>View your project's Work Breakdown Structure. Click Edit to modify the structure.</p>
              </div>
              
              <div className="wbs-tree-container">
                {wbsData.length === 0 ? (
                  <p>No WBS items found.</p>
                ) : (
                  wbsData.map(item => (
                    <ReadOnlyWBSItem 
                      key={item.id} 
                      item={item} 
                      level={1}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-save-1" onClick={() => setIsEditMode(true)}>
                Edit WBS
              </button>
              <button className="btn-cancel-1" onClick={() => navigate(`/projects/${projectId}`)}>
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="customization-section">
            <h2>Edit Work Breakdown Structure</h2>
            
            {error && <div className="error-text">{error}</div>}
            {message && <div className="success-text">{message}</div>}

            {/* WBS Editor */}
            <div className="wbs-editor-container">
              <div className="wbs-editor-header">
                <h3>Project Deliverables and Tasks</h3>
                <p>Drag items to reorder. Click on text to edit. Use the buttons to add or remove items.</p>
                <button className="wbs-add-top-btn" onClick={addTopLevelItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                  </svg>
                  Add Top-Level Item
                </button>
              </div>
              
              <div className="wbs-tree-container">
                <WBSList 
                  items={wbsData} 
                  onUpdate={updateWBSItem}
                  onDelete={deleteWBSItem}
                  onAddChild={(itemId) => {
                    const itemIndex = wbsData.findIndex(item => item.id === itemId);
                    if (itemIndex >= 0) {
                      const newWbsData = [...wbsData];
                      if (!Array.isArray(newWbsData[itemIndex].children)) {
                        newWbsData[itemIndex].children = [];
                      }
                      newWbsData[itemIndex].children.push({
                        id: Math.random().toString(36).slice(2),
                        title: "New Task",
                        children: []
                      });
                      setWbsData(newWbsData);
                    }
                  }}
                  onReorder={(newItems) => {
                    setWbsData(newItems);
                  }}
                />
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-save-1" onClick={handleSave}>
                Save WBS
              </button>
              <button className="btn-cancel-1" onClick={() => setIsEditMode(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ViewWBSTree;
