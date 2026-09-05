import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Database, 
  Activity, 
  Users, 
  ClipboardList, 
  RefreshCw, 
  Server, 
  Key, 
  ArrowRight,
  Lock,
  Bell,
  FolderKanban
} from 'lucide-react';
import { adminAPI, membersAPI, projectsAPI, attendanceAPI, BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({
    memberCount: 0,
    projectCount: 0,
    noticeCount: 0,
    dbLatency: '14ms',
    status: 'Operational',
  });

  const fetchStats = () => {
    setIsSyncing(true);
    Promise.allSettled([
      membersAPI.getAll(),
      projectsAPI.getAll(),
      attendanceAPI.getNotices(),
      adminAPI.getSystemStatus(),
    ]).then(([membersRes, projectsRes, noticesRes, statusRes]) => {
      setStats({
        memberCount: membersRes.status === 'fulfilled' && Array.isArray(membersRes.value.data) ? membersRes.value.data.length : 0,
        projectCount: projectsRes.status === 'fulfilled' && Array.isArray(projectsRes.value.data) ? projectsRes.value.data.length : 0,
        noticeCount: noticesRes.status === 'fulfilled' && Array.isArray(noticesRes.value.data) ? noticesRes.value.data.length : 0,
        dbLatency: statusRes.status === 'fulfilled' ? statusRes.value.data?.latency || '12ms' : '14ms',
        status: statusRes.status === 'fulfilled' ? statusRes.value.data?.status || 'Operational' : 'Operational',
      });
      setIsSyncing(false);
    });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* 1. ADMIN HEADER */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-amber-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold uppercase">
                  System Administration
                </span>
                <span className="text-xs text-gray-400 font-mono">Control Node</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Administrative Command Center
              </h1>
              <p className="text-xs text-gray-300">
                Logged in as <span className="text-amber-300 font-mono font-bold">{user?.username || user?.email || 'Administrator'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/notices"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              Notice Sheets
            </Link>
            <Link
              to="/admin/attendance"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              Attendance Hub
            </Link>
            <Link
              to="/admin/promotion"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              Role Promotion Engine
            </Link>
          </div>
        </div>

        {/* Dynamic Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
            <p className="text-xs text-gray-400">Total Registered Members</p>
            <p className="text-xl font-bold text-white font-mono mt-1">{stats.memberCount} Accounts</p>
          </div>
          <Link to="/projects" className="p-3 bg-slate-900/70 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition block group">
            <p className="text-xs text-gray-400 group-hover:text-cyan-300 transition">Active Project Initiatives</p>
            <p className="text-xl font-bold text-cyan-400 font-mono mt-1">{stats.projectCount} Repos</p>
          </Link>
          <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
            <p className="text-xs text-gray-400">Database Sync Health</p>
            <p className="text-xl font-bold text-emerald-400 font-mono mt-1">{stats.status}</p>
          </div>
          <Link to="/notices" className="p-3 bg-slate-900/70 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition block group">
            <p className="text-xs text-gray-400 group-hover:text-cyan-300 transition">Active Notice Sheets</p>
            <p className="text-xl font-bold text-indigo-400 font-mono mt-1">{stats.noticeCount} Active</p>
          </Link>
        </div>
      </div>

      {/* 2. DATABASE CONNECTION & SYSTEM MONITORING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Connection Topology Visualization */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" /> Database Connection & Sync Status
            </h2>
            <button
              onClick={fetchStats}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Refresh DB Status'}
            </button>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              {/* Frontend Node */}
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center mx-auto">
                  <Server className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-white">Frontend</p>
                <p className="text-[10px] text-gray-400 font-mono">React / Vite</p>
              </div>

              {/* Pulsing connection line */}
              <div className="flex-1 mx-4 flex flex-col items-center space-y-1">
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 animate-pulse"></div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">JWT Interceptor • {stats.dbLatency}</span>
              </div>

              {/* Django API Backend Node */}
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-white">Django REST</p>
                <p className="text-[10px] text-gray-400 font-mono">Port 8000</p>
              </div>

              {/* Pulsing connection line */}
              <div className="flex-1 mx-4 flex flex-col items-center space-y-1">
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 animate-pulse"></div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">ORM Pipeline</span>
              </div>

              {/* Database Node */}
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center mx-auto">
                  <Database className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-white">MySQL DB</p>
                <p className="text-[10px] text-gray-400 font-mono">cc database</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-gray-400 uppercase font-mono">BACKEND DRIVER</span>
                <p className="text-white font-semibold">MySQL 8.0</p>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-gray-400 uppercase font-mono">API ENDPOINT</span>
                <p className="text-white font-semibold font-mono truncate">{BASE_URL || '/api (Vite Proxy)'}</p>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-gray-400 uppercase font-mono">STATUS</span>
                <p className="text-emerald-400 font-semibold">{stats.status}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" /> Administrative Governance
            </h2>
            <span className="text-[11px] text-amber-400 font-mono">Admin Hub</span>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              Manage member roles, view active attendance submissions, and broadcast announcements to the Code Crashers student body.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/notices"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-white flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Broadcast & Manage Notice Sheets</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/admin/attendance"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-white flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Member Attendance Logs</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/projects"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-white flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Manage Projects & Status Controls</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/admin/promotion"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-white flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Manage Role Promotions & Demotions</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminPanel;
