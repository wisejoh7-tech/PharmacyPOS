import api from './api';
import { db } from './db';

const syncService = {
  getPendingSyncCount: async () => {
    try { return await db.syncQueue.count(); } catch { return 0; }
  },

  sync: async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, reason: 'offline' };
    }
    const queue = await db.syncQueue.toArray();
    if (!queue.length) return { success: true, syncedCount: 0, errors: [] };
    let syncedCount = 0;
    const errors = [];

    for (const item of queue) {
      try {
        const endpoint = item.table.endsWith('/') ? item.table : `${item.table}/`;
        let response;
        const itemId = item.data?.id || item.id;
        if (item.action === 'CREATE') {
          const createData = { ...item.data };
          if (item.table.replace(/\/$/, '') === 'staff') delete createData.id;
          response = await api.post(endpoint, createData);
        }
        else if (item.action === 'UPDATE') response = await api.put(`${endpoint}${itemId}/`, item.data);
        else if (item.action === 'PATCH') response = await api.patch(`${endpoint}${itemId}/`, item.data);
        else if (item.action === 'DELETE') response = await api.delete(`${endpoint}${itemId}/`);

        if (response && response.status >= 200 && response.status < 300) {
          if (item.table.replace(/\/$/, '') === 'staff' && item.action === 'CREATE') {
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
                  if (queued.data?.id === localId) {
                    await db.syncQueue.update(queued.id, {
                      data: { ...queued.data, id: serverId },
                    });
                  }
                }
              });
            }
          }
          await db.syncQueue.delete(item.id);
          syncedCount++;
        }
      } catch (error) {
        console.error(`Sync failed for ${item.table} item:`, error.message);
        errors.push({ id: item.id, table: item.table, status: error.response?.status, message: error.response?.data || error.message });
        // Never silently discard validation/client errors; retain them for correction/retry.
        if (error.response?.status >= 400 && error.response.status < 500 && error.response.status !== 429) continue;
        break;
      }
    }
    return { success: errors.length === 0, syncedCount, errors };
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => syncService.sync());
}

export default syncService;
