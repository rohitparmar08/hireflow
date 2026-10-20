import apiClient from './client';

export const authApi = {
  register: async (payload) => {
    const response = await apiClient.post('/auth/register/', payload);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login/', credentials);
    return response.data;
  },

  refresh: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh/', { refresh: refreshToken });
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await apiClient.post('/auth/logout/', { refresh: refreshToken });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },

  updateProfile: async (payload) => {
    const response = await apiClient.patch('/auth/profile/', payload);
    return response.data;
  },
};

export default authApi;
