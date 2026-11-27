import axiosClient from './axiosClient';

export const residentApi = {
  getAll: (params = {}) => {
    const cleanParams = {};
    if (params.householdId) cleanParams.householdId = Number(params.householdId);
    if (params.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params.keyword?.trim()) cleanParams.keyword = params.keyword.trim();
    return axiosClient.get('/residents', { params: cleanParams });
  },
  getByHousehold: (householdId) => axiosClient.get(`/residents/household/${householdId}`),
  create: (payload) => axiosClient.post('/residents', payload),
  update: (id, payload) => axiosClient.put(`/residents/${id}`, payload),
  remove: (id) => axiosClient.delete(`/residents/${id}`),
  getMyHousehold: () => axiosClient.get('/resident/my-household'),
};
