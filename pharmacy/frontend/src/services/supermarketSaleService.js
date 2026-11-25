import api from './api';
import { db } from './db';
import { cacheSyncedSale, isTransportFailure, saveOfflineSale } from './offlineSaleService';

const supermarketSaleService = {
    getSales: async (config = {}) => {
        try {
            if (navigator.onLine) {
                const response = await api.get('supermarket-sales/', config);
                const sales = response.data?.results || response.data;
                if (Array.isArray(sales)) {
                    for (const sale of sales) await cacheSyncedSale('supermarketSales', sale);
                }
                return response;
            }
        } catch (error) {
            console.warn('Network unavailable; reading supermarket sales from local storage.', error);
        }
        return { data: await db.supermarketSales.toArray() };
    },
    getDashboardStats: async () => {
        try {
            if (navigator.onLine) return await api.get('supermarket-sales/dashboard-stats/');
        } catch (error) {
            console.warn('Network unavailable; calculating supermarket totals from local sales.', error);
        }
        const sales = await db.supermarketSales.toArray();
        const products = await db.products.toArray();
        return { data: {
            total_revenue: sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0),
            total_transactions: sales.length,
            low_stock_count: products.filter((product) => Number(product.stock) <= Number(product.reorder_level ?? 10)).length
        } };
    },
    processSale: async (saleData) => {
        if (navigator.onLine) {
            try {
                const response = await api.post('supermarket-sales/', saleData, { timeout: 5000 });
                await cacheSyncedSale('supermarketSales', response.data);
                return response;
            } catch (error) {
                if (!isTransportFailure(error)) throw error;
            }
        }
        return saveOfflineSale({
            salesStore: 'supermarketSales',
            inventoryStore: 'products',
            endpoint: 'supermarket-sales',
            saleData
        });
    }
};

export default supermarketSaleService;
