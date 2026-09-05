import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  User, 
  Share2, 
  Check, 
  Copy, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  Tag, 
  Eye, 
  LayoutGrid, 
  List, 
  X,
  ExternalLink,
  Flame,
  ShieldCheck,
  RefreshCw,
  Megaphone,
  UserCheck,
  Users,
  AtSign,
  CheckSquare,
  Square,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { attendanceAPI, membersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const NOTICE_CATEGORIES = [
  'Announcement',
  'Event',
  'Rules & Regulations',
  'Mentioned Member only'
];

const NoticeSheets = () => {
  const { user, isAdmin } = useAuth();
  const [notices, setNotices] = useState([]);
  const [registeredMembers, setRegisteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNoticeForView, setSelectedNoticeForView] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // New Notice form
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'General',
    category: 'Announcement',
    targetAudience: 'All Members',
    mentionedMembers: [], // [{ id, name, memberId, role, avatar }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotices = async () => {
    setIsRefreshing(true);
    try {
      const [noticesRes, membersRes] = await Promise.allSettled([
        attendanceAPI.getNotices(),
        membersAPI.getAll()
      ]);

      if (noticesRes.status === 'fulfilled' && Array.isArray(noticesRes.value.data)) {
        setNotices(noticesRes.value.data);
      } else {
        setNotices([]);
      }

      if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value.data)) {
        setRegisteredMembers(membersRes.value.data);
      }
    } catch (err) {
      console.warn('Notice sheets API offline or empty:', err);
      setNotices([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleToggleMember = (member) => {
    const memId = member.member_id || member.id;
    const name = member.name || member.user?.username || member.member_id;
    const avatar = member.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${memId}`;
    const role = member.role || 'Member';
    const dept = member.department?.dept_name || member.department || '';

    const exists = formData.mentionedMembers.some((m) => m.id === memId);
    if (exists) {
      setFormData((prev) => ({
        ...prev,
        mentionedMembers: prev.mentionedMembers.filter((m) => m.id !== memId)
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        mentionedMembers: [
          ...prev.mentionedMembers,
          { id: memId, name, avatar, role, dept }
        ]
      }));
    }
  };

  const handleSelectAllMembers = () => {
    const all = registeredMembers.map((member) => {
      const memId = member.member_id || member.id;
      return {
        id: memId,
        name: member.name || member.user?.username || member.member_id,
        avatar: member.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${memId}`,
        role: member.role || 'Member',
        dept: member.department?.dept_name || member.department || ''
      };
    });
    setFormData((prev) => ({ ...prev, mentionedMembers: all }));
  };

  const handleClearMentionedMembers = () => {
    setFormData((prev) => ({ ...prev, mentionedMembers: [] }));
  };

  const handleInsertMentionsIntoContent = () => {
    if (formData.mentionedMembers.length === 0) return;
    const mentionTags = formData.mentionedMembers.map(m => `@${m.name}`).join(' ');
    const newContent = formData.content 
      ? `${formData.content}\n\nAttention: ${mentionTags}`
      : `Attention: ${mentionTags}\n\n`;
    setFormData((prev) => ({ ...prev, content: newContent }));
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    setIsSubmitting(true);
    const isMentionedOnly = formData.category === 'Mentioned Member only';
    const mentionedMembersJson = isMentionedOnly && formData.mentionedMembers.length > 0
      ? JSON.stringify(formData.mentionedMembers)
      : '';

    const audienceSummary = isMentionedOnly
      ? (formData.mentionedMembers.length > 0
          ? `${formData.mentionedMembers.length} Mentioned Member(s)`
          : 'Mentioned Members')
      : 'All Members';

    const payload = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      priority: formData.priority,
      category: formData.category,
      target_audience: audienceSummary,
      mentioned_members: mentionedMembersJson,
    };

    try {
      await attendanceAPI.createNotice(payload);
      // Re-fetch from server so only real persisted data is shown
      await fetchNotices();
      setShowCreateModal(false);
      setFormData({
        title: '',
        content: '',
        priority: 'General',
        category: 'Announcement',
        targetAudience: 'All Members',
        mentionedMembers: [],
      });
      setMemberSearchTerm('');
    } catch (err) {
      console.error('Failed to create notice:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyNotice = (notice) => {
    const textToCopy = `[${notice.category || 'Announcement'}] [${notice.priority || 'NOTICE'}] ${notice.title}\n\n${notice.content}\n\nIssued by: ${notice.author || 'Administrator'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(notice.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const parseMentionedMembers = (notice) => {
    if (!notice.mentioned_members) return [];
    if (Array.isArray(notice.mentioned_members)) return notice.mentioned_members;
    try {
      const parsed = JSON.parse(notice.mentioned_members);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return notice.mentioned_members.split(',').map((n, idx) => ({ id: idx, name: n.trim() }));
    }
  };

  const isCurrentUserMentioned = (notice) => {
    if (!user) return false;
    const mentions = parseMentionedMembers(notice);
    const uname = (user.username || '').toLowerCase();
    const name = (user.name || '').toLowerCase();
    const mid = (user.membershipId || user.membership_id || '').toLowerCase();

    return mentions.some((m) => {
      const mName = (m.name || '').toLowerCase();
      const mId = (m.id || '').toLowerCase();
      return (
        mName === name ||
        mName === uname ||
        mId === mid ||
        (uname && mName.includes(uname))
      );
    });
  };

  const getPriorityStyle = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
      case 'critical':
        return {
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
          border: 'hover:border-rose-500/50',
          dot: 'bg-rose-500 animate-ping',
          icon: <Flame className="w-3.5 h-3.5 text-rose-400" />
        };
      case 'high':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
          border: 'hover:border-amber-500/50',
          dot: 'bg-amber-500',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
        };
      case 'medium':
        return {
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          border: 'hover:border-cyan-500/50',
          dot: 'bg-cyan-500',
          icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        };
      default:
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          border: 'hover:border-emerald-500/50',
          dot: 'bg-emerald-500',
          icon: <Tag className="w-3.5 h-3.5 text-emerald-400" />
        };
    }
  };

  const getCategoryStyle = (cat) => {
    switch (cat) {
      case 'Event':
        return {
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]',
          dot: 'bg-purple-400',
          icon: <Calendar className="w-3 h-3 text-purple-400" />
        };
      case 'Rules & Regulations':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
          dot: 'bg-amber-400',
          icon: <ShieldCheck className="w-3 h-3 text-amber-400" />
        };
      case 'Mentioned Member only':
        return {
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.15)]',
          dot: 'bg-rose-400',
          icon: <AtSign className="w-3 h-3 text-rose-400" />
        };
      case 'Announcement':
      default:
        return {
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
          dot: 'bg-cyan-400',
          icon: <Sparkles className="w-3 h-3 text-cyan-400" />
        };
    }
  };

  const filteredNotices = notices.filter((notice) => {
    const titleMatch = (notice.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const contentMatch = (notice.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    const authorMatch = (notice.author || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = titleMatch || contentMatch || authorMatch;

    const priority = (notice.priority || 'General').toUpperCase();
    const matchesPriority = selectedPriority === 'ALL' || priority === selectedPriority;

    const category = notice.category || 'Announcement';
    const matchesCategory = selectedCategory === 'ALL' || category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesPriority && matchesCategory;
  });

  const filteredRegisteredMembers = registeredMembers.filter((m) => {
    const query = memberSearchTerm.toLowerCase();
    const nameMatch = (m.name || '').toLowerCase().includes(query);
    const idMatch = (m.member_id || '').toLowerCase().includes(query);
    const roleMatch = (m.role || '').toLowerCase().includes(query);
    const deptMatch = (m.department?.dept_name || m.department || '').toLowerCase().includes(query);
    return nameMatch || idMatch || roleMatch || deptMatch;
  });

  const urgentCount = notices.filter(n => ['URGENT', 'CRITICAL'].includes((n.priority || '').toUpperCase())).length;
  const highCount = notices.filter(n => (n.priority || '').toUpperCase() === 'HIGH').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-cyan-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-wider uppercase">
              <Bell className="w-3.5 h-3.5 animate-bounce" /> Official Communications & Bulletins
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Notice Sheets & Circulars
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Official announcements, events, institutional regulations, and direct registered member notices published by Code Crashers administration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchNotices}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 text-xs font-mono border border-slate-700/80 flex items-center gap-2 transition"
              title="Refresh notices"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                <Plus className="w-4 h-4" />
                Issue Notice Sheet
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
            <p className="text-[11px] text-gray-400 uppercase font-mono">Total Notice Sheets</p>
            <p className="text-xl font-bold text-white font-mono mt-0.5">{notices.length} Published</p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
            <p className="text-[11px] text-rose-400 uppercase font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Urgent Directives
            </p>
            <p className="text-xl font-bold text-rose-300 font-mono mt-0.5">{urgentCount} High Priority</p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
            <p className="text-[11px] text-amber-400 uppercase font-mono">Action Items</p>
            <p className="text-xl font-bold text-amber-300 font-mono mt-0.5">{highCount} Open Sprints</p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
            <p className="text-[11px] text-emerald-400 uppercase font-mono">Channel Security</p>
            <p className="text-xl font-bold text-emerald-300 font-mono mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Verified
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters, Priority Filters & View Toggle */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
        
        {/* Top Controls Row: Search + Priority Filter + View Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notice by title, keyword, or issuer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs text-white placeholder-gray-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Priority Filter Buttons & Layout Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
              {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'GENERAL'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    selectedPriority === p
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {p === 'ALL' ? 'All Priority' : p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Notice Categories Filter Pills */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400 uppercase shrink-0">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Category:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin flex-wrap">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border ${
                selectedCategory === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm font-semibold'
                  : 'bg-slate-900/80 text-gray-400 border-slate-800 hover:text-gray-200 hover:bg-slate-800'
              }`}
            >
              <span>All Categories</span>
              <span className="text-[10px] font-mono opacity-75">({notices.length})</span>
            </button>

            {NOTICE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const style = getCategoryStyle(cat);
              const count = notices.filter(n => (n.category || 'Announcement') === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border ${
                    isSelected
                      ? `${style.badge} font-semibold`
                      : 'bg-slate-900/80 text-gray-400 border-slate-800 hover:text-gray-200 hover:bg-slate-800'
                  }`}
                >
                  {style.icon}
                  <span>{cat}</span>
                  {count > 0 && (
                    <span className="text-[10px] font-mono opacity-75">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Main Notice Sheet Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-800 rounded w-24"></div>
                <div className="h-4 bg-slate-800 rounded w-16"></div>
              </div>
              <div className="h-6 bg-slate-800 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-800 rounded w-full"></div>
                <div className="h-3 bg-slate-800 rounded w-5/6"></div>
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-between">
                <div className="h-4 bg-slate-800 rounded w-20"></div>
                <div className="h-4 bg-slate-800 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotices.length > 0 ? (
        viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotices.map((notice) => {
              const priorityStyle = getPriorityStyle(notice.priority);
              const categoryStyle = getCategoryStyle(notice.category || 'Announcement');
              const mentions = parseMentionedMembers(notice);
              const userMentioned = isCurrentUserMentioned(notice);

              return (
                <div
                  key={notice.id}
                  className={`glass-panel p-6 rounded-3xl border border-slate-800/90 transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between space-y-4 group ${
                    userMentioned ? 'ring-2 ring-rose-500/50 border-rose-500/40 bg-rose-950/10' : priorityStyle.border
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Metadata */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${priorityStyle.badge}`}>
                          {priorityStyle.icon}
                          {notice.priority || 'General'}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border ${categoryStyle.badge}`}>
                          {categoryStyle.icon}
                          {notice.category || 'Announcement'}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        {notice.date || (notice.created_at ? new Date(notice.created_at).toLocaleDateString() : 'Recent')}
                      </span>
                    </div>

                    {/* Mention notification banner for logged in user */}
                    {userMentioned && (
                      <div className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-mono flex items-center gap-1.5 animate-pulse">
                        <AtSign className="w-3 h-3" />
                        <span>You are mentioned in this notice</span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 
                      onClick={() => setSelectedNoticeForView(notice)}
                      className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors cursor-pointer leading-snug"
                    >
                      {notice.title}
                    </h3>

                    {/* Content Preview */}
                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                      {notice.content}
                    </p>

                    {/* Mentioned Members preview badge row */}
                    {mentions.length > 0 && (
                      <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <Users className="w-3 h-3 text-rose-400" /> Mentioned:
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {mentions.slice(0, 3).map((m, idx) => (
                            <span 
                              key={m.id || idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30"
                            >
                              @{m.name || m}
                            </span>
                          ))}
                          {mentions.length > 3 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-gray-400 border border-slate-700">
                              +{mentions.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="truncate max-w-[120px] sm:max-w-[140px] text-gray-300 font-medium">
                        {notice.author || 'Administrator'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyNotice(notice)}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-gray-400 hover:text-white transition"
                        title="Copy notice text"
                      >
                        {copiedId === notice.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedNoticeForView(notice)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[11px] font-semibold border border-cyan-500/30 transition flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Read
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
            {filteredNotices.map((notice) => {
              const priorityStyle = getPriorityStyle(notice.priority);
              const categoryStyle = getCategoryStyle(notice.category || 'Announcement');
              const mentions = parseMentionedMembers(notice);
              const userMentioned = isCurrentUserMentioned(notice);

              return (
                <div
                  key={notice.id}
                  className={`p-4 sm:p-5 hover:bg-slate-900/60 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    userMentioned ? 'bg-rose-950/15 border-l-4 border-l-rose-500' : ''
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${priorityStyle.badge}`}>
                        {priorityStyle.icon}
                        {notice.priority || 'General'}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border ${categoryStyle.badge}`}>
                        {categoryStyle.icon}
                        {notice.category || 'Announcement'}
                      </span>
                      {userMentioned && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <AtSign className="w-2.5 h-2.5" /> Mentioned You
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        {notice.date || (notice.created_at ? new Date(notice.created_at).toLocaleDateString() : 'Recent')}
                      </span>
                    </div>

                    <h3 
                      onClick={() => setSelectedNoticeForView(notice)}
                      className="text-sm sm:text-base font-bold text-white hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      {notice.title}
                    </h3>

                    <p className="text-xs text-gray-400 line-clamp-2 max-w-3xl">
                      {notice.content}
                    </p>

                    {mentions.length > 0 && (
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-mono">Members:</span>
                        {mentions.slice(0, 4).map((m, idx) => (
                          <span 
                            key={m.id || idx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-slate-700"
                          >
                            @{m.name || m}
                          </span>
                        ))}
                        {mentions.length > 4 && (
                          <span className="text-[10px] text-gray-500 font-mono">+{mentions.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <span className="text-xs text-gray-400 font-mono hidden lg:inline">
                      By: <strong className="text-gray-300">{notice.author || 'Administrator'}</strong>
                    </span>

                    <button
                      onClick={() => handleCopyNotice(notice)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition"
                      title="Copy content"
                    >
                      {copiedId === notice.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedNoticeForView(notice)}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 font-medium text-xs border border-cyan-500/40 transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Sheet
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-gray-500 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Notice Sheets Found</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              {searchTerm 
                ? `No notices matched your search query "${searchTerm}". Try resetting filters.` 
                : selectedCategory !== 'ALL'
                ? `No notices found under the "${selectedCategory}" category.`
                : 'No official announcements have been published in this category yet.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition"
            >
              Issue First Notice
            </button>
          )}
        </div>
      )}

      {/* MODAL: READ FULL NOTICE SHEET */}
      {selectedNoticeForView && (
        <div 
          onClick={() => setSelectedNoticeForView(null)}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md animate-fadeIn"
        >
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div 
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full glass-panel-glow p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-6 relative my-auto max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedNoticeForView(null)}
                className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-800/80 text-gray-400 hover:text-white hover:bg-slate-700 transition"
              >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full border ${getPriorityStyle(selectedNoticeForView.priority).badge}`}>
                  {getPriorityStyle(selectedNoticeForView.priority).icon}
                  {selectedNoticeForView.priority || 'General'}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg border ${getCategoryStyle(selectedNoticeForView.category || 'Announcement').badge}`}>
                  {getCategoryStyle(selectedNoticeForView.category || 'Announcement').icon}
                  Category: {selectedNoticeForView.category || 'Announcement'}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {selectedNoticeForView.date || (selectedNoticeForView.created_at ? new Date(selectedNoticeForView.created_at).toLocaleString() : 'Recent')}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {selectedNoticeForView.title}
              </h2>
            </div>

            {/* Mentioned Members Banner in View Modal */}
            {parseMentionedMembers(selectedNoticeForView).length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                    <AtSign className="w-4 h-4 text-rose-400" />
                    Directly Mentioned Registered Members ({parseMentionedMembers(selectedNoticeForView).length})
                  </span>
                  {isCurrentUserMentioned(selectedNoticeForView) && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                      You are mentioned
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {parseMentionedMembers(selectedNoticeForView).map((m, idx) => (
                    <div 
                      key={m.id || idx}
                      className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-rose-500/30 flex items-center gap-2"
                    >
                      <img 
                        src={m.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.id || m.name}`} 
                        alt={m.name} 
                        className="w-5 h-5 rounded-full bg-slate-950" 
                      />
                      <span className="text-xs text-white font-medium">@{m.name || m}</span>
                      {m.role && <span className="text-[10px] font-mono text-gray-400">({m.role})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-gray-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {selectedNoticeForView.content}
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs">
                  {(selectedNoticeForView.author || 'A')[0]}
                </div>
                <div>
                  <p className="text-white font-semibold">{selectedNoticeForView.author || 'Administrator'}</p>
                  <p className="text-[10px] text-gray-400 font-mono">Official Authority • Code Crashers</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyNotice(selectedNoticeForView)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 font-medium transition flex items-center gap-1.5"
                >
                  {copiedId === selectedNoticeForView.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Notice</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedNoticeForView(null)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* MODAL: CREATE / ISSUE NEW NOTICE SHEET */}
      {showCreateModal && (
        <div 
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md animate-fadeIn"
        >
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div 
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full glass-panel-glow p-6 sm:p-8 rounded-3xl border border-cyan-500/30 space-y-5 relative my-auto"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-800/80 text-gray-400 hover:text-white hover:bg-slate-700 transition"
              >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Broadcast New Notice Sheet</h3>
                <p className="text-xs text-gray-400">Issue an institutional directive or targeted member notice</p>
              </div>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-gray-300 font-medium">Notice Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sprint 4 Check-in & Architecture Briefing"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-medium">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input bg-slate-900 text-white focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent / Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-medium">Notice Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input bg-slate-900 text-white focus:outline-none"
                  >
                    {NOTICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* REGISTERED MEMBER SELECTION PANEL FOR "Mentioned Member only" */}
              {formData.category === 'Mentioned Member only' && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/40 space-y-3 shadow-lg shadow-rose-950/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AtSign className="w-4 h-4 text-rose-400" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Select Registered Members to Mention</h4>
                        <p className="text-[10px] text-gray-400">
                          {formData.mentionedMembers.length} member(s) selected
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllMembers}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono border border-slate-700 transition"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearMentionedMembers}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white text-[11px] font-mono border border-slate-700 transition"
                      >
                        Clear
                      </button>
                      {formData.mentionedMembers.length > 0 && (
                        <button
                          type="button"
                          onClick={handleInsertMentionsIntoContent}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-medium border border-rose-500/40 transition flex items-center gap-1"
                          title="Append @Name tags into message body"
                        >
                          <AtSign className="w-3 h-3" /> Insert in Message
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected Members Chips */}
                  {formData.mentionedMembers.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto p-2 rounded-xl bg-slate-950/70 border border-slate-800 scrollbar-thin">
                      {formData.mentionedMembers.map((m) => (
                        <span 
                          key={m.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono group"
                        >
                          <img 
                            src={m.avatar} 
                            alt={m.name} 
                            className="w-3.5 h-3.5 rounded-full" 
                          />
                          <span className="font-semibold">@{m.name}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleMember({ member_id: m.id, name: m.name })}
                            className="text-rose-400 hover:text-white transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search Input for Registered Members */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search member by name, membership ID, role, or department..."
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white placeholder-gray-500 focus:outline-none"
                    />
                  </div>

                  {/* Member Selection List */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {filteredRegisteredMembers.length > 0 ? (
                      filteredRegisteredMembers.map((member) => {
                        const memId = member.member_id || member.id;
                        const isSelected = formData.mentionedMembers.some((m) => m.id === memId);
                        const memName = member.name || member.user?.username || member.member_id;
                        const memRole = member.role || 'Member';
                        const memDept = member.department?.dept_name || member.department || 'dev';
                        const avatarUrl = member.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${memId}`;

                        return (
                          <div
                            key={memId}
                            onClick={() => handleToggleMember(member)}
                            className={`p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-sm'
                                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <img
                                  src={avatarUrl}
                                  alt={memName}
                                  className="w-8 h-8 rounded-xl object-cover bg-slate-900 border border-slate-700"
                                />
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full flex items-center justify-center text-white">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-white text-xs">{memName}</p>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                                    {memId}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-mono">
                                  {memRole} • <span className="uppercase">{memDept}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-rose-400" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-xs">
                        {memberSearchTerm ? `No members matched "${memberSearchTerm}"` : 'No registered members found.'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-gray-300 font-medium">Notice Content & Instructions</label>
                <textarea
                  placeholder="Provide comprehensive details, action items, and relevant timelines..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white focus:outline-none"
                ></textarea>
              </div>

              {/* Email Broadcast Notice Banner */}
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-2.5 text-xs text-cyan-300">
                <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>
                  {formData.category === 'Mentioned Member only'
                    ? `An email circular with notice details will be dispatched to ${formData.mentionedMembers.length || 'all'} member(s).`
                    : 'An email circular with full notice details will be automatically dispatched to all registered members.'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold transition shadow-md shadow-cyan-500/25 flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Publishing & Dispatching...' : 'Broadcast Notice Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

    </div>
  );
};

export default NoticeSheets;
