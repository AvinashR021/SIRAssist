import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import {
  Users,
  CheckCircle,
  Clock,
  Edit3,
  Save,
  AlertCircle,
  XCircle,
  Loader2,
  FileText,
  Eye,
  CheckSquare,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldAlert,
  Send,
  History,
  CheckCircle2,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';

export default function VolunteerDashboard() {
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('doc_reviews'); // 'doc_reviews' | 'assistance_workload'

  // Document Review Queue States
  const [assignedDocs, setAssignedDocs] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [historyDocs, setHistoryDocs] = useState([]);
  const [reviewSubView, setReviewSubView] = useState('pending'); // 'pending' | 'history'
  const [docSummary, setDocSummary] = useState({ pending: 0, reviewed: 0, correction: 0, awaiting: 0 });
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Review & Preview Modal States
  const [selectedReviewDoc, setSelectedReviewDoc] = useState(null);
  const [docDetailData, setDocDetailData] = useState(null);
  const [activePreviewVersion, setActivePreviewVersion] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Review Form States
  const [reviewDecision, setReviewDecision] = useState('Reviewed – No Issues Found');
  const [issueCategory, setIssueCategory] = useState('Blurry or unreadable document');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [additionalDocReq, setAdditionalDocReq] = useState('');
  const [reviewFormError, setReviewFormError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Assistance Requests (Form 8 and Legacy Workload)
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [loadingAssistance, setLoadingAssistance] = useState(true);
  const [availability, setAvailability] = useState('Available');
  const [skills, setSkills] = useState('Digital Assistance, Form Filling');
  const [selectedAreaId, setSelectedAreaId] = useState('1');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchAssignedDocuments();
    fetchAssistanceData();
  }, []);

  const fetchAssignedDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await API.get('/volunteer/document-reviews');
      const docs = res.data.documents || [];
      const pending = res.data.pending || docs.filter(d => d.assignment_status === 'Active' && (d.file_review_status === 'Pending Review' || d.file_review_status === 'Under Review' || !d.review_id));
      const history = res.data.history || docs.filter(d => d.assignment_status === 'Completed' || d.file_review_status === 'Reviewed – No Issues Found' || Boolean(d.review_id));
      setAssignedDocs(docs);
      setPendingDocs(pending);
      setHistoryDocs(history);
      setDocSummary(res.data.summary || { pending: pending.length, reviewed: history.length, correction: 0, awaiting: 0 });
      setLoadingDocs(false);
    } catch (err) {
      console.error('Error fetching assigned document reviews:', err);
      setLoadingDocs(false);
    }
  };

  const fetchAssistanceData = async () => {
    try {
      setLoadingAssistance(true);
      const res = await API.get('/assistance');
      setAssistanceRequests(res.data || []);
      setLoadingAssistance(false);
    } catch (err) {
      console.error('Error fetching assistance requests:', err);
      setLoadingAssistance(false);
    }
  };

  const openReviewModal = async (doc) => {
    setSelectedReviewDoc(doc);
    setReviewFormError('');
    setReviewSuccessMsg('');
    setZoomLevel(1);
    setFeedbackMessage('');
    setAdditionalDocReq('');
    setReviewDecision('Reviewed – No Issues Found');
    setIssueCategory('Blurry or unreadable document');

    try {
      setLoadingDetail(true);
      const res = await API.get(`/volunteer/document-reviews/${doc.document_id}`);
      setDocDetailData(res.data);
      if (res.data.versions && res.data.versions.length > 0) {
        setActivePreviewVersion(res.data.versions[0]); // latest version by default
      }
      setLoadingDetail(false);
    } catch (err) {
      setReviewFormError(err.response?.data?.error || 'Failed to fetch document review details.');
      setLoadingDetail(false);
    }
  };

  const closeReviewModal = () => {
    setSelectedReviewDoc(null);
    setDocDetailData(null);
    setActivePreviewVersion(null);
  };

  // Submit Volunteer Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewFormError('');
    setReviewSuccessMsg('');

    if (['Correction Required', 'Unable to Review'].includes(reviewDecision)) {
      if (!issueCategory || issueCategory === 'N/A') {
        setReviewFormError('Please select a specific issue category.');
        return;
      }
      if (!feedbackMessage.trim() || feedbackMessage.trim().length < 5) {
        setReviewFormError('Constructive feedback is required so the citizen knows what to correct (min 5 characters).');
        return;
      }
    }

    if (reviewDecision === 'Additional Document Requested') {
      if (!additionalDocReq.trim() || additionalDocReq.trim().length < 5) {
        setReviewFormError('Please specify what additional document or information is needed.');
        return;
      }
    }

    setSubmittingReview(true);
    try {
      await API.post(`/volunteer/document-reviews/${selectedReviewDoc.document_id}/review`, {
        review_decision: reviewDecision,
        issue_category: ['Correction Required', 'Unable to Review'].includes(reviewDecision) ? issueCategory : 'N/A',
        feedback_message: feedbackMessage.trim() || null,
        additional_document_request: reviewDecision === 'Additional Document Requested' ? additionalDocReq.trim() : null
      });

      setReviewSuccessMsg('Review recorded successfully! Citizen has been notified.');
      fetchAssignedDocuments();
      setTimeout(() => {
        closeReviewModal();
      }, 1500);
    } catch (err) {
      setReviewFormError(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Legacy profile & assistance handling
  const handleSaveVolunteerProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    if (!skills.trim() || skills.trim().length < 3) {
      setProfileError('Please specify at least one skill (min 3 characters).');
      return;
    }
    setSavingProfile(true);
    try {
      await API.put('/volunteers/profile', {
        availability,
        skills: skills.trim(),
        area_id: parseInt(selectedAreaId)
      });
      setProfileMessage('Volunteer profile settings saved successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to update profile settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateStatus = async (assistanceId, status, newNotes = null) => {
    setUpdatingId(assistanceId);
    try {
      await API.put(`/assistance/${assistanceId}`, {
        status,
        volunteer_id: user.volunteer_id,
        notes: newNotes !== null ? newNotes : undefined
      });
      fetchAssistanceData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update assistance status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Reviewed – No Issues Found':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Reviewed – No Issues Found</span>;
      case 'Correction Required':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"><XCircle className="w-3.5 h-3.5 text-rose-600" /> Correction Required</span>;
      case 'Additional Document Requested':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200"><HelpCircle className="w-3.5 h-3.5 text-purple-600" /> Additional Document Requested</span>;
      case 'Unable to Review':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300"><AlertCircle className="w-3.5 h-3.5 text-slate-600" /> Unable to Review</span>;
      case 'Under Review':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"><Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Under Review</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review</span>;
    }
  };

  const activeAssigned = assistanceRequests.filter(a => a.volunteer_id === user?.volunteer_id);
  const pendingRequests = assistanceRequests.filter(a => a.status === 'PENDING');

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> Volunteer Manual Document Review & Assistance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conduct manual checklist quality reviews on assigned citizen documents, flag illegibility or missing pages, and assist electoral roll revision.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Volunteer Account:</span>
          <span className="font-mono bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded border border-indigo-200">
            VOL#{user?.volunteer_id || '1'} • {user?.username}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('doc_reviews')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'doc_reviews' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Document Review Queue ({assignedDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('assistance_workload')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'assistance_workload' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          General Assistance Tasks ({activeAssigned.length})
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: DOCUMENT REVIEW QUEUE (PHASE 3, 4, 5) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'doc_reviews' && (
        <div className="space-y-6">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 border-l-4 border-amber-500 bg-amber-50/30">
              <span className="text-xs text-amber-700 font-semibold uppercase tracking-wider block">Pending Reviews</span>
              <span className="text-3xl font-extrabold text-amber-800 mt-1 block">{docSummary.pending}</span>
              <span className="text-[11px] text-slate-500">Requires volunteer inspection</span>
            </div>
            <div className="card p-4 border-l-4 border-emerald-500 bg-emerald-50/30">
              <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider block">Reviewed Documents</span>
              <span className="text-3xl font-extrabold text-emerald-800 mt-1 block">{docSummary.reviewed}</span>
              <span className="text-[11px] text-slate-500">No issues found</span>
            </div>
            <div className="card p-4 border-l-4 border-rose-500 bg-rose-50/30">
              <span className="text-xs text-rose-700 font-semibold uppercase tracking-wider block">Correction Required</span>
              <span className="text-3xl font-extrabold text-rose-800 mt-1 block">{docSummary.correction}</span>
              <span className="text-[11px] text-slate-500">Feedback sent to citizen</span>
            </div>
            <div className="card p-4 border-l-4 border-purple-500 bg-purple-50/30">
              <span className="text-xs text-purple-700 font-semibold uppercase tracking-wider block">Awaiting Resubmission</span>
              <span className="text-3xl font-extrabold text-purple-800 mt-1 block">{docSummary.awaiting}</span>
              <span className="text-[11px] text-slate-500">Additional info requested</span>
            </div>
          </div>

          {/* Sub-View Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReviewSubView('pending')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  reviewSubView === 'pending'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Pending Reviews
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  reviewSubView === 'pending' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {pendingDocs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setReviewSubView('history')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  reviewSubView === 'history'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Review History
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  reviewSubView === 'history' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {historyDocs.length}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={fetchAssignedDocuments}
              className="btn btn-outline btn-sm text-xs py-1"
              disabled={loadingDocs}
            >
              Refresh Queue
            </button>
          </div>

          {/* Table Container for Selected Sub-View */}
          <div className="card shadow-sm border-slate-200 overflow-hidden">
            <div className="card-header flex justify-between items-center">
              <div>
                <h2 className="card-title text-base flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                  {reviewSubView === 'pending' ? 'Pending Reviews Queue' : 'Historical Document Reviews'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {reviewSubView === 'pending'
                    ? 'Documents with active assignments requiring your quality review and checklist verification.'
                    : 'Completed and previous reviews performed by you (Read-Only archives).'}
                </p>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Doc #</th>
                    <th>Citizen Name</th>
                    <th>Request ID</th>
                    <th>Document Type</th>
                    <th>Version</th>
                    <th>Upload Date</th>
                    <th>Review Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDocs ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-indigo-600" /> Loading reviews...
                      </td>
                    </tr>
                  ) : (reviewSubView === 'pending' ? pendingDocs : historyDocs).length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-400">
                        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">
                          {reviewSubView === 'pending'
                            ? 'No documents currently pending review in your queue.'
                            : 'No completed document reviews recorded in your history yet.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    (reviewSubView === 'pending' ? pendingDocs : historyDocs).map(doc => {
                      const isPending = doc.file_review_status === 'Pending Review' && doc.assignment_status === 'Active';
                      return (
                        <tr
                          key={doc.document_id}
                          className={isPending ? 'bg-amber-50/40 font-medium' : ''}
                        >
                          <td className="font-mono text-xs font-bold text-slate-500">
                            DOC#{doc.document_id}
                          </td>
                          <td>
                            <div className="font-semibold text-slate-800 text-xs">{doc.citizen_name}</div>
                            {doc.citizen_email && (
                              <div className="text-[10px] text-slate-400">{doc.citizen_email}</div>
                            )}
                          </td>
                          <td className="font-mono text-xs">
                            {doc.request_id ? (
                              <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-bold">
                                #VR100{doc.request_id}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td>
                            <div className="text-xs font-semibold text-slate-800">{doc.document_type}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{doc.original_filename}</div>
                          </td>
                          <td>
                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              v{doc.current_version || 1}
                            </span>
                          </td>
                          <td className="text-xs text-slate-500">
                            {doc.file_uploaded_at ? new Date(doc.file_uploaded_at).toLocaleDateString() : (doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—')}
                          </td>
                          <td>
                            {getStatusBadge(doc.file_review_status)}
                          </td>
                          <td className="text-right whitespace-nowrap">
                            <button
                              onClick={() => openReviewModal(doc)}
                              className={`btn btn-sm text-xs py-1 px-3 ${
                                isPending
                                  ? 'btn-primary bg-indigo-600 hover:bg-indigo-700 border-none'
                                  : 'btn-outline border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {isPending ? 'Review Document' : 'View / History'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: GENERAL ASSISTANCE WORKLOAD & PROFILE (LEGACY PRESERVED) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'assistance_workload' && (
        <div className="space-y-6">
          {/* Profile Form 8 */}
          <div className="card shadow-sm border-slate-200">
            <div className="card-header">
              <h2 className="card-title text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" /> Volunteer Profile & Availability Settings (Form 8)
              </h2>
              <span className="badge badge-resolved">Verified Volunteer</span>
            </div>

            {profileMessage && (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg mb-4 border border-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileMessage}</span>
              </div>
            )}

            {profileError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4 border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveVolunteerProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label font-semibold">Current Availability</label>
                  <select
                    value={availability}
                    onChange={e => setAvailability(e.target.value)}
                    className="form-select"
                  >
                    <option value="Available">Available for Requests</option>
                    <option value="Busy">Busy (Engaged with citizen)</option>
                    <option value="Unavailable">Unavailable (Off-duty)</option>
                  </select>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label font-semibold">Assigned Operational Area</label>
                  <select
                    value={selectedAreaId}
                    onChange={e => setSelectedAreaId(e.target.value)}
                    className="form-select"
                  >
                    <option value="1">Bengaluru South Zone (560040)</option>
                    <option value="2">Bengaluru East Tech Zone (560103)</option>
                    <option value="3">Bengaluru North Zone (560024)</option>
                    <option value="4">Mysuru City Central (570023)</option>
                  </select>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label font-semibold">Skills & Specializations</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn btn-primary btn-sm bg-indigo-600 hover:bg-indigo-700 border-none"
                >
                  {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Volunteer Settings
                </button>
              </div>
            </form>
          </div>

          {/* Active Workload */}
          <div className="card shadow-sm border-slate-200">
            <h2 className="card-title text-base mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" /> Active General Assistance Workload ({activeAssigned.length})
            </h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Citizen Name</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAssigned.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-slate-400 text-xs">No active general assistance tasks.</td>
                    </tr>
                  ) : (
                    activeAssigned.map(a => (
                      <tr key={a.assistance_id}>
                        <td className="font-mono text-xs">#{a.assistance_id}</td>
                        <td className="font-semibold text-xs">{a.citizen_name}</td>
                        <td className="text-xs text-slate-600">{a.citizen_mobile}</td>
                        <td className="text-xs">{a.request_type}</td>
                        <td>
                          <span className="badge badge-warning text-[10px]">{a.priority}</span>
                        </td>
                        <td>
                          <span className="badge badge-info text-[10px]">{a.status}</span>
                        </td>
                        <td className="space-x-1">
                          {a.status === 'ASSIGNED' && (
                            <button
                              onClick={() => handleUpdateStatus(a.assistance_id, 'IN_PROGRESS')}
                              className="btn btn-sm btn-outline text-blue-600 border-blue-200 text-xs py-0.5"
                            >
                              Start
                            </button>
                          )}
                          {a.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleUpdateStatus(a.assistance_id, 'COMPLETED')}
                              className="btn btn-sm btn-primary bg-emerald-600 hover:bg-emerald-700 border-none text-xs py-0.5"
                            >
                              Complete
                            </button>
                          )}
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

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: MANUAL DOCUMENT REVIEW & PREVIEW WORKFLOW (PHASE 4 & 5) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {selectedReviewDoc && (
        <div className="modal-overlay">
          <div className="modal-content max-w-5xl max-h-[94vh] flex flex-col p-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                  Manual Review: {selectedReviewDoc.document_type} (DOC#{selectedReviewDoc.document_id})
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>Citizen: <strong>{selectedReviewDoc.citizen_name}</strong></span>
                  <span>•</span>
                  <span>Version: <strong>v{selectedReviewDoc.current_version}</strong></span>
                  <span>•</span>
                  <span>Current: {getStatusBadge(selectedReviewDoc.file_review_status)}</span>
                </div>
              </div>
              <button
                onClick={closeReviewModal}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            {/* Notification messages */}
            {reviewSuccessMsg && (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-3 border-b border-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{reviewSuccessMsg}</span>
              </div>
            )}
            {reviewFormError && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 border-b border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{reviewFormError}</span>
              </div>
            )}

            {/* Two-Column Review Layout */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* Left Column: Secure Document File Preview */}
              <div className="md:col-span-7 p-4 bg-slate-100 flex flex-col border-r border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Preview: Version {activePreviewVersion?.version_number || selectedReviewDoc.current_version}
                    </span>
                    {activePreviewVersion && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({activePreviewVersion.original_filename})
                      </span>
                    )}
                  </div>

                  {/* Zoom controls */}
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.2))}
                      className="p-1 hover:text-indigo-600"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono px-1">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                      className="p-1 hover:text-indigo-600"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="p-1 hover:text-indigo-600 ml-1"
                      title="Reset Zoom"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Preview Frame */}
                {loadingDetail ? (
                  <div className="flex-1 min-h-[380px] flex items-center justify-center bg-white rounded border border-slate-200 text-xs text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" /> Loading document file...
                  </div>
                ) : activePreviewVersion ? (
                  <div className="flex-1 bg-white rounded-lg border border-slate-300 overflow-auto min-h-[380px] max-h-[520px] flex items-center justify-center p-2 relative shadow-inner">
                    {activePreviewVersion.mime_type === 'application/pdf' ? (
                      <iframe
                        src={`/api/documents/${selectedReviewDoc.document_id}/versions/${activePreviewVersion.version_id}/file`}
                        title="PDF Document Preview"
                        className="w-full h-full min-h-[480px] border-0 rounded"
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                      />
                    ) : (
                      <img
                        src={`/api/documents/${selectedReviewDoc.document_id}/versions/${activePreviewVersion.version_id}/file`}
                        alt="Document Preview"
                        className="max-w-full max-h-full object-contain transition-transform"
                        style={{ transform: `scale(${zoomLevel})` }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex-1 min-h-[380px] flex items-center justify-center bg-white rounded border border-slate-200 text-xs text-slate-400">
                    No file available for preview.
                  </div>
                )}

                {/* File Metadata */}
                <div className="mt-2 text-[11px] text-slate-500 flex justify-between items-center">
                  <span>MIME: <code>{activePreviewVersion?.mime_type || '—'}</code></span>
                  <span>Size: {activePreviewVersion?.file_size_bytes ? (activePreviewVersion.file_size_bytes / 1024).toFixed(1) + ' KB' : '—'}</span>
                  <span>Uploaded: {activePreviewVersion?.uploaded_at ? new Date(activePreviewVersion.uploaded_at).toLocaleString() : '—'}</span>
                </div>
              </div>

              {/* Right Column: Review Form & History */}
              <div className="md:col-span-5 p-4 space-y-4 bg-white overflow-y-auto max-h-[600px]">
                {/* Document Information Summary */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-700 flex justify-between">
                    <span>Document Metadata</span>
                    <span className="font-mono text-indigo-700">DOC#{selectedReviewDoc.document_id}</span>
                  </div>
                  <div><strong>Citizen:</strong> {selectedReviewDoc.citizen_name}</div>
                  <div><strong>Type:</strong> {selectedReviewDoc.document_type}</div>
                  {selectedReviewDoc.request_id && (
                    <div><strong>Request Link:</strong> #VR100{selectedReviewDoc.request_id}</div>
                  )}
                  {selectedReviewDoc.description && (
                    <div className="text-[11px] text-slate-600">
                      <strong>Citizen Note:</strong> "{selectedReviewDoc.description}"
                    </div>
                  )}
                </div>

                {/* Version Selector if multiple versions exist */}
                {docDetailData?.versions && docDetailData.versions.length > 1 && (
                  <div>
                    <label className="form-label font-bold text-xs">Switch Version to Inspect:</label>
                    <div className="flex gap-2">
                      {docDetailData.versions.map(v => (
                        <button
                          key={v.version_id}
                          type="button"
                          onClick={() => setActivePreviewVersion(v)}
                          className={`btn btn-sm text-xs py-1 px-2.5 ${
                            activePreviewVersion?.version_id === v.version_id
                              ? 'btn-primary bg-indigo-600 border-none'
                              : 'btn-outline border-slate-200'
                          }`}
                        >
                          v{v.version_number}
                          {v.version_number === selectedReviewDoc.current_version && ' (Latest)'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Review Form (Form Phase 5) or Read-Only Completed Summary */}
                {docDetailData?.is_read_only ? (
                  <div className="space-y-3 text-xs border-t border-slate-100 pt-3">
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-950 block">Review Completed (Read-Only Mode)</span>
                        <span className="text-[11px] text-emerald-800">
                          This document review has been recorded and finalized. Further modifications are locked for audit integrity.
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-700 flex justify-between items-center">
                        <span>Latest Evaluation On Record</span>
                        <span className="text-[10px] text-slate-400">
                          v{activePreviewVersion?.version_number || selectedReviewDoc.current_version}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[11px]">Decision:</span>
                        <span className="font-semibold text-slate-800">
                          {activePreviewVersion?.review_decision || selectedReviewDoc.review_decision || selectedReviewDoc.file_review_status}
                        </span>
                      </div>

                      {activePreviewVersion?.issue_category && activePreviewVersion.issue_category !== 'N/A' && (
                        <div>
                          <span className="text-slate-500 block text-[11px]">Issue Category:</span>
                          <span className="font-semibold text-rose-700">{activePreviewVersion.issue_category}</span>
                        </div>
                      )}

                      {activePreviewVersion?.feedback_message && (
                        <div>
                          <span className="text-slate-500 block text-[11px]">Volunteer Feedback:</span>
                          <p className="bg-white p-2 rounded border border-slate-200 text-slate-700 text-xs mt-0.5">
                            {activePreviewVersion.feedback_message}
                          </p>
                        </div>
                      )}

                      {activePreviewVersion?.additional_document_request && (
                        <div>
                          <span className="text-slate-500 block text-[11px]">Additional Document Requested:</span>
                          <p className="bg-white p-2 rounded border border-slate-200 text-purple-800 text-xs mt-0.5">
                            {activePreviewVersion.additional_document_request}
                          </p>
                        </div>
                      )}

                      {activePreviewVersion?.reviewed_at && (
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                          Reviewed on {new Date(activePreviewVersion.reviewed_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                <form onSubmit={handleSubmitReview} className="space-y-3 text-xs border-t border-slate-100 pt-3">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-indigo-600" />
                    Submit Review Decision for Version {selectedReviewDoc.current_version}
                  </div>

                  {/* 1. Review Decision */}
                  <div>
                    <label className="form-label font-semibold">
                      Review Decision <span className="req">*</span>
                    </label>
                    <select
                      value={reviewDecision}
                      onChange={e => setReviewDecision(e.target.value)}
                      className="form-select font-semibold"
                    >
                      <option value="Reviewed – No Issues Found">Reviewed – No Issues Found (Meets Checklist)</option>
                      <option value="Correction Required">Correction Required (Resubmission Needed)</option>
                      <option value="Additional Document Requested">Additional Document Requested</option>
                      <option value="Unable to Review">Unable to Review (File Unreadable / Corrupted)</option>
                    </select>
                    <p className="form-hint">
                      Select <strong>"Reviewed – No Issues Found"</strong> if the file is clear, readable, and matches requirements.
                    </p>
                  </div>

                  {/* 2. Issue Category (conditional) */}
                  {['Correction Required', 'Unable to Review'].includes(reviewDecision) && (
                    <div>
                      <label className="form-label font-semibold">
                        Issue Category <span className="req">*</span>
                      </label>
                      <select
                        value={issueCategory}
                        onChange={e => setIssueCategory(e.target.value)}
                        className="form-select text-rose-800 font-semibold"
                        required
                      >
                        <option value="Blurry or unreadable document">Blurry or unreadable document</option>
                        <option value="Incomplete document">Incomplete document (cut off edges)</option>
                        <option value="Incorrect document type">Incorrect document type (wrong proof submitted)</option>
                        <option value="Missing page">Missing page (e.g. back side missing)</option>
                        <option value="File cannot be opened">File cannot be opened or is corrupted</option>
                        <option value="Other issue">Other quality issue</option>
                      </select>
                    </div>
                  )}

                  {/* 3. Feedback Message (mandatory if correction required) */}
                  {['Correction Required', 'Unable to Review'].includes(reviewDecision) && (
                    <div>
                      <label className="form-label font-semibold">
                        Detailed Guidance for Citizen <span className="req">*</span>
                      </label>
                      <textarea
                        value={feedbackMessage}
                        onChange={e => setFeedbackMessage(e.target.value)}
                        placeholder="e.g. The uploaded document scan is blurry. Please upload a clear photo showing the full page and address clearly."
                        className="form-textarea text-xs"
                        rows="3"
                        maxLength="1000"
                        required
                      />
                      <span className="text-[10px] text-slate-400 block text-right">{feedbackMessage.length}/1000</span>
                    </div>
                  )}

                  {/* 4. Additional Document Request */}
                  {reviewDecision === 'Additional Document Requested' && (
                    <div>
                      <label className="form-label font-semibold">
                        Describe What Additional Document is Needed <span className="req">*</span>
                      </label>
                      <textarea
                        value={additionalDocReq}
                        onChange={e => setAdditionalDocReq(e.target.value)}
                        placeholder="e.g. Please provide a municipal water tax receipt or registered lease deed to verify address in Ward 168."
                        className="form-textarea text-xs"
                        rows="3"
                        maxLength="1000"
                        required
                      />
                    </div>
                  )}

                  {/* Optional note for Reviewed - No issues */}
                  {reviewDecision === 'Reviewed – No Issues Found' && (
                    <div>
                      <label className="form-label font-semibold">Reviewer Notes (Optional)</label>
                      <textarea
                        value={feedbackMessage}
                        onChange={e => setFeedbackMessage(e.target.value)}
                        placeholder="e.g. Document image is clear and matches citizen name and ward address."
                        className="form-textarea text-xs"
                        rows="2"
                        maxLength="500"
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn btn-primary btn-sm w-full bg-indigo-600 hover:bg-indigo-700 border-none flex items-center justify-center gap-2 py-2"
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Recording Review & Dispatching Notification...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Finalize Review & Notify Citizen
                        </>
                      )}
                    </button>
                  </div>
                </form>
                )}

                {/* Prior Review History Section */}
                {docDetailData?.versions && docDetailData.versions.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <h5 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1">
                      <History className="w-3.5 h-3.5" /> Previous Review History
                    </h5>
                    <div className="space-y-2">
                      {docDetailData.versions.map(v => (
                        <div key={v.version_id} className="bg-slate-50 p-2 rounded text-[11px] border border-slate-200">
                          <div className="flex justify-between font-semibold text-slate-700">
                            <span>Version {v.version_number}</span>
                            <span>{v.review_decision || 'Pending Review'}</span>
                          </div>
                          {v.feedback_message && (
                            <p className="text-slate-600 italic mt-0.5">"{v.feedback_message}"</p>
                          )}
                          {v.reviewed_at && (
                            <span className="text-[10px] text-slate-400 block mt-1">
                              Reviewed on {new Date(v.reviewed_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
              <span className="text-slate-500">
                Logged in as <strong>VOL#{user?.volunteer_id}</strong> • Enforcing Role-Based Access Control
              </span>
              <button
                type="button"
                onClick={closeReviewModal}
                className="btn btn-outline btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
