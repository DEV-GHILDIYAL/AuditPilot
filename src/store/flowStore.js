import { create } from 'zustand';

/**
 * Flow Zustand Store
 * Scaffolded for Phase 2 visual canvas support. Matches the Phase 1 default hardcoded flow.
 */
export const useFlowStore = create((set, get) => ({
  nodes: [
    { id: 'node_open', type: 'openUrl', data: { label: 'Open URL' }, position: { x: 50, y: 100 } },
    { id: 'node_text', type: 'findText', data: { label: 'Find Text' }, position: { x: 250, y: 100 } },
    { id: 'node_btn', type: 'findButton', data: { label: 'Find Button' }, position: { x: 450, y: 100 } },
    { id: 'node_redirect', type: 'matchRedirectUrl', data: { label: 'Match Redirect URL' }, position: { x: 650, y: 100 } }
  ],
  edges: [
    { id: 'e_open_text', source: 'node_open', target: 'node_text', animated: true },
    { id: 'e_text_btn', source: 'node_text', target: 'node_btn', animated: true },
    { id: 'e_btn_redirect', source: 'node_btn', target: 'node_redirect', animated: true }
  ],
  
  onNodesChange: (changes) => {},
  onEdgesChange: (changes) => {},
  onConnect: (connection) => {},
  addNode: (node) => {},
  updateNodeConfig: (id, config) => {}
}));
