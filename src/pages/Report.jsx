import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { FileSpreadsheet, Search, Check, AlertTriangle, Eye, ShieldAlert, Award, Download } from 'lucide-react';

function Report({ setActiveTab }) {
  const { activeProject, runState, exportExcelReport } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'PASS', 'FAIL'
  const [exportMessage, setExportMessage] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  if (!activeProject || runState.results.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-center">
        <FileSpreadsheet className="w-12 h-12 text-apTextMuted mb-4" />
        <h4 className="font-bold text-sm">No Report Generated</h4>
        <p className="text-xs text-apTextMuted mt-2">Audits must be run from the pipeline canvas to construct report metrics.</p>
        <button
          onClick={() => setActiveTab('flow')}
          className="mt-4 px-4 py-2 bg-apSurface border border-apBorder rounded-lg text-xs font-semibold hover:bg-apBorder/40 transition-all text-apAccent"
        >
          Go to Pipeline Canvas
        </button>
      </div>
    );
  }

  const { results, progress } = runState;
  const passRate = progress.processed > 0 ? Math.round((progress.passed / progress.processed) * 100) : 0;

  // Filtered rows
  const filteredRows = results.filter(row => {
    const matchesSearch = row.url.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          row.language.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || row.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExport = async () => {
    setExportMessage(null);
    const res = await exportExcelReport();
    if (res.success) {
      setExportMessage({ type: 'success', text: `Successfully exported report to: ${res.outputPath}` });
    } else {
      setExportMessage({ type: 'error', text: `Failed to export spreadsheet: ${res.message}` });
    }
  };

  const renderCellText = (stepResult) => {
    if (!stepResult) return <span className="text-apTextMuted">-</span>;
    if (stepResult.pass === true) return <span className="text-apSuccess font-bold">PASS</span>;
    if (stepResult.pass === false) return <span className="text-apFailure font-bold">FAIL</span>;
    return <span className="text-apTextMuted">SKIPPED</span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-apBorder pb-4">
        <div>
          <h2 className="text-xl font-bold text-apTextPrimary tracking-tight">Audit Assessment Report</h2>
          <p className="text-xs text-apTextMuted mt-1">Final pass/fail metrics and spreadsheet export controls.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-apAccent hover:bg-apAccent/90 text-apBackground font-mono font-bold text-xs tracking-wider rounded-lg transition-all shadow-lg shadow-apAccent/15"
        >
          <Download className="w-4 h-4" />
          EXPORT XLSX
        </button>
      </div>

      {exportMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs leading-normal ${
          exportMessage.type === 'success' ? 'bg-apSuccess/10 border-apSuccess/30 text-apSuccess' : 'bg-apFailure/10 border-apFailure/30 text-apFailure'
        }`}>
          {exportMessage.type === 'success' ? <Check className="w-5 h-5 flex-shrink-0" /> : <ShieldAlert className="w-5 h-5 flex-shrink-0" />}
          <span>{exportMessage.text}</span>
        </div>
      )}

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Pass Rate Gauge Card */}
        <div className="bg-apSurface border border-apBorder p-6 rounded-xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] font-mono text-apTextMuted uppercase tracking-wider">Pass Rate</span>
            <h4 className="text-2xl font-black mt-1 text-apAccent">{passRate}%</h4>
          </div>
          <div className="p-3 bg-apAccent/10 text-apAccent rounded-lg">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Total rows */}
        <div className="bg-apSurface border border-apBorder p-6 rounded-xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] font-mono text-apTextMuted uppercase tracking-wider">Processed Rows</span>
            <h4 className="text-2xl font-black mt-1 text-apTextPrimary">{progress.processed}</h4>
          </div>
          <div className="p-3 bg-apBackground border border-apBorder text-apTextMuted rounded-lg">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        {/* Passed Rows */}
        <div className="bg-apSurface border border-apBorder p-6 rounded-xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] font-mono text-apTextMuted uppercase tracking-wider">Passed Audits</span>
            <h4 className="text-2xl font-black mt-1 text-apSuccess">{progress.passed}</h4>
          </div>
          <div className="p-3 bg-apSuccess/10 text-apSuccess rounded-lg">
            <Check className="w-6 h-6" />
          </div>
        </div>

        {/* Failed Rows */}
        <div className="bg-apSurface border border-apBorder p-6 rounded-xl flex items-center justify-between shadow-md">
          <div>
            <span className="text-[10px] font-mono text-apTextMuted uppercase tracking-wider">Failed Audits</span>
            <h4 className="text-2xl font-black mt-1 text-apFailure">{progress.failed}</h4>
          </div>
          <div className="p-3 bg-apFailure/10 text-apFailure rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Grid Filter and Searching Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-apSurface border border-apBorder p-4 rounded-xl">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-apTextMuted absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Lang or URL..."
            className="w-full bg-apBackground border border-apBorder pl-9 pr-4 py-1.5 rounded-lg text-xs text-apTextPrimary focus:outline-none focus:border-apAccent"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto font-mono text-[10px]">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 border rounded-lg font-bold transition-all ${
              filterStatus === 'ALL' ? 'bg-apAccent/10 border-apAccent text-apAccent' : 'border-apBorder text-apTextMuted bg-apBackground/30'
            }`}
          >
            SHOW ALL ({results.length})
          </button>
          <button
            onClick={() => setFilterStatus('PASS')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 border rounded-lg font-bold transition-all ${
              filterStatus === 'PASS' ? 'bg-apSuccess/10 border-apSuccess/30 text-apSuccess' : 'border-apBorder text-apTextMuted bg-apBackground/30'
            }`}
          >
            PASSED ({progress.passed})
          </button>
          <button
            onClick={() => setFilterStatus('FAIL')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 border rounded-lg font-bold transition-all ${
              filterStatus === 'FAIL' ? 'bg-apFailure/10 border-apFailure/30 text-apFailure' : 'border-apBorder text-apTextMuted bg-apBackground/30'
            }`}
          >
            FAILED ({progress.failed})
          </button>
        </div>
      </div>

      {/* Assessment Grid Output */}
      <div className="bg-apSurface border border-apBorder rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[10px] border-collapse">
            <thead>
              <tr className="bg-apBackground border-b border-apBorder text-apTextMuted uppercase">
                <th className="py-3 px-4 w-12 text-center border-r border-apBorder">Row</th>
                <th className="py-3 px-4 w-16 border-r border-apBorder">Lang</th>
                <th className="py-3 px-4 border-r border-apBorder max-w-[240px] truncate">Target Page URL</th>
                <th className="py-3 px-4 text-center border-r border-apBorder w-24">Open</th>
                <th className="py-3 px-4 text-center border-r border-apBorder w-24">Content</th>
                <th className="py-3 px-4 text-center border-r border-apBorder w-24">Button</th>
                <th className="py-3 px-4 text-center border-r border-apBorder w-24">Redirect</th>
                <th className="py-3 px-4 text-center border-r border-apBorder w-24">Outcome</th>
                <th className="py-3 px-4 text-center w-12">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-apTextMuted italic bg-apBackground/10">
                    No matching audit records located.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isExpanded = expandedRow === row.rowNumber;
                  
                  // Compute direct failure explanation
                  let stepError = null;
                  const steps = ['openUrl', 'findText', 'findButton', 'matchRedirectUrl'];
                  for (const step of steps) {
                    if (row.results[step] && row.results[step].pass === false) {
                      stepError = { step, reason: row.results[step].reason };
                      break;
                    }
                  }

                  return (
                    <React.Fragment key={idx}>
                      <tr className="border-b border-apBorder/50 hover:bg-apBackground/30 transition-colors">
                        <td className="py-2.5 px-4 text-center border-r border-apBorder font-bold text-apTextMuted bg-apBackground/15">{row.rowNumber}</td>
                        <td className="py-2.5 px-4 border-r border-apBorder">{row.language}</td>
                        <td className="py-2.5 px-4 border-r border-apBorder truncate max-w-[240px]" title={row.url}>{row.url}</td>
                        <td className="py-2.5 px-4 text-center border-r border-apBorder">{renderCellText(row.results.openUrl)}</td>
                        <td className="py-2.5 px-4 text-center border-r border-apBorder">{renderCellText(row.results.findText)}</td>
                        <td className="py-2.5 px-4 text-center border-r border-apBorder">{renderCellText(row.results.findButton)}</td>
                        <td className="py-2.5 px-4 text-center border-r border-apBorder">{renderCellText(row.results.matchRedirectUrl)}</td>
                        <td className="py-2.5 px-4 text-center border-r border-apBorder font-bold">
                          <span className={row.status === 'PASS' ? 'text-apSuccess bg-apSuccess/10 px-1.5 py-0.5 rounded' : 'text-apFailure bg-apFailure/10 px-1.5 py-0.5 rounded'}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : row.rowNumber)}
                            className="p-1 rounded bg-apBackground hover:bg-apBorder border border-apBorder text-apTextMuted hover:text-apTextPrimary transition-all"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-apBackground/45 border-b border-apBorder/70">
                          <td colSpan="9" className="py-4 px-6 font-mono text-[10px] leading-relaxed">
                            <div className="space-y-2 max-w-4xl">
                              <h5 className="font-bold text-apTextPrimary uppercase tracking-wide">Row Audit Diagnostic Logs:</h5>
                              <div className="grid grid-cols-2 gap-4 bg-black border border-apBorder p-3 rounded-lg text-apTextMuted">
                                <div>
                                  <p><span className="text-apAccent">OPEN URL:</span> {row.results.openUrl.reason || '-'}</p>
                                  <p><span className="text-apSuccess">FIND TEXT:</span> {row.results.findText.reason || '-'}</p>
                                </div>
                                <div>
                                  <p><span className="text-apWarning">FIND BUTTON:</span> {row.results.findButton.reason || '-'}</p>
                                  <p><span className="text-apFailure">REDIRECT:</span> {row.results.matchRedirectUrl.reason || '-'}</p>
                                </div>
                              </div>
                              {row.status === 'FAIL' && stepError && (
                                <p className="text-apFailure font-bold flex items-center gap-1.5 mt-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Assertion Failure at step [{stepError.step.toUpperCase()}]: {stepError.reason}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Report;
