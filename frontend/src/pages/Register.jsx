import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, ShieldCheck, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function Register() {
  const [role, setRole] = useState('CITIZEN');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Show/Hide Password states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Address fields for Citizens
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Bengaluru');
  const [pinCode, setPinCode] = useState('560040');

  // Inline Validation Errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Password strength calculations
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!password) return { label: 'None', color: 'bg-slate-200', text: 'text-slate-400', width: '0%' };
    if (strengthScore <= 2) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600', width: '33%' };
    if (strengthScore === 3) return { label: 'Moderate', color: 'bg-amber-500', text: 'text-amber-600', width: '66%' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600', width: '100%' };
  };

  const strength = getStrengthLabel();

  // Client-side Validation Handler
  const validateForm = () => {
    const errors = {};

    // 1. Full Name Validation
    if (!name.trim()) {
      errors.name = 'Full name is required.';
    } else if (name.trim().length < 3) {
      errors.name = 'Full name must be at least 3 characters.';
    } else if (!/^[a-zA-Z\s\.\'-]+$/.test(name.trim())) {
      errors.name = 'Name contains invalid characters. Use letters, dots, and spaces only.';
    }

    // 2. Username Validation
    if (!username.trim()) {
      errors.username = 'Username is required.';
    } else if (username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9_\-\.]+$/.test(username.trim())) {
      errors.username = 'Username may only contain letters, numbers, and underscores.';
    }

    // 3. Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    // 4. Mobile Validation (10 digits Indian format)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobile.trim()) {
      errors.mobile = 'Mobile number is required.';
    } else if (!mobileRegex.test(mobile.trim())) {
      errors.mobile = 'Mobile number must contain exactly 10 digits starting with 6, 7, 8, or 9.';
    }

    // 5. Password Validation
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (!hasUpper || !hasLower || !hasNumber) {
      errors.password = 'Password must contain uppercase, lowercase, and numeric characters.';
    }

    // 6. Confirm Password Validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // 7. PIN Code Validation (if citizen)
    if (role === 'CITIZEN' && pinCode) {
      if (!/^\d{6}$/.test(pinCode.trim())) {
        errors.pinCode = 'Postal PIN code must contain exactly 6 digits.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) {
      // Focus first error
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        role,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        name: name.trim(),
        mobile: mobile.trim(),
        password,
        address: role === 'CITIZEN' ? {
          house_number: houseNumber.trim() || 'N/A',
          street: street.trim() || 'Main Street',
          village: village.trim() || 'Urban Zone',
          taluk: 'Central',
          district: district.trim() || 'Bengaluru',
          state: 'Karnataka',
          pin_code: pinCode.trim() || '560040'
        } : null
      };

      const user = await register(payload);
      if (user.role === 'VOLUNTEER') navigate('/volunteer-dashboard');
      else navigate('/citizen-dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please check your entries.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6">
      <div className="card shadow-md border-slate-200">
        {/* Form Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-100 rounded-full text-blue-700 mb-2">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Citizen / Volunteer Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Register to record verification documents, track checklists, or provide volunteer assistance
          </p>
        </div>

        {formError && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-5 border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">
              Select Account Type <span className="req">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('CITIZEN')}
                className={`py-2 px-3 border rounded-lg font-semibold text-xs transition ${
                  role === 'CITIZEN'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm ring-1 ring-blue-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Citizen (Applicant)
              </button>
              <button
                type="button"
                onClick={() => setRole('VOLUNTEER')}
                className={`py-2 px-3 border rounded-lg font-semibold text-xs transition ${
                  role === 'VOLUNTEER'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm ring-1 ring-blue-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Community Volunteer
              </button>
            </div>
            <p className="form-hint">Admin roles are reserved for system officials and cannot be self-registered.</p>
          </div>

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">
                Full Name <span className="req">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' }); }}
                placeholder="Ramesh Kumar"
                className={`form-input ${fieldErrors.name ? 'is-invalid' : ''}`}
                required
              />
              {fieldErrors.name && <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{fieldErrors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Username <span className="req">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: '' }); }}
                placeholder="ramesh_k"
                className={`form-input ${fieldErrors.username ? 'is-invalid' : ''}`}
                required
              />
              {fieldErrors.username && <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{fieldErrors.username}</span>}
            </div>
          </div>

          {/* Email & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">
                Email Address <span className="req">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' }); }}
                placeholder="ramesh@example.com"
                className={`form-input ${fieldErrors.email ? 'is-invalid' : ''}`}
                required
              />
              {fieldErrors.email && <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{fieldErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Mobile Number (10 digits) <span className="req">*</span>
              </label>
              <input
                type="tel"
                maxLength="10"
                value={mobile}
                onChange={e => { setMobile(e.target.value.replace(/\D/g, '')); if (fieldErrors.mobile) setFieldErrors({ ...fieldErrors, mobile: '' }); }}
                placeholder="9845012345"
                className={`form-input font-mono ${fieldErrors.mobile ? 'is-invalid' : ''}`}
                required
              />
              {fieldErrors.mobile && <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{fieldErrors.mobile}</span>}
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">
                Password <span className="req">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' }); }}
                  placeholder="At least 8 characters"
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
              {fieldErrors.password && <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{fieldErrors.password}</span>}

              {/* Password Strength Visual Meter */}
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center text-[10px] font-semibold">
                    <span className="text-slate-500">Strength:</span>
                    <span className={strength.text}>{strength.label}</span>
                  </div>
                  <div className="pwd-meter-track">
                    <div className={`pwd-meter-bar ${strength.color}`} style={{ width: strength.width }} />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] mt-1.5 text-slate-500">
                    <span className={hasMinLength ? 'text-emerald-600' : ''}>• 8+ characters</span>
                    <span className={hasUpper ? 'text-emerald-600' : ''}>• Uppercase (A-Z)</span>
                    <span className={hasLower ? 'text-emerald-600' : ''}>• Lowercase (a-z)</span>
                    <span className={hasNumber ? 'text-emerald-600' : ''}>• Number (0-9)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Confirm Password <span className="req">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: '' }); }}
                  placeholder="Re-enter password"
                  className={`form-input pr-10 ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                  required
                />
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{fieldErrors.confirmPassword}</span>}
            </div>
          </div>

          {/* Citizen Address Section */}
          {role === 'CITIZEN' && (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Residential Address Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Door / House #"
                  value={houseNumber}
                  onChange={e => setHouseNumber(e.target.value)}
                  className="form-input text-xs"
                />
                <input
                  type="text"
                  placeholder="Street / Layout"
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  className="form-input text-xs"
                />
                <input
                  type="text"
                  placeholder="Village / Ward"
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  className="form-input text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="District"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="form-input text-xs"
                />
                <div>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="PIN Code (6 digits)"
                    value={pinCode}
                    onChange={e => { setPinCode(e.target.value.replace(/\D/g, '')); if (fieldErrors.pinCode) setFieldErrors({ ...fieldErrors, pinCode: '' }); }}
                    className={`form-input font-mono text-xs ${fieldErrors.pinCode ? 'is-invalid' : ''}`}
                  />
                  {fieldErrors.pinCode && <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{fieldErrors.pinCode}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary py-2.5 text-sm font-semibold mt-4"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
              </>
            ) : (
              'Register Account'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-5">
          Already registered?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
