import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClipboardList, 
  Search, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  UserX,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Sparkles,
  Activity,
  Check,
  X,
  Users,
  CheckCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { attendanceAPI, membersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Format Date instance to exact local YYYY-MM-DD string without UTC offset shifts
const formatLocalDateStr = (d) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AttendanceHub = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  // Live Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-Time Calendar Selection State
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateFilterMode, setDateFilterMode] = useState('SELECTED'); // 'SELECTED' | 'ALL' | 'TODAY' | 'WEEK'

  // Table Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Daily All-Members Roster Attendance Modal
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterDate, setRosterDate] = useState(() => formatLocalDateStr(new Date()));
  const [rosterNote, setRosterNote] = useState('General Meeting & Check-in');
  const [rosterStatusMap, setRosterStatusMap] = useState({});
  const [rosterSearch, setRosterSearch] = useState('');
  const [isSubmittingRoster, setIsSubmittingRoster] = useState(false);

  // Live Clock updates every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to extract clean local YYYY-MM-DD from log
  const getLogDateStr = (log) => {
    if (!log) return formatLocalDateStr(new Date());
    if (log.date) {
      if (typeof log.date === 'string' && log.date.includes('T')) {
        return log.date.split('T')[0];
      }
      return formatLocalDateStr(log.date);
    }
    if (log.login_time) {
      if (typeof log.login_time === 'string' && log.login_time.includes('T')) {
        return log.login_time.split('T')[0];
      }
      return formatLocalDateStr(log.login_time);
    }
    if (log.created_at) {
      if (typeof log.created_at === 'string' && log.created_at.includes('T')) {
        return log.created_at.split('T')[0];
      }
      return formatLocalDateStr(log.created_at);
    }
    return formatLocalDateStr(new Date());
  };

  // Fetch Attendance Logs & Members Roster
  const fetchData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsRefreshing(true);
    try {
      const [res, membersRes] = await Promise.allSettled([
        attendanceAPI.getLogs(),
        membersAPI.getAll(),
      ]);

      if (res.status === 'fulfilled' && res.value && Array.isArray(res.value.data)) {
        setLogs(res.value.data);
      } else {
        setLogs([]);
      }

      if (membersRes.status === 'fulfilled' && membersRes.value && Array.isArray(membersRes.value.data)) {
        setMembersList(membersRes.value.data);
      } else {
        setMembersList([]);
      }
    } catch (err) {
      console.warn('Attendance logs API offline or empty:', err);
      setLogs([]);
      setMembersList([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-sync polling every 15 seconds if enabled
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      fetchData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoSync]);

  // Log Approval Action
  const handleApproveLog = async (id) => {
    try {
      await attendanceAPI.approveLog(id);
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'Approved' } : l)));
    } catch {
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'Approved' } : l)));
    }
  };

  const selectedDateStr = useMemo(() => {
    return selectedDate ? formatLocalDateStr(selectedDate) : '';
  }, [selectedDate]);

  const todayStr = useMemo(() => {
    return formatLocalDateStr(new Date());
  }, []);

  // Combined list of available members for dropdown selection
  const availableMembers = useMemo(() => {
    const map = new Map();

    // 1. Members from backend API
    if (Array.isArray(membersList)) {
      membersList.forEach((m) => {
        const id = m.member_id || m.memberId;
        const name = m.name || m.user?.profile?.name || m.user?.username;
        if (id && name) {
          map.set(String(id), {
            memberId: String(id),
            name: String(name),
            dept: m.department?.dept_name || m.department || '',
            role: m.role || 'Member',
            avatar: m.avatar || m.user?.profile?.avatar || '',
          });
        }
      });
    }

    // 2. Current logged in user
    if (user && (user.membershipId || user.membership_id) && (user.name || user.username)) {
      const uId = String(user.membershipId || user.membership_id);
      const uName = String(user.name || user.username);
      if (!map.has(uId)) {
        map.set(uId, {
          memberId: uId,
          name: uName,
          dept: user.department?.dept_name || user.department || '',
          role: user.role || 'Member',
          avatar: user.avatar || '',
        });
      }
    }

    return Array.from(map.values());
  }, [membersList, user]);

  // Open & initialize Daily Roster Attendance
  const handleOpenRosterModal = () => {
    const initialMap = {};
    availableMembers.forEach((m) => {
      initialMap[m.memberId] = rosterStatusMap[m.memberId] || 'Present';
    });
    setRosterStatusMap(initialMap);
    setRosterDate(formatLocalDateStr(new Date()));
    setShowRosterModal(true);
  };

  const handleSetAllRosterStatus = (statusToSet) => {
    const updated = {};
    availableMembers.forEach((m) => {
      updated[m.memberId] = statusToSet;
    });
    setRosterStatusMap(updated);
  };

  const handleToggleMemberRosterStatus = (memberId, statusToSet) => {
    setRosterStatusMap((prev) => ({
      ...prev,
      [memberId]: statusToSet,
    }));
  };

  const handleSubmitRosterAttendance = async (e) => {
    if (e) e.preventDefault();
    if (!availableMembers || availableMembers.length === 0) return;

    setIsSubmittingRoster(true);
    const records = availableMembers.map((m) => ({
      member_id: m.memberId,
      status: rosterStatusMap[m.memberId] || 'Present',
    }));

    try {
      const res = await attendanceAPI.recordBulkAttendance({
        date: rosterDate,
        session_note: rosterNote || 'Daily Attendance Check-in',
        records: records,
      });

      if (res?.data?.records) {
        setLogs((prev) => [...res.data.records, ...prev]);
      } else {
        await fetchData(false);
      }

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      });

      setShowRosterModal(false);
    } catch (err) {
      console.error('Error recording daily bulk attendance:', err);
      await fetchData(false);
      setShowRosterModal(false);
    } finally {
      setIsSubmittingRoster(false);
    }
  };

  // Live counters for the roster modal
  const rosterCounts = useMemo(() => {
    let present = 0;
    let late = 0;
    let excused = 0;
    let absent = 0;

    availableMembers.forEach((m) => {
      const st = rosterStatusMap[m.memberId] || 'Present';
      if (st === 'Present') present++;
      else if (st === 'Late') late++;
      else if (st === 'Excused') excused++;
      else if (st === 'Absent') absent++;
    });

    return { present, late, excused, absent, total: availableMembers.length };
  }, [availableMembers, rosterStatusMap]);

  // Filtered members in roster modal search
  const filteredRosterMembers = useMemo(() => {
    if (!rosterSearch.trim()) return availableMembers;
    const s = rosterSearch.toLowerCase();
    return availableMembers.filter(
      (m) =>
        (m.name || '').toLowerCase().includes(s) ||
        (m.memberId || '').toLowerCase().includes(s) ||
        (m.dept || '').toLowerCase().includes(s)
    );
  }, [availableMembers, rosterSearch]);

  // Filter logs by calendar selection, search, type, and approval status
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = getLogDateStr(log);
      
      // Date Mode Filtering
      let matchesDate = true;
      if (dateFilterMode === 'SELECTED') {
        matchesDate = logDate === selectedDateStr;
      } else if (dateFilterMode === 'TODAY') {
        matchesDate = logDate === todayStr;
      } else if (dateFilterMode === 'WEEK') {
        const diffDays = (new Date() - new Date(logDate)) / (1000 * 60 * 60 * 24);
        matchesDate = diffDays >= 0 && diffDays <= 7;
      }

      // Search matching
      const name = log.name || log.user?.username || '';
      const memberId = log.memberId || log.membership_id || log.member_id || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            memberId.toLowerCase().includes(searchTerm.toLowerCase());

      // Type matching
      const type = log.type || log.att_types || 'Present';
      const matchesType = selectedType === 'ALL' || type === selectedType;

      // Status matching
      const status = log.status || 'Pending';
      const matchesStatus = selectedStatus === 'ALL' || status === selectedStatus;

      return matchesDate && matchesSearch && matchesType && matchesStatus;
    });
  }, [logs, dateFilterMode, selectedDateStr, todayStr, searchTerm, selectedType, selectedStatus]);

  // Calendar day calculation helpers
  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Map logs count by date string for current month
    const logCountsByDate = {};
    logs.forEach(log => {
      const d = getLogDateStr(log);
      logCountsByDate[d] = (logCountsByDate[d] || 0) + 1;
    });

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateStr: null, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = formatLocalDateStr(dateObj);
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDateStr;
      const hasLogs = Boolean(logCountsByDate[dateStr]);
      const count = logCountsByDate[dateStr] || 0;

      days.push({
        dayNumber: d,
        dateObj,
        dateStr,
        isCurrentMonth: true,
        isToday,
        isSelected,
        hasLogs,
        count
      });
    }

    return days;
  }, [currentCalendarMonth, logs, todayStr, selectedDateStr]);

  const handlePrevMonth = () => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1));
  };

  const handleSelectDay = (dayObj) => {
    if (!dayObj.isCurrentMonth || !dayObj.dateObj) return;
    setSelectedDate(dayObj.dateObj);
    setDateFilterMode('SELECTED');
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentCalendarMonth(today);
    setDateFilterMode('TODAY');
  };

  // Real-time daily metrics for active view
  const activeDateLogs = useMemo(() => {
    return dateFilterMode === 'ALL' 
      ? logs 
      : logs.filter(l => getLogDateStr(l) === (dateFilterMode === 'TODAY' ? todayStr : selectedDateStr));
  }, [logs, dateFilterMode, todayStr, selectedDateStr]);

  const activeTotal = activeDateLogs.length;
  const activePresent = activeDateLogs.filter(l => (l.type || l.att_types || 'Present') === 'Present').length;
  const activeLate = activeDateLogs.filter(l => (l.type || l.att_types) === 'Late').length;
  const activeExcused = activeDateLogs.filter(l => (l.type || l.att_types) === 'Excused').length;
  const activeAbsent = activeDateLogs.filter(l => (l.type || l.att_types) === 'Absent').length;
  const activeApproved = activeDateLogs.filter(l => l.status === 'Approved').length;

  // Export Daily Logs to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Member Name', 'Membership ID', 'Type', 'Check-in Time', 'Date', 'Approval Status', 'Topic / Meeting Note'];
    const rows = filteredLogs.map(l => {
      return [
        `"${l.name || l.user?.username || 'Member'}"`,
        `"${l.memberId || l.membership_id || '—'}"`,
        `"${l.type || l.att_types || 'Present'}"`,
        `"${l.time || logTimeFormatted(l) || '—'}"`,
        `"${getLogDateStr(l)}"`,
        `"${l.status || 'Approved'}"`,
        `"${l.sessionNote || 'General Check-in'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Sheet_${dateFilterMode === 'ALL' ? 'All_Dates' : selectedDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const logTimeFormatted = (log) => {
    if (log.time) return log.time;
    if (log.login_time) {
      try {
        return new Date(log.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      } catch {
        return 'Recorded';
      }
    }
    return 'Recorded';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* 1. CLOCK & HEADER BANNER */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-emerald-500/30 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          {/* Title & Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-wider uppercase font-semibold">
                <ClipboardList className="w-3.5 h-3.5 text-emerald-400" /> Attendance Management Hub
              </span>
              <button
                onClick={() => setAutoSync(!autoSync)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border transition ${
                  autoSync 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                    : 'bg-slate-800 text-gray-400 border-slate-700'
                }`}
                title="Toggle 15-second automatic sync"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${autoSync ? 'bg-cyan-400 animate-ping' : 'bg-gray-500'}`}></span>
                Auto-Sync: {autoSync ? 'Active (15s)' : 'Paused'}
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Daily Attendance Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Track member presence, monitor daily attendance records, and take roll call roster sheets for all club members.
            </p>
          </div>

          {/* Digital Clock Display & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            
            {/* Clock Card */}
            <div className="p-2 px-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between sm:justify-start gap-4 shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="text-xl sm:text-xl font-black text-white font-mono tracking-wider">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </div>
                <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                  <span>{currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-emerald-400 font-bold">• Live</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center">
              <button
                onClick={handleOpenRosterModal}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
                title="Take daily attendance for all members"
              >
                <Users className="w-4 h-4" />
                <span>Take Daily Attendance</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 font-mono font-bold">
                  {availableMembers.length}
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Dynamic Attendance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-[11px] text-gray-400 uppercase font-mono">
              {dateFilterMode === 'ALL' ? 'Total All-Time Logs' : `Checked-in (${dateFilterMode === 'TODAY' ? 'Today' : selectedDateStr})`}
            </p>
            <p className="text-xl font-bold text-white font-mono">{activeTotal} Recorded</p>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-[11px] text-emerald-400 uppercase font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Present Count
            </p>
            <p className="text-xl font-bold text-emerald-300 font-mono">
              {activePresent} Present {activeTotal > 0 ? `(${Math.round((activePresent / activeTotal) * 100)}%)` : ''}
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-[11px] text-amber-400 uppercase font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Late & Excused
            </p>
            <p className="text-xl font-bold text-amber-300 font-mono">
              {activeLate + activeExcused} <span className="text-xs font-normal text-gray-400">({activeLate} Late, {activeExcused} Excused)</span>
            </p>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
            <p className="text-[11px] text-indigo-400 uppercase font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Verified Records
            </p>
            <p className="text-xl font-bold text-indigo-300 font-mono">{activeApproved} Approved</p>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE DAILY CALENDAR & DATE PICKER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Month Calendar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-400" /> Daily Attendance Calendar
            </h2>
            <button
              onClick={handleJumpToToday}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
            >
              Jump to Today
            </button>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
            
            {/* Month Header with Navigation */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white border border-slate-800 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-sm text-white font-mono">
                {currentCalendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white border border-slate-800 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-bold text-gray-500 uppercase">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((d, index) => {
                if (!d.isCurrentMonth) {
                  return <div key={`empty-${index}`} className="h-9 rounded-xl"></div>;
                }

                let dayClasses = "h-9 rounded-xl flex flex-col items-center justify-center text-xs font-mono font-semibold relative transition cursor-pointer ";

                if (d.isSelected && dateFilterMode === 'SELECTED') {
                  dayClasses += "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30 scale-105 ";
                } else if (d.isToday) {
                  dayClasses += "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 ";
                } else if (d.hasLogs) {
                  dayClasses += "bg-slate-850 text-white hover:bg-slate-800 border border-slate-800 ";
                } else {
                  dayClasses += "bg-slate-900/40 text-gray-400 hover:bg-slate-800/60 hover:text-gray-200 ";
                }

                return (
                  <button
                    key={d.dateStr}
                    onClick={() => handleSelectDay(d)}
                    className={dayClasses}
                    title={`${d.dateStr} (${d.count} logs)`}
                  >
                    <span>{d.dayNumber}</span>
                    {d.hasLogs && !d.isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Range Filter Pills */}
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
              <button
                onClick={() => setDateFilterMode('TODAY')}
                className={`py-1.5 px-2 rounded-xl font-medium font-mono transition cursor-pointer ${
                  dateFilterMode === 'TODAY' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                    : 'bg-slate-900 text-gray-400 hover:text-white border border-slate-800'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateFilterMode('WEEK')}
                className={`py-1.5 px-2 rounded-xl font-medium font-mono transition cursor-pointer ${
                  dateFilterMode === 'WEEK' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                    : 'bg-slate-900 text-gray-400 hover:text-white border border-slate-800'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setDateFilterMode('ALL')}
                className={`py-1.5 px-2 rounded-xl font-medium font-mono transition cursor-pointer ${
                  dateFilterMode === 'ALL' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                    : 'bg-slate-900 text-gray-400 hover:text-white border border-slate-800'
                }`}
              >
                All Records
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Attendance Logs Table & Controls */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Table Header & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">
                  {dateFilterMode === 'ALL' 
                    ? 'All Attendance Records' 
                    : dateFilterMode === 'TODAY' 
                    ? "Today's Attendance Log Sheet" 
                    : dateFilterMode === 'WEEK'
                    ? 'Past 7 Days Logs'
                    : `Logs for ${selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono">
                Showing {filteredLogs.length} verified attendance logs
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search member or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              {/* Attendance Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl glass-input text-xs bg-slate-900 text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Excused">Excused</option>
                <option value="Absent">Absent</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl glass-input text-xs bg-slate-900 text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
              </select>

              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white border border-slate-800 transition cursor-pointer"
                title="Export Filtered Logs to CSV"
              >
                <Download className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-xs flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Loading attendance logs...</span>
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-gray-400 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Member Details</th>
                      <th className="px-5 py-3.5">Membership ID</th>
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5">Attendance Type</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-gray-300">
                    {filteredLogs.map((log) => {
                      const logType = log.type || log.att_types || 'Present';
                      const isApproved = log.status === 'Approved';
                      const avatar = log.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${log.memberId || log.name || log.id}`;

                      return (
                        <tr key={log.id} className="hover:bg-slate-900/40 transition">
                          <td className="px-5 py-3.5 font-semibold text-white">
                            <div className="flex items-center gap-2.5">
                              <img 
                                src={avatar} 
                                alt="" 
                                className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 object-cover"
                              />
                              <div>
                                <p className="leading-tight text-white font-bold">{log.name || log.user?.username || 'Member'}</p>
                                <p className="text-[10px] text-gray-400 font-mono">
                                  {log.dept || log.role || 'Member'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 font-mono text-cyan-400 font-bold">
                            {log.memberId || log.membership_id || log.member_id || '—'}
                          </td>

                          <td className="px-5 py-3.5 font-mono text-gray-300">
                            <div className="flex flex-col">
                              <span className="text-white font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-cyan-400" />
                                {logTimeFormatted(log)}
                              </span>
                              <span className="text-[10px] text-gray-500">{getLogDateStr(log)}</span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full font-medium text-[11px] font-mono ${
                              logType === 'Present' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                : logType === 'Late'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : logType === 'Excused'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {logType}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400">
                                <Clock className="w-3.5 h-3.5" />
                                Pending
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isApproved ? (
                                <button
                                  onClick={() => handleApproveLog(log.id)}
                                  className="px-3 py-1 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/60 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition shadow-sm cursor-pointer"
                                >
                                  Approve
                                </button>
                              ) : (
                                <span className="text-gray-500 text-xs font-mono">Verified</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 text-xs space-y-3">
                <AlertCircle className="w-7 h-7 text-gray-500 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">No attendance records found</p>
                  <p className="text-gray-400 max-w-sm mx-auto">
                    {dateFilterMode === 'SELECTED'
                      ? `No attendance check-ins recorded for ${selectedDate.toLocaleDateString()}.`
                      : 'No logs match the selected filter criteria.'}
                  </p>
                </div>
                <button
                  onClick={handleOpenRosterModal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-xs shadow-md transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Take Daily Attendance</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. MODAL: TAKE DAILY ATTENDANCE FOR ALL MEMBERS (ROSTER ATTENDANCE SHEET) */}
      {showRosterModal && (
        <div 
          onClick={() => setShowRosterModal(false)}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div 
              onClick={(e) => e.stopPropagation()}
              className="max-w-3xl w-full glass-panel-glow p-6 sm:p-8 rounded-3xl border border-amber-500/40 space-y-5 relative my-auto max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setShowRosterModal(false)}
                className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-800/80 text-gray-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold uppercase">
                    Admin Roster Sheet
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {availableMembers.length} Registered Members
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  Daily Attendance Roster
                </h3>
              </div>
            </div>

            {/* Date & Note Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
              <div className="space-y-1">
                <label className="text-gray-300 font-medium flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" /> Attendance Date
                </label>
                <input
                  type="date"
                  value={rosterDate}
                  onChange={(e) => setRosterDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-medium">Meeting / Topic Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Standup, Technical Workshop, Sprint Review"
                  value={rosterNote}
                  onChange={(e) => setRosterNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Bulk Action Buttons & Live Stats */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-gray-400 font-medium mr-1">Mark All:</span>
                <button
                  type="button"
                  onClick={() => handleSetAllRosterStatus('Present')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition cursor-pointer"
                >
                  ✓ All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllRosterStatus('Excused')}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition cursor-pointer"
                >
                  📄 All Excused
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllRosterStatus('Absent')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition cursor-pointer"
                >
                  ✕ All Absent
                </button>
              </div>

              {/* Live Count Badges */}
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {rosterCounts.present} Present
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  {rosterCounts.late} Late
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                  {rosterCounts.excused} Excused
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                  {rosterCounts.absent} Absent
                </span>
              </div>
            </div>

            {/* Filter / Search within roster */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member by name, ID, or department in roster..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white placeholder-gray-500 focus:outline-none"
              />
            </div>

            {/* Scrollable Members List */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl divide-y divide-slate-800/80 bg-slate-950/40 max-h-[42vh] p-1">
              {filteredRosterMembers.length === 0 ? (
                <p className="text-center text-gray-500 text-xs py-8">
                  No members matched your search.
                </p>
              ) : (
                filteredRosterMembers.map((m) => {
                  const currentStatus = rosterStatusMap[m.memberId] || 'Present';
                  const avatar = m.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.memberId || m.name}`;

                  return (
                    <div
                      key={m.memberId}
                      className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/50 transition rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={avatar}
                          alt=""
                          className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shrink-0 object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{m.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-gray-400">
                            <span className="text-cyan-400 font-semibold">{m.memberId}</span>
                            {m.dept && <span>• {m.dept}</span>}
                          </div>
                        </div>
                      </div>

                      {/* 4-State Toggle Pills for Each Member */}
                      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleToggleMemberRosterStatus(m.memberId, 'Present')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                            currentStatus === 'Present'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleMemberRosterStatus(m.memberId, 'Late')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                            currentStatus === 'Late'
                              ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleMemberRosterStatus(m.memberId, 'Excused')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                            currentStatus === 'Excused'
                              ? 'bg-purple-500 text-white shadow-sm font-bold'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Excused
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleMemberRosterStatus(m.memberId, 'Absent')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                            currentStatus === 'Absent'
                              ? 'bg-rose-500 text-white shadow-sm font-bold'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400 font-mono">
                {rosterCounts.present} / {availableMembers.length} Present on {rosterDate}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRosterModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingRoster}
                  onClick={handleSubmitRosterAttendance}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRoster ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Attendance...</span>
                    </>
                  ) : (
                    <>
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Save Roster Attendance</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
      )}

    </div>
  );
};

export default AttendanceHub;
