import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { FileText, PlusCircle, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [docType, setDocType] = useState('Aadhaar (Masked)');
  const [docRef, setDocRef] = useState('');
  const [issueDate, setIssueDate] = useState('2020-01-01');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await API.get('/documents');
      setDocuments(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    try {
      await API.post('/documents', {
        document_type: docType,
        document_reference_masked: docRef,
        issue_date: issueDate
      });
      setShowAddModal(false);
      setDocRef('');
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add document.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this document metadata?')) return;
    try {
      await API.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> My Document Checklist Repository
          </h1>
          <p className="text-xs text-slate-500">Record supporting documents to complete your verification checklist</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
          <PlusCircle className="w-4 h-4" /> Add Document Reference
        </button>
      </div>

      <div className="disclaimer-banner text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <strong>Privacy-by-Design Compliance:</strong> SIRAssist does NOT require or store actual Aadhaar numbers or identity document files. Enter only masked reference numbers for academic demonstration.
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Document ID</th>
                <th>Document Type</th>
                <th>Masked Reference #</th>
                <th>Issue Date</th>
                <th>Status</th>
                <th>Uploaded At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-400">
                    No documents recorded yet. Click "Add Document Reference" above.
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.document_id}>
                    <td className="font-mono text-xs font-bold text-slate-500">DOC#{doc.document_id}</td>
                    <td className="font-semibold text-slate-800">{doc.document_type}</td>
                    <td className="font-mono text-xs text-blue-700 font-bold">{doc.document_reference_masked}</td>
                    <td className="text-xs text-slate-600">{new Date(doc.issue_date).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-resolved">
                        {doc.verification_status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleDelete(doc.document_id)} className="btn btn-danger btn-sm text-[11px] py-1">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-bold mb-4 text-slate-800">Add Document Metadata Reference</h3>
            <form onSubmit={handleAddDocument} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Document Type</label>
                <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full p-2 border rounded">
                  <option value="Aadhaar (Masked)">Aadhaar (Masked)</option>
                  <option value="Voter ID">Voter ID (EPIC Card)</option>
                  <option value="Ration Card">Ration Card</option>
                  <option value="Utility Bill">Utility Bill (Electricity/Water)</option>
                  <option value="Bank Passbook">Bank Passbook</option>
                  <option value="Birth Certificate">Birth Certificate</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Masked Reference Number (e.g. XXXX-XXXX-1234)</label>
                <input
                  type="text"
                  value={docRef}
                  onChange={e => setDocRef(e.target.value)}
                  required
                  placeholder="XXXX-XXXX-1234"
                  className="w-full p-2 border rounded font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
