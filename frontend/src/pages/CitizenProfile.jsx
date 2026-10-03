import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { User, MapPin, Award, Save, CheckCircle } from 'lucide-react';

export default function CitizenProfile() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [mobile, setMobile] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [village, setVillage] = useState('');
  const [taluk, setTaluk] = useState('');
  const [district, setDistrict] = useState('');
  const [pinCode, setPinCode] = useState('');

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
      setPinCode(p.pin_code || '');

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await API.put('/citizens/profile', {
        name,
        date_of_birth: dob,
        gender,
        mobile,
        address: {
          house_number: houseNumber,
          street,
          village,
          taluk,
          district,
          state: 'Karnataka',
          pin_code: pinCode
        }
      });
      setMessage('Profile updated successfully!');
      fetchProfile();
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">Loading profile data...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-blue-600" /> Citizen Profile & Address Management
        </h2>

        {message && (
          <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded mb-4 border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Basic Personal Details */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Personal Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Email (Read Only)</label>
                <input type="email" value={profile?.email || ''} disabled className="w-full p-2 border rounded bg-slate-100 text-slate-500" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Date of Birth</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Gender</label>
                <select value={gender} onChange={e => setGender(e.target.value)} className="w-full p-2 border rounded">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Mobile Contact</label>
                <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full p-2 border rounded" />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <MapPin className="w-4 h-4 text-blue-600" /> Residential Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">House / Door #</label>
                <input type="text" value={houseNumber} onChange={e => setHouseNumber(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Street / Layout</label>
                <input type="text" value={street} onChange={e => setStreet(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Village / Ward</label>
                <input type="text" value={village} onChange={e => setVillage(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Taluk</label>
                <input type="text" value={taluk} onChange={e => setTaluk(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-semibold mb-1">District</label>
                <input type="text" value={district} onChange={e => setDistrict(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block font-semibold mb-1">PIN Code (6 digits)</label>
                <input type="text" value={pinCode} onChange={e => setPinCode(e.target.value)} maxLength="6" className="w-full p-2 border rounded" />
              </div>
            </div>
          </div>

          {/* Reference Voter Record Info */}
          {profile?.voter_records && profile.voter_records.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1">
                <Award className="w-4 h-4 text-indigo-600" /> Reference Voter Record Information
              </h3>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block">EPIC Reference</span>
                  <span className="font-bold text-blue-700">{profile.voter_records[0].epic_reference}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Constituency</span>
                  <span className="font-bold text-slate-700">{profile.voter_records[0].constituency_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Polling Station</span>
                  <span className="font-bold text-slate-700">{profile.voter_records[0].polling_station_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Record Status</span>
                  <span className="font-bold text-emerald-700">{profile.voter_records[0].record_status}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
