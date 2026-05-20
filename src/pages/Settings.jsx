import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import { Settings as SettingsIcon, Shield, FolderOpen, Save, Check, Volume2, Info } from 'lucide-react';

function Settings() {
  const { settings, saveSettings, initStore } = useProjectStore();
  const [pageLoadTimeout, setPageLoadTimeout] = useState(settings.pageLoadTimeout / 1000);
  const [elementWaitTimeout, setElementWaitTimeout] = useState(settings.elementWaitTimeout / 1000);
  const [stopOnFail, setStopOnFail] = useState(settings.stopOnFail);
  const [parallelWorkers, setParallelWorkers] = useState(settings.parallelWorkers || 1);
  const [autoSaveLocation, setAutoSaveLocation] = useState(settings.autoSaveLocation || '');
  const [includeScreenshots, setIncludeScreenshots] = useState(settings.includeScreenshots || false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Make sure we have latest loaded settings on mount
    initStore().then(() => {
      const latest = useProjectStore.getState().settings;
      setPageLoadTimeout(latest.pageLoadTimeout / 1000);
      setElementWaitTimeout(latest.elementWaitTimeout / 1000);
      setStopOnFail(latest.stopOnFail);
      setParallelWorkers(latest.parallelWorkers || 1);
      setAutoSaveLocation(latest.autoSaveLocation || '');
      setIncludeScreenshots(latest.includeScreenshots || false);
    });
  }, [initStore]);

  const handleSelectFolder = async () => {
    try {
      const path = await window.api.selectDirectory();
      if (path) {
        setAutoSaveLocation(path);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    const updated = {
      pageLoadTimeout: pageLoadTimeout * 1000,
      elementWaitTimeout: elementWaitTimeout * 1000,
      stopOnFail,
      parallelWorkers,
      autoSaveLocation,
      includeScreenshots
    };
    await saveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn">
      
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-apBorder pb-4">
        <div>
          <h2 className="text-xl font-bold text-apTextPrimary tracking-tight">Audit Engine Settings</h2>
          <p className="text-xs text-apTextMuted mt-1">Configure timeouts, execution behaviors, and output locations.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-apAccent hover:bg-apAccent/90 text-apBackground font-mono font-bold text-xs tracking-wider rounded-lg transition-all shadow-lg shadow-apAccent/15"
        >
          {saveSuccess ? <Check className="w-4 h-4 animate-scaleUp" /> : <Save className="w-4 h-4" />}
          {saveSuccess ? 'CONFIG SAVED' : 'SAVE CHANGES'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Playwright Timeouts Box */}
        <section className="bg-apSurface border border-apBorder rounded-xl p-6 space-y-4 shadow-md">
          <h3 className="text-xs font-mono font-bold text-apTextMuted uppercase tracking-wider flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-apAccent" />
            Playwright Browser Timeouts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Page Load Timeout */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-apTextPrimary">Page Loading Timeout</label>
              <p className="text-[10px] text-apTextMuted leading-normal">Seconds to wait for HTML document load events before timing out.</p>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={pageLoadTimeout}
                  onChange={(e) => setPageLoadTimeout(parseInt(e.target.value, 10))}
                  className="flex-1 bg-apBackground accent-apAccent h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-mono text-xs text-apAccent bg-apBackground border border-apBorder px-2.5 py-1 rounded w-16 text-center">
                  {pageLoadTimeout}s
                </span>
              </div>
            </div>

            {/* Element Wait Timeout */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-apTextPrimary">Element Locating Timeout</label>
              <p className="text-[10px] text-apTextMuted leading-normal">Seconds to await button visibility, anchor clicks, or redirect validations.</p>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={elementWaitTimeout}
                  onChange={(e) => setElementWaitTimeout(parseInt(e.target.value, 10))}
                  className="flex-1 bg-apBackground accent-apAccent h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-mono text-xs text-apAccent bg-apBackground border border-apBorder px-2.5 py-1 rounded w-16 text-center">
                  {elementWaitTimeout}s
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Execution Behaviors Box */}
        <section className="bg-apSurface border border-apBorder rounded-xl p-6 space-y-5 shadow-md">
          <h3 className="text-xs font-mono font-bold text-apTextMuted uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-apSuccess" />
            Execution Controls & Isolation
          </h3>

          <div className="space-y-4 pt-1">
            {/* Stop on Fail Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-apBackground/30 border border-apBorder/60">
              <div className="max-w-md">
                <h4 className="text-xs font-bold text-apTextPrimary">Stop on First Failed Widget</h4>
                <p className="text-[10px] text-apTextMuted leading-normal mt-0.5">
                  If any individual audit step (e.g. content mismatch) fails, immediately stop running the active row and skip remaining steps to save bandwidth.
                </p>
              </div>
              <button
                onClick={() => setStopOnFail(!stopOnFail)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${stopOnFail ? 'bg-apAccent' : 'bg-apBorder'}`}
              >
                <div className={`w-4.5 h-4.5 bg-apBackground rounded-full shadow-md transition-transform transform ${stopOnFail ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Screenshots on fail (Phase 2 config info) */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-apBackground/30 border border-apBorder/60 opacity-60">
              <div className="max-w-md">
                <h4 className="text-xs font-bold text-apTextPrimary">Capture Screenshots on Fail (Phase 2)</h4>
                <p className="text-[10px] text-apTextMuted leading-normal mt-0.5">
                  Saves high-res viewport screenshot files to the local project folder whenever a widget reports failure, linking paths to the report sheet.
                </p>
              </div>
              <button
                disabled
                className="w-11 h-6 rounded-full bg-apBorder relative flex items-center px-1 cursor-not-allowed"
              >
                <div className="w-4.5 h-4.5 bg-apBackground rounded-full shadow-md" />
              </button>
            </div>

            {/* Parallel Workers */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-apBackground/30 border border-apBorder/60">
              <div className="max-w-md">
                <h4 className="text-xs font-bold text-apTextPrimary">Parallel Execution workers</h4>
                <p className="text-[10px] text-apTextMuted leading-normal mt-0.5">
                  Distributes sheet auditing across multiple isolated Chromium threads (Advanced performance setting).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  disabled
                  value={parallelWorkers}
                  onChange={(e) => setParallelWorkers(parseInt(e.target.value, 10))}
                  className="bg-apBackground border border-apBorder px-3 py-1.5 rounded text-xs text-apTextMuted cursor-not-allowed focus:outline-none"
                >
                  <option value={1}>1 Worker (Sequential)</option>
                  <option value={2}>2 Workers</option>
                  <option value={4}>4 Workers</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Directory Export Box */}
        <section className="bg-apSurface border border-apBorder rounded-xl p-6 space-y-4 shadow-md">
          <h3 className="text-xs font-mono font-bold text-apTextMuted uppercase tracking-wider flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-apWarning" />
            Report Auto-Save Location
          </h3>

          <div className="flex flex-col gap-2 pt-1">
            <p className="text-[10px] text-apTextMuted leading-normal">
              Designated folder path where color-coded Excel sheets will automatically be saved.
            </p>
            <div className="flex gap-3 mt-1">
              <input
                type="text"
                readOnly
                value={autoSaveLocation}
                className="flex-1 bg-apBackground border border-apBorder px-3 py-2 rounded-lg text-xs font-mono text-apTextPrimary focus:outline-none"
                placeholder="Documents folder (Default)"
              />
              <button
                onClick={handleSelectFolder}
                className="px-4 py-2 bg-apBackground hover:bg-apBorder border border-apBorder text-xs text-apTextPrimary rounded-lg font-medium transition-all"
              >
                Browse...
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default Settings;
