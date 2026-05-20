/**
 * Widget Executor: Find Text
 * Searches the visible page text for the expected content.
 */
async function execute(page, config, rowData) {
  const text = rowData.expected_content;
  if (text === undefined || text === null || text === "") {
    return { pass: false, reason: "Missing Expected Content column mapping or cell value is empty" };
  }
  
  const caseSensitive = config.caseSensitive || false;
  const exactMatch = config.exactMatch || false;
  
  try {
    // Get text content of the visible body
    const bodyText = await page.innerText('body');
    
    let passed = false;
    if (exactMatch) {
      if (caseSensitive) {
        passed = bodyText === text;
      } else {
        passed = bodyText.toLowerCase() === text.toLowerCase();
      }
    } else {
      if (caseSensitive) {
        passed = bodyText.includes(text);
      } else {
        passed = bodyText.toLowerCase().includes(text.toLowerCase());
      }
    }
    
    if (passed) {
      return { pass: true, reason: `Found expected text: "${text}"` };
    } else {
      return { pass: false, reason: `Expected text "${text}" was not found in page body.` };
    }
  } catch (err) {
    return { pass: false, reason: `Error locating text: ${err.message}` };
  }
}

module.exports = { execute };
