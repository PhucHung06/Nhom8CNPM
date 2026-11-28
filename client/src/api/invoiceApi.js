import axiosClient from './axiosClient';

export const invoiceApi = {
  getAll: (params = {}) => {
    const cleanParams = {};
    if (params.householdId) cleanParams.householdId = Number(params.householdId);
    if (params.billingPeriod?.trim()) cleanParams.billingPeriod = params.billingPeriod.trim();
    if (params.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params.keyword?.trim()) cleanParams.keyword = params.keyword.trim();
    return axiosClient.get('/invoices', { params: cleanParams });
  },
  getDetail: (id) => axiosClient.get(`/invoices/${id}`),
  payCash: (id, note = '') => axiosClient.put(`/invoices/${id}/pay-cash`, { note }),
};
