/**
 * Widget Executor: Open URL
 * Opens the page URL in the browser and verifies it loaded.
 */
async function execute(page, config, rowData) {
  const url = rowData.page_url;
  if (!url) {
    return { pass: false, reason: "Missing Page URL column mapping or cell value is empty" };
  }
  
  const timeout = config.pageLoadTimeout || 30000;
  
  try {
    const response = await page.goto(url, { timeout, waitUntil: 'load' });
    if (!response) {
      return { pass: false, reason: "No response received (possible network crash or blocked connection)" };
    }
    
    const status = response.status();
    if (status >= 400) {
      return { pass: false, reason: `Page loaded with HTTP error status: ${status}` };
    }
    
    return { pass: true, reason: `Successfully loaded page (HTTP ${status})` };
  } catch (err) {
    return { pass: false, reason: `Failed to load page: ${err.message}` };
  }
}

module.exports = { execute };
