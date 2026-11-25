import api from './api';
import { db } from './db';

const getSettings = async (config = {}) => {
  if (!navigator.onLine) {
    const cached = await db.settings.toArray();
    if (cached.length) return { data: { results: cached } };
  }
  try {
    const response = await api.get('settings/', config);
    const data = response.data?.results ?? response.data;
    const rows = Array.isArray(data) ? data : (data ? [data] : []);
    if (rows.length) {
      await db.settings.bulkPut(rows.map((row) => ({ ...row, key: String(row.id ?? 'default') })));
    }
    return response;
  } catch (error) {
    if (config.signal?.aborted) throw error;
    const cached = await db.settings.toArray();
    if (cached.length) return { data: { results: cached } };
    throw error;
  }
};

const settingsService = {
  getSettings,
  updateSettings: (id, data) => api.put(`settings/${id}/`, data),
  updateProfile: (data) => api.post('update-profile/', data),
  getUsers: (config = {}) => api.get('users/', config),
  addUser: (data) => api.post('users/', data),
  updateUser: (id, data) => api.put(`users/${id}/`, data),
  deleteUser: (id) => api.delete(`users/${id}/`),
};

export default settingsService;
