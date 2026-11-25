import api from './api';
import { db, addToSyncQueue } from './db';
import { cacheSyncedSale, isTransportFailure, saveOfflineSale } from './offlineSaleService';

const posService = {
  getSales: async (config = {}) => {
    try {
      if (navigator.onLine) {
        const response = await api.get('sales/', config);
        // Update local cache: Use bulkPut to merge instead of clear() + bulkAdd()
        const sales = response.data.results || response.data;
        if (Array.isArray(sales)) {
          for (const sale of sales) await cacheSyncedSale('sales', sale);
        }
        return response;
      }
    } catch (error) {
      console.error("Network failed, fetching from local DB", error);
    }
    const localSales = await db.sales.toArray();
    return { data: localSales };
  },

  createSale: async (saleData) => {
    if (navigator.onLine) {
      try {
        const response = await api.post('sales/', saleData, { timeout: 5000 });
        await cacheSyncedSale('sales', response.data);
        return response;
      } catch (error) {
        if (!isTransportFailure(error)) throw error;
      }
    }
    return saveOfflineSale({ salesStore: 'sales', inventoryStore: 'drugs', endpoint: 'sales', saleData });
  },

  createReturn: async (returnData) => {
    if (navigator.onLine) {
      const response = await api.post('returns/', returnData);
      await db.returns.add(response.data);
      return response;
    } else {
      const id = await db.returns.add({ ...returnData, date: new Date().toISOString() });
      const offlineReturn = { ...returnData, id };
      await addToSyncQueue('CREATE', 'returns', offlineReturn);
      return { data: offlineReturn, status: 201 };
    }
  },
};

export default posService;
