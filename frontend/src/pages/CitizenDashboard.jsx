import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import ReadinessBadge from '../components/ReadinessBadge';
import { FileText, PlusCircle, HelpCircle, FileCheck, CheckCircle2, Clock, AlertCircle, Eye } from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showCreateReqModal, setShowCreateReqModal] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);

  // Form States
  const [reqType, setReqType] = useState('Record Verification');
  const [reqRemarks, setReqRemarks] = useState('');
  const [assistType, setAssistType] = useState('Digital Assistance');
  const [assistNotes, setAssistNotes] = useState('');
  const [assistPriority, setAssistPriority] = useState('Medium');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [reqRes, docRes, assistRes] = await Promise.all([
        API.get('/requests'),
        API.get('/documents'),
        API.get('/assistance')
      ]);

      setRequests(reqRes.data);
      setDocuments(docRes.data);
      setAssistanceRequests(assistRes.data);

      // Fetch readiness for latest request if available
      if (reqRes.data.length > 0) {
        const latestId = reqRes.data[0].request_id;
        const readRes = await API.get(`/requests/${latestId}/readiness`);
        setReadiness(readRes.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await API.post('/requests', {
        request_type: reqType,
        remarks: reqRemarks
      });
      setShowCreateReqModal(false);
      setReqRemarks('');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create request.');
    }
  };

  const handleCreateAssistance = async (e) => {
    e.preventDefault();
    try {
      await API.post('/assistance', {
        request_type: assistType,
        priority: assistPriority,
        notes: assistNotes
      });
      setShowAssistanceModal(false);
      setAssistNotes('');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit assistance request.');
    }
  };

  const pendingCount = requests.filter(r => ['SUBMITTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW'].includes(r.current_status)).length;
  const completedCount = requests.filter(r => r.current_status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.username || 'Citizen'}</h1>
          <p className="text-xs text-slate-500">Citizen Assistance & Verification Tracking Dashboard</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreateReqModal(true)} className="btn btn-primary btn-sm">
            <PlusCircle className="w-4 h-4" /> New Verification Request
          </button>
          <button onClick={() => setShowAssistanceModal(true)} className="btn btn-outline btn-sm text-purple-700 border-purple-300">
            <HelpCircle className="w-4 h-4" /> Request Volunteer Help
          </button>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center p-4">
          <span className="text-2xl font-black text-blue-600 block">{requests.length}</span>
          <span className="text-xs text-slate-500 font-medium">Total Requests</span>
        </div>
        <div className="card text-center p-4">
          <span className="text-2xl font-black text-amber-600 block">{pendingCount}</span>
          <span className="text-xs text-slate-500 font-medium">Pending</span>
        </div>
        <div className="card text-center p-4">
          <span className="text-2xl font-black text-emerald-600 block">{completedCount}</span>
          <span className="text-xs text-slate-500 font-medium">Completed</span>
        </div>
        <div className="card text-center p-4">
          <span className="text-2xl font-black text-indigo-600 block">{documents.length}</span>
          <span className="text-xs text-slate-500 font-medium font-mono">Documents Added</span>
        </div>
        <div className="card text-center p-4">
          <span className="text-2xl font-black text-purple-600 block">{assistanceRequests.length}</span>
          <span className="text-xs text-slate-500 font-medium">Volunteer Requests</span>
        </div>
      </div>

      {/* Readiness Widget */}
      {readiness && (
        <div className="card">
          <ReadinessBadge readiness={readiness} />
        </div>
      )}

      {/* My Verification Requests Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> My Verification Requests
          </h2>
          <Link to="/documents" className="text-xs text-blue-600 font-semibold hover:underline">Manage Documents →</Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Request Type</th>
                <th>Submission Date</th>
                <th>Current Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-400">
                    No verification requests logged yet. Click "New Verification Request" to begin.
                  </td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.request_id}>
                    <td className="font-mono font-bold text-blue-700">VR100{req.request_id}</td>
                    <td className="font-semibold text-slate-800">{req.request_type}</td>
                    <td className="text-xs text-slate-500">{new Date(req.submission_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${req.current_status.toLowerCase()}`}>
                        {req.current_status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/requests/${req.request_id}`} className="btn btn-outline btn-sm text-xs">
                        <Eye className="w-3.5 h-3.5" /> View Details & Timeline
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Verification Request Modal */}
      {showCreateReqModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-bold mb-4 text-slate-800">Create Verification Request</h3>
            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Request Type</label>
                <select value={reqType} onChange={e => setReqType(e.target.value)} className="w-full p-2 border rounded">
                  <option value="Record Verification">Record Verification</option>
                  <option value="Correction Assistance">Correction Assistance</option>
                  <option value="Document Clarification">Document Clarification</option>
                  <option value="Missing Record Assistance">Missing Record Assistance</option>
                  <option value="General Assistance">General Assistance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Remarks / Details</label>
                <textarea
                  rows="3"
                  value={reqRemarks}
                  onChange={e => setReqRemarks(e.target.value)}
                  placeholder="Describe your request requirement..."
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateReqModal(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Assistance Modal */}
      {showAssistanceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-bold mb-4 text-slate-800">Request Volunteer Assistance</h3>
            <form onSubmit={handleCreateAssistance} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Assistance Type</label>
                <select value={assistType} onChange={e => setAssistType(e.target.value)} className="w-full p-2 border rounded">
                  <option value="Digital Assistance">Digital Assistance</option>
                  <option value="Form Filling">Form Filling</option>
                  <option value="Doorstep Visit">Doorstep Visit</option>
                  <option value="Document Scan">Document Scan</option>
                  <option value="Language Help">Language Help</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Priority</label>
                <select value={assistPriority} onChange={e => setAssistPriority(e.target.value)} className="w-full p-2 border rounded">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High (Senior Citizen / Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes / Special Instructions</label>
                <textarea
                  rows="3"
                  value={assistNotes}
                  onChange={e => setAssistNotes(e.target.value)}
                  placeholder="Please state if you need doorstep help or language assistance..."
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAssistanceModal(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Submit Assistance Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
