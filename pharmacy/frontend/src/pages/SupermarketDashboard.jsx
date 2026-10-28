import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import supermarketSaleService from '../services/supermarketSaleService';
import { AuthContext } from '../context/AuthContext';
import {
   FaCalendarAlt, FaMoneyBill, FaShoppingCart, FaExclamationTriangle,
   FaThLarge, FaBox, FaChartLine, FaCog, FaPlus, FaSearch, FaBell
} from 'react-icons/fa';

const SupermarketDashboard = () => {
   const navigate = useNavigate();
   const { user } = useContext(AuthContext);

   const [stats, setStats] = useState({
      revenue: 0,
      transactions: 0,
      lowStock: 0,
      products: 0
   });
   const [inventoryData, setInventoryData] = useState([]);
   const [lowStockProducts, setLowStockProducts] = useState([]);
   const [loading, setLoading] = useState(true);

   const fetchData = async () => {
      try {
         setLoading(true);
         const [statsRes, productRes] = await Promise.all([
            supermarketSaleService.getDashboardStats(),
            productService.getProducts()
         ]);

         const data = statsRes.data;
         const allProducts = Array.isArray(productRes.data) ? productRes.data : (productRes.data.results || []);
         setInventoryData(allProducts);

         const lowStock = allProducts.filter(p => p.stock <= p.reorder_level);
         setLowStockProducts(lowStock.slice(0, 5));

         setStats({
            revenue: data.total_revenue,
            transactions: data.total_transactions,
            lowStock: data.low_stock_count,
            products: allProducts.length
         });
      } catch (error) {
         console.error("Supermarket dashboard data fetch failed", error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   const modules = [
      { name: 'Inventory', icon: <FaBox />, path: '/supermarket/inventory', desc: 'Stock control.' },
      { name: 'Categories', icon: <FaThLarge />, path: '/supermarket/inventory', desc: 'Manage groups.', state: { openModal: true } },
      { name: 'Reports', icon: <FaChartLine />, path: '/reports/sales', desc: 'Audits.' },
      { name: 'Settings', icon: <FaCog />, path: '/settings', desc: 'Integrations.' }
   ];

   return (
      <div className="space-y-4 animate-in fade-in duration-500 overflow-x-hidden text-sm">

         {/* Search Header */}
         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full max-w-[600px]">
               <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
               <input
                  type="text"
                  placeholder="Search SKU, transactions, or categories..."
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none placeholder:text-slate-300"
               />
            </div>

            <div className="flex items-center gap-3">
               <div className="hidden md:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                  <FaCalendarAlt className="text-blue-500 text-sm" />
                  <span className="text-[13px] font-black text-blue-800 uppercase tracking-tight">
                     {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
               </div>

               <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all relative">
                  <FaBell className="text-xl" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
               </button>

               <div className="group relative flex items-center gap-2 bg-white pl-1 pr-3 py-1 rounded-xl border border-slate-200 hover:border-blue-200 transition-all cursor-pointer">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-sm shadow-lg shadow-blue-200">S</div>
                  <div>
                     <p className="text-[13px] font-black text-slate-900 leading-none">Supermarket</p>
                     <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Manager</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Main Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Left Side: Stats & Low Stock Table */}
            <div className="lg:col-span-8 space-y-4">

               {/* KPI Stats */}
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                     <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm"><FaMoneyBill /></div>
                     <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Revenue</p>
                        <p className="text-sm font-black text-slate-900 tabular-nums">₦{stats.revenue.toLocaleString()}</p>
                     </div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                     <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-sm"><FaShoppingCart /></div>
                     <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Purchases</p>
                        <p className="text-sm font-black text-slate-900 tabular-nums">{stats.transactions}</p>
                     </div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 border-l-2 border-l-red-500">
                     <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-sm"><FaExclamationTriangle /></div>
                     <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Low Stock</p>
                        <p className="text-sm font-black text-red-600 tabular-nums">{stats.lowStock}</p>
                     </div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                     <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm"><FaBox /></div>
                     <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Prods</p>
                        <p className="text-sm font-black text-slate-900 tabular-nums">{stats.products}</p>
                     </div>
                  </div>
               </div>

               {/* Low Stock TABLE */}
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
                     <div>
                        <h3 className="text-xs font-black text-slate-600 uppercase tracking-tight">Replenishment</h3>
                        <p className="text-[11px] font-black text-slate-200 uppercase tracking-widest">Inventory Alert</p>
                     </div>
                     <button onClick={() => navigate('/supermarket/inventory')} className="text-[11px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-600">Full Audit</button>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                           <tr>
                              <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                              <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                              <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                              <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {loading ? (
                              <tr><td colSpan="4" className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Scanning...</td></tr>
                           ) : lowStockProducts.length === 0 ? (
                              <tr><td colSpan="4" className="py-10 text-center text-blue-500 font-black uppercase tracking-widest text-[12px]">All Stock Secure</td></tr>
                           ) : (
                              lowStockProducts.map(prod => (
                                 <tr key={prod.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-5 py-3">
                                       <p className="text-[13px] font-black text-slate-900 group-hover:text-blue-600 uppercase tracking-tight">{prod.name}</p>
                                       <p className="text-[10px] font-bold text-slate-400">SKU-{prod.id}</p>
                                    </td>
                                    <td className="px-5 py-3">
                                       <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[10px] font-black uppercase">{prod.category_name || prod.category || 'Uncategorized'}</span>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                       <span className="text-[13px] font-black text-red-600 tabular-nums">{prod.stock}</span>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                       <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase">Reorder</span>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>

            </div>

            {/* Right Side: Quick Links & Actions */}
            <div className="lg:col-span-4 space-y-4">

               <div className="bg-blue-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-blue-700 transition-all shadow-lg" onClick={() => navigate('/supermarket/pos')}>
                  <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center text-xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                     <FaPlus />
                  </div>
                  <p className="text-sm font-black text-white uppercase tracking-tight">New Transaction</p>
                  <p className="text-[11px] font-bold text-white/60 mt-1 uppercase tracking-widest">Supermarket POS</p>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  {modules.map(module => (
                     <div
                        key={module.name}
                        onClick={() => navigate(module.path, { state: module.state })} 
                        className="group bg-white p-3 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center text-center justify-center gap-2"
                     >
                        <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center text-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                           {module.icon}
                        </div>
                        <h3 className="text-[12px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{module.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 group-hover:text-blue-400 uppercase tracking-widest">{module.desc}</p>
                     </div>
                  ))}
                  {user?.isAdmin && (
                     <div
                        onClick={() => navigate('/supermarket/inventory/new')}
                        className="group bg-white p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer flex flex-col items-center text-center justify-center gap-2"
                     >
                        <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center text-lg group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                           <FaPlus />
                        </div>
                        <h3 className="text-[12px] font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">New Product</h3>
                     </div>
                  )}
               </div>

               <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Stock Value</h3>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">Inventory Worth</span>
                        <span className="text-[12px] font-black text-blue-500">
                           ₦{parseFloat(inventoryData?.reduce((acc, item) => acc + (parseFloat(item.unit_price) * (item.stock || 0)), 0) || 0).toLocaleString()}
                        </span>
                     </div>
                     <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[75%] rounded-full"></div>
                     </div>
                  </div>
               </div>

            </div>

         </div>

      </div>
   );
};

export default SupermarketDashboard;