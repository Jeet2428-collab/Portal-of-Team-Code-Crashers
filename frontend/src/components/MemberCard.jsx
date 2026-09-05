import React, { useState, useEffect } from 'react';
import { QrCode, Cpu, ShieldCheck, Download, RefreshCw, Calendar, Mail, Phone } from 'lucide-react';
import confetti from 'canvas-confetti';

const DEPT_MAP = {
  'dev': 'DEVELOPER',
  'ui/ux': 'UI/UX DESIGNER',
  'doc': 'DOCUMANTARY',
  'res': 'RESEARCH',
  'iot': 'IOT',
  'mkt': 'MARKETING',
};

const MemberCard = ({ member, interactive = true, defaultPart = 'part1' }) => {
  const [activePart, setActivePart] = useState(defaultPart);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    setActivePart(defaultPart);
  }, [defaultPart]);

  const rawDept = member?.department?.dept_name || member?.department || member?.dept || 'DEVELOPER';
  const resolvedDept = DEPT_MAP[rawDept?.toLowerCase()] || rawDept;

  const rawMemberId = member?.membershipId || member?.member_id || member?.membership_id || member?.profile?.membership_id || 'CC26-PENDING';
  const memberIdStr = String(rawMemberId);

  const memberData = {
    name: member?.name || member?.username || 'Member Name',
    email: member?.email || 'member@teamcc.org',
    memberId: memberIdStr,
    role: member?.role || (member?.is_staff ? 'Administrator' : 'Member'),
    department: resolvedDept,
    year: member?.year || member?.academic_year || '1st Year',
    sem: member?.sem || member?.semester || '1st Semester',
    classRoll: member?.classRoll || member?.class_roll || '—',
    univRoll: member?.univRoll || member?.university_roll || '—',
    contact: member?.contact || member?.phone || '—',
    avatar: member?.avatar || member?.image || `https://api.dicebear.com/7.x/bottts/svg?seed=${memberIdStr}`,
    joinedDate: member?.joinedDate || member?.joined_date || 'Active',
    expiryDate: member?.expiryDate || member?.expiry_date || '1-Year Term',
  };

  const handleFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setActivePart(prev => (prev === 'part1' ? 'part2' : 'part1'));
      setIsFlipping(false);
    }, 150);
  };

  const handleDownload = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#06b6d4', '#3b82f6', '#8b5cf6']
    });
    window.print();
  };

  return (
    <div className="flex flex-col items-center">
      {/* Interactive Card Container */}
      <div 
        className={`w-full max-w-[440px] rounded-2xl relative transition-all duration-300 shadow-2xl ${
          isFlipping ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
        } group`}
        style={{
          perspective: '1000px',
        }}
      >
        {/* Holographic background */}
        <div className="w-full rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-[2px] shadow-[0_0_25px_rgba(6,182,212,0.25)]">
          <div className="w-full min-h-[265px] rounded-2xl bg-slate-950/90 backdrop-blur-xl p-5 flex flex-col justify-between relative overflow-hidden border border-cyan-500/30">
            
            {/* Hologram Ambient Light */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* CARD PART 1: FRONT */}
            {activePart === 'part1' ? (
              <>
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-cyan-400/40 shadow-md shadow-cyan-500/20 bg-slate-900 shrink-0">
                      <img
                        src="/cc-square.jpeg"
                        alt="Code Crashers"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xs font-black tracking-widest text-white uppercase">TEAM CC</h3>
                      <p className="text-[8px] text-cyan-400 tracking-wider font-mono">CODE CRASHERS</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                      PART 1 : IDENTITY
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 my-auto z-10 py-2">
                  <div className="relative shrink-0">
                    <img
                      src={memberData.avatar}
                      alt={memberData.name}
                      className="w-20 h-20 rounded-xl object-cover ring-2 ring-cyan-400/50 shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                      {memberData.department}
                    </div>
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="text-base font-bold text-white truncate tracking-wide">{memberData.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 font-medium">{memberData.role}</span>
                      <span className="text-[10px] text-gray-500">•</span>
                      <span className="text-[10px] text-cyan-400 font-mono">{memberData.year}</span>
                    </div>

                    <div className="pt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
                      <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{memberData.email}</span>
                    </div>

                    <div className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 flex items-center justify-between mt-1">
                      <span className="text-[9px] text-gray-400 font-mono uppercase">MEMBER ID</span>
                      <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
                        {memberData.memberId}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 z-10 text-[10px] text-gray-400 font-mono">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>VALID: {memberData.joinedDate} → {memberData.expiryDate}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>VERIFIED</span>
                  </div>
                </div>
              </>
            ) : (
              /* CARD PART 2: BACK */
              <>
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black tracking-widest text-white uppercase">ACADEMIC RECORD</h3>
                      <p className="text-[8px] text-indigo-400 tracking-wider font-mono">PORTAL VERIFIED</p>
                    </div>
                  </div>

                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                    PART 2 : CREDENTIALS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 my-auto z-10 text-xs py-2">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <p className="text-[9px] text-gray-400 uppercase font-mono">DEPARTMENT</p>
                    <p className="text-white font-semibold truncate">{memberData.department}</p>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <p className="text-[9px] text-gray-400 uppercase font-mono">SEMESTER & YEAR</p>
                    <p className="text-white font-semibold truncate">{memberData.sem} ({memberData.year})</p>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <p className="text-[9px] text-gray-400 uppercase font-mono">COLLEGE ROLL</p>
                    <p className="text-cyan-300 font-mono font-bold truncate">{memberData.classRoll}</p>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <p className="text-[9px] text-gray-400 uppercase font-mono">UNIVERSITY ROLL</p>
                    <p className="text-cyan-300 font-mono font-bold truncate">{memberData.univRoll}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 z-10 text-[10px] text-gray-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-5 h-5 text-cyan-400" />
                    <span className="text-[9px] text-gray-400">HASH: SHA256-CC-{String(memberData.memberId || '0000').slice(-4)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-cyan-400">
                    <Phone className="w-3 h-3 text-gray-500" />
                    <span>{memberData.contact}</span>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      {interactive && (
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleFlip}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 transition flex items-center gap-1.5 shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isFlipping ? 'animate-spin' : ''}`} />
            Flip to {activePart === 'part1' ? 'Part 2 (Credentials)' : 'Part 1 (Identity)'}
          </button>
          
          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-xs font-medium text-cyan-300 border border-cyan-500/40 transition flex items-center gap-1.5 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            Print / Save Pass
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberCard;
