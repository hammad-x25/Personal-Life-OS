import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', withCredentials: true });
let refreshing = null;
api.interceptors.response.use(response => response, async error => {
  if (!error.response) error.code = 'ERR_NETWORK';
  const request = error.config;
  if (error.response?.status === 401 && !request?._retry && !request?.url?.includes('/auth/refresh')) {
    request._retry = true;
    try { refreshing ||= api.post('/auth/refresh'); await refreshing; refreshing = null; return api(request); } catch (refreshError) { refreshing = null; return Promise.reject(refreshError); }
  }
  return Promise.reject(error);
});
