import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckSquare, Users, Database, FileText, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-12 pb-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-blue-200 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-400" /> Academic DBMS Project Demonstration
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            SIRAssist – Citizen Assistance & Verification Management System
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            A citizen-centric readiness checklist, document organization, volunteer support, and request tracking platform designed for electoral roll revision workflows.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/register" className="btn btn-primary bg-blue-500 hover:bg-blue-600 border-none px-6 py-3 text-base">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/demo" className="btn btn-outline border-slate-600 text-white hover:bg-white/10 px-6 py-3 text-base">
              <Database className="w-4 h-4 text-indigo-400" /> Explore DBMS Showcase
            </Link>
          </div>
        </div>
      </section>

      {/* Mandatory Disclaimer Box */}
      <div className="disclaimer-banner">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
        <div>
          <strong className="font-semibold text-amber-900">Academic Project Disclaimer:</strong>
          <p className="text-xs text-amber-800 mt-0.5">
            SIRAssist is an academic citizen-assistance project. It is NOT an official government or Election Commission application. Official electoral records, eligibility decisions, and submissions must be verified through authorized government channels (e.g. voters.eci.gov.in).
          </p>
        </div>
      </div>

      {/* Key Problems Solved */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800">What Questions Does SIRAssist Answer?</h2>
          <p className="text-slate-500 text-sm mt-1">Helping citizens navigate document readiness before submission.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card hover:border-blue-300 transition">
            <CheckSquare className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-bold text-base text-slate-800 mb-1">"What do I need to prepare?"</h3>
            <p className="text-xs text-slate-600">
              Interactive document checklist mapped to request types (e.g., Record Verification, Correction Assistance).
            </p>
          </div>

          <div className="card hover:border-blue-300 transition">
            <FileText className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-bold text-base text-slate-800 mb-1">"What is the current status?"</h3>
            <p className="text-xs text-slate-600">
              Complete status workflow tracking with immutable database audit logs and timeline views.
            </p>
          </div>

          <div className="card hover:border-blue-300 transition">
            <Users className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-bold text-base text-slate-800 mb-1">"Where can I get assistance?"</h3>
            <p className="text-xs text-slate-600">
              Spatial and skill-based volunteer matching to help elderly or digitally less-experienced citizens.
            </p>
          </div>
        </div>
      </section>

      {/* DBMS Architectural Highlights */}
      <section className="bg-slate-100 border border-slate-200 rounded-xl p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" /> Database Management System (DBMS) Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="font-bold text-blue-700 block mb-1">3NF Relational Schema</span>
            <p className="text-slate-500">15 entities fully normalized to Third Normal Form with primary & foreign key constraints.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="font-bold text-indigo-700 block mb-1">Triggers & Stored Procedures</span>
            <p className="text-slate-500">Automated triggers for status history logs & notification dispatches.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="font-bold text-purple-700 block mb-1">Database Transactions</span>
            <p className="text-slate-500">ACID compliant multi-step request creation & volunteer assignments.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="font-bold text-emerald-700 block mb-1">15+ Demo Queries</span>
            <p className="text-slate-500">Live query runner showing JOINs, GROUP BY, HAVING, subqueries, and window functions.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
