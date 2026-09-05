import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FolderKanban, 
  Search, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Code2, 
  Sparkles, 
  Users, 
  ArrowUpRight, 
  Filter, 
  Activity, 
  Calendar, 
  X, 
  ChevronRight, 
  Cpu, 
  Globe, 
  AlertCircle,
  LayoutGrid,
  ListFilter,
  CheckCheck,
  TrendingUp,
  Tag,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Presentation,
  FileSpreadsheet,
  FileCode,
  Archive,
  Download,
  Trash2,
  UploadCloud,
  Eye,
  RefreshCw,
  File,
  Play,
  Pause,
  Maximize2,
  Mail,
  AtSign,
  UserCheck,
  CheckSquare,
  Square,
  Check,
  Shield,
  Edit3,
  Lock,
  Unlock,
  Link2,
  Copy,
  Bookmark,
  Compass
} from 'lucide-react';
import { projectsAPI, membersAPI, BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

const DOMAIN_CATEGORIES = [
  { id: 'ALL', label: 'All Domains' },
  { id: 'dev', label: 'Development (WEB / APP)' },
  { id: 'ai', label: 'AI & Machine Learning' },
  { id: 'iot', label: 'Robotics & IoT' },
  { id: 'ui/ux', label: 'UI/UX Design' },
  { id: 'doc', label: 'Documentary & Specification' },
  { id: 'res', label: 'Research & Deployment' },
];

const STATUS_FILTERS = ['ALL', 'Active', 'In Progress', 'Planning', 'Completed'];

const RESOURCE_TYPE_FILTERS = [
  { id: 'ALL', label: 'All Vault Items' },
  { id: 'url', label: 'Web URLs & Links' },
  { id: 'pdf', label: 'PDFs' },
  { id: 'doc', label: 'Docs & Sheets' },
  { id: 'image', label: 'Images' },
  { id: 'audio', label: 'Audio' },
  { id: 'video', label: 'Videos' },
  { id: 'ppt', label: 'Presentations' },
  { id: 'code', label: 'Code & Scripts' },
  { id: 'zip', label: 'Archives' },
];

const Projects = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'PROGRESS_DESC' | 'TITLE_ASC'
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' | 'LIST'

  // Modals & Details State
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalTab, setModalTab] = useState('overview'); // 'overview' | 'resources'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Resource Management in Selected Project State
  const [projectResources, setProjectResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [uploadingResources, setUploadingResources] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [resourceSearch, setResourceSearch] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);

  // External URL Resource Storage State
  const [resourceInputMode, setResourceInputMode] = useState('FILES'); // 'FILES' | 'URL'
  const [urlFormData, setUrlFormData] = useState({
    url: '',
    title: '',
    file_type: 'auto'
  });
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [copiedUrlId, setCopiedUrlId] = useState(null);

  // Media Preview Modal (for Image Lightbox / Video / Audio / PDF)
  const [previewMedia, setPreviewMedia] = useState(null);

  // Delete Confirmation State
  const [deletingResourceId, setDeletingResourceId] = useState(null);

  // Registered Members for Project Assignment
  const [registeredMembers, setRegisteredMembers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // Create Project Resource Mode & URL Input
  const [createResourceTab, setCreateResourceTab] = useState('FILES'); // 'FILES' | 'URLS'
  const [newCreateUrl, setNewCreateUrl] = useState({ url: '', title: '', file_type: 'auto' });

  // New Project Form Data with Attached Files & Assigned Members
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    category: 'dev',
    lead_name: user?.name || user?.username || 'Team Lead',
    status: 'In Progress',
    progress: 10,
    deadline: '',
    members_count: 2,
    attachedFiles: [],
    attachedUrls: [],
    assignedMembers: [],
  });
  const createFileInputRef = useRef(null);

  const handleCopyUrl = (url, id) => {
    if (!url) return;
    try {
      navigator.clipboard.writeText(url);
      setCopiedUrlId(id);
      setTimeout(() => setCopiedUrlId(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectsAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setProjects(list);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Unable to load project listings. Please ensure the backend server is running.');
      setProjects([]);
    } finally {
      setLoading(false);
    }

    try {
      const memRes = await membersAPI.getAll();
      if (memRes?.data) {
        setRegisteredMembers(Array.isArray(memRes.data) ? memRes.data : []);
      }
    } catch (err) {
      console.error('Failed to load registered members:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleToggleMember = (member) => {
    const memId = member.member_id || member.id;
    const memName = member.name || member.user?.username || member.member_id || 'Member';
    const memEmail = member.email || member.user?.email || '';
    const memAvatar = member.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${memId}`;
    const memRole = member.role || 'Member';
    const memDept = member.department?.dept_name || member.department || 'dev';

    setFormData((prev) => {
      const currentList = Array.isArray(prev.assignedMembers) ? prev.assignedMembers : [];
      const exists = currentList.some((m) => String(m.id) === String(memId) || String(m.member_id) === String(memId));
      const updated = exists
        ? currentList.filter((m) => String(m.id) !== String(memId) && String(m.member_id) !== String(memId))
        : [...currentList, { id: memId, member_id: memId, name: memName, email: memEmail, avatar: memAvatar, role: memRole, department: memDept }];
      return {
        ...prev,
        assignedMembers: updated,
        members_count: Math.max(1, updated.length || 1),
      };
    });
  };

  const handleSelectAllMembers = () => {
    const all = registeredMembers.map((m) => {
      const memId = m.member_id || m.id;
      return {
        id: memId,
        member_id: memId,
        name: m.name || m.user?.username || m.member_id || 'Member',
        email: m.email || m.user?.email || '',
        avatar: m.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${memId}`,
        role: m.role || 'Member',
        department: m.department?.dept_name || m.department || 'dev'
      };
    });
    setFormData((prev) => ({
      ...prev,
      assignedMembers: all,
      members_count: Math.max(1, all.length),
    }));
  };

  const handleClearAssignedMembers = () => {
    setFormData((prev) => ({
      ...prev,
      assignedMembers: [],
      members_count: 1,
    }));
  };

  const parseAssignedMembers = (proj) => {
    if (!proj?.assigned_members) return [];
    if (Array.isArray(proj.assigned_members)) return proj.assigned_members;
    try {
      const parsed = JSON.parse(proj.assigned_members);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const isUserCoreAssigned = (project) => {
    if (!user || !project) return false;
    const members = parseAssignedMembers(project);
    const uName = (user.name || user.username || '').toLowerCase();
    const uEmail = (user.email || '').toLowerCase();
    const uId = String(user.id || '');
    const uMid = String(user.membershipId || user.membership_id || '').toUpperCase();

    return members.some((m) => {
      const mId = String(m.id || '').toUpperCase();
      const mMid = String(m.member_id || '').toUpperCase();
      const mName = String(m.name || '').toLowerCase();
      const mEmail = String(m.email || '').toLowerCase();
      return (
        mId === uId ||
        (uMid && (mId === uMid || mMid === uMid)) ||
        mName === uName ||
        (uEmail && mEmail === uEmail)
      );
    });
  };

  // Primary System Administrator (CC-ADMIN-01 / System Admin / Superuser)
  const isSystemAdmin = (
    user?.is_superuser === true ||
    String(user?.membershipId || user?.membership_id || '').toUpperCase() === 'CC-ADMIN-01' ||
    user?.username?.toLowerCase() === 'admin' ||
    (user?.role?.toLowerCase() === 'admin' && String(user?.membershipId || user?.membership_id || '').toUpperCase().includes('ADMIN-01'))
  );

  const hasProjectAccess = (project) => {
    if (!project) return false;

    // 1. Primary System Administrator (CC-ADMIN-01) has universal master permissions
    if (isSystemAdmin) return true;

    // 2. The Project Lead / Uploader who created the project
    if (user && (
      (user.name && user.name.toLowerCase() === (project.lead_name || '').toLowerCase()) ||
      (user.username && user.username.toLowerCase() === (project.lead_name || '').toLowerCase()) ||
      (user.id && project.uploaded_by && String(user.id) === String(project.uploaded_by))
    )) {
      return true;
    }

    // 3. Members explicitly assigned with permission by the system admin / project creator
    return isUserCoreAssigned(project);
  };

  const [isContributing, setIsContributing] = useState(false);
  const [contributeSuccess, setContributeSuccess] = useState(null);

  const handleContributeToProject = async (projectId) => {
    if (!projectId) return;
    setIsContributing(true);
    setContributeSuccess(null);
    try {
      const payload = {
        member_id: user?.membershipId || user?.membership_id || `CC-${user?.id || 'MEM'}`,
        name: user?.name || user?.username || 'Team Member',
        email: user?.email || '',
        role: user?.role || 'Contributor',
        department: user?.department?.dept_name || user?.department || 'dev',
        avatar: user?.avatar || '',
      };
      const res = await projectsAPI.contribute(projectId, payload);
      if (res.data?.project) {
        setSelectedProject(res.data.project);
        setModalTab('overview');
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, ...res.data.project } : p))
        );
        setContributeSuccess('Successfully unlocked full Overview & Resource Vault access as an active contributor!');
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#3b82f6', '#8b5cf6'],
        });
      }
    } catch (err) {
      console.error('Failed to contribute to project:', err);
    } finally {
      setIsContributing(false);
    }
  };

  // Set default lead name when user loads
  useEffect(() => {
    if (user && !formData.code) {
      setFormData((prev) => ({
        ...prev,
        lead_name: user.name || user.username || 'Team Lead',
        code: `PR-${Math.floor(100 + Math.random() * 900)}`,
      }));
    }
  }, [user]);

  // Fetch Resources when selectedProject opens or changes
  const fetchSelectedProjectResources = async (projectId) => {
    if (!projectId) return;
    setLoadingResources(true);
    setUploadError(null);
    try {
      const res = await projectsAPI.getResources(projectId);
      const resList = Array.isArray(res.data) ? res.data : [];
      setProjectResources(resList);
      // Also update resource count in local projects list
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, resources: resList, resources_count: resList.length } : p
        )
      );
    } catch (err) {
      console.error('Failed to fetch resources for project:', err);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    if (selectedProject?.id) {
      // If resources are already loaded on project object, set them immediately
      if (selectedProject.resources) {
        setProjectResources(selectedProject.resources);
      }
      fetchSelectedProjectResources(selectedProject.id);
      setFilesToUpload([]);
      setUploadError(null);
      setUploadSuccess(null);
    } else {
      setProjectResources([]);
      setFilesToUpload([]);
    }
  }, [selectedProject?.id]);

  // Filter and Sort Projects
  const filteredProjects = useMemo(() => {
    let list = projects.filter((p) => {
      const title = (p.title || '').toLowerCase();
      const code = (p.code || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const lead = (p.lead_name || '').toLowerCase();
      const status = (p.status || '').toLowerCase();

      const searchMatch =
        title.includes(searchTerm.toLowerCase()) ||
        code.includes(searchTerm.toLowerCase()) ||
        desc.includes(searchTerm.toLowerCase()) ||
        cat.includes(searchTerm.toLowerCase()) ||
        lead.includes(searchTerm.toLowerCase());

      const categoryMatch =
        selectedCategory === 'ALL' ||
        cat.includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === 'dev' && (cat.includes('web') || cat.includes('dev') || cat.includes('soft'))) ||
        (selectedCategory === 'ai' && (cat.includes('ai') || cat.includes('ml') || cat.includes('data'))) ||
        (selectedCategory === 'iot' && (cat.includes('iot') || cat.includes('robot') || cat.includes('hard')));

      const statusMatch =
        selectedStatus === 'ALL' || status === selectedStatus.toLowerCase();

      return searchMatch && categoryMatch && statusMatch;
    });

    return list.sort((a, b) => {
      if (sortBy === 'PROGRESS_DESC') {
        return (b.progress || 0) - (a.progress || 0);
      }
      if (sortBy === 'TITLE_ASC') {
        return (a.title || '').localeCompare(b.title || '');
      }
    // Default: NEWEST
    return (b.id || 0) - (a.id || 0);
  });
}, [projects, searchTerm, selectedCategory, selectedStatus, sortBy]);

