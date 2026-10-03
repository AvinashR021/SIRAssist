import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, ShieldCheck, Key, UserCheck, Shield } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin-dashboard');
      else if (user.role === 'VOLUNTEER') navigate('/volunteer-dashboard');
      else navigate('/citizen-dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setSubmitting(true);
    try {
      const user = await login(demoEmail, 'password123');
      if (user.role === 'ADMIN') navigate('/admin-dashboard');
      else if (user.role === 'VOLUNTEER') navigate('/volunteer-dashboard');
      else navigate('/citizen-dashboard');
    } catch (err) {
      setError('Quick login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="card">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-100 rounded-full text-blue-600 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Login to SIRAssist</h2>
          <p className="text-xs text-slate-500">Citizen Assistance & Verification System</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary py-2.5 text-sm font-semibold"
          >
            <LogIn className="w-4 h-4" /> {submitting ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        {/* Demo Quick Shortcuts */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
            Demo Demo Credentials
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('ramesh.k@example.com')}
              className="btn btn-outline btn-sm text-[11px] py-1.5 flex flex-col items-center gap-0.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Citizen</span>
            </button>
            <button
              onClick={() => handleQuickLogin('arjun.v@example.com')}
              className="btn btn-outline btn-sm text-[11px] py-1.5 flex flex-col items-center gap-0.5"
            >
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Volunteer</span>
            </button>
            <button
              onClick={() => handleQuickLogin('admin@sirassist.org')}
              className="btn btn-outline btn-sm text-[11px] py-1.5 flex flex-col items-center gap-0.5"
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Don't have an account? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
