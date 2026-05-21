/**
 * Widget Executor: Screenshot on Fail
 * Captures a screenshot of the current browser page only if a failure occurred.
 */
const fs = require('fs');
const path = require('path');

async function execute(page, config, rowData, runContext) {
  // Check if we have a failed step in the context or if we're explicitly asked to capture
  const { screenshotPath } = runContext || {};
  
  if (!screenshotPath) {
    return { pass: true, reason: 'SKIPPED (No screenshot file path specified)' };
  }

  try {
    const dir = path.dirname(screenshotPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Capture visual screenshot using Playwright's API
    await page.screenshot({ path: screenshotPath, fullPage: true });

    return { 
      pass: true, 
      reason: `Screenshot successfully captured.`, 
      screenshotPath 
    };
  } catch (err) {
    return { 
      pass: false, 
      reason: `Failed to capture screenshot: ${err.message}` 
    };
  }
}

module.exports = { execute };
