import api from './api';
import { db, addToSyncQueue } from './db';

const getCategories = async (config = {}) => {
    try {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
            const response = await api.get('categories/', config);
            const categories = response.data?.results || response.data;
            if (Array.isArray(categories) && categories.length > 0) {
                await db.categories.bulkPut(categories);
            }
            return { data: categories };
        }
    } catch (error) {
        console.error("Network failed, fetching categories from local DB", error);
    }
    const localCategories = await db.categories.toArray();
    return { data: localCategories };
};

const addCategory = async (data) => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
            const response = await api.post('categories/', data);
            await db.categories.put(response.data);
            return response;
        } catch (error) {
            // If error is network-related (e.g. server down / CORS error / loss of connection), fallback to offline save
            if (!error.response) {
                console.warn("Network request failed, falling back to local DB category creation.");
                const id = Date.now();
                const localData = { ...data, id };
                await db.categories.put(localData);
                await addToSyncQueue('CREATE', 'categories', localData);
                return { data: localData, status: 201 };
            }
            throw error;
        }
    } else {
        const id = Date.now();
        const localData = { ...data, id };
        await db.categories.put(localData);
        await addToSyncQueue('CREATE', 'categories', localData);
        return { data: localData, status: 201 };
    }
};

const updateCategory = async (id, data) => {
    const updatedData = { ...data, id };
    if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
            const response = await api.put(`categories/${id}/`, data);
            await db.categories.put(response.data);
            return response;
        } catch (error) {
            if (!error.response) {
                console.warn("Network request failed, falling back to local DB category update.");
                await db.categories.put(updatedData);
                await addToSyncQueue('UPDATE', 'categories', updatedData);
                return { data: updatedData, status: 200 };
            }
            throw error;
        }
    } else {
        await db.categories.put(updatedData);
        await addToSyncQueue('UPDATE', 'categories', updatedData);
        return { data: updatedData, status: 200 };
    }
};

const deleteCategory = async (id) => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
            await api.delete(`categories/${id}/`);
        } catch (error) {
            if (!error.response) {
                console.warn("Network request failed, queueing delete operation offline.");
                await addToSyncQueue('DELETE', 'categories', { id });
            } else {
                throw error;
            }
        }
    } else {
        await addToSyncQueue('DELETE', 'categories', { id });
    }
    await db.categories.delete(id);
    return { status: 204 };
};

export default {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory
};
