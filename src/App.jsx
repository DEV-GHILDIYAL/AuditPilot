import React, { useState, useEffect } from 'react';
import { useProjectStore } from './store/projectStore';
import { Home as HomeIcon, Upload as UploadIcon, Network, Activity, FileSpreadsheet, Settings as SettingsIcon } from 'lucide-react';

import Home from './pages/Home';
import Upload from './pages/Upload';
import FlowBuilder from './pages/FlowBuilder';
import RunMonitor from './pages/RunMonitor';
import Report from './pages/Report';
import Settings from './pages/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const { initStore, runState } = useProjectStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  const navigation = [
    { id: 'home', label: 'Dashboard', icon: HomeIcon },
    { id: 'upload', label: 'Excel Upload', icon: UploadIcon },
    { id: 'flow', label: 'Flow Builder', icon: Network },
    { id: 'monitor', label: 'Run Monitor', icon: Activity },
    { id: 'report', label: 'Audit Report', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home setActiveTab={setActiveTab} />;
      case 'upload':
        return <Upload setActiveTab={setActiveTab} />;
      case 'flow':
        return <FlowBuilder setActiveTab={setActiveTab} />;
      case 'monitor':
        return <RunMonitor setActiveTab={setActiveTab} />;
      case 'report':
        return <Report setActiveTab={setActiveTab} />;
      case 'settings':
        return <Settings />;
      default:
        return <Home setActiveTab={setActiveTab} />;
    }
  };

  const getSystemStatus = () => {
    if (runState.status === 'RUNNING') return { text: 'RUNNING', style: 'text-apAccent animate-pulse border-apAccent/20 bg-apAccent/5' };
    if (runState.status === 'PAUSED') return { text: 'PAUSED', style: 'text-apWarning border-apWarning/20 bg-apWarning/5' };
    if (runState.status === 'COMPLETE') return { text: 'COMPLETE', style: 'text-apSuccess border-apSuccess/20 bg-apSuccess/5' };
    if (runState.status === 'STOPPED') return { text: 'STOPPED', style: 'text-apFailure border-apFailure/20 bg-apFailure/5' };
    return { text: 'READY', style: 'text-apSuccess border-apBorder bg-apBackground/30' };
  };

  const sysStatus = getSystemStatus();

  return (
    <div className="flex h-screen bg-apBackground text-apTextPrimary overflow-hidden font-sans select-none">
      {/* Sidebar */}
      <aside className="w-64 bg-apSurface border-r border-apBorder flex flex-col flex-shrink-0">
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-apBorder gap-3">
          <div className="w-8 h-8 rounded-lg bg-apAccent flex items-center justify-center shadow-lg shadow-apAccent/20">
            <span className="font-mono font-bold text-sm text-apBackground">AP</span>
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide">AuditPilot</h1>
            <span className="text-[10px] text-apTextMuted font-mono">v1.0.0 (Phase 1)</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-apAccent/10 text-apAccent border-l-2 border-apAccent pl-2.5'
                    : 'text-apTextMuted hover:bg-apSurface/50 hover:text-apTextPrimary border-l-2 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-apAccent' : 'text-apTextMuted'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* System Info */}
        <div className="p-4 border-t border-apBorder bg-apBackground/40">
          <div className="flex items-center justify-between text-[10px] font-mono text-apTextMuted">
            <span>ENGINE: PLAYWRIGHT</span>
            <span className="w-2 h-2 rounded-full bg-apSuccess animate-pulse"></span>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* TopBar */}
        <header className="h-16 bg-apSurface border-b border-apBorder flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-apTextMuted">
              {navigation.find((n) => n.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className={`text-[10px] font-mono border px-3 py-1 rounded font-bold ${sysStatus.style}`}>
              STATUS: {sysStatus.text}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8 bg-apBackground min-w-0">
          <div className="max-w-6xl mx-auto h-full">
            {renderActiveContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
