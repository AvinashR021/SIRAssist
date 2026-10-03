import React from 'react';
import { CheckCircle2, AlertTriangle, FileCheck } from 'lucide-react';

export default function ReadinessBadge({ readiness }) {
  if (!readiness) return null;

  const { readiness_percentage, is_ready, checklist, mandatory_count, available_mandatory_count } = readiness;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-sm text-slate-800">Verification Readiness</h4>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${is_ready ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {available_mandatory_count} / {mandatory_count} Requirements Recorded ({readiness_percentage}%)
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${is_ready ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: `${readiness_percentage}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {checklist.map((item, idx) => (
          <div key={idx} className="flex items-start justify-between bg-white p-2.5 rounded border border-slate-100 text-xs">
            <div className="flex items-start gap-2">
              {item.status === 'Available' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-slate-700">{item.document_type}</span>
                {item.mandatory && <span className="text-[10px] text-red-500 font-bold ml-1.5">(Required)</span>}
                <p className="text-[11px] text-slate-500">{item.description}</p>
              </div>
            </div>
            <span className={`font-semibold ${item.status === 'Available' ? 'text-emerald-700' : 'text-amber-700'}`}>
              {item.status === 'Available' ? '✓ Available' : '⚠ Missing'}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 mt-3 font-mono">
        * Readiness status calculated based on rules configured in this academic system.
      </p>
    </div>
  );
}
