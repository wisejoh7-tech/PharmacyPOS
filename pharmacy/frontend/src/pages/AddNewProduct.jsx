import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FaArrowLeft, FaBox, FaCubes, FaTag,
  FaDollarSign, FaBarcode, FaSave, FaPlus, FaEdit, FaTimes, FaTrash
} from 'react-icons/fa';

const AddNewProduct = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category_obj: '',
        unit_price: '',
        stock: '',
        reorder_level: 10,
        barcode: '',
        stock_date: '',
        expiry_date: ''
    });
    const [categories, setCategories] = useState([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);

    useEffect(() => {
        if (user && !user.isAdmin) {
            toast.error("Unauthorized access denied.");
            navigate('/supermarket/inventory');
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchCategories();
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const yyyy = today.getFullYear();
        setFormData(prev => ({ ...prev, stock_date: `${mm}/${dd}/${yyyy}` }));
    }, []);

    const fetchCategories = async (selectedId = null) => {
        try {
            const response = await categoryService.getCategories();
            const cats = response.data.results || response.data;
            setCategories(cats);
            if (selectedId) {
                setFormData(prev => ({ ...prev, category_obj: selectedId.toString() }));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const res = await categoryService.addCategory({ name: newCategoryName.trim(), type: 'Supermarket' });
            const newCat = res.data;
            setNewCategoryName('');
            toast.success("Category added!");
            fetchCategories(newCat?.id);
        } catch (error) {
            console.error("Error adding category:", error);
            const serverErr = error.response?.data?.name?.[0] || error.response?.data?.type?.[0] || error.response?.data?.detail;
            toast.error(serverErr || "Failed to add category");
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory || !newCategoryName.trim()) return;
        try {
            await categoryService.updateCategory(editingCategory.id, { name: newCategoryName.trim(), type: 'Supermarket' });
            setEditingCategory(null);
            setNewCategoryName('');
            toast.success("Category updated!");
            fetchCategories();
        } catch (error) {
            console.error("Error updating category:", error);
            const serverErr = error.response?.data?.name?.[0] || error.response?.data?.type?.[0] || error.response?.data?.detail;
            toast.error(serverErr || "Failed to update category");
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Are you sure? Items in this category will be unassigned.")) return;
        try {
            await categoryService.deleteCategory(id);
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name?.trim() || (!formData.category_obj && !formData.category?.trim()) || formData.unit_price === '' || formData.unit_price === null || formData.unit_price === undefined) {
            return toast.error("Required fields missing: Name, Category, Price");
        }
        try {
            setLoading(true);
            const parseDate = (str) => {
                if (!str) return null;
                const parts = str.split('/');
                if (parts.length === 3) {
                    const [m, d, y] = parts;
                    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }
                return null;
            };

            const payload = {
                ...formData,
                barcode: formData.barcode?.trim() || null,
                stock_date: parseDate(formData.stock_date),
                expiry_date: parseDate(formData.expiry_date)
            };

            await productService.addProduct(payload);
            toast.success("Product added successfully!");
            navigate('/supermarket/inventory');
        } catch (error) {
            console.error("Failed to add product", error);
            const errorMsg = error.response?.data?.detail || error.response?.data?.barcode?.[0] || "";
            if (errorMsg.toLowerCase().includes('unique') || errorMsg.toLowerCase().includes('already exists') || error.response?.status === 500) {
                toast.error("Duplicate Barcode: This barcode is already assigned to another product.");
            } else {
                toast.error("Failed to add product. Please check your inputs.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50 min-h-screen text-sm">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all shadow-sm"
                    >
                        <FaArrowLeft className="w-3 h-3" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-0.5">
                            <FaCubes className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Merchandise Entry</span>
                        </div>
                        <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase font-outfit">New Product</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {user?.isAdmin && (
                        <>
                            <button
                                onClick={() => { setEditingCategory(null); setNewCategoryName(''); setIsCategoryModalOpen(true); }}
                                className="px-4 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-xl font-black uppercase tracking-tight flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-sm"
                            >
                                <FaPlus className="w-2.5 h-2.5" /> Add Category
                            </button>
                            <button
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-black uppercase tracking-tight flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <FaEdit className="w-2.5 h-2.5" /> Edit Cat
                            </button>
                        </>
                    )}
                    <button
                        form="product-form"
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-tight flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                    >
                        <FaSave className="w-3 h-3" />
                        {loading ? 'Processing...' : 'Provision Product'}
                    </button>
                </div>
            </header>

            <main className="flex-1 p-5 w-full">
                <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fundamental Info */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                            <FaTag className="text-emerald-500" />
                            <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Base Identity</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Product Name <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter full product descriptor..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-black focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Product Barcode</label>
                                <div className="relative">
                                    <FaBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                                    <input
                                        name="barcode"
                                        value={formData.barcode}
                                        onChange={handleChange}
                                        placeholder="Scan item barcode..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-black focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Category <span className="text-red-500">*</span></label>
                                <select
                                    name="category_obj"
                                    value={formData.category_obj}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-black focus:ring-2 focus:ring-emerald-50 transition-all outline-none appearance-none"
                                >
                                    <option value="">Select Category</option>
                                    {categories.filter(c => c.type === 'Supermarket').map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Stock Date</label>
                                <div className="relative">
                                    <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                                    <input
                                        name="stock_date"
                                        value={formData.stock_date}
                                        onChange={handleChange}
                                        placeholder="MM/DD/YYYY"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-black focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</label>
                                <div className="relative">
                                    <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                                    <input
                                        name="expiry_date"
                                        value={formData.expiry_date}
                                        onChange={handleChange}
                                        placeholder="MM/DD/YYYY"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-black focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock & Valuation */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                            <FaDollarSign className="text-blue-500" />
                            <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Logistics & Value</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Unit Price (₦) <span className="text-red-500">*</span></label>
                                    <input 
                                        required
                                        type="number"
                                        step="0.01"
                                        name="unit_price"
                                        value={formData.unit_price}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-black focus:ring-2 focus:ring-blue-50 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Stock Level</label>
                                    <input 
                                        required
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-black focus:ring-2 focus:ring-blue-50 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Reorder Threshold</label>
                                <input 
                                    type="number"
                                    name="reorder_level"
                                    value={formData.reorder_level}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-black focus:ring-2 focus:ring-blue-50 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            {/* Category Management Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-xs">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 animate-in zoom-in duration-300">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Manage Market Categories</h2>
                            <button onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setNewCategoryName(''); }} className="p-1 hover:bg-slate-100 rounded-lg">
                                <FaTimes className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="New category name..."
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-black focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none uppercase"
                                />
                                <button
                                    onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-tight text-[12px]"
                                >
                                    {editingCategory ? 'Update' : 'Add'}
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {categories.filter(c => c.type === 'Supermarket').map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 group">
                                        <span className="text-[12px] font-bold text-slate-700 uppercase">{cat.name}</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => { setEditingCategory(cat); setNewCategoryName(cat.name); }}
                                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Edit Category"
                                            >
                                                <FaEdit className="text-xs" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Category"
                                            >
                                                <FaTrash className="text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setNewCategoryName(''); }}
                                className="px-4 py-2 text-[12px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddNewProduct;
