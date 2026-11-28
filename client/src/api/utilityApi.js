import axiosClient from './axiosClient';

export const utilityApi = {
  getAll: (params = {}) => {
    const cleanParams = {};
    if (params.billingPeriod?.trim()) cleanParams.billingPeriod = params.billingPeriod.trim();
    if (params.serviceType && params.serviceType !== 'ALL') cleanParams.serviceType = params.serviceType;
    if (params.householdId) cleanParams.householdId = Number(params.householdId);
    if (params.keyword?.trim()) cleanParams.keyword = params.keyword.trim();
    return axiosClient.get('/utilities', { params: cleanParams });
  },
  create: (payload) => axiosClient.post('/utilities', payload),
  update: (id, payload) => axiosClient.put(`/utilities/${id}`, payload),
  remove: (id) => axiosClient.delete(`/utilities/${id}`),
  downloadTemplate: (billingPeriod) =>
    axiosClient.get('/utilities/template', {
      params: billingPeriod ? { billingPeriod } : {},
      responseType: 'blob',
    }),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/utilities/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
