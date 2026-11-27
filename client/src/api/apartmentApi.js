import axiosClient from './axiosClient';

export const apartmentApi = {
  getAll: (params = {}) => {
    const cleanParams = {};
    if (params.keyword?.trim()) cleanParams.keyword = params.keyword.trim();
    if (params.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params.floor !== undefined && params.floor !== '') cleanParams.floor = Number(params.floor);
    return axiosClient.get('/apartments', { params: cleanParams });
  },
  getById: (id) => axiosClient.get(`/apartments/${id}`),
  create: (payload) => axiosClient.post('/apartments', payload),
  update: (id, payload) => axiosClient.put(`/apartments/${id}`, payload),
  remove: (id) => axiosClient.delete(`/apartments/${id}`),
};
