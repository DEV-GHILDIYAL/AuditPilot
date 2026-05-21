/**
 * Widget Executor: Match Redirect URL
 * Clicks the located button, captures the final landing URL, and compares it.
 */
async function execute(page, config, rowData) {
  const expectedRedirect = rowData.button_redirect_url;
  const buttonName = rowData.button_name;
  
  if (!expectedRedirect) {
    return { pass: false, reason: "Missing Button Redirect URL column mapping or cell value is empty" };
  }
  
  const matchType = config.matchType || 'contains'; // 'exact', 'starts-with', 'contains'
  const timeout = config.timeout || config.elementWaitTimeout || 5000;
  
  try {
    // Locate the element to click
    const locator = page.locator(`text="${buttonName}"`).first();
    const count = await locator.count();
    if (count === 0) {
      return { pass: false, reason: `Cannot trigger click: button with text "${buttonName}" not found.` };
    }
    
    // Click the button and wait for navigation and network idle / load state
    await Promise.all([
      page.waitForNavigation({ timeout, waitUntil: 'load' }).catch(() => {
        // Suppress timeout errors here as navigation might not happen via full reload
      }),
      locator.click({ timeout })
    ]);
    
    // Add brief settle timeout for single page app redirects
    await page.waitForTimeout(500);
    
    const finalUrl = page.url();
    let passed = false;
    
    if (matchType === 'exact') {
      passed = finalUrl === expectedRedirect;
    } else if (matchType === 'starts-with') {
      passed = finalUrl.startsWith(expectedRedirect);
    } else {
      // Default: contains
      passed = finalUrl.includes(expectedRedirect);
    }
    
    if (passed) {
      return { pass: true, reason: `Redirect URL matches expectations: "${finalUrl}"` };
    } else {
      return { pass: false, reason: `Redirect URL mismatch. Expected redirect containing "${expectedRedirect}", but landed on "${finalUrl}"` };
    }
  } catch (err) {
    return { pass: false, reason: `Error during button redirect check: ${err.message}` };
  }
}

module.exports = { execute };
