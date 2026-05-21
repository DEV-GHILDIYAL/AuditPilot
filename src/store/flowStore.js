import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

const DEFAULT_NODES = [
  { id: 'node_open', type: 'openUrl', data: { label: 'Open URL', config: {} }, position: { x: 50, y: 150 } },
  { id: 'node_text', type: 'findText', data: { label: 'Find Text', config: { caseSensitive: false, exactMatch: false } }, position: { x: 320, y: 150 } },
  { id: 'node_btn', type: 'findButton', data: { label: 'Find Button', config: { elementType: 'any', checkVisibility: true } }, position: { x: 590, y: 150 } },
  { id: 'node_redirect', type: 'matchRedirectUrl', data: { label: 'Match Redirect URL', config: { matchType: 'contains', timeout: 5000 } }, position: { x: 860, y: 150 } }
];

const DEFAULT_EDGES = [
  { 
    id: 'e_open_text', 
    source: 'node_open', 
    target: 'node_text', 
    animated: true,
    style: { stroke: '#5B8DEF', strokeWidth: 2, strokeDasharray: '5,5' }
  },
  { 
    id: 'e_text_btn', 
    source: 'node_text', 
    target: 'node_btn', 
    animated: true,
    style: { stroke: '#5B8DEF', strokeWidth: 2, strokeDasharray: '5,5' }
  },
  { 
    id: 'e_btn_redirect', 
    source: 'node_btn', 
    target: 'node_redirect', 
    animated: true,
    style: { stroke: '#5B8DEF', strokeWidth: 2, strokeDasharray: '5,5' }
  }
];

export const useFlowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  // React Flow Handlers
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    const styledConnection = {
      ...connection,
      animated: true,
      style: { stroke: '#5B8DEF', strokeWidth: 2, strokeDasharray: '5,5' }
    };
    set({
      edges: addEdge(styledConnection, get().edges),
    });
  },

  // Selection actions
  setSelectedNodeId: (id) => {
    set({ selectedNodeId: id });
  },

  // Node Lifecycle
  addNode: (node) => {
    const onDelete = get().deleteNode;
    const newNode = {
      ...node,
      data: {
        ...node.data,
        onDelete
      }
    };
    set({
      nodes: [...get().nodes, newNode]
    });
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId
    });
  },

  updateNodeConfig: (id, config) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                ...config
              }
            }
          };
        }
        return node;
      })
    });
  },

  // Global Operations
  clearCanvas: () => {
    set({ nodes: [], edges: [], selectedNodeId: null });
  },

  resetToDefault: () => {
    const onDelete = get().deleteNode;
    const nodes = DEFAULT_NODES.map(node => ({
      ...node,
      data: {
        ...node.data,
        onDelete
      }
    }));
    set({
      nodes,
      edges: [...DEFAULT_EDGES],
      selectedNodeId: null
    });
  },

  // Save / Load IPC Persistence
  saveFlow: async () => {
    try {
      // Stripped functions from data object since they can't be serialized over IPC
      const serializableNodes = get().nodes.map(({ id, type, data, position }) => ({
        id,
        type,
        position,
        data: {
          label: data.label,
          config: data.config
        }
      }));
      const flowData = {
        nodes: serializableNodes,
        edges: get().edges
      };
      await window.api.saveFlow(flowData);
      return { success: true };
    } catch (e) {
      console.error('Failed to save flow to disk', e);
      return { success: false, message: e.message };
    }
  },

  loadFlow: async () => {
    try {
      const savedFlow = await window.api.getFlow();
      const onDelete = get().deleteNode;
      
      if (savedFlow && savedFlow.nodes) {
        const loadedNodes = savedFlow.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onDelete
          }
        }));
        set({
          nodes: loadedNodes,
          edges: savedFlow.edges || [],
          selectedNodeId: null
        });
      } else {
        // Fallback to default flow if no flow has been saved yet
        get().resetToDefault();
      }
    } catch (e) {
      console.error('Failed to load flow from disk', e);
      get().resetToDefault();
    }
  },

  // Flow Graph Validation
  validateFlow: (columnMap) => {
    const { nodes, edges } = get();
    const errors = [];

    // 1. Must contain Open URL node
    const openNodes = nodes.filter(n => n.type === 'openUrl');
    if (openNodes.length === 0) {
      errors.push("Flow must start with an 'Open URL' widget.");
      return { valid: false, errors };
    }
    if (openNodes.length > 1) {
      errors.push("Flow cannot contain multiple 'Open URL' start widgets.");
      return { valid: false, errors };
    }

    // 2. Validate orphan nodes (no connections)
    // Build an adjacency list of connections
    const nodeIds = nodes.map(n => n.id);
    const degree = {};
    nodeIds.forEach(id => {
      degree[id] = 0;
    });

    edges.forEach(edge => {
      if (degree[edge.source] !== undefined) degree[edge.source]++;
      if (degree[edge.target] !== undefined) degree[edge.target]++;
    });

    const orphans = nodes.filter(n => degree[n.id] === 0);
    // Open URL can be an orphan only if it is the only node on the canvas
    if (orphans.length > 0 && !(nodes.length === 1 && nodes[0].type === 'openUrl')) {
      errors.push("Canvas contains unconnected orphan widgets. Connect all widgets or delete orphans.");
    }

    // 3. Optional: Warn if redirect URL column is not mapped but widget is placed
    if (columnMap) {
      const hasRedirectWidget = nodes.some(n => n.type === 'matchRedirectUrl');
      if (hasRedirectWidget && !columnMap.button_redirect_url) {
        errors.push("Warning: 'Match Redirect' widget is present, but 'Expected Redirect Destination' column is unmapped in Upload.");
      }
      
      const hasTextWidget = nodes.some(n => n.type === 'findText');
      if (hasTextWidget && !columnMap.expected_content) {
        errors.push("Warning: 'Find Text' widget is present, but 'Expected Body Text' column is unmapped.");
      }
      
      const hasButtonWidget = nodes.some(n => n.type === 'findButton');
      if (hasButtonWidget && !columnMap.button_name) {
        errors.push("Warning: 'Find Button' widget is present, but 'Target Button Name' column is unmapped.");
      }
    }

    // 4. Trace the linear sequence starting from openUrl to ensure no loops or multiple branches
    const visited = new Set();
    let currentId = openNodes[0].id;
    visited.add(currentId);

    while (currentId) {
      // Find outgoing edge
      const outgoingEdges = edges.filter(e => e.source === currentId);
      if (outgoingEdges.length > 1) {
        errors.push("Branching flows are not supported. Each widget must have at most one outgoing connection.");
        break;
      }
      
      if (outgoingEdges.length === 1) {
        const nextId = outgoingEdges[0].target;
        if (visited.has(nextId)) {
          errors.push("Circular dependencies (loops) detected in the pipeline flow.");
          break;
        }
        visited.add(nextId);
        currentId = nextId;
      } else {
        currentId = null;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Reconstructs the ordered widget sequence for Playwright execution
  getOrderedSequence: () => {
    const { nodes, edges } = get();
    const sequence = [];
    const openNodes = nodes.filter(n => n.type === 'openUrl');
    
    if (openNodes.length !== 1) return [];

    let currentId = openNodes[0].id;
    const visited = new Set();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const node = nodes.find(n => n.id === currentId);
      if (node) {
        sequence.push({
          id: node.id,
          type: node.type,
          config: node.data.config || {}
        });
      }

      const outgoing = edges.find(e => e.source === currentId);
      currentId = outgoing ? outgoing.target : null;
    }

    return sequence;
  }
}));
