import apiClient from './client';

export const applicationsApi = {
  applyToJob: async (jobId, formData) => {
    const response = await apiClient.post(`/jobs/${jobId}/apply/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getCandidateApplications: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get('/candidate/applications/', { params: cleanParams });
    return response.data;
  },

  getJobApplicants: async (jobId, params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const response = await apiClient.get(`/jobs/${jobId}/applications/`, { params: cleanParams });
    return response.data;
  },

  getApplicationDetail: async (id) => {
    const response = await apiClient.get(`/applications/${id}/`);
    return response.data;
  },

  updateApplicationStatus: async (id, newStatus) => {
    const response = await apiClient.patch(`/applications/${id}/`, { status: newStatus });
    return response.data;
  },
};

export default applicationsApi;
