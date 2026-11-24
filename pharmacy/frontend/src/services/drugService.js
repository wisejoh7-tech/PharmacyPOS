import api from './api';
import { db, addToSyncQueue } from './db';

const drugService = {
  getDrugs: async (config = {}) => {
    try {
      if (navigator.onLine) {
        const response = await api.get('drugs/', config);
        const drugs = response.data.results || response.data;
        
        if (Array.isArray(drugs) && drugs.length > 0) {
          // Update local cache: Use put to merge/update instead of clear() + bulkAdd()
          // This prevents wiping out everything if the server returns something unexpected
          await db.drugs.bulkPut(drugs);
        }
        return { data: drugs };
      }
    } catch (error) {
      console.error("Network failed, fetching from local DB", error);
    }
    // Fallback to local DB
    const localDrugs = await db.drugs.toArray();
    return { data: localDrugs };
  },

  getDrug: async (id) => {
    try {
      if (navigator.onLine) {
        return await api.get(`drugs/${id}/`);
      }
    } catch (error) {
      console.error("Network failed", error);
    }
    const drug = await db.drugs.get(id);
    return { data: drug };
  },

  addDrug: async (drugData) => {
    if (navigator.onLine) {
      const response = await api.post('drugs/', drugData);
      await db.drugs.add(response.data);
      return response;
    } else {
      const id = await db.drugs.add(drugData);
      await addToSyncQueue('CREATE', 'drugs', { ...drugData, id });
      return { data: { ...drugData, id }, status: 201 };
    }
  },

  updateDrug: async (id, drugData) => {
    const hasPrice = Object.prototype.hasOwnProperty.call(drugData, 'unit_price');
    if (navigator.onLine) {
      const response = hasPrice
        ? await api.put(`drugs/${id}/`, drugData)
        : await api.patch(`drugs/${id}/`, drugData);
      try { await db.drugs.put({ ...(await db.drugs.get(Number(id))), ...response.data, id: response.data?.id ?? id }); }
      catch (error) { console.warn('Drug updated remotely but cache could not be updated:', error); }
      return response;
    }
    const existing = await db.drugs.get(Number(id));
    await db.drugs.put({ ...existing, ...drugData, id: Number(id) });
    await addToSyncQueue(hasPrice ? 'UPDATE' : 'PATCH', 'drugs', { ...drugData, id: Number(id) });
    return { data: { ...existing, ...drugData, id: Number(id) }, status: 200 };
  },

  deleteDrug: async (id) => {
    if (navigator.onLine) {
      await api.delete(`drugs/${id}/`);
    } else {
      await addToSyncQueue('DELETE', 'drugs', { id });
    }
    await db.drugs.delete(id);
    return { status: 204 };
  },
};

export default drugService;
