import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FaSearch, FaPlus, FaBox,
  FaExclamationTriangle,
  FaMoneyBill, FaFilter, FaFileExport, FaEdit, FaThLarge, FaTimes, FaTrash
} from 'react-icons/fa';

const SupermarketInventory = () => {
  const { user } = useContext(AuthContext);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Low Stock' | 'Expiring Soon'
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openModal) {
      setIsCategoryModalOpen(true);
    }
  }, [location]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      const products = response.data.results || response.data;
      setInventoryData(Array.isArray(products) ? products : []);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColorClass = (category) => {
    const categoryColors = {
      'Beverages': 'bg-blue-50 text-blue-600',
      'Snacks': 'bg-orange-50 text-orange-600',
      'Dairy': 'bg-emerald-50 text-emerald-600',
      'Grains': 'bg-amber-50 text-amber-600',
      'Toiletries': 'bg-purple-50 text-purple-600',
      'Meat': 'bg-red-50 text-red-600'
    };
    return categoryColors[category] || 'bg-slate-50 text-slate-600';
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await categoryService.addCategory({ name: newCategoryName.trim(), type: 'Supermarket' });
      setNewCategoryName('');
      fetchCategories();
      toast.success("Category created successfully!");
    } catch (error) {
      console.error("Error adding category:", error);
      const serverErr = error.response?.data?.name?.[0] || error.response?.data?.type?.[0] || error.response?.data?.detail;
      toast.error(serverErr || "Failed to create category");
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;
    try {
      await categoryService.updateCategory(editingCategory.id, { name: newCategoryName.trim(), type: 'Supermarket' });
      setEditingCategory(null);
      setNewCategoryName('');
      fetchCategories();
      toast.success("Category updated successfully!");
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
      fetchProducts();
      toast.success("Category deleted");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"? This action cannot be undone.`)) return;
    try {
      await productService.deleteProduct(id);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleExportCSV = () => {
    if (inventoryData.length === 0) return;

    const headers = ['Product Name', 'SKU', 'Category', 'In Stock', 'Unit Price (₦)', 'Expiry Date', 'Status'];
    const rows = filteredData.map(item => [
      item.name || '',
      `SKU-${item.id}`,
      item.category_name || item.category || 'Uncategorized',
      item.stock || 0,
      parseFloat(item.unit_price || 0).toFixed(2),
      item.expiry_date || 'N/A',
      (item.stock || 0) <= (item.reorder_level || 10) ? 'Low Stock' : 'In Stock'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `supermarket_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = inventoryData.filter(item => {
    if (!item) return false;
    const matchesSearch = (item.name || "").toLowerCase().includes((searchTerm || "").toLowerCase().trim());
    const targetCategory = (selectedCategory || "").toLowerCase().trim();
    let matchesCategory = selectedCategory === 'All';

    if (!matchesCategory) {
      const selectedCatObj = categories.find(c => (c.name || "").toLowerCase().trim() === targetCategory);
      if (selectedCatObj && item.category_obj !== null && item.category_obj !== undefined && String(item.category_obj) === String(selectedCatObj.id)) {
        matchesCategory = true;
      } else {
        const itemCat = (item.category_name || item.category || "").toLowerCase().trim();
        matchesCategory = itemCat === targetCategory;
      }
    }

    const isLow = (item.stock || 0) <= (item.reorder_level || 10);
    const isExpiring = item.expiry_date &&
      (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) < 60;

    let matchesFilter = true;
    if (activeFilter === 'Low Stock') matchesFilter = isLow;
    else if (activeFilter === 'Expiring Soon') matchesFilter = isExpiring;

    return matchesSearch && matchesCategory && matchesFilter;
  });

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 text-xs py-8 px-4 md:px-6 lg:px-8">

      {/* Top Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase font-outfit">Supermarket Inventory</h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">General Merchandise Stock Tracking</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-0 w-full sm:w-[400px] bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-50 focus-within:border-emerald-500 transition-all shadow-sm">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 pl-4 pr-3 py-2 text-xs font-bold outline-none border-none bg-transparent"
            />
            <button className="w-5 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-emerald-500 border-l border-slate-100 transition-colors shrink-0">
              <FaSearch className="text-sm" />
            </button>
          </div>

          {user?.isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingCategory(null); setNewCategoryName(''); setIsCategoryModalOpen(true); }}
                className="px-4 py-2 w-full sm:w-auto text-xs whitespace-nowrap bg-white text-emerald-600 border border-emerald-200 rounded-xl font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all shadow-sm"
              >
                <FaPlus /> Add Category
              </button>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-4 py-2 w-full sm:w-auto text-xs whitespace-nowrap bg-white text-slate-700 border border-slate-200 rounded-xl font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
              >
                <FaEdit /> Edit Categories
              </button>
              <Link to="/supermarket/inventory/new" className="px-4 py-2 w-full sm:w-auto text-xs whitespace-nowrap bg-emerald-600 text-white rounded-xl font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                <FaPlus /> New Product
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Items Inventory</span>
            <FaBox className="text-slate-300 text-[10px]" />
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-black text-slate-900 tabular-nums">{loading ? "..." : inventoryData.length}</p>
            <p className="text-[8px] font-bold text-emerald-500 uppercase">Items</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm border-l-2 border-l-red-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Low Stock</span>
            <FaExclamationTriangle className="text-red-300 text-[10px]" />
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-black text-slate-900 tabular-nums">
              {loading ? "..." : inventoryData.filter(item => (item.stock || 0) <= (item.reorder_level || 10)).length}
            </p>
            <p className="text-[8px] font-bold text-red-500 uppercase">Alerts</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm border-l-2 border-l-blue-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Total Valuation</span>
            <FaMoneyBill className="text-blue-300 text-[10px]" />
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-black text-slate-900 tabular-nums">
              ₦{loading ? "..." : inventoryData.reduce((acc, item) => acc + (parseFloat(item.unit_price) * (item.stock || 0)), 0).toLocaleString()}
            </p>
            <p className="text-[8px] font-bold text-blue-500 uppercase">Assets</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          {['All', ...Array.from(new Set([
            ...categories.filter(c => c.type === 'Supermarket').map(c => c.name),
            ...inventoryData.map(item => item.category_name || item.category).filter(Boolean)
          ]))].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 whitespace-nowrap rounded-lg text-[9px] font-black uppercase tracking-tight transition-all border ${selectedCategory === cat
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white text-slate-400 border-slate-50 hover:border-slate-200'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter(activeFilter === 'Low Stock' ? 'All' : 'Low Stock')}
            className={`px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase flex items-center gap-2 transition-all ${activeFilter === 'Low Stock' ? 'bg-red-500 text-white border-red-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <FaFilter /> Low Stock
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-all"
          >
            <FaFileExport /> Export CSV
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Product Name</th>
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">In Stock</th>
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Expiry</th>
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData
                .map((item) => {
                  const isLow = (item.stock || 0) <= (item.reorder_level || 10);

                  // Expiry alert: within 2 months (60 days)
                  const isExpiring = item.expiry_date &&
                    (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) < 60;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-3">
                        <p className="text-[11px] font-black text-slate-900 group-hover:text-emerald-600 uppercase transition-colors">{item.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Items-{item.id.toString().padStart(4, '0')}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight ${getCategoryColorClass(item.category_name || item.category)}`}>
                          {item.category_name || item.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-[11px] font-black tabular-nums ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-slate-900 text-[11px] tabular-nums">₦{parseFloat(item.unit_price).toFixed(2)}</td>
                      <td className="px-5 py-3 text-center min-w-[100px]">
                        <span className={`text-[10px] font-black tabular-nums ${isExpiring ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                          {item.expiry_date || "N/A"}
                          {isExpiring && <span className="block text-[7px] text-red-600 mt-0.5">!! RED ALERT: EXPIRING SOON !!</span>}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${isLow ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {user?.isAdmin && (
                          <div className="flex justify-center items-center gap-1">
                            <Link to={`/supermarket/inventory/edit/${item.id}`} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Edit Product">
                              <FaEdit className="text-sm" />
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(item.id, item.name)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Product"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              {filteredData.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">No products in repository matching search/filter</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none uppercase"
                />
                <button
                  onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-tight text-[10px]"
                >
                  {editingCategory ? 'Update' : 'Add'}
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {categories.filter(c => c.type === 'Supermarket').map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 group">
                    <span className="text-[10px] font-bold text-slate-700 uppercase">{cat.name}</span>
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
                className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
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

export default SupermarketInventory;
