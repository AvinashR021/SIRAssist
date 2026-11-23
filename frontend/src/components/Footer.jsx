import React from 'react';
import { ShieldCheck } from 'lucide-react';
import rvceLogo from '../assets/rvce-logo.png';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="bg-white/95 p-1.5 rounded-lg inline-block mb-3 shadow-sm">
              <img src={rvceLogo} alt="RV College of Engineering" className="h-8 w-auto object-contain" />
            </div>
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
              <li>• Volunteer Manual Document Review Queue</li>
              <li>• Multi-Version Audit Trails & History</li>
              <li>• ACID Transactions & Integrity Enforcement</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Academic Context</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Designed as an educational decision-support demonstration. Not an official Election Commission or government portal.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div>
            <span className="font-semibold text-slate-400">SIRAssist | Academic Project</span> • Built with React.js, Express, and MySQL 8.0.
          </div>
          <div>
            Sample / demonstration data only. Official submissions require authorized portals.
          </div>
        </div>
      </div>
    </footer>
  );
}
