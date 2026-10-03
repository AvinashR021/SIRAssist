import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { Users, CheckCircle, Clock, ToggleLeft, Edit3, Phone, Mail } from 'lucide-react';

export default function VolunteerDashboard() {
  const { user } = useContext(AuthContext);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Volunteer Profile Settings
  const [availability, setAvailability] = useState('Available');
  const [skills, setSkills] = useState('Digital Assistance, Form Filling');
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    fetchAssistanceData();
  }, []);

  const fetchAssistanceData = async () => {
    try {
      setLoading(true);
      const res = await API.get('/assistance');
      setAssistanceRequests(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (assistanceId, status, newNotes = null) => {
    try {
      await API.put(`/assistance/${assistanceId}`, {
        status,
        volunteer_id: user.volunteer_id,
        notes: newNotes !== null ? newNotes : undefined
      });
      fetchAssistanceData();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleToggleAvailability = async (newAvailability) => {
    setAvailability(newAvailability);
    try {
      await API.put('/volunteers/profile', { availability: newAvailability, skills });
    } catch (err) {
      console.error(err);
    }
  };

  const activeAssigned = assistanceRequests.filter(a => a.volunteer_id === user?.volunteer_id);
  const pendingRequests = assistanceRequests.filter(a => a.status === 'PENDING');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> Volunteer Assistance Portal
          </h1>
          <p className="text-xs text-slate-500">Provide digital assistance & form-filling guidance to citizens in your area</p>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
          <span className="font-semibold text-slate-700">Availability:</span>
          <select
            value={availability}
            onChange={e => handleToggleAvailability(e.target.value)}
            className={`font-bold p-1 rounded ${availability === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}
          >
            <option value="Available">Available for Requests</option>
            <option value="Busy">Busy</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="card p-4">
          <span className="text-2xl font-bold text-indigo-600 block">{activeAssigned.length}</span>
          <span className="text-xs text-slate-500">Assigned to Me</span>
        </div>
        <div className="card p-4">
          <span className="text-2xl font-bold text-amber-600 block">{pendingRequests.length}</span>
          <span className="text-xs text-slate-500">Pending Community Requests</span>
        </div>
        <div className="card p-4">
          <span className="text-2xl font-bold text-emerald-600 block">
            {assistanceRequests.filter(a => a.status === 'COMPLETED' && a.volunteer_id === user?.volunteer_id).length}
          </span>
          <span className="text-xs text-slate-500">Completed Assistance</span>
        </div>
      </div>

      {/* Assigned Assistance Requests */}
      <div className="card">
        <h2 className="card-title text-base mb-4">My Active Assistance Workload</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Req #</th>
                <th>Citizen Name</th>
                <th>Contact</th>
                <th>Assistance Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeAssigned.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-400">
                    No active assistance requests assigned to you.
                  </td>
                </tr>
              ) : (
                activeAssigned.map(req => (
                  <tr key={req.assistance_id}>
                    <td className="font-mono text-xs font-bold">AR100{req.assistance_id}</td>
                    <td className="font-semibold text-slate-800">{req.citizen_name}</td>
                    <td className="text-xs">
                      <div className="flex items-center gap-1 text-slate-600"><Phone className="w-3 h-3" /> {req.citizen_mobile}</div>
                    </td>
                    <td className="font-semibold text-indigo-700">{req.request_type}</td>
                    <td>
                      <span className={`badge ${req.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td><span className="badge badge-pending">{req.status}</span></td>
                    <td>
                      <div className="flex gap-1">
                        {req.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleUpdateStatus(req.assistance_id, 'COMPLETED')}
                            className="btn btn-primary btn-sm text-[11px] bg-emerald-600 hover:bg-emerald-700"
                          >
                            Mark Completed
                          </button>
                        )}
                        {req.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleUpdateStatus(req.assistance_id, 'IN_PROGRESS')}
                            className="btn btn-outline btn-sm text-[11px]"
                          >
                            In Progress
                          </button>
                        )}
                      </div>
                    </td>
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
