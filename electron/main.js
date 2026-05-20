const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

// Initialize Electron Store with a robust fallback
let storeInstance = null;
try {
  const Store = require('electron-store');
  storeInstance = new Store();
} catch (err) {
  console.log('Failed to load electron-store, using fallback file store', err.message);
  const storePath = path.join(app ? app.getPath('userData') : process.cwd(), 'auditpilot-store.json');
  storeInstance = {
    get: (key, defaultValue) => {
      try {
        if (!fs.existsSync(storePath)) return defaultValue;
        const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
        return data[key] !== undefined ? data[key] : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    },
    set: (key, value) => {
      try {
        const data = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, 'utf8')) : {};
        data[key] = value;
        fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
      } catch (e) {
        console.error('Failed to write store', e);
      }
    },
    delete: (key) => {
      try {
        if (fs.existsSync(storePath)) {
          const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
          delete data[key];
          fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
        }
      } catch (e) {}
    }
  };
}

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

// IPC Handler: Excel File Open Dialogue & SheetJS Local Parsing
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
    
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    if (rawData.length === 0) {
      return { success: false, message: "The selected spreadsheet contains no data." };
    }
    
    const headers = rawData[0].map((h, i) => h ? String(h).trim() : `Column_${i + 1}`);
    const dataRows = rawData.slice(1);
    
    // preview first 5 data rows
    const previewRows = dataRows.slice(0, 5).map((row, idx) => {
      const obj = {};
      headers.forEach((h, hIdx) => {
        obj[h] = row[hIdx] !== undefined ? String(row[hIdx]) : "";
      });
      return {
        rowNumber: idx + 2, // Row numbers (Row 1 is header, data starts at Row 2)
        data: obj
      };
    });
    
    return {
      success: true,
      filePath,
      headers,
      previewRows,
      totalCount: dataRows.length
    };
  } catch (err) {
    return { success: false, message: `Failed to parse Excel file: ${err.message}` };
  }
});

// IPC Handler: Excel Styled Report Export
ipcMain.handle('report:export', async (event, { reportData, outputPath }) => {
  try {
    const { exportReport } = require('./automation/reporter');
    exportReport(reportData, outputPath);
    return { success: true, outputPath };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// IPC Handler: Select Directory Dialogue
ipcMain.handle('file:select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// IPC Handler: Settings management
ipcMain.handle('settings:save', async (event, settings) => {
  storeInstance.set('settings', settings);
  return true;
});

ipcMain.handle('settings:get', async () => {
  return storeInstance.get('settings', {
    pageLoadTimeout: 30000,
    elementWaitTimeout: 5000,
    stopOnFail: true,
    parallelWorkers: 1,
    autoSaveLocation: app ? app.getPath('documents') : process.cwd(),
    includeScreenshots: false
  });
});

// IPC Handler: Project store
ipcMain.handle('project:save', async (event, project) => {
  const projects = storeInstance.get('projects', []);
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx > -1) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  storeInstance.set('projects', projects);
  return true;
});

ipcMain.handle('projects:get', async () => {
  return storeInstance.get('projects', []);
});

ipcMain.handle('project:delete', async (event, id) => {
  const projects = storeInstance.get('projects', []);
  const filtered = projects.filter(p => p.id !== id);
  storeInstance.set('projects', filtered);
  return true;
});

// Runner IPC Event Control Hooks
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
