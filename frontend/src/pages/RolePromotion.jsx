import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Search, 
  History,
  Edit2,
  Check,
  X,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { membersAPI, adminAPI } from '../services/api';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

const RolePromotion = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState('ALL');
  const [activityLogs, setActivityLogs] = useState([]);

  // Inline Department Edit state
  const [inlineDeptEditingId, setInlineDeptEditingId] = useState(null);
  const [inlineDeptValue, setInlineDeptValue] = useState('');

  const fetchData = () => {
    Promise.allSettled([
      membersAPI.getAll(),
      adminAPI.getAuditLogs(),
    ]).then(([membersRes, logsRes]) => {
      if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value.data)) {
        setMembers(membersRes.value.data);
      } else {
        setMembers([]);
      }

      if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value.data)) {
        setActivityLogs(logsRes.value.data);
      } else {
        setActivityLogs([]);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Role rank definition: Core (Highest) > Leader > Head > Member (Lowest)
  const ROLE_RANKS = {
    core: 4,
    leader: 3,
    head: 2,
    member: 1
  };

  // Determine current option based on rank hierarchy
  const getRoleValue = (roleStr) => {
    const r = (roleStr || '').toLowerCase();
    if (r.includes('core') && !r.includes('head')) return 'core';
    if (r.includes('lead')) return 'leader';
    if (r.includes('head') || r.includes('admin')) return 'head';
    if (r.includes('core')) return 'core';
    return 'member';
  };

  // Handle Role Option Selection (core > leader > head > member)
  const handleRoleOptionChange = async (memberId, newOption) => {
    const memberToUpdate = members.find(m => m.id === memberId || m.member_id === memberId);
    if (!memberToUpdate) return;

    const oldRoleKey = getRoleValue(memberToUpdate.role);
    const oldRank = ROLE_RANKS[oldRoleKey] || 1;
    const newRank = ROLE_RANKS[newOption] || 1;

    const isPromotion = newRank > oldRank;
    const isDemotion = newRank < oldRank;
    const action = isPromotion ? 'PROMOTION' : (isDemotion ? 'DEMOTION' : 'ROLE_CHANGE');

    let roleTitle = 'Member';
    let category = 'Member';

    if (newOption === 'core') {
      roleTitle = 'Core Member';
      category = 'Core';
    } else if (newOption === 'leader') {
      roleTitle = 'Team Leader';
      category = 'Core';
    } else if (newOption === 'head') {
      roleTitle = 'Core Technical Head';
      category = 'Core';
    } else {
      roleTitle = 'Member';
      category = 'Member';
    }

    const payload = {
      member_id: memberId,
      category: category,
      role: roleTitle,
      action: action,
    };

    try {
      await adminAPI.promoteMember(payload);
    } catch {
      console.warn('Backend promotion endpoint offline, updating locally...');
    }

    setMembers(members.map(m => {
      if (m.id === memberId || m.member_id === memberId) {
        return {
          ...m,
          category: category,
          role: roleTitle,
        };
      }
      return m;
    }));

    // Re-fetch audit logs from server to show only real data
    try {
      const logsRes = await adminAPI.getAuditLogs();
      if (Array.isArray(logsRes?.data)) setActivityLogs(logsRes.data);
    } catch { /* keep existing logs */ }

    if (isPromotion) {
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.7 }
      });
    }
  };

  // Inline Department Quick Save
  const handleSaveInlineDept = async (memberId) => {
    if (!inlineDeptValue.trim()) {
      setInlineDeptEditingId(null);
      return;
    }

    const memberToUpdate = members.find(m => m.id === memberId || m.member_id === memberId);
    const newDept = inlineDeptValue.trim().toLowerCase();

    try {
      await adminAPI.promoteMember({
        member_id: memberId,
        department: newDept,
        action: 'DEPT_UPDATE'
      });
    } catch {
      console.warn('Department update saved locally...');
    }

    setMembers(members.map(m => {
      if (m.id === memberId || m.member_id === memberId) {
        return {
          ...m,
          department: newDept,
        };
      }
      return m;
    }));

    // Re-fetch audit logs from server to show only real data
    try {
      const logsRes = await adminAPI.getAuditLogs();
      if (Array.isArray(logsRes?.data)) setActivityLogs(logsRes.data);
    } catch { /* keep existing logs */ }

    setInlineDeptEditingId(null);
  };

  // Filter Members
  const filteredMembers = members.filter(m => {
    const name = m.name || m.user?.username || '';
    const memberId = m.member_id || m.membership_id || '';
    const role = m.role || '';
    const dept = (m.department?.dept_name || m.department || '').toLowerCase();
    const roleKey = getRoleValue(role);

    const matchesSearch = (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.includes(searchTerm.toLowerCase())
    );

    const matchesTier = selectedTierFilter === 'ALL' || 
      (selectedTierFilter === 'Core' && roleKey === 'core') || 
      (selectedTierFilter === 'Leader' && roleKey === 'leader') || 
      (selectedTierFilter === 'Head' && roleKey === 'head') || 
      (selectedTierFilter === 'Member' && roleKey === 'member');

    return matchesSearch && matchesTier;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" /> Administrative Hierarchy & Roster
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Role & Department Governance Dashboard
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage member ranks in hierarchy (Core &gt; Leader &gt; Head &gt; Member) and update department assignments.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member, ID, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white placeholder-gray-500"
            />
          </div>

          <select
            value={selectedTierFilter}
            onChange={(e) => setSelectedTierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs bg-slate-900 text-white"
          >
            <option value="ALL">All Roles</option>
            <option value="Core">Core</option>
            <option value="Leader">Leader</option>
            <option value="Head">Head</option>
            <option value="Member">Member</option>
          </select>
        </div>
      </div>

      {/* 1. MEMBERS ROSTER TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" /> Active Roster & Role Assignments
          </h2>
          <span className="text-xs text-gray-400 font-mono">
            {filteredMembers.length} Members registered
          </span>
        </div>

        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-xs">Loading members roster...</div>
          ) : filteredMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-gray-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">MEMBER</th>
                    <th className="px-6 py-3.5">DEPARTMENT</th>
                    <th className="px-6 py-3.5">CURRENT ROLE</th>
                    <th className="px-6 py-3.5">TIER</th>
                    <th className="px-6 py-3.5 text-right">MODIFY PERMISSION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-gray-300">
                  {filteredMembers.map((m) => {
                    const memberName = m.name || m.user?.username || 'Member';
                    const deptName = m.department?.dept_name || m.department || 'dev';
                    const memberId = m.member_id || m.membership_id || 'Pending';
                    const avatarUrl = m.avatar || m.image || `https://api.dicebear.com/7.x/bottts/svg?seed=${memberId}`;
                    const isCore = m.category === 'Core' || m.role?.toLowerCase().includes('core') || m.role?.toLowerCase().includes('lead');
                    const isInlineEditing = inlineDeptEditingId === m.id;
                    const roleKey = getRoleValue(m.role);

                    return (
                      <tr key={m.id} className="hover:bg-slate-900/40 transition">
                        {/* Member Name & ID */}
                        <td className="px-6 py-4 flex items-center gap-3">
                          <img
                            src={avatarUrl}
                            alt={memberName}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 bg-slate-950"
                          />
                          <div>
                            <p className="font-bold text-white text-sm">{memberName}</p>
                            <p className="text-[11px] font-mono text-cyan-400 font-semibold">{memberId}</p>
                          </div>
                        </td>

                        {/* Department with inline edit */}
                        <td className="px-6 py-4 font-mono font-medium">
                          {isInlineEditing ? (
                            <div className="flex items-center gap-1.5 animate-fadeIn">
                              <input
                                type="text"
                                value={inlineDeptValue}
                                onChange={(e) => setInlineDeptValue(e.target.value)}
                                placeholder="dept name"
                                className="w-24 px-2 py-1 rounded-lg glass-input text-xs text-white font-mono bg-slate-950 border-cyan-500/50"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlineDept(m.id);
                                  if (e.key === 'Escape') setInlineDeptEditingId(null);
                                }}
                              />
                              <button
                                onClick={() => handleSaveInlineDept(m.id)}
                                className="p-1 rounded-md bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-400 transition"
                                title="Save Department"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setInlineDeptEditingId(null)}
                                className="p-1 rounded-md bg-slate-800 text-gray-400 hover:text-white transition"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <span className="text-slate-300 font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                                {deptName}
                              </span>
                              <button
                                onClick={() => {
                                  setInlineDeptEditingId(m.id);
                                  setInlineDeptValue(deptName);
                                }}
                                className="p-1 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-slate-800 transition opacity-60 group-hover:opacity-100"
                                title="Quick edit department"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Current Role */}
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">{m.role || 'Member'}</p>
                          <p className="text-[10px] text-gray-400 font-mono">Joined: {m.joined_date || 'Active'}</p>
                        </td>

                        {/* Tier Badge */}
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-semibold ${
                            isCore
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {isCore ? 'Core' : 'Member'}
                          </span>
                        </td>

                        {/* Modify Permission Dropdown: member, core, leader, head */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end">
                            <div className="relative inline-block w-40">
                              <select
                                value={roleKey}
                                onChange={(e) => handleRoleOptionChange(m.id, e.target.value)}
                                className={`w-full py-2 pl-3.5 pr-8 rounded-xl font-medium text-xs appearance-none cursor-pointer transition border focus:outline-none ${
                                  roleKey === 'head'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                                    : roleKey === 'leader'
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                                    : roleKey === 'core'
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                                }`}
                              >
                                <option value="core" className="bg-slate-900 text-indigo-300">
                                  Core
                                </option>
                                <option value="leader" className="bg-slate-900 text-cyan-300">
                                  Leader
                                </option>
                                <option value="head" className="bg-slate-900 text-amber-300">
                                  Head
                                </option>
                                <option value="member" className="bg-slate-900 text-gray-200">
                                  Member
                                </option>
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs">
              No roster records found.
            </div>
          )}
        </div>
      </div>

      {/* 2. RECENT PROMOTION & DEMOTION AUDIT LOGS */}
      {activityLogs.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" /> Administrative Audit Trail
          </h2>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            {activityLogs.map((log) => {
              const targetName = log.target_user || log.target || 'Member';
              const toRoleName = log.to_role || log.toRole || 'Updated Role';
              const fromRoleName = log.from_role || log.fromRole;
              const byAuthor = log.performed_by || log.by || 'Administrator';
              const formattedTime = log.time || (log.created_at ? new Date(log.created_at).toLocaleDateString() : 'Recent');

              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      log.action === 'PROMOTION'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : log.action === 'DEMOTION'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {log.action || 'CHANGE'}
                    </span>
                    <span className="text-white font-semibold">{targetName}</span>
                    <span className="text-gray-400 text-[11px]">
                      {fromRoleName ? (
                        <>
                          <span className="text-gray-500 line-through mr-1">{fromRoleName}</span>
                          &rarr; <strong className="text-cyan-300 font-mono ml-1">{toRoleName}</strong>
                        </>
                      ) : (
                        <>changed to <strong className="text-cyan-300 font-mono">{toRoleName}</strong></>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono shrink-0">
                    <span>By: <span className="text-gray-300 font-semibold">{byAuthor}</span></span>
                    <span>•</span>
                    <span>{formattedTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default RolePromotion;
