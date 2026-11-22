import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import {
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Code,
  Clock,
  ArrowLeft,
  RefreshCw,
  Lock,
  Layers,
  Database,
  Loader2
} from 'lucide-react';

export default function ValidationDemoPage() {
  const [tests, setTests] = useState([]);
  const [testResults, setTestResults] = useState({});
  const [runningTestId, setRunningTestId] = useState(null);
  const [runningAll, setRunningAll] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await API.get('/demo/validation-tests');
      setTests(res.data);
      if (res.data.length > 0) setSelectedTest(res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const runSingleTest = async (testId) => {
    setRunningTestId(testId);
    try {
      const res = await API.post('/demo/run-validation-test', { testId });
      setTestResults(prev => ({ ...prev, [testId]: res.data }));
      if (selectedTest?.id === testId) {
        setSelectedTest(prev => ({ ...prev, lastResult: res.data }));
      }
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [testId]: {
          testId,
          passed: false,
          httpStatus: err.response?.status || 500,
          serverResponse: err.response?.data || { error: 'Test execution failed' }
        }
      }));
    } finally {
      setRunningTestId(null);
    }
  };

  const runAllTests = async () => {
    setRunningAll(true);
    for (const test of tests) {
      await runSingleTest(test.id);
    }
    setRunningAll(false);
  };

  const totalExecuted = Object.keys(testResults).length;
  const passedCount = Object.values(testResults).filter(r => r.passed).length;
  const failedCount = Object.values(testResults).filter(r => !r.passed).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex justify-between items-center">
        <Link to="/admin-dashboard" className="btn btn-outline btn-sm text-xs inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
        </Link>
        <span className="text-xs text-purple-700 bg-purple-50 font-bold px-3 py-1 rounded-full border border-purple-200">
          Component 8 Evaluation Demonstration
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full mb-2 border border-indigo-500/30 font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Security, Validation & Constraint Harness
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Admin → Form Validation & Security Demo
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Live interactive demonstration of client-side validation, server-side payload enforcement, relational constraints (PK, FK, UNIQUE, CHECK), and ACID transaction rollbacks.
            </p>
          </div>

          <button
            onClick={runAllTests}
            disabled={runningAll || tests.length === 0}
            className="btn btn-primary bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 shadow-lg border-none"
          >
            {runningAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Executing 10 Tests...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run All 10 Tests Live
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <span className="text-2xl font-black text-slate-800 block">{tests.length}</span>
          <span className="text-[11px] text-slate-500 font-semibold uppercase">Total Rubric Tests</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-2xl font-black text-blue-600 block">{totalExecuted}</span>
          <span className="text-[11px] text-slate-500 font-semibold uppercase">Executed Live</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-2xl font-black text-emerald-600 block">{passedCount}</span>
          <span className="text-[11px] text-slate-500 font-semibold uppercase">Tests Passed</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-2xl font-black text-red-600 block">{failedCount}</span>
          <span className="text-[11px] text-slate-500 font-semibold uppercase">Tests Failed</span>
        </div>
      </div>

      {/* Main Split Layout: Test Matrix & Live Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of 10 Predefined Tests */}
        <div className="card lg:col-span-1 space-y-3">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Select Test Scenario
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">10 Scenarios</span>
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {tests.map(test => {
              const res = testResults[test.id];
              const isSelected = selectedTest?.id === test.id;
              const isRunning = runningTestId === test.id;

              return (
                <div
                  key={test.id}
                  onClick={() => setSelectedTest(test)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5 pr-2">
                    <span className="font-bold text-slate-800 block text-xs">{test.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">{test.category}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : res ? (
                      res.passed ? (
                        <span className="badge badge-resolved text-[10px] py-0.5">PASS</span>
                      ) : (
                        <span className="badge badge-cancelled text-[10px] py-0.5">FAIL</span>
                      )
                    ) : (
                      <span className="badge badge-draft text-[10px] py-0.5 text-slate-400">NOT RUN</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Test Execution & Evidence Panel */}
        <div className="card lg:col-span-2 space-y-4">
          {selectedTest ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {selectedTest.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-800 mt-1">{selectedTest.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedTest.description}</p>
                </div>

                <button
                  onClick={() => runSingleTest(selectedTest.id)}
                  disabled={runningTestId === selectedTest.id}
                  className="btn btn-primary btn-sm bg-indigo-600 hover:bg-indigo-700 shrink-0"
                >
                  {runningTestId === selectedTest.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Execute Test Now
                    </>
                  )}
                </button>
              </div>

              {/* Endpoint & Expected Behavior Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Target Endpoint / Guard</span>
                  <code className="font-mono text-indigo-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                    {selectedTest.endpoint}
                  </code>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Expected HTTP Status</span>
                  <span className="font-mono font-bold text-slate-800">
                    HTTP {selectedTest.expectedStatus} (Rejection / Handled)
                  </span>
                </div>
              </div>

              {/* Payload Sent */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Submitted Test Payload (Simulated HTTP Body / Parameter):
                </span>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800">
                  {selectedTest.payload ? (
                    <pre>{JSON.stringify(selectedTest.payload, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-400 italic">No authorization bearer token provided (Headers: empty)</span>
                  )}
                </div>
              </div>

              {/* Server Execution Result */}
              {testResults[selectedTest.id] ? (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      Server & Database Response
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Execution Time: <strong className="text-slate-800">{testResults[selectedTest.id].executionTimeMs || 1} ms</strong>
                      </span>
                      <span
                        className={`badge text-xs px-2.5 py-1 ${
                          testResults[selectedTest.id].passed ? 'badge-resolved' : 'badge-cancelled'
                        }`}
                      >
                        {testResults[selectedTest.id].passed ? '✓ PASSED (REJECTED AS EXPECTED)' : '✗ FAILED'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 text-emerald-400 p-3 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800">
                    <div className="text-slate-400 mb-1">
                      Status Code: <strong className="text-white">{testResults[selectedTest.id].httpStatus}</strong>
                    </div>
                    <pre>{JSON.stringify(testResults[selectedTest.id].serverResponse, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  Click <strong>"Execute Test Now"</strong> above to send this live payload to the backend validator and observe real constraint enforcement.
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select a test from the left to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
