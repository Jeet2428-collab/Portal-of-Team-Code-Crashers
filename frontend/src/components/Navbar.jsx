import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import { 
  Terminal, 
  Shield, 
  User, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Menu, 
  X, 
  Layers, 
  HelpCircle, 
  Users, 
  CheckCircle,
  Sparkles,
  ClipboardList,
  Bell,
  FolderKanban,
  Megaphone,
  Calendar,
  ShieldCheck,
  AtSign,
  Check,
  CheckCheck,
  ExternalLink,
  Clock,
  ArrowRight
} from 'lucide-react';

const getCategoryIcon = (category, type) => {
  if (type === 'project' || category === 'Project Assignment') {
    return <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />;
  }
  switch (category) {
    case 'Event': return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
    case 'Rules & Regulations': return <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />;
    case 'Mentioned Member only': return <AtSign className="w-3.5 h-3.5 text-rose-400" />;
    default: return <Megaphone className="w-3.5 h-3.5 text-cyan-400" />;
  }
};

const getCategoryBadge = (category, type) => {
  if (type === 'project' || category === 'Project Assignment') {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }
  switch (category) {
    case 'Event': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'Rules & Regulations': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'Mentioned Member only': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    default: return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
  }
};

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const notifRef = useRef(null);
  const previousUnreadRef = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Synthetic Web Audio Cyber Chime / Beep
  const playNotificationBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // First tone (D5 ~ 587Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.18);

      // Second tone (A5 ~ 880Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.38);
    } catch {
      // Audio playback before user gesture or unavailable
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsAPI.getAll();
      if (res?.data) {
        const count = res.data.unread_count || 0;
        if (count > previousUnreadRef.current && previousUnreadRef.current > 0) {
          playNotificationBeep();
        }
        previousUnreadRef.current = count;
        setNotifications(res.data.notifications || []);
        setUnreadCount(count);
      }
    } catch {
      // Silently fail — don't block UI
    }
  }, [isAuthenticated]);

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close notification panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    // 1. Optimistic UI update immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    previousUnreadRef.current = 0;

    // 2. Dispatch backend sync
    try {
      await notificationsAPI.markAllRead({ user_id: user?.id });
    } catch (err) {
      console.warn('Mark all read backend sync error:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const linkClasses = (path) => `
    px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5
    ${isActive(path) 
      ? 'bg-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]' 
      : 'text-gray-300 hover:text-white hover:bg-slate-800/60'}
  `;

  return (
    <>
      <nav className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.35)] group-hover:scale-105 group-hover:ring-cyan-400 transition-all flex items-center justify-center bg-slate-900 shrink-0">
              <img
                src="/cc-square.jpeg"
                alt="Code Crashers"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-blue-400">
                TEAM<span className="text-cyan-400"> CC</span>
              </span>
              <span className="text-[10px] text-gray-400 tracking-widest font-mono uppercase -mt-1">
                Code Crashers
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className={linkClasses('/')}>
              Home
            </Link>
            <Link to="/team" className={linkClasses('/team')}>
              <Users className="w-4 h-4" />
              Team Members
            </Link>
            <Link to="/faq" className={linkClasses('/faq')}>
              <HelpCircle className="w-4 h-4" />
              Guidelines / FAQ
            </Link>

            {/* Authenticated Member Links */}
            {isAuthenticated && (
              <>
                <Link to="/projects" className={linkClasses('/projects')}>
                  <FolderKanban className="w-4 h-4 text-cyan-400" />
                  Projects
                </Link>
                <Link to="/dashboard" className={linkClasses('/dashboard')}>
                  <Layers className="w-4 h-4" />
                  Dashboard
                </Link>
              </>
            )}

            {/* Admin-Only Links */}
            {isAdmin && (
              <div className="flex items-center pl-2 border-l border-slate-700/60 ml-2 space-x-1">
                <Link to="/admin" className={linkClasses('/admin')}>
                  <Shield className="w-4 h-4 text-amber-400" />
                  Admin
                </Link>
              </div>
            )}
          </div>

          {/* User Auth Buttons / Profile Dropdown */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    id="notification-bell-btn"
                    onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                    className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all focus:outline-none"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5 text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Panel */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-96 sm:w-[440px] rounded-3xl overflow-hidden z-50 border border-slate-700/80 bg-slate-950/95 backdrop-blur-2xl shadow-2xl shadow-black/80">
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">Notifications</span>
                              {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                                  {unreadCount} new
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400">Click any notification to read full details</p>
                          </div>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAllRead();
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium cursor-pointer border border-cyan-500/30 shrink-0"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      {/* Notification List */}
                      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                              <Bell className="w-5 h-5 text-gray-600" />
                            </div>
                            <p className="text-sm font-semibold text-gray-300">No notifications yet</p>
                            <p className="text-xs text-gray-500 max-w-xs">New project assignments, notices, and team circulars will appear here in real-time.</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const isProject = notif.type === 'project';
                            return (
                              <button
                                key={notif.id}
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkRead(notif.id);
                                  setNotifOpen(false);
                                  setSelectedNotif(notif);
                                }}
                                className={`w-full text-left relative p-4 hover:bg-slate-850/80 transition-all cursor-pointer group focus:outline-none ${!notif.is_read ? (isProject ? 'bg-emerald-500/5' : 'bg-cyan-500/5') : ''}`}
                              >
                                {/* Unread dot */}
                                {!notif.is_read && (
                                  <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${isProject ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]'}`} />
                                )}
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${getCategoryBadge(notif.notice_category, notif.type)}`}>
                                    {getCategoryIcon(notif.notice_category, notif.type)}
                                  </div>
                                  <div className="flex-1 min-w-0 pr-4">
                                    <p className={`text-xs leading-snug line-clamp-1 group-hover:text-cyan-300 transition-colors ${!notif.is_read ? 'text-white font-bold' : 'text-gray-200 font-semibold'}`}>
                                      {notif.title || notif.notice_title}
                                    </p>
                                    
                                    {notif.message && (
                                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                                        {notif.message}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono font-semibold ${getCategoryBadge(notif.notice_category, notif.type)}`}>
                                        {notif.notice_category || (isProject ? 'Project' : 'Announcement')}
                                      </span>
                                      <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                                        <Clock className="w-3 h-3 text-gray-600" />
                                        {notif.notice_date || (notif.created_at ? new Date(notif.created_at).toLocaleDateString() : '')}
                                      </span>
                                      <span className="text-[10px] text-cyan-400/90 font-mono ml-auto group-hover:text-cyan-300 flex items-center gap-1 font-semibold">
                                        Read Details &rarr;
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/60 grid grid-cols-2 gap-2">
                        <Link
                          to="/notices"
                          onClick={() => setNotifOpen(false)}
                          className="py-2 text-center text-xs text-cyan-400 hover:text-cyan-300 font-medium rounded-xl hover:bg-slate-800 transition"
                        >
                          View Notices &rarr;
                        </Link>
                        <Link
                          to="/projects"
                          onClick={() => setNotifOpen(false)}
                          className="py-2 text-center text-xs text-emerald-400 hover:text-emerald-300 font-medium rounded-xl hover:bg-slate-800 transition"
                        >
                          View Projects &rarr;
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all focus:outline-none"
                  >
                    <img
                      src={user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/30"
                    />
                    <div className="text-left leading-tight hidden lg:block">
                      <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user?.name || 'User'}</p>
                      <p className="text-[10px] text-cyan-400 font-mono">{user?.membershipId || 'Member'}</p>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl glass-panel-glow py-2 z-50 border border-slate-700">
                      <div className="px-4 py-2 border-b border-slate-800">
                        <p className="text-xs text-gray-400">Signed in as</p>
                        <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase ${isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                          {user?.role || 'Member'}
                        </span>
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-slate-800 hover:text-white"
                      >
                        <User className="w-4 h-4 text-cyan-400" />
                        Member Dashboard
                      </Link>

                      {isAdmin && (
                        <>
                          <Link
                            to="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-slate-800 hover:text-white"
                          >
                            <Shield className="w-4 h-4 text-amber-400" />
                            Admin Console
                          </Link>
                          <Link
                            to="/notices"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-slate-800 hover:text-white"
                          >
                            <Bell className="w-4 h-4 text-cyan-400" />
                            Notice Sheets
                          </Link>
                          <Link
                            to="/admin/attendance"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-slate-800 hover:text-white"
                          >
                            <ClipboardList className="w-4 h-4 text-emerald-400" />
                            Attendance Hub
                          </Link>
                          <Link
                            to="/admin/promotion"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-slate-800 hover:text-white"
                          >
                            <CheckCircle className="w-4 h-4 text-indigo-400" />
                            Role Management
                          </Link>
                        </>
                      )}

                      <div className="border-t border-slate-800 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Notification Bell */}
            {isAuthenticated && (
              <button
                onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Notification Panel */}
      {notifOpen && isAuthenticated && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl" ref={notifRef}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAllRead();
                }}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer border border-cyan-500/30"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">No notifications</p>
            ) : (
              notifications.map((notif) => {
                const isProject = notif.type === 'project';
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(notif.id);
                      setNotifOpen(false);
                      setMobileMenuOpen(false);
                      setSelectedNotif(notif);
                    }}
                    className={`w-full text-left relative px-4 py-3 hover:bg-slate-800/40 transition-colors cursor-pointer focus:outline-none ${!notif.is_read ? (isProject ? 'bg-emerald-500/5' : 'bg-cyan-500/5') : ''}`}
                  >
                    {!notif.is_read && (
                      <span className={`absolute top-3.5 right-3.5 w-2 h-2 rounded-full ${isProject ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                    )}
                    <div className="flex items-start gap-2.5 pr-4">
                      <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${getCategoryBadge(notif.notice_category, notif.type)}`}>
                        {getCategoryIcon(notif.notice_category, notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-tight truncate ${!notif.is_read ? 'text-white font-semibold' : 'text-gray-300'}`}>
                          {notif.title || notif.notice_title}
                        </p>
                        {notif.message && (
                          <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{notif.message}</p>
                        )}
                        <p className="text-[10px] text-gray-500 mt-1 font-mono">{notif.notice_date}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className={linkClasses('/')}>
            Home
          </Link>
          <Link to="/team" onClick={() => setMobileMenuOpen(false)} className={linkClasses('/team')}>
            <Users className="w-4 h-4" />
            Team Members
          </Link>
          <Link to="/faq" onClick={() => setMobileMenuOpen(false)} className={linkClasses('/faq')}>
            <HelpCircle className="w-4 h-4" />
            Guidelines / FAQ
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/projects" onClick={() => setMobileMenuOpen(false)} className={linkClasses('/projects')}>
                <FolderKanban className="w-4 h-4 text-cyan-400" />
                Projects Hub
              </Link>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={linkClasses('/dashboard')}>
                <Layers className="w-4 h-4" />
                Member Dashboard
              </Link>
              <Link to="/membership" onClick={() => setMobileMenuOpen(false)} className={linkClasses('/membership')}>
                <Sparkles className="w-4 h-4" />
                Member Card
              </Link>
              {isAdmin && (
                <>
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className={linkClasses('/admin')}>
                    <Shield className="w-4 h-4 text-amber-400" />
                    Admin Panel
                  </Link>
                  <Link to="/admin/attendance" onClick={() => setMobileMenuOpen(false)} className={linkClasses('/admin/attendance')}>
                    <ClipboardList className="w-4 h-4 text-emerald-400" />
                    Attendance Hub
                  </Link>
                </>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out ({user?.name || user?.username})
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-md shadow-cyan-500/20"
              >
                Sign In to Portal
              </Link>
            </div>
          )}
          </div>
        )}
      </nav>

      {/* ================= NOTIFICATION DETAILS MODAL ================= */}
      {selectedNotif && (
        <div 
          onClick={() => setSelectedNotif(null)}
          className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md cursor-default"
        >
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div 
              onClick={(e) => e.stopPropagation()}
              className="max-w-xl w-full glass-panel-glow p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6 relative my-auto cursor-auto"
            >
              
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${getCategoryBadge(selectedNotif.notice_category, selectedNotif.type)} shadow-lg shadow-cyan-500/10`}>
                    {getCategoryIcon(selectedNotif.notice_category, selectedNotif.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold uppercase ${getCategoryBadge(selectedNotif.notice_category, selectedNotif.type)}`}>
                        {selectedNotif.notice_category || (selectedNotif.type === 'project' ? 'Project Assignment' : 'Announcement')}
                      </span>
                      <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        {selectedNotif.notice_date || (selectedNotif.created_at ? new Date(selectedNotif.created_at).toLocaleString() : '')}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white pt-1 leading-snug">
                      {selectedNotif.title || selectedNotif.notice_title}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNotif(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">Detailed Message</label>
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {selectedNotif.message || selectedNotif.title || selectedNotif.notice_title || 'No additional message details provided.'}
                </div>
              </div>

              {/* Project Meta Card if Project Notification */}
              {selectedNotif.type === 'project' && (
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-300 font-bold">
                      {selectedNotif.project_code || 'PROJECT'}
                    </span>
                    <span className="text-gray-400 capitalize">
                      Domain: {selectedNotif.project_category || 'Engineering'}
                    </span>
                  </div>
                  <p className="font-semibold text-white text-sm">{selectedNotif.project_title}</p>
                  {selectedNotif.project_lead && (
                    <p className="text-gray-300 font-mono text-[11px]">
                      Project Lead: <span className="text-cyan-300 font-bold">{selectedNotif.project_lead}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    const target = selectedNotif.type === 'project' ? '/projects' : '/notices';
                    setSelectedNotif(null);
                    navigate(target);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>{selectedNotif.type === 'project' ? 'Open Project Workspace' : 'View Notice Sheet'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
