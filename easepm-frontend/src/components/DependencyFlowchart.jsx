import dagre from "dagre";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    Handle,
    MarkerType,
    MiniMap,
    Position,
    useEdgesState,
    useNodesState,
} from "react-flow-renderer";

import "./DependencyFlowchart.css";

const nodeWidth = 180;
const nodeHeight = 70;

// Key for storing layout in localStorage
const LAYOUT_STORAGE_KEY = 'dependency-flowchart-layout';

const CustomNode = React.memo(({ data }) => (
  <div
    title={data?.date ? `Milestone Date: ${data.date}` : "No date set"}
    style={{
      padding: 10,
      borderRadius: 10,
      backgroundColor: "#f8c97e",  // Set the node background color
      color: "#333",                // Set the text color (dark for contrast)
      textAlign: "center",
      position: "relative",
    }}
  >
    <div>{data.label}</div> 
    <Handle type="target" position={Position.Left} style={{ background: "#555" }} />
    <Handle type="source" position={Position.Right} style={{ background: "#555" }} />
  </div>
));

const nodeTypes = {
  default: CustomNode,
};

const layoutGraph = (nodes, edges, direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
      },
    };
  });
};

// Create a unique key for this specific project's flowchart
const getProjectSpecificStorageKey = (milestones, dependencies) => {
  // Create a fingerprint based on milestone names and dependencies
  const milestonesKey = milestones.filter(m => m.name?.trim()).map(m => m.name).sort().join('-');
  const dependenciesKey = dependencies
    .filter(d => d.source && d.target)
    .map(d => `${d.source}-${d.target}`)
    .sort()
    .join('|');
  
  return `${LAYOUT_STORAGE_KEY}-${milestonesKey}-${dependenciesKey}`;
};

const createInitialNodes = (milestones, savedLayout = null) =>
  milestones
    .filter((m) => m.name?.trim())
    .map((m) => {
      // Try to find saved position for this node
      const savedNode = savedLayout && savedLayout.find(node => node.id === m.name);
      const position = savedNode ? savedNode.position : { x: 0, y: 0 };
      
      return {
        id: m.name,
        data: { label: m.name, date: m.date },
        position,
        type: "default",
        sourcePosition: "right",
        targetPosition: "left",
        style: {
          width: `${nodeWidth}px`,
          height: `${nodeHeight}px`,
        },
      };
    });

const createInitialEdges = (dependencies) =>
  dependencies
    .filter((dep) => dep.source && dep.target)
    .map((dep, idx) => ({
      id: `edge-${idx}`,
      source: dep.source,
      target: dep.target,
      animated: true,
      style: {
        stroke: "#3ecbf5", // Set edge color
        strokeWidth: 3,    // Increase stroke width for thicker arrows
        strokeDasharray: "0", // Solid lines (no dashes)
      },
      markerEnd: { 
        type: MarkerType.ArrowClosed, 
        width: 20,   // Increase arrow width
        height: 20,  // Increase arrow height
        color: "#3ecbf5", // Set arrow color
      },
    }));

const DependencyFlowchart = ({ milestones, dependencies, projectId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutInitialized, setLayoutInitialized] = useState(false);
  
  // Get a unique key for storing this flowchart's layout
  const storageKey = useMemo(() => {
    const baseKey = getProjectSpecificStorageKey(milestones, dependencies);
    return projectId ? `${baseKey}-${projectId}` : baseKey;
  }, [milestones, dependencies, projectId]);

  const validMilestones = useMemo(
    () => milestones.filter((m) => m.name?.trim()),
    [milestones]
  );

  const validDependencies = useMemo(
    () => dependencies.filter((d) => d.source && d.target),
    [dependencies]
  );

  // Load saved layout on initial render
  useEffect(() => {
    if (validMilestones.length === 0) return;
    
    try {
      // Try to load saved layout
      const savedLayoutString = localStorage.getItem(storageKey);
      let layoutedNodes;
      
      if (savedLayoutString) {
        const savedLayout = JSON.parse(savedLayoutString);
        const freshNodes = createInitialNodes(validMilestones, savedLayout);
        layoutedNodes = freshNodes;
      } else {
        // If no saved layout, create default layout
        const freshNodes = createInitialNodes(validMilestones);
        layoutedNodes = layoutGraph(freshNodes, createInitialEdges(validDependencies));
      }
      
      const freshEdges = createInitialEdges(validDependencies);
      setNodes(layoutedNodes);
      setEdges(freshEdges);
    } catch (error) {
      console.error("Error loading saved layout:", error);
      // Fall back to default layout
      const freshNodes = createInitialNodes(validMilestones);
      const freshEdges = createInitialEdges(validDependencies);
      const layoutedNodes = layoutGraph(freshNodes, freshEdges);
      setNodes(layoutedNodes);
      setEdges(freshEdges);
    }
  }, [validMilestones, validDependencies, storageKey]);

  // Update edges whenever dependencies change
  useEffect(() => {
    const freshEdges = createInitialEdges(validDependencies);
    setEdges(freshEdges);
  }, [validDependencies]);

  // Save node positions when they change
  useEffect(() => {
    if (nodes.length === 0) return;
    
    // Extract just the id and position information to save
    const positionsToSave = nodes.map(node => ({
      id: node.id,
      position: node.position
    }));
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(positionsToSave));
    } catch (error) {
      console.error("Error saving layout:", error);
    }
  }, [nodes, storageKey]);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          { ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
          eds
        )
      ),
    [setEdges]
  );

  const onEdgeClick = useCallback(
    (event, edge) => {
      event.stopPropagation();
      const shouldDelete = window.confirm(
        `Delete dependency from "${edge.source}" to "${edge.target}"?`
      );
      if (shouldDelete) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
    },
    [setEdges]
  );

  const handleResetLayout = () => {
    // Reset to default dagre layout
    const freshNodes = createInitialNodes(validMilestones);
    const layouted = layoutGraph(freshNodes, edges);
    setNodes(layouted);
    
    // Clear saved layout
    localStorage.removeItem(storageKey);
  };

  return (
    <div>
      {/* Header for Dependency Flowchart */}
      <div style={{
        padding: '10px',
        marginBottom: '5px',
        borderLeft: '4px solid #3ecbf5',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{ color: '#3ecbf5', fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
          Project Dependencies Overview
        </h3>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          Visualizes dependencies between project milestones. Blue arrows show relationships between milestones, indicating which milestones must be completed before others can begin. Drag nodes to reorganize, use mouse wheel to zoom, and click arrows to remove dependencies.
        </p>
      </div>

      <div style={{ width: "100%", height: "700px", padding: "20px" }}>
        <button
          className="reset-layout-btn"
          onClick={handleResetLayout}
        >
          Reset Layout
        </button>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          zoomOnScroll={true}
          zoomOnPinch={true}
          panOnDrag={true}
          panOnScroll={true}
          defaultviewport={{ x: 0, y: 0, zoom: 1 }}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          style={{
            backgroundColor: "#f0f0f0",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <MiniMap nodeColor="#3ecbf5" />
          <Controls />
          <Background color="#e0e0e0" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default DependencyFlowchart;
