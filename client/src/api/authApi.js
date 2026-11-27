import axiosClient from './axiosClient';

export const authApi = {
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  register: (payload) => axiosClient.post('/auth/register', payload),
  verifyOtp: (payload) => axiosClient.post('/auth/verify-otp', payload),
  resendOtp: (payload) => axiosClient.post('/auth/resend-otp', payload),
  forgotPassword: (payload) => axiosClient.post('/auth/forgot-password', payload),
  resetPassword: (payload) => axiosClient.post('/auth/reset-password', payload),
  changePassword: (payload) => axiosClient.put('/auth/change-password', payload),
  me: () => axiosClient.get('/auth/me'),
};
