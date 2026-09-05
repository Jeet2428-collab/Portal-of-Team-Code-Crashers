import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Shield, 
  Cpu, 
  ArrowRight, 
  Users, 
  CheckCircle2, 
  Activity, 
  Play
} from 'lucide-react';
import { projectsAPI } from '../services/api';

const Home = () => {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    projectsAPI.getAll()
      .then((res) => {
        setProjects(Array.isArray(res.data) ? res.data : []);
        setLoadingProjects(false);
      })
      .catch((err) => {
        console.warn('Projects API currently offline or empty:', err);
        setProjects([]);
        setLoadingProjects(false);
      });
  }, []);

  return (
    <div className="space-y-20 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-cyan-600/20 via-blue-600/20 to-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            Official Team CC Student Community & Developer Portal
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Code, Collaborate & Crash Limits with <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              Code Crashers
            </span>
          </h1>

          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            The unified platform for technical student developers, open-source contributors, robotics innovators, and engineering leadership. Track projects, log attendance, and manage verified memberships.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition flex items-center gap-2 group"
            >
              Get Your 1-Year Membership
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/team"
              className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-gray-200 border border-slate-700 text-sm font-medium transition flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              Explore Team Members
            </Link>

            <Link
              to="/admin"
              className="px-6 py-3.5 rounded-xl bg-slate-900/40 hover:bg-slate-900 text-gray-300 border border-slate-800 text-sm font-medium transition flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              Admin Portal
            </Link>
          </div>
        </div>
      </section>

      {/* 2. RECENT PROJECTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">
              <Activity className="w-3.5 h-3.5" /> Project Participation
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Active Computer Engineering Initiatives</h2>
          </div>
          <Link to="/faq" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
            System Code Standards & Project Rules →
          </Link>
        </div>

        {loadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-panel p-6 rounded-2xl animate-pulse space-y-4">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-6 bg-slate-800 rounded w-3/4"></div>
                <div className="h-3 bg-slate-800 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div key={proj.id} className="glass-panel p-6 rounded-2xl space-y-4 hover:border-cyan-500/40 transition group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {proj.code || proj.id}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                    {proj.status || 'Active'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {proj.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-cyan-300 font-semibold">{proj.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${proj.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-gray-400 border-t border-slate-800/80">
                  <span>Lead: <span className="text-slate-300 font-medium">{proj.lead_name || proj.lead || 'Team Lead'}</span></span>
                  <span>{proj.members_count || 0} contributors</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center glass-panel rounded-2xl text-gray-400 text-xs">
            No active project initiatives available yet. Connect with your team lead to initiate one.
          </div>
        )}
      </section>

      {/* 3. PLATFORM ARCHITECTURE OVERVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl glass-panel-glow p-8 sm:p-12 border border-slate-800 relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5" /> Portal Blueprint Architecture
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                An End-to-End System Built for Modern Engineering Teams
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                From fast onboarding through our 11-field registration flow, to real-time attendance logging, role promotion ladders, and interactive two-part holographic cards.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Automated 1-Year Membership ID</h4>
                    <p className="text-xs text-gray-400">Department-coded ID generation with annual validity countdown and downloadable pass.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Two-Part Credential Matrix</h4>
                    <p className="text-xs text-gray-400">Part 1 for club role & photo identity; Part 2 for verified university roll numbers and academic semester tracking.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Administrative Center</h4>
                    <p className="text-xs text-gray-400">Live database sync monitor, member promotion/demotion engine, and notice sheet logging.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/faq"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition"
                >
                  Read the complete User Guide & Rules <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Department Hub & System Status */}
            <div className="relative rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-white font-semibold font-mono">Team CC Active Departments</span>
                </div>
                <span className="text-cyan-400 font-mono text-[11px]">PORTAL READY</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { code: 'UI/UX', label: 'Designers', color: 'from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30' },
                  { code: 'DEV', label: 'Developers', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30' },
                  { code: 'DOC', label: 'Documentary', color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30' },
                  { code: 'RES', label: 'Researchers', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30' },
                  { code: 'IOT', label: 'Hardware/IoT', color: 'from-indigo-500/20 to-violet-500/20 text-indigo-300 border-indigo-500/30' },
                  { code: 'MKT', label: 'Marketing', color: 'from-rose-500/20 to-red-500/20 text-rose-300 border-rose-500/30' },
                ].map((d) => (
                  <div key={d.code} className={`p-3 rounded-xl bg-gradient-to-br ${d.color} border text-center space-y-1`}>
                    <p className="text-sm font-black font-mono tracking-wider">{d.code}</p>
                    <p className="text-[10px] text-gray-300 font-medium">{d.label}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-gray-400">
                <span className="font-mono">Verification: 1-Year Pass</span>
                <span className="text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Live System
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
