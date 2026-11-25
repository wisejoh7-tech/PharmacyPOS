import { db } from './db';

export const isTransportFailure = (error) => !error?.response
  || ['ERR_NETWORK', 'ECONNABORTED'].includes(error?.code)
  || error.response.status === 429
  || error.response.status >= 500;

export async function saveOfflineSale({ salesStore, inventoryStore, endpoint, saleData }) {
  const sales = db.table(salesStore);
  const inventory = db.table(inventoryStore);
  const txId = saleData.transaction_id;
  if (!txId) throw new Error('A transaction ID is required for offline sales.');

  return db.transaction('rw', sales, inventory, db.syncQueue, async () => {
    const existing = await sales.where('transaction_id').equals(txId).first();
    if (existing) return { data: existing, status: 201, offline: existing.syncStatus !== 'synced' };

    const receiptItems = [];
    for (const item of saleData.items || []) {
      const productId = Number(item.drug ?? item.product);
      const stockItem = await inventory.get(productId);
      if (!stockItem) throw new Error(`Item ${productId} is not in the offline catalog. Connect to the internet and refresh the POS before selling.`);
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Sale quantities must be greater than zero.');
      if (Number(stockItem.stock) < quantity) throw new Error(`Insufficient cached stock for ${stockItem.name}. Available: ${stockItem.stock}.`);
      await inventory.update(productId, { stock: Number(stockItem.stock) - quantity });
      receiptItems.push({
        ...item,
        ...(item.drug ? { drug_name: stockItem.name } : { product_name: stockItem.name }),
        name: stockItem.name,
        unit_price: Number(item.unit_price),
        subtotal: Number(item.subtotal)
      });
    }

    const now = new Date().toISOString();
    const localSale = {
      ...saleData,
      id: `offline:${txId}`,
      items: receiptItems,
      date: now,
      created_at: now,
      syncStatus: 'pending',
      syncError: null
    };
    await sales.add(localSale);
    await db.syncQueue.add({ action: 'CREATE', table: endpoint, data: saleData, timestamp: Date.now() });
    return { data: localSale, status: 201, offline: true };
  });
}

export async function cacheSyncedSale(salesStore, serverSale) {
  if (!serverSale?.transaction_id) return;
  const sales = db.table(salesStore);
  const existing = await sales.where('transaction_id').equals(serverSale.transaction_id).first();
  const id = existing?.id ?? serverSale.id;
  await sales.put({
    ...existing,
    ...serverSale,
    id,
    server_id: serverSale.id,
    syncStatus: 'synced',
    syncError: null
  });
}
