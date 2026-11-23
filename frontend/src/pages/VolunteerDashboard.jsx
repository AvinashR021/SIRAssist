import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  Loader2,
  X,
  History,
  User,
  Bell,
  MapPin,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

export default function VolunteerDashboard() {
  const { user } = useContext(AuthContext);

  // 4 Main Sections (Priority 3)
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'history' | 'notifications' | 'profile'

  // Document lists
  const [assignedDocs, setAssignedDocs] = useState([]);
  const [historyDocs, setHistoryDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Notifications list
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Review Modal State
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docDetail, setDocDetail] = useState(null);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Simple Review Form States
  const [reviewResult, setReviewResult] = useState('No Issues Found');
  const [reason, setReason] = useState('Blurry document');
  const [messageToCitizen, setMessageToCitizen] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  useEffect(() => {
    fetchAssignedDocuments();
    fetchProfile();
  }, []);

  const fetchAssignedDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await API.get('/volunteer/document-reviews');
      const docs = res.data.documents || [];
      const pending = res.data.pending || docs.filter(
        d => d.assignment_status === 'Active' &&
        (d.file_review_status === 'Pending Review' || d.file_review_status === 'Under Review' || !d.review_id)
      );
      const history = res.data.history || docs.filter(
        d => d.assignment_status === 'Completed' ||
        d.file_review_status === 'Reviewed – No Issues Found' ||
        Boolean(d.review_id)
      );
      setAssignedDocs(pending);
      setHistoryDocs(history);
      setLoadingDocs(false);
    } catch (err) {
      console.error('Failed to load volunteer documents:', err);
      setLoadingDocs(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await API.get('/auth/me');
      setProfileData(res.data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await API.get('/notifications');
      setNotifications(res.data || []);
      setLoadingNotifs(false);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setLoadingNotifs(false);
    }
  };

  const openReviewModal = async (doc) => {
    setSelectedDoc(doc);
    setReviewError('');
    setReviewSuccessMsg('');
    setMessageToCitizen('');
    setReviewResult('No Issues Found');
    setReason('Blurry document');
    setZoomLevel(1);

    try {
      setLoadingDetail(true);
      const res = await API.get(`/volunteer/document-reviews/${doc.document_id}`);
      setDocDetail(res.data);
      if (res.data.versions && res.data.versions.length > 0) {
        setPreviewVersion(res.data.versions[0]);
      }
      setLoadingDetail(false);
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to open document preview.');
      setLoadingDetail(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');

    if (reviewResult !== 'No Issues Found' && !messageToCitizen.trim()) {
      setReviewError('Please provide a short explanation message for the citizen.');
      return;
    }

    setSubmittingReview(true);
    try {
      await API.post(`/volunteer/document-reviews/${selectedDoc.document_id}/review`, {
        review_decision: reviewResult,
        issue_category: reviewResult !== 'No Issues Found' ? reason : 'N/A',
        feedback_message: messageToCitizen.trim() || 'Document reviewed and approved.',
        additional_document_request: reviewResult === 'More Information Needed' ? messageToCitizen.trim() : null
      });

      setReviewSuccessMsg('Review recorded successfully. The citizen has been notified.');
      setSubmittingReview(false);

      // Refresh queues
      await fetchAssignedDocuments();

      setTimeout(() => {
        setSelectedDoc(null);
        setDocDetail(null);
        setReviewSuccessMsg('');
      }, 1500);
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to submit review.');
      setSubmittingReview(false);
    }
  };

  const isReadOnlyReview = Boolean(
    docDetail?.is_read_only ||
    selectedDoc?.assignment_status === 'Completed' ||
    (docDetail?.versions?.[0]?.review_id && selectedDoc?.file_review_status === 'Reviewed – No Issues Found')
  );

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Volunteer Review Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review assigned citizen documents from your geographical service region.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Logged in as VOL#{user?.volunteer_id}
          </span>
        </div>
      </div>

      {/* 4 Main Section Tabs (Priority 3) */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm text-sm font-semibold">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'assigned'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Assigned Documents ({assignedDocs.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" /> Review History ({historyDocs.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('notifications');
            fetchNotifications();
          }}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'notifications'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell className="w-4 h-4" /> Notifications
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" /> My Profile
        </button>
      </div>

      {/* SECTION 1: ASSIGNED DOCUMENTS */}
      {activeTab === 'assigned' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800 text-sm">
              Documents Requiring Review ({assignedDocs.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4">Citizen</th>
                  <th className="py-3.5 px-4">Document</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingDocs ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-indigo-600" /> Loading assignments...
                    </td>
                  </tr>
                ) : assignedDocs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-400">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700 text-sm">All caught up!</p>
                      <p className="text-xs text-slate-500 mt-1">No documents pending review in your region.</p>
                    </td>
                  </tr>
                ) : (
                  assignedDocs.map(doc => (
                    <tr key={doc.document_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {doc.citizen_name || 'Citizen'}
                        <span className="text-[10px] text-slate-400 block font-normal">{doc.citizen_email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{doc.document_type}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          DOC#{doc.document_id} • Version {doc.current_version || 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5" /> Pending Review
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openReviewModal(doc)}
                          className="btn btn-primary btn-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs"
                        >
                          Review Document
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

      {/* SECTION 2: REVIEW HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800 text-sm">
              Previously Reviewed Documents ({historyDocs.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4">Citizen</th>
                  <th className="py-3.5 px-4">Document</th>
                  <th className="py-3.5 px-4">Review Result</th>
                  <th className="py-3.5 px-4">Feedback / Notes</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyDocs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-slate-400">
                      No completed reviews in history yet.
                    </td>
                  </tr>
                ) : (
                  historyDocs.map(doc => (
                    <tr key={doc.document_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {doc.citizen_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{doc.document_type}</div>
                        <span className="text-[10px] text-slate-400 font-mono">DOC#{doc.document_id}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">
                          {doc.review_decision || doc.file_review_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-slate-600 truncate">
                        {doc.feedback_message || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openReviewModal(doc)}
                          className="btn btn-outline btn-sm text-xs py-1 px-2.5 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
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

      {/* SECTION 3: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" /> Notifications & Alerts
          </h2>
          {loadingNotifs ? (
            <div className="text-center py-8 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-indigo-600" /> Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-8">No notifications received.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.notification_id} className="p-3 border rounded-xl bg-slate-50/50 text-xs">
                  <div className="flex justify-between items-center font-semibold text-slate-800 mb-1">
                    <span>{n.title || 'System Notification'}</span>
                    <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-600">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 max-w-xl">
          <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" /> Volunteer Profile
          </h2>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Volunteer ID</span>
              <span className="font-mono font-bold text-slate-800">VOL#{user?.volunteer_id}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Username / Email</span>
              <span className="font-semibold text-slate-800">{user?.username} ({user?.email})</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Service Region</span>
              <span className="font-semibold text-indigo-700">Bengaluru South Zone (Area #1)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
              <span className="font-semibold text-emerald-700">Approved & Active</span>
            </div>
          </div>
        </div>
      )}

      {/* SIMPLE REVIEW MODAL (Priority 3) */}
      {selectedDoc && (
        <div className="modal-overlay">
          <div className="modal-content max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Review Document: {selectedDoc.document_type}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>Citizen: <strong>{selectedDoc.citizen_name || docDetail?.citizen_name || 'Citizen'}</strong></span>
                  <span>•</span>
                  <span>Version: <strong>v{selectedDoc.current_version || 1}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* Left Column: Document File Preview */}
              <div className="md:col-span-7 p-4 bg-slate-100 flex flex-col border-r border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Preview: Version {previewVersion?.version_number || 1}
                  </span>
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.2))}
                      className="p-1 hover:text-indigo-600"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono px-1">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                      className="p-1 hover:text-indigo-600"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="p-1 hover:text-indigo-600 ml-1"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {loadingDetail ? (
                  <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-slate-200 min-h-[350px]">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : previewVersion ? (
                  <div className="flex-1 bg-white rounded-xl border border-slate-300 overflow-auto min-h-[350px] max-h-[500px] flex items-center justify-center p-2 relative">
                    {previewVersion.mime_type === 'application/pdf' ? (
                      <iframe
                        src={`/api/documents/${selectedDoc.document_id}/versions/${previewVersion.version_id}/file`}
                        title="PDF Document Preview"
                        className="w-full h-full min-h-[460px] border-0 rounded"
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                      />
                    ) : (
                      <img
                        src={`/api/documents/${selectedDoc.document_id}/versions/${previewVersion.version_id}/file`}
                        alt="Document Preview"
                        className="max-w-full max-h-full object-contain transition-transform"
                        style={{ transform: `scale(${zoomLevel})` }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-white rounded-xl border text-xs text-slate-400 p-8">
                    File unavailable.
                  </div>
                )}
              </div>

              {/* Right Column: Review Form or Read-Only Notice */}
              <div className="md:col-span-5 p-5 bg-white space-y-4 overflow-y-auto max-h-[560px] text-xs">
                {reviewSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{reviewSuccessMsg}</span>
                  </div>
                )}

                {reviewError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{reviewError}</span>
                  </div>
                )}

                {isReadOnlyReview ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">Review Completed (Read-Only)</span>
                    <p className="text-slate-600 text-xs">
                      This document version has already been finalized.
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="text-[11px] font-semibold text-slate-500 block">Recorded Decision:</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {docDetail?.versions?.[0]?.review_decision || selectedDoc?.file_review_status}
                      </span>
                      {docDetail?.versions?.[0]?.feedback_message && (
                        <p className="text-slate-600 italic mt-1 bg-white p-2 rounded border">
                          "{docDetail?.versions?.[0]?.feedback_message}"
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* SIMPLE REVIEW FORM (Priority 3) */
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">
                        Review Result <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={reviewResult}
                        onChange={e => setReviewResult(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="No Issues Found">No Issues Found (Approve Document)</option>
                        <option value="Correction Needed">Correction Needed (Citizen must resubmit)</option>
                        <option value="More Information Needed">More Information Needed</option>
                        <option value="Unable to Review">Unable to Review</option>
                      </select>
                    </div>

                    {/* Reason - only when necessary */}
                    {reviewResult !== 'No Issues Found' && (
                      <div>
                        <label className="block font-bold text-slate-800 mb-1.5">
                          Reason for Issue <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={reason}
                          onChange={e => setReason(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white"
                        >
                          <option value="Blurry document">Blurry document</option>
                          <option value="Incomplete document">Incomplete document</option>
                          <option value="Wrong document">Wrong document</option>
                          <option value="Missing page">Missing page</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}

                    {/* Message to Citizen */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">
                        Message to Citizen {reviewResult !== 'No Issues Found' && <span className="text-rose-500">*</span>}
                      </label>
                      <textarea
                        rows="3"
                        value={messageToCitizen}
                        onChange={e => setMessageToCitizen(e.target.value)}
                        placeholder={
                          reviewResult === 'No Issues Found'
                            ? 'Optional note for citizen (e.g. Document image is clear and verified).'
                            : 'State clearly what the citizen needs to fix or upload...'
                        }
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500"
                        required={reviewResult !== 'No Issues Found'}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Submitting Review...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Submit Review
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
              <span className="text-slate-500">SIRAssist Volunteer Portal</span>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="btn btn-outline btn-sm text-xs px-3 py-1 rounded-lg"
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
