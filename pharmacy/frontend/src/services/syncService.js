import api from './api';
import axios from 'axios';
import { getBaseURL } from './api';
import { db } from './db';
import { cacheSyncedSale } from './offlineSaleService';

let syncInProgress = false;

const ensureOnlineSession = async () => {
  const token = localStorage.getItem('access_token') || '';
  if (!token.startsWith('offline_')) return true;
  const username = localStorage.getItem('username') || '';
  const cachedUsers = JSON.parse(localStorage.getItem('offline_users_cache') || '{}');
  const cachedUser = cachedUsers[username.toLowerCase()];
  if (!cachedUser?.password) return false;
  const response = await axios.post(`${getBaseURL()}token/`, {
    username: cachedUser.username,
    password: cachedUser.password
  });
  const { access, refresh } = response.data || {};
  if (!access) return false;
  localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
  return true;
};

const markSaleSyncError = async (item, message) => {
  const tableName = item.table.replace(/\/$/, '');
  const storeName = tableName === 'sales' ? 'sales' : tableName === 'supermarket-sales' ? 'supermarketSales' : null;
  const transactionId = item.data?.transaction_id;
  if (!storeName || !transactionId) return;
  const store = db.table(storeName);
  const sale = await store.where('transaction_id').equals(transactionId).first();
  if (sale) await store.update(sale.id, { syncStatus: 'failed', syncError: String(message).slice(0, 500) });
};

const syncService = {
  getPendingSyncCount: async () => {
    try { return await db.syncQueue.count(); } catch { return 0; }
  },

  sync: async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, reason: 'offline' };
    }
    if (syncInProgress) return { success: false, reason: 'in-progress' };
    syncInProgress = true;
    try {
      try {
        if (!(await ensureOnlineSession())) return { success: false, reason: 'online-login-required' };
      } catch (error) {
        return { success: false, reason: 'online-login-required', message: error.message };
      }
      const queue = await db.syncQueue.toArray();
      if (!queue.length) return { success: true, syncedCount: 0, errors: [] };
      let syncedCount = 0;
      const errors = [];

      for (const item of queue) {
        try {
          const table = item.table.replace(/\/$/, '');
          const endpoint = `${table}/`;
          const itemId = item.data?.id || item.id;
          let response;
          if (item.action === 'CREATE') {
            const createData = { ...item.data };
            if (table === 'staff' || table === 'sales' || table === 'supermarket-sales') delete createData.id;
            delete createData.syncStatus;
            delete createData.syncError;
            response = await api.post(endpoint, createData);
          } else if (item.action === 'UPDATE') response = await api.put(`${endpoint}${itemId}/`, item.data);
          else if (item.action === 'PATCH') response = await api.patch(`${endpoint}${itemId}/`, item.data);
          else if (item.action === 'DELETE') response = await api.delete(`${endpoint}${itemId}/`);

          if (response && response.status >= 200 && response.status < 300) {
            if (table === 'sales' && item.action === 'CREATE') await cacheSyncedSale('sales', response.data);
            if (table === 'supermarket-sales' && item.action === 'CREATE') await cacheSyncedSale('supermarketSales', response.data);
            if (table === 'staff' && item.action === 'CREATE') {
              const serverId = response.data?.id;
              const localId = item.data?.id;
              if (serverId !== undefined && localId !== undefined && serverId !== localId) {
                await db.transaction('rw', db.staff, db.syncQueue, async () => {
                  const localRow = await db.staff.get(localId);
                  if (localRow) {
                    await db.staff.delete(localId);
                    await db.staff.put({ ...localRow, ...response.data, id: serverId });
                  }
                  const queuedItems = await db.syncQueue.toArray();
                  for (const queued of queuedItems) {
                    if (queued.id === item.id || queued.table.replace(/\/$/, '') !== 'staff') continue;
                    if (queued.data?.id === localId) await db.syncQueue.update(queued.id, { data: { ...queued.data, id: serverId } });
                  }
                });
              }
            }
            await db.syncQueue.delete(item.id);
            syncedCount++;
          }
        } catch (error) {
          const message = error.response?.data?.detail || error.response?.data || error.message;
          console.error(`Sync failed for ${item.table} item:`, message);
          await markSaleSyncError(item, typeof message === 'string' ? message : JSON.stringify(message));
          errors.push({ id: item.id, table: item.table, status: error.response?.status, message });
          if (table === 'sales' || table === 'supermarket-sales') break;
          if (error.response?.status >= 400 && error.response.status < 500 && error.response.status !== 429) continue;
          break;
        }
      }
      return { success: errors.length === 0, syncedCount, errors };
    } finally {
      syncInProgress = false;
    }
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => syncService.sync());
}

export default syncService;
