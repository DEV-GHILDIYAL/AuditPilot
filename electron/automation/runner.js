const { chromium } = require('playwright');
const XLSX = require('xlsx');
const path = require('path');

const openUrlWidget = require('./widgets/openUrl');
const findTextWidget = require('./widgets/findText');
const findButtonWidget = require('./widgets/findButton');
const matchRedirectUrlWidget = require('./widgets/matchRedirectUrl');

let activeRunner = null;

class FlowRunner {
  constructor(config, win) {
    this.filePath = config.filePath;
    this.selectedRanges = config.selectedRanges || []; // Array of resolved 1-based row numbers
    this.columnMap = config.columnMap || {};
    this.flow = config.flow || [
      { id: 'node_open', type: 'openUrl', config: {} },
      { id: 'node_text', type: 'findText', config: {} },
      { id: 'node_btn', type: 'findButton', config: {} },
      { id: 'node_redirect', type: 'matchRedirectUrl', config: {} }
    ];
    this.settings = config.settings || {
      pageLoadTimeout: 30000,
      elementWaitTimeout: 5000,
      stopOnFail: true
    };
    this.win = win;
    
    this.isPaused = false;
    this.isStopped = false;
    this.pausePromise = null;
    this.pauseResolve = null;
  }

  async checkPause() {
    if (this.isPaused && !this.isStopped) {
      this.win.webContents.send('run:log', { message: 'Execution PAUSED. Waiting for resume...', level: 'warn' });
      this.pausePromise = new Promise(resolve => {
        this.pauseResolve = resolve;
      });
      await this.pausePromise;
      this.win.webContents.send('run:log', { message: 'Execution RESUMED.', level: 'info' });
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    if (this.pauseResolve) {
      this.pauseResolve();
      this.pauseResolve = null;
      this.pausePromise = null;
    }
  }

  stop() {
    this.isStopped = true;
    this.resume(); // Resume if paused so it can break the loop
  }

  async processRow(row, browser) {
    // Map column headers to generic role keys
    const mappedData = {};
    for (const [role, colHeader] of Object.entries(this.columnMap)) {
      if (colHeader && colHeader !== 'ignore') {
        mappedData[role] = row.data[colHeader] || '';
      }
    }

    this.win.webContents.send('run:log', { message: `--- [Row ${row.rowNumber}] Starting audit [Lang: ${mappedData.language || 'N/A'}] ---`, level: 'info' });

    // Initialize per-row context for isolation
    const context = await browser.newContext();
    
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(this.settings.elementWaitTimeout || 5000);

      const results = {
        openUrl: { pass: null, reason: 'SKIPPED' },
        findText: { pass: null, reason: 'SKIPPED' },
        findButton: { pass: null, reason: 'SKIPPED' },
        matchRedirectUrl: { pass: null, reason: 'SKIPPED' },
        screenshotOnFail: { pass: null, reason: 'SKIPPED' }
      };

      let continueFlow = true;
      let rowHasFailed = false;

      for (let stepIndex = 0; stepIndex < this.flow.length; stepIndex++) {
        const step = this.flow[stepIndex];
        const { type, config } = step;

        // If we should stop on fail, skip remaining steps (except screenshotOnFail on failed row)
        if (!continueFlow && this.settings.stopOnFail) {
          if (type === 'screenshotOnFail' && rowHasFailed) {
            // Keep executing screenshot
          } else {
            continue;
          }
        }

        // Map standard widget executors
        let widgetExecutor = null;
        if (type === 'openUrl') widgetExecutor = openUrlWidget;
        else if (type === 'findText') widgetExecutor = findTextWidget;
        else if (type === 'findButton') widgetExecutor = findButtonWidget;
        else if (type === 'matchRedirectUrl') widgetExecutor = matchRedirectUrlWidget;
        else if (type === 'screenshotOnFail') {
          try {
            widgetExecutor = require('./widgets/screenshotOnFail');
          } catch (err) {
            this.win.webContents.send('run:log', { message: `[Row ${row.rowNumber}] Failed to load screenshot widget: ${err.message}`, level: 'error' });
          }
        }

        if (!widgetExecutor) {
          this.win.webContents.send('run:log', { message: `[Row ${row.rowNumber}] Skipping unknown widget type: ${type}`, level: 'warn' });
          continue;
        }

        const combinedConfig = {
          ...this.settings,
          ...config
        };

        this.win.webContents.send('run:log', { 
          message: `[Row ${row.rowNumber}] [Step ${stepIndex + 1}/${this.flow.length}] Executing ${type}...`, 
          level: 'info' 
        });

        try {
          let res;
          if (type === 'screenshotOnFail') {
            const screenshotPath = path.join(
              path.dirname(this.filePath),
              'screenshots',
              `row_${row.rowNumber}_fail.png`
            );
            if (rowHasFailed) {
              res = await widgetExecutor.execute(page, combinedConfig, mappedData, { screenshotPath });
            } else {
              res = { pass: true, reason: 'SKIPPED (Row did not fail)' };
            }
          } else {
            res = await widgetExecutor.execute(page, combinedConfig, mappedData);
          }

          results[type] = res;

          if (res && res.pass === false) {
            rowHasFailed = true;
            continueFlow = false;
            this.win.webContents.send('run:log', { message: `[Row ${row.rowNumber}] Step ${type} FAILED: ${res.reason}`, level: 'error' });
          } else if (res && res.pass === true) {
            this.win.webContents.send('run:log', { message: `[Row ${row.rowNumber}] Step ${type} PASSED`, level: 'info' });
          }
        } catch (err) {
          rowHasFailed = true;
          continueFlow = false;
          results[type] = { pass: false, reason: err.message };
          this.win.webContents.send('run:log', { message: `[Row ${row.rowNumber}] Step ${type} CRASHED: ${err.message}`, level: 'error' });
        }
      }

      // Safety auto-screenshot fallback if global settings specify includeScreenshots and row failed
      if (rowHasFailed && this.settings.includeScreenshots && results.screenshotOnFail.pass === null) {
        try {
          const screenshotPath = path.join(
            path.dirname(this.filePath),
            'screenshots',
            `row_${row.rowNumber}_fail.png`
          );
          this.win.webContents.send('run:log', { message: `[Row ${row.rowNumber}] Auto-capturing failure screenshot...`, level: 'info' });
          const screenshotExecutor = require('./widgets/screenshotOnFail');
          const res = await screenshotExecutor.execute(page, this.settings, mappedData, { screenshotPath });
          results.screenshotOnFail = res;
        } catch (err) {
          this.win.webContents.send('run:log', { message: `[Row ${row.rowNumber}] Auto-screenshot capture failed: ${err.message}`, level: 'error' });
        }
      }

      const overallPass = !rowHasFailed;
      const status = overallPass ? 'PASS' : 'FAIL';
      
      this.win.webContents.send('run:row-result', {
        rowNumber: row.rowNumber,
        language: mappedData.language || 'N/A',
        url: mappedData.page_url || 'N/A',
        results,
        status
      });

      this.win.webContents.send('run:log', { 
        message: `Row ${row.rowNumber} completed with status: ${status}.`, 
        level: overallPass ? 'info' : 'error' 
      });

      return overallPass;

    } catch (rowError) {
      this.win.webContents.send('run:log', { message: `Row ${row.rowNumber} CRASHED: ${rowError.message}`, level: 'error' });
      
      const results = {
        openUrl: { pass: false, reason: `runner crash: ${rowError.message}` },
        findText: { pass: null, reason: 'SKIPPED' },
        findButton: { pass: null, reason: 'SKIPPED' },
        matchRedirectUrl: { pass: null, reason: 'SKIPPED' },
        screenshotOnFail: { pass: null, reason: 'SKIPPED' }
      };
      
      this.win.webContents.send('run:row-result', {
        rowNumber: row.rowNumber,
        language: mappedData.language || 'N/A',
        url: mappedData.page_url || 'N/A',
        results,
        status: 'FAIL'
      });
      return false;
    } finally {
      await context.close().catch(() => {});
    }
  }

  async run() {
    this.win.webContents.send('run:log', { message: 'Starting automation runner...', level: 'info' });
    
    // Read and map spreadsheet rows
    let rowsToProcess = [];
    try {
      rowsToProcess = this.getRowsToProcess();
      this.win.webContents.send('run:log', { message: `Successfully loaded ${rowsToProcess.length} rows to audit.`, level: 'info' });
    } catch (err) {
      this.win.webContents.send('run:log', { message: `Failed to load spreadsheet: ${err.message}`, level: 'error' });
      this.win.webContents.send('run:complete', { summary: { total: 0, passed: 0, failed: 0, status: 'ERROR', reason: err.message } });
      return;
    }

    if (rowsToProcess.length === 0) {
      this.win.webContents.send('run:log', { message: 'No rows selected to run.', level: 'warn' });
      this.win.webContents.send('run:complete', { summary: { total: 0, passed: 0, failed: 0, status: 'COMPLETE' } });
      return;
    }

    // Launch Playwright Headless Browser
    let browser = null;
    try {
      browser = await chromium.launch({
        headless: true
      });
      this.win.webContents.send('run:log', { message: 'Playwright headless browser initialized.', level: 'info' });
    } catch (err) {
      this.win.webContents.send('run:log', { message: `Failed to launch Playwright browser: ${err.message}`, level: 'error' });
      this.win.webContents.send('run:complete', { summary: { total: rowsToProcess.length, passed: 0, failed: 0, status: 'ERROR', reason: err.message } });
      return;
    }

    let passedCount = 0;
    let failedCount = 0;
    const parallelWorkers = this.settings.parallelWorkers || 1;

    try {
      this.win.webContents.send('run:log', { message: `Execution initialized with worker concurrency limit: ${parallelWorkers}`, level: 'info' });

      for (let i = 0; i < rowsToProcess.length; i += parallelWorkers) {
        // Handle Pause State
        await this.checkPause();
        
        // Handle Stop State
        if (this.isStopped) {
          this.win.webContents.send('run:log', { message: 'Execution STOPPED by user.', level: 'warn' });
          break;
        }

        const chunk = rowsToProcess.slice(i, i + parallelWorkers);

        // Notify client about current active worker count
        this.win.webContents.send('run:workers', { activeCount: chunk.length });

        // Process chunk concurrently
        const outcomes = await Promise.all(chunk.map(row => this.processRow(row, browser)));

        // Reset worker count back to 0 (idle) for the window
        this.win.webContents.send('run:workers', { activeCount: 0 });

        for (const passed of outcomes) {
          if (passed) {
            passedCount++;
          } else {
            failedCount++;
          }
        }
      }
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
      this.win.webContents.send('run:log', { message: 'Browser session terminated.', level: 'info' });
      
      const summary = {
        total: rowsToProcess.length,
        processed: passedCount + failedCount,
        passed: passedCount,
        failed: failedCount,
        status: this.isStopped ? 'STOPPED' : 'COMPLETE'
      };
      
      this.win.webContents.send('run:complete', { summary });
      this.win.webContents.send('run:log', { 
        message: `Execution complete. Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}`, 
        level: 'info' 
      });
    }
  }