const filteredAssignmentMembers = useMemo(() => {
  return registeredMembers.filter((m) => {
    const q = memberSearchTerm.toLowerCase();
    const name = (m.name || m.user?.username || '').toLowerCase();
    const id = (m.member_id || m.id || '').toLowerCase();
    const role = (m.role || '').toLowerCase();
    const dept = (m.department?.dept_name || m.department || '').toLowerCase();
    return name.includes(q) || id.includes(q) || role.includes(q) || dept.includes(q);
  });
}, [registeredMembers, memberSearchTerm]);

  // Filter project resources
  const filteredProjectResources = useMemo(() => {
    return projectResources.filter((res) => {
      const title = (res.title || '').toLowerCase();
      const uploader = (res.uploaded_by || '').toLowerCase();
      const type = (res.file_type || '').toLowerCase();
      const url = (res.url || '').toLowerCase();

      const searchMatch =
        title.includes(resourceSearch.toLowerCase()) ||
        uploader.includes(resourceSearch.toLowerCase()) ||
        type.includes(resourceSearch.toLowerCase()) ||
        url.includes(resourceSearch.toLowerCase());

      const isUrlResource = !!res.url || ['url', 'link', 'github', 'figma', 'drive', 'youtube', 'notion', 'deployment'].includes(type);

      const typeMatch =
        resourceFilter === 'ALL' ||
        (resourceFilter === 'url' && isUrlResource) ||
        (resourceFilter === 'pdf' && type === 'pdf') ||
        (resourceFilter === 'doc' && (type === 'doc' || type.includes('doc') || type.includes('sheet') || type.includes('txt'))) ||
        (resourceFilter === 'image' && type === 'image') ||
        (resourceFilter === 'audio' && type === 'audio') ||
        (resourceFilter === 'video' && type === 'video') ||
        (resourceFilter === 'ppt' && (type === 'ppt' || type.includes('presentation'))) ||
        (resourceFilter === 'code' && (type === 'code' || type === 'github' || type.includes('code'))) ||
        (resourceFilter === 'zip' && (type === 'zip' || type.includes('archive') || type.includes('tar')));

      return searchMatch && typeMatch;
    });
  }, [projectResources, resourceFilter, resourceSearch]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => (p.status || '').toLowerCase() === 'active' || (p.status || '').toLowerCase() === 'in progress').length;
    const completed = projects.filter((p) => (p.status || '').toLowerCase() === 'completed').length;
    const totalMembers = projects.reduce((acc, curr) => acc + (parseInt(curr.members_count, 10) || 1), 0);
    const totalResources = projects.reduce((acc, curr) => acc + (curr.resources_count || curr.resources?.length || 0), 0);
    return { total, active, completed, totalMembers, totalResources };
  }, [projects]);

  // Handle Multi-file Selection for Project Create
  const handleCreateFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        attachedFiles: [...prev.attachedFiles, ...newFiles],
      }));
    }
  };

  const removeCreateAttachedFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachedFiles: prev.attachedFiles.filter((_, i) => i !== index),
    }));
  };

  const handleAddCreateUrl = () => {
    const rawUrl = (newCreateUrl.url || '').trim();
    if (!rawUrl) return;
    let validUrl = rawUrl;
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = `https://${validUrl}`;
    }
    const item = {
      url: validUrl,
      title: (newCreateUrl.title || '').trim() || validUrl,
      type: newCreateUrl.file_type === 'auto' ? '' : newCreateUrl.file_type,
    };
    setFormData((prev) => ({
      ...prev,
      attachedUrls: [...(prev.attachedUrls || []), item],
    }));
    setNewCreateUrl({ url: '', title: '', file_type: 'auto' });
  };

  const removeCreateAttachedUrl = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachedUrls: (prev.attachedUrls || []).filter((_, i) => i !== index),
    }));
  };

  // Create Project Submit Handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Please enter a project title.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please enter a project overview/description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append('code', formData.code.trim().toUpperCase() || `PR-${Math.floor(100 + Math.random() * 900)}`);
      formPayload.append('title', formData.title.trim());
      formPayload.append('description', formData.description.trim());
      formPayload.append('category', formData.category);
      formPayload.append('lead_name', formData.lead_name.trim() || 'Team Lead');
      formPayload.append('progress', parseInt(formData.progress, 10) || 0);
      formPayload.append('status', formData.status);
      if (formData.deadline) {
        formPayload.append('deadline', formData.deadline);
      }
      formPayload.append('members_count', parseInt(formData.members_count, 10) || 1);
      formPayload.append('uploaded_by', user?.name || user?.username || 'Team Lead');

      // Append assigned members JSON
      if (formData.assignedMembers && formData.assignedMembers.length > 0) {
        formPayload.append('assigned_members', JSON.stringify(formData.assignedMembers));
      }

      // Append attached URLs JSON
      if (formData.attachedUrls && formData.attachedUrls.length > 0) {
        formPayload.append('urls', JSON.stringify(formData.attachedUrls));
      }

      // Append attached files
      if (formData.attachedFiles && formData.attachedFiles.length > 0) {
        formData.attachedFiles.forEach((file) => {
          formPayload.append('files', file);
        });
      }

      const res = await projectsAPI.create(formPayload);
      if (res.data) {
        setProjects((prev) => [res.data, ...prev]);
        setIsCreateModalOpen(false);
        setFormData({
          code: `PR-${Math.floor(100 + Math.random() * 900)}`,
          title: '',
          description: '',
          category: 'dev',
          lead_name: user?.name || user?.username || 'Team Lead',
          status: 'In Progress',
          progress: 15,
          deadline: '',
          members_count: 2,
          attachedFiles: [],
          attachedUrls: [],
          assignedMembers: [],
        });
        setMemberSearchTerm('');

        // Trigger celebratory confetti
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      const errMsg = err.response?.data?.code?.[0] || err.response?.data?.detail || 'Failed to publish project. Please try again.';
      setFormError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multi-file Upload for Existing Project
  const handleResourceFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDropFiles = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFilesToUpload((prev) => [...prev, ...droppedFiles]);
    }
  };

  const removeFileFromUploadQueue = (index) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadResources = async () => {
    if (!selectedProject?.id || filesToUpload.length === 0) return;
    setUploadingResources(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(10);

    try {
      const uploadFormData = new FormData();
      filesToUpload.forEach((file) => {
        uploadFormData.append('files', file);
      });
      uploadFormData.append('uploaded_by', user?.name || user?.username || selectedProject.lead_name || 'Team Member');

      const res = await projectsAPI.uploadResources(
        selectedProject.id, 
        uploadFormData,
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      );

      if (res.data?.resources) {
        setProjectResources((prev) => [...res.data.resources, ...prev]);
        setFilesToUpload([]);
        setUploadSuccess(`Successfully uploaded ${res.data.resources.length} file(s)!`);
        
        // Update project resources count
        setProjects((prev) =>
          prev.map((p) =>
            p.id === selectedProject.id
              ? {
                  ...p,
                  resources: [...res.data.resources, ...(p.resources || [])],
                  resources_count: (p.resources_count || 0) + res.data.resources.length,
                }
              : p
          )
        );

        setTimeout(() => setUploadSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Failed to upload resources:', err);
      setUploadError(err.response?.data?.detail || 'Failed to upload files. Please try again.');
    } finally {
      setUploadingResources(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add External URL Resource to Project Vault
  const handleAddUrlResource = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProject?.id) return;
    const urlVal = (urlFormData.url || '').trim();
    if (!urlVal) {
      setUploadError('Please enter a valid URL to store in the resource vault.');
      return;
    }

    let finalUrl = urlVal;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    setIsSavingUrl(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const payload = {
        url: finalUrl,
        title: (urlFormData.title || '').trim() || finalUrl,
        file_type: urlFormData.file_type === 'auto' ? '' : urlFormData.file_type,
        uploaded_by: user?.name || user?.username || selectedProject.lead_name || 'Team Member',
      };

      const res = await projectsAPI.addUrlResource(selectedProject.id, payload);
      if (res.data?.resources) {
        setProjectResources((prev) => [...res.data.resources, ...prev]);
        setUrlFormData({ url: '', title: '', file_type: 'auto' });
        setUploadSuccess(`Successfully stored resource URL in vault: ${payload.title}!`);

        setProjects((prev) =>
          prev.map((p) =>
            p.id === selectedProject.id
              ? {
                  ...p,
                  resources: [...res.data.resources, ...(p.resources || [])],
                  resources_count: (p.resources_count || 0) + res.data.resources.length,
                }
              : p
          )
        );

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#06b6d4', '#8b5cf6', '#10b981'],
        });

        setTimeout(() => setUploadSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Failed to store URL resource:', err);
      setUploadError(err.response?.data?.detail || 'Failed to save URL resource. Please try again.');
    } finally {
      setIsSavingUrl(false);
    }
  };

  // Delete Resource Handler
  const handleDeleteResource = async (resourceId) => {
    setDeletingResourceId(resourceId);
    try {
      await projectsAPI.deleteResource(resourceId);
      setProjectResources((prev) => prev.filter((r) => r.id !== resourceId));
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject?.id
            ? {
                ...p,
                resources: (p.resources || []).filter((r) => r.id !== resourceId),
                resources_count: Math.max(0, (p.resources_count || 1) - 1),
              }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to delete resource:', err);
      alert('Failed to delete file resource. Please try again.');
    } finally {
      setDeletingResourceId(null);
    }
  };

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(null);

  const handleUpdateProjectStatus = async (projectId, newStatus, newProgress) => {
    if (!projectId) return;
    setIsUpdatingStatus(true);
    setStatusUpdateSuccess(null);
    try {
      const payload = { status: newStatus };
      if (newProgress !== undefined) {
        payload.progress = newProgress;
      }
      const res = await projectsAPI.updateProject(projectId, payload);
      if (res.data?.project) {
        const updated = res.data.project;
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, ...updated } : p))
        );
        if (selectedProject?.id === projectId) {
          setSelectedProject((prev) => ({ ...prev, ...updated }));
        }
        setStatusUpdateSuccess(`Status updated to "${newStatus}"!`);
        if (newStatus === 'Completed') {
          confetti({
            particleCount: 70,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b'],
          });
        }
        setTimeout(() => setStatusUpdateSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update project status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!projectId || !window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      await projectsAPI.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  const getStatusBadge = (status, projectId) => {
    const s = (status || '').toLowerCase();
    if (isAdmin && projectId) {
      return (
        <select
          value={status || 'In Progress'}
          disabled={isUpdatingStatus}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            handleUpdateProjectStatus(projectId, e.target.value);
          }}
          className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer focus:outline-none transition ${
            s === 'completed'
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/80'
              : s === 'active' || s === 'in progress'
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/80'
              : s === 'on hold'
              ? 'bg-rose-950/80 text-rose-300 border-rose-500/40 hover:bg-rose-900/80'
              : 'bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900/80'
          }`}
          title="Admin: Click to change project status"
        >
          <option value="Planning" className="bg-slate-900 text-amber-300">Planning</option>
          <option value="In Progress" className="bg-slate-900 text-cyan-300">In Progress</option>
          <option value="Active" className="bg-slate-900 text-cyan-300">Active</option>
          <option value="Completed" className="bg-slate-900 text-emerald-300">Completed</option>
          <option value="On Hold" className="bg-slate-900 text-rose-300">On Hold</option>
        </select>
      );
    }

    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Completed
        </span>
      );
    }
    if (s === 'active' || s === 'in progress') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          {status}
        </span>
      );
    }
    if (s === 'on hold') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          On Hold
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        {status || 'Planning'}
      </span>
    );
  };

  const getDomainTag = (category) => {
    const c = (category || '').toLowerCase();
    if (c.includes('dev') || c.includes('web')) return { label: 'Web / Dev', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    if (c.includes('ai') || c.includes('ml')) return { label: 'AI & ML', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
    if (c.includes('iot') || c.includes('robot')) return { label: 'Robotics & IoT', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (c.includes('ui') || c.includes('design')) return { label: 'UI/UX Design', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' };
    if (c.includes('doc')) return { label: 'Documentation', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    return { label: category || 'General Tech', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
  };

  // Helper for Resource File / Web URL Icon, Color & Format
  const getResourceMeta = (resource) => {
    const type = (resource.file_type || '').toLowerCase();
    const title = (resource.title || resource.file || resource.url || '').toLowerCase();
    const url = (resource.url || '').toLowerCase();
    const isUrlResource = Boolean(resource.url || ['url', 'link', 'github', 'figma', 'drive', 'youtube', 'notion', 'deployment'].includes(type));

    // 1. Check Platform-Specific Web URLs
    if (type === 'github' || url.includes('github.com')) {
      return {
        icon: Code2,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        badge: 'GitHub Repository',
        canPreview: false,
        previewType: 'url',
        isUrl: true,
        domain: 'github.com',
      };
    }
    if (type === 'figma' || url.includes('figma.com')) {
      return {
        icon: Layers,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
        badge: 'Figma Prototype UI/UX',
        canPreview: false,
        previewType: 'url',
        isUrl: true,
        domain: 'figma.com',
      };
    }
    if (type === 'drive' || url.includes('drive.google.com') || url.includes('docs.google.com')) {
      return {
        icon: FileText,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        badge: 'Google Drive / Docs',
        canPreview: false,
        previewType: 'url',
        isUrl: true,
        domain: 'docs.google.com',
      };
    }
    if (type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      return {
        icon: Video,
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        badge: 'YouTube Demo Video',
        canPreview: false,
        previewType: 'url',
        isUrl: true,
        domain: 'youtube.com',
      };
    }
    if (type === 'notion' || url.includes('notion.so') || url.includes('notion.site')) {
      return {
        icon: Bookmark,
        color: 'text-slate-300',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        badge: 'Notion Workspace / Doc',
        canPreview: false,
        previewType: 'url',
        isUrl: true,
        domain: 'notion.so',
      };
    }
    if (type === 'deployment' || url.includes('vercel.app') || url.includes('netlify.app') || url.includes('pages.dev') || url.includes('render.com')) {
      return {
        icon: Globe,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        badge: 'Live Production Demo',
        canPreview: false,
        previewType: 'url',
        isUrl: true,
        domain: 'Live Web App',
      };
    }
    if (isUrlResource || type === 'url' || type === 'link' || resource.url) {
      let hostname = 'External Web URL';
      try {
        if (resource.url) {
          const parsed = new URL(resource.url.startsWith('http') ? resource.url : `https://${resource.url}`);
          hostname = parsed.hostname.replace('www.', '');
        }
      } catch {
        hostname = 'External Web Resource';
      }
      return {
        icon: Link2,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        badge: 'External Web Link',
        canPreview: false,
        previewType: 'url',
        isUrl: true,
        domain: hostname,
      };
    }

    // 2. Physical File Types
    if (type === 'pdf' || title.endsWith('.pdf')) {
      return {
        icon: FileText,
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        badge: 'PDF Document',
        canPreview: true,
        previewType: 'pdf',
        isUrl: false,
      };
    }
    if (type === 'image' || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(title)) {
      return {
        icon: ImageIcon,
        color: 'text-sky-400',
        bgColor: 'bg-sky-500/10',
        borderColor: 'border-sky-500/30',
        badge: 'Image Asset',
        canPreview: true,
        previewType: 'image',
        isUrl: false,
      };
    }
    if (type === 'audio' || /\.(mp3|wav|ogg|m4a|aac|flac)$/.test(title)) {
      return {
        icon: Music,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        badge: 'Audio Track',
        canPreview: true,
        previewType: 'audio',
        isUrl: false,
      };
    }
    if (type === 'video' || /\.(mp4|webm|mkv|mov|avi)$/.test(title)) {
      return {
        icon: Video,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        badge: 'Video Clip',
        canPreview: true,
        previewType: 'video',
        isUrl: false,
      };
    }
    if (type === 'ppt' || /\.(ppt|pptx|key|odp)$/.test(title)) {
      return {
        icon: Presentation,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        badge: 'Presentation / PPT',
        canPreview: false,
        previewType: 'download',
        isUrl: false,
      };
    }
    if (type === 'doc' || /\.(doc|docx|txt|rtf|odt|csv|xlsx|xls)$/.test(title)) {
      return {
        icon: FileSpreadsheet,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        badge: 'Document / Sheet',
        canPreview: false,
        previewType: 'download',
        isUrl: false,
      };
    }
    if (type === 'code' || /\.(js|jsx|ts|tsx|py|html|css|json|cpp|c|java|sql|md)$/.test(title)) {
      return {
        icon: FileCode,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/30',
        badge: 'Source Code',
        canPreview: true,
        previewType: 'code',
        isUrl: false,
      };
    }
    if (type === 'zip' || /\.(zip|rar|tar|gz|7z)$/.test(title)) {
      return {
        icon: Archive,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        badge: 'Archive Package',
        canPreview: false,
        previewType: 'download',
        isUrl: false,
      };
    }
    return {
      icon: File,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      badge: 'Resource File',
      canPreview: false,
      previewType: 'download',
      isUrl: false,
    };
  };

  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BASE_URL}${url}`;
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <>
      <div className="min-h-screen bg-[#070b14] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-1/3 right-10 w-[500px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-10 left-1/3 w-[450px] h-[300px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl glass-panel-glow border border-slate-800/90 p-6 sm:p-10 overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                <span>TEAM CC COLLABORATIVE LABS, ASSETS & RESOURCES</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Engineering <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Projects & Resource Vault</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Explore student-led software development, robotics prototypes, AI models, and upload multiple project resources including PDFs, images, audio clips, video walkthroughs, PPT decks, and engineering docs.
              </p>
            </div>

            {/* Action CTA */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    code: `PR-${Math.floor(100 + Math.random() * 900)}`,
                    title: '',
                    description: '',
                    category: 'dev',
                    lead_name: user?.name || user?.username || 'Team Lead',
                    status: 'In Progress',
                    progress: 15,
                    deadline: '',
                    members_count: 2,
                    attachedFiles: [],
                    attachedUrls: [],
                    assignedMembers: [],
                  });
                  setMemberSearchTerm('');
                  setFormError(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Propose New Project
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-8 pt-8 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase">Projects</span>
                <FolderKanban className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase">Active Sprints</span>
                <Activity className="w-4 h-4 text-cyan-300" />
              </div>
              <p className="text-2xl font-black text-cyan-400 mt-1">{stats.active}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-1">{stats.completed}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase">Contributors</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-indigo-300 mt-1">{stats.totalMembers}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase">Vault Resources</span>
                <Paperclip className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-purple-300 mt-1">{stats.totalResources}</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEARCH & FILTER CONTROLS */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects by title, code (PR-XXX), tech stack, lead..."
                className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Bar Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1">
                {STATUS_FILTERS.map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      selectedStatus === st
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/60 cursor-pointer"
              >
                <option value="NEWEST">Newest Projects</option>
                <option value="PROGRESS_DESC">Highest Progress</option>
                <option value="TITLE_ASC">Alphabetical (A-Z)</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1">
                <button
                  onClick={() => setViewMode('GRID')}
                  className={`p-2 rounded-xl text-xs transition cursor-pointer ${
                    viewMode === 'GRID' ? 'bg-slate-800 text-cyan-400' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('LIST')}
                  className={`p-2 rounded-xl text-xs transition cursor-pointer ${
                    viewMode === 'LIST' ? 'bg-slate-800 text-cyan-400' : 'text-gray-400 hover:text-white'
                  }`}
                  title="List View"
                >
                  <ListFilter className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Domain Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {DOMAIN_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-900/60 border border-slate-800/80 text-gray-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PROJECT LISTINGS & GRID */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl border-2 border-cyan-500 border-t-transparent animate-spin mx-auto"></div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Querying project repository & sprint logs...
            </p>
          </div>
        ) : error && projects.length === 0 ? (
          <div className="p-8 rounded-3xl glass-panel border border-red-500/20 bg-red-950/20 text-center space-y-4 max-w-xl mx-auto">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-sm font-semibold text-white">{error}</p>
            <button
              onClick={fetchProjects}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white border border-slate-700 transition cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 rounded-3xl glass-panel border border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-gray-500">
              <FolderKanban className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Matching Projects Found</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                {searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
                  ? 'No project records match your current search and filter criteria.'
                  : 'No collaborative projects have been published yet. Be the first to propose one!'}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              {(searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('ALL');
                    setSelectedStatus('ALL');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    code: `PR-${Math.floor(100 + Math.random() * 900)}`,
                    title: '',
                    description: '',
                    category: 'dev',
                    lead_name: user?.name || user?.username || 'Team Lead',
                    status: 'In Progress',
                    progress: 15,
                    deadline: '',
                    members_count: 2,
                    attachedFiles: [],
                    attachedUrls: [],
                    assignedMembers: [],
                  });
                  setMemberSearchTerm('');
                  setFormError(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-slate-950 transition cursor-pointer"
              >
                + Propose Project
              </button>
            </div>
          </div>
        ) : viewMode === 'GRID' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => {
              const domain = getDomainTag(p.category);
              const resCount = p.resources_count || p.resources?.length || 0;
              return (
                <div
                  key={p.id || p.code}
                  className="glass-panel rounded-3xl border border-slate-800/90 p-6 flex flex-col justify-between hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    {/* Top Row: Code & Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                        {p.code || `PR-${p.id}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${domain.color}`}>
                          {domain.label}
                        </span>
                        {getStatusBadge(p.status, p.id)}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {p.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {p.description || 'No description provided for this initiative.'}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400">Sprint Progress</span>
                        <span className="font-bold text-cyan-300">{p.progress || 0}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, p.progress || 0))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Metadata: Lead, Team & Resources */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                          {(p.lead_name || 'TL').charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[100px] text-slate-300 font-medium">
                          {p.lead_name || 'Team Lead'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Resource Files Pill */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(p);
                            setModalTab('resources');
                          }}
                          className={`flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                            resCount > 0
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                              : 'bg-slate-900 text-gray-400 border-slate-800 hover:text-white'
                          }`}
                          title="View & Upload Project Resources"
                        >
                          <Paperclip className="w-3 h-3 text-purple-400" />
                          <span>{resCount}</span>
                        </button>

                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          {p.members_count || 1}
                        </span>

                        {p.deadline && (
                          <span className="flex items-center gap-1 font-mono text-[11px] text-gray-400">
                            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                            {p.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Conditional Access based on Contribution */}
                  {!hasProjectAccess(p) ? (
                    <div className="pt-4 mt-3 border-t border-slate-800/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-amber-400 font-mono font-medium">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          Overview & Vault Locked
                        </span>
                        <span className="text-[10px] text-gray-400">Contribute to gain access</span>
                      </div>

                      <button
                        type="button"
                        disabled={isContributing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContributeToProject(p.id);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isContributing ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                            <span>Joining Team...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Contribute to Unlock Access</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="pt-2.5 mt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 bg-emerald-950/20 p-2 rounded-2xl border border-emerald-500/20">
                        <div className="flex items-center gap-1.5 text-emerald-300 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="text-[11px] font-medium">Team Member Access</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Unlocked
                        </span>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedProject(p);
                            setModalTab('overview');
                          }}
                          className="py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-cyan-300 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <span>Overview</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedProject(p);
                            setModalTab('resources');
                          }}
                          className="py-2.5 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-xs font-semibold text-purple-300 border border-purple-500/30 hover:border-purple-500/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                          <span>Resources ({resCount})</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-gray-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Initiative & Spec</th>
                    <th className="px-6 py-4">Domain</th>
                    <th className="px-6 py-4">Sprint Status</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Resources</th>
                    <th className="px-6 py-4">Team Lead</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-gray-300">
                  {filteredProjects.map((p) => {
                    const domain = getDomainTag(p.category);
                    const resCount = p.resources_count || p.resources?.length || 0;
                    return (
                      <tr key={p.id || p.code} className="hover:bg-slate-900/50 transition group">
                        <td className="px-6 py-4 font-mono font-bold text-cyan-400">
                          {p.code || `PR-${p.id}`}
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{p.description}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${domain.color}`}>
                            {domain.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(p.status, p.id)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-24 space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-gray-400">
                              <span>{p.progress || 0}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-cyan-400 rounded-full"
                                style={{ width: `${p.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {hasProjectAccess(p) ? (
                            <button
                              onClick={() => {
                                setSelectedProject(p);
                                setModalTab('resources');
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition cursor-pointer ${
                                resCount > 0
                                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                                  : 'bg-slate-850 text-gray-400 border-slate-800 hover:text-white'
                              }`}
                              title="View & Manage Project Resource Vault (Files & URLs)"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                              <span>{resCount} {resCount === 1 ? 'item' : 'items'}</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-500 font-mono text-[11px]">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">{p.lead_name || 'Team Lead'}</p>
                          <p className="text-[10px] font-mono text-gray-400">{p.members_count || 1} Dev(s)</p>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {!hasProjectAccess(p) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContributeToProject(p.id);
                              }}
                              disabled={isContributing}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-sm shadow-cyan-500/20 transition cursor-pointer inline-flex items-center gap-1.5"
                              title="Join this project to unlock overview and resources"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Contribute to Unlock</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedProject(p);
                                  setModalTab('overview');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 text-xs font-semibold border border-slate-700 hover:border-cyan-500/40 transition cursor-pointer"
                              >
                                Spec
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProject(p);
                                  setModalTab('resources');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 text-xs font-semibold border border-purple-500/30 transition cursor-pointer"
                              >
                                Vault
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>

        {/* ========================================================================= */}
        {/* PROJECT DETAILS & RESOURCE VAULT MODAL */}
        {/* ========================================================================= */}
        {selectedProject && (
          <div 
            onClick={() => setSelectedProject(null)}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md"
          >
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <div 
                onClick={(e) => e.stopPropagation()}
                className="max-w-4xl w-full glass-panel-glow p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6 relative my-auto"
              >
              
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
                      {selectedProject.code || `PR-${selectedProject.id}`}
                    </span>
                    {getStatusBadge(selectedProject.status, selectedProject.id)}
                    <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-500/30 flex items-center gap-1">
                      <Paperclip className="w-3 h-3 text-purple-400" />
                      {projectResources.length} Attachments
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white pt-1">{selectedProject.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!hasProjectAccess(selectedProject) ? (
                <div className="p-8 text-center space-y-6 max-w-md mx-auto py-12">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Project Access Restricted</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Detailed specifications, team sprint milestones, and resource vault downloads are exclusive to registered contributors and core team members.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isContributing}
                    onClick={() => handleContributeToProject(selectedProject.id)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-xl shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isContributing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                        <span>Unlocking Project Access...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Contribute to Project & Unlock Access</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  {/* Tab Navigation */}
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                    <button
                      onClick={() => setModalTab('overview')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                        modalTab === 'overview'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                          : 'text-gray-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <FolderKanban className="w-4 h-4" />
                      <span>Specification & Overview</span>
                    </button>

                <button
                  onClick={() => setModalTab('resources')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                    modalTab === 'resources'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                  <span>Resource Section & Vault ({projectResources.length})</span>
                </button>
              </div>

              {/* ================= TAB 1: OVERVIEW & SPEC ================= */}
              {modalTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* Administrative Project Governance (Admin / Lead Controls) */}
                  {(isAdmin || (user && (user.name === selectedProject.lead_name || user.username === selectedProject.lead_name))) && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 border border-amber-500/40 space-y-4 shadow-lg shadow-amber-950/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-300 flex items-center gap-2 font-mono uppercase tracking-wide">
                          <Shield className="w-4 h-4 text-amber-400" />
                          Admin Control • Manage Project Status & Sprint
                        </span>
                        {statusUpdateSuccess && (
                          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {statusUpdateSuccess}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono text-gray-300">CHANGE STATUS</label>
                          <select
                            value={selectedProject.status || 'In Progress'}
                            disabled={isUpdatingStatus}
                            onChange={(e) => handleUpdateProjectStatus(selectedProject.id, e.target.value, selectedProject.progress)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                          >
                            <option value="Planning">Planning</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed (Auto sets 100%)</option>
                            <option value="On Hold">On Hold</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-mono">
                            <label className="text-gray-300">SPRINT PROGRESS</label>
                            <span className="text-amber-300 font-bold">{selectedProject.progress || 0}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={selectedProject.progress || 0}
                            disabled={isUpdatingStatus}
                            onChange={(e) => handleUpdateProjectStatus(selectedProject.id, selectedProject.status, parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 mt-3"
                          />
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="pt-2 border-t border-amber-500/20 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(selectedProject.id)}
                            className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            <span>Delete Project</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description & Overview */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase text-gray-400 tracking-wider">Project Specification</h4>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {selectedProject.description || 'No detailed specification provided.'}
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-gray-400 font-mono text-[10px] uppercase">Domain</span>
                      <p className="font-bold text-white capitalize">{selectedProject.category || 'Engineering'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-gray-400 font-mono text-[10px] uppercase">Project Lead</span>
                      <p className="font-bold text-cyan-300 truncate">{selectedProject.lead_name || 'Team Lead'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-gray-400 font-mono text-[10px] uppercase">Team Size</span>
                      <p className="font-bold text-indigo-300">{selectedProject.members_count || 1} Member(s)</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-gray-400 font-mono text-[10px] uppercase">Target Milestone</span>
                      <p className="font-bold text-emerald-300">{selectedProject.deadline || 'Continuous'}</p>
                    </div>
                  </div>

                  {/* Progress Detail */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">Completion Milestone</span>
                      <span className="font-bold text-cyan-300">{selectedProject.progress || 0}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full"
                        style={{ width: `${selectedProject.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Assigned Engineering Team */}
                  {parseAssignedMembers(selectedProject).length > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 font-mono">
                          <Users className="w-4 h-4 text-emerald-400" />
                          Assigned Engineering Team ({parseAssignedMembers(selectedProject).length} members)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {parseAssignedMembers(selectedProject).map((m, idx) => (
                          <div key={m.id || idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs">
                            <img src={m.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.id || idx}`} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                            <span className="font-semibold text-white">{m.name}</span>
                            {m.role && <span className="text-[10px] text-emerald-400 font-mono">({m.role})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Resource Preview Callout */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 to-blue-950/30 border border-purple-500/20 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-purple-400" />
                        Project Resource Vault ({projectResources.length} files attached)
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Upload or explore blueprints, PDFs, code repos, demo videos, PPT slides, and audio recordings.
                      </p>
                    </div>
                    <button
                      onClick={() => setModalTab('resources')}
                      className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold border border-purple-500/40 whitespace-nowrap transition cursor-pointer"
                    >
                      Manage Resources &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* ================= TAB 2: RESOURCE SECTION & MULTI-FILE / URL VAULT ================= */}
              {modalTab === 'resources' && (
                <div className="space-y-6">
                  
                  {/* Upload Notification Alerts */}
                  {uploadError && (
                    <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                      <span>{uploadSuccess}</span>
                    </div>
                  )}

                  {/* Resource Ingestion Mode Switcher */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setResourceInputMode('FILES')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                          resourceInputMode === 'FILES'
                            ? 'bg-gradient-to-r from-purple-500/30 to-indigo-600/30 text-purple-200 border border-purple-500/50 shadow-md shadow-purple-500/10'
                            : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <UploadCloud className="w-4 h-4 text-purple-400" />
                        <span>Upload Files {filesToUpload.length > 0 ? `(${filesToUpload.length})` : ''}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setResourceInputMode('URL')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                          resourceInputMode === 'URL'
                            ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-200 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                            : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <Link2 className="w-4 h-4 text-cyan-400" />
                        <span>Store External URL / Web Link</span>
                      </button>
                    </div>

                    <span className="text-[11px] font-mono text-gray-400">
                      {projectResources.length} Total Vault Item{projectResources.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* OPTION 1: Drag-and-Drop Multi-File Dropzone */}
                  {resourceInputMode === 'FILES' && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={handleDropFiles}
                      className={`relative p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all text-center space-y-4 ${
                        isDraggingOver
                          ? 'border-purple-400 bg-purple-950/30 scale-[1.01]'
                          : 'border-slate-700/80 bg-slate-900/60 hover:border-purple-500/50 hover:bg-slate-900/90'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleResourceFileSelect}
                        className="hidden"
                        id="project-resource-file-input"
                      />

                      <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/10">
                        <UploadCloud className="w-7 h-7 animate-bounce" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">
                          Drag & Drop multiple files here, or{' '}
                          <label
                            htmlFor="project-resource-file-input"
                            className="text-purple-400 hover:text-purple-300 underline cursor-pointer font-semibold"
                          >
                            Browse Device
                          </label>
                        </h4>
                        <p className="text-xs text-gray-400 max-w-lg mx-auto">
                          Supports bulk upload of <span className="text-rose-300 font-mono">PDF</span>,{' '}
                          <span className="text-sky-300 font-mono">Images</span> (PNG/JPG/SVG),{' '}
                          <span className="text-purple-300 font-mono">Audio</span> (MP3/WAV),{' '}
                          <span className="text-blue-300 font-mono">Video</span> (MP4/WebM),{' '}
                          <span className="text-amber-300 font-mono">PPT</span>,{' '}
                          <span className="text-emerald-300 font-mono">Docs</span> (DOCX/TXT/XLSX),{' '}
                          <span className="text-indigo-300 font-mono">Code</span> &{' '}
                          <span className="text-orange-300 font-mono">ZIP</span>.
                        </p>
                      </div>

                      {/* Staged Files for Upload */}
                      {filesToUpload.length > 0 && (
                        <div className="pt-4 border-t border-slate-800/80 space-y-3 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-semibold text-purple-300">
                              Staged for Upload ({filesToUpload.length} file{filesToUpload.length > 1 ? 's' : ''}):
                            </span>
                            <button
                              type="button"
                              onClick={() => setFilesToUpload([])}
                              className="text-[11px] text-gray-400 hover:text-red-400 transition cursor-pointer"
                            >
                              Clear All
                            </button>
                          </div>

                          <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                            {filesToUpload.map((f, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <Paperclip className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                  <span className="text-slate-200 font-medium truncate">{f.name}</span>
                                  <span className="text-[10px] text-gray-500 font-mono">({formatBytes(f.size)})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFileFromUploadQueue(idx)}
                                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-red-950/50 hover:text-red-400 text-gray-400 flex items-center justify-center transition flex-shrink-0 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Upload Progress Bar */}
                          {uploadingResources && (
                            <div className="space-y-1 pt-2">
                              <div className="flex justify-between text-[11px] font-mono text-purple-300">
                                <span>Uploading to Code Crashers Vault...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-950 border border-purple-500/30 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Upload Action Button */}
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              disabled={uploadingResources}
                              onClick={handleUploadResources}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                            >
                              {uploadingResources ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                                  <span>Uploading Files...</span>
                                </>
                              ) : (
                                <>
                                  <UploadCloud className="w-4 h-4" />
                                  <span>Confirm & Upload {filesToUpload.length} File(s)</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OPTION 2: External Web URL Resource Storage Form */}
                  {resourceInputMode === 'URL' && (
                    <form
                      onSubmit={handleAddUrlResource}
                      className="p-6 sm:p-7 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-900/90 to-blue-950/20 space-y-4 shadow-xl shadow-cyan-950/30"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
                            <Link2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Store Web Link & External Resource</h4>
                            <p className="text-[11px] text-gray-400">Save GitHub repositories, Figma designs, Google Drive specs, Live Demos, YouTube walkthroughs, or Notion pages</p>
                          </div>
                        </div>

                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          Auto-Classified
                        </span>
                      </div>

                      {/* Quick Preset Buttons */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-gray-400">Quick Platform Presets:</label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { label: 'GitHub Repo', type: 'github', hint: 'https://github.com/' },
                            { label: 'Figma UI/UX', type: 'figma', hint: 'https://www.figma.com/design/' },
                            { label: 'Google Drive/Doc', type: 'drive', hint: 'https://docs.google.com/document/' },
                            { label: 'Live Demo', type: 'deployment', hint: 'https://my-app.vercel.app' },
                            { label: 'YouTube Video', type: 'youtube', hint: 'https://youtube.com/watch?v=' },
                            { label: 'Notion Spec', type: 'notion', hint: 'https://notion.so/' },
                          ].map((preset) => (
                            <button
                              key={preset.type}
                              type="button"
                              onClick={() => {
                                setUrlFormData((prev) => ({
                                  ...prev,
                                  file_type: preset.type,
                                  url: prev.url || preset.hint,
                                  title: prev.title || `${selectedProject.title} ${preset.label}`
                                }));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-cyan-300 border border-slate-700/80 hover:border-cyan-500/40 transition cursor-pointer"
                            >
                              + {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* URL & Title Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="text-gray-300 font-mono flex items-center gap-1">
                            <span>RESOURCE WEB URL *</span>
                          </label>
                          <div className="relative">
                            <Globe className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="url"
                              required
                              value={urlFormData.url}
                              onChange={(e) => setUrlFormData({ ...urlFormData, url: e.target.value })}
                              placeholder="https://github.com/org/repo or https://..."
                              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-gray-500 text-xs focus:border-cyan-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-gray-300 font-mono">TITLE / DISPLAY LABEL</label>
                          <input
                            type="text"
                            value={urlFormData.title}
                            onChange={(e) => setUrlFormData({ ...urlFormData, title: e.target.value })}
                            placeholder="e.g. Master Firmware Repo / Telemetry UI"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-gray-500 text-xs focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Platform Type Selector & Submit Button */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400 font-mono text-[11px]">PLATFORM:</span>
                          <select
                            value={urlFormData.file_type}
                            onChange={(e) => setUrlFormData({ ...urlFormData, file_type: e.target.value })}
                            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 focus:border-cyan-500 focus:outline-none cursor-pointer"
                          >
                            <option value="auto">⚡ Auto-Detect by Domain</option>
                            <option value="github">GitHub Repository</option>
                            <option value="figma">Figma UI/UX Prototype</option>
                            <option value="drive">Google Drive / Docs</option>
                            <option value="deployment">Live Web / Production Demo</option>
                            <option value="youtube">YouTube Video Demo</option>
                            <option value="notion">Notion Documentation</option>
                            <option value="url">General Web URL</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={isSavingUrl}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                        >
                          {isSavingUrl ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                              <span>Saving URL to Vault...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Store URL in Vault</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Resource Search & Filter Pills */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      {/* Search in Project Resources */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={resourceSearch}
                          onChange={(e) => setResourceSearch(e.target.value)}
                          placeholder="Search vault by title, URL, domain, uploader..."
                          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                        {resourceSearch && (
                          <button
                            onClick={() => setResourceSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs p-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => fetchSelectedProjectResources(selectedProject.id)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-400 hover:text-white text-xs flex items-center gap-1.5 transition cursor-pointer"
                        title="Refresh Resources"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingResources ? 'animate-spin' : ''}`} />
                        <span>Refresh Vault</span>
                      </button>
                    </div>

                    {/* Filter Type Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {RESOURCE_TYPE_FILTERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setResourceFilter(f.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition cursor-pointer ${
                            resourceFilter === f.id
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                              : 'bg-slate-900/60 border border-slate-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resource Files & URLs Grid */}
                  {loadingResources && projectResources.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-8 h-8 rounded-xl border-2 border-purple-500 border-t-transparent animate-spin mx-auto"></div>
                      <p className="text-xs font-mono text-gray-400">Loading vault items...</p>
                    </div>
                  ) : filteredProjectResources.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
                      <Paperclip className="w-8 h-8 text-gray-600 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">
                          {resourceSearch || resourceFilter !== 'ALL'
                            ? 'No vault items match the active filters.'
                            : 'No resources or URLs stored in this project vault yet.'}
                        </p>
                        <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                          Use the tabs above to upload blueprints, PDFs, demo videos, or store external GitHub repos, Figma prototypes, and documentation links.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                      {filteredProjectResources.map((res) => {
                        const meta = getResourceMeta(res);
                        const IconComponent = meta.icon;
                        const isUrlResource = Boolean(meta.isUrl || res.url);
                        const targetUrl = res.url || res.file_url || res.file;
                        const fullLiveUrl = getFullFileUrl(targetUrl);
                        const isImage = meta.previewType === 'image';
                        const isAudio = meta.previewType === 'audio';
                        const isVideo = meta.previewType === 'video';
                        const isPdf = meta.previewType === 'pdf';

                        return (
                          <div
                            key={res.id}
                            className={`p-4 rounded-2xl bg-slate-900/90 border transition-all space-y-3 group relative flex flex-col justify-between ${
                              isUrlResource
                                ? 'border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/5'
                                : 'border-slate-800 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/5'
                            }`}
                          >
                            <div className="space-y-2.5">
                              {/* Card Top: Icon & Badges */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 truncate">
                                  <div className={`w-9 h-9 rounded-xl ${meta.bgColor} ${meta.borderColor} border flex items-center justify-center ${meta.color} flex-shrink-0 shadow-sm`}>
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <div className="truncate">
                                    <h5 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors" title={res.title || res.url || 'Untitled Resource'}>
                                      {res.title || res.url || 'Untitled Resource'}
                                    </h5>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className={`inline-block text-[10px] font-mono font-medium ${meta.color}`}>
                                        {meta.badge}
                                      </span>
                                      {meta.domain && (
                                        <span className="text-[10px] text-gray-500 font-mono">
                                          • {meta.domain}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteResource(res.id)}
                                  disabled={deletingResourceId === res.id}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 text-gray-400 flex items-center justify-center transition cursor-pointer flex-shrink-0"
                                  title="Delete Resource"
                                >
                                  {deletingResourceId === res.id ? (
                                    <div className="w-3 h-3 border-2 border-rose-400 border-t-transparent animate-spin rounded-full"></div>
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              {/* URL Link Preview Block */}
                              {isUrlResource && (
                                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/20 space-y-1">
                                  <div className="flex items-center gap-1.5 text-[11px] text-cyan-300/90 font-mono truncate">
                                    <Globe className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                    <span className="truncate">{res.url || targetUrl}</span>
                                  </div>
                                </div>
                              )}

                              {/* Thumbnail / Embedded Media Previews for files */}
                              {!isUrlResource && isImage && fullLiveUrl && (
                                <div 
                                  onClick={() => setPreviewMedia({ type: 'image', url: fullLiveUrl, title: res.title })}
                                  className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer group/thumb"
                                >
                                  <img
                                    src={fullLiveUrl}
                                    alt={res.title}
                                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1.5 font-semibold">
                                    <Eye className="w-4 h-4 text-cyan-300" />
                                    <span>Expand Image</span>
                                  </div>
                                </div>
                              )}

                              {!isUrlResource && isAudio && fullLiveUrl && (
                                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                                  <audio controls className="w-full h-8" preload="metadata">
                                    <source src={fullLiveUrl} />
                                    Your browser does not support audio playback.
                                  </audio>
                                </div>
                              )}

                              {!isUrlResource && isVideo && fullLiveUrl && (
                                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                                  <video controls className="w-full max-h-32 object-cover" preload="metadata">
                                    <source src={fullLiveUrl} />
                                    Your browser does not support video playback.
                                  </video>
                                </div>
                              )}

                              {/* Metadata Row */}
                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                                <span>{isUrlResource ? 'Web URL' : (res.file_size_formatted || formatBytes(res.file_size))}</span>
                                <span className="truncate max-w-[120px]">{res.uploaded_by || 'Member'}</span>
                              </div>
                            </div>

                            {/* Card Actions */}
                            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                              {isUrlResource ? (
                                <>
                                  <a
                                    href={res.url || fullLiveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-cyan-500/30"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Open URL</span>
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyUrl(res.url || fullLiveUrl, res.id)}
                                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                                    title="Copy link to clipboard"
                                  >
                                    {copiedUrlId === res.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-emerald-400">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </>
                              ) : (
                                fullLiveUrl && (
                                  <>
                                    {(isImage || isPdf || isVideo) ? (
                                      <a
                                        href={fullLiveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>View Live</span>
                                      </a>
                                    ) : (
                                      <span className="text-[10px] text-gray-500 font-mono">
                                        {res.uploaded_at_formatted || 'Uploaded'}
                                      </span>
                                    )}

                                    <a
                                      href={fullLiveUrl}
                                      download={res.title || 'resource-file'}
                                      className="py-1.5 px-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition"
                                      title="Download to device"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download</span>
                                    </a>
                                  </>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}
            </>
          )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400 font-mono">
                  Managed under Code Crashers Tech Vault
                </span>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>

            </div>
          </div>
        </div>
        )}

        {/* ========================================================================= */}
        {/* CREATE / PROPOSE NEW PROJECT MODAL WITH MULTI-FILE ATTACHMENTS */}
        {/* ========================================================================= */}
        {isCreateModalOpen && (
          <div 
            onClick={() => setIsCreateModalOpen(false)}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md"
          >
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <div 
                onClick={(e) => e.stopPropagation()}
                className="max-w-2xl w-full glass-panel-glow p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6 relative my-auto"
              >
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Propose Engineering Project</h3>
                    <p className="text-xs text-gray-400">Initialize sprint initiative with optional document & asset attachments</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                
                {/* Code & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-mono">PROJECT CODE</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. PR-105"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-mono">DOMAIN / CATEGORY</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                    >
                      <option value="dev">Developer / Web & Fullstack</option>
                      <option value="ai">AI & Machine Learning</option>
                      <option value="iot">Robotics & IoT</option>
                      <option value="ui/ux">UI/UX Interface Design</option>
                      <option value="doc">Documentary & Research</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-gray-300 font-mono">PROJECT TITLE *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Autonomous Robotic Rover & Telemetry Dashboard"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-gray-300 font-mono">PROJECT DESCRIPTION *</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the technical architecture, target deliverables, and repository goals..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Lead Name & Team Size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-mono">PROJECT LEAD NAME</label>
                    <input
                      type="text"
                      value={formData.lead_name}
                      onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
                      placeholder="e.g. Subhadeep Roy"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-mono">TEAM MEMBERS COUNT</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={formData.members_count}
                      onChange={(e) => setFormData({ ...formData, members_count: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Team Member Assignment Panel */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-3 shadow-lg shadow-emerald-950/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Assign Registered Members to Project</h4>
                        <p className="text-[10px] text-gray-400">
                          {(formData.assignedMembers || []).length} member(s) assigned • Notifications will be dispatched on publish
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllMembers}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-mono border border-slate-700 transition cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAssignedMembers}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white text-[11px] font-mono border border-slate-700 transition cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Selected Members Chips */}
                  {(formData.assignedMembers || []).length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto p-2 rounded-xl bg-slate-950/70 border border-slate-800 scrollbar-thin">
                      {(formData.assignedMembers || []).map((m) => (
                        <span 
                          key={m.id || m.member_id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono group"
                        >
                          <img 
                            src={m.avatar} 
                            alt={m.name} 
                            className="w-3.5 h-3.5 rounded-full" 
                          />
                          <span className="font-semibold">{m.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMember(m);
                            }}
                            className="text-emerald-400 hover:text-white transition cursor-pointer p-0.5"
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
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Member Selection List */}
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {filteredAssignmentMembers.length > 0 ? (
                      filteredAssignmentMembers.map((member) => {
                        const memId = member.member_id || member.id;
                        const isSelected = (formData.assignedMembers || []).some((m) => 
                          String(m.id) === String(memId) || 
                          String(m.member_id) === String(memId) || 
                          String(m.id) === String(member.id) ||
                          String(m.member_id) === String(member.member_id)
                        );
                        const memName = member.name || member.user?.username || member.member_id;
                        const memRole = member.role || 'Member';
                        const memDept = member.department?.dept_name || member.department || 'dev';
                        const avatarUrl = member.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${memId}`;

                        return (
                          <div
                            key={memId}
                            onClick={() => handleToggleMember(member)}
                            className={`p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${
                              isSelected
                                ? 'bg-emerald-500/20 border-emerald-500/60 text-white shadow-sm shadow-emerald-500/10'
                                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700 text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <img
                                  src={avatarUrl}
                                  alt={memName}
                                  className="w-7 h-7 rounded-xl object-cover bg-slate-900 border border-slate-700"
                                />
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow">
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
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-600 hover:text-gray-400" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-gray-500 text-xs">
                        {memberSearchTerm ? `No members matched "${memberSearchTerm}"` : 'No registered members found.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status, Progress & Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-mono">STATUS</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-mono">INITIAL PROGRESS ({formData.progress}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-300 font-mono">TARGET DEADLINE</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Resource Files & URLs Initial Attachments Section */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-purple-400" />
                      <label className="text-gray-300 font-mono text-xs">ATTACH RESOURCES TO PROJECT VAULT (OPTIONAL)</label>
                    </div>

                    {/* Mode Toggle inside Create Modal */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => setCreateResourceTab('FILES')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          createResourceTab === 'FILES'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Files ({formData.attachedFiles.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateResourceTab('URLS')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          createResourceTab === 'URLS'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        URLs ({formData.attachedUrls.length})
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: File Attachments */}
                  {createResourceTab === 'FILES' && (
                    <div className="space-y-2">
                      <input
                        ref={createFileInputRef}
                        type="file"
                        multiple
                        onChange={handleCreateFileSelect}
                        className="hidden"
                        id="create-project-files"
                      />

                      <label
                        htmlFor="create-project-files"
                        className="p-3.5 rounded-xl border border-dashed border-purple-500/40 bg-purple-950/20 hover:bg-purple-950/40 text-center flex items-center justify-center gap-2 cursor-pointer transition"
                      >
                        <UploadCloud className="w-4 h-4 text-purple-400" />
                        <span className="text-slate-300 font-medium">Click to select PDF, PPT, Images, Audio, Video, or Docs</span>
                      </label>

                      {formData.attachedFiles.length > 0 && (
                        <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                          {formData.attachedFiles.map((file, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]"
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <Paperclip className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                <span className="truncate text-slate-200">{file.name}</span>
                                <span className="text-gray-500 font-mono text-[10px]">({formatBytes(file.size)})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCreateAttachedFile(i)}
                                className="text-gray-400 hover:text-red-400 p-1 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: URL Attachments */}
                  {createResourceTab === 'URLS' && (
                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <input
                          type="url"
                          placeholder="https://github.com/org/repo or https://..."
                          value={newCreateUrl.url}
                          onChange={(e) => setNewCreateUrl({ ...newCreateUrl, url: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Label (e.g. Master Repo, Figma UI, Live Demo)"
                          value={newCreateUrl.title}
                          onChange={(e) => setNewCreateUrl({ ...newCreateUrl, title: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['GitHub', 'Figma', 'Docs', 'Demo'].map((label) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setNewCreateUrl((prev) => ({ ...prev, title: prev.title || `${label} Link` }))}
                              className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-cyan-300 font-mono border border-slate-800 hover:border-cyan-500/40 cursor-pointer"
                            >
                              + {label}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleAddCreateUrl}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Attach URL</span>
                        </button>
                      </div>

                      {/* Attached URLs List */}
                      {formData.attachedUrls.length > 0 && (
                        <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 pt-1 border-t border-slate-800/80 scrollbar-thin">
                          {formData.attachedUrls.map((u, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]"
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <Link2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                <span className="font-semibold text-white truncate">{u.title}</span>
                                <span className="text-gray-400 font-mono text-[10px] truncate">({u.url})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCreateAttachedUrl(idx)}
                                className="text-gray-400 hover:text-red-400 p-1 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Email Broadcast Notice Banner */}
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                  <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    {(formData.assignedMembers || []).length > 0
                      ? `Notification beep & email will be sent to ALL registered members (${formData.assignedMembers.length} assigned as Core Team, others invited to contribute).`
                      : 'Notification beep & email circular will be sent to ALL registered members with an open invitation to contribute.'}
                  </span>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                        <span>Publishing & Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Publish & Assign Project</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
        )}

        {/* ========================================================================= */}
        {/* LIGHTBOX / IMAGE PREVIEW MODAL */}
        {/* ========================================================================= */}
        {previewMedia && previewMedia.type === 'image' && (
          <div 
            onClick={() => setPreviewMedia(null)}
            className="fixed inset-0 z-[60] overflow-y-auto bg-black/90 backdrop-blur-lg cursor-pointer"
          >
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="max-w-4xl max-h-[85vh] relative rounded-3xl overflow-hidden glass-panel-glow border border-slate-700 p-2 my-auto cursor-auto"
              >
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={previewMedia.url}
                  alt={previewMedia.title || 'Preview'}
                  className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain mx-auto"
                />
                {previewMedia.title && (
                  <div className="p-3 text-center text-xs font-mono text-gray-300">
                    {previewMedia.title}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

    </>
  );
};

export default Projects;
