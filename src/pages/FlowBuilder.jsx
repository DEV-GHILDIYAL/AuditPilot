import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  ReactFlowProvider, 
  Background, 
  Controls, 
  useReactFlow 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore } from '../store/flowStore';
import { useProjectStore } from '../store/projectStore';
import WidgetNode from '../components/flow/WidgetNode';

import { 
  Globe, 
  Search, 
  Compass, 
  ToggleLeft, 
  Camera, 
  Play, 
  Save, 
  RotateCcw, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Sliders, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

const nodeTypes = {
  openUrl: WidgetNode,
  findText: WidgetNode,
  findButton: WidgetNode,
  matchRedirectUrl: WidgetNode,
  screenshotOnFail: WidgetNode
};

const LIBRARY_WIDGETS = [
  {
    type: 'openUrl',
    name: 'Open URL',
    icon: Globe,
    color: 'text-apAccent',
    bgColor: 'bg-apAccent/10',
    borderColor: 'border-apAccent/20',
    description: 'Load page URL in browser'
  },
  {
    type: 'findText',
    name: 'Find Text',
    icon: Search,
    color: 'text-apSuccess',
    bgColor: 'bg-apSuccess/10',
    borderColor: 'border-apSuccess/20',
    description: 'Verify page has content'
  },
  {
    type: 'findButton',
    name: 'Find Button',
    icon: Compass,
    color: 'text-apWarning',
    bgColor: 'bg-apWarning/10',
    borderColor: 'border-apWarning/20',
    description: 'Locate target click CTA'
  },
  {
    type: 'matchRedirectUrl',
    name: 'Match Redirect',
    icon: ToggleLeft,
    color: 'text-apFailure',
    bgColor: 'bg-apFailure/10',
    borderColor: 'border-apFailure/20',
    description: 'Verify click redirected URL'
  },
  {
    type: 'screenshotOnFail',
    name: 'Screenshot on Fail',
    icon: Camera,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
    description: 'Capture screen on error'
  }
];

function FlowBuilder({ setActiveTab }) {
  const { activeProject, startExecution } = useProjectStore();
  const { 
    nodes, 
    edges, 
    selectedNodeId, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    clearCanvas, 
    resetToDefault, 
    saveFlow, 
    loadFlow, 
    validateFlow, 
    updateNodeConfig, 
    setSelectedNodeId 
  } = useFlowStore();

  const { screenToFlowPosition } = useReactFlow();

  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

  // Load flow from disk on mount
  useEffect(() => {
    loadFlow();
  }, [loadFlow]);

  const handleLaunchRun = () => {
    startExecution();
    setActiveTab('monitor');
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    const res = await saveFlow();
    if (res.success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('idle');
    }
  };

  // HTML5 Drag and Drop event handlers
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      // Validate dropped type
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const meta = LIBRARY_WIDGETS.find(w => w.type === type);
      const label = meta ? meta.name : type;

      // Default configs
      let defaultConfig = {};
      if (type === 'findText') {
        defaultConfig = { caseSensitive: false, exactMatch: false };
      } else if (type === 'findButton') {
        defaultConfig = { elementType: 'any', checkVisibility: true };
      } else if (type === 'matchRedirectUrl') {
        defaultConfig = { matchType: 'contains', timeout: 5000 };
      }

      // We define delete action in the component level to update state dynamically
      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { 
          label, 
          config: defaultConfig
        },
      };

      // Push to flowStore
      useFlowStore.getState().addNode(newNode);
    },
    [screenToFlowPosition]
  );

  if (!activeProject) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-center">
        <Globe className="w-12 h-12 text-apTextMuted mb-4 animate-pulse" />
        <h4 className="font-bold text-sm">No Active Project</h4>
        <p className="text-xs text-apTextMuted mt-2">Please select or configure a project first.</p>
      </div>
    );
  }

  // Pre-check onboarding configurations
  const isPageUrlMapped = !!activeProject.columnMap.page_url;

  // Real-time graph validation
  const validation = validateFlow(activeProject.columnMap);
  const canRun = validation.valid && isPageUrlMapped && activeProject.selectedRanges.length > 0;

  // Selected node config data
  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  return (
    <div className="space-y-4 animate-fadeIn h-full flex flex-col overflow-hidden">
      {/* Topbar Operations */}
      <div className="flex justify-between items-center bg-apSurface border border-apBorder p-3 rounded-xl shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-apAccent/10 hover:bg-apAccent/20 border border-apAccent/30 text-[10px] font-mono font-bold text-apAccent rounded transition-all"
          >
            {saveStatus === 'saved' ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-apSuccess animate-bounce" />
                <span className="text-apSuccess">FLOW SAVED!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                {saveStatus === 'saving' ? 'SAVING...' : 'SAVE FLOW'}
              </>
            )}
          </button>
          
          <button 
            onClick={resetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-apBackground border border-apBorder text-[10px] font-mono font-bold text-apTextMuted hover:text-apTextPrimary hover:bg-apSurface rounded transition-all"
            title="Reset to default 4-widget flow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET TO DEFAULT
          </button>

          <button 
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-apBackground border border-apBorder text-[10px] font-mono font-bold text-apFailure/80 hover:text-apFailure hover:bg-apFailure/10 rounded transition-all"
            title="Clear all nodes and edges"
          >
            <Trash2 className="w-3.5 h-3.5" />
            CLEAR CANVAS
          </button>
        </div>

        <button
          onClick={handleLaunchRun}
          disabled={!canRun}
          className="flex items-center gap-2 px-4 py-2 bg-apSuccess hover:bg-apSuccess/90 disabled:bg-apBorder/40 disabled:text-apTextMuted text-apBackground font-mono font-bold text-xs tracking-wider rounded-lg transition-all shadow-lg shadow-apSuccess/10"
        >
          <Play className="w-4 h-4" />
          RUN PIPELINE
        </button>
      </div>

      {/* Real-time Inline Validation Banner */}
      {!validation.valid && (
        <div className="bg-apWarning/10 border border-apWarning/20 p-2.5 rounded-xl flex items-start gap-2.5 text-xs text-apWarning shrink-0 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold uppercase tracking-wider text-[10px] font-mono">Flow Validation Issues Detected</h5>
            <ul className="list-disc pl-4 space-y-0.5 mt-1 text-[11px] text-apTextPrimary">
              {validation.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Area: Sidebar Widget Library (Left) + React Flow Canvas (Center) + Widget Config (Right) */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        
        {/* Left Side: Sidebar widget library list */}
        <div className="w-64 bg-apSurface border border-apBorder rounded-xl p-4 flex flex-col gap-3 overflow-y-auto shrink-0 select-none">
          <div>
            <h4 className="text-xs font-mono font-bold text-apTextPrimary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-apAccent" />
              WIDGET LIBRARY
            </h4>
            <p className="text-[9px] text-apTextMuted mt-1 leading-relaxed">
              Drag widgets onto the dark canvas to build your pipeline. Connect their handles.
            </p>
          </div>

          <div className="space-y-2 mt-2">
            {LIBRARY_WIDGETS.map(widget => {
              const IconComp = widget.icon;
              return (
                <div
                  key={widget.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, widget.type)}
                  className="p-2.5 border border-apBorder bg-apBackground/30 hover:border-apTextMuted/40 hover:bg-apBackground/60 rounded-lg flex items-start gap-2.5 transition-all cursor-grab active:cursor-grabbing group"
                >
                  <div className={`p-1.5 rounded-md ${widget.bgColor} ${widget.color} border ${widget.borderColor} mt-0.5`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-[11px] font-bold text-apTextPrimary group-hover:text-apAccent transition-colors">{widget.name}</h5>
                    <p className="text-[9px] text-apTextMuted mt-0.5 leading-snug">{widget.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Live React Flow Canvas */}
        <div className="flex-1 bg-apSurface border border-apBorder rounded-xl overflow-hidden relative flex flex-col">
          <div 
            className="flex-1 w-full h-full relative"
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.4 }}
              onNodeClick={(e, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              className="react-flow-custom"
            >
              <Background 
                variant="dots" 
                gap={16} 
                size={1} 
                color="#2E2E38" 
                className="bg-[#0E0E10]"
              />
              <Controls className="!bg-apSurface !border-apBorder !text-apTextPrimary" />
            </ReactFlow>
          </div>

          {/* Quick Status Legend inside Canvas */}
          <div className="absolute bottom-3 left-3 bg-apBackground/80 backdrop-blur-md border border-apBorder px-3 py-1.5 rounded-lg pointer-events-none select-none z-10">
            <span className="text-[9px] font-mono text-apTextMuted">
              💡 Press <kbd className="bg-apSurface px-1 py-0.5 rounded border border-apBorder">Del</kbd> to delete selected node.
            </span>
          </div>
        </div>

        {/* Right Side: Context Config panel */}
        <div className="w-72 bg-apSurface border border-apBorder rounded-xl p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
          <div className="border-b border-apBorder pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-apAccent" />
            <h4 className="text-xs font-mono font-bold text-apTextPrimary uppercase tracking-wider">
              Widget Configuration
            </h4>
          </div>

          {selectedNode ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Selected Widget Header */}
              <div className="p-3 bg-apBackground/40 border border-apBorder rounded-lg">
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-apAccent bg-apAccent/10 border border-apAccent/20 px-1.5 py-0.5 rounded">
                  {selectedNode.type}
                </span>
                <h5 className="font-bold text-xs mt-2 text-apTextPrimary">{selectedNode.data.label}</h5>
                <p className="text-[10px] text-apTextMuted mt-1">ID: {selectedNode.id}</p>
              </div>

              {/* Dynamic Config Controls */}
              <div className="space-y-4 pt-1">
                {/* 1. OPEN URL */}
                {selectedNode.type === 'openUrl' && (
                  <div className="space-y-2 text-[11px] text-apTextMuted leading-relaxed">
                    <p>
                      No configurations needed.
                    </p>
                    <p className="bg-apBackground/40 border border-apBorder p-2.5 rounded-md italic">
                      This widget automatically loads the dynamic column mapped as <strong className="text-apAccent">"Target Web URL"</strong> in your active Excel file.
                    </p>
                  </div>
                )}

                {/* 2. FIND TEXT */}
                {selectedNode.type === 'findText' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase text-apTextMuted block">Match Mode</label>
                      <div className="flex bg-apBackground p-0.5 border border-apBorder rounded-md w-full">
                        <button
                          type="button"
                          onClick={() => updateNodeConfig(selectedNode.id, { exactMatch: false })}
                          className={`flex-1 text-center py-1 text-[9px] font-mono font-bold uppercase rounded transition-all ${
                            !selectedNode.data.config?.exactMatch
                              ? 'bg-apAccent text-apBackground shadow-sm'
                              : 'text-apTextMuted hover:text-apTextPrimary'
                          }`}
                        >
                          Partial (Contains)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateNodeConfig(selectedNode.id, { exactMatch: true })}
                          className={`flex-1 text-center py-1 text-[9px] font-mono font-bold uppercase rounded transition-all ${
                            selectedNode.data.config?.exactMatch
                              ? 'bg-apAccent text-apBackground shadow-sm'
                              : 'text-apTextMuted hover:text-apTextPrimary'
                          }`}
                        >
                          Exact Match
                        </button>
                      </div>
                      <p className="text-[9px] text-apTextMuted mt-1 leading-normal">
                        Partial match succeeds if expected body text appears anywhere on page.
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-2 border border-apBorder rounded-lg bg-apBackground/20">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-apTextPrimary">Case Sensitive</span>
                        <span className="text-[9px] text-apTextMuted">Enforce exact casing</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedNode.data.config?.caseSensitive || false}
                          onChange={(e) => updateNodeConfig(selectedNode.id, { caseSensitive: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 bg-apBorder rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-apTextMuted after:peer-checked:after:bg-apBackground after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-apAccent"></div>
                      </label>
                    </div>
                  </div>
                )}

                {/* 3. FIND BUTTON */}
                {selectedNode.type === 'findButton' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase text-apTextMuted block">Target HTML Tag</label>
                      <select
                        value={selectedNode.data.config?.elementType || 'any'}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { elementType: e.target.value })}
                        className="w-full bg-apBackground border border-apBorder text-apTextPrimary text-[11px] font-mono rounded px-2.5 py-1.5 focus:outline-none focus:border-apAccent"
                      >
                        <option value="any">Any Element Type</option>
                        <option value="button">Button Tag Only</option>
                        <option value="a">Anchor Link Tag Only</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-2 border border-apBorder rounded-lg bg-apBackground/20">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-apTextPrimary">Visibility Verification</span>
                        <span className="text-[9px] text-apTextMuted">Fails if element is hidden</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedNode.data.config?.checkVisibility !== false}
                          onChange={(e) => updateNodeConfig(selectedNode.id, { checkVisibility: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 bg-apBorder rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-apTextMuted after:peer-checked:after:bg-apBackground after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-apAccent"></div>
                      </label>
                    </div>
                  </div>
                )}

                {/* 4. MATCH REDIRECT URL */}
                {selectedNode.type === 'matchRedirectUrl' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase text-apTextMuted block">Match Rule Type</label>
                      <select
                        value={selectedNode.data.config?.matchType || 'contains'}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { matchType: e.target.value })}
                        className="w-full bg-apBackground border border-apBorder text-apTextPrimary text-[11px] font-mono rounded px-2.5 py-1.5 focus:outline-none focus:border-apAccent"
                      >
                        <option value="contains">URL Contains Destination</option>
                        <option value="exact">Exact URL Match</option>
                        <option value="starts-with">URL Starts With Destination</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase text-apTextMuted block">Timeout Input (ms)</label>
                      <input
                        type="number"
                        min="1000"
                        max="30000"
                        step="500"
                        value={selectedNode.data.config?.timeout || 5000}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { timeout: parseInt(e.target.value, 10) || 5000 })}
                        className="w-full bg-apBackground border border-apBorder text-apTextPrimary text-[11px] font-mono rounded px-2.5 py-1.5 focus:outline-none focus:border-apAccent"
                      />
                      <span className="text-[8px] text-apTextMuted block mt-0.5">Recommended standard redirect limit is 5000ms.</span>
                    </div>
                  </div>
                )}

                {/* 5. SCREENSHOT ON FAIL */}
                {selectedNode.type === 'screenshotOnFail' && (
                  <div className="space-y-2 text-[11px] text-apTextMuted leading-relaxed">
                    <p>
                      No configurations needed.
                    </p>
                    <p className="bg-apBackground/40 border border-apBorder p-2.5 rounded-md italic">
                      This widget captures a full-page, high-resolution screenshot if the row fails. The screenshot is saved to the <strong className="text-apAccent">screenshots/</strong> subdirectory of the project Excel sheet directory.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center py-16 text-center border border-dashed border-apBorder bg-apBackground/10 rounded-xl h-64">
              <Sliders className="w-8 h-8 text-apBorder mb-3" />
              <h5 className="font-bold text-[11px] uppercase tracking-wider text-apTextMuted">No Widget Selected</h5>
              <p className="text-[9px] text-apTextMuted mt-1.5 max-w-[180px] leading-relaxed">
                Click on any node in the center canvas to view or modify its operational properties.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Wrap in ReactFlowProvider to enable screenToFlowPosition calculations
export default function FlowBuilderWithProvider(props) {
  return (
    <ReactFlowProvider>
      <FlowBuilder {...props} />
    </ReactFlowProvider>
  );
}
