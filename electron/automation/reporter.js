const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Excel Report Generator using SheetJS
 * Formats results and exports standard-compliant reports with cell annotations.
 */
function exportReport(reportData, outputPath) {
  // Columns: Row # | Language | Page URL | Open URL | Find Text | Find Button | Match Redirect | Overall | Fail Reason
  const headers = [
    "Row #", 
    "Language", 
    "Page URL", 
    "Open URL", 
    "Find Text", 
    "Find Button", 
    "Match Redirect", 
    "Overall Status", 
    "Fail Reason"
  ];
  
  const rows = [];
  rows.push(headers); // Header row at index 0
  
  reportData.forEach(row => {
    let failReason = "";
    if (row.status === 'FAIL') {
      const steps = ['openUrl', 'findText', 'findButton', 'matchRedirectUrl'];
      for (const step of steps) {
        if (row.results[step] && row.results[step].pass === false) {
          failReason = `${step}: ${row.results[step].reason || "failed"}`;
          break;
        }
      }
    }
    
    rows.push([
      row.rowNumber,
      row.language,
      row.url,
      row.results.openUrl.pass === true ? "PASS" : (row.results.openUrl.pass === false ? "FAIL" : "SKIPPED"),
      row.results.findText.pass === true ? "PASS" : (row.results.findText.pass === false ? "FAIL" : "SKIPPED"),
      row.results.findButton.pass === true ? "PASS" : (row.results.findButton.pass === false ? "FAIL" : "SKIPPED"),
      row.results.matchRedirectUrl.pass === true ? "PASS" : (row.results.matchRedirectUrl.pass === false ? "FAIL" : "SKIPPED"),
      row.status,
      failReason
    ]);
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Style mapping using SheetJS formatting objects
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = { c: C, r: R };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      const cell = worksheet[cellRef];
      if (!cell) continue;
      
      // Initialize styling container (handles cell styling on supporting engines)
      cell.s = {};
      
      if (R === 0) {
        // Headers Style
        cell.s = {
          fill: { fgColor: { rgb: "1A1A1F" } },
          font: { color: { rgb: "FFFFFF" }, bold: true, name: "DM Sans" },
          alignment: { horizontal: "center", vertical: "center" }
        };
      } else {
        cell.s.font = { name: "DM Sans", size: 10 };
        
        // Style status cells
        if (C >= 3 && C <= 7) {
          const val = cell.v;
          if (val === "PASS") {
            cell.s.fill = { fgColor: { rgb: "D1FAE5" } };
            cell.s.font = { color: { rgb: "065F46" }, bold: true, name: "DM Sans" };
          } else if (val === "FAIL") {
            cell.s.fill = { fgColor: { rgb: "FEE2E2" } };
            cell.s.font = { color: { rgb: "991B1B" }, bold: true, name: "DM Sans" };
          } else if (val === "SKIPPED") {
            cell.s.fill = { fgColor: { rgb: "E5E7EB" } };
            cell.s.font = { color: { rgb: "4B5563" }, name: "DM Sans" };
          }
        }
      }
    }
  }
  
  // Auto-fit column widths
  const colsWidth = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxLen = 10;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
      const cell = worksheet[cellRef];
      if (cell && cell.v) {
        const len = cell.v.toString().length;
        if (len > maxLen) maxLen = len;
      }
    }
    colsWidth.push({ wch: maxLen + 2 });
  }
  worksheet['!cols'] = colsWidth;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Report");
  
  // Ensure the target directory exists before writing
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  XLSX.writeFile(workbook, outputPath);
}

module.exports = { exportReport };
