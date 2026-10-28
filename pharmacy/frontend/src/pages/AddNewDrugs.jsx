import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import drugService from '../services/drugService';
import categoryService from '../services/categoryService';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
   FaArrowLeft, FaBarcode, FaCalendarAlt, FaPlus, FaUndo, FaCog, FaPills, FaFlask, FaEdit, FaTrash, FaTimes
} from 'react-icons/fa';

const AddNewDrugs = () => {
   const navigate = useNavigate();
   const { id } = useParams();
   const { user } = useContext(AuthContext);
   const isEdit = !!id;
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      const canManageInventory = user?.isAdmin || (user?.role && ['admin', 'administrator', 'manager', 'director', 'staff', 'pharmacist', 'general'].includes(user.role.toLowerCase())) || !!user;
      if (user && !canManageInventory) {
         toast.error("Unauthorized access denied.");
         navigate('/inventory');
      }
   }, [user, navigate]);
   const [formData, setFormData] = useState({
      name: '',
      generic_name: '',
      category: '',
      dosage: '',
      form: 'Tablet',
      expiry_date: '',
      stock_date: '',
      unit_price: '',
      stock: '',
      reorder_level: '',
      barcode: '',
      category_obj: '',
   });
   const [categories, setCategories] = useState([]);
   const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
   const [newCategoryName, setNewCategoryName] = useState('');
   const [editingCategory, setEditingCategory] = useState(null);

   useEffect(() => {
      fetchCategories();
      if (!isEdit) {
         const today = new Date();
         const mm = String(today.getMonth() + 1).padStart(2, '0');
         const dd = String(today.getDate()).padStart(2, '0');
         const yyyy = today.getFullYear();
         setFormData(prev => ({ ...prev, stock_date: `${mm}/${dd}/${yyyy}` }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
         const res = await categoryService.addCategory({ name: newCategoryName.trim(), type: 'Pharmacy' });
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
         await categoryService.updateCategory(editingCategory.id, { name: newCategoryName.trim(), type: 'Pharmacy' });
         setEditingCategory(null);
         setNewCategoryName('');
         toast.success("Category updated!");
         fetchCategories(editingCategory.id);
      } catch (error) {
         console.error("Error updating category:", error);
         const serverErr = error.response?.data?.name?.[0] || error.response?.data?.type?.[0] || error.response?.data?.detail;
         toast.error(serverErr || "Failed to update category");
      }
   };

   const handleDeleteCategory = async (catId) => {
      if (!window.confirm("Are you sure? Items in this category will be unassigned.")) return;
      try {
         await categoryService.deleteCategory(catId);
         toast.success("Category deleted");
         if (formData.category_obj === catId.toString()) {
            setFormData(prev => ({ ...prev, category_obj: '' }));
         }
         fetchCategories();
      } catch (error) {
         console.error("Error deleting category:", error);
         toast.error("Failed to delete category");
      }
   };

   const fetchDrug = async () => {
      try {
         setLoading(true);
         const response = await drugService.getDrug(id);
         const drug = response?.data;

         if (drug) {
            const formatDate = (dateStr) => {
               if (!dateStr) return '';
               const parts = dateStr.split('-');
               if (parts.length === 3) {
                  return `${parts[1]}/${parts[2]}/${parts[0]}`;
               }
               return dateStr;
            };

            setFormData({
               ...drug,
               expiry_date: formatDate(drug.expiry_date),
               stock_date: formatDate(drug.stock_date) || (isEdit ? '' : formData.stock_date),
               category_obj: drug.category_obj || ''
            });
         }
      } catch (err) {
         console.error("Failed to fetch drug", err);
         if (navigator.onLine) {
            toast.error("Failed to load drug details.");
         }
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (isEdit) {
         fetchDrug();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [id]);

   const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
   };

   const handleSave = async () => {
      if (!formData.name?.trim() || (!formData.category_obj && !formData.category?.trim()) || formData.unit_price === '' || formData.unit_price === null || formData.unit_price === undefined) {
         return toast.error('Required fields missing: Name, Category, Price');
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
            expiry_date: parseDate(formData.expiry_date),
            stock_date: parseDate(formData.stock_date),
            unit_price: parseFloat(formData.unit_price) || 0,
            stock: parseInt(formData.stock) || 0,
            reorder_level: parseInt(formData.reorder_level) || 10
         };

         if (isEdit) {
            await drugService.updateDrug(id, payload);
            toast.success('Clinical record updated!');
         } else {
            await drugService.addDrug(payload);
            toast.success('Medication added to inventory!');
         }
         navigate('/inventory');
      } catch (error) {
         console.error(error);
         const errorMsg = error.response?.data?.detail || error.response?.data?.barcode?.[0] || "";
         if (errorMsg.toLowerCase().includes('unique') || errorMsg.toLowerCase().includes('already exists') || error.response?.status === 500) {
            toast.error("Duplicate Barcode: This barcode is already registered in the pharmacy inventory.");
         } else {
            toast.error(isEdit ? 'Update failed.' : 'Entry failed.');
         }
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="w-full space-y-6 animate-in fade-in duration-500 pb-10 text-sm py-8 px-4 md:px-6 lg:px-8">

         <header className="flex items-center justify-between px-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[12px] font-black text-slate-400 hover:text-emerald-500 transition-colors uppercase tracking-widest">
               <FaArrowLeft className="w-2.5 h-2.5" /> Back
            </button>
            <Link to="/sales/return" className="text-[12px] font-black text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-2">
               <FaUndo className="w-2.5 h-2.5" /> Adjustments
            </Link>
         </header>

         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 pb-10 border-b border-slate-50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl shadow-sm">
                     {isEdit ? <FaCog /> : <FaFlask />}
                  </div>
                  <div>
                     <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase font-outfit leading-none">{isEdit ? 'Modify Medication' : 'Add Medication'}</h1>
                     <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{isEdit ? 'Updating pharmaceutical vault' : ''}</p>
                  </div>
               </div>

               <div className="flex gap-3">
                  <button onClick={() => navigate(-1)} className="px-5 py-2 rounded-lg bg-slate-50 text-slate-400 font-black text-[12px] uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                  <button onClick={handleSave} disabled={loading} className="bg-emerald-500 text-white font-black px-6 py-2 rounded-lg text-[12px] uppercase tracking-widest shadow-none border border-emerald-500 hover:bg-emerald-600 transition-all min-w-[140px]">
                     {loading ? "PROCESSING..." : (isEdit ? "COMMIT UPDATE" : "AUTHORIZE")}
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">

               {/* Col 1 */}
               <div className="space-y-6">
                  <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-2 border-b border-emerald-50 pb-1">Identification</h3>

                  <div className="space-y-2">
                     <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Brand Name <span className="text-red-500">*</span></label>
                     <div className="relative">
                        <FaPills className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                        <input
                           type="text"
                           name="name"
                           value={formData.name}
                           onChange={handleChange}
                           placeholder="e.g. Paracetamol"
                           className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 outline-none uppercase transition-all"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Generic Name</label>
                     <input
                        type="text"
                        name="generic_name"
                        value={formData.generic_name}
                        onChange={handleChange}
                        placeholder="e.g. Acetaminophen"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold italic text-slate-600 focus:ring-2 focus:ring-emerald-50 outline-none transition-all"
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Universal Barcode</label>
                     <div className="relative">
                        <FaBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                        <input
                           type="text"
                           name="barcode"
                           value={formData.barcode}
                           onChange={handleChange}
                           placeholder="Scan or enter barcode..."
                           className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-lg text-xs font-black text-emerald-700 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <div className="flex items-center justify-between">
                           <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Clinical Group <span className="text-red-500">*</span></label>
                           <button
                              type="button"
                              onClick={() => { setEditingCategory(null); setNewCategoryName(''); setIsCategoryModalOpen(true); }}
                              className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 uppercase tracking-tight"
                           >
                              <FaPlus className="text-[9px]" /> Add New
                           </button>
                        </div>
                        <select
                           name="category_obj"
                           value={formData.category_obj || ""}
                           onChange={(e) => setFormData({ ...formData, category_obj: e.target.value })}
                           className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-black focus:ring-2 focus:ring-emerald-50 outline-none appearance-none cursor-pointer"
                        >
                           <option value="">Select Category</option>
                           {categories.filter(c => c.type === 'Pharmacy').map(cat => (
                              <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                           ))}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Form</label>
                        <select
                           name="form"
                           value={formData.form}
                           onChange={handleChange}
                           className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-black focus:ring-2 focus:ring-emerald-50 outline-none appearance-none cursor-pointer"
                        >
                           <option>Tablet</option>
                           <option>Capsule</option>
                           <option>Syrup</option>
                           <option>Injection</option>
                           <option>Drops</option>
                           <option>Ointments</option>
                           <option>Cream</option>
                           <option>Inhaler</option>
                           <option>Suppository</option>
                           <option>Spray</option>
                           <option>Solution</option>
                           <option>Suspension</option>
                           <option>Foam</option>
                           <option>Gel</option>
                           <option>Lotion</option>
                           <option>Infusions</option>

                        </select>
                     </div>
                  </div>
               </div>

               {/* Col 2 */}
               <div className="space-y-6">
                  <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-2 border-b border-blue-50 pb-1">Inventory</h3>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Dosage</label>
                        <input
                           type="text"
                           name="dosage"
                           value={formData.dosage}
                           onChange={handleChange}
                           placeholder="500mg"
                           className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black focus:ring-2 focus:ring-emerald-50 outline-none transition-all"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Price (₦) <span className="text-red-500">*</span></label>
                        <input
                           type="number"
                           step="0.01"
                           name="unit_price"
                           value={formData.unit_price}
                           onChange={handleChange}
                           className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-lg text-xs font-black text-blue-700 tabular-nums focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Stock</label>
                        <input
                           type="number"
                           name="stock"
                           value={formData.stock}
                           onChange={handleChange}
                           className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black focus:ring-2 focus:ring-emerald-50 outline-none transition-all"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Reorder at</label>
                        <input
                           type="number"
                           name="reorder_level"
                           value={formData.reorder_level}
                           onChange={handleChange}
                           className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black text-orange-600 focus:ring-2 focus:ring-orange-50 outline-none transition-all"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Stock Date</label>
                     <div className="relative">
                        <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                        <input
                           type="text"
                           name="stock_date"
                           value={formData.stock_date}
                           onChange={handleChange}
                           placeholder="MM/DD/YYYY"
                           className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black tabular-nums focus:ring-2 focus:ring-emerald-50 outline-none transition-all"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="block text-[12px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</label>
                     <div className="relative">
                        <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                        <input
                           type="text"
                           name="expiry_date"
                           value={formData.expiry_date}
                           onChange={handleChange}
                           placeholder="MM/DD/YYYY"
                           className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black tabular-nums focus:ring-2 focus:ring-emerald-50 outline-none transition-all"
                        />
                     </div>
                  </div>
               </div>

            </div>
         </div>

         {/* Category Management Modal */}
         {isCategoryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-xs">
               <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 animate-in zoom-in duration-300">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                     <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Manage Pharmacy Categories</h2>
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

export default AddNewDrugs;
