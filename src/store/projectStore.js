import { create } from 'zustand';
import { useFlowStore } from './flowStore';

// Helper: Parse row range strings like "2-10, 15, 20-30" into sorted unique row indices
export function parseRowRanges(rangeStr, totalDataRows) {
  if (!rangeStr || !rangeStr.trim()) return [];
  
  const resolved = new Set();
  const maxExcelRow = totalDataRows + 1; // Row 1 is header, data rows start at Row 2
  
  // Normalize en/em dashes to hyphens, remove spaces
  const normalized = rangeStr
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, '');
    
  const parts = normalized.split(',');
  
  for (const part of parts) {
    if (!part) continue;
    
    if (part.includes('-')) {
      const bounds = part.split('-');
      if (bounds.length === 2) {
        const start = parseInt(bounds[0], 10);
        const end = parseInt(bounds[1], 10);
        
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          const actualStart = Math.max(2, start);
          const actualEnd = Math.min(maxExcelRow, end);
          for (let r = actualStart; r <= actualEnd; r++) {
            resolved.add(r);
          }
        }
      }
    } else {
      const rowNum = parseInt(part, 10);
      if (!isNaN(rowNum) && rowNum >= 2 && rowNum <= maxExcelRow) {
        resolved.add(rowNum);
      }
    }
  }
  
  return Array.from(resolved).sort((a, b) => a - b);
}

