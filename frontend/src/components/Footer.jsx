import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" /> SIRAssist
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Academic DBMS Project – Citizen Assistance and Verification Management System for Electoral Roll Revision.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Project Features</h4>
            <ul className="space-y-1 text-slate-400">
              <li>• Verification Readiness Checklist</li>
              <li>• Area-based Volunteer Matching</li>
              <li>• Automated Status Audit History</li>
              <li>• 15+ Advanced DBMS Demonstration Queries</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Official Reminder</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              For official electoral registration, voter list verification, or official submissions, citizens must visit official government portals (e.g. voters.eci.gov.in).
            </p>
          </div>
        </div>

        {/* Mandated Academic Disclaimer Box */}
        <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-normal text-amber-200/90 font-mono">
            <strong>ACADEMIC PROJECT DISCLAIMER:</strong> SIRAssist is an academic project developed for citizen assistance and workflow demonstration. It is not an official government or Election Commission application. Information shown in this demo is fictional/sample data. Users should rely on official government sources for authoritative electoral information, eligibility, verification and submissions.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
          © 2026 SIRAssist Academic DBMS Project. Built with React.js, Express, and MySQL 8.0.
        </div>
      </div>
    </footer>
  );
}
