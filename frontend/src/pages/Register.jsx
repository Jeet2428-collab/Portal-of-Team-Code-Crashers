import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  Sparkles, 
  User, 
  GraduationCap, 
  Lock, 
  ArrowRight,
  AlertCircle,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    gender: 'Male',
    dept: 'dev',
    year: '1st Year',
    sem: '1st Semester',
    classRoll: '',
    univRoll: '',
    avatar: '',
    password: '',
    confirmPassword: '',
    termsAgreed: false,
  });

  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const departments = [
    { code: 'ui/ux', label: 'UI/UX DESIGNER' },
    { code: 'dev', label: 'DEVELOPER' },
    { code: 'doc', label: 'DOCUMANTARY' },
    { code: 'res', label: 'RESEARCH' },
    { code: 'iot', label: 'IOT' },
    { code: 'mkt', label: 'MARKETING' },
  ];

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [
    '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
    '5th Semester', '6th Semester', '7th Semester', '8th Semester'
  ];

  const handleAvatarFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      setAvatarPreview(base64Data);
      setFormData((prev) => ({ ...prev, avatar: base64Data }));
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    setAvatarPreview(null);
    setFormData((prev) => ({ ...prev, avatar: '' }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = value;
    
    // Number validations / filtering
    if (name === 'contact') {
      // Allow only numbers, max 10 digits
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'univRoll') {
      // Allow only numbers
      processedValue = value.replace(/\D/g, '');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue,
    }));
  };

  const previewId = `CC26-${(formData.dept || 'dev').toUpperCase()}-XXX`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!formData.name.trim() || !formData.email.trim() || !formData.contact.trim() || !formData.classRoll.trim() || !formData.univRoll.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    // Contact number validation: must be exactly 10 digits
    if (!/^\d{10}$/.test(formData.contact.trim())) {
      setError('Contact number must be a valid 10-digit number.');
      return;
    }

    // University roll validation: must be numeric digits only
    if (!/^\d+$/.test(formData.univRoll.trim())) {
      setError('University roll number must contain numbers only.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!formData.termsAgreed) {
      setError('You must accept the Code Crashers Terms & Conditions.');
      return;
    }

    const res = await register(formData);
    if (res.success) {
      setSuccessData(res);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      setError(res.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      
      {/* SUCCESS MODAL ONCE REGISTERED */}
      {successData ? (
        <div className="glass-panel-glow p-8 rounded-3xl text-center space-y-6 max-w-lg mx-auto border border-cyan-500/40 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Registration Complete</h2>
            <p className="text-sm text-gray-300">
              Your 1-Year Membership has been generated and activated.
            </p>
          </div>

          {/* Generated ID Badge */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 text-center space-y-1">
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">ASSIGNED MEMBERSHIP ID</span>
            <p className="text-2xl font-black font-mono text-cyan-300 tracking-wider">
              {successData.memberId}
            </p>
            <p className="text-[11px] text-emerald-400 font-mono">Status: Active</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:from-cyan-400 hover:to-blue-500 transition flex items-center justify-center gap-2"
            >
              Go to Member Dashboard <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/membership')}
              className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition"
            >
              View ID Card
            </button>
          </div>
        </div>
      ) : (
        /* FIELD REGISTRATION FORM */
        <div className="glass-panel rounded-3xl p-6 sm:p-10 space-y-8 border border-slate-800 shadow-2xl">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
                <UserPlus className="w-3.5 h-3.5" /> Onboarding Gateway
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Member Registration
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Fill in your credentials to receive your verified membership pass.
              </p>
            </div>

            {/* Live ID Preview badge */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 text-right">
              <span className="text-[9px] text-gray-400 font-mono uppercase block">1-Year ID Preview</span>
              <span className="text-sm font-mono font-bold text-cyan-400">{previewId}</span>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-3 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECTION 1: PERSONAL & CONTACT */}
            <div className="space-y-5">
              <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-cyan-400" /> 1. Personal & Identity Details
              </h3>

              {/* Avatar Photo Upload Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group shrink-0">
                  <img
                    src={
                      avatarPreview ||
                      formData.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.classRoll || formData.name || 'new-member'}`
                    }
                    alt="Member Avatar Preview"
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-cyan-500/40 bg-slate-950 shadow-lg shadow-cyan-500/10"
                  />
                  <label 
                    htmlFor="avatar-upload"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center cursor-pointer shadow-lg shadow-cyan-500/30 transition transform group-hover:scale-105"
                    title="Upload Custom Photo"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => handleAvatarFile(e.target.files?.[0])}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-semibold text-white">Digital Pass Photo</span>
                    {avatarPreview ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        Custom Image Attached
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                        Auto Bot Avatar Ready
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Upload your profile portrait for your official holographic ID card. Supports PNG, JPG, or WEBP (Max 5MB).
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                    <label
                      htmlFor="avatar-upload"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {avatarPreview ? 'Change Photo' : 'Upload Portrait'}
                    </label>

                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleAvatarRemove}
                        className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-xs font-medium text-red-300 border border-red-500/30 flex items-center gap-1.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Subhadeep Roy"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm placeholder:text-gray-500"
                  />
                </div>

                {/* 2. Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. subhadeep@gmail.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm placeholder:text-gray-500"
                  />
                </div>

                {/* 3. Contact Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Contact Number (10 Digits) *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* 4. Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Gender *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Male', 'Female', 'Others'].map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`py-2 rounded-xl text-xs font-medium border transition ${
                        formData.gender === g
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-semibold'
                          : 'bg-slate-900/60 border-slate-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 2: ACADEMIC CREDENTIALS */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-blue-400" /> 2. Department & Academic Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 5. Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Interested Department *</label>
                  <select
                    name="dept"
                    value={formData.dept}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm bg-slate-900"
                  >
                    {departments.map((d) => (
                      <option key={d.code} value={d.code} className="bg-slate-950 text-white">
                        {d.label} ({d.code.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Academic Year */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Academic Year *</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm bg-slate-900"
                  >
                    {years.map((y) => (
                      <option key={y} value={y} className="bg-slate-950 text-white">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Semester */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Semester *</label>
                  <select
                    name="sem"
                    value={formData.sem}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm bg-slate-900"
                  >
                    {semesters.map((s) => (
                      <option key={s} value={s} className="bg-slate-950 text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 8. College Roll Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">College Roll Number (C/Roll) *</label>
                  <input
                    type="text"
                    name="classRoll"
                    value={formData.classRoll}
                    onChange={handleChange}
                    placeholder="e.g. 24/EE/XXX"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-gray-500"
                  />
                </div>

                {/* 9. University Roll Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">University Roll Number (U/Roll) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="univRoll"
                    value={formData.univRoll}
                    onChange={handleChange}
                    placeholder="e.g. 10900124001 (Digits only)"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-mono placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: SECURITY & ACCESS */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> 3. Portal Security & Password
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 10. Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Create Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl glass-input text-sm placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-cyan-400 transition"
                      tabIndex={-1}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 11. Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl glass-input text-sm placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-cyan-400 transition"
                      tabIndex={-1}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="termsAgreed"
                  checked={formData.termsAgreed}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
                />
                <span className="text-xs text-gray-300 leading-relaxed">
                  I agree to the <Link to="/faq" className="text-cyan-400 hover:underline">Code Crashers Community Guidelines & System Rules</Link>. I understand that falsified credentials will result in membership demotion or account termination.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
              <p className="text-xs text-gray-400">
                Already registered?{' '}
                <Link to="/login" className="text-cyan-400 hover:underline font-medium">
                  Sign in here
                </Link>
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Registering...
                  </span>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      )}

    </div>
  );
};

export default Register;