export const useProjectStore = create((set, get) => ({
  // Core System States
  settings: {
    pageLoadTimeout: 30000,
    elementWaitTimeout: 5000,
    stopOnFail: true,
    parallelWorkers: 1,
    autoSaveLocation: '',
    includeScreenshots: false,
    theme: 'dark'
  },
  projects: [],
  
  // Active Project State
  activeProject: null, // { id, name, lastRunDate, filePath, headers, previewRows, totalCount, selectedRanges: [], rangeString: "", columnMap: {} }
  
  // Runner Progress Logs and Status State
  runState: {
    status: 'IDLE', // 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETE' | 'STOPPED' | 'ERROR'
    logs: [],       // Array of { message, level, timestamp }
    results: [],    // Array of { rowNumber, language, url, results: { openUrl, findText, findButton, matchRedirectUrl }, status }
    progress: {
      total: 0,
      processed: 0,
      passed: 0,
      failed: 0
    }
  },

  // Initialize Store from Electron IPC
  initStore: async () => {
    try {
      const settings = await window.api.getSettings();
      const projects = await window.api.getProjects();
      set({ settings, projects });
    } catch (e) {
      console.error('Failed to init store via IPC', e);
    }
  },

  // Settings Actions
  saveSettings: async (newSettings) => {
    try {
      await window.api.saveSettings(newSettings);
      set({ settings: newSettings });
    } catch (e) {
      console.error(e);
    }
  },

  // Project Actions
  loadProjects: async () => {
    try {
      const projects = await window.api.getProjects();
      set({ projects });
    } catch (e) {
      console.error(e);
    }
  },

  saveProject: async (project) => {
    try {
      await window.api.saveProject(project);
      const projects = await window.api.getProjects();
      set({ projects });
    } catch (e) {
      console.error(e);
    }
  },

  deleteProject: async (id) => {
    try {
      await window.api.deleteProject(id);
      const projects = await window.api.getProjects();
      set({ projects });
      if (get().activeProject?.id === id) {
        set({ activeProject: null });
      }
    } catch (e) {
      console.error(e);
    }
  },

  startNewProject: () => {
    const newProj = {
      id: 'proj_' + Date.now(),
      name: 'New QA Project',
      lastRunDate: '-',
      filePath: '',
      headers: [],
      previewRows: [],
      totalCount: 0,
      selectedRanges: [],
      rangeString: '',
      columnMap: {
        language: '',
        page_url: '',
        expected_content: '',
        button_name: '',
        button_redirect_url: ''
      }
    };
    set({ activeProject: newProj });
  },

  openProject: (project) => {
    set({ activeProject: { ...project } });
    // Reset runState when opening
    set({
      runState: {
        status: 'IDLE',
        logs: [],
        results: [],
        progress: { total: 0, processed: 0, passed: 0, failed: 0 }
      }
    });
  },

  closeActiveProject: () => {
    set({ activeProject: null });
  },

  updateActiveProjectName: (name) => {
    const active = get().activeProject;
    if (active) {
      const updated = { ...active, name };
      set({ activeProject: updated });
      get().saveProject(updated);
    }
  },

  // Excel Parsing and Selection Actions
  uploadExcel: async () => {
    const active = get().activeProject;
    if (!active) return { success: false, message: 'No active project' };
    
    try {
      const res = await window.api.openExcelFile();
      if (!res.success) {
        return res; // contains cancelled: true or message
      }
      
      // Auto-assign default ranges: "2-total"
      const defaultRangeString = `2-${res.totalCount + 1}`;
      const defaultRanges = parseRowRanges(defaultRangeString, res.totalCount);

      // Attempt to auto-map columns by matching header strings
      const autoMap = {
        language: '',
        page_url: '',
        expected_content: '',
        button_name: '',
        button_redirect_url: ''
      };

      res.headers.forEach(h => {
        const headerLower = h.toLowerCase();
        if (headerLower.includes('lang') || headerLower.includes('locale')) {
          autoMap.language = h;
        } else if (headerLower.includes('url') || headerLower.includes('link')) {
          if (headerLower.includes('redirect') || headerLower.includes('destination') || headerLower.includes('target')) {
            autoMap.button_redirect_url = h;
          } else {
            autoMap.page_url = h;
          }
        } else if (headerLower.includes('text') || headerLower.includes('content') || headerLower.includes('word') || headerLower.includes('expect')) {
          autoMap.expected_content = h;
        } else if (headerLower.includes('button') || headerLower.includes('cta') || headerLower.includes('label')) {
          autoMap.button_name = h;
        }
      });

      const updated = {
        ...active,
        filePath: res.filePath,
        headers: res.headers,
        previewRows: res.previewRows,
        totalCount: res.totalCount,
        rangeString: defaultRangeString,
        selectedRanges: defaultRanges,
        columnMap: autoMap
      };
      
      set({ activeProject: updated });
      await get().saveProject(updated);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  updateRowRanges: (rangeString) => {
    const active = get().activeProject;
    if (!active) return;
    
    const resolved = parseRowRanges(rangeString, active.totalCount);
    const updated = { ...active, rangeString, selectedRanges: resolved };
    set({ activeProject: updated });
    get().saveProject(updated);
  },

  updateColumnRole: (role, columnName) => {
    const active = get().activeProject;
    if (!active) return;
    
    const updatedMap = { ...active.columnMap, [role]: columnName };
    const updated = { ...active, columnMap: updatedMap };
    set({ activeProject: updated });
    get().saveProject(updated);
  },

  // Runner Control Actions
  startExecution: () => {
    const active = get().activeProject;
    const settings = get().settings;
    if (!active || !active.filePath || active.selectedRanges.length === 0) return;

    // Reset progress details
    set({
      runState: {
        status: 'RUNNING',
        logs: [],
        results: [],
        progress: {
          total: active.selectedRanges.length,
          processed: 0,
          passed: 0,
          failed: 0
        }
      }
    });

    // Wire up listener hooks
    window.api.onLog((logEvent) => {
      set(state => ({
        runState: {
          ...state.runState,
          logs: [...state.runState.logs, { ...logEvent, timestamp: new Date().toLocaleTimeString() }]
        }
      }));
    });

    window.api.onRowResult((resultEvent) => {
      set(state => {
        const results = [...state.runState.results, resultEvent];
        const processed = results.length;
        const passed = results.filter(r => r.status === 'PASS').length;
        const failed = results.filter(r => r.status === 'FAIL').length;
        
        return {
          runState: {
            ...state.runState,
            results,
            progress: {
              ...state.runState.progress,
              processed,
              passed,
              failed
            }
          }
        };
      });
    });

    window.api.onRunComplete(({ summary }) => {
      set(state => {
        const finalStatus = summary.status === 'COMPLETE' ? 'COMPLETE' : (summary.status === 'STOPPED' ? 'STOPPED' : 'ERROR');
        
        // Save execution parameters back to project history
        const activeProj = state.activeProject;
        if (activeProj) {
          const passRate = summary.processed > 0 ? Math.round((summary.passed / summary.processed) * 100) : 0;
          const updatedProj = {
            ...activeProj,
            lastRunDate: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            lastRunSummary: {
              total: summary.total,
              passed: summary.passed,
              failed: summary.failed,
              passRate
            }
          };
          // Schedule save asynchronously so it doesn't block the UI thread update
          setTimeout(() => state.saveProject(updatedProj), 10);
          return {
            runState: {
              ...state.runState,
              status: finalStatus
            },
            activeProject: updatedProj
          };
        }
        
        return {
          runState: {
            ...state.runState,
            status: finalStatus
          }
        };
      });
    });

    // Launch actual IPC call
    const flow = useFlowStore.getState().getOrderedSequence();
    window.api.startRun({
      filePath: active.filePath,
      selectedRanges: active.selectedRanges,
      columnMap: active.columnMap,
      flow,
      settings: {
        pageLoadTimeout: settings.pageLoadTimeout,
        elementWaitTimeout: settings.elementWaitTimeout,
        stopOnFail: settings.stopOnFail,
        includeScreenshots: settings.includeScreenshots,
        parallelWorkers: settings.parallelWorkers || 1
      }
    });
  },

  pauseExecution: () => {
    window.api.pauseRun();
    set(state => ({
      runState: {
        ...state.runState,
        status: state.runState.status === 'RUNNING' ? 'PAUSED' : 'RUNNING'
      }
    }));
  },

  stopExecution: () => {
    window.api.stopRun();
    set(state => ({
      runState: {
        ...state.runState,
        status: 'STOPPED'
      }
    }));
  },

  exportExcelReport: async () => {
    const results = get().runState.results;
    const settings = get().settings;
    if (results.length === 0) return { success: false, message: 'No run outcomes available to export.' };

    // Generate timestamped filename
    const timestamp = new Date().toISOString().replace(/[T:]/g, '_').replace(/\..+/, '');
    const filename = `audit_report_${timestamp}.xlsx`;

    // Resolve folder: use configured path or ask main process for Downloads folder
    // path.join is NOT available in renderer — main process assembles the full path
    let folder = settings.autoSaveLocation || '';
    if (!folder) {
      try {
        folder = await window.api.getDownloadsPath();
      } catch (e) {
        folder = '';
      }
    }

    try {
      // Pass folder + filename separately; main.js joins them with Node path
      const res = await window.api.exportReport(results, folder, filename);
      return res;
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
}));
