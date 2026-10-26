// FILE: client/src/api/apartmentApi.js
import axiosClient from './axiosClient';

export const apartmentApi = {
  getAll: (params = {}) => {
    const cleanParams = {};
    if (params.keyword && params.keyword.trim() !== '') {
      cleanParams.keyword = params.keyword.trim();
    }
    if (params.status && params.status !== 'ALL') {
      cleanParams.status = params.status;
    }
    if (params.floor && params.floor !== '') {
      cleanParams.floor = Number(params.floor);
    }
    return axiosClient.get('/apartments', { params: cleanParams });
  },

  getById: (id) => {
    return axiosClient.get(`/apartments/${id}`);
  },

  create: (payload) => {
    return axiosClient.post('/apartments', payload);
  },

  update: (id, payload) => {
    return axiosClient.put(`/apartments/${id}`, payload);
  },

  remove: (id) => {
    return axiosClient.delete(`/apartments/${id}`);
  },
};