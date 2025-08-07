import axios from 'axios';

// const API_BASE_URL = 'https://qnh4b9xx-8000.asse.devtunnels.ms/';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/token', { username: data.email, password: data.password }),
  
  getMe: () => api.get('/auth/me'),
};

// Projects API
export const projectsAPI = {
  create: (data: { name: string; description?: string; diagram_data?: string }) =>
    api.post('/projects/', data),
  
  getAll: () => api.get('/projects/'),
  
  getById: (id: number) => api.get(`/projects/${id}`),
  
  update: (id: number, data: { name?: string; description?: string; diagram_data?: string }) =>
    api.put(`/projects/${id}`, data),
  
  delete: (id: number) => api.delete(`/projects/${id}`),
};

// AI API
export const aiAPI = {
  analyze: (data: { nodes: any[]; edges: any[]; question?: string; project_id?: number }, signal?: AbortSignal) =>
    api.post('/ai/analyze', data, { 
      signal,
      timeout: 300000 // 5 minutes timeout สำหรับ AI analysis
    }),
  
  checkHealth: () => api.get('/ai/health'),
  
  getModels: () => api.get('/ai/models'),
  
  setModel: (data: { model: string }) =>
    api.post('/ai/set-model', data),
};

// Analysis History API
export const analysisHistoryAPI = {
  getHistory: (params?: { skip?: number; limit?: number; project_id?: number; model_filter?: string }) =>
    api.get('/analysis-history/', { params }),
  
  getById: (id: number) => api.get(`/analysis-history/${id}`),
  
  deleteById: (id: number) => api.delete(`/analysis-history/${id}`),
  
  clearAll: () => api.delete('/analysis-history/'),
  
  getStats: (days: number = 30) => api.get('/analysis-history/stats/summary', { params: { days } }),
};

// Change Password API
export const changePasswordApi = (data: { email: string; current_password: string; new_password: string }) =>
  api.post('/auth/reset-password', data);

export default api;