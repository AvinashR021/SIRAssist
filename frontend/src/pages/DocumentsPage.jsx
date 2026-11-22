import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import {
  FileText,
  UploadCloud,
  Eye,
  RefreshCw,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Loader2,
  Calendar,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  FileCheck2,
  Trash2,
  PlusCircle,
  ExternalLink
} from 'lucide-react';

export default function DocumentsPage() {
  const [searchParams] = useSearchParams();
  const highlightedDocId = searchParams.get('docId');

  const [activeTab, setActiveTab] = useState('uploads'); // 'uploads' | 'metadata'
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [legacyDocs, setLegacyDocs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload Form Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState('Address Proof (Utility Bill / Rent Agreement)');
  const [selectedReqId, setSelectedReqId] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Resubmit Modal
  const [resubmitDoc, setResubmitDoc] = useState(null);
  const [resubmitFile, setResubmitFile] = useState(null);
  const [resubmitError, setResubmitError] = useState('');
  const [resubmitting, setResubmitting] = useState(false);

  // Preview & History Modal
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [historyDoc, setHistoryDoc] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  // Legacy Metadata Form
  const [showAddLegacyModal, setShowAddLegacyModal] = useState(false);
  const [legacyDocType, setLegacyDocType] = useState('Aadhaar (Masked)');
  const [legacyDocRef, setLegacyDocRef] = useState('');
  const [legacyIssueDate, setLegacyIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [legacyError, setLegacyError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [uploadRes, legacyRes, reqRes] = await Promise.all([
        API.get('/documents/my'),
        API.get('/documents'),
        API.get('/requests')
      ]);
      setUploadedDocs(uploadRes.data || []);
      setLegacyDocs(legacyRes.data || []);
      setRequests(reqRes.data || []);
      setLoading(false);

      if (highlightedDocId) {
        openDocumentDetail(highlightedDocId);
      }
    } catch (err) {
      console.error('Error fetching document data:', err);
      setLoading(false);
    }
  };

  const openDocumentDetail = async (docId) => {
    try {
      setFetchingDetail(true);
      const res = await API.get(`/documents/${docId}`);
      setHistoryDoc(res.data);
      if (res.data.versions && res.data.versions.length > 0) {
        setPreviewDoc(res.data.document);
        setPreviewVersion(res.data.versions[0]);
      }
    } catch (err) {
      console.error('Failed to load document detail:', err);
    } finally {
      setFetchingDetail(false);
    }
  };

  // ─── File Validation ────────────────────────────────────────────────────────
  const validateFileSelection = (file) => {
    if (!file) return 'Please choose a document file to upload.';
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      return 'Unsupported file format. Please upload a PDF, JPG, JPEG, or PNG file.';
    }
    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxBytes) {
      return `File exceeds the 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a smaller file.`;
    }
    return null;
  };

  // ─── Upload Handler ─────────────────────────────────────────────────────────
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');

    const fileErr = validateFileSelection(selectedFile);
    if (fileErr) {
      setUploadError(fileErr);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document_file', selectedFile);
      formData.append('document_type', docType);
      if (selectedReqId) formData.append('request_id', selectedReqId);
      if (docDescription.trim()) formData.append('description', docDescription.trim());

      await API.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowUploadModal(false);
      setSelectedFile(null);
      setDocDescription('');
      fetchInitialData();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  // ─── Resubmit Handler ───────────────────────────────────────────────────────
  const handleResubmitSubmit = async (e) => {
    e.preventDefault();
    setResubmitError('');

    const fileErr = validateFileSelection(resubmitFile);
    if (fileErr) {
      setResubmitError(fileErr);
      return;
    }

    setResubmitting(true);
    try {
      const formData = new FormData();
      formData.append('document_file', resubmitFile);

      await API.post(`/documents/${resubmitDoc.document_id}/resubmit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResubmitDoc(null);
      setResubmitFile(null);
      fetchInitialData();
    } catch (err) {
      setResubmitError(err.response?.data?.error || 'Failed to resubmit corrected document.');
    } finally {
      setResubmitting(false);
    }
  };

  // ─── Legacy Metadata Record Handler ─────────────────────────────────────────
  const handleAddLegacy = async (e) => {
    e.preventDefault();
    setLegacyError('');
    if (!legacyDocRef.trim() || legacyDocRef.trim().length < 4) {
      setLegacyError('Reference number must be at least 4 characters.');
      return;
    }
    try {
      await API.post('/documents', {
        document_type: legacyDocType,
        document_reference_masked: legacyDocRef.trim(),
        issue_date: legacyIssueDate
      });
      setShowAddLegacyModal(false);
      setLegacyDocRef('');
      fetchInitialData();
    } catch (err) {
      setLegacyError(err.response?.data?.error || 'Failed to record metadata reference.');
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

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> Citizen Document Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload supporting identity or address documents for volunteer review, inspect feedback, and submit corrections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setUploadError(''); setSelectedFile(null); setShowUploadModal(true); }}
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
          >
            <UploadCloud className="w-4 h-4" /> Upload Document File
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('uploads')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'uploads' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Uploaded Document Files ({uploadedDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('metadata')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'metadata' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Checklist Reference Records ({legacyDocs.length})
        </button>
      </div>

      {/* TAB 1: UPLOADED FILES & VOLUNTEER REVIEW WORKFLOW */}
      {activeTab === 'uploads' && (
        <div className="space-y-4">
          {/* Correction Notice Banner */}
          {uploadedDocs.some(d => d.file_review_status === 'Correction Required') && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900">
                <span className="font-bold block text-sm">Action Required: Correction Requested on Document(s)</span>
                A volunteer reviewer has inspected your uploaded document and flagged issues (e.g. blurry image or missing information). Please click <strong>"View Feedback & Resubmit"</strong> in the table below to see their guidance and submit a clearer copy.
              </div>
            </div>
          )}

          {/* Documents Table */}
          <div className="card shadow-sm border-slate-200 overflow-hidden">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Doc #</th>
                    <th>Document Type</th>
                    <th>Version</th>
                    <th>Uploaded File</th>
                    <th>Uploaded Date</th>
                    <th>Review Status</th>
                    <th>Volunteer Feedback</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-blue-600" /> Loading your documents...
                      </td>
                    </tr>
                  ) : uploadedDocs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-400">
                        <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No document files uploaded yet.</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Click <strong>"Upload Document File"</strong> above to submit address, age, or identity proofs for verification.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    uploadedDocs.map(doc => {
                      const isCorrection = doc.file_review_status === 'Correction Required';
                      const isAdditional = doc.file_review_status === 'Additional Document Requested';
                      const isHighlighted = highlightedDocId && String(doc.document_id) === String(highlightedDocId);

                      return (
                        <tr
                          key={doc.document_id}
                          className={isHighlighted ? 'bg-amber-50/70 border-l-4 border-amber-500' : ''}
                        >
                          <td className="font-mono text-xs font-bold text-slate-500">
                            DOC#{doc.document_id}
                          </td>
                          <td>
                            <div className="font-semibold text-slate-800">{doc.document_type}</div>
                            {doc.description && (
                              <div className="text-[11px] text-slate-500 truncate max-w-xs">{doc.description}</div>
                            )}
                            {doc.request_id && (
                              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-mono inline-block mt-0.5">
                                Req #VR100{doc.request_id}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              v{doc.current_version || 1}
                            </span>
                          </td>
                          <td className="text-xs text-slate-600 font-mono">
                            {doc.original_filename || 'document-file'}
                            {doc.file_size_bytes && (
                              <span className="text-[10px] text-slate-400 block font-sans">
                                ({(doc.file_size_bytes / 1024).toFixed(1)} KB)
                              </span>
                            )}
                          </td>
                          <td className="text-xs text-slate-500">
                            {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '—'}
                          </td>
                          <td>
                            {getStatusBadge(doc.file_review_status)}
                          </td>
                          <td className="text-xs max-w-xs">
                            {doc.feedback_message ? (
                              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                                {doc.issue_category && doc.issue_category !== 'N/A' && (
                                  <span className="font-semibold text-rose-700 block text-[11px] mb-0.5">
                                    Issue: {doc.issue_category}
                                  </span>
                                )}
                                <span className="italic line-clamp-2">"{doc.feedback_message}"</span>
                                {doc.reviewer_name && (
                                  <span className="block text-[10px] text-slate-400 mt-1">
                                    — Reviewed by Volunteer {doc.reviewer_name}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No feedback recorded yet</span>
                            )}
                          </td>
                          <td className="text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => openDocumentDetail(doc.document_id)}
                              className="btn btn-outline btn-sm text-xs py-1 px-2.5 text-blue-700 border-blue-200 hover:bg-blue-50"
                              title="Inspect document and review history"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>

                            {(isCorrection || isAdditional) && (
                              <button
                                onClick={() => {
                                  setResubmitDoc(doc);
                                  setResubmitFile(null);
                                  setResubmitError('');
                                }}
                                className="btn btn-primary btn-sm text-xs py-1 px-2.5 bg-rose-600 hover:bg-rose-700 border-none"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Resubmit
                              </button>
                            )}
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

      {/* TAB 2: CHECKLIST METADATA (LEGACY RECORDS PRESERVED) */}
      {activeTab === 'metadata' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Checklist Reference Codes</h3>
              <p className="text-xs text-slate-500">Document numbers recorded for electoral verification requirements</p>
            </div>
            <button
              onClick={() => { setLegacyError(''); setShowAddLegacyModal(true); }}
              className="btn btn-outline btn-sm text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add Reference Code
            </button>
          </div>

          <div className="card shadow-sm border-slate-200 overflow-hidden">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Document Type</th>
                    <th>Masked Reference #</th>
                    <th>Issue Date</th>
                    <th>Status</th>
                    <th>Recorded On</th>
                  </tr>
                </thead>
                <tbody>
                  {legacyDocs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-slate-400 text-xs">No reference records found.</td>
                    </tr>
                  ) : (
                    legacyDocs.map(d => (
                      <tr key={d.document_id}>
                        <td className="font-mono text-xs text-slate-500">#{d.document_id}</td>
                        <td className="font-semibold text-slate-800 text-xs">{d.document_type}</td>
                        <td className="font-mono text-xs text-blue-700">{d.document_reference_masked}</td>
                        <td className="text-xs text-slate-600">{new Date(d.issue_date).toLocaleDateString()}</td>
                        <td>
                          <span className="badge badge-resolved text-[10px]">{d.verification_status}</span>
                        </td>
                        <td className="text-xs text-slate-400">{new Date(d.uploaded_at).toLocaleDateString()}</td>
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
      {/* MODAL 1: UPLOAD DOCUMENT FILE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" /> Upload Document File
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {uploadError && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-lg mt-3 border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs mt-3">
              <div>
                <label className="form-label font-semibold">Document Type <span className="req">*</span></label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="form-select"
                >
                  <option value="Address Proof (Utility Bill / Rent Agreement)">Address Proof (Utility Bill / Rent Agreement)</option>
                  <option value="Identity Proof (Masked Aadhaar / Passport)">Identity Proof (Masked Aadhaar / Passport)</option>
                  <option value="Age Proof (Birth Certificate / School Transfer)">Age Proof (Birth Certificate / School Transfer)</option>
                  <option value="Voter ID (Existing EPIC Copy)">Voter ID (Existing EPIC Copy)</option>
                  <option value="Special Assistance Supporting Document">Special Assistance Supporting Document</option>
                  <option value="Correction Justification Document">Correction Justification Document</option>
                  <option value="Other Supporting Document">Other Supporting Document</option>
                </select>
              </div>

              <div>
                <label className="form-label font-semibold">Related Verification Request (Optional)</label>
                <select
                  value={selectedReqId}
                  onChange={e => setSelectedReqId(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Standalone Document Upload --</option>
                  {requests.map(r => (
                    <option key={r.request_id} value={r.request_id}>
                      #VR100{r.request_id} — {r.request_type} ({r.current_status})
                    </option>
                  ))}
                </select>
                <p className="form-hint">Links this file to your existing assistance or revision request.</p>
              </div>

              <div>
                <label className="form-label font-semibold">Select File (PDF, JPG, JPEG, PNG — Max 5 MB) <span className="req">*</span></label>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/jpg,image/png"
                  onChange={e => {
                    const f = e.target.files[0];
                    setSelectedFile(f);
                    const err = validateFileSelection(f);
                    setUploadError(err || '');
                  }}
                  className="form-input text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
                {selectedFile && (
                  <p className="text-[11px] text-emerald-700 mt-1 font-mono">
                    ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div>
                <label className="form-label font-semibold">Optional Note / Description</label>
                <textarea
                  value={docDescription}
                  onChange={e => setDocDescription(e.target.value)}
                  placeholder="e.g. Electricity bill for November 2025 showing matching ward address"
                  className="form-textarea text-xs"
                  rows="2"
                  maxLength="255"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 inline mr-1" />
                Files are stored securely outside public web roots and accessed exclusively via authenticated volunteer assignment channels.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-outline btn-sm"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" /> Submit for Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: RESUBMIT CORRECTED VERSION */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {resubmitDoc && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-rose-600" /> Resubmit Corrected Document
              </h3>
              <button onClick={() => setResubmitDoc(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Volunteer feedback context */}
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg my-3 text-xs">
              <span className="font-bold text-rose-900 block mb-1">
                Volunteer Reviewer Feedback (Version {resubmitDoc.current_version}):
              </span>
              {resubmitDoc.issue_category && resubmitDoc.issue_category !== 'N/A' && (
                <div className="font-semibold text-rose-800 mb-0.5">
                  Flagged Issue: {resubmitDoc.issue_category}
                </div>
              )}
              <div className="text-rose-950 italic">
                "{resubmitDoc.feedback_message || 'Please upload a clearer and complete document copy.'}"
              </div>
            </div>

            {resubmitError && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-lg mb-3 border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{resubmitError}</span>
              </div>
            )}

            <form onSubmit={handleResubmitSubmit} className="space-y-4 text-xs">
              <div>
                <label className="form-label font-semibold">
                  Upload Corrected File for Version {(resubmitDoc.current_version || 1) + 1} <span className="req">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/jpg,image/png"
                  onChange={e => {
                    const f = e.target.files[0];
                    setResubmitFile(f);
                    const err = validateFileSelection(f);
                    setResubmitError(err || '');
                  }}
                  className="form-input text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                  required
                />
                {resubmitFile && (
                  <p className="text-[11px] text-emerald-700 mt-1 font-mono">
                    ✓ New file ready: {resubmitFile.name} ({(resubmitFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
                <p className="form-hint">
                  The previous version will be safely archived in your audit history. Status will reset to <strong>Pending Review</strong>.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResubmitDoc(null)}
                  className="btn btn-outline btn-sm"
                  disabled={resubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resubmitting || !resubmitFile}
                  className="btn btn-primary btn-sm bg-rose-600 hover:bg-rose-700 border-none flex items-center gap-1.5"
                >
                  {resubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading Version {(resubmitDoc.current_version || 1) + 1}...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Submit Version {(resubmitDoc.current_version || 1) + 1}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: DOCUMENT PREVIEW & AUDIT HISTORY VIEWER */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {historyDoc && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {historyDoc.document?.document_type} (DOC#{historyDoc.document?.document_id})
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>Current Version: <strong>v{historyDoc.document?.current_version}</strong></span>
                  <span>•</span>
                  <span>Status: {getStatusBadge(historyDoc.document?.file_review_status)}</span>
                </div>
              </div>
              <button
                onClick={() => { setHistoryDoc(null); setPreviewVersion(null); setPreviewDoc(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* Left Column: Secure File Preview */}
              <div className="md:col-span-7 p-4 bg-slate-100 flex flex-col border-r border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Previewing: Version {previewVersion?.version_number || 1}
                  </span>
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.2))}
                      className="p-1 hover:text-blue-600"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono px-1">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                      className="p-1 hover:text-blue-600"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="p-1 hover:text-blue-600 ml-1"
                      title="Reset Zoom"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {previewVersion ? (
                  <div className="flex-1 bg-white rounded-lg border border-slate-300 overflow-auto min-h-[350px] max-h-[500px] flex items-center justify-center p-2 relative">
                    {previewVersion.mime_type === 'application/pdf' ? (
                      <iframe
                        src={`/api/documents/${historyDoc.document.document_id}/versions/${previewVersion.version_id}/file`}
                        title="PDF Document Preview"
                        className="w-full h-full min-h-[460px] border-0 rounded"
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                      />
                    ) : (
                      <img
                        src={`/api/documents/${historyDoc.document.document_id}/versions/${previewVersion.version_id}/file`}
                        alt="Document Preview"
                        className="max-w-full max-h-full object-contain transition-transform"
                        style={{ transform: `scale(${zoomLevel})` }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-white rounded border text-xs text-slate-400 p-8">
                    Select a version to preview.
                  </div>
                )}

                <div className="mt-2 text-[11px] text-slate-500 flex justify-between items-center">
                  <span>File: <code>{previewVersion?.original_filename}</code></span>
                  <span>Size: {previewVersion?.file_size_bytes ? (previewVersion.file_size_bytes / 1024).toFixed(1) + ' KB' : '—'}</span>
                </div>
              </div>

              {/* Right Column: Version History & Volunteer Reviews */}
              <div className="md:col-span-5 p-4 space-y-4 bg-white overflow-y-auto max-h-[560px]">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Version & Review History ({historyDoc.versions?.length || 0})
                  </h4>
                  <div className="space-y-3">
                    {historyDoc.versions?.map((v, idx) => {
                      const isCurrentActive = previewVersion?.version_id === v.version_id;
                      return (
                        <div
                          key={v.version_id}
                          onClick={() => setPreviewVersion(v)}
                          className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                            isCurrentActive
                              ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                              Version {v.version_number}
                              {v.version_number === historyDoc.document.current_version && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">Latest</span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(v.uploaded_at).toLocaleString()}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 font-mono mb-2">
                            {v.original_filename}
                          </div>

                          {/* Review on this version */}
                          {v.review_id ? (
                            <div className="bg-white p-2.5 rounded border border-slate-200 mt-2 space-y-1">
                              <div className="flex justify-between items-start">
                                <span className="font-semibold text-slate-700">Review Outcome:</span>
                                {getStatusBadge(v.review_decision)}
                              </div>
                              {v.issue_category && v.issue_category !== 'N/A' && (
                                <div className="text-rose-700 font-medium text-[11px]">
                                  Issue: {v.issue_category}
                                </div>
                              )}
                              {v.feedback_message && (
                                <div className="text-slate-600 italic bg-slate-50 p-1.5 rounded text-[11px]">
                                  "{v.feedback_message}"
                                </div>
                              )}
                              {v.additional_document_request && (
                                <div className="text-purple-800 bg-purple-50 p-1.5 rounded text-[11px]">
                                  <strong>Requested Doc:</strong> {v.additional_document_request}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                                <span>Reviewer: {v.reviewer_name || 'Assigned Volunteer'}</span>
                                <span>{new Date(v.reviewed_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 mt-2">
                              ⏳ Awaiting volunteer inspection
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
              <span className="text-slate-500">
                SIRAssist Academic Verification Workflow • Transparent DBMS Audit Trail
              </span>
              <button
                type="button"
                onClick={() => { setHistoryDoc(null); setPreviewVersion(null); setPreviewDoc(null); }}
                className="btn btn-outline btn-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: LEGACY METADATA ENTRY (PRESERVED) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showAddLegacyModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Add Metadata Reference</h3>
              <button onClick={() => setShowAddLegacyModal(false)} className="text-slate-400">✕</button>
            </div>

            {legacyError && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-lg my-3 border border-rose-200">
                {legacyError}
              </div>
            )}

            <form onSubmit={handleAddLegacy} className="space-y-4 text-xs mt-3">
              <div>
                <label className="form-label font-semibold">Document Type</label>
                <select
                  value={legacyDocType}
                  onChange={e => setLegacyDocType(e.target.value)}
                  className="form-select"
                >
                  <option value="Aadhaar (Masked)">Aadhaar (Masked)</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Ration Card">Ration Card</option>
                  <option value="Utility Bill">Utility Bill</option>
                  <option value="Passport">Passport</option>
                </select>
              </div>

              <div>
                <label className="form-label font-semibold">Masked Reference Number</label>
                <input
                  type="text"
                  value={legacyDocRef}
                  onChange={e => setLegacyDocRef(e.target.value)}
                  placeholder="e.g. XXXX-XXXX-4589"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label font-semibold">Issue Date</label>
                <input
                  type="date"
                  value={legacyIssueDate}
                  onChange={e => setLegacyIssueDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddLegacyModal(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Reference</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
