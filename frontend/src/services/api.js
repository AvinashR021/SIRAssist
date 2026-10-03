import axios from 'axios';

const API = axios.create({
  baseURL: '/api'
});

// Request interceptor attaching JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sirassist_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor handling 401/403
API.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
      console.warn('Session expired or unauthorized access.');
    }
  }
  return Promise.reject(error);
});

export default API;
