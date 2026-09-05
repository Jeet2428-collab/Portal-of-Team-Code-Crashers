import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn } from 'lucide-react';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-mono animate-pulse">Verifying credentials & tokens...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Requires admin role but user is not admin
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel-glow p-8 rounded-2xl text-center space-y-4 border border-red-500/30">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            The page you are attempting to access is restricted to system administrators (SM/SS). Your current role is <span className="text-cyan-400 font-mono font-semibold uppercase">{user?.role || 'Member'}</span>.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Admin Credentials
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
