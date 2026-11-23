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
  ArcElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Shield,
  Users,
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Loader2,
  X,
  AlertCircle,
  MapPin,
  Eye,
  FileCheck2,
  SlidersHorizontal
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  // 5 Main Tabs (Priority 5)
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'assignments' | 'citizens' | 'volunteers' | 'reports'

  const [stats, setStats] = useState(null);
  const [adminDocs, setAdminDocs] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Regional Filters for Document Assignments
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterConstituency, setFilterConstituency] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Assignment / Reassignment Modal
  const [selectedDocForAssign, setSelectedDocForAssign] = useState(null);
  const [eligibleVolunteersData, setEligibleVolunteersData] = useState(null);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [assigningVolunteer, setAssigningVolunteer] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statRes, docRes, citRes, volRes, reqRes] = await Promise.all([
        API.get('/admin/statistics').catch(() => ({ data: null })),
        API.get('/admin/documents').catch(() => ({ data: [] })),
        API.get('/admin/citizens').catch(() => ({ data: [] })),
        API.get('/volunteers').catch(() => ({ data: [] })),
        API.get('/requests').catch(() => ({ data: [] }))
      ]);

      setStats(statRes.data);
      setAdminDocs(docRes.data || []);
      setCitizens(citRes.data || []);
      setVolunteers(volRes.data || []);
      setRequests(reqRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setLoading(false);
    }
  };

  // Open Assignment modal & fetch region-ranked volunteers
  const openAssignModal = async (doc) => {
    setSelectedDocForAssign(doc);
    setSelectedVolunteerId(doc.volunteer_id ? String(doc.volunteer_id) : '');
    setAssignError('');
    setAssignSuccess('');
    setLoadingEligible(true);

    try {
      const res = await API.get(`/admin/documents/${doc.document_id}/eligible-volunteers`);
      setEligibleVolunteersData(res.data);
      if (!doc.volunteer_id && res.data.volunteers?.length > 0) {
        setSelectedVolunteerId(String(res.data.volunteers[0].volunteer_id));
      }
    } catch (err) {
      console.error('Failed to load eligible volunteers:', err);
      setAssignError('Unable to load regional volunteer recommendations.');
    } finally {
      setLoadingEligible(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVolunteerId) {
      setAssignError('Please select a volunteer.');
      return;
    }

    setAssigningVolunteer(true);
    setAssignError('');
    try {
      await API.post('/admin/volunteer-assignments', {
        document_id: selectedDocForAssign.document_id,
        volunteer_id: parseInt(selectedVolunteerId)
      });

      setAssignSuccess('Assignment successfully saved in MySQL.');
      setAssigningVolunteer(false);

      // Refresh documents
      const refreshed = await API.get('/admin/documents');
      setAdminDocs(refreshed.data || []);

      setTimeout(() => {
        setSelectedDocForAssign(null);
        setAssignSuccess('');
      }, 1200);
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Failed to assign volunteer.');
      setAssigningVolunteer(false);
    }
  };

  // Distinct Filter Options
  const districtOptions = Array.from(new Set(adminDocs.map(d => d.district).filter(Boolean)));
  const constituencyOptions = Array.from(
    new Set(
      adminDocs
        .filter(d => !filterDistrict || d.district === filterDistrict)
        .map(d => d.constituency_name)
        .filter(Boolean)
    )
  );
  const areaOptions = Array.from(
    new Set(
      adminDocs
        .filter(d => !filterDistrict || d.district === filterDistrict)
        .map(d => d.area_name)
        .filter(Boolean)
    )
  );

  // Filtered Documents for Document Assignments table
  const filteredDocs = adminDocs.filter(d => {
    if (filterDistrict && d.district !== filterDistrict) return false;
    if (filterConstituency && d.constituency_name !== filterConstituency) return false;
    if (filterArea && d.area_name !== filterArea) return false;
    if (filterStatus) {
      if (filterStatus === 'Assigned' && !d.assigned_volunteer) return false;
      if (filterStatus === 'Pending Assignment' && d.assigned_volunteer) return false;
    }
    return true;
  });

  // Chart Data
  const statusCounts = {
    'Approved': adminDocs.filter(d => d.file_review_status === 'Reviewed – No Issues Found').length,
    'Pending Review': adminDocs.filter(d => d.file_review_status === 'Pending Review' || d.file_review_status === 'Under Review').length,
    'Correction Required': adminDocs.filter(d => d.file_review_status === 'Correction Required').length,
    'Pending Assignment': adminDocs.filter(d => !d.assigned_volunteer).length
  };

  const chartData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: ['#10b981', '#f59e0b', '#f43f5e', '#64748b']
      }
    ]
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-purple-400 tracking-wider">Administrator Console</span>
          <h1 className="text-2xl font-bold flex items-center gap-2 mt-0.5">
            <Shield className="w-6 h-6 text-purple-400" /> Admin Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Regional volunteer management, document review assignments, and system records.
          </p>
        </div>
        <Link
          to="/explorer"
          className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white border-none font-semibold px-4 py-2 rounded-xl text-xs"
        >
          Database Explorer
        </Link>
      </div>

      {/* 5 Main Navigation Tabs (Priority 5) */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Overview
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'assignments'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCheck2 className="w-4 h-4" /> Document Assignments ({adminDocs.length})
        </button>

        <button
          onClick={() => setActiveTab('citizens')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'citizens'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" /> Citizens ({citizens.length})
        </button>

        <button
          onClick={() => setActiveTab('volunteers')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'volunteers'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Volunteers ({volunteers.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'reports'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Reports
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-xl font-black text-blue-600 block">{citizens.length}</span>
              <span className="text-[11px] text-slate-500 font-semibold">Citizens</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-xl font-black text-indigo-600 block">{volunteers.length}</span>
              <span className="text-[11px] text-slate-500 font-semibold">Volunteers</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-xl font-black text-slate-800 block">{adminDocs.length}</span>
              <span className="text-[11px] text-slate-500 font-semibold">Total Documents</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-xl font-black text-amber-600 block">
                {adminDocs.filter(d => !d.assigned_volunteer).length}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">Pending Assign</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-xl font-black text-rose-600 block">
                {adminDocs.filter(d => d.file_review_status === 'Correction Required').length}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">Corrections</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <span className="text-xl font-black text-emerald-600 block">
                {adminDocs.filter(d => d.file_review_status === 'Reviewed – No Issues Found').length}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">Approved</span>
            </div>
          </div>

          {/* Clean Overview Visuals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4">
                Document Review Status Breakdown
              </h3>
              <div className="h-56 flex items-center justify-center">
                <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                Quick Regional Summary
              </h3>
              <div className="space-y-2 text-xs">
                {districtOptions.map(dist => {
                  const count = adminDocs.filter(d => d.district === dist).length;
                  return (
                    <div key={dist} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border">
                      <span className="font-semibold text-slate-800">{dist}</span>
                      <span className="text-purple-700 font-bold">{count} Documents</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENT ASSIGNMENTS (Priority 5 & Priority 2) */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {/* Regional Filters with Dependent Dropdowns */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-purple-600" /> Filter By:
            </span>

            {/* District Dropdown */}
            <select
              value={filterDistrict}
              onChange={e => {
                setFilterDistrict(e.target.value);
                setFilterConstituency('');
                setFilterArea('');
              }}
              className="border rounded-lg p-2 bg-white"
            >
              <option value="">All Districts</option>
              {districtOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Dependent Constituency Dropdown */}
            <select
              value={filterConstituency}
              onChange={e => setFilterConstituency(e.target.value)}
              className="border rounded-lg p-2 bg-white"
            >
              <option value="">All Constituencies</option>
              {constituencyOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Dependent Area Dropdown */}
            <select
              value={filterArea}
              onChange={e => setFilterArea(e.target.value)}
              className="border rounded-lg p-2 bg-white"
            >
              <option value="">All Service Areas</option>
              {areaOptions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Assignment Status Filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border rounded-lg p-2 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Pending Assignment">Pending Assignment</option>
            </select>

            {(filterDistrict || filterConstituency || filterArea || filterStatus) && (
              <button
                onClick={() => {
                  setFilterDistrict('');
                  setFilterConstituency('');
                  setFilterArea('');
                  setFilterStatus('');
                }}
                className="btn btn-outline btn-sm text-xs py-1.5 px-3 rounded-lg"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Document Assignments Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                    <th className="py-3.5 px-4">Citizen</th>
                    <th className="py-3.5 px-4">Region</th>
                    <th className="py-3.5 px-4">Document</th>
                    <th className="py-3.5 px-4">Volunteer</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-purple-600" /> Loading assignments...
                      </td>
                    </tr>
                  ) : filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400">
                        No documents match selected regional filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map(doc => (
                      <tr key={doc.document_id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {doc.citizen_name}
                          <span className="text-[10px] text-slate-400 block font-mono">ID: #{doc.citizen_id}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700 block">{doc.region}</span>
                          {doc.constituency_name && (
                            <span className="text-[10px] text-slate-400 block">{doc.constituency_name}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {doc.document_type}
                          <span className="text-[10px] text-slate-400 block font-mono">DOC#{doc.document_id}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {doc.assigned_volunteer ? (
                            <div>
                              <span className="font-semibold text-indigo-700 block">{doc.assigned_volunteer}</span>
                              <span className="text-[10px] text-slate-400 font-mono">VOL#{doc.volunteer_id}</span>
                            </div>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-200">
                              Not Assigned Yet
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">
                            {doc.file_review_status || 'Pending Review'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openAssignModal(doc)}
                            className="btn btn-sm btn-primary bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs"
                          >
                            {doc.assigned_volunteer ? 'Reassign' : 'Assign Volunteer'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CITIZENS DIRECTORY */}
      {activeTab === 'citizens' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800 text-sm">Citizens Directory ({citizens.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4">Location / Address</th>
                  <th className="py-3.5 px-4">Taluk / District</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {citizens.map(c => (
                  <tr key={c.citizen_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{c.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.email}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{c.mobile}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {[c.house_number, c.street].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {[c.taluk, c.district].filter(Boolean).join(', ') || 'Bengaluru'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: VOLUNTEERS ROSTER */}
      {activeTab === 'volunteers' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800 text-sm">Volunteer Roster & Regions ({volunteers.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4">Volunteer</th>
                  <th className="py-3.5 px-4">Email / Mobile</th>
                  <th className="py-3.5 px-4">Service Area</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-4">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {volunteers.map(v => (
                  <tr key={v.volunteer_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {v.name}
                      <span className="text-[10px] text-slate-400 block font-mono">VOL#{v.volunteer_id}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {v.email}
                      <span className="text-[10px] text-slate-400 block font-mono">{v.mobile}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-indigo-700">
                      {v.area_name || 'Area #' + (v.area_id || 'N/A')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        v.availability === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {v.availability}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-700 font-semibold">{v.verification_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 text-base mb-2">Electoral Revision Verification Reports</h2>
            <p className="text-xs text-slate-500 mb-6">Summary of requests and document reviews across constituencies.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border">
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Total Verification Requests</span>
                <span className="text-2xl font-black text-slate-800">{requests.length}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border">
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Active Volunteer Network</span>
                <span className="text-2xl font-black text-indigo-700">
                  {volunteers.filter(v => v.availability === 'Available').length} Available
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border">
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Documents Resolved</span>
                <span className="text-2xl font-black text-emerald-600">
                  {adminDocs.filter(d => d.file_review_status === 'Reviewed – No Issues Found').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGION-AWARE VOLUNTEER ASSIGNMENT MODAL (Priority 2 & Priority 5) */}
      {selectedDocForAssign && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg p-6 rounded-2xl bg-white shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-600" /> Assign Volunteer to Document
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Citizen: <strong>{selectedDocForAssign.citizen_name}</strong> • Region: <strong>{selectedDocForAssign.region}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedDocForAssign(null)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{assignSuccess}</span>
              </div>
            )}

            {assignError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{assignError}</span>
              </div>
            )}

            {loadingEligible ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-purple-600" /> Calculating regional volunteer matches...
              </div>
            ) : (
              <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Volunteer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedVolunteerId}
                    onChange={e => setSelectedVolunteerId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white font-medium focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">-- Choose an active volunteer --</option>
                    {eligibleVolunteersData?.volunteers?.map(v => (
                      <option key={v.volunteer_id} value={v.volunteer_id}>
                        {v.name} ({v.recommendation}) — Active assignments: {v.active_assignments_count}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Volunteers from the citizen's service locality and district are prioritized above.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedDocForAssign(null)}
                    className="btn btn-outline btn-sm text-xs px-4 py-2 border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigningVolunteer}
                    className="btn btn-primary btn-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
                  >
                    {assigningVolunteer ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Assigning...
                      </>
                    ) : (
                      'Save Assignment'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
