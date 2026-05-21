import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { useProjectStore } from '../../store/projectStore';
import { Globe, Search, Compass, ToggleLeft, Camera, X, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

const WIDGET_META = {
  openUrl: {
    name: 'Open URL',
    icon: Globe,
    color: 'text-apAccent',
    bgColor: 'bg-apAccent/10',
    borderColor: 'border-apAccent/20',
    requiredRole: 'page_url',
    description: 'Load page URL in browser'
  },
  findText: {
    name: 'Find Text',
    icon: Search,
    color: 'text-apSuccess',
    bgColor: 'bg-apSuccess/10',
    borderColor: 'border-apSuccess/20',
    requiredRole: 'expected_content',
    description: 'Verify page has content'
  },
  findButton: {
    name: 'Find Button',
    icon: Compass,
    color: 'text-apWarning',
    bgColor: 'bg-apWarning/10',
    borderColor: 'border-apWarning/20',
    requiredRole: 'button_name',
    description: 'Locate target click CTA'
  },
  matchRedirectUrl: {
    name: 'Match Redirect',
    icon: ToggleLeft,
    color: 'text-apFailure',
    bgColor: 'bg-apFailure/10',
    borderColor: 'border-apFailure/20',
    requiredRole: 'button_redirect_url',
    description: 'Verify click redirected URL'
  },
  screenshotOnFail: {
    name: 'Screenshot on Fail',
    icon: Camera,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
    requiredRole: null, // no column mapping required
    description: 'Capture screen on error'
  }
};

function WidgetNode({ id, type, data, selected }) {
  const { activeProject } = useProjectStore();
  const meta = WIDGET_META[type] || {
    name: 'Unknown Widget',
    icon: HelpCircle,
    color: 'text-apTextMuted',
    bgColor: 'bg-apBackground',
    borderColor: 'border-apBorder',
    requiredRole: null,
    description: 'Undefined widget action'
  };

  // Determine node status dynamically based on Excel column mapping
  let status = 'configured'; // 'idle' | 'configured' | 'error'
  let statusText = 'Configured';
  let statusColor = 'text-apSuccess bg-apSuccess/10 border-apSuccess/20';

  if (meta.requiredRole && activeProject) {
    const isMapped = !!activeProject.columnMap[meta.requiredRole];
    if (!isMapped) {
      status = 'error';
      statusText = 'Unmapped Column';
      statusColor = 'text-apFailure bg-apFailure/10 border-apFailure/20';
    }
  }

  const IconComponent = meta.icon;

  const handleDelete = (e) => {
    e.stopPropagation();
    // React Flow onNodesDelete handles standard deletions, but X button invokes custom delete
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <div className={`w-52 bg-apSurface border ${
      selected ? 'border-apAccent shadow-lg shadow-apAccent/5' : 'border-apBorder'
    } p-4 rounded-xl relative transition-all group hover:border-apTextMuted/30`}>
      {/* Target Connection Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-apBorder hover:!bg-apAccent !border-apBackground transition-colors"
        style={{ left: '-6px' }}
      />

      {/* Delete X Icon on Hover */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-0.5 rounded-md hover:bg-apBackground border border-transparent hover:border-apBorder text-apTextMuted hover:text-apTextPrimary transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-20"
        title="Delete Widget"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Header Info */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className={`p-1.5 rounded-lg ${meta.bgColor} ${meta.color} border ${meta.borderColor}`}>
          <IconComponent className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold truncate pr-4 text-apTextPrimary">{meta.name}</h4>
          <span className="text-[8px] font-mono text-apTextMuted block truncate">
            {meta.requiredRole && activeProject?.columnMap[meta.requiredRole]
              ? `Col: ${activeProject.columnMap[meta.requiredRole]}`
              : (meta.requiredRole ? 'Col: UNMAPPED' : 'No column needed')}
          </span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-apBorder/60">
        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${statusColor} flex items-center gap-1`}>
          {status === 'configured' ? (
            <CheckCircle className="w-2.5 h-2.5" />
          ) : (
            <AlertTriangle className="w-2.5 h-2.5" />
          )}
          {statusText}
        </span>
      </div>

      {/* Source Connection Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-apBorder hover:!bg-apAccent !border-apBackground transition-colors"
        style={{ right: '-6px' }}
      />
    </div>
  );
}

export default WidgetNode;
