import React from 'react';
import { Check, Clock, AlertCircle, XCircle } from 'lucide-react';

const STAGES = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'DOCUMENTS_PENDING', label: 'Documents Pending' },
  { key: 'DOCUMENTS_SUBMITTED', label: 'Documents Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'RESOLVED', label: 'Resolved' }
];

export default function StatusTimeline({ currentStatus, history = [] }) {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3 text-sm font-semibold">
        <XCircle className="w-5 h-5 text-red-600" /> This verification request has been CANCELLED.
      </div>
    );
  }

  const getStageIndex = (status) => {
    switch (status) {
      case 'DRAFT': return -1;
      case 'SUBMITTED': return 0;
      case 'DOCUMENTS_PENDING': return 1;
      case 'DOCUMENTS_SUBMITTED': return 2;
      case 'UNDER_REVIEW': return 3;
      case 'RESOLVED': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);

  return (
    <div className="py-4">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Request Status Workflow Timeline</h4>
      
      {/* Horizontal Step Bar */}
      <div className="flex items-center justify-between relative mb-8">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(Math.max(0, currentIndex) / (STAGES.length - 1)) * 100}%` }}
        />

        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-5 h-5" /> : idx + 1}
              </div>
              <span className={`text-[11px] font-semibold mt-2 text-center max-w-[80px] ${isCurrent ? 'text-blue-700' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed Status Audit History List */}
      {history.length > 0 && (
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <h5 className="text-[11px] font-bold uppercase text-slate-500 mb-2">Audit History Log ({history.length} events)</h5>
          <div className="space-y-2 text-xs">
            {history.map(item => (
              <div key={item.history_id} className="flex justify-between items-start border-b border-slate-200 pb-1.5 last:border-0 last:pb-0">
                <div>
                  <span className="font-semibold text-slate-800">{item.old_status} → {item.new_status}</span>
                  <p className="text-[11px] text-slate-500">{item.remarks} <span className="text-slate-400">({item.changed_by})</span></p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(item.changed_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
