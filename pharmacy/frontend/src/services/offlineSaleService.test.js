import { beforeEach, describe, expect, it, vi } from 'vitest';

const { stores, queue, mockDb } = vi.hoisted(() => {
  const stores = {};
  const queue = [];
  const createStore = (name) => ({
    where: (field) => ({
      equals: (value) => ({ first: async () => [...(stores[name]?.values() || [])].find((row) => row[field] === value) })
    }),
    get: async (id) => stores[name].get(id),
    add: async (row) => { stores[name].set(row.id, structuredClone(row)); return row.id; },
    put: async (row) => { stores[name].set(row.id, structuredClone(row)); return row.id; },
    update: async (id, changes) => {
      const row = stores[name].get(id);
      if (row) stores[name].set(id, { ...row, ...changes });
    }
  });
  const mockDb = {
    table: (name) => createStore(name),
    syncQueue: { add: async (item) => { queue.push(structuredClone(item)); } },
    transaction: async (...args) => args.at(-1)()
  };
  return { stores, queue, mockDb };
});

vi.mock('./db', () => ({ db: mockDb }));
const { saveOfflineSale } = await import('./offlineSaleService');

describe('offline sale persistence', () => {
  beforeEach(() => {
    Object.keys(stores).forEach((key) => delete stores[key]);
    stores.sales = new Map();
    stores.drugs = new Map([[7, { id: 7, name: 'Cached medicine', stock: 5, unit_price: '10.00' }]]);
    stores.supermarketSales = new Map();
    stores.products = new Map([[9, { id: 9, name: 'Cached grocery', stock: 4, unit_price: '5.00' }]]);
    queue.length = 0;
  });

  it('records a pharmacy sale and reserves cached stock in the same local transaction', async () => {
    const result = await saveOfflineSale({
      salesStore: 'sales', inventoryStore: 'drugs', endpoint: 'sales',
      saleData: {
        transaction_id: 'TX-OFFLINE-001', staff: 2, total_amount: '21.00', payment_method: 'Cash',
        items: [{ drug: 7, quantity: 2, unit_price: '10.00', subtotal: '20.00' }]
      }
    });

    expect(result.offline).toBe(true);
    expect(result.data.items[0].name).toBe('Cached medicine');
    expect(stores.drugs.get(7).stock).toBe(3);
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('sales');
  });

  it('queues supermarket sales in their separate local store', async () => {
    const result = await saveOfflineSale({
      salesStore: 'supermarketSales', inventoryStore: 'products', endpoint: 'supermarket-sales',
      saleData: {
        transaction_id: 'STX-OFFLINE-001', staff: 2, total_amount: '10.75', payment_method: 'Cash',
        items: [{ product: 9, quantity: 2, unit_price: '5.00', subtotal: '10.00' }]
      }
    });

    expect(result.data.items[0].name).toBe('Cached grocery');
    expect(stores.products.get(9).stock).toBe(2);
    expect(queue[0].table).toBe('supermarket-sales');
  });

  it('returns an existing transaction on a repeated local submit without a second stock deduction', async () => {
    const saleData = {
      transaction_id: 'TX-OFFLINE-RETRY', staff: 2, total_amount: '10.50', payment_method: 'Cash',
      items: [{ drug: 7, quantity: 1, unit_price: '10.00', subtotal: '10.00' }]
    };
    await saveOfflineSale({ salesStore: 'sales', inventoryStore: 'drugs', endpoint: 'sales', saleData });
    const repeated = await saveOfflineSale({ salesStore: 'sales', inventoryStore: 'drugs', endpoint: 'sales', saleData });

    expect(stores.drugs.get(7).stock).toBe(4);
    expect(queue).toHaveLength(1);
    expect(repeated.data.transaction_id).toBe(saleData.transaction_id);
  });

  it('rejects a sale when the cached stock is insufficient', async () => {
    await expect(saveOfflineSale({
      salesStore: 'sales', inventoryStore: 'drugs', endpoint: 'sales',
      saleData: {
        transaction_id: 'TX-OFFLINE-OOS', total_amount: '100.00', payment_method: 'Cash',
        items: [{ drug: 7, quantity: 6, unit_price: '10.00', subtotal: '60.00' }]
      }
    })).rejects.toThrow('Insufficient cached stock');
    expect(queue).toHaveLength(0);
  });
});