  getRowsToProcess() {
    const workbook = XLSX.readFile(this.filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    if (jsonData.length === 0) return [];
    
    const headers = jsonData[0];
    const activeRows = [];
    
    this.selectedRanges.forEach(rowNum => {
      const dataIdx = rowNum - 1; // 1-based Excel row mapping to 0-based array index
      if (dataIdx > 0 && dataIdx < jsonData.length) {
        const row = jsonData[dataIdx];
        const rowData = {};
        headers.forEach((h, hIdx) => {
          rowData[h || `Column_${hIdx}`] = row[hIdx] !== undefined ? row[hIdx] : '';
        });
        activeRows.push({
          rowNumber: rowNum,
          data: rowData
        });
      }
    });
    
    return activeRows;
  }
}

function startRun(config, win) {
  if (activeRunner) {
    win.webContents.send('run:log', { message: 'Runner is already active.', level: 'warn' });
    return;
  }
  
  activeRunner = new FlowRunner(config, win);
  activeRunner.run().finally(() => {
    activeRunner = null;
  });
}

function pauseRun() {
  if (activeRunner) {
    if (activeRunner.isPaused) {
      activeRunner.resume();
    } else {
      activeRunner.pause();
    }
  }
}

function stopRun() {
  if (activeRunner) {
    activeRunner.stop();
  }
}

module.exports = {
  startRun,
  pauseRun,
  stopRun
};
