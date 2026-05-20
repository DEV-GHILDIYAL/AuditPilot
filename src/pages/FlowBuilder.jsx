import React from 'react';
import { useProjectStore } from '../store/projectStore';
import { Globe, Search, Play, ArrowRight, Save, RotateCcw, Compass, ToggleLeft, HelpCircle } from 'lucide-react';

function FlowBuilder({ setActiveTab }) {
  const { activeProject, startExecution } = useProjectStore();

  const handleLaunchRun = () => {
    startExecution();
    setActiveTab('monitor');
  };

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

  return (
    <div className="space-y-6 animate-fadeIn h-[calc(100vh-9rem)] flex flex-col">
      {/* Topbar Operations */}
      <div className="flex justify-between items-center bg-apSurface border border-apBorder p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <button 
            disabled 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-apBackground/30 border border-apBorder text-[10px] font-mono font-bold text-apTextMuted rounded cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            SAVE FLOW
          </button>
          <button 
            disabled 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-apBackground/30 border border-apBorder text-[10px] font-mono font-bold text-apTextMuted rounded cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET CANVAS
          </button>
        </div>

        <button
          onClick={handleLaunchRun}
          disabled={!isPageUrlMapped || activeProject.selectedRanges.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-apSuccess hover:bg-apSuccess/90 disabled:bg-apBorder/40 disabled:text-apTextMuted text-apBackground font-mono font-bold text-xs tracking-wider rounded-lg transition-all shadow-lg shadow-apSuccess/10"
        >
          <Play className="w-4 h-4" />
          RUN PIPELINE
        </button>
      </div>

      {/* Main visual canvas placeholder */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        
        {/* Left Side: Sidebar widget library list */}
        <div className="bg-apSurface border border-apBorder rounded-xl p-5 flex flex-col gap-4 overflow-y-auto">
          <h4 className="text-xs font-mono font-bold text-apTextMuted uppercase tracking-wider">Widget Library</h4>
          <p className="text-[10px] text-apTextMuted leading-relaxed">
            Drag widgets to customize. (Visual custom flow builder will unlock in Phase 2).
          </p>

          <div className="space-y-3 opacity-60 pointer-events-none select-none">
            <div className="p-3 border border-apBorder bg-apBackground/40 rounded-lg flex items-center gap-2.5">
              <Globe className="w-4.5 h-4.5 text-apAccent" />
              <span className="text-xs font-medium">Open URL</span>
            </div>
            <div className="p-3 border border-apBorder bg-apBackground/40 rounded-lg flex items-center gap-2.5">
              <Search className="w-4.5 h-4.5 text-apAccent" />
              <span className="text-xs font-medium">Find Text</span>
            </div>
            <div className="p-3 border border-apBorder bg-apBackground/40 rounded-lg flex items-center gap-2.5">
              <Compass className="w-4.5 h-4.5 text-apAccent" />
              <span className="text-xs font-medium">Find Button</span>
            </div>
            <div className="p-3 border border-apBorder bg-apBackground/40 rounded-lg flex items-center gap-2.5">
              <ToggleLeft className="w-4.5 h-4.5 text-apAccent" />
              <span className="text-xs font-medium">Match Redirect</span>
            </div>
          </div>
        </div>

        {/* Center Canvas: Sequential Diagram Display */}
        <div className="lg:col-span-3 bg-apSurface/30 border border-apBorder border-dashed rounded-xl p-6 flex flex-col justify-center items-center overflow-auto relative">
          
          {/* Background grid dots for canvas aesthetic */}
          <div 
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          />

          <h3 className="text-xs font-mono font-bold text-apTextMuted mb-12 tracking-widest uppercase">
            Active Core Pipeline Flow
          </h3>

          {/* Connected widgets block */}
          <div className="flex flex-col md:flex-row items-center gap-4 z-10 max-w-full overflow-x-auto p-4">
            
            {/* Widget 1 */}
            <div className="w-48 bg-apSurface border border-apAccent/40 p-4 rounded-xl shadow-lg relative">
              <div className="absolute top-2 right-2 text-[8px] font-mono font-bold text-apAccent bg-apAccent/10 px-1 rounded">
                STEP 1
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4.5 h-4.5 text-apAccent" />
                <h4 className="text-xs font-bold">Open URL</h4>
              </div>
              <p className="text-[10px] text-apTextMuted font-mono truncate">
                Map: {activeProject.columnMap.page_url || 'UNMAPPED'}
              </p>
            </div>

            <ArrowRight className="w-5 h-5 text-apTextMuted hidden md:block" />

            {/* Widget 2 */}
            <div className="w-48 bg-apSurface border border-apBorder p-4 rounded-xl shadow-md relative">
              <div className="absolute top-2 right-2 text-[8px] font-mono font-bold text-apTextMuted bg-apBackground border border-apBorder px-1 rounded">
                STEP 2
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4.5 h-4.5 text-apSuccess" />
                <h4 className="text-xs font-bold">Find Text</h4>
              </div>
              <p className="text-[10px] text-apTextMuted font-mono truncate">
                Map: {activeProject.columnMap.expected_content || 'UNMAPPED'}
              </p>
            </div>

            <ArrowRight className="w-5 h-5 text-apTextMuted hidden md:block" />

            {/* Widget 3 */}
            <div className="w-48 bg-apSurface border border-apBorder p-4 rounded-xl shadow-md relative">
              <div className="absolute top-2 right-2 text-[8px] font-mono font-bold text-apTextMuted bg-apBackground border border-apBorder px-1 rounded">
                STEP 3
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Compass className="w-4.5 h-4.5 text-apWarning" />
                <h4 className="text-xs font-bold">Find Button</h4>
              </div>
              <p className="text-[10px] text-apTextMuted font-mono truncate">
                Map: {activeProject.columnMap.button_name || 'UNMAPPED'}
              </p>
            </div>

            <ArrowRight className="w-5 h-5 text-apTextMuted hidden md:block" />

            {/* Widget 4 */}
            <div className="w-48 bg-apSurface border border-apBorder p-4 rounded-xl shadow-md relative">
              <div className="absolute top-2 right-2 text-[8px] font-mono font-bold text-apTextMuted bg-apBackground border border-apBorder px-1 rounded">
                STEP 4
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4.5 h-4.5 text-apFailure" />
                <h4 className="text-xs font-bold">Match Redirect</h4>
              </div>
              <p className="text-[10px] text-apTextMuted font-mono truncate">
                Map: {activeProject.columnMap.button_redirect_url || 'UNMAPPED'}
              </p>
            </div>

          </div>

          {/* Active Flow Legend */}
          <div className="mt-16 max-w-md bg-apSurface border border-apBorder p-4 rounded-lg text-center z-10">
            <h5 className="text-xs font-bold flex items-center justify-center gap-2 mb-1">
              <HelpCircle className="w-4 h-4 text-apAccent" />
              Phase 1 Standard Flow
            </h5>
            <p className="text-[10px] text-apTextMuted leading-relaxed">
              Playwright will sequentially open the page URL, verify body text includes expected content, locate button containing target label, click, and audit redirects.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default FlowBuilder;
