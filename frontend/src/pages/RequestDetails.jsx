import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import ReadinessBadge from '../components/ReadinessBadge';
import StatusTimeline from '../components/StatusTimeline';
import { FileText, ArrowLeft, Calendar, User, FileCheck, CheckCircle } from 'lucide-react';

export default function RequestDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/requests/${id}`);
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">Loading request details...</div>;
  if (!data) return <div className="p-8 text-center text-xs text-red-500">Request not found.</div>;

  const { request, documents, history, readiness } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <Link to="/citizen-dashboard" className="btn btn-outline btn-sm text-xs inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      <div className="card">
        <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
          <div>
            <span className="text-xs font-mono font-bold text-blue-700">REQUEST #VR100{request.request_id}</span>
            <h1 className="text-2xl font-bold text-slate-800">{request.request_type}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {request.citizen_name}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(request.submission_date).toLocaleString()}</span>
            </p>
          </div>
          <span className={`badge badge-${request.current_status.toLowerCase()} text-xs px-3 py-1`}>
            {request.current_status}
          </span>
        </div>

        {request.remarks && (
          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs mb-6">
            <span className="font-bold text-slate-700 block mb-1">Remarks & Notes</span>
            <p className="text-slate-600">{request.remarks}</p>
          </div>
        )}

        {/* Workflow Status Timeline Component */}
        <StatusTimeline currentStatus={request.current_status} history={history} />
      </div>

      {/* Verification Readiness Checklist */}
      {readiness && (
        <div className="card">
          <ReadinessBadge readiness={readiness} />
        </div>
      )}

      {/* Attached Supporting Documents */}
      <div className="card">
        <h3 className="card-title text-base flex items-center gap-2 mb-4">
          <FileCheck className="w-5 h-5 text-indigo-600" /> Attached Supporting Documents ({documents.length})
        </h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>Masked Reference</th>
                <th>Status</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-slate-400">
                    No documents currently attached to this request.
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.document_id}>
                    <td className="font-semibold text-slate-800">{doc.document_type}</td>
                    <td className="font-mono text-xs text-blue-700 font-bold">{doc.document_reference_masked}</td>
                    <td><span className="badge badge-resolved">{doc.verification_status}</span></td>
                    <td className="text-xs text-slate-500">{new Date(doc.submitted_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
