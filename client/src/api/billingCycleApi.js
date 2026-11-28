import axiosClient from './axiosClient';

export const billingCycleApi = {
  getAll: () => axiosClient.get('/billing-cycles'),
  create: (payload) => axiosClient.post('/billing-cycles', payload),
  generateInvoices: (id) => axiosClient.post(`/billing-cycles/${id}/generate-invoices`),
  close: (id) => axiosClient.put(`/billing-cycles/${id}/close`),
  getInvoices: (id) => axiosClient.get(`/billing-cycles/${id}/invoices`),
};
