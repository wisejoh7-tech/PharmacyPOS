import React, { useState, useEffect, useContext } from 'react';
import categoryService from '../services/categoryService';
import drugService from '../services/drugService';
import productService from '../services/productService';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FaFolder, FaPlus, FaSearch, FaEdit, FaTrash,
  FaTags, FaBoxes, FaShoppingCart, FaPills, FaSync
} from 'react-icons/fa';

const CategoryManagement = () => {
  const { user } = useContext(AuthContext);
  const canManageCategories = user?.isAdmin || (user?.role && ['admin', 'administrator', 'manager', 'director'].includes(user.role.toLowerCase())) || !!user;

  const [activeTab, setActiveTab] = useState('Pharmacy'); // 'Pharmacy' | 'Supermarket'
  const [categories, setCategories] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Category Form state
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('Pharmacy');
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    setCategoryType(activeTab);
  }, [activeTab]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [catRes, drugRes, prodRes] = await Promise.all([
        categoryService.getCategories().catch(() => ({ data: [] })),
        drugService.getDrugs().catch(() => ({ data: [] })),
        productService.getProducts().catch(() => ({ data: [] }))
      ]);

      const catData = catRes.data?.results || catRes.data || [];
      const drugData = drugRes.data?.results || drugRes.data || [];
      const prodData = prodRes.data?.results || prodRes.data || [];

      setCategories(Array.isArray(catData) ? catData : []);
      setDrugs(Array.isArray(drugData) ? drugData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (error) {
      console.error('Failed to load category data:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      return toast.error('Category name is required');
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          name: categoryName.trim(),
          type: categoryType
        });
        toast.success('Category updated successfully!');
      } else {
        await categoryService.addCategory({
          name: categoryName.trim(),
          type: categoryType
        });
        toast.success('Category created successfully!');
      }

      setCategoryName('');
      setEditingCategory(null);
      fetchAllData();
    } catch (error) {
      console.error('Error saving category:', error);
      const serverErr = error.response?.data?.name?.[0] || error.response?.data?.type?.[0] || error.response?.data?.detail;
      toast.error(serverErr || (editingCategory ? 'Failed to update category' : 'Failed to create category'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryType(cat.type || activeTab);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryType(activeTab);
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"? Stock items in this category will be unassigned.`)) {
      return;
    }

    try {
      await categoryService.deleteCategory(id);
      toast.success(`Category "${name}" deleted`);
      if (editingCategory?.id === id) {
        handleCancelEdit();
      }
      fetchAllData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Calculate item counts per category
  const getItemCount = (category) => {
    const isPharmacy = (category.type || 'Pharmacy') === 'Pharmacy';
    const items = isPharmacy ? drugs : products;
    const catIdStr = String(category.id);
    const catNameLower = (category.name || '').trim().toLowerCase();

    return items.filter(item => {
      if (!item) return false;
      const itemCatObjStr = item.category_obj !== null && item.category_obj !== undefined ? String(item.category_obj) : null;
      if (itemCatObjStr && itemCatObjStr === catIdStr) {
        return true;
      }
      const itemCat = (item.category_name || item.category || '').trim().toLowerCase();
      return itemCat && itemCat === catNameLower;
    }).length;
  };

  const filteredCategories = categories.filter(cat => {
    const matchesType = (cat.type || 'Pharmacy') === activeTab;
    const matchesSearch = !searchTerm.trim() || cat.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesType && matchesSearch;
  });

  const pharmacyCatCount = categories.filter(c => (c.type || 'Pharmacy') === 'Pharmacy').length;
  const supermarketCatCount = categories.filter(c => c.type === 'Supermarket').length;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 text-sm py-8 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase font-outfit">
            Category Management
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Organize & Structure Inventory Classification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
            title="Refresh Categories"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Categories</span>
            <FaFolder className="text-emerald-500 text-sm" />
          </div>
          <p className="text-lg font-black text-slate-900 tabular-nums">{loading ? '...' : categories.length}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm border-l-2 border-l-emerald-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pharmacy Categories</span>
            <FaPills className="text-emerald-400 text-sm" />
          </div>
          <p className="text-lg font-black text-slate-900 tabular-nums">{loading ? '...' : pharmacyCatCount}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm border-l-2 border-l-blue-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Supermarket Categories</span>
            <FaShoppingCart className="text-blue-400 text-sm" />
          </div>
          <p className="text-lg font-black text-slate-900 tabular-nums">{loading ? '...' : supermarketCatCount}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Items Classified</span>
            <FaBoxes className="text-indigo-400 text-sm" />
          </div>
          <p className="text-lg font-black text-slate-900 tabular-nums">
            {loading ? '...' : (drugs.length + products.length)}
          </p>
        </div>
      </div>

      {/* Main Layout: Add/Edit Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Category Form */}
        {canManageCategories && (
          <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <FaTags className="text-emerald-500 text-xs" />
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h2>
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-[11px]">
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Antibiotics, Beverages..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all"
                  style={{ fontSize: '11px' }}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Target Inventory Type
                </label>
                <select
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all cursor-pointer"
                  style={{ fontSize: '11px' }}
                >
                  <option value="Pharmacy">Pharmacy Stock</option>
                  <option value="Supermarket">Supermarket Hub</option>
                </select>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full btn-pharmacy py-2 text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
                  style={{ fontSize: '10px' }}
                >
                  {editingCategory ? (
                    <>Update Category</>
                  ) : (
                    <><FaPlus /> Add Category</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List Section */}
        <div className={`${canManageCategories ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>

          {/* Controls: Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setActiveTab('Pharmacy')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all flex items-center gap-2 ${
                  activeTab === 'Pharmacy'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FaPills className="text-xs" /> Pharmacy ({pharmacyCatCount})
              </button>
              <button
                onClick={() => setActiveTab('Supermarket')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all flex items-center gap-2 ${
                  activeTab === 'Supermarket'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FaShoppingCart className="text-xs" /> Supermarket ({supermarketCatCount})
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex-1 max-w-sm">
              <FaSearch className="text-slate-400 text-xs shrink-0" />
              <input
                type="text"
                placeholder={`Search ${activeTab.toLowerCase()} categories...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs font-bold outline-none border-none bg-transparent"
              />
            </div>
          </div>

          {/* Category Cards / List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Category Name</th>
                    <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
                    <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Associated Stock Items</th>
                    {canManageCategories && (
                      <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                        Loading categories...
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No {activeTab} categories found.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => {
                      const count = getItemCount(cat);
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
                                activeTab === 'Pharmacy' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                <FaFolder />
                              </div>
                              <span className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                                {cat.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              cat.type === 'Supermarket' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {cat.type || 'Pharmacy'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-xs font-black tabular-nums bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                              {count} {count === 1 ? 'item' : 'items'}
                            </span>
                          </td>
                          {canManageCategories && (
                            <td className="px-5 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleEditClick(cat)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Edit Category"
                                >
                                  <FaEdit className="text-xs" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete Category"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CategoryManagement;
