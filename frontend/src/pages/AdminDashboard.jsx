import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
  Shield,
  Users,
  FileText,
  CheckCircle2,
  UserCheck,
  Settings,
  Search,
  Edit3,
  ExternalLink,
  AlertCircle,
  XCircle,
  Loader2,
  PlayCircle
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [adminDocs, setAdminDocs] = useState([]);
  const [docAssignments, setDocAssignments] = useState([]);

  const [activeTab, setActiveTab] = useState('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Status Change Modal (Form 9)
  const [selectedReq, setSelectedReq] = useState(null);
  const [newStatus, setNewStatus] = useState('UNDER_REVIEW');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [statusModalError, setStatusModalError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Assign Volunteer to Assistance Request Modal
  const [selectedAssistId, setSelectedAssistId] = useState(null);
  const [selectedVolId, setSelectedVolId] = useState('');
  const [assignModalError, setAssignModalError] = useState('');
  const [assigningVol, setAssigningVol] = useState(false);

  // Assign Volunteer to Document Review Modal
  const [selectedDocForAssign, setSelectedDocForAssign] = useState(null);
  const [selectedDocVolId, setSelectedDocVolId] = useState('');
  const [docAssignError, setDocAssignError] = useState('');
  const [assigningDocVol, setAssigningDocVol] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statRes, reqRes, volRes, citRes, reqmRes, assistRes, docRes, assignRes] = await Promise.all([
        API.get('/admin/statistics'),
        API.get('/requests'),
        API.get('/volunteers'),
        API.get('/admin/citizens'),
        API.get('/documents/requirements'),
        API.get('/assistance'),
        API.get('/admin/documents').catch(() => ({ data: [] })),
        API.get('/admin/volunteer-assignments').catch(() => ({ data: [] }))
      ]);

      setStats(statRes.data);
      setRequests(reqRes.data);
      setVolunteers(volRes.data);
      setCitizens(citRes.data);
      setRequirements(reqmRes.data);
      setAssistanceRequests(assistRes.data);
      setAdminDocs(docRes.data || []);
      setDocAssignments(assignRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // State Transition Matrix
  const ALLOWED_TRANSITIONS = {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['DOCUMENTS_PENDING', 'UNDER_REVIEW', 'CANCELLED'],
    DOCUMENTS_PENDING: ['DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'CANCELLED'],
    DOCUMENTS_SUBMITTED: ['UNDER_REVIEW', 'DOCUMENTS_PENDING', 'CANCELLED'],
    UNDER_REVIEW: ['RESOLVED', 'DOCUMENTS_PENDING', 'CANCELLED'],
    RESOLVED: ['UNDER_REVIEW'], // Re-open
    CANCELLED: []
  };

  const handleOpenStatusModal = (req) => {
    setSelectedReq(req);
    const available = ALLOWED_TRANSITIONS[req.current_status] || [];
    setNewStatus(available.length > 0 ? available[0] : req.current_status);
    setStatusRemarks('');
    setStatusModalError('');
  };

  // FORM 9 Submission: Update Request Status with Transaction
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    if (statusRemarks && statusRemarks.length > 500) {
      setStatusModalError('Remarks cannot exceed 500 characters.');
      return;
    }

    setUpdatingStatus(true);
    setStatusModalError('');

    try {
      await API.put(`/requests/${selectedReq.request_id}/status`, {
        status: newStatus,
        remarks: statusRemarks.trim() || undefined
      });
      setSelectedReq(null);
      setStatusRemarks('');
      fetchAdminData();
    } catch (err) {
      setStatusModalError(err.response?.data?.error || 'Failed to update request status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignVolunteer = async (e) => {
    e.preventDefault();
    if (!selectedVolId) {
      setAssignModalError('Please select a volunteer.');
      return;
    }

    setAssigningVol(true);
    setAssignModalError('');
    try {
      await API.post('/admin/assign-volunteer', {
        assistance_id: selectedAssistId,
        volunteer_id: selectedVolId
      });
      setSelectedAssistId(null);
      setSelectedVolId('');
      fetchAdminData();
    } catch (err) {
      setAssignModalError(err.response?.data?.error || 'Failed to assign volunteer.');
    } finally {
      setAssigningVol(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">Loading admin analytics dashboard...</div>;

  // Chart Data Formatting
  const statusChartData = {
    labels: stats?.charts?.statusChart?.map(s => s.label) || [],
    datasets: [{
      label: 'Requests by Status',
      data: stats?.charts?.statusChart?.map(s => s.count) || [],
      backgroundColor: ['#0284c7', '#f59e0b', '#c084fc', '#10b981', '#ef4444']
    }]
  };

  const areaChartData = {
    labels: stats?.charts?.areaChart?.map(a => a.label) || [],
    datasets: [{
      label: 'Requests by District',
      data: stats?.charts?.areaChart?.map(a => a.count) || [],
      backgroundColor: '#3b82f6'
    }]
  };

  const categoryChartData = {
    labels: stats?.charts?.categoryChart?.map(c => c.label) || [],
    datasets: [{
      data: stats?.charts?.categoryChart?.map(c => c.count) || [],
      backgroundColor: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981']
    }]
  };

  const filteredRequests = requests.filter(r => {
    const matchSearch = (r.request_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (r.citizen_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.request_id.toString().includes(searchQuery);
    const matchStatus = !statusFilter || r.current_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Application Administration</span>
          <h1 className="text-2xl font-bold flex items-center gap-2 mt-0.5">
            <Shield className="w-6 h-6 text-purple-400" /> Executive Analytics & Management Portal
          </h1>
          <p className="text-slate-400 text-xs mt-1">Supervise citizen requests, manage volunteers, and audit workflow integrity</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/validation-demo"
            className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white border-none btn-sm font-bold shadow-md flex items-center gap-1.5"
          >
            <PlayCircle className="w-4 h-4 text-indigo-200" /> Validation & Security Demo
          </Link>
          <span className="text-xs bg-purple-900/60 border border-purple-500/30 text-purple-200 px-3 py-1.5 rounded-full font-mono">
            Admin Access
          </span>
        </div>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="card p-3 text-center">
          <span className="text-xl font-black text-blue-600 block">{stats?.cards?.totalCitizens}</span>
          <span className="text-[11px] text-slate-500 font-semibold">Citizens</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-xl font-black text-slate-800 block">{stats?.cards?.totalRequests}</span>
          <span className="text-[11px] text-slate-500 font-semibold">Total Requests</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-xl font-black text-amber-600 block">{stats?.cards?.pendingRequests}</span>
          <span className="text-[11px] text-slate-500 font-semibold">Pending Review</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-xl font-black text-emerald-600 block">{stats?.cards?.resolvedRequests}</span>
          <span className="text-[11px] text-slate-500 font-semibold">Resolved</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-xl font-black text-purple-600 block">{stats?.cards?.totalAssistance}</span>
          <span className="text-[11px] text-slate-500 font-semibold">Assistance Requests</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-xl font-black text-indigo-600 block">{stats?.cards?.totalVolunteers}</span>
          <span className="text-[11px] text-slate-500 font-mono font-semibold">Volunteers</span>
        </div>
      </div>

      {/* Chart.js Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Requests by Current Status</h3>
          <div className="h-48 flex items-center justify-center">
            <Doughnut data={statusChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card">
          <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Requests by District Area</h3>
          <div className="h-48 flex items-center justify-center">
            <Bar data={areaChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card">
          <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Assistance Request Categories</h3>
          <div className="h-48 flex items-center justify-center">
            <Pie data={categoryChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Management Tabs */}
      <div className="card">
        <div className="flex border-b border-slate-200 mb-4 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-2 ${
              activeTab === 'requests' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'
            }`}
          >
            <FileText className="w-4 h-4" /> Verification Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('assistance')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-2 ${
              activeTab === 'assistance' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Assistance & Volunteer Matching ({assistanceRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-2 ${
              activeTab === 'volunteers' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'
            }`}
          >
            <Users className="w-4 h-4" /> Volunteers Roster ({volunteers.length})
          </button>
          <button
            onClick={() => setActiveTab('citizens')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-2 ${
              activeTab === 'citizens' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'
            }`}
          >
            Citizens Directory ({citizens.length})
          </button>
          <button
            onClick={() => setActiveTab('doc_assignments')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-2 ${
              activeTab === 'doc_assignments' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Document Review Assignments ({adminDocs.length})
          </button>
        </div>

        {/* Tab 1: Verification Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by Citizen, Type, or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 border rounded text-xs w-64"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border rounded text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING</option>
                  <option value="DOCUMENTS_SUBMITTED">DOCUMENTS_SUBMITTED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Req #</th>
                    <th>Citizen</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(r => (
                    <tr key={r.request_id}>
                      <td className="font-mono text-xs font-bold text-blue-700">VR100{r.request_id}</td>
                      <td className="font-semibold text-slate-800">{r.citizen_name}</td>
                      <td className="text-xs">{r.request_type}</td>
                      <td className="text-xs text-slate-500">{new Date(r.submission_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${r.current_status.toLowerCase()}`}>{r.current_status}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenStatusModal(r)}
                            className="btn btn-outline btn-sm text-[11px] py-1 text-purple-700 border-purple-200 hover:bg-purple-50"
                          >
                            <Edit3 className="w-3 h-3" /> Update Status (Form 9)
                          </button>
                          <Link to={`/requests/${r.request_id}`} className="text-xs text-blue-600 hover:underline">
                            View Timeline →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Assistance Matching */}
        {activeTab === 'assistance' && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Req #</th>
                  <th>Citizen</th>
                  <th>Request Type</th>
                  <th>Priority</th>
                  <th>Assigned Volunteer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assistanceRequests.map(a => (
                  <tr key={a.assistance_id}>
                    <td className="font-mono text-xs font-bold">AR100{a.assistance_id}</td>
                    <td className="font-semibold">{a.citizen_name}</td>
                    <td>{a.request_type}</td>
                    <td><span className="badge bg-amber-100 text-amber-800">{a.priority}</span></td>
                    <td className="font-semibold text-indigo-700">{a.volunteer_name || 'Unassigned'}</td>
                    <td><span className="badge badge-pending">{a.status}</span></td>
                    <td>
                      <button
                        onClick={() => { setSelectedAssistId(a.assistance_id); setAssignModalError(''); }}
                        className="btn btn-primary btn-sm text-[11px] py-1"
                      >
                        Assign Volunteer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Volunteers Roster */}
        {activeTab === 'volunteers' && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Area Zone</th>
                  <th>Availability</th>
                  <th>Skills</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map(v => (
                  <tr key={v.volunteer_id}>
                    <td className="font-mono text-xs font-bold">VOL#{v.volunteer_id}</td>
                    <td className="font-semibold">{v.name}</td>
                    <td className="text-xs font-mono">{v.email}</td>
                    <td className="text-xs">{v.area_name || 'Bengaluru South'}</td>
                    <td>
                      <span className={`badge ${v.availability === 'Available' ? 'badge-resolved' : 'badge-pending'}`}>
                        {v.availability}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600">{v.skills}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Citizens Directory */}
        {activeTab === 'citizens' && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>District</th>
                  <th>Registered At</th>
                </tr>
              </thead>
              <tbody>
                {citizens.map(c => (
                  <tr key={c.citizen_id}>
                    <td className="font-mono text-xs font-bold">CIT#{c.citizen_id}</td>
                    <td className="font-semibold text-slate-800">{c.name}</td>
                    <td className="text-xs">{c.email}</td>
                    <td className="text-xs font-mono">{c.mobile}</td>
                    <td className="text-xs">{c.district || 'Bengaluru'}</td>
                    <td className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: Document Review Assignments */}
        {activeTab === 'doc_assignments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Citizen Document Verification Assignments</h3>
                <p className="text-xs text-slate-500">Assign uploaded supporting document files to approved community volunteers for manual review.</p>
              </div>
              <button onClick={fetchAdminData} className="btn btn-outline btn-sm text-xs py-1">
                Refresh Document List
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Doc #</th>
                    <th>Citizen Name</th>
                    <th>Document Type</th>
                    <th>Version</th>
                    <th>Review Status</th>
                    <th>Assigned Volunteer</th>
                    <th>Assignment Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminDocs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-6 text-slate-400 text-xs">No document files uploaded by citizens yet.</td>
                    </tr>
                  ) : (
                    adminDocs.map(d => (
                      <tr key={d.document_id}>
                        <td className="font-mono text-xs font-bold text-blue-700">DOC#{d.document_id}</td>
                        <td>
                          <div className="font-semibold text-slate-800 text-xs">{d.citizen_name}</div>
                          <div className="text-[10px] text-slate-400">{d.citizen_email}</div>
                        </td>
                        <td className="text-xs font-semibold">{d.document_type}</td>
                        <td className="font-mono text-xs">v{d.current_version}</td>
                        <td>
                          <span className="badge badge-info text-[10px]">{d.file_review_status}</span>
                        </td>
                        <td className="text-xs">
                          {d.assigned_volunteer ? (
                            <span className="font-semibold text-purple-700">{d.assigned_volunteer}</span>
                          ) : (
                            <span className="text-amber-600 font-semibold italic">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${d.assignment_status === 'Active' ? 'badge-resolved' : 'badge-warning'} text-[10px]`}>
                            {d.assignment_status || 'Unassigned'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => {
                              setSelectedDocForAssign(d);
                              setSelectedDocVolId(d.volunteer_id ? String(d.volunteer_id) : '');
                              setDocAssignError('');
                            }}
                            className="btn btn-primary btn-sm text-xs py-1 px-3 bg-purple-600 hover:bg-purple-700 border-none"
                          >
                            {d.assigned_volunteer ? 'Reassign' : 'Assign Volunteer'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* FORM 9 MODAL: Admin Request Status Update */}
      {selectedReq && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-purple-600" /> Admin Request Status Transition (Form 9)
                </h3>
                <p className="text-[11px] text-slate-500">Atomic status transition with automated history & notification</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {statusModalError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4 border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{statusModalError}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Request Identifier</span>
                <span className="font-bold text-blue-700">VR100{selectedReq.request_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Current Status</span>
                <span className="font-bold text-purple-700">{selectedReq.current_status}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateStatus} noValidate className="space-y-4 text-xs">
              <div className="form-group mb-0">
                <label className="form-label">
                  New Status Transition <span className="req">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="form-select font-semibold"
                >
                  {(ALLOWED_TRANSITIONS[selectedReq.current_status] || []).length === 0 ? (
                    <option value={selectedReq.current_status}>No further transitions permitted (Terminal State)</option>
                  ) : (
                    (ALLOWED_TRANSITIONS[selectedReq.current_status] || []).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))
                  )}
                </select>
                <p className="form-hint">Enforces valid state machine transitions to maintain relational consistency.</p>
              </div>

              <div className="form-group mb-0">
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label mb-0">Admin Audit Remarks</label>
                  <span className="text-[10px] text-slate-400">{statusRemarks.length} / 500 chars</span>
                </div>
                <textarea
                  rows="3"
                  maxLength="500"
                  value={statusRemarks}
                  onChange={e => setStatusRemarks(e.target.value)}
                  placeholder="Record verification notes, resolution remarks, or query clarification..."
                  className="form-textarea text-xs"
                />
              </div>

              <div className="bg-purple-50 p-2.5 rounded border border-purple-200 text-[10px] text-purple-800">
                ⚡ <strong>DBMS Transaction:</strong> Updating status executes an atomic transaction. In MySQL, the database trigger <code>trg_after_verification_request_update_status</code> automatically captures this change in <code>Status_History</code> and creates a citizen <code>Notification</code> without duplicate logging.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus || (ALLOWED_TRANSITIONS[selectedReq.current_status] || []).length === 0}
                  className="btn btn-primary btn-sm px-4 bg-purple-600 hover:bg-purple-700 border-none"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating Status...
                    </>
                  ) : (
                    'Execute Status Transition'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Volunteer Modal */}
      {selectedAssistId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Assign Volunteer to Assistance #AR100{selectedAssistId}</h3>
              <button
                type="button"
                onClick={() => setSelectedAssistId(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {assignModalError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4 border border-red-200">
                {assignModalError}
              </div>
            )}

            <form onSubmit={handleAssignVolunteer} noValidate className="space-y-4 text-xs">
              <div className="form-group mb-0">
                <label className="form-label">Select Available Volunteer <span className="req">*</span></label>
                <select
                  value={selectedVolId}
                  onChange={e => setSelectedVolId(e.target.value)}
                  required
                  className="form-select"
                >
                  <option value="">Choose Volunteer...</option>
                  {volunteers.map(v => (
                    <option key={v.volunteer_id} value={v.volunteer_id}>
                      {v.name} ({v.area_name || 'General Zone'} - {v.skills}) [{v.availability}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedAssistId(null)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningVol}
                  className="btn btn-primary btn-sm"
                >
                  {assigningVol ? 'Assigning...' : 'Assign & Notify Citizen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Volunteer to Document Review */}
      {selectedDocForAssign && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Assign Volunteer for Document Review</h3>
              <button onClick={() => setSelectedDocForAssign(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {docAssignError && (
              <div className="bg-rose-50 text-rose-700 p-2.5 rounded text-xs mb-3 border border-rose-200">
                {docAssignError}
              </div>
            )}

            <div className="bg-slate-50 p-2.5 rounded text-xs space-y-1 mb-3 border border-slate-200">
              <div><strong>Document:</strong> DOC#{selectedDocForAssign.document_id} — {selectedDocForAssign.document_type}</div>
              <div><strong>Citizen:</strong> {selectedDocForAssign.citizen_name}</div>
              <div><strong>Current Review Status:</strong> {selectedDocForAssign.file_review_status}</div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedDocVolId) {
                  setDocAssignError('Please select a volunteer.');
                  return;
                }
                setAssigningDocVol(true);
                try {
                  await API.post('/admin/volunteer-assignments', {
                    document_id: selectedDocForAssign.document_id,
                    volunteer_id: parseInt(selectedDocVolId)
                  });
                  setSelectedDocForAssign(null);
                  fetchAdminData();
                } catch (err) {
                  setDocAssignError(err.response?.data?.error || 'Failed to assign volunteer.');
                } finally {
                  setAssigningDocVol(false);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="form-label font-semibold">Select Approved Volunteer <span className="req">*</span></label>
                <select
                  value={selectedDocVolId}
                  onChange={e => setSelectedDocVolId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Choose Volunteer...</option>
                  {volunteers.filter(v => v.verification_status === 'Approved').map(v => (
                    <option key={v.volunteer_id} value={v.volunteer_id}>
                      {v.name} ({v.area_name || 'General Zone'}) [{v.availability}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedDocForAssign(null)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={assigningDocVol} className="btn btn-primary btn-sm bg-purple-600 hover:bg-purple-700 border-none">
                  {assigningDocVol ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
