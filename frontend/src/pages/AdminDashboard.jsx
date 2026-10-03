import React, { useState, useEffect } from 'react';
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
import { Shield, Users, FileText, CheckCircle2, UserCheck, Settings, Search, Edit3 } from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Status Change Modal
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [newStatus, setNewStatus] = useState('UNDER_REVIEW');
  const [statusRemarks, setStatusRemarks] = useState('');

  // Assign Volunteer Modal
  const [selectedAssistId, setSelectedAssistId] = useState(null);
  const [selectedVolId, setSelectedVolId] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statRes, reqRes, volRes, citRes, reqmRes, assistRes] = await Promise.all([
        API.get('/admin/statistics'),
        API.get('/requests'),
        API.get('/volunteers'),
        API.get('/admin/citizens'),
        API.get('/documents/requirements'),
        API.get('/assistance')
      ]);

      setStats(statRes.data);
      setRequests(reqRes.data);
      setVolunteers(volRes.data);
      setCitizens(citRes.data);
      setRequirements(reqmRes.data);
      setAssistanceRequests(assistRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/requests/${selectedReqId}/status`, {
        status: newStatus,
        remarks: statusRemarks
      });
      setSelectedReqId(null);
      setStatusRemarks('');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handleAssignVolunteer = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/assign-volunteer', {
        assistance_id: selectedAssistId,
        volunteer_id: selectedVolId
      });
      setSelectedAssistId(null);
      fetchAdminData();
    } catch (err) {
      alert('Failed to assign volunteer.');
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
    const matchSearch = r.request_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.citizen_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.request_id.toString().includes(searchQuery);
    const matchStatus = !statusFilter || r.current_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Application Administration</span>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" /> Executive Analytics & Management Portal
          </h1>
        </div>
        <span className="text-xs bg-purple-900/60 border border-purple-500/30 text-purple-200 px-3 py-1 rounded-full font-mono">
          System Admin Access
        </span>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="card p-3 text-center">
          <span className="text-xl font-black text-blue-600 block">{stats?.cards?.totalCitizens}</span>
          <span className="text-[11px] text-slate-500">Citizens</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-xl font-black text-slate-800 block">{stats?.cards?.totalRequests}</span>
          <span className="text-[11px] text-slate-500">Total Requests</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-xl font-black text-amber-600 block">{stats?.cards?.pendingRequests}</span>
          <span className="text-[11px] text-slate-500">Pending</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-xl font-black text-emerald-600 block">{stats?.cards?.resolvedRequests}</span>
          <span className="text-[11px] text-slate-500">Resolved</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-xl font-black text-purple-600 block">{stats?.cards?.totalAssistance}</span>
          <span className="text-[11px] text-slate-500">Assistance Requests</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-xl font-black text-indigo-600 block">{stats?.cards?.totalVolunteers}</span>
          <span className="text-[11px] text-slate-500 font-mono">Volunteers</span>
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
            className={`py-2.5 px-4 border-b-2 flex items-center gap-2 ${activeTab === 'requests' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'}`}
          >
            <FileText className="w-4 h-4" /> Verification Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('assistance')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-2 ${activeTab === 'assistance' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'}`}
          >
            <UserCheck className="w-4 h-4" /> Assistance & Volunteer Matching ({assistanceRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-2 ${activeTab === 'volunteers' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'}`}
          >
            <Users className="w-4 h-4" /> Volunteers Roster ({volunteers.length})
          </button>
          <button
            onClick={() => setActiveTab('citizens')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-2 ${activeTab === 'citizens' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500'}`}
          >
            Citizens Directory ({citizens.length})
          </button>
        </div>

        {/* Tab 1: Verification Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by Citizen or Request ID..."
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
                      <td><span className={`badge badge-${r.current_status.toLowerCase()}`}>{r.current_status}</span></td>
                      <td>
                        <button
                          onClick={() => { setSelectedReqId(r.request_id); setNewStatus(r.current_status); }}
                          className="btn btn-outline btn-sm text-[11px] py-1"
                        >
                          <Edit3 className="w-3 h-3" /> Update Status
                        </button>
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
                        onClick={() => setSelectedAssistId(a.assistance_id)}
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
                    <td className="font-semibold text-slate-800">{v.name}</td>
                    <td className="text-xs">{v.email}</td>
                    <td className="text-xs font-medium">{v.area_name || 'General Zone'}</td>
                    <td><span className="badge badge-resolved">{v.availability}</span></td>
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
      </div>

      {/* Update Request Status Modal */}
      {selectedReqId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-base font-bold mb-4">Update Verification Request #VR100{selectedReqId} Status</h3>
            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">New Workflow Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full p-2 border rounded">
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING</option>
                  <option value="DOCUMENTS_SUBMITTED">DOCUMENTS_SUBMITTED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Status Remarks / Admin Audit Note</label>
                <textarea
                  rows="3"
                  value={statusRemarks}
                  onChange={e => setStatusRemarks(e.target.value)}
                  placeholder="State reason for status update..."
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedReqId(null)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Update Status & Notify</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Volunteer Modal */}
      {selectedAssistId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-base font-bold mb-4">Assign Volunteer to Assistance #AR100{selectedAssistId}</h3>
            <form onSubmit={handleAssignVolunteer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Available Volunteer</label>
                <select value={selectedVolId} onChange={e => setSelectedVolId(e.target.value)} required className="w-full p-2 border rounded">
                  <option value="">Select Volunteer...</option>
                  {volunteers.map(v => (
                    <option key={v.volunteer_id} value={v.volunteer_id}>
                      {v.name} ({v.area_name || 'General'} - {v.skills})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedAssistId(null)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Assign & Notify</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
