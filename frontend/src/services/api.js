import axios from 'axios';

export const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_DJANGO_BASE_URL;
  // If explicitly pointing to a remote server / external domain
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  // When running on Render in production, automatically connect to the backend service
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://code-crashers-backend.onrender.com';
  }
  // Use relative path so all requests route through Vite proxy seamlessly across all devices in local dev
  return '';
};

export const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 token refreshes or global errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          if (res.data?.access) {
            localStorage.setItem('access_token', res.data.access);
            api.defaults.headers.common.Authorization = `Bearer ${res.data.access}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
        }
      }
    }
    return Promise.reject(error);
  }
);

// Modular API Services ready for Django REST Framework endpoints
export const authAPI = {
  login: (username, password) => api.post('/api/auth/token/', { username, password }),
  register: (userData) => api.post('/api/auth/register/', userData),
  refreshToken: (refresh) => api.post('/api/auth/token/refresh/', { refresh }),
  getProfile: () => api.get('/api/members/profile/'),
  updateProfile: (profileData) => api.patch('/api/members/profile/', profileData),
  requestResetOTP: (email) => api.post('/api/auth/forgot-password/request-otp/', { email }),
  validateResetOTP: (payload) => api.post('/api/auth/forgot-password/validate-otp/', payload),
  verifyResetOTP: (payload) => api.post('/api/auth/forgot-password/verify-otp/', payload),
  requestMobileLoginOTP: (phone) => api.post('/api/auth/phone-login/request-otp/', { phone }),
  verifyMobileLoginOTP: (payload) => api.post('/api/auth/phone-login/verify-otp/', payload),
  firebaseLogin: (payload) => api.post('/api/auth/firebase-login/', payload),
};

export const membersAPI = {
  getAll: () => api.get('/api/members/'),
  getById: (id) => api.get(`/api/members/${id}/`),
  getCores: () => api.get('/api/members/cores/'),
};

export const projectsAPI = {
  getAll: () => api.get('/api/projects/'),
  getUserProjects: () => api.get('/api/projects/user/'),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/api/projects/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/api/projects/', data);
  },
  getResources: (projectId) => api.get(`/api/projects/${projectId}/resources/`),
  uploadResources: (projectId, formData, onUploadProgress) =>
    api.post(`/api/projects/${projectId}/resources/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  addUrlResource: (projectId, urlData) =>
    api.post(`/api/projects/${projectId}/resources/`, urlData),
  contribute: (projectId, data = {}) => api.post(`/api/projects/${projectId}/contribute/`, data),
  updateProject: (projectId, data) => api.patch(`/api/projects/${projectId}/manage/`, data),
  deleteProject: (projectId) => api.delete(`/api/projects/${projectId}/manage/`),
  deleteResource: (resourceId) => api.delete(`/api/projects/resources/${resourceId}/`),
};

export const attendanceAPI = {
  getLogs: () => api.get('/api/attendance/logs/'),
  recordAttendance: (data) => api.post('/api/attendance/logs/', data),
  recordBulkAttendance: (data) => api.post('/api/attendance/bulk/', data),
  logoutSession: (data) => api.post('/api/attendance/session/logout/', data),
  closeSessionById: (id) => api.post(`/api/attendance/logs/${id}/logout/`),
  getNotices: (params) => api.get('/api/attendance/notices/', { params }),
  createNotice: (notice) => api.post('/api/attendance/notices/', notice),
  approveLog: (id) => api.patch(`/api/attendance/logs/${id}/approve/`),
};

export const adminAPI = {
  getSystemStatus: () => api.get('/api/admin/status/'),
  promoteMember: (data) => api.post('/api/admin/promotion/', data),
  getAuditLogs: () => api.get('/api/admin/audit-logs/'),
};

export const notificationsAPI = {
  getAll: () => api.get('/api/notifications/'),
  markRead: (id) => api.patch(`/api/notifications/${id}/read/`),
  markAllRead: () => api.post('/api/notifications/read-all/'),
};

export default api;
