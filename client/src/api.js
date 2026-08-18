import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', withCredentials: true });
api.interceptors.response.use(response => response, error => {
  if (!error.response) error.code = 'ERR_NETWORK';
  return Promise.reject(error);
});
