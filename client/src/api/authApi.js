// FILE: client/src/api/authApi.js
import axiosClient from './axiosClient';

export const authApi = {
  // baseURL đã bao gồm /api
  login: (credentials) => {
    return axiosClient.post('/auth/login', credentials);
  },

  // baseURL đã bao gồm /api
  changePassword: (payload, username) => {
    return axiosClient.put(
      `/auth/change-password?username=${encodeURIComponent(username || '')}`,
      payload
    );
  },
};