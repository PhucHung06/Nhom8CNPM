import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const PUBLIC_AUTH_PATHS = ['/login', '/register', '/forgot-password'];

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (!PUBLIC_AUTH_PATHS.includes(currentPath)) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(err, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  const data = err?.response?.data;
  if (!data) {
    return err?.message || fallback;
  }
  if (data.errorType === 'DATABASE_ERROR') {
    return `[Lỗi CSDL] ${data.message}`;
  }
  if (data.errorType === 'VALIDATION_ERROR' && data.fieldErrors) {
    const first = Object.values(data.fieldErrors)[0];
    if (first) return first;
  }
  return data.message || fallback;
}

export default axiosClient;
