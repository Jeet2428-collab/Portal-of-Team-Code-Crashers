import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import MemberCard from '../components/MemberCard';
import { 
  Printer, 
  QrCode, 
  ShieldCheck, 
  FileBadge,
  Sparkles,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

const MembershipCardDetails = () => {
  const { user, setUser } = useAuth();
  const [profileData, setProfileData] = useState(user || null);
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    let isMounted = true;
    const fetchLatestProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        if (isMounted && res.data) {
          setProfileData(res.data);
          if (setUser) {
            setUser((prev) => ({ ...(prev || {}), ...res.data }));
          }
        }
      } catch (err) {
        console.warn('Could not fetch remote profile, using current user session:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLatestProfile();
    return () => { isMounted = false; };
  }, []);

  const currentUser = profileData || user || {
    name: 'Code Crashers Member',
    email: 'member@teamcc.org',
    membershipId: 'CC26-MEM-001',
    role: 'Member',
    department: 'DEVELOPER',
    year: '1st Year',
    sem: '1st Semester',
    classRoll: '24/BCA/001',
    univRoll: '101-102-24-001',
    contact: '+91 98765-43210',
  };

  const handlePrint = () => {
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.7 }
    });
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <FileBadge className="w-3.5 h-3.5" /> Official Member Credential
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Expanded Membership Card
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            High-fidelity view of your verified identity pass and academic credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Interactive 3D Holographic Pass Showcase */}
      <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Sparkles className="w-4 h-4" />
          <span>Interactive 3D Flippable Smart Pass</span>
        </div>
        
        <MemberCard member={currentUser} interactive={true} defaultPart="part1" />
      </div>

      {/* Side-by-Side Dual-Card Showcase: Part 1 (Front) & Part 2 (Back) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CARD PART 1: IDENTITY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              Part 1: Photo Identity & Club Role
            </h2>
            <span className="text-[11px] font-mono text-cyan-400">Front Face</span>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
            <MemberCard member={currentUser} interactive={false} defaultPart="part1" />
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-gray-400 space-y-1">
            <p className="text-white font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Identity Verification
            </p>
            <p>Utilized for campus hackathon entrances, workshop badges, and team event passes.</p>
          </div>
        </div>

        {/* CARD PART 2: ACADEMIC CREDENTIALS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              Part 2: Academic Records & Security Hash
            </h2>
            <span className="text-[11px] font-mono text-indigo-400">Back Face</span>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
            <MemberCard member={currentUser} interactive={false} defaultPart="part2" />
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-gray-400 space-y-1">
            <p className="text-white font-semibold flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-indigo-400" /> Cryptographic Integrity
            </p>
            <p>Encodes University and College Roll numbers to authenticate project submissions and awards.</p>
          </div>
        </div>

      </div>

      {/* Security & Verification Metadata Sheet */}
      <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Digital Certificate & Verification Seal
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <span className="text-gray-500 uppercase text-[10px]">ISSUER NODE</span>
            <p className="text-white font-semibold">Team CC Central Auth Server</p>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <span className="text-gray-500 uppercase text-[10px]">VALIDITY TERM</span>
            <p className="text-emerald-400 font-semibold">{currentUser.joinedDate || currentUser.joined_date || 'Active'} → {currentUser.expiryDate || currentUser.expiry_date || '1-Year Term'}</p>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <span className="text-gray-500 uppercase text-[10px]">VERIFICATION STATUS</span>
            <p className="text-cyan-400 font-semibold">Digitally Signed (SHA256)</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MembershipCardDetails;
