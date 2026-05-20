/**
 * Widget Executor: Find Button
 * Locates a clickable element (button/anchor) by text and validates visibility.
 */
async function execute(page, config, rowData) {
  const buttonName = rowData.button_name;
  if (!buttonName) {
    return { pass: false, reason: "Missing Button Name column mapping or cell value is empty" };
  }
  
  const elementType = config.elementType || 'any'; // 'button', 'a', 'any'
  const checkVisibility = config.checkVisibility !== false;
  const timeout = config.elementWaitTimeout || 5000;
  
  try {
    // We target common clickable elements containing the text
    let selector;
    if (elementType === 'button') {
      selector = `button:has-text("${buttonName}")`;
    } else if (elementType === 'a') {
      selector = `a:has-text("${buttonName}")`;
    } else {
      // Find button, link, or elements acting like buttons with the matching text
      selector = `role=button[name="${buttonName}" i], button:has-text("${buttonName}"), a:has-text("${buttonName}"), [onclick]:has-text("${buttonName}")`;
    }
    
    // Fallback locator if the complex role/selectors fail: just select by visible text
    const locator = page.locator(`text="${buttonName}"`).first();
    
    // Wait for element to be present in DOM
    await locator.waitFor({ state: 'attached', timeout });
    
    if (checkVisibility) {
      const isVisible = await locator.isVisible();
      if (!isVisible) {
        return { pass: false, reason: `Button with text "${buttonName}" found but is not visible.` };
      }
    }
    
    return { pass: true, reason: `Found button/link with text: "${buttonName}"` };
  } catch (err) {
    return { pass: false, reason: `Failed to find button "${buttonName}": ${err.message}` };
  }
}

module.exports = { execute };
