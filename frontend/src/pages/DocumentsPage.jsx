import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../services/api';
import {
  FileText,
  Upload,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileCheck2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

export default function DocumentsPage() {
  const location = useLocation();
  const highlightedDocId = location.state?.highlightDocId;

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docType, setDocType] = useState('Address Proof');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Preview & detail modal state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docDetail, setDocDetail] = useState(null);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Resubmit state inside modal
  const [resubmitFile, setResubmitFile] = useState(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await API.get('/documents/my');
      const docs = res.data || [];
      setDocuments(docs);
      setLoading(false);

      if (highlightedDocId) {
        const found = docs.find(d => String(d.document_id) === String(highlightedDocId));
        if (found) openDocumentModal(found);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setUploadError('');
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setUploadError('Please select a valid PDF, JPG, or PNG file.');
      setSelectedFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be under 5 MB.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please choose a document file to upload.');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('document_file', selectedFile);
      formData.append('document_type', docType);

      const res = await API.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadSuccess(res.data?.message || 'Document uploaded successfully!');
      await fetchDocuments();
      setUploading(false);

      setTimeout(() => setUploadSuccess(''), 5000);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to upload document. Please try again.');
      setUploading(false);
    }
  };

  const openDocumentModal = async (doc) => {
    setSelectedDoc(doc);
    setLoadingDetail(true);
    setResubmitFile(null);
    setResubmitError('');
    setZoomLevel(1);
    try {
      const res = await API.get(`/documents/${doc.document_id}`);
      setDocDetail(res.data);
      if (res.data.versions && res.data.versions.length > 0) {
        setPreviewVersion(res.data.versions[0]);
      }
    } catch (err) {
      console.error('Failed to load document details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    if (!resubmitFile) {
      setResubmitError('Please select a corrected document file.');
      return;
    }
    setResubmitting(true);
    setResubmitError('');
    try {
      const formData = new FormData();
      formData.append('document_file', resubmitFile);

      await API.post(`/documents/${selectedDoc.document_id}/resubmit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResubmitFile(null);
      setResubmitting(false);
      await fetchDocuments();
      // Reload current detail
      const res = await API.get(`/documents/${selectedDoc.document_id}`);
      setDocDetail(res.data);
      if (res.data.versions && res.data.versions.length > 0) {
        setPreviewVersion(res.data.versions[0]);
      }
    } catch (err) {
      setResubmitError(err.response?.data?.error || 'Failed to resubmit corrected document.');
      setResubmitting(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Reviewed – No Issues Found':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'Correction Required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <AlertCircle className="w-3.5 h-3.5" /> Correction Needed
          </span>
        );
      case 'Additional Document Requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <AlertCircle className="w-3.5 h-3.5" /> More Info Needed
          </span>
        );
      case 'Under Review':
      case 'Pending Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <Clock className="w-3.5 h-3.5" /> Pending Assignment
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Page Title & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> My Documents
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your supporting proofs, view volunteer feedback, and track review status.
          </p>
        </div>
        <button
          onClick={() => {
            setUploadError('');
            setSelectedFile(null);
            setShowUploadModal(true);
          }}
          className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 text-sm transition"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Success banner */}
      {uploadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess('')} className="text-emerald-600 hover:text-emerald-800 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-sm">
            All Submitted Documents ({documents.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Uploaded On</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Volunteer</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-blue-600" /> Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400">
                    <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No documents found.</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Upload your first document file to begin verification.
                    </p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="btn btn-sm btn-primary bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" /> Upload Document
                    </button>
                  </td>
                </tr>
              ) : (
                documents.map(doc => {
                  const isHighlighted = highlightedDocId && String(doc.document_id) === String(highlightedDocId);
                  return (
                    <tr
                      key={doc.document_id}
                      className={`hover:bg-slate-50/70 transition ${isHighlighted ? 'bg-amber-50/80 border-l-4 border-amber-500' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-sm">{doc.document_type}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400">DOC#{doc.document_id}</span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border">
                            v{doc.current_version || 1}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(doc.file_review_status)}
                      </td>
                      <td className="py-3.5 px-4">
                        {doc.assigned_volunteer_name ? (
                          <div>
                            <span className="font-semibold text-indigo-700 block text-xs">{doc.assigned_volunteer_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">VOL#{doc.assigned_volunteer_id}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Pending Assignment</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openDocumentModal(doc)}
                          className="btn btn-outline btn-sm text-xs py-1.5 px-3 text-blue-700 border-blue-200 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1.5 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {doc.file_review_status === 'Correction Required' ? 'View Feedback' : 'View'}
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md p-6 rounded-2xl bg-white shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" /> Upload Document
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Submit supporting proof for regional volunteer review</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Address Proof">Address Proof (Electricity Bill, Water Bill, Rent Deed)</option>
                  <option value="Identity Proof">Identity Proof (Aadhaar Card, Passport, PAN Card)</option>
                  <option value="Age Proof">Age Proof (Birth Certificate, School Certificate)</option>
                  <option value="Income Certificate">Income Certificate</option>
                  <option value="Caste Certificate">Caste Certificate</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Choose File <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Accepted formats: PDF, JPG, PNG (Max size: 5 MB)
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-outline btn-sm text-xs px-4 py-2 border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary btn-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    'Upload Document'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview & Details Modal */}
      {selectedDoc && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> {selectedDoc.document_type}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>Version: <strong>v{selectedDoc.current_version || 1}</strong></span>
                  <span>•</span>
                  <span>Status: {renderStatusBadge(selectedDoc.file_review_status)}</span>
                </div>
              </div>
              <button
                onClick={() => { setSelectedDoc(null); setDocDetail(null); setPreviewVersion(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* Left Column: File Preview */}
              <div className="md:col-span-7 p-4 bg-slate-100 flex flex-col border-r border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Preview: Version {previewVersion?.version_number || 1}
                  </span>
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-xs">
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

                {loadingDetail ? (
                  <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-slate-200 min-h-[350px]">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : previewVersion ? (
                  <div className="flex-1 bg-white rounded-xl border border-slate-300 overflow-auto min-h-[350px] max-h-[500px] flex items-center justify-center p-2 relative">
                    {previewVersion.mime_type === 'application/pdf' ? (
                      <iframe
                        src={`/api/documents/${selectedDoc.document_id}/versions/${previewVersion.version_id}/file`}
                        title="PDF Preview"
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
                    Preview unavailable.
                  </div>
                )}
              </div>

              {/* Right Column: Review Details & Resubmission */}
              <div className="md:col-span-5 p-4 space-y-4 bg-white overflow-y-auto max-h-[560px] text-xs">
                {/* Assigned Volunteer Card */}
                {docDetail?.document?.assigned_volunteer_name || selectedDoc.assigned_volunteer_name ? (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Assigned Volunteer Reviewer
                    </span>
                    <span className="font-bold text-indigo-950 text-sm block mt-0.5">
                      {docDetail?.document?.assigned_volunteer_name || selectedDoc.assigned_volunteer_name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Reference: VOL#{docDetail?.document?.assigned_volunteer_id || selectedDoc.assigned_volunteer_id}
                    </span>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    <span className="font-semibold block">Waiting for volunteer assignment</span>
                    <span className="text-[11px] text-amber-700">An approved volunteer from your region will be assigned shortly.</span>
                  </div>
                )}

                {/* Review feedback if Correction Required */}
                {selectedDoc.file_review_status === 'Correction Required' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
                    <span className="font-bold text-rose-900 block text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" /> Volunteer Feedback
                    </span>
                    {selectedDoc.issue_category && (
                      <span className="text-[11px] font-semibold text-rose-800 block">
                        Issue: {selectedDoc.issue_category}
                      </span>
                    )}
                    <p className="text-slate-700 italic bg-white p-2 rounded-lg border border-rose-100 text-[11px]">
                      "{selectedDoc.feedback_message || 'Please upload a clearer copy.'}"
                    </p>

                    {/* Resubmission Form */}
                    <div className="pt-2 border-t border-rose-200/60 mt-3">
                      <span className="font-bold text-slate-800 block mb-1.5">Upload Corrected Document</span>
                      {resubmitError && (
                        <div className="text-rose-700 text-[11px] mb-2">{resubmitError}</div>
                      )}
                      <form onSubmit={handleResubmit} className="space-y-2">
                        <input
                          type="file"
                          accept=".pdf,image/jpeg,image/jpg,image/png"
                          onChange={e => {
                            setResubmitError('');
                            setResubmitFile(e.target.files?.[0] || null);
                          }}
                          className="w-full text-[11px] border rounded-lg p-1.5 bg-white"
                          required
                        />
                        <button
                          type="submit"
                          disabled={resubmitting}
                          className="w-full btn btn-primary btn-sm bg-rose-600 hover:bg-rose-700 text-white font-semibold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1"
                        >
                          {resubmitting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading Corrected Copy...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" /> Submit Corrected Version (v{(selectedDoc.current_version || 1) + 1})
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Prior Version History */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Versions History ({docDetail?.versions?.length || 1})
                  </h4>
                  <div className="space-y-2">
                    {docDetail?.versions?.map((v) => {
                      const isActive = previewVersion?.version_id === v.version_id;
                      return (
                        <div
                          key={v.version_id}
                          onClick={() => setPreviewVersion(v)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            isActive
                              ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">
                              Version {v.version_number}
                              {v.version_number === selectedDoc.current_version && (
                                <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">
                                  Current
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(v.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono block mt-0.5 truncate">
                            {v.original_filename}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
              <span className="text-slate-500">SIRAssist • Secure Document Repository</span>
              <button
                type="button"
                onClick={() => { setSelectedDoc(null); setDocDetail(null); }}
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
