import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import drugService from '../services/drugService';
import categoryService from '../services/categoryService';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FaSearch, FaBell, FaPlus, FaThLarge, FaCashRegister, FaBox,
  FaUsers, FaClipboardList, FaCog, FaPills, FaExclamationTriangle,
  FaClock, FaMoneyBill, FaFilter, FaFileExport, FaChevronLeft, FaChevronRight, FaEdit, FaTimes, FaTrash
} from 'react-icons/fa';

const InventoryManagement = () => {
  const { user } = useContext(AuthContext);
  const canManageInventory = user?.isAdmin || (user?.role && ['admin', 'administrator', 'manager', 'director', 'staff', 'pharmacist', 'general'].includes(user.role.toLowerCase())) || !!user;
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Low Stock', '30 Days Expiry', '100 Days Expiry'

  useEffect(() => {
    fetchDrugs();
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

  const fetchDrugs = async () => {
    try {
      const response = await drugService.getDrugs();
      const drugs = response.data.results || response.data;
      setInventoryData(Array.isArray(drugs) ? drugs : []);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColorClass = (category) => {
    const categoryMap = {
      'Analgesic': 'bg-purple-50 text-purple-600',
      'Antibiotic': 'bg-blue-50 text-blue-600',
      'Antihistamine': 'bg-orange-50 text-orange-600',
      'Antihypertensive': 'bg-orange-50 text-orange-600',
      'Antidiabetic': 'bg-orange-50 text-orange-600',
      'Antimalarial': 'bg-orange-50 text-orange-600',
      'Antipyretic': 'bg-orange-50 text-orange-600',
      'Infusions': 'bg-orange-50 text-orange-600',
      'Antiseptics': 'bg-orange-50 text-orange-600',
      'Methylated Spirit': 'bg-orange-50 text-orange-600',
      'Antidiarrheal': 'bg-orange-50 text-orange-600',
      'Antifungal': 'bg-orange-50 text-orange-600',
      'Haematinics': 'bg-orange-50 text-orange-600',
      'Expectorants': 'bg-orange-50 text-orange-600',
      'Antacids': 'bg-orange-50 text-orange-600',
      // Add more categories as needed
    };
    return categoryMap[category] || 'bg-emerald-50 text-emerald-600';
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await categoryService.addCategory({ name: newCategoryName.trim(), type: 'Pharmacy' });
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
      await categoryService.updateCategory(editingCategory.id, { name: newCategoryName.trim(), type: 'Pharmacy' });
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
      fetchDrugs();
      toast.success("Category deleted");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleDeleteDrug = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete medication "${name}"? This action cannot be undone.`)) return;
    try {
      await drugService.deleteDrug(id);
      fetchDrugs();
    } catch (error) {
      console.error("Error deleting drug:", error);
    }
  };

  const handleExportCSV = () => {
    if (inventoryData.length === 0) return;
    
    const headers = ['Name', 'Generic Name', 'Category', 'Dosage', 'Form', 'Stock', 'Unit Price', 'Expiry Date', 'Status'];
    const rows = filteredData.map(item => [
      item.name || '',
      item.generic_name || '',
      item.category_name || item.category || 'Uncategorized',
      item.dosage || '',
      item.form || '',
      item.stock || 0,
      item.unit_price || 0,
      item.expiry_date || 'N/A',
      (parseInt(item.stock) || 0) <= (parseInt(item.reorder_level) || 10) ? 'Low Stock' : 'In Stock'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDaysToExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatExpiryTime = (expiryDate) => {
    const days = getDaysToExpiry(expiryDate);
    if (days === null) return 'N/A';
    if (days < 0) return 'Expired';
    
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    
    if (months > 0) {
      return `${months}m ${remainingDays}d`;
    }
    return `${days}d`;
  };

  const filteredData = inventoryData.filter(item => {
    if (!item) return false;
    const search = (searchTerm || "").toLowerCase().trim();
    const nameStr = (item.name || "").toLowerCase();
    const genericStr = (item.generic_name || "").toLowerCase();
    const matchesSearch = !search || nameStr.includes(search) || genericStr.includes(search);

    const targetCategory = (selectedCategory || "").toLowerCase().trim();
    let matchesCategory = selectedCategory === 'All';

    if (!matchesCategory) {
      const selectedCatObj = categories.find(c => (c.name || "").toLowerCase().trim() === targetCategory);
      if (selectedCatObj && item.category_obj !== null && item.category_obj !== undefined && String(item.category_obj) === String(selectedCatObj.id)) {
        matchesCategory = true;
      } else {
        const drugCatName = (item.category_name || item.category || "").toLowerCase().trim();
        matchesCategory = drugCatName === targetCategory;
      }
    }

    const daysToExpiry = getDaysToExpiry(item.expiry_date);
    const isLow = (parseInt(item.stock) || 0) <= (parseInt(item.reorder_level) || 10);
    
    let matchesFilter = true;
    if (activeFilter === 'Low Stock') matchesFilter = isLow;
    else if (activeFilter === '30 Days Expiry') matchesFilter = daysToExpiry !== null && daysToExpiry > 0 && daysToExpiry <= 30;
    else if (activeFilter === '100 Days Expiry') matchesFilter = daysToExpiry !== null && daysToExpiry > 0 && daysToExpiry <= 100;

    return matchesSearch && matchesCategory && matchesFilter;
  });

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 text-sm py-8 px-4 md:px-6 lg:px-8">

      {/* Top Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase font-outfit">Inventory Control</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Medication Stock</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-0 w-full sm:w-[300px] bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-50 focus-within:border-emerald-500 transition-all shadow-sm">
            <input
              type="text"
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 pl-4 pr-3 py-2 text-xs font-bold outline-none border-none bg-transparent"
            />
            <button className="w-7 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-emerald-500 border-l border-slate-100 transition-colors shrink-0">
              <FaSearch className="text-sm" />
            </button>
          </div>

          {canManageInventory && (
            <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => { setEditingCategory(null); setNewCategoryName(''); setIsCategoryModalOpen(true); }}
                className="btn-pharmacy px-3 py-2 text-xs whitespace-nowrap shadow-none border bg-white text-emerald-600 border-emerald-200 flex-1 sm:flex-initial justify-center"
              >
                <FaPlus /> Add Category
              </button>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="btn-pharmacy px-3 py-2 text-xs whitespace-nowrap shadow-none border bg-white text-slate-700 flex-1 sm:flex-initial justify-center"
              >
                <FaEdit /> Edit Categories
              </button>
              <Link to="/inventory/new" className="btn-pharmacy px-3 py-2 text-xs whitespace-nowrap shadow-none border flex-1 sm:flex-initial justify-center">
                <FaPlus /> New Entry
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Items</span>
            <FaBox className="text-slate-300 text-[12px]" />
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-black text-slate-900 tabular-nums">{loading ? "..." : inventoryData.length}</p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Items </p>
          </div>
        </div>

        <div 
          onClick={() => setActiveFilter(activeFilter === 'Low Stock' ? 'All' : 'Low Stock')}
          className={`cursor-pointer bg-white p-3 rounded-2xl border border-slate-200 shadow-sm border-l-2 border-l-red-500 transition-all ${activeFilter === 'Low Stock' ? 'ring-2 ring-red-100 bg-red-50/10' : ''}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Low Stock</span>
            <FaExclamationTriangle className="text-red-300 text-[12px]" />
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-black text-slate-900 tabular-nums">
              {loading ? "..." : inventoryData.filter(item => (item.stock || 0) <= (item.reorder_level || 10)).length}
            </p>
            <p className="text-[10px] font-bold text-red-500 uppercase">Alerts</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveFilter(activeFilter === '30 Days Expiry' ? 'All' : '30 Days Expiry')}
          className={`cursor-pointer bg-white p-3 rounded-2xl border border-slate-200 shadow-sm border-l-2 border-l-orange-500 transition-all ${activeFilter === '30 Days Expiry' ? 'ring-2 ring-orange-100 bg-orange-50/10' : ''}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Expiry</span>
            <FaClock className="text-orange-300 text-[12px]" />
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-black text-slate-900 tabular-nums">
              {loading ? "..." : inventoryData.filter(item => {
                const diff = getDaysToExpiry(item.expiry_date);
                return diff !== null && diff > 0 && diff <= 30;
              }).length}
            </p>
            <p className="text-[10px] font-bold text-orange-500 uppercase">30 Days</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</span>
            <FaMoneyBill className="text-indigo-300 text-[12px]" />
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-black text-slate-900 tabular-nums">
              ₦{loading ? "..." : inventoryData.reduce((acc, item) => acc + ((parseFloat(item.unit_price) || 0) * (parseInt(item.stock) || 0)), 0).toLocaleString()}
            </p>
            <p className="text-[10px] font-bold text-indigo-500 uppercase">Total</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-auto">
          {['All', ...Array.from(new Set([
            ...categories.filter(c => c.type === 'Pharmacy').map(c => c.name),
            ...inventoryData.map(item => item.category_name || item.category).filter(Boolean)
          ]))].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 whitespace-nowrap rounded-lg text-[11px] font-black uppercase tracking-tight transition-all border shrink-0 ${selectedCategory === cat
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'
                }`}
            >
              {cat === 'All' ? 'Complete' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={() => setActiveFilter(activeFilter === '100 Days Expiry' ? 'All' : '100 Days Expiry')}
            className={`btn-pharmacy text-[11px] py-1.5 px-3 border shadow-none transition-all flex-1 md:flex-initial justify-center ${activeFilter === '100 Days Expiry' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white'}`}
          >
            <FaClock /> 100 Days
          </button>
          <button 
            onClick={() => {
              if (activeFilter !== 'All') setActiveFilter('All');
              else setActiveFilter('Low Stock');
            }}
            className={`btn-pharmacy text-[11px] py-1.5 px-3 border shadow-none transition-all flex-1 md:flex-initial justify-center ${activeFilter === 'Low Stock' ? 'bg-red-500 text-white border-red-500' : 'bg-white'}`}
          >
            <FaFilter /> Low Stock
          </button>
          <button 
            onClick={handleExportCSV}
            className="btn-pharmacy text-[11px] py-1.5 px-3 border shadow-none bg-white hover:bg-slate-50 transition-all flex-1 md:flex-initial justify-center"
          >
            <FaFileExport /> CSV
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Medication</th>
                <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Dosage</th>
                <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Expiry</th>
                <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center tracking-tighter">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item) => {
                  const isLow = (item.stock || 0) <= (item.reorder_level || 10);

                  // Expiry alert: within 2 months (60 days)
                  const isExpiring = item.expiry_date &&
                    (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) < 60;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-3 min-w-[150px]">
                        <p className="text-[13px] font-black text-slate-900 group-hover:text-emerald-600 uppercase transition-colors">{item.name}</p>
                        <span className="text-[12px] font-bold text-slate-500 italic truncate block max-w-[100px]">{item.generic_name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${getCategoryColorClass(item.category_name || item.category)}`}>
                          {item.category_name || item.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-slate-600 text-[12px]">{item.dosage}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[13px] font-black tabular-nums ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-slate-900 text-[13px] tabular-nums">₦{item.unit_price}</td>
                      <td className="px-5 py-3 text-center min-w-[120px]">
                        <span className={`text-[12px] font-black tabular-nums ${isExpiring ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                          <span className="block">{item.expiry_date || "N/A"}</span>
                          <span className="block text-[9px] font-bold uppercase tracking-tight opacity-70">
                            {formatExpiryTime(item.expiry_date)}
                          </span>
                          {isExpiring && <span className="block text-[7px] text-red-600 mt-0.5 font-black">!! EXPIRING !!</span>}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isLow ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {canManageInventory && (
                          <div className="flex justify-center items-center gap-1">
                            <Link to={`/inventory/edit/${item.id}`} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Edit Medication">
                              <FaEdit className="text-sm" />
                            </Link>
                            <button
                              onClick={() => handleDeleteDrug(item.id, item.name)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Medication"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
          {filteredData.length === 0 && !loading && (
            <div className="py-16 text-center space-y-2">
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No medications found matching filter</p>
              <p className="text-slate-400 text-[11px]">Try searching with a different keyword or resetting selected category</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 animate-in zoom-in duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Manage Categories</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <FaTimes className="text-slate-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none"
                />
                <button
                  onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                  className="btn-pharmacy px-4 py-2 text-[12px]"
                >
                  {editingCategory ? 'Update' : 'Add'}
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {categories.filter(c => c.type === 'Pharmacy').map(cat => (
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
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 text-[12px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
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

export default InventoryManagement;
