import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { User, MapPin, Award, Save, CheckCircle, AlertCircle, XCircle, Loader2, Phone, Mail, Calendar } from 'lucide-react';

export default function CitizenProfile() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Personal Information
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');

  // Contact Information
  const [mobile, setMobile] = useState('');

  // Address Information
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [village, setVillage] = useState('');
  const [taluk, setTaluk] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Karnataka');
  const [pinCode, setPinCode] = useState('');

  // Field Errors
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get('/citizens/profile');
      const p = res.data;
      setProfile(p);

      setName(p.name || '');
      setDob(p.date_of_birth ? p.date_of_birth.substring(0, 10) : '');
      setGender(p.gender || 'Prefer not to say');
      setMobile(p.mobile || '');

      setHouseNumber(p.house_number || '');
      setStreet(p.street || '');
      setVillage(p.village || '');
      setTaluk(p.taluk || '');
      setDistrict(p.district || '');
      setState(p.state || 'Karnataka');
      setPinCode(p.pin_code || '');

      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load profile data.');
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Name
    if (!name.trim()) {
      errors.name = 'Full name is required.';
    } else if (name.trim().length < 3) {
      errors.name = 'Full name must be at least 3 characters.';
    } else if (!/^[a-zA-Z\s\.\'-]+$/.test(name.trim())) {
      errors.name = 'Name contains invalid characters.';
    }

    // DOB
    if (dob) {
      const selected = new Date(dob);
      const today = new Date();
      if (selected > today) {
        errors.dob = 'Date of birth cannot be in the future.';
      }
    }

    // Mobile
    if (!mobile.trim()) {
      errors.mobile = 'Mobile number is required.';
    } else if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      errors.mobile = 'Mobile number must contain exactly 10 digits starting with 6-9.';
    }

    // PIN Code
    if (pinCode.trim() && !/^\d{6}$/.test(pinCode.trim())) {
      errors.pinCode = 'PIN code must contain exactly 6 digits.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) return;

    setSaving(true);
    try {
      await API.put('/citizens/profile', {
        name: name.trim(),
        date_of_birth: dob || null,
        gender,
        mobile: mobile.trim(),
        address: {
          house_number: houseNumber.trim() || 'N/A',
          street: street.trim() || 'Main Street',
          village: village.trim() || 'Ward Area',
          taluk: taluk.trim() || 'Urban',
          district: district.trim() || 'Bengaluru',
          state: state.trim() || 'Karnataka',
          pin_code: pinCode.trim() || '560001'
        }
      });
      setSuccessMessage('Profile and residential address saved successfully.');
      fetchProfile();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Maximum selectable date is today
  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">Loading citizen profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="card shadow-sm border-slate-200">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Citizen Profile & Address Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Maintain your personal information and address for verification assistance
            </p>
          </div>
          <span className="badge badge-submitted text-xs">Citizen ID: #{profile?.citizen_id}</span>
        </div>

        {successMessage && (
          <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg mb-4 border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4 border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} noValidate className="space-y-6 text-xs">
          {/* Section 1: Personal Information */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <h2 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> 1. Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="form-group mb-0">
                <label className="form-label">
                  Full Legal Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' }); }}
                  className={`form-input ${fieldErrors.name ? 'is-invalid' : ''}`}
                  required
                />
                {fieldErrors.name && <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{fieldErrors.name}</span>}
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  Date of Birth
                </label>
                <input
                  type="date"
                  max={todayStr}
                  value={dob}
                  onChange={e => { setDob(e.target.value); if (fieldErrors.dob) setFieldErrors({ ...fieldErrors, dob: '' }); }}
                  className={`form-input ${fieldErrors.dob ? 'is-invalid' : ''}`}
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Used for identity matching; not for legal determination.</span>
                {fieldErrors.dob && <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{fieldErrors.dob}</span>}
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="form-select"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <h2 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600" /> 2. Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="form-group mb-0">
                <label className="form-label">
                  Mobile Number (10 digits) <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  maxLength="10"
                  value={mobile}
                  onChange={e => { setMobile(e.target.value.replace(/\D/g, '')); if (fieldErrors.mobile) setFieldErrors({ ...fieldErrors, mobile: '' }); }}
                  className={`form-input font-mono ${fieldErrors.mobile ? 'is-invalid' : ''}`}
                  required
                />
                {fieldErrors.mobile && <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{fieldErrors.mobile}</span>}
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Email Address (Read-Only Account ID)</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="form-input bg-slate-100 text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Primary login identifier tied to account.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Address Information */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <h2 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> 3. Address Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="form-group mb-0">
                <label className="form-label">House / Door #</label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={e => setHouseNumber(e.target.value)}
                  placeholder="#45, 2nd Main"
                  className="form-input"
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Street / Road</label>
                <input
                  type="text"
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="Vijayanagar"
                  className="form-input"
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Village / Ward</label>
                <input
                  type="text"
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  placeholder="Ward 12"
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div className="form-group mb-0">
                <label className="form-label">Taluk</label>
                <input
                  type="text"
                  value={taluk}
                  onChange={e => setTaluk(e.target.value)}
                  placeholder="Bengaluru South"
                  className="form-input"
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  placeholder="Bengaluru"
                  className="form-input"
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">PIN Code (6 digits)</label>
                <input
                  type="text"
                  maxLength="6"
                  value={pinCode}
                  onChange={e => { setPinCode(e.target.value.replace(/\D/g, '')); if (fieldErrors.pinCode) setFieldErrors({ ...fieldErrors, pinCode: '' }); }}
                  placeholder="560040"
                  className={`form-input font-mono ${fieldErrors.pinCode ? 'is-invalid' : ''}`}
                />
                {fieldErrors.pinCode && <span className="form-feedback-error"><XCircle className="w-3.5 h-3.5" />{fieldErrors.pinCode}</span>}
              </div>
            </div>
          </div>

          {/* Reference Voter Record Card */}
          {profile?.voter_records && profile.voter_records.length > 0 && (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" /> Reference Electoral Record (Demonstration Metadata)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
                <div className="bg-white p-2.5 rounded border border-indigo-100">
                  <span className="text-slate-400 block text-[10px]">EPIC Reference</span>
                  <span className="font-bold text-blue-700">{profile.voter_records[0].epic_reference}</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-indigo-100">
                  <span className="text-slate-400 block text-[10px]">Constituency</span>
                  <span className="font-bold text-slate-800">{profile.voter_records[0].constituency_name}</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-indigo-100">
                  <span className="text-slate-400 block text-[10px]">Polling Station</span>
                  <span className="font-bold text-slate-800">{profile.voter_records[0].polling_station_name}</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-indigo-100">
                  <span className="text-slate-400 block text-[10px]">Record Status</span>
                  <span className="font-bold text-emerald-700">{profile.voter_records[0].record_status}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-6"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Profile Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
