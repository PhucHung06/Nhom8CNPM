// FILE: client/src/api/authApi.js
import axiosClient from './axiosClient';

export const authApi = {
  // Gọi POST /api/auth/login
  login: (credentials) => {
    return axiosClient.post('/api/auth/login', credentials);
  },

  // Gọi PUT /api/auth/change-password
  changePassword: (payload, username) => {
    return axiosClient.put(
      `/api/auth/change-password?username=${encodeURIComponent(username || '')}`,
      payload
    );
  },
};