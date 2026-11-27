import axiosClient from './axiosClient';

export const adminUserApi = {
  getAll: (params = {}) => {
    const cleanParams = {};
    if (params.keyword?.trim()) cleanParams.keyword = params.keyword.trim();
    if (params.role && params.role !== 'ALL') cleanParams.role = params.role;
    if (params.approvalStatus && params.approvalStatus !== 'ALL') {
      cleanParams.approvalStatus = params.approvalStatus;
    }
    return axiosClient.get('/admin/users', { params: cleanParams });
  },
  create: (payload) => axiosClient.post('/admin/users', payload),
  grantAccess: (id, payload) => axiosClient.put(`/admin/users/${id}/grant-access`, payload),
  remove: (id) => axiosClient.delete(`/admin/users/${id}`),
};
