import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Database, Play, CheckCircle, Code, Clock, Layers } from 'lucide-react';

export default function DbmsDemoPage() {
  const [queriesList, setQueriesList] = useState([]);
  const [selectedQueryId, setSelectedQueryId] = useState(1);
  const [queryResult, setQueryResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('runner');

  useEffect(() => {
    API.get('/demo/queries')
      .then(res => {
        setQueriesList(res.data);
        if (res.data.length > 0) {
          runQuery(res.data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const runQuery = async (id) => {
    setExecuting(true);
    try {
      const res = await API.post('/demo/execute', { queryId: id });
      setQueryResult(res.data);
    } catch (err) {
      alert('Failed to execute query.');
    } finally {
      setExecuting(false);
    }
  };

  const selectedQuery = queriesList.find(q => q.id === parseInt(selectedQueryId));

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-xl border border-indigo-900/50 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Academic Viva Demonstration</span>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-400" /> Relational Database (DBMS) Demonstration Showcase
            </h1>
          </div>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setActiveTab('runner')}
              className={`px-3 py-1.5 rounded-md font-bold transition ${activeTab === 'runner' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              15+ SQL Query Runner
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-md font-bold transition ${activeTab === 'schema' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              ER Diagram & Relational Schema
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'runner' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Query Selector List */}
          <div className="card space-y-3 md:col-span-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Select Demonstration Query</h3>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {queriesList.map(q => (
                <button
                  key={q.id}
                  onClick={() => { setSelectedQueryId(q.id); runQuery(q.id); }}
                  className={`w-full text-left p-2.5 rounded text-xs font-medium border transition ${
                    q.id === parseInt(selectedQueryId)
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {q.title}
                </button>
              ))}
            </div>
          </div>

          {/* Execution Panel & Results Grid */}
          <div className="card md:col-span-2 space-y-4">
            {selectedQuery && (
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">{selectedQuery.title}</h2>
                    <p className="text-xs text-slate-500">{selectedQuery.description}</p>
                  </div>
                  <button
                    onClick={() => runQuery(selectedQuery.id)}
                    disabled={executing}
                    className="btn btn-primary btn-sm bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Play className="w-3.5 h-3.5" /> {executing ? 'Executing...' : 'Run SQL'}
                  </button>
                </div>

                {/* SQL Box */}
                <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto my-3 border border-slate-800">
                  <Code className="w-4 h-4 text-indigo-400 inline mr-2" />
                  {queryResult?.sql || selectedQuery.sql}
                </div>
              </div>
            )}

            {/* Results Grid */}
            {queryResult && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                  <span>Returned Rows: <strong className="text-slate-800 font-bold">{queryResult.rowCount}</strong></span>
                  <span>Execution Time: <strong className="text-emerald-700 font-bold">{queryResult.executionTimeMs} ms</strong></span>
                </div>

                <div className="table-container max-h-[350px]">
                  {queryResult.results && queryResult.results.length > 0 ? (
                    <table className="table">
                      <thead>
                        <tr>
                          {Object.keys(queryResult.results[0]).map(col => (
                            <th key={col} className="font-mono text-[11px] text-slate-700">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.results.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, vIdx) => (
                              <td key={vIdx} className="font-mono text-xs">
                                {val === null ? <span className="text-slate-400 italic">NULL</span> : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center py-6 text-xs text-slate-400 font-mono">No matching records returned.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Schema & ER Diagram Documentation Viewer */
        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Relational Schema & 3NF Normalization
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded border">
                <strong className="text-blue-700 block mb-1">1NF (Atomic Attributes)</strong>
                <p className="text-slate-600">All fields contain scalar indivisible data. Multi-valued documents are moved to Request_Document.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded border">
                <strong className="text-indigo-700 block mb-1">2NF (Full Functional Dependency)</strong>
                <p className="text-slate-600">All non-key columns depend on full primary keys without partial composite dependencies.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded border">
                <strong className="text-purple-700 block mb-1">3NF (Transitive Independence)</strong>
                <p className="text-slate-600">Address and area details are normalized to separate tables to prevent transitive dependencies.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto space-y-1">
              <div>Address (<u>address_id</u>, house_number, street, village, taluk, district, pin_code)</div>
              <div>Area (<u>area_id</u>, name, taluk, district, pin_code)</div>
              <div>Citizen (<u>citizen_id</u>, name, date_of_birth, mobile, email, address_id<sup>FK</sup>)</div>
              <div>Volunteer (<u>volunteer_id</u>, name, mobile, email, area_id<sup>FK</sup>, availability, skills)</div>
              <div>Verification_Request (<u>request_id</u>, citizen_id<sup>FK</sup>, voter_id<sup>FK</sup>, request_type, current_status)</div>
              <div>Request_Document (<u>request_id</u><sup>FK</sup>, <u>document_id</u><sup>FK</sup>, submitted_at)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
