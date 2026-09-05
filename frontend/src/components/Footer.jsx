import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Globe, Share2, Heart, ShieldCheck, Cpu } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 mt-auto text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-cyan-500/40 shadow-md flex items-center justify-center bg-slate-900 shrink-0">
                <img
                  src="/cc-square.jpeg"
                  alt="Code Crashers"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-extrabold text-base tracking-wider text-white">
                TEAM<span className="text-cyan-400"> CC</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Official tech portal for team Code Crashers. Driving collaborative computing, student innovation, and technical leadership.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition" title="GitHub">
                <Globe className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition" title="LinkedIn">
                <Share2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Platform Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-cyan-400 transition">Portal Home</Link>
              </li>
              <li>
                <Link to="/team" className="hover:text-cyan-400 transition">Team Members</Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-cyan-400 transition">Projects & Repositories</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-cyan-400 transition">Instructions & Rules (FAQ)</Link>
              </li>
              <li>
                <Link to="/notices" className="hover:text-cyan-400 transition">Notice Sheets & Circulars</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-cyan-400 transition">Member Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Security & Admin */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> System & Security
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-cyan-400 transition">Member Authentication</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-cyan-400 transition">1-Year ID Registration</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-cyan-400 transition">Admin Portal</Link>
              </li>
              <li>
                <Link to="/admin/attendance" className="hover:text-cyan-400 transition">Attendance Hub & Logs</Link>
              </li>
            </ul>
          </div>

          {/* System Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">System Status</h4>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Portal API:</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Version:</span>
                <span className="text-cyan-400 font-mono text-[11px]">v2.6.0-stable</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Database:</span>
                <span className="text-blue-400 font-mono text-[11px]">MySQL Synced</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} Team Code Crashers. All rights reserved.</p>
          <div className="flex items-center gap-1 text-gray-400">
            Built for engineering excellence with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> by Team CC Devs
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
