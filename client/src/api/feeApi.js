import axiosClient from './axiosClient';

export const feeApi = {
  getAll: (params = {}) => {
    const cleanParams = {};
    if (params.keyword?.trim()) cleanParams.keyword = params.keyword.trim();
    if (params.feeType && params.feeType !== 'ALL') cleanParams.feeType = params.feeType;
    if (params.isActive !== undefined && params.isActive !== 'ALL') {
      cleanParams.isActive = params.isActive === 'true' || params.isActive === true;
    }
    return axiosClient.get('/fees', { params: cleanParams });
  },
  getById: (id) => axiosClient.get(`/fees/${id}`),
  create: (payload) => axiosClient.post('/fees', payload),
  update: (id, payload) => axiosClient.put(`/fees/${id}`, payload),
  remove: (id) => axiosClient.delete(`/fees/${id}`),
};
