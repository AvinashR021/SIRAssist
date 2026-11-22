import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import ReadinessBadge from '../components/ReadinessBadge';
import {
  FileText,
  PlusCircle,
  HelpCircle,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  XCircle,
  Loader2,
  Info,
  ShieldAlert
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showCreateReqModal, setShowCreateReqModal] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Form 5: Verification Request States
  const [reqType, setReqType] = useState('Record Verification');
  const [voterRef, setVoterRef] = useState('');
  const [reqRemarks, setReqRemarks] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [reqFormErrors, setReqFormErrors] = useState({});
  const [submittingReq, setSubmittingReq] = useState(false);

  // Form 7: Assistance Request States
  const [assistType, setAssistType] = useState('Digital Assistance');
  const [assistPriority, setAssistPriority] = useState('Medium');
  const [assistArea, setAssistArea] = useState('Bengaluru South Zone');
  const [assistNotes, setAssistNotes] = useState('');
  const [assistFormErrors, setAssistFormErrors] = useState({});
  const [submittingAssist, setSubmittingAssist] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [reqRes, docRes, assistRes, uploadRes] = await Promise.all([
        API.get('/requests'),
        API.get('/documents'),
        API.get('/assistance'),
        API.get('/documents/my').catch(() => ({ data: [] }))
      ]);

      setRequests(reqRes.data);
      setDocuments(docRes.data);
      setAssistanceRequests(assistRes.data);
      setUploadedDocs(uploadRes.data || []);

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

  // Toggle Document Selection in Form 5
  const toggleDocSelection = (docId) => {
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(selectedDocIds.filter(id => id !== docId));
    } else {
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  };

  // Validate Verification Request
  const validateReqForm = () => {
    const errors = {};
    if (!reqType) errors.reqType = 'Please select a request type.';
    if (reqRemarks && reqRemarks.length > 500) {
      errors.reqRemarks = 'Remarks cannot exceed 500 characters.';
    }
    setReqFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Verification Request (Form 5)
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!validateReqForm()) return;

    setSubmittingReq(true);
    setSubmitSuccess(null);
    try {
      const res = await API.post('/requests', {
        request_type: reqType,
        remarks: reqRemarks.trim(),
        selected_document_ids: selectedDocIds
      });

      setShowCreateReqModal(false);
      setReqRemarks('');
      setVoterRef('');
      setSelectedDocIds([]);
      setSubmitSuccess({
        title: 'Verification Request Created!',
        message: `Your request #${res.data.request_id} (${reqType}) was successfully created with status SUBMITTED.`,
        requestId: res.data.request_id
      });
      fetchDashboardData();
    } catch (err) {
      setReqFormErrors({ general: err.response?.data?.error || 'Failed to create request.' });
    } finally {
      setSubmittingReq(false);
    }
  };

  // Validate Assistance Request (Form 7)
  const validateAssistForm = () => {
    const errors = {};
    if (!assistType) errors.assistType = 'Please select an assistance type.';
    if (!assistNotes.trim()) {
      errors.assistNotes = 'Please describe your assistance requirement.';
    } else if (assistNotes.trim().length < 5) {
      errors.assistNotes = 'Description must be at least 5 characters.';
    } else if (assistNotes.trim().length > 500) {
      errors.assistNotes = 'Description cannot exceed 500 characters.';
    }
    setAssistFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Assistance Request (Form 7)
  const handleCreateAssistance = async (e) => {
    e.preventDefault();
    if (!validateAssistForm()) return;

    setSubmittingAssist(true);
    try {
      await API.post('/assistance', {
        request_type: assistType,
        priority: assistPriority,
        notes: assistNotes.trim()
      });
      setShowAssistanceModal(false);
      setAssistNotes('');
      setSubmitSuccess({
        title: 'Volunteer Assistance Requested!',
        message: `Your community assistance request for '${assistType}' has been logged. An approved volunteer will be matched shortly.`,
        requestId: null
      });
      fetchDashboardData();
    } catch (err) {
      setAssistFormErrors({ general: err.response?.data?.error || 'Failed to submit assistance request.' });
    } finally {
      setSubmittingAssist(false);
    }
  };

  const pendingCount = requests.filter(r =>
    ['SUBMITTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW'].includes(r.current_status)
  ).length;
  const completedCount = requests.filter(r => r.current_status === 'RESOLVED').length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.name || user?.username || 'Citizen'}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track verification workflows, document readiness checklists, and volunteer support
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setReqFormErrors({});
              setSelectedDocIds(documents.map(d => d.document_id));
              setShowCreateReqModal(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <PlusCircle className="w-4 h-4" /> New Verification Request
          </button>
          <button
            onClick={() => {
              setAssistFormErrors({});
              setShowAssistanceModal(true);
            }}
            className="btn btn-outline btn-sm text-purple-700 border-purple-300 hover:bg-purple-50"
          >
            <HelpCircle className="w-4 h-4" /> Request Volunteer Help
          </button>
        </div>
      </div>

      {/* Success Banner if an action just occurred */}
      {submitSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-emerald-900">{submitSuccess.title}</h2>
              <p className="text-xs text-emerald-700 mt-0.5">{submitSuccess.message}</p>
              {submitSuccess.requestId && (
                <Link
                  to={`/requests/${submitSuccess.requestId}`}
                  className="text-xs font-bold text-emerald-800 underline mt-1.5 inline-block"
                >
                  View Request Details & Timeline →
                </Link>
              )}
            </div>
          </div>
          <button
            onClick={() => setSubmitSuccess(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Academic Disclaimer Notice */}
      <div className="disclaimer-banner">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <strong>Academic Process Notice:</strong> Requests initiated on SIRAssist are organizational preparation and assistance workflows. This system does not claim or constitute official submission to the Election Commission of India. Official filings must be performed through authorized portals (voters.eci.gov.in).
        </div>
      </div>

      {/* Action Required: Document Correction Alert */}
      {uploadedDocs.some(d => d.file_review_status === 'Correction Required') && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-sm block">Action Required: Volunteer Feedback on Uploaded Document(s)</span>
              One or more of your supporting documents need correction or a clearer image.
            </div>
          </div>
          <Link to="/documents" className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white border-none text-xs">
            View Feedback & Resubmit →
          </Link>
        </div>
      )}

      {/* Analytics KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card text-center p-3">
          <span className="text-2xl font-black text-blue-600 block">{requests.length}</span>
          <span className="text-[11px] text-slate-500 font-medium">Total Requests</span>
        </div>
        <div className="card text-center p-3">
          <span className="text-2xl font-black text-amber-600 block">{uploadedDocs.filter(d => d.file_review_status === 'Pending Review').length}</span>
          <span className="text-[11px] text-slate-500 font-medium">Docs In Review</span>
        </div>
        <div className="card text-center p-3">
          <span className="text-2xl font-black text-rose-600 block">{uploadedDocs.filter(d => d.file_review_status === 'Correction Required').length}</span>
          <span className="text-[11px] text-slate-500 font-medium">Corrections Needed</span>
        </div>
        <div className="card text-center p-3">
          <span className="text-2xl font-black text-emerald-600 block">{uploadedDocs.filter(d => d.file_review_status === 'Reviewed – No Issues Found').length}</span>
          <span className="text-[11px] text-slate-500 font-medium">Docs Reviewed</span>
        </div>
        <div className="card text-center p-3">
          <span className="text-2xl font-black text-purple-600 block">{assistanceRequests.length}</span>
          <span className="text-[11px] text-slate-500 font-medium">Volunteer Requests</span>
        </div>
      </div>

      {/* Document Readiness Checklist Widget (Form 6 Integration) */}
      {readiness && (
        <div className="card shadow-sm border-slate-200">
          <ReadinessBadge readiness={readiness} />
        </div>
      )}

      {/* My Verification Requests Table */}
      <div className="card shadow-sm border-slate-200">
        <div className="card-header">
          <h2 className="card-title text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> My Verification Requests
          </h2>
          <Link to="/documents" className="text-xs text-blue-600 font-semibold hover:underline">
            Manage Documents ({documents.length}) →
          </Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Request Type</th>
                <th>Submission Date</th>
                <th>Current Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading verification requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    No verification requests logged yet. Click "New Verification Request" above to begin.
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
                    <td className="text-xs text-slate-600 max-w-xs truncate">{req.remarks || '—'}</td>
                    <td>
                      <Link to={`/requests/${req.request_id}`} className="btn btn-outline btn-sm text-xs">
                        <Eye className="w-3.5 h-3.5" /> Details & Timeline
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM 5 MODAL: Create Verification Request */}
      {showCreateReqModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> New Verification Request (Form 5)
                </h3>
                <p className="text-[11px] text-slate-500">Initiate document verification and readiness analysis</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateReqModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {reqFormErrors.general && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4 border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{reqFormErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} noValidate className="space-y-4 text-xs">
              <div className="form-group mb-0">
                <label className="form-label">
                  Request Type <span className="req">*</span>
                </label>
                <select
                  value={reqType}
                  onChange={e => setReqType(e.target.value)}
                  className="form-select"
                >
                  <option value="Record Verification">Record Verification (Confirm existing electoral record)</option>
                  <option value="Correction Assistance">Correction Assistance (Correct name, age, or address)</option>
                  <option value="Missing Record Assistance">Missing Record Assistance (Unlisted / shifted citizen)</option>
                  <option value="Document Clarification">Document Clarification (Resolve identity query)</option>
                  <option value="General Assistance">General Assistance (General verification inquiry)</option>
                </select>
                <p className="form-hint">Determines checklist requirements pulled from the database.</p>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  Voter EPIC Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={voterRef}
                  onChange={e => setVoterRef(e.target.value)}
                  placeholder="e.g. KA/01/168/XXXX01 (Fictional / Masked)"
                  className="form-input font-mono text-xs"
                />
                <p className="form-hint">Reference only. Used for cross-referencing mock constituency records.</p>
              </div>

              {/* Associated Documents Selection */}
              <div className="form-group mb-0">
                <label className="form-label">
                  Attach Supporting Documents from Your Repository
                </label>
                {documents.length === 0 ? (
                  <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-800 text-[11px]">
                    No documents recorded yet. You can still submit the request; the system will mark required documents as <strong>Missing</strong> in your readiness checklist.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded border border-slate-200">
                    {documents.map(doc => (
                      <label key={doc.document_id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white rounded transition">
                        <input
                          type="checkbox"
                          checked={selectedDocIds.includes(doc.document_id)}
                          onChange={() => toggleDocSelection(doc.document_id)}
                          className="rounded text-blue-600"
                        />
                        <span className="font-semibold text-slate-800">{doc.document_type}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({doc.document_reference_masked})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarks / Description */}
              <div className="form-group mb-0">
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label mb-0">Remarks / Description</label>
                  <span className="text-[10px] text-slate-400">{reqRemarks.length} / 500 chars</span>
                </div>
                <textarea
                  rows="3"
                  maxLength="500"
                  value={reqRemarks}
                  onChange={e => setReqRemarks(e.target.value)}
                  placeholder="Describe your verification requirement or specify correction details..."
                  className={`form-textarea text-xs ${reqFormErrors.reqRemarks ? 'is-invalid' : ''}`}
                />
                {reqFormErrors.reqRemarks && (
                  <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{reqFormErrors.reqRemarks}</span>
                )}
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] text-slate-500">
                * Note: Submitting initiates a database transaction that generates an immutable Request ID and evaluates readiness against official guidelines.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateReqModal(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="btn btn-primary btn-sm px-4"
                >
                  {submittingReq ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting Request...
                    </>
                  ) : (
                    'Submit Verification Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM 7 MODAL: Request Volunteer Assistance */}
      {showAssistanceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" /> Request Community Volunteer Help (Form 7)
                </h3>
                <p className="text-[11px] text-slate-500">Connect with nearby verified volunteers for digital or physical guidance</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssistanceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {assistFormErrors.general && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4 border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{assistFormErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssistance} noValidate className="space-y-4 text-xs">
              <div className="form-group mb-0">
                <label className="form-label">
                  Assistance Type <span className="req">*</span>
                </label>
                <select
                  value={assistType}
                  onChange={e => setAssistType(e.target.value)}
                  className="form-select"
                >
                  <option value="Digital Assistance">Digital Assistance (Portal & Form Guidance)</option>
                  <option value="Form Filling">Form Filling (Assistance entering details)</option>
                  <option value="Doorstep Visit">Doorstep Visit (Senior Citizen / Mobility Impaired)</option>
                  <option value="Document Scan">Document Scan (Document check & formatting)</option>
                  <option value="Language Help">Language Help (Kannada / Regional Translation)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group mb-0">
                  <label className="form-label">Urgency Priority</label>
                  <select
                    value={assistPriority}
                    onChange={e => setAssistPriority(e.target.value)}
                    className="form-select"
                  >
                    <option value="Low">Low (General guidance)</option>
                    <option value="Medium">Medium (Standard)</option>
                    <option value="High">High (Senior Citizen / Critical Deadlines)</option>
                  </select>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Area / Zone</label>
                  <input
                    type="text"
                    value={assistArea}
                    onChange={e => setAssistArea(e.target.value)}
                    placeholder="e.g. Bengaluru South Zone"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group mb-0">
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label mb-0">
                    Notes & Special Needs <span className="req">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{assistNotes.length} / 500 chars</span>
                </div>
                <textarea
                  rows="3"
                  maxLength="500"
                  value={assistNotes}
                  onChange={e => {
                    setAssistNotes(e.target.value);
                    if (assistFormErrors.assistNotes) setAssistFormErrors({ ...assistFormErrors, assistNotes: '' });
                  }}
                  placeholder="State your exact assistance requirement (e.g. elderly citizen needing doorstep help with Kannada language)..."
                  className={`form-textarea text-xs ${assistFormErrors.assistNotes ? 'is-invalid' : ''}`}
                  required
                />
                {assistFormErrors.assistNotes && (
                  <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{assistFormErrors.assistNotes}</span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssistanceModal(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssist}
                  className="btn btn-primary btn-sm px-4 bg-purple-600 hover:bg-purple-700 border-none"
                >
                  {submittingAssist ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Logging Request...
                    </>
                  ) : (
                    'Submit Assistance Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
