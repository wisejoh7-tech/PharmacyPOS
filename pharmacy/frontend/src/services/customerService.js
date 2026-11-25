import api from './api';
import { db, addToSyncQueue } from './db';

const customerService = {
  getCustomers: async (config = {}) => {
    try {
      if (navigator.onLine) {
        const response = await api.get('customers/', config);
        // Update local cache: Use bulkPut to merge instead of clear() + bulkAdd()
        const customers = response.data.results || response.data;
        if (Array.isArray(customers)) {
          await db.customers.bulkPut(customers);
        }
        return response;
      }
    } catch (error) {
      console.error("Network failed, fetching from local DB", error);
    }
    const localCustomers = await db.customers.toArray();
    return { data: localCustomers };
  },

  getCustomer: async (id) => {
    try {
      if (navigator.onLine) {
        return await api.get(`customers/${id}/`);
      }
    } catch (error) {
      console.error("Network failed", error);
    }
    const customer = await db.customers.get(Number(id));
    return { data: customer };
  },

  getCachedCustomer: async (id) => {
    const numericId = Number(id);
    const customer = Number.isFinite(numericId) ? await db.customers.get(numericId) : await db.customers.get(id);
    return { data: customer };
  },

  createCustomer: async (customerData) => {
    if (navigator.onLine) {
      const response = await api.post('customers/', customerData);
      await db.customers.add(response.data);
      return response;
    } else {
      const id = await db.customers.add(customerData);
      const offlineCustomer = { ...customerData, id };
      await addToSyncQueue('CREATE', 'customers', offlineCustomer);
      return { data: offlineCustomer, status: 201 };
    }
  },

  updateCustomer: async (id, customerData) => {
    if (navigator.onLine) {
      const response = await api.patch(`customers/${id}/`, customerData);
      await db.customers.put({ ...customerData, id });
      return response;
    } else {
      await db.customers.put({ ...customerData, id });
      await addToSyncQueue('UPDATE', 'customers', { ...customerData, id });
      return { data: { ...customerData, id }, status: 200 };
    }
  },

  deleteCustomer: async (id) => {
    if (navigator.onLine) {
      await api.delete(`customers/${id}/`);
    } else {
      await addToSyncQueue('DELETE', 'customers', { id });
    }
    await db.customers.delete(id);
    return { status: 204 };
  },
};

export default customerService;
