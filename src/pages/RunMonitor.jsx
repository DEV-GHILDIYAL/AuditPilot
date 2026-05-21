import React, { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../store/projectStore';
import { Play, Pause, Square, AlertCircle, CheckCircle, ChevronRight, Terminal, Scroll } from 'lucide-react';

function RunMonitor({ setActiveTab }) {
  const { activeProject, runState, pauseExecution, stopExecution } = useProjectStore();
  const [logsCollapsed, setLogsCollapsed] = useState(false);
  const [scrollLock, setScrollLock] = useState(true);
  const [activeWorkers, setActiveWorkers] = useState(0);
  const logEndRef = useRef(null);

  useEffect(() => {
    if (scrollLock && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [runState.logs, scrollLock]);

  useEffect(() => {
    if (window.api.onWorkerCount) {
      window.api.onWorkerCount(({ activeCount }) => {
        setActiveWorkers(activeCount);
      });
    }
  }, []);

  useEffect(() => {
    if (runState.status !== 'RUNNING') {
      setActiveWorkers(0);
    }
  }, [runState.status]);

  if (!activeProject) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-center">
        <Terminal className="w-12 h-12 text-apTextMuted mb-4 animate-pulse" />
        <h4 className="font-bold text-sm">No Active Project</h4>
        <p className="text-xs text-apTextMuted mt-2">Please select or configure a project first.</p>
      </div>
    );
  }

  const { status, logs, results, progress } = runState;
  const percentComplete = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  const renderCellStatus = (stepResult) => {
    if (!stepResult) return <span className="text-apTextMuted">-</span>;
    if (stepResult.pass === true) {
      return <span className="font-mono text-[10px] font-bold text-apSuccess">✅ PASS</span>;
    }
    if (stepResult.pass === false) {
      return (
        <span className="font-mono text-[10px] font-bold text-apFailure group relative cursor-help">
          ❌ FAIL
          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black border border-apBorder text-[9px] text-apTextPrimary p-2 rounded shadow-xl hidden group-hover:block z-50 whitespace-nowrap">
            {stepResult.reason}
          </span>
        </span>
      );
    }
    if (stepResult.reason === 'SKIPPED') {
      return <span className="text-apTextMuted">-</span>;
    }
    return <span className="text-apWarning">⏳ RUNNING</span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Section: Progress Bar & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-apSurface border border-apBorder p-6 rounded-xl shadow-md">
        
        {/* Progress Display */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-apTextMuted flex items-center">
              STATUS: 
              <span className={`ml-1.5 font-bold ${
                status === 'RUNNING' ? 'text-apAccent animate-pulse' : 
                status === 'PAUSED' ? 'text-apWarning' : 
                status === 'COMPLETE' ? 'text-apSuccess' : 
                status === 'STOPPED' ? 'text-apFailure' : 'text-apTextMuted'
              }`}>{status}</span>
              {status === 'RUNNING' && activeWorkers > 0 && (
                <span className="ml-3 px-2 py-0.5 bg-apAccent/10 text-apAccent border border-apAccent/20 text-[9px] font-bold font-mono rounded animate-pulse inline-flex items-center gap-1">
                  ⚡ {activeWorkers} {activeWorkers === 1 ? 'WORKER ACTIVE' : 'WORKERS ACTIVE'}
                </span>
              )}
            </span>
            <span>{progress.processed} / {progress.total} ROWS ({percentComplete}%)</span>
          </div>
          
          <div className="h-2 w-full bg-apBackground rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${status === 'PAUSED' ? 'bg-apWarning' : 'bg-apAccent'}`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          <div className="flex gap-6 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 text-apTextMuted">
              TOTAL: <span className="font-bold text-apTextPrimary">{progress.total}</span>
            </div>
            <div className="flex items-center gap-1.5 text-apSuccess">
              PASSED: <span className="font-bold">{progress.passed}</span>
            </div>
            <div className="flex items-center gap-1.5 text-apFailure">
              FAILED: <span className="font-bold">{progress.failed}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3">
          {status === 'RUNNING' || status === 'PAUSED' ? (
            <>
              <button
                onClick={pauseExecution}
                className="flex items-center justify-center p-3 border border-apBorder hover:border-apWarning/40 bg-apBackground hover:bg-apWarning/10 text-apWarning rounded-lg transition-all"
                title={status === 'RUNNING' ? 'Pause' : 'Resume'}
              >
                {status === 'RUNNING' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={stopExecution}
                className="flex items-center justify-center p-3 border border-apBorder hover:border-apFailure/40 bg-apBackground hover:bg-apFailure/10 text-apFailure rounded-lg transition-all"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            </>
          ) : (
            status === 'COMPLETE' || status === 'STOPPED' ? (
              <button
                onClick={() => setActiveTab('report')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-apAccent hover:bg-apAccent/90 text-apBackground font-mono font-bold text-xs tracking-wider rounded-lg transition-all shadow-lg shadow-apAccent/10"
              >
                VIEW REPORT
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null
          )}
        </div>
      </div>

      {/* Middle Section: Scrolling Live Monitor Grid */}
      <div className="bg-apSurface border border-apBorder rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '320px' }}>
        <div className="flex items-center gap-2 px-6 py-3 border-b border-apBorder bg-apBackground/30 text-xs font-semibold uppercase tracking-wider text-apTextMuted">
          <Scroll className="w-4 h-4 text-apAccent" />
          Audit Grid Stream
        </div>

        <div className="overflow-auto" style={{ maxHeight: '400px' }}>
          {results.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-8">
              <span className="text-xs text-apTextMuted animate-pulse font-mono">
                {status === 'RUNNING' ? 'Awaiting Playwright execution results...' : 'Launch pipeline run to monitor status.'}
              </span>
            </div>
          ) : (
            <table className="w-full text-left font-mono text-[10px] border-collapse">
              <thead>
                <tr className="bg-apBackground border-b border-apBorder text-apTextMuted sticky top-0 z-10">
                  <th className="py-2.5 px-4 w-16 text-center border-r border-apBorder">Row #</th>
                  <th className="py-2.5 px-4 w-20 border-r border-apBorder">Lang</th>
                  <th className="py-2.5 px-4 border-r border-apBorder max-w-[200px] truncate">Target Page URL</th>
                  <th className="py-2.5 px-4 text-center border-r border-apBorder w-28">Open URL</th>
                  <th className="py-2.5 px-4 text-center border-r border-apBorder w-28">Content</th>
                  <th className="py-2.5 px-4 text-center border-r border-apBorder w-28">Button</th>
                  <th className="py-2.5 px-4 text-center border-r border-apBorder w-28">Redirect</th>
                  <th className="py-2.5 px-4 text-center w-24">Overall</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => (
                  <tr key={idx} className="border-b border-apBorder/50 hover:bg-apBackground/40">
                    <td className="py-2 px-4 text-center text-apTextMuted border-r border-apBorder font-bold">{row.rowNumber}</td>
                    <td className="py-2 px-4 border-r border-apBorder">{row.language}</td>
                    <td className="py-2 px-4 border-r border-apBorder truncate max-w-[200px]" title={row.url}>{row.url}</td>
                    <td className="py-2 px-4 text-center border-r border-apBorder">{renderCellStatus(row.results.openUrl)}</td>
                    <td className="py-2 px-4 text-center border-r border-apBorder">{renderCellStatus(row.results.findText)}</td>
                    <td className="py-2 px-4 text-center border-r border-apBorder">{renderCellStatus(row.results.findButton)}</td>
                    <td className="py-2 px-4 text-center border-r border-apBorder">{renderCellStatus(row.results.matchRedirectUrl)}</td>
                    <td className="py-2 px-4 text-center font-bold">
                      <span className={row.status === 'PASS' ? 'text-apSuccess' : 'text-apFailure'}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bottom Section: Live Log Terminal */}
      <div className={`border border-apBorder rounded-xl bg-black overflow-hidden flex flex-col transition-all duration-300 ${
        logsCollapsed ? 'h-10' : 'h-48'
      }`}>
        <div className="flex items-center justify-between px-6 py-2.5 bg-apSurface/90 border-b border-apBorder text-[10px] font-mono font-bold tracking-wider text-apTextMuted">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-apAccent animate-pulse" />
            LIVE RUN LOGS
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScrollLock(!scrollLock)}
              className={`px-1.5 py-0.5 rounded border text-[9px] ${scrollLock ? 'bg-apAccent/10 border-apAccent text-apAccent' : 'border-apBorder text-apTextMuted'}`}
            >
              SCROLL LOCK: {scrollLock ? 'ON' : 'OFF'}
            </button>
            <button 
              onClick={() => setLogsCollapsed(!logsCollapsed)}
              className="hover:text-apTextPrimary transition-colors"
            >
              {logsCollapsed ? 'EXPAND' : 'COLLAPSE'}
            </button>
          </div>
        </div>

        {!logsCollapsed && (
          <div className="flex-1 overflow-auto p-4 space-y-1 font-mono text-[10px]">
            {logs.length === 0 ? (
              <span className="text-apTextMuted block italic">Terminal logs ready...</span>
            ) : (
              logs.map((log, lIdx) => (
                <div key={lIdx} className="flex gap-2">
                  <span className="text-apTextMuted">[{log.timestamp}]</span>
                  <span className={
                    log.level === 'error' ? 'text-apFailure' : 
                    log.level === 'warn' ? 'text-apWarning' : 
                    log.level === 'PASS' ? 'text-apSuccess' : 'text-apTextPrimary'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        )}
      </div>

    </div>
  );
}

export default RunMonitor;
