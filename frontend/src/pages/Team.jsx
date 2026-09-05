import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Crown, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpDown, 
  Filter,
  Star,
  Award
} from 'lucide-react';
import { membersAPI } from '../services/api';

const ROLE_RANKS = {
  Core: 4,
  Leader: 3,
  Head: 2,
  Member: 1
};

const Team = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL'); // 'ALL' | 'Core' | 'Leader' | 'Head' | 'Member'
  const [sortBy, setSortBy] = useState('HIERARCHY'); // 'HIERARCHY' | 'HEADS_FIRST' | 'NAME_ASC' | 'NEWEST'

  useEffect(() => {
    membersAPI.getAll()
      .then((res) => {
        setMembers(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Members API currently offline or empty:', err);
        setMembers([]);
        setLoading(false);
      });
  }, []);

  // Helper to resolve clean role category
  const getMemberRoleCategory = (m) => {
    const r = (m.role || '').toLowerCase();
    if (r.includes('core') && !r.includes('head')) return 'Core';
    if (r.includes('lead')) return 'Leader';
    if (r.includes('head') || r.includes('admin')) return 'Head';
    if (r.includes('core')) return 'Core';
    return 'Member';
  };

  // Filter & Sort Members
  const processedMembers = useMemo(() => {
    let result = members.filter((m) => {
      const name = m.name || m.user?.username || m.member_id || '';
      const role = m.role || '';
      const memberId = m.member_id || '';
      const dept = (m.department?.dept_name || m.department || '').toLowerCase();
      const roleCategory = getMemberRoleCategory(m);

      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            dept.includes(searchTerm.toLowerCase());

      const matchesDept = selectedDept === 'ALL' || 
                          dept === selectedDept.toLowerCase() || 
                          (selectedDept === 'ui/ux' && (dept.includes('ui') || dept.includes('design'))) || 
                          (selectedDept === 'dev' && dept.includes('dev')) || 
                          (selectedDept === 'doc' && dept.includes('doc')) || 
                          (selectedDept === 'res' && (dept.includes('res') || dept.includes('research'))) || 
                          (selectedDept === 'iot' && dept.includes('iot')) || 
                          (selectedDept === 'mkt' && (dept.includes('mkt') || dept.includes('market')));

      const matchesRole = selectedRoleFilter === 'ALL' || roleCategory === selectedRoleFilter;

      return matchesSearch && matchesDept && matchesRole;
    });

    // Sorting Logic
    return result.sort((a, b) => {
      const catA = getMemberRoleCategory(a);
      const catB = getMemberRoleCategory(b);
      const rankA = ROLE_RANKS[catA] || 1;
      const rankB = ROLE_RANKS[catB] || 1;

      if (sortBy === 'HEADS_FIRST') {
        const isHeadA = catA === 'Head' ? 1 : 0;
        const isHeadB = catB === 'Head' ? 1 : 0;
        if (isHeadB !== isHeadA) return isHeadB - isHeadA;
        return (ROLE_RANKS[catB] || 0) - (ROLE_RANKS[catA] || 0);
      }

      if (sortBy === 'HIERARCHY') {
        if (rankB !== rankA) return rankB - rankA;
        return (a.name || '').localeCompare(b.name || '');
      }

      if (sortBy === 'NAME_ASC') {
        return (a.name || a.user?.username || '').localeCompare(b.name || b.user?.username || '');
      }

      if (sortBy === 'NEWEST') {
        return new Date(b.joined_date || 0) - new Date(a.joined_date || 0);
      }

      return 0;
    });
  }, [members, searchTerm, selectedDept, selectedRoleFilter, sortBy]);

  // Dynamic Metrics
  const headsCount = useMemo(() => members.filter(m => getMemberRoleCategory(m) === 'Head').length, [members]);
  const coreCount = useMemo(() => members.filter(m => getMemberRoleCategory(m) === 'Core').length, [members]);
  const leaderCount = useMemo(() => members.filter(m => getMemberRoleCategory(m) === 'Leader').length, [members]);
  const memberCount = useMemo(() => members.filter(m => getMemberRoleCategory(m) === 'Member').length, [members]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <Users className="w-3.5 h-3.5" /> Team Roster & Hierarchy
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Meet the Minds Behind
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            <br/>Code Crashers
          </span>
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          From visionary Core leads and Department Heads to student engineers building the next generation of campus tech.
        </p>
      </div>

      {/* Filter, Sort & Search Bar */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border border-slate-800 shadow-xl">
        
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roster by name, role, dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-gray-500 focus:outline-none"
          />
        </div>

        {/* Filters and Sorting Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Role Filter Tabs (All, Core, Leader, Head, Member) */}
          <div className="flex flex-wrap items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs">
            {[
              { key: 'ALL', label: 'All', count: members.length },
              { key: 'Core', label: 'Core', count: coreCount },
              { key: 'Leader', label: 'Leader', count: leaderCount },
              { key: 'Head', label: 'Heads', count: headsCount },
              { key: 'Member', label: 'Members', count: memberCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedRoleFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl transition font-medium text-xs flex items-center gap-1.5 ${
                  selectedRoleFilter === tab.key
                    ? tab.key === 'Head'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : tab.key === 'Leader'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : tab.key === 'Core'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="text-[10px] opacity-70 font-mono">({tab.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown with Heads Sort */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-2xl border border-slate-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-gray-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="HIERARCHY" className="bg-slate-900 text-white">Sort: Hierarchy (Core → Member)</option>
              <option value="HEADS_FIRST" className="bg-slate-900 text-amber-300">Sort: Heads First 👑</option>
              <option value="NAME_ASC" className="bg-slate-900 text-white">Sort: Name (A-Z)</option>
              <option value="NEWEST" className="bg-slate-900 text-white">Sort: Newest Joined</option>
            </select>
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-2xl glass-input text-xs bg-slate-900 text-gray-200 font-medium focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="ui/ux">UI/UX DESIGNER</option>
            <option value="dev">DEVELOPER</option>
            <option value="doc">DOCUMENTARY</option>
            <option value="res">RESEARCH</option>
            <option value="iot">IOT</option>
            <option value="mkt">MARKETING</option>
          </select>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="glass-panel rounded-3xl p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : processedMembers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedMembers.map((member) => {
            const memberName = member.name || member.user?.username || 'Member';
            const deptName = member.department?.dept_name || member.department || 'dev';
            const avatarUrl = member.avatar || member.image || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.member_id || member.id}`;
            const roleCategory = getMemberRoleCategory(member);

            return (
              <div
                key={member.id}
                className={`glass-panel rounded-3xl p-6 space-y-4 transition-all duration-300 hover:scale-[1.01] group border flex flex-col justify-between relative overflow-hidden ${
                  roleCategory === 'Head'
                    ? 'border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                    : roleCategory === 'Leader'
                    ? 'border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]'
                    : roleCategory === 'Core'
                    ? 'border-indigo-500/40 hover:border-indigo-400 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Subtle top indicator bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  roleCategory === 'Head'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                    : roleCategory === 'Leader'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                    : roleCategory === 'Core'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                    : 'bg-transparent'
                }`} />

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={avatarUrl}
                        alt={memberName}
                        className={`w-16 h-16 rounded-2xl object-cover ring-2 transition bg-slate-950 ${
                          roleCategory === 'Head'
                            ? 'ring-amber-500/50 group-hover:ring-amber-400'
                            : roleCategory === 'Leader'
                            ? 'ring-cyan-500/50 group-hover:ring-cyan-400'
                            : roleCategory === 'Core'
                            ? 'ring-indigo-500/50 group-hover:ring-indigo-400'
                            : 'ring-slate-700 group-hover:ring-slate-600'
                        }`}
                      />
                      <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 bg-slate-950 border border-slate-700 text-[9px] font-mono text-cyan-300 rounded font-bold">
                        {deptName}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-white truncate group-hover:text-cyan-300 transition">
                          {memberName}
                        </h3>
                        {roleCategory === 'Head' && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Department Head" />
                        )}
                        {roleCategory === 'Leader' && (
                          <Star className="w-3.5 h-3.5 text-cyan-400 shrink-0" title="Team Leader" />
                        )}
                      </div>

                      {/* Role Pill Badge */}
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                          roleCategory === 'Head'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : roleCategory === 'Leader'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : roleCategory === 'Core'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : 'bg-slate-800 text-gray-400 border border-slate-700'
                        }`}>
                          {member.role || 'Active Member'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {member.bio && (
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                      {member.bio}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-cyan-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    {member.member_id || 'ID Pending'}
                  </span>

                  <span className="text-[10px] text-gray-500 font-mono">
                    Joined: {member.joined_date || 'Active'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-gray-400 glass-panel rounded-3xl text-xs space-y-2">
          <Users className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="font-semibold text-white">No registered members found</p>
          <p className="text-gray-500">Try adjusting your role or department filter criteria.</p>
        </div>
      )}

    </div>
  );
};

export default Team;
