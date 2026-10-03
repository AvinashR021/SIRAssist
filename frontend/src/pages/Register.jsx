import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [role, setRole] = useState('CITIZEN');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [village, setVillage] = useState('');
  const [taluk, setTaluk] = useState('');
  const [district, setDistrict] = useState('');
  const [pinCode, setPinCode] = useState('560040');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        role,
        username,
        email,
        name,
        mobile,
        password,
        address: role === 'CITIZEN' ? {
          house_number: houseNumber || '#1',
          street: street || 'Main Street',
          village: village || 'Urban Zone',
          taluk: taluk || 'Central',
          district: district || 'Bengaluru',
          pin_code: pinCode || '560001'
        } : null
      };

      const user = await register(payload);
      if (user.role === 'VOLUNTEER') navigate('/volunteer-dashboard');
      else navigate('/citizen-dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-8">
      <div className="card">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-100 rounded-full text-blue-600 mb-2">
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Register on SIRAssist</h2>
          <p className="text-xs text-slate-500">Citizen Assistance & Request Management System</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('CITIZEN')}
                className={`py-2 border rounded-md font-semibold text-center ${role === 'CITIZEN' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white text-slate-600'}`}
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => setRole('VOLUNTEER')}
                className={`py-2 border rounded-md font-semibold text-center ${role === 'VOLUNTEER' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white text-slate-600'}`}
              >
                Volunteer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                placeholder="Ramesh Kumar"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                placeholder="ramesh_k"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                placeholder="ramesh@example.com"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                placeholder="9845012345"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
              placeholder="••••••••"
            />
          </div>

          {role === 'CITIZEN' && (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <span className="font-bold text-slate-600 block">Address Details</span>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="House #" value={houseNumber} onChange={e => setHouseNumber(e.target.value)} className="p-2 border rounded" />
                <input type="text" placeholder="Street" value={street} onChange={e => setStreet(e.target.value)} className="p-2 border rounded" />
                <input type="text" placeholder="Village / Area" value={village} onChange={e => setVillage(e.target.value)} className="p-2 border rounded" />
                <input type="text" placeholder="District" value={district} onChange={e => setDistrict(e.target.value)} className="p-2 border rounded" />
                <input type="text" placeholder="PIN Code" value={pinCode} onChange={e => setPinCode(e.target.value)} className="p-2 border rounded" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary py-2.5 text-xs font-semibold"
          >
            {submitting ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          Already registered? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}
