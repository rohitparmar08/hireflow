import { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('hireflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate active token on initial app load
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('hireflow_access_token');
      if (accessToken) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          localStorage.setItem('hireflow_user', JSON.stringify(profile));
        } catch {
          // Token is either expired or invalid
          setUser(null);
          localStorage.removeItem('hireflow_access_token');
          localStorage.removeItem('hireflow_refresh_token');
          localStorage.removeItem('hireflow_user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    setError(null);
    try {
      const data = await authApi.login(credentials);
      localStorage.setItem('hireflow_access_token', data.access);
      localStorage.setItem('hireflow_refresh_token', data.refresh);
      localStorage.setItem('hireflow_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid email or password.';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (formData) => {
    setError(null);
    try {
      const data = await authApi.register(formData);
      localStorage.setItem('hireflow_access_token', data.tokens.access);
      localStorage.setItem('hireflow_refresh_token', data.tokens.refresh);
      localStorage.setItem('hireflow_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      const responseData = err.response?.data;
      let message = 'Registration failed. Please check the fields and try again.';
      if (responseData) {
        if (typeof responseData === 'string') {
          message = responseData;
        } else if (responseData.detail) {
          message = responseData.detail;
        } else {
          // Extract first field error
          const firstKey = Object.keys(responseData)[0];
          const val = responseData[firstKey];
          message = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
        }
      }
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('hireflow_refresh_token');
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('hireflow_access_token');
      localStorage.removeItem('hireflow_refresh_token');
      localStorage.removeItem('hireflow_user');
      setUser(null);
      setError(null);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const data = await authApi.updateProfile(updates);
      setUser(data.user);
      localStorage.setItem('hireflow_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      const message = err.response?.data?.detail || 'Unable to update profile.';
      throw new Error(message);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isRecruiter: user?.role === 'RECRUITER',
    isCandidate: user?.role === 'CANDIDATE',
    login,
    register,
    logout,
    updateProfile,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
