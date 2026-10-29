import Dexie from 'dexie';

export const db = new Dexie('PharmacyDB');

db.version(4).stores({
  drugs: '++id, name, category, sku',
  products: '++id, name, category',
  categories: '++id, name, type',
  staff: '++id, full_name, role',
  sales: '++id, customer_id, total_amount, date, status',
  returns: '++id, sale_id, reason, date',
  customers: '++id, name, phone',
  prescriptions: '++id, prescription_id, customer, status, created_at',
  prescriptionItems: '++id, prescription_id, drug, quantity',
  syncQueue: '++id, action, table, data, timestamp'
});

db.open().catch((err) => {
  console.error("Failed to open db:", err.stack || err);
});

export const addToSyncQueue = async (action, table, data) => {
  await db.syncQueue.add({
    action,
    table,
    data,
    timestamp: Date.now()
  });
};
