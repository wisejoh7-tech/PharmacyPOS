import api from './api';
import { db, addToSyncQueue } from './db';

const productService = {
    getProducts: async (config = {}) => {
        try {
            if (navigator.onLine) {
                const response = await api.get('products/', config);
                const products = response.data?.results || response.data;
                if (Array.isArray(products) && products.length > 0) {
                    await db.products.bulkPut(products);
                }
                return { data: products };
            }
        } catch (error) {
            console.error("Network failed, fetching products from local DB", error);
        }
        const localProducts = await db.products.toArray();
        return { data: localProducts };
    },

    getProduct: async (id) => {
        try {
            if (navigator.onLine) {
                return await api.get(`products/${id}/`);
            }
        } catch (error) {
            console.error("Network failed", error);
        }
        const product = await db.products.get(id);
        return { data: product };
    },

    addProduct: async (data) => {
        if (navigator.onLine) {
            const response = await api.post('products/', data);
            await db.products.add(response.data);
            return response;
        } else {
            const id = await db.products.add(data);
            await addToSyncQueue('CREATE', 'products', { ...data, id });
            return { data: { ...data, id }, status: 201 };
        }
    },

    updateProduct: async (id, data) => {
        const hasPrice = Object.prototype.hasOwnProperty.call(data, 'unit_price');
        if (navigator.onLine) {
            const response = hasPrice ? await api.put(`products/${id}/`, data) : await api.patch(`products/${id}/`, data);
            try { await db.products.put({ ...(await db.products.get(Number(id))), ...response.data, id: response.data?.id ?? id }); }
            catch (error) { console.warn('Product updated remotely but cache could not be updated:', error); }
            return response;
        }
        const existing = await db.products.get(Number(id));
        await db.products.put({ ...existing, ...data, id: Number(id) });
        await addToSyncQueue(hasPrice ? 'UPDATE' : 'PATCH', 'products', { ...data, id: Number(id) });
        return { data: { ...existing, ...data, id: Number(id) }, status: 200 };
    },

    deleteProduct: async (id) => {
        if (navigator.onLine) {
            await api.delete(`products/${id}/`);
        } else {
            await addToSyncQueue('DELETE', 'products', { id });
        }
        await db.products.delete(id);
        return { status: 204 };
    }
};

export default productService;
