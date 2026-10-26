// FILE: client/src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Tự động đính kèm JWT Token vào mọi request gửi lên Spring Boot
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // Khớp với LoginResponse DTO
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;