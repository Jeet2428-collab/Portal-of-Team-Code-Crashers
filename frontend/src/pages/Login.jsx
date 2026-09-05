import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  Phone,
  Smartphone,
  Edit3
} from 'lucide-react';
import { authAPI } from '../services/api';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../services/firebase';
import confetti from 'canvas-confetti';

const Login = () => {
  const { login, loginWithPhoneOTP, loginWithFirebaseToken, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Login Mode: 'password' | 'phone_otp'
  const [loginMode, setLoginMode] = useState('password');

  // Password Login State
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);

  // Mobile OTP Login State
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState(1); // 1: Enter Phone, 2: Enter OTP
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState(null);
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState(null);
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Mobile OTP Resend Timer Countdown
  useEffect(() => {
    let interval = null;
    if (phoneResendTimer > 0) {
      interval = setInterval(() => {
        setPhoneResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phoneResendTimer]);

  // Forgot Password OTP State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Pass, 4: Success
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Resend Timer Countdown for Forgot Password
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const resetForgotState = () => {
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotLoading(false);
    setForgotError(null);
    setForgotSuccessMsg(null);
    setResendTimer(0);
  };

  const handleOpenForgotModal = () => {
    resetForgotState();
    if (emailOrId && emailOrId.includes('@')) {
      setForgotEmail(emailOrId.trim());
    }
    setShowForgotModal(true);
  };

  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
    resetForgotState();
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    if (e) e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);

    const emailToVerify = forgotEmail.trim().toLowerCase();
    if (!emailToVerify || !emailToVerify.includes('@')) {
      setForgotError('Please enter a valid registered email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authAPI.requestResetOTP(emailToVerify);
      setForgotLoading(false);
      setForgotStep(2);
      setResendTimer(60);
      setForgotSuccessMsg(res.data?.detail || `6-digit verification code sent to ${emailToVerify}`);
    } catch (err) {
      setForgotLoading(false);
      const errMsg = err.response?.data?.detail || 'Unable to find an account with this email address.';
      setForgotError(errMsg);
    }
  };

  // Step 2: Validate OTP Code (Unlocks Password Change)
  const handleValidateOTP = async (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);

    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setForgotError('Please enter the complete 6-digit verification code.');
      return;
    }

    setForgotLoading(true);
    try {
      const payload = {
        email: forgotEmail.trim().toLowerCase(),
        otp: cleanOtp,
      };

      const res = await authAPI.validateResetOTP(payload);
      setForgotLoading(false);
      if (res.data?.verified || res.status === 200) {
        setForgotStep(3);
        setForgotSuccessMsg('OTP Code Verified! You may now set your new password.');
      } else {
        setForgotError(res.data?.detail || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setForgotLoading(false);
      const errMsg = err.response?.data?.detail || 'Invalid or expired OTP code. Please check your inbox or request a new code.';
      setForgotError(errMsg);
    }
  };

  // Step 3: Set New Password & Update
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please verify.');
      return;
    }

    setForgotLoading(true);
    try {
      const payload = {
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
        new_password: forgotNewPassword,
        confirm_password: forgotConfirmPassword,
      };

      const res = await authAPI.verifyResetOTP(payload);
      setForgotLoading(false);
      if (res.data?.success || res.status === 200) {
        setForgotStep(4);
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setForgotError(res.data?.detail || 'Failed to update password.');
      }
    } catch (err) {
      setForgotLoading(false);
      const errMsg = err.response?.data?.detail || 'Failed to update password. Please try again.';
      setForgotError(errMsg);
    }
  };

  const handleFinishReset = () => {
    setEmailOrId(forgotEmail);
    setPassword('');
    handleCloseForgotModal();
  };

  // Password Login Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!emailOrId.trim() || !password.trim()) {
      setError('Please provide your Email/Membership ID and Password.');
      return;
    }

    const res = await login(emailOrId.trim(), password, rememberMe);
    if (res.success) {
      const isUserAdmin = res.user?.is_staff || res.user?.is_superuser || res.user?.role === 'admin' || res.user?.role?.toLowerCase().includes('admin');
      if (isUserAdmin) {
        navigate('/admin');
      } else {
        navigate(from);
      }
    } else {
      setError(res.error || 'Invalid credentials. Please verify and try again.');
    }
  };

  // Mobile OTP: Step 1 Request OTP Handler
  const handleRequestPhoneOTP = async (e) => {
    if (e) e.preventDefault();
    setPhoneError(null);
    setPhoneSuccessMsg(null);

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const normalized = cleanPhone.length === 12 && cleanPhone.startsWith('91')
      ? cleanPhone.slice(2)
      : (cleanPhone.length === 11 && cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone);

    if (!normalized || normalized.length !== 10) {
      setPhoneError('Please enter a valid 10-digit registered mobile number.');
      return;
    }

    setPhoneLoading(true);

    // 1. Try Google Firebase Phone Auth if Firebase is initialized
    if (auth) {
      try {
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (cErr) {
            // ignore
          }
          window.recaptchaVerifier = null;
        }

        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            if (window.recaptchaVerifier) {
              try { window.recaptchaVerifier.clear(); } catch (e) {}
              window.recaptchaVerifier = null;
            }
          }
        });

        const appVerifier = window.recaptchaVerifier;
        const formattedPhone = `+91${normalized}`;
        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setPhoneLoading(false);
        setPhoneStep(2);
        setPhoneResendTimer(60);
        setPhoneSuccessMsg(`SMS verification code dispatched by Google to +91 ******${normalized.slice(-4)}`);
        return;
      } catch (fbError) {
        console.error('[Firebase Phone Auth Error]', fbError.code, fbError.message);
        setPhoneError(`Google SMS error (${fbError.code || 'error'}). Please check Firebase settings or use test code.`);
      }
    }

    // 2. Fallback to backend OTP endpoint (supports local dev mode & email dispatch)
    try {
      const res = await authAPI.requestMobileLoginOTP(normalized);
      setPhoneLoading(false);
      setPhoneStep(2);
      setPhoneResendTimer(60);
      setPhoneSuccessMsg(res.data?.detail || `6-digit verification OTP sent to ${res.data?.masked_phone || '+91 ' + normalized}`);
    } catch (err) {
      setPhoneLoading(false);
      const errMsg = err.response?.data?.detail || 'Unable to find an account with this registered mobile number.';
      setPhoneError(errMsg);
    }
  };

  // Mobile OTP: Step 2 Verify OTP & Login Handler
  const handleVerifyPhoneOTP = async (e) => {
    e.preventDefault();
    setPhoneError(null);

    const cleanOtp = phoneOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setPhoneError('Please enter the full 6-digit verification code.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const normalized = cleanPhone.length === 12 && cleanPhone.startsWith('91')
      ? cleanPhone.slice(2)
      : (cleanPhone.length === 11 && cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone);

    setPhoneLoading(true);

    // 1. If Firebase confirmation result is available, verify via Firebase
    if (confirmationResult) {
      try {
        const userCredential = await confirmationResult.confirm(cleanOtp);
        const idToken = await userCredential.user.getIdToken();
        const res = await loginWithFirebaseToken(idToken, normalized, rememberMe);
        setPhoneLoading(false);

        if (res.success) {
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.6 }
          });
          const isUserAdmin = res.user?.is_staff || res.user?.is_superuser || res.user?.role === 'admin' || res.user?.role?.toLowerCase().includes('admin');
          if (isUserAdmin) {
            navigate('/admin');
          } else {
            navigate(from);
          }
          return;
        } else {
          setPhoneError(res.error || 'Firebase authentication failed.');
          return;
        }
      } catch (fbConfirmErr) {
        console.warn('[Firebase confirmation fallback to direct OTP]:', fbConfirmErr);
      }
    }

    // 2. Direct backend verification fallback
    const res = await loginWithPhoneOTP(normalized, cleanOtp, rememberMe);
    setPhoneLoading(false);

    if (res.success) {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 }
      });
      const isUserAdmin = res.user?.is_staff || res.user?.is_superuser || res.user?.role === 'admin' || res.user?.role?.toLowerCase().includes('admin');
      if (isUserAdmin) {
        navigate('/admin');
      } else {
        navigate(from);
      }
    } else {
      setPhoneError(res.error || 'Invalid OTP code. Please check and try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      {/* Invisible reCAPTCHA container for Google Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      <div className="glass-panel-glow p-8 rounded-3xl space-y-6 border border-slate-800 shadow-2xl relative">
        
        {/* Top Logo & Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-cyan-500/40 shadow-xl shadow-cyan-500/25 mx-auto bg-slate-900 flex items-center justify-center p-0.5">
            <img
              src="/cc-square.jpeg"
              alt="Code Crashers"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Portal Sign In</h1>
          <p className="text-xs text-gray-400">
            Sign in with your registered credentials or verified mobile number.
          </p>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setLoginMode('password');
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              loginMode === 'password'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/40'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('phone_otp');
              setPhoneError(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              loginMode === 'phone_otp'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/40'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile OTP</span>
          </button>
        </div>

        {/* ================= MODE 1: PASSWORD LOGIN ================= */}
        {loginMode === 'password' && (
          <>
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 flex items-start gap-2.5 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Membership ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">
                  Email or Membership ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    placeholder="e.g. name@gmail.com or CC26-XXX-XXX"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl glass-input text-sm placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-300">Password</label>
                  <button
                    type="button"
                    onClick={handleOpenForgotModal}
                    className="text-[11px] text-cyan-400 hover:underline font-medium flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your registered password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm placeholder:text-gray-500"
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

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span>Remember session credentials</span>
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* ================= MODE 2: MOBILE OTP LOGIN ================= */}
        {loginMode === 'phone_otp' && (
          <div className="space-y-4">
            {phoneError && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 flex items-start gap-2.5 text-red-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{phoneError}</span>
              </div>
            )}

            {phoneSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-start gap-2.5 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{phoneSuccessMsg}</span>
              </div>
            )}

            {/* Step 1: Phone Number Input */}
            {phoneStep === 1 && (
              <form onSubmit={handleRequestPhoneOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-300">
                      Registered Mobile Number
                    </label>
                    <span className="text-[11px] text-cyan-400/80">Members Only</span>
                  </div>

                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        +91
                      </span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) setPhone(val);
                      }}
                      placeholder="Enter 10-digit mobile number"
                      autoFocus
                      required
                      className="w-full pl-16 pr-3.5 py-2.5 rounded-xl glass-input text-sm tracking-wider font-mono placeholder:text-gray-500 placeholder:tracking-normal placeholder:font-sans"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Enter the 10-digit mobile number provided during member registration.
                  </p>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
                    />
                    <span>Remember session credentials</span>
                  </label>
                </div>

                {/* Send OTP Button */}
                <button
                  type="submit"
                  disabled={phoneLoading || phone.replace(/\D/g, '').length !== 10}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {phoneLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: 6-Digit OTP Verification Input */}
            {phoneStep === 2 && (
              <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
                {/* Number Summary Card */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Code dispatched to</p>
                      <p className="text-xs font-bold text-white font-mono">
                        +91 ******{phone.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep(1);
                      setPhoneOtp('');
                      setPhoneError(null);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-medium px-2 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Change</span>
                  </button>
                </div>

                {/* OTP Input */}
                <div className="space-y-1.5 text-center">
                  <label className="text-xs font-medium text-gray-300 block text-left">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    autoFocus
                    required
                    className="w-full py-3.5 rounded-xl glass-input text-center text-2xl font-mono font-bold tracking-[0.5em] text-cyan-300 placeholder:text-gray-600 focus:border-cyan-400 transition"
                  />
                  <p className="text-[11px] text-gray-400 text-left">
                    The verification code expires in 5 minutes.
                  </p>
                </div>

                {/* Resend OTP Timer & Actions */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-gray-400">Didn't get the code?</span>
                  {phoneResendTimer > 0 ? (
                    <span className="text-cyan-400/80 font-mono font-medium">
                      Resend code in {phoneResendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestPhoneOTP}
                      disabled={phoneLoading}
                      className="text-cyan-400 hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${phoneLoading ? 'animate-spin' : ''}`} />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                {/* Verify and Login Button */}
                <button
                  type="submit"
                  disabled={phoneLoading || phoneOtp.length !== 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {phoneLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Access Workspace</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPhoneStep(1);
                    setPhoneOtp('');
                    setPhoneError(null);
                  }}
                  className="w-full text-center text-xs text-gray-400 hover:text-white transition py-1 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Mobile Number</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Register CTA */}
        <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-gray-400">
          Not registered yet?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
            Create an Account
          </Link>
        </div>

      </div>

      {/* MULTI-STAGE OTP FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div 
          onClick={handleCloseForgotModal}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md"
        >
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div 
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full glass-panel-glow p-6 sm:p-7 rounded-3xl border border-slate-700 shadow-2xl space-y-5 relative my-auto"
            >
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Password Recovery</h3>
                  <p className="text-[11px] text-gray-400">OTP Email Verification</p>
                </div>
              </div>

              <button
                onClick={handleCloseForgotModal}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Notification */}
            {forgotError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* Success / Info Notification */}
            {forgotSuccessMsg && forgotStep !== 4 && (
              <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 text-xs flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            {/* ----------------- STAGE 1: ENTER REGISTERED EMAIL ----------------- */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed">
                  Enter your registered account email address. We will generate and dispatch a secure 6-digit one-time verification code.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Registered Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. name@gmail.com"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl glass-input text-xs placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseForgotModal}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-gray-300 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5"
                  >
                    {forgotLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Send 6-Digit OTP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ----------------- STAGE 2: ENTER & VALIDATE OTP ----------------- */}
            {forgotStep === 2 && (
              <form onSubmit={handleValidateOTP} className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono block">DESTINATION INBOX</span>
                    <span className="text-white font-medium truncate max-w-[200px] block">{forgotEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Change Email
                  </button>
                </div>

                {/* 6-Digit OTP Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-300">Enter 6-Digit OTP</label>
                    {resendTimer > 0 ? (
                      <span className="text-[11px] text-gray-400 font-mono">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestOTP}
                        disabled={forgotLoading}
                        className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Resend Code
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    required
                    autoFocus
                    className="w-full text-center tracking-[0.6em] font-mono text-xl font-bold py-3 rounded-xl glass-input placeholder:text-gray-600 focus:border-cyan-400 text-cyan-300"
                  />
                  <p className="text-[11px] text-gray-400 text-center">
                    Check your inbox and spam folder for the one-time code.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-gray-300 hover:text-white transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || forgotOtp.length !== 6}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify OTP</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ----------------- STAGE 3: ENTER NEW PASSWORD (UNLOCKED ONLY AFTER OTP VERIFICATION) ----------------- */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>OTP Verified for <strong>{forgotEmail}</strong>. Enter your new password below:</span>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      autoFocus
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-cyan-400 transition"
                      tabIndex={-1}
                      title={showForgotNewPassword ? "Hide password" : "Show password"}
                    >
                      {showForgotNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showForgotConfirmPassword ? "text" : "password"}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-cyan-400 transition"
                      tabIndex={-1}
                      title={showForgotConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showForgotConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                  >
                    {forgotLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ----------------- STAGE 4: SUCCESS CONFIRMATION ----------------- */}
            {forgotStep === 4 && (
              <div className="space-y-5 text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Password Updated Successfully!</h4>
                  <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">
                    Your new credentials are now active. You can proceed to sign in with your email and updated password.
                  </p>
                </div>

                <button
                  onClick={handleFinishReset}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-1.5"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
      )}

    </div>
  );
};

export default Login;
