import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { authAPI, attendanceAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user_data');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('access_token') || null;
  });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user_data', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_data');
    }
  }, [user]);

  // Login via Django REST / SimpleJWT endpoint
  const login = async (usernameOrEmail, password, rememberMe = true) => {
    setLoading(true);
    setAuthError(null);

    try {
      const response = await authAPI.login(usernameOrEmail, password);

      if (response.data) {
        const { access, refresh, user: profileData } = response.data;
        if (access) setToken(access);
        if (refresh && rememberMe) localStorage.setItem('refresh_token', refresh);

        const authenticatedUser = profileData || {
          username: usernameOrEmail,
          email: usernameOrEmail.includes('@') ? usernameOrEmail : '',
          role: response.data.role || 'member',
          membershipId: response.data.membership_id || usernameOrEmail,
          name: response.data.name || usernameOrEmail,
        };

        setUser(authenticatedUser);

        setLoading(false);
        return { success: true, user: authenticatedUser };
      }
      setLoading(false);
      return { success: false, error: 'Unexpected response from server.' };
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Authentication failed. Please verify your credentials.';
      if (!err.response) {
        errorMessage = 'Unable to connect to server. Ensure Django is running with "python manage.py runserver 0.0.0.0:8000" and both devices share the same Wi-Fi.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (Array.isArray(err.response?.data?.non_field_errors)) {
        errorMessage = err.response.data.non_field_errors[0];
      } else if (typeof err.response?.data === 'object') {
        const firstVal = Object.values(err.response.data)[0];
        errorMessage = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
      }
      setAuthError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // Mobile OTP Login via Django REST endpoint
  const loginWithPhoneOTP = async (phone, otp, rememberMe = true) => {
    setLoading(true);
    setAuthError(null);

    try {
      const response = await authAPI.verifyMobileLoginOTP({ phone, otp });

      if (response.data) {
        const { access, refresh, user: profileData } = response.data;
        if (access) setToken(access);
        if (refresh && rememberMe) localStorage.setItem('refresh_token', refresh);

        const authenticatedUser = profileData || {
          contact: phone,
          role: 'member',
          name: 'Member',
        };

        setUser(authenticatedUser);
        setLoading(false);
        return { success: true, user: authenticatedUser };
      }
      setLoading(false);
      return { success: false, error: 'Unexpected response from server.' };
    } catch (err) {
      console.error('Phone OTP login error:', err);
      let errorMessage = 'OTP verification failed. Please check the code.';
      if (!err.response) {
        errorMessage = 'Unable to connect to server. Please verify backend is running.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (typeof err.response?.data === 'object') {
        const firstVal = Object.values(err.response.data)[0];
        errorMessage = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
      }
      setAuthError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // Firebase Verified Phone Login
  const loginWithFirebaseToken = async (idToken, phone, rememberMe = true) => {
    setLoading(true);
    setAuthError(null);

    try {
      const response = await authAPI.firebaseLogin({ idToken, phone });

      if (response.data) {
        const { access, refresh, user: profileData } = response.data;
        if (access) setToken(access);
        if (refresh && rememberMe) localStorage.setItem('refresh_token', refresh);

        const authenticatedUser = profileData || {
          contact: phone,
          role: 'member',
          name: 'Member',
        };

        setUser(authenticatedUser);
        setLoading(false);
        return { success: true, user: authenticatedUser };
      }
      setLoading(false);
      return { success: false, error: 'Unexpected response from server.' };
    } catch (err) {
      console.error('Firebase login error:', err);
      let errorMessage = 'Firebase authentication failed.';
      if (!err.response) {
        errorMessage = 'Unable to connect to server. Please verify backend is running.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      setAuthError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // 11-Field Registration via Django REST endpoint
  const register = async (formData) => {
    setLoading(true);
    setAuthError(null);

    const payload = {
      username: formData.email,
      name: formData.name,
      email: formData.email,
      contact: formData.contact,
      gender: formData.gender,
      department: formData.dept,
      year: formData.year,
      sem: formData.sem,
      class_roll: formData.classRoll,
      university_roll: formData.univRoll,
      avatar: formData.avatar || '',
      password: formData.password,
      confirm_password: formData.confirmPassword,
    };

    try {
      const response = await authAPI.register(payload);

      if (response.data) {
        const { user: registeredUser, access, refresh, membership_id } = response.data;
        if (access) setToken(access);
        if (refresh) localStorage.setItem('refresh_token', refresh);

        const userData = registeredUser || {
          ...payload,
          role: 'member',
          membershipId: membership_id || response.data.membership_id,
          avatar: formData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.classRoll || formData.name}`,
        };

        setUser(userData);
        setLoading(false);
        return { success: true, user: userData, memberId: membership_id || userData.membershipId };
      }
      setLoading(false);
      return { success: false, error: 'Registration failed. Server returned no data.' };
    } catch (err) {
      console.error('Registration error:', err);
      let errorMsg = 'Registration error. Please check your inputs.';
      if (!err.response) {
        errorMsg = 'Unable to connect to server. Ensure Django is running with "python manage.py runserver 0.0.0.0:8000" and both devices share the same Wi-Fi.';
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (typeof err.response?.data === 'object') {
        const firstVal = Object.values(err.response.data)[0];
        errorMsg = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
      }
      setAuthError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  // Profile update (Avatar, Bio, Academic, Contact)
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = {
        ...user,
        ...(response.data || {}),
        ...profileData,
      };
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (err) {
      console.warn('Backend updateProfile offline, updating local session:', err);
      const updatedUser = {
        ...user,
        ...profileData,
      };
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    }
  };

  // Real-Time Off-Session on Logout
  const logout = async () => {
    const activeAttId = localStorage.getItem('active_attendance_id');
    const currentUser = user;

    // Trigger off-session on backend in real-time
    try {
      await attendanceAPI.logoutSession({
        attendance_id: activeAttId ? parseInt(activeAttId, 10) : undefined,
        username: currentUser?.username,
        user_id: currentUser?.id,
      });
    } catch (err) {
      console.warn('Real-time off session sync error on logout:', err);
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('active_attendance_id');
  };

  const value = {
    user,
    token,
    loading,
    authError,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin' || user?.is_staff === true || user?.is_superuser === true || user?.role?.toLowerCase().includes('admin'),
    login,
    loginWithPhoneOTP,
    loginWithFirebaseToken,
    register,
    updateProfile,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
