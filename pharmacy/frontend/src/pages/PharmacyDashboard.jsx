import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { socket } from '../services/socket';
import reportService from '../services/reportService';
import drugService from '../services/drugService';
import settingsService from '../services/settingsService';
import toast from 'react-hot-toast';
import { 
  FaCalendarAlt, FaMoneyBill, FaFilePrescription, FaExclamationTriangle, FaUsers,
  FaThLarge, FaCashRegister, FaBox, FaAddressCard, 
  FaBriefcaseMedical, FaChartLine, FaCog, FaPlus, FaArrowRight, FaSearch, FaBell,
  FaShoppingCart, FaRobot, FaShieldAlt
} from 'react-icons/fa';

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    revenue: 0,
    scripts: 0,
    lowStock: 0,
    soldOut: 0,
    customers: 0
  });
  const [lowStockDrugs, setLowStockDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ shop_name: 'New Light Medicine and Store', location: "St. Mary's" });

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      const [statsRes, drugRes, scriptsRes, customerRes, salesRes, settingsRes] = await Promise.all([
        reportService.getDashboardStats({ signal }).catch(() => ({ data: {} })),
        drugService.getDrugs({ signal }).catch(() => ({ data: [] })),
        api.get('prescriptions/', { signal }).catch(() => ({ data: [] })),
        api.get('customers/', { signal }).catch(() => ({ data: [] })),
        api.get('sales/', { signal }).catch(() => ({ data: [] })),
        settingsService.getSettings({ signal }).catch(() => ({ data: [] }))
      ]);

      if (settingsRes.data && settingsRes.data.length > 0) {
        setSettings(settingsRes.data[0]);
      }

      const data = statsRes.data || {};
      const allDrugs = drugRes.data?.results || drugRes.data || [];
      const lowStock = allDrugs.filter(d => parseInt(d.stock) <= parseInt(d.reorder_level || 5));
      const soldOut = allDrugs.filter(d => parseInt(d.stock) === 0);

      setLowStockDrugs(lowStock.slice(0, 5)); // Show top 5 low stock

      const scripts = scriptsRes.data?.results || scriptsRes.data || [];
      const customers = customerRes.data?.results || customerRes.data || [];
      const sales = salesRes.data?.results || salesRes.data || [];

      setStats({
        revenue: data.total_revenue || 0,
        scripts: scripts.filter(p => p.status === 'Pending').length,
        lowStock: lowStock.length,
        soldOut: soldOut.length,
        customers: sales.length > 0 ? sales.length : customers.length
      });

    } catch (error) {
      console.error("Dashboard data fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);

    socket.on('alert_new_prescription', (data) => {
        toast.success(`ALERT: New Prescription Received! ID: ${data.prescriptionId}`, {
            duration: 6000,
            icon: '🔔',
        });
        fetchData();
    });

    return () => {
        controller.abort();
        socket.off('alert_new_prescription');
    };
  }, []);

  const modules = [
    { name: 'Dashboard', icon: <FaThLarge />, path: '/', desc: 'Real-time metrics.' },
    { name: 'POS Terminal', icon: <FaCashRegister />, path: '/pos', desc: 'Efficiency & payments.' },
    { name: 'Supermarket', icon: <FaShoppingCart />, path: '/supermarket', desc: 'Retail Hub.' },
    { name: 'Inventory', icon: <FaBox />, path: '/inventory', desc: 'Stock control.' },
    { name: 'Patients', icon: <FaAddressCard />, path: '/customers', desc: 'History.' },
    { name: 'Prescriptions', icon: <FaBriefcaseMedical />, path: '/prescriptions/review', desc: 'E-scripts.' },
    { name: 'Reports', icon: <FaChartLine />, path: '/reports/sales', desc: 'Audits.' },
    { name: 'Staff List', icon: <FaUsers />, path: '/staff', desc: 'Access levels.' },
    { name: 'Settings', icon: <FaCog />, path: '/settings', desc: 'Integrations.' }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500 overflow-x-hidden text-sm">
      
      {/* Pharmacist Portal Branding Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 rounded-3xl p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-800/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 text-white shrink-0">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
              <path d="M12 28 C12 28, 14 48, 32 48 C50 48, 52 28, 52 28 Z" fill="#60a5fa" />
              <path d="M10 26 H54 V29 H10 Z" fill="#3b82f6" />
              <path d="M26 48 L22 56 H42 L38 48 Z" fill="#1d4ed8" />
              <path d="M38 12 L48 24 L42 28 L32 16 Z" fill="#93c5fd" />
              <path d="M29 33 H35 V39 H29 Z" fill="white" />
              <path d="M30 31 H34 V41 H30 Z" fill="white" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-blue-400/30">
                New Light Medicine and Store  Portal
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-300 text-xs font-bold">{settings.shop_name || 'New Light health Care Connect'}</span>
            </div>
            <h1 className="text-base font-black text-white tracking-tight uppercase font-outfit mt-1">
              Admin Dashboard
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            <FaShieldAlt className="text-blue-300 text-sm" />
            <span className="text-[13px] font-black text-blue-300 uppercase tracking-tight">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <button onClick={() => navigate('/staff/new')} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all border border-blue-500/50 shadow-md">
            + Add Staff
          </button>
        </div>
      </div>

      {/* Search Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full max-w-[600px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input 
            type="text" 
            placeholder="Search pharmacopeia, transactions, or patients..." 
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-50 focus:border-blue-800 transition-all outline-none placeholder:text-slate-300"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
            <FaCalendarAlt className="text-blue-800 text-sm" />
            <span className="text-[13px] font-black text-blue-900 uppercase tracking-tight">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-800 hover:border-blue-200 transition-all relative">
            <FaBell className="text-xl" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
          </button>

          <div className="group relative flex items-center gap-2 bg-white pl-1 pr-3 py-1 rounded-xl border border-slate-200 hover:border-blue-200 transition-all cursor-pointer" onClick={() => navigate('/settings')}>
            <div className="w-8 h-8 bg-blue-900 text-white rounded-lg flex items-center justify-center font-black text-sm shadow-lg shadow-blue-200">A</div>
            <div>
              <p className="text-[13px] font-black text-slate-900 leading-none">Admin Panel</p>
              <p className="text-[11px] font-black text-blue-800 uppercase tracking-widest mt-0.5">{settings.location}</p>
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
               <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 border-l-2 border-l-emerald-500">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm"><FaUsers /></div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Customers Served</p>
                    <p className="text-sm font-black text-emerald-700 tabular-nums">{stats.customers} Recorded</p>
                  </div>
               </div>
               <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 border-l-2 border-l-rose-500">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-sm"><FaExclamationTriangle /></div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Low / Sold Out</p>
                    <p className="text-sm font-black text-rose-600 tabular-nums">{stats.soldOut > 0 ? `${stats.soldOut} Sold Out` : `${stats.lowStock} Low Stock`}</p>
                  </div>
               </div>
               <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center text-sm"><FaFilePrescription /></div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pending Scripts</p>
                    <p className="text-sm font-black text-slate-900 tabular-nums">{stats.scripts}</p>
                  </div>
               </div>
            </div>

            {/* Low Stock DRUGS TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
                  <div>
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Stock Replacement</h3>
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Inventory Alert</p>
                  </div>
                  <button onClick={() => navigate('/inventory')} className="text-[11px] font-black text-blue-800 uppercase tracking-widest hover:text-blue-900">Full Audit</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50/50">
                        <tr>
                           <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">Medication</th>
                           <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                           <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">In Vault</th>
                           <th className="px-5 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {loading ? (
                           <tr><td colSpan="4" className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Scanning...</td></tr>
                        ) : lowStockDrugs.length === 0 ? (
                           <tr><td colSpan="4" className="py-10 text-center text-emerald-500 font-black uppercase tracking-widest text-[12px]">All Stocks Secure</td></tr>
                        ) : (
                           lowStockDrugs.map(drug => (
                              <tr key={drug.id} className="hover:bg-slate-50 transition-colors group">
                                 <td className="px-5 py-3">
                                    <p className="text-[13px] font-black text-slate-900 group-hover:text-blue-800 uppercase tracking-tight">{drug.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{drug.generic_name}</p>
                                 </td>
                                 <td className="px-5 py-3">
                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[10px] font-black uppercase">{drug.category_name || drug.category || 'Uncategorized'}</span>
                                 </td>
                                 <td className="px-5 py-3 text-center">
                                    <span className="text-[13px] font-black text-red-600 tabular-nums">{drug.stock}</span>
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
            
            {/* AI Safety Feature Hero Card */}
            <div
              onClick={() => navigate('/clinical-assistant')}
              className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white shadow-lg cursor-pointer hover:scale-[1.02] transition-all border border-indigo-800/40 group relative overflow-hidden"
            >
               <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/20 blur-2xl rounded-full pointer-events-none"></div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">
                        <FaRobot />
                     </div>
                     <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          AI Clinical Safety
                        </span>
                        <h4 className="text-xs font-black text-white uppercase tracking-tight mt-0.5">Drug Safety Check</h4>
                     </div>
                  </div>
                  <FaArrowRight className="text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
               </div>
               <p className="text-[11px] text-slate-300 mt-2 font-medium">
                  Scan drug interactions, dosage warnings, & patient allergy triggers.
               </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-blue-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-blue-900 transition-all shadow-lg" onClick={() => navigate('/pos')}>
                  <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center text-lg mb-2 shadow-sm group-hover:scale-110 transition-transform">
                     <FaPlus />
                  </div>
                  <p className="text-[13px] font-black text-white uppercase tracking-tight">New Sale</p>
               </div>
               <div className="bg-indigo-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-indigo-900 transition-all shadow-lg" onClick={() => navigate('/customers')}>
                  <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center text-lg mb-2 shadow-sm group-hover:scale-110 transition-transform">
                     <FaFilePrescription />
                  </div>
                  <p className="text-[13px] font-black text-white uppercase tracking-tight">Prescribe</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               {modules.slice(1, 5).map(module => (
                  <div 
                     key={module.path} 
                     onClick={() => navigate(module.path)} 
                     className="group bg-white p-3 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center text-center justify-center gap-2"
                  >
                     <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center text-lg group-hover:bg-blue-800 group-hover:text-white transition-all shadow-sm">
                        {module.icon}
                     </div>
                     <h3 className="text-[12px] font-black text-slate-900 group-hover:text-blue-800 transition-colors uppercase tracking-tight">{module.name}</h3>
                  </div>
               ))}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Analytics</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">Accuracy</span>
                     <span className="text-[12px] font-black text-emerald-500">99.2%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 w-[99%] rounded-full"></div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                     <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">Consults</span>
                     <span className="text-[12px] font-black text-indigo-500">24 today</span>
                  </div>
               </div>
            </div>

         </div>

      </div>

    </div>
  );
};

export default PharmacyDashboard;
