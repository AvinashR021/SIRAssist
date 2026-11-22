import React from 'react';
import { CheckCircle2, AlertTriangle, FileCheck, Info, ExternalLink, HelpCircle } from 'lucide-react';

export default function ReadinessBadge({ readiness }) {
  if (!readiness) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-slate-400" />
        <span>Checklist not configured for this request type.</span>
      </div>
    );
  }

  const {
    readiness_percentage,
    is_ready,
    checklist,
    mandatory_count,
    available_mandatory_count,
    total_requirements,
    request_type
  } = readiness;

  if (!checklist || checklist.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-xs text-slate-500">
        <Info className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
        <strong className="text-slate-700 block">Checklist Not Configured</strong>
        <p className="text-[11px] text-slate-400 mt-0.5">
          No official document requirement set is currently configured for '{request_type}'.
        </p>
      </div>
    );
  }

  const totalAvailable = checklist.filter(c => c.status === 'Available').length;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl p-5 space-y-4">
      {/* Header and Completion Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800">
              Document Readiness Checklist – {request_type}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Organizes required verification proofs before final submission
          </p>
        </div>

        {/* Completion Count */}
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
              is_ready
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {is_ready ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {available_mandatory_count} of {mandatory_count} Mandatory Items Recorded ({readiness_percentage}%)
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">
            Total Available: {totalAvailable} / {total_requirements} configured items
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div>
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              readiness_percentage === 100
                ? 'bg-emerald-500'
                : readiness_percentage >= 50
                ? 'bg-blue-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.max(5, readiness_percentage)}%` }}
          />
        </div>
      </div>

      {/* Checklist Items Grid */}
      <div className="space-y-2">
        {checklist.map((item, idx) => {
          const isAvail = item.status === 'Available';
          return (
            <div
              key={idx}
              className={`flex items-start justify-between p-3 rounded-lg border transition ${
                isAvail
                  ? 'bg-white border-emerald-200/80 shadow-xs'
                  : 'bg-amber-50/40 border-amber-200/80'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isAvail ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-xs">
                      {item.document_type}
                    </span>
                    {item.mandatory ? (
                      <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded border border-red-200">
                        Mandatory
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded border border-slate-200">
                        Optional Supporting
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                  {item.source_reference && (
                    <span className="text-[10px] text-slate-400 font-mono inline-block mt-0.5">
                      Source Rule: {item.source_reference}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-right shrink-0">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isAvail
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {isAvail ? '✓ Available' : '⚠ Missing'}
                </span>
                {item.document_details && (
                  <span className="block text-[10px] text-slate-400 font-mono mt-1">
                    {item.document_details.document_reference_masked}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Academic Disclaimer Footer */}
      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
        <span>* Organizational checklist based on configured rules; not a statutory legal determination.</span>
        <span className="font-mono">ECI Revision 2026</span>
      </div>
    </div>
  );
}
