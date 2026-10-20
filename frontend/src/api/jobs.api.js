import apiClient from './client';

export const jobsApi = {
  getPublicJobs: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/jobs/', { params: cleanParams });
    return response.data;
  },

  getJobDetail: async (id) => {
    const response = await apiClient.get(`/jobs/${id}/`);
    return response.data;
  },

  createJob: async (payload) => {
    const response = await apiClient.post('/jobs/', payload);
    return response.data;
  },

  updateJob: async (id, payload) => {
    const response = await apiClient.patch(`/jobs/${id}/`, payload);
    return response.data;
  },

  archiveJob: async (id) => {
    const response = await apiClient.delete(`/jobs/${id}/`);
    return response.data;
  },

  getRecruiterJobs: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/recruiter/jobs/', { params: cleanParams });
    return response.data;
  },
};

export default jobsApi;
