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

  getApplicationMatch: async (id) => {
    const response = await apiClient.get(`/applications/${id}/match/`);
    return response.data;
  },

  recalculateMatch: async (id) => {
    const response = await apiClient.post(`/applications/${id}/match/`);
    return response.data;
  },

  downloadResume: async (id, filename) => {
    const response = await apiClient.get(`/applications/${id}/resume/`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'resume.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};



export default applicationsApi;
