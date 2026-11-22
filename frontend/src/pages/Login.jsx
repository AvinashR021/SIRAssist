import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, ShieldCheck, Key, UserCheck, Shield, Eye, EyeOff, AlertCircle, XCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email address or username is required.';
    } else if (email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      errors.email = 'Please enter a valid email format.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'ADMIN') navigate('/admin-dashboard');
      else if (user.role === 'VOLUNTEER') navigate('/volunteer-dashboard');
      else navigate('/citizen-dashboard');
    } catch (err) {
      const respError = err.response?.data?.error;
      if (err.response?.status === 429) {
        setError(respError || 'Too many login attempts. Temporary rate limit triggered for your security.');
      } else {
        setError(respError || 'Invalid email or password. Please verify your credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      const user = await login(demoEmail, 'password123');
      if (user.role === 'ADMIN') navigate('/admin-dashboard');
      else if (user.role === 'VOLUNTEER') navigate('/volunteer-dashboard');
      else navigate('/citizen-dashboard');
    } catch (err) {
      setError('Quick login failed. Please ensure the database is initialized.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="card shadow-md border-slate-200">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-100 rounded-full text-blue-700 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Login to SIRAssist</h1>
          <p className="text-xs text-slate-500 mt-1">Electoral Roll Revision Citizen Assistance Portal</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4 border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="form-group">
            <label className="form-label">
              Email Address or Username <span className="req">*</span>
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
              }}
              placeholder="user@example.com or username"
              className={`form-input ${fieldErrors.email ? 'is-invalid' : ''}`}
              required
            />
            {fieldErrors.email && (
              <span className="form-feedback-error">
                <XCircle className="w-3.5 h-3.5" />
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Password <span className="req">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                }}
                placeholder="••••••••"
                className={`form-input pr-10 ${fieldErrors.password ? 'is-invalid' : ''}`}
                required
              />
              <button
                type="button"
                tabIndex="-1"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="form-feedback-error">
                <XCircle className="w-3.5 h-3.5" />
                {fieldErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary py-2.5 text-sm font-semibold mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Login
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Shortcuts */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
            Demo Credentials (Quick Login)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('ramesh.k@example.com')}
              className="btn btn-outline btn-sm text-[11px] py-1.5 flex flex-col items-center gap-0.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('arjun.v@example.com')}
              className="btn btn-outline btn-sm text-[11px] py-1.5 flex flex-col items-center gap-0.5"
            >
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Volunteer</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@sirassist.org')}
              className="btn btn-outline btn-sm text-[11px] py-1.5 flex flex-col items-center gap-0.5"
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
