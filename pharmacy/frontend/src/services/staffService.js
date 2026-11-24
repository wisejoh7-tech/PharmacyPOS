import api from './api';
import { db, addToSyncQueue } from './db';

const isNetworkError = (error) => !error.response && (
  !navigator.onLine || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' ||
  error.message === 'Network Error'
);

const staffService = {
  getStaff: async (config = {}) => {
    try {
      if (navigator.onLine) {
        const response = await api.get('staff/', config);
        const staffList = response.data?.results || response.data;
        if (Array.isArray(staffList)) {
          try {
            await db.transaction('rw', db.staff, async () => {
              await db.staff.where('id').above(0).delete();
              if (staffList.length) await db.staff.bulkPut(staffList);
            });
          } catch (cacheError) {
            console.warn('Staff fetched but local cache could not be refreshed:', cacheError);
          }
        }
        return { data: staffList };
      }
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      console.warn('Network unavailable, fetching staff from local DB', error);
    }
    return { data: await db.staff.toArray() };
  },

  getStaffMember: async (id) => {
    try {
      if (navigator.onLine && Number(id) > 0) {
        const response = await api.get(`staff/${id}/`);
        try { await db.staff.put(response.data); } catch (error) {
          console.warn('Staff fetched but local cache could not be refreshed:', error);
        }
        return response;
      }
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }
    return { data: await db.staff.get(Number(id)) };
  },

  createStaff: async (data) => {
    if (navigator.onLine) {
      try {
        const response = await api.post('staff/', data);
        try { await db.staff.put(response.data); } catch (error) {
          console.warn('Staff created remotely but local cache could not be updated:', error);
        }
        return response;
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }
    const id = -Date.now();
    const localStaff = { ...data, id };
    await db.staff.put(localStaff);
    await addToSyncQueue('CREATE', 'staff', localStaff);
    return { data: localStaff, status: 201, offline: true };
  },

  updateStaff: async (id, data) => {
    if (navigator.onLine && Number(id) > 0) {
      try {
        const response = await api.put(`staff/${id}/`, data);
        try { await db.staff.put({ ...response.data, id: response.data?.id ?? Number(id) }); } catch (error) {
          console.warn('Staff updated remotely but local cache could not be updated:', error);
        }
        return response;
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }
    const existing = await db.staff.get(Number(id));
    const localStaff = { ...existing, ...data, id: Number(id) };
    await db.staff.put(localStaff);
    await addToSyncQueue('UPDATE', 'staff', localStaff);
    return { data: localStaff, status: 200, offline: true };
  },

  deleteStaff: async (id) => {
    if (navigator.onLine && Number(id) > 0) {
      try {
        const response = await api.delete(`staff/${id}/`);
        try { await db.staff.delete(Number(id)); } catch (error) {
          console.warn('Staff deleted remotely but local cache could not be updated:', error);
        }
        return response;
      } catch (error) {
        if (!isNetworkError(error)) throw error;
      }
    }
    await db.staff.delete(Number(id));
    await addToSyncQueue('DELETE', 'staff', { id: Number(id) });
    return { status: 204, offline: true };
  },
};

export default staffService;
