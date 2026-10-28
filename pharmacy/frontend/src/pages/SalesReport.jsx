import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  FaSearch, FaBell, FaPlus, FaMoneyBill, FaWallet, FaReceipt, FaShoppingCart,
  FaChevronDown, FaEllipsisV
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const SalesReport = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    daily: 0,
    monthly: 0,
    totalCount: 0,
    avgValue: 0
  });

  useEffect(() => {
    const controller = new AbortController();
    fetchSales(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchSales = async (signal) => {
    try {
      setLoading(true);
      const response = await api.get('sales/', { signal });
      const sales = response.data?.results || response.data || [];
      setSalesData(sales);
      
      const total = sales.reduce((acc, s) => acc + parseFloat(s.total_amount || 0), 0);
      const count = sales.length;
      const today = new Date().toISOString().split('T')[0];
      const daily = sales
        .filter(s => s.created_at?.startsWith(today))
        .reduce((acc, s) => acc + parseFloat(s.total_amount || 0), 0);
      
      setStats({
        daily: daily,
        monthly: total,
        totalCount: count,
        avgValue: count > 0 ? (total / count) : 0
      });
    } catch (error) {
       if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
         console.error("Error fetching sales:", error);
         toast.error("Failed to sync sales audit trail. Check connection.");
       }
    } finally {
       setLoading(false);
    }
  };

  const filteredSales = salesData.filter(sale => {
    const search = searchTerm.toLowerCase();
    const customer = (sale.customer_name || 'Guest').toLowerCase();
    const saleId = (sale.id || '').toString();
    const staff = (sale.staff_name || 'Sys').toLowerCase();
    
    return customer.includes(search) || saleId.includes(search) || staff.includes(search);
  });

  const exportCSV = () => {
    if (filteredSales.length === 0) return;
    
    const headers = ["ID", "Customer", "Staff", "Date", "Value", "Status"];
    const rows = filteredSales.map(sale => [
        sale.id,
        sale.customer_name || 'Guest',
        sale.staff_name || 'Sys',
        new Date(sale.created_at).toLocaleString(),
        sale.total_amount,
        'Paid'
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(e => e.map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sales_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col flex-1 text-sm">
        
        {/* Top Header */}
        <header className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 h-16">
          <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase font-outfit hidden md:block">Sales Reports</h1>
          
          <div className="flex flex-1 items-center justify-end gap-4 ml-6">
            <div className="flex-1 max-w-lg relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input 
                type="text" 
                placeholder="Search audit trail..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-transparent rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none"
              />
            </div>
            
            <FaBell className="text-slate-400 hover:text-emerald-500 cursor-pointer w-4 h-4 transition-colors shrink-0" />
            
            <button onClick={() => navigate('/pos')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-1.5 px-4 rounded-lg flex items-center gap-2 transition-all shadow-none text-[12px] uppercase tracking-widest shrink-0 h-9 border border-emerald-500">
               <FaPlus className="w-3 h-3" /> New Sale
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard view */}
        <main className="flex-1 overflow-y-auto p-5 relative scrollbar-hide">
           
           {/* Metric Cards Grid */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              
              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Today</h3>
                   <div className="bg-emerald-50 text-emerald-500 p-1.5 rounded-lg text-sm">
                      <FaMoneyBill />
                   </div>
                </div>
                 <div className="mt-auto">
                    <p className="text-sm font-black text-slate-900 tabular-nums">₦{stats.daily.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Verified Income</p>
                 </div>
               </div>

               {/* Card 2 */}
               <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col">
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total</h3>
                    <div className="bg-blue-50 text-blue-500 p-1.5 rounded-lg text-sm">
                       <FaWallet />
                    </div>
                 </div>
                 <div className="mt-auto">
                    <p className="text-sm font-black text-slate-900 tabular-nums">₦{stats.monthly.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Gross Revenue</p>
                 </div>
               </div>

               {/* Card 3 */}
               <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col">
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Volume</h3>
                    <div className="bg-orange-50 text-orange-500 p-1.5 rounded-lg text-sm">
                       <FaReceipt />
                    </div>
                 </div>
                 <div className="mt-auto">
                    <p className="text-sm font-black text-slate-900 tabular-nums">{stats.totalCount}</p>
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">Tx Logs</p>
                 </div>
               </div>

               {/* Card 4 */}
               <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col">
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Avg Value</h3>
                    <div className="bg-purple-50 text-purple-500 p-1.5 rounded-lg text-sm">
                       <FaShoppingCart />
                    </div>
                 </div>
                 <div className="mt-auto">
                    <p className="text-sm font-black text-slate-900 tabular-nums">₦{stats.avgValue.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-tighter">Per Receipt</p>
                 </div>
               </div>
           </div>

           {/* Chart Area */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">Revenue Analytics</h2>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">30-day clinical turnover</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-black text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest">
                      Export <FaChevronDown className="w-2 h-2 text-slate-400" />
                    </button>
                 </div>
              </div>

              {/* Minified SVG Graph */}
              <div className="relative w-full h-[180px]">
                <div className="absolute inset-0 flex flex-col justify-between z-0 pb-6 pt-2">
                   {[1,2,3].map((i) => (
                      <div key={i} className="w-full border-t border-slate-50 h-0"></div>
                   ))}
                   <div className="w-full border-t border-slate-100 h-0"></div>
                </div>
                <svg className="absolute inset-0 w-full h-full z-10" preserveAspectRatio="none" viewBox="0 0 1000 200">
                  <defs>
                    <linearGradient id="chartGradientSmall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0,160 C 100,120 200,140 300,150 C 400,160 450,140 500,110 C 580,60 680,60 780,90 C 850,110 920,90 1000,40" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 0,160 C 100,120 200,140 300,150 C 400,160 450,140 500,110 C 580,60 680,60 780,90 C 850,110 920,90 1000,40 L 1000,200 L 0,200 Z" fill="url(#chartGradientSmall)" />
                </svg>
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-black text-slate-400 z-20 px-1 mt-2 tracking-widest">
                   <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>W5</span>
                </div>
              </div>
           </div>

           {/* Table Area */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                 <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">Audit Trail</h2>
                 <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-lg text-[11px] font-black text-slate-500 uppercase tracking-widest cursor-default">
                        Filtered ({filteredSales.length})
                    </button>
                    <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-lg text-[11px] font-black uppercase tracking-widest shadow-none hover:bg-emerald-600 transition-colors">
                        CSV
                    </button>
                 </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/50">
                      <th className="py-3 px-6 text-[11px] font-black text-slate-400 tracking-widest uppercase">ID</th>
                      <th className="py-3 px-6 text-[11px] font-black text-slate-400 tracking-widest uppercase">Customer</th>
                      <th className="py-3 px-6 text-[11px] font-black text-slate-400 tracking-widest uppercase text-center">Staff</th>
                      <th className="py-3 px-6 text-[11px] font-black text-slate-400 tracking-widest uppercase">Date</th>
                      <th className="py-3 px-6 text-[11px] font-black text-slate-400 tracking-widest uppercase text-right">Value</th>
                      <th className="py-3 px-6 text-[11px] font-black text-slate-400 tracking-widest uppercase text-center">Status</th>
                      <th className="py-3 px-6 text-[11px] font-black text-slate-400 tracking-widest uppercase text-right">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                       <tr><td colSpan="7" className="py-10 text-center text-slate-400 font-bold text-[12px] uppercase tracking-widest animate-pulse">Syncing...</td></tr>
                    ) : (
                      filteredSales.map((txn, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-4 px-6 text-[12px] font-black text-slate-500 uppercase tabular-nums">#{txn.id}</td>
                          <td className="py-4 px-6">
                            <span className="font-black text-[13px] text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{txn.customer_name || 'Guest'}</span>
                          </td>
                          <td className="py-4 px-6 text-center text-[12px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[80px]">{txn.staff_name || 'Sys'}</td>
                          <td className="py-4 px-6 text-[12px] font-bold text-slate-400 tabular-nums">{new Date(txn.created_at).toLocaleDateString()}</td>
                          <td className="py-4 px-6 text-right font-black text-[13px] text-emerald-600 tabular-nums">₦{txn.total_amount}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-widest border border-emerald-100 italic">Paid</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button className="text-slate-300 hover:text-emerald-500 transition-all"><FaEllipsisV className="w-3 h-3" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </main>
    </div>
  );
};

export default SalesReport;
