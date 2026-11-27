import axiosClient from './axiosClient';

export const householdApi = {
  getAll: (params = {}) => {
    const cleanParams = {};
    if (params.keyword?.trim()) cleanParams.keyword = params.keyword.trim();
    if (params.status && params.status !== 'ALL') cleanParams.status = params.status;
    return axiosClient.get('/households', { params: cleanParams });
  },
  getById: (id) => axiosClient.get(`/households/${id}`),
  moveIn: (payload) => axiosClient.post('/households/move-in', payload),
  update: (id, payload) => axiosClient.put(`/households/${id}`, payload),
  moveOut: (id, payload = {}) => axiosClient.put(`/households/${id}/move-out`, payload),
  getAccounts: (id) => axiosClient.get(`/households/${id}/accounts`),
  remove: (id) => axiosClient.delete(`/households/${id}`),
};
