const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

// ─────────────────────────────────────────────────────────────────────────────
// Plain-JSON Persistence Layer
// Replaces electron-store (v8+ is ESM-only and cannot be require()'d in CJS).
// All data lives in a single JSON file in Electron's userData directory.
// userData path is only available after app is ready, so we resolve lazily.
// ─────────────────────────────────────────────────────────────────────────────

let _storePath = null;

function getStorePath() {
  if (!_storePath) {
    _storePath = path.join(app.getPath('userData'), 'auditpilot-data.json');
  }
  return _storePath;
}

function readStore() {
  try {
    const p = getStorePath();
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error('[store] Failed to read store file:', e.message);
    return {};
  }
}

function writeStore(data) {
  try {
    const p = getStorePath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[store] Failed to write store file:', e.message);
    return false;
  }
}

function storeGet(key, defaultValue) {
  const data = readStore();
  return data[key] !== undefined ? data[key] : defaultValue;
}

function storeSet(key, value) {
  const data = readStore();
  data[key] = value;
  writeStore(data);
}

function storeDelete(key) {
  const data = readStore();
  delete data[key];
  writeStore(data);
}

// Default settings object
const DEFAULT_SETTINGS = {
  pageLoadTimeout: 30000,
  elementWaitTimeout: 5000,
  stopOnFail: true,
  parallelWorkers: 1,
  autoSaveLocation: '',
  includeScreenshots: false
};

// ─────────────────────────────────────────────────────────────────────────────

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'AuditPilot',
    backgroundColor: '#0E0E10'
  });

  mainWindow.setMenuBarVisibility(false);

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC Handler: Excel File Open Dialogue & SheetJS Local Parsing
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle('file:open-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Excel / CSV Files', extensions: ['xlsx', 'xls', 'csv'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, cancelled: true };
    }

    const filePath = result.filePaths[0];
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (rawData.length === 0) {
      return { success: false, message: 'The selected spreadsheet contains no data.' };
    }

    const headers = rawData[0].map((h, i) => h ? String(h).trim() : `Column_${i + 1}`);
    const dataRows = rawData.slice(1);

    const previewRows = dataRows.slice(0, 5).map((row, idx) => {
      const obj = {};
      headers.forEach((h, hIdx) => {
        obj[h] = row[hIdx] !== undefined ? String(row[hIdx]) : '';
      });
      return { rowNumber: idx + 2, data: obj };
    });

    return { success: true, filePath, headers, previewRows, totalCount: dataRows.length };
  } catch (err) {
    return { success: false, message: `Failed to parse Excel file: ${err.message}` };
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC Handler: Excel Styled Report Export
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle('report:export', async (event, { reportData, folder, filename }) => {
  try {
    const { exportReport } = require('./automation/reporter');

    // Resolve output folder: use provided path or fall back to Downloads
    const outputFolder = (folder && folder.trim()) ? folder.trim() : app.getPath('downloads');
    const outputPath = path.join(outputFolder, filename || `audit_report_${Date.now()}.xlsx`);

    console.log('[report:export] Writing report to:', outputPath);
    exportReport(reportData, outputPath);

    // Show native success dialog
    await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Report Exported',
      message: 'Audit report saved successfully.',
      detail: `Report saved to:\n${outputPath}`,
      buttons: ['OK']
    });

    return { success: true, outputPath };
  } catch (err) {
    console.error('[report:export] Failed:', err);
    await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Export Failed',
      message: 'Could not save the audit report.',
      detail: err.message,
      buttons: ['OK']
    });
    return { success: false, message: err.message };
  }
});

// IPC Handler: Get system Downloads path (not available in renderer)
ipcMain.handle('app:get-downloads-path', async () => {
  return app.getPath('downloads');
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC Handler: Select Directory Dialogue
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle('file:select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC Handlers: Settings — plain JSON persistence
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle('settings:save', async (event, settings) => {
  console.log('[settings:save] Saving to disk:', settings);
  storeSet('settings', settings);
  // Confirm it was written correctly
  const written = storeGet('settings', null);
  console.log('[settings:save] Confirmed on-disk value:', written);
  return true;
});

ipcMain.handle('settings:get', async () => {
  const saved = storeGet('settings', null);
  if (saved) {
    // Merge with defaults to handle any missing keys from older saves
    const merged = { ...DEFAULT_SETTINGS, ...saved };
    console.log('[settings:get] Loaded from disk:', merged);
    return merged;
  }
  console.log('[settings:get] No saved settings found, returning defaults');
  return { ...DEFAULT_SETTINGS, autoSaveLocation: app.getPath('downloads') };
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC Handlers: Visual Flow Persistence
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle('flow:save', async (event, flow) => {
  storeSet('savedFlow', flow);
  return true;
});

ipcMain.handle('flow:get', async () => {
  return storeGet('savedFlow', null);
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC Handlers: Project CRUD — plain JSON persistence
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle('project:save', async (event, project) => {
  const projects = storeGet('projects', []);
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx > -1) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  storeSet('projects', projects);
  console.log(`[project:save] Saved project "${project.name}" (${project.id}). Total: ${projects.length}`);
  return true;
});

ipcMain.handle('projects:get', async () => {
  const projects = storeGet('projects', []);
  console.log(`[projects:get] Returning ${projects.length} project(s)`);
  return projects;
});

ipcMain.handle('project:delete', async (event, id) => {
  const projects = storeGet('projects', []);
  const filtered = projects.filter(p => p.id !== id);
  storeSet('projects', filtered);
  console.log(`[project:delete] Deleted project ${id}. Remaining: ${filtered.length}`);
  return true;
});

// ─────────────────────────────────────────────────────────────────────────────
// Runner IPC Event Control Hooks
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.on('run:start', (event, config) => {
  const { startRun } = require('./automation/runner');
  startRun(config, mainWindow);
});

ipcMain.on('run:pause', () => {
  const { pauseRun } = require('./automation/runner');
  pauseRun();
});

ipcMain.on('run:stop', () => {
  const { stopRun } = require('./automation/runner');
  stopRun();
});
