import React, { useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import { Plus, Folder, Trash2, Calendar, FileSpreadsheet, Play, CheckCircle, XCircle } from 'lucide-react';

function Home({ setActiveTab }) {
  const { projects, initStore, startNewProject, openProject, deleteProject } = useProjectStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  const handleNewProject = () => {
    startNewProject();
    setActiveTab('upload');
  };

  const handleOpenProject = (proj) => {
    openProject(proj);
    setActiveTab('upload');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-apTextPrimary tracking-tight">QA Projects</h2>
          <p className="text-xs text-apTextMuted mt-1">Manage and launch multilingual QA automation pipelines.</p>
        </div>
        <button
          onClick={handleNewProject}
          className="flex items-center gap-2 px-4 py-2 bg-apAccent hover:bg-apAccent/90 text-apBackground font-semibold text-xs tracking-wide rounded-lg transition-all shadow-lg shadow-apAccent/15"
        >
          <Plus className="w-4 h-4" />
          NEW PROJECT
        </button>
      </div>

      {projects.length === 0 ? (
        // Empty State
        <div className="border border-dashed border-apBorder rounded-xl bg-apSurface/20 p-16 text-center max-w-2xl mx-auto mt-8 flex flex-col items-center">
          <div className="p-4 rounded-full bg-apSurface border border-apBorder mb-4 text-apTextMuted">
            <Folder className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-bold text-apTextPrimary">No Projects Configured</h4>
          <p className="text-xs text-apTextMuted mt-2 max-w-sm leading-relaxed">
            Create your first QA project to upload an Excel file, map column properties, and run web content audits locally.
          </p>
          <button
            onClick={handleNewProject}
            className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-apSurface border border-apBorder hover:bg-apBorder/40 text-apTextPrimary font-medium text-xs rounded-lg transition-all"
          >
            <Plus className="w-4 h-4 text-apAccent" />
            Create Project
          </button>
        </div>
      ) : (
        // Projects Grid List
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const summary = proj.lastRunSummary;
            return (
              <div
                key={proj.id}
                className="group relative bg-apSurface border border-apBorder hover:border-apAccent/40 rounded-xl p-6 transition-all duration-300 shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-lg bg-apBackground border border-apBorder text-apAccent">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this project?')) {
                          deleteProject(proj.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-apFailure/15 text-apTextMuted hover:text-apFailure transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Metadata */}
                  <h3 className="font-bold text-sm text-apTextPrimary tracking-wide truncate group-hover:text-apAccent transition-colors">
                    {proj.name}
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-apTextMuted mt-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {proj.lastRunDate || 'Never Audited'}
                    </span>
                    <span>ROWS: {proj.totalCount || 0}</span>
                  </div>
                </div>

                {/* Bottom stats / Open action */}
                <div className="border-t border-apBorder mt-6 pt-4 flex items-center justify-between">
                  {summary ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-apSuccess">
                        <CheckCircle className="w-3 h-3" />
                        {summary.passed}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-apFailure">
                        <XCircle className="w-3 h-3" />
                        {summary.failed}
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-apAccent/10 text-apAccent px-1.5 py-0.5 rounded ml-1">
                        {summary.passRate}% PASS
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-apTextMuted bg-apBackground border border-apBorder px-2 py-0.5 rounded">
                      UNRUN
                    </span>
                  )}

                  <button
                    onClick={() => handleOpenProject(proj)}
                    className="flex items-center gap-1 text-[10px] font-bold font-mono tracking-wider text-apTextPrimary group-hover:text-apAccent transition-colors"
                  >
                    CONFIGURE <Play className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;
