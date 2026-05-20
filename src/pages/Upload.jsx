import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { Upload as UploadIcon, FileSpreadsheet, Eye, ChevronRight, Check, AlertCircle, HelpCircle } from 'lucide-react';

function Upload({ setActiveTab }) {
  const { 
    activeProject, 
    uploadExcel, 
    updateRowRanges, 
    updateColumnRole, 
    updateActiveProjectName 
  } = useProjectStore();

  const [uploadError, setUploadError] = useState('');
  const [rangeInput, setRangeInput] = useState(activeProject?.rangeString || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [projName, setProjName] = useState(activeProject?.name || '');

  if (!activeProject) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-center">
        <AlertCircle className="w-12 h-12 text-apFailure mb-4" />
        <h4 className="font-bold text-sm">No Active Project</h4>
        <p className="text-xs text-apTextMuted mt-2">Please select or create a project on the Dashboard first.</p>
        <button
          onClick={() => setActiveTab('home')}
          className="mt-4 px-4 py-2 bg-apSurface border border-apBorder rounded-lg text-xs font-semibold hover:bg-apBorder/40 transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const handleExcelUpload = async () => {
    setUploadError('');
    const res = await uploadExcel();
    if (!res.success) {
      if (!res.cancelled) {
        setUploadError(res.message || 'Failed to upload spreadsheet.');
      }
    } else {
      setRangeInput(useProjectStore.getState().activeProject.rangeString);
    }
  };

  const handleRangeChange = (e) => {
    const val = e.target.value;
    setRangeInput(val);
    updateRowRanges(val);
  };

  const handleSaveName = () => {
    updateActiveProjectName(projName);
    setIsEditingName(false);
  };

  // Validations
  const hasFile = !!activeProject.filePath;
  const isRangeValid = activeProject.selectedRanges && activeProject.selectedRanges.length > 0;
  const isPageUrlMapped = Object.values(activeProject.columnMap).includes(activeProject.columnMap.page_url) && activeProject.columnMap.page_url !== '';

  const getStepStatus = (stepNum) => {
    if (stepNum === 1) return hasFile ? 'complete' : 'active';
    if (stepNum === 2) {
      if (!hasFile) return 'disabled';
      return isRangeValid ? 'complete' : 'active';
    }
    if (stepNum === 3) {
      if (!hasFile || !isRangeValid) return 'disabled';
      return isPageUrlMapped ? 'complete' : 'active';
    }
    return 'disabled';
  };

  const rolesList = [
    { key: 'language', label: 'Language Locale', desc: 'Code for variant identification (e.g. en, fr)' },
    { key: 'page_url', label: 'Target Page URL (Required)', desc: 'The starting URL for the browser audit' },
    { key: 'expected_content', label: 'Expected Body Text', desc: 'Verifies matching innerText is present on target page' },
    { key: 'button_name', label: 'Target Button Name', desc: 'Visibly looks for buttons/CTAs matching this text' },
    { key: 'button_redirect_url', label: 'Expected Destination URL', desc: 'Checks that clicking target button redirects here' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Editable Project Name */}
      <div className="flex items-center justify-between border-b border-apBorder pb-4">
        <div>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                className="bg-apBackground border border-apBorder px-3 py-1.5 rounded-lg text-sm text-apTextPrimary focus:outline-none focus:border-apAccent"
              />
              <button
                onClick={handleSaveName}
                className="px-3 py-1.5 bg-apAccent text-apBackground text-xs font-bold rounded-lg hover:bg-apAccent/90 transition-all"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setProjName(activeProject.name);
                  setIsEditingName(false);
                }}
                className="px-3 py-1.5 bg-apSurface border border-apBorder text-xs text-apTextMuted rounded-lg hover:bg-apBorder/40 transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-apTextPrimary tracking-tight">{activeProject.name}</h2>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-xs text-apAccent hover:underline"
              >
                Rename
              </button>
            </div>
          )}
          <p className="text-xs text-apTextMuted mt-1">Configure spreadsheet inputs and map column roles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Wizard Steps 1 & 2 */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* STEP 1: Excel File Onboarding */}
          <section className={`bg-apSurface border rounded-xl p-6 transition-all duration-300 ${getStepStatus(1) === 'active' ? 'border-apAccent/30 shadow-lg shadow-apAccent/5' : 'border-apBorder'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${hasFile ? 'bg-apSuccess text-apBackground' : 'bg-apAccent text-apBackground'}`}>
                {hasFile ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <h3 className="text-sm font-bold tracking-wide">Excel Onboarding</h3>
            </div>

            {!hasFile ? (
              // Empty Dropzone
              <div
                onClick={handleExcelUpload}
                className="border-2 border-dashed border-apBorder hover:border-apAccent/40 rounded-xl bg-apBackground/40 p-8 text-center cursor-pointer hover:bg-apSurface/20 transition-all group"
              >
                <UploadIcon className="w-8 h-8 text-apTextMuted group-hover:text-apAccent transition-colors mx-auto mb-3" />
                <p className="text-xs font-semibold text-apTextPrimary">Select Excel Workbook</p>
                <p className="text-[10px] text-apTextMuted mt-1">Supports .xlsx, .xls, .csv</p>
                {uploadError && <p className="text-xs text-apFailure mt-3 bg-apFailure/10 py-1.5 px-3 rounded-lg">{uploadError}</p>}
              </div>
            ) : (
              // Uploaded Spreadsheet Details
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-apBackground/50 border border-apBorder p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-apAccent/10 text-apAccent">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-apTextPrimary truncate max-w-sm">{activeProject.filePath.split('\\').pop()}</p>
                      <p className="text-[10px] text-apTextMuted mt-0.5">Rows Count: {activeProject.totalCount} | Columns: {activeProject.headers.length}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExcelUpload}
                    className="text-xs text-apAccent hover:underline font-mono"
                  >
                    REPLACE FILE
                  </button>
                </div>

                {/* Preview Sheet */}
                <div className="border border-apBorder rounded-lg overflow-hidden bg-apBackground/25">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-apBorder bg-apSurface/60 text-[10px] font-mono text-apTextMuted">
                    <Eye className="w-3.5 h-3.5" />
                    PREVIEW GRID (FIRST 5 ROWS)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-apSurface border-b border-apBorder text-apTextMuted">
                          <th className="py-2 px-3 border-r border-apBorder w-10 text-center">Row</th>
                          {activeProject.headers.map((h, idx) => (
                            <th key={idx} className="py-2 px-3 border-r border-apBorder">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeProject.previewRows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-apBorder/50 hover:bg-apSurface/30">
                            <td className="py-1.5 px-3 border-r border-apBorder text-center text-apTextMuted">{row.rowNumber}</td>
                            {activeProject.headers.map((h, cIdx) => (
                              <td key={cIdx} className="py-1.5 px-3 border-r border-apBorder truncate max-w-[120px]">{row.data[h] || ''}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* STEP 2: Row Slices Configuration */}
          <section className={`bg-apSurface border rounded-xl p-6 transition-all duration-300 ${getStepStatus(2) === 'active' ? 'border-apAccent/30 shadow-lg shadow-apAccent/5' : 'border-apBorder'} ${getStepStatus(2) === 'disabled' ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${isRangeValid ? 'bg-apSuccess text-apBackground' : 'bg-apAccent text-apBackground'}`}>
                {isRangeValid ? <Check className="w-3.5 h-3.5" /> : '2'}
              </div>
              <h3 className="text-sm font-bold tracking-wide">Select Row Slices</h3>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-apTextMuted font-mono">ROW RANGE DEFINITION</label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={handleRangeChange}
                  placeholder="e.g. 2-100, 105-180"
                  className={`bg-apBackground border px-3 py-2 rounded-lg text-xs font-mono text-apTextPrimary focus:outline-none ${rangeInput.trim() === '' ? 'border-apBorder' : (isRangeValid ? 'border-apSuccess/40 focus:border-apSuccess' : 'border-apFailure/40 focus:border-apFailure')}`}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono mt-1 bg-apBackground/40 p-2.5 rounded border border-apBorder">
                <span className="text-apTextMuted">ACTIVE TOTAL ROWS: {activeProject.totalCount || 0}</span>
                <span className={`${isRangeValid ? 'text-apSuccess' : 'text-apFailure'} font-bold`}>
                  {isRangeValid ? `${activeProject.selectedRanges.length} ROWS SELECTED` : 'NO ROWS SELECTED'}
                </span>
              </div>

              {/* Progress mini-bar displaying slice coverages */}
              {activeProject.totalCount > 0 && (
                <div className="h-1.5 w-full bg-apBackground rounded overflow-hidden flex">
                  {Array.from({ length: 50 }).map((_, idx) => {
                    const rowRepresented = Math.floor((idx / 50) * activeProject.totalCount) + 2;
                    const isSelected = activeProject.selectedRanges.includes(rowRepresented);
                    return (
                      <div 
                        key={idx} 
                        className={`flex-1 h-full border-r border-apBackground ${isSelected ? 'bg-apAccent' : 'bg-apBorder/35'}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right Column: STEP 3 - Column Mapping */}
        <div>
          <section className={`h-full bg-apSurface border rounded-xl p-6 transition-all duration-300 ${getStepStatus(3) === 'active' ? 'border-apAccent/30 shadow-lg shadow-apAccent/5' : 'border-apBorder'} ${getStepStatus(3) === 'disabled' ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${isPageUrlMapped ? 'bg-apSuccess text-apBackground' : 'bg-apAccent text-apBackground'}`}>
                {isPageUrlMapped ? <Check className="w-3.5 h-3.5" /> : '3'}
              </div>
              <h3 className="text-sm font-bold tracking-wide">Map Column Roles</h3>
            </div>

            {hasFile && (
              <div className="space-y-5">
                <p className="text-[10px] text-apTextMuted leading-relaxed bg-apBackground/30 p-3 rounded border border-apBorder">
                  Map spreadsheet headers to variables used by the runner pipeline widgets.
                </p>

                <div className="space-y-4">
                  {rolesList.map((r) => {
                    const mappedCol = activeProject.columnMap[r.key] || '';
                    return (
                      <div key={r.key} className="flex flex-col gap-1.5 p-3 rounded-lg bg-apBackground/30 border border-apBorder/55">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-apTextPrimary">{r.label}</label>
                          {mappedCol ? (
                            <span className="text-[9px] font-mono bg-apSuccess/10 text-apSuccess px-1 rounded font-bold">MAPPED</span>
                          ) : (
                            r.key === 'page_url' && <span className="text-[9px] font-mono bg-apFailure/10 text-apFailure px-1 rounded font-bold">REQUIRED</span>
                          )}
                        </div>
                        <p className="text-[10px] text-apTextMuted leading-normal">{r.desc}</p>
                        
                        <select
                          value={mappedCol}
                          onChange={(e) => updateColumnRole(r.key, e.target.value)}
                          className="bg-apBackground border border-apBorder px-2.5 py-1.5 rounded text-xs text-apTextPrimary focus:outline-none focus:border-apAccent"
                        >
                          <option value="">-- Ignored / Not Mapped --</option>
                          {activeProject.headers.map((h, i) => (
                            <option key={i} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* Confirm & Proceed Button */}
                <button
                  disabled={!hasFile || !isRangeValid || !isPageUrlMapped}
                  onClick={() => setActiveTab('flow')}
                  className="w-full mt-6 py-2.5 bg-apAccent hover:bg-apAccent/90 disabled:bg-apBorder/40 disabled:text-apTextMuted text-apBackground font-semibold text-xs tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  PROCEED TO PIPELINE
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Upload;
