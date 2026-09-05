import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MemberCard from '../components/MemberCard';
import { 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  GraduationCap, 
  Hash,
  Edit3,
  Camera,
  Upload,
  Trash2,
  Save,
  X,
  User,
  Phone,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const MemberDashboard = () => {
  const { user, updateProfile } = useAuth();

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editError, setEditError] = useState(null);

  const [editData, setEditData] = useState({
    name: user?.name || '',
    contact: user?.contact || '',
    bio: user?.bio || '',
    year: user?.year || '1st Year',
    sem: user?.sem || user?.semester || '1st Semester',
    avatar: user?.avatar || '',
  });

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        contact: user.contact || '',
        bio: user.bio || '',
        year: user.year || '1st Year',
        sem: user.sem || user.semester || '1st Semester',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleAvatarFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setEditError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      setEditData((prev) => ({ ...prev, avatar: base64Data }));
      setEditError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
    setEditData((prev) => ({ ...prev, avatar: newAvatar }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError(null);
    setSaveSuccess(false);

    // Validate 10-digit contact number if provided
    if (editData.contact && !/^\d{10}$/.test(editData.contact.trim())) {
      setEditError('Contact number must be a valid 10-digit number.');
      return;
    }

    setIsSaving(true);

    try {
      const res = await updateProfile(editData);
      if (res?.success) {
        setSaveSuccess(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
        setTimeout(() => {
          setShowEditModal(false);
          setSaveSuccess(false);
        }, 1200);
      } else {
        setEditError('Failed to update profile. Please try again.');
      }
    } catch {
      setEditError('Error updating profile information.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentUser = user || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* 1. WELCOME BANNER & SUMMARY */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.membershipId || currentUser.username || 'CC'}`}
                alt={currentUser.name || 'Member'}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-cyan-500/40 shadow-xl bg-slate-950"
              />
              <button
                onClick={() => setShowEditModal(true)}
                className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-[10px] font-medium"
                title="Change Avatar"
              >
                <Camera className="w-5 h-5 mb-0.5 text-cyan-400" />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase font-semibold">
                  {currentUser.role || 'Member'}
                </span>
                <span className="text-xs text-gray-400 font-mono">ID: {currentUser.membershipId || currentUser.membership_id || 'Pending'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {currentUser.name || currentUser.username || 'Member Workspace'}
              </h1>
              <p className="text-xs text-gray-300">
                {currentUser.department || 'Department Registered'} {currentUser.year ? `• ${currentUser.year}` : ''} {currentUser.sem ? `(${currentUser.sem})` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 shadow-md"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              Edit Profile & Avatar
            </button>

            <Link
              to="/membership"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Expanded Card View
            </Link>
          </div>

        </div>

        {/* Dynamic Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Valid Term</span>
            </div>
            <p className="text-sm font-bold text-white font-mono mt-1">{currentUser.expiryDate || currentUser.expiry_date || '1-Year Term'}</p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Academic Stream</span>
            </div>
            <p className="text-sm font-bold text-cyan-300 font-mono mt-1 uppercase truncate">{currentUser.department || 'Engineering'}</p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Account Status</span>
            </div>
            <p className="text-sm font-bold text-emerald-400 font-mono mt-1">Active / Verified</p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              <span>University Roll</span>
            </div>
            <p className="text-sm font-bold text-indigo-300 font-mono mt-1">{currentUser.univRoll || currentUser.university_roll || '—'}</p>
          </div>
        </div>
      </div>

      {/* 2. MAIN GRID: MEMBERSHIP CARD PREVIEW + PROFILE CREDENTIALS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Interactive Holographic Card (Left 6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Digital Membership Pass
            </h2>
            <span className="text-[11px] text-gray-400 font-mono">Interactive 3D Preview</span>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center min-h-[380px]">
            <MemberCard member={currentUser} interactive={true} />
          </div>
        </div>

        {/* Academic Credentials (Right 6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-400" /> Academic & Portal Profile
            </h2>
            <span className="text-[11px] text-emerald-400 font-mono">Verified Record</span>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-gray-400 font-mono uppercase text-[10px]">NAME</span>
                <p className="text-sm font-bold text-white truncate">{currentUser.name || currentUser.username || '—'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-gray-400 font-mono uppercase text-[10px]">EMAIL ADDRESS</span>
                <p className="text-sm font-bold text-white truncate">{currentUser.email || '—'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-gray-400 font-mono uppercase text-[10px]">DEPARTMENT</span>
                <p className="text-sm font-bold text-cyan-300 truncate">{currentUser.department || '—'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-gray-400 font-mono uppercase text-[10px]">SEMESTER & YEAR</span>
                <p className="text-sm font-bold text-white truncate">{currentUser.sem || '—'} • {currentUser.year || '—'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-gray-400 font-mono uppercase text-[10px]">COLLEGE ROLL NUMBER</span>
                <p className="text-sm font-bold font-mono text-cyan-300 truncate">{currentUser.classRoll || currentUser.class_roll || '—'}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-gray-400 font-mono uppercase text-[10px]">UNIVERSITY ROLL NUMBER</span>
                <p className="text-sm font-bold font-mono text-cyan-300 truncate">{currentUser.univRoll || currentUser.university_roll || '—'}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200/90 leading-relaxed">
              💡 <strong>Part 1 & Part 2 Status:</strong> Your credentials and academic roll details are linked to your assigned Membership ID.
            </div>
          </div>
        </div>

      </div>

      {/* 3. EDIT PROFILE & AVATAR MODAL */}
      {showEditModal && (
        <div 
          onClick={() => setShowEditModal(false)}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md"
        >
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div 
              onClick={(e) => e.stopPropagation()}
              className="max-w-xl w-full glass-panel-glow p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6 relative my-auto"
            >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Profile & Avatar</h3>
                  <p className="text-xs text-gray-400">Update your portrait photo and academic information</p>
                </div>
              </div>

              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <span>{editError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Profile and avatar updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* Avatar Section */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <span className="text-xs font-mono uppercase text-gray-400 tracking-wider block">
                  1. Profile Portrait / Avatar
                </span>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={
                        editData.avatar ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.membershipId || currentUser.username || 'CC'}`
                      }
                      alt="Avatar Preview"
                      className="w-20 h-20 rounded-2xl object-cover ring-2 ring-cyan-500/50 bg-slate-950 shadow-md"
                    />
                    <label
                      htmlFor="modal-avatar-upload"
                      className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center cursor-pointer shadow transition"
                      title="Upload New Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </label>
                    <input
                      id="modal-avatar-upload"
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => handleAvatarFile(e.target.files?.[0])}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <p className="text-xs text-gray-300">
                      Upload a new photo (PNG, JPG, WEBP max 5MB) or generate a random algorithmic avatar.
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <label
                        htmlFor="modal-avatar-upload"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-medium cursor-pointer transition flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Choose Photo
                      </label>

                      <button
                        type="button"
                        onClick={handleGenerateRandomAvatar}
                        className="px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Random Bot
                      </button>

                      {editData.avatar && (
                        <button
                          type="button"
                          onClick={() => setEditData((prev) => ({ ...prev, avatar: '' }))}
                          className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 text-xs font-medium transition flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal & Academic Info */}
              <div className="space-y-4">
                <span className="text-xs font-mono uppercase text-gray-400 tracking-wider block">
                  2. Personal & Academic Credentials
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  {/* Contact */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" /> Contact Number (10 Digits)
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={editData.contact}
                      onChange={(e) => setEditData({ ...editData, contact: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                    />
                  </div>

                  {/* Academic Year */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-400" /> Academic Year
                    </label>
                    <select
                      value={editData.year}
                      onChange={(e) => setEditData({ ...editData, year: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-slate-900"
                    >
                      {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((y) => (
                        <option key={y} value={y} className="bg-slate-950 text-white">
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Semester */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Current Semester
                    </label>
                    <select
                      value={editData.sem}
                      onChange={(e) => setEditData({ ...editData, sem: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-slate-900"
                    >
                      {[
                        '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
                        '5th Semester', '6th Semester', '7th Semester', '8th Semester'
                      ].map((s) => (
                        <option key={s} value={s} className="bg-slate-950 text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Bio / Technical Interests</label>
                  <textarea
                    rows={2}
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    placeholder="Short summary of your engineering interests, domains, and goals..."
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs resize-none"
                  />
                </div>

                {/* Locked Administrative fields note */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-gray-400">
                  🔒 <strong>Locked Records:</strong> Department (<span className="text-cyan-300">{currentUser.department || 'dev'}</span>), College Roll, and University Roll are bound to your verified Membership Pass. To update these, contact a Lead Admin.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
                >
                  {isSaving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Profile</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      </div>
      )}

    </div>
  );
};

export default MemberDashboard;
