const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Excel File Parsing & Handling
  openExcelFile: () => ipcRenderer.invoke('file:open-dialog'),
  
  // Execution Control
  startRun: (config) => ipcRenderer.send('run:start', config),
  pauseRun: () => ipcRenderer.send('run:pause'),
  stopRun: () => ipcRenderer.send('run:stop'),
  
  // Run Observers (remove listeners first to prevent duplicates if components re-mount)
  onRowResult: (callback) => {
    ipcRenderer.removeAllListeners('run:row-result');
    ipcRenderer.on('run:row-result', (event, value) => callback(value));
  },
  onLog: (callback) => {
    ipcRenderer.removeAllListeners('run:log');
    ipcRenderer.on('run:log', (event, value) => callback(value));
  },
  onRunComplete: (callback) => {
    ipcRenderer.removeAllListeners('run:complete');
    ipcRenderer.on('run:complete', (event, value) => callback(value));
  },
  
  // Report Export
  exportReport: (reportData, outputPath) => ipcRenderer.invoke('report:export', { reportData, outputPath }),
  
  // Dialog for output directory
  selectDirectory: () => ipcRenderer.invoke('file:select-directory'),
  
  // Settings & Project Store IPC
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveProject: (project) => ipcRenderer.invoke('project:save', project),
  getProjects: () => ipcRenderer.invoke('projects:get'),
  deleteProject: (id) => ipcRenderer.invoke('project:delete', id)
});
