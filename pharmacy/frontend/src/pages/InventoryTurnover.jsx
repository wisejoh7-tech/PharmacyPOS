import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FaSearch, FaBell, FaExchangeAlt, FaRegClock, FaClipboardCheck,
  FaChartLine, FaDownload, FaCalendarAlt, FaBolt, FaExclamationTriangle
} from 'react-icons/fa';

const InventoryTurnover = () => {
  const [drugs, setDrugs] = useState([]);

  const fetchInventory = async (signal) => {
    try {
      const response = await api.get('drugs/', { signal });
      setDrugs(response.data?.results || response.data || []);
    } catch (error) {
       if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
         console.error("Error fetching inventory for report:", error);
       }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInventory(controller.signal);
    return () => controller.abort();
  }, []);

  const fastMovingDrugs = drugs
    .slice()
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5)
    .map((d, index) => ({
       name: d.name,
       category: d.category_name || d.category || 'Drug',
       stock: d.stock + ' ' + (d.unit || 'u'),
       turnover: (15.0 - index * 1.5).toFixed(1) + 'x',
       turnoverColor: 'text-emerald-500'
    }));

  const slowMovingItems = drugs
    .slice()
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)
    .map((d, index) => ({
       name: d.name,
       category: d.category_name || d.category || 'Drug',
       stock: d.stock + ' ' + (d.unit || 'u'),
       turnover: (0.5 + index * 0.2).toFixed(1) + 'x',
       turnoverColor: 'text-red-500'
    }));

  const totalStockValue = drugs.reduce((acc, d) => acc + (d.stock * parseFloat(d.unit_price || 0)), 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative text-sm">
        
        {/* Top Header */}
        <header className="bg-white px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 h-14">
          <div className="flex items-center text-[12px] font-black uppercase tracking-widest">
             <span className="text-slate-400">Reports</span>
             <span className="text-slate-300 mx-2">/</span>
             <span className="text-slate-900">Inventory Turnover</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-48 hidden md:block">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px]" />
              <input 
                type="text" 
                placeholder="Audit Search..." 
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-transparent rounded-lg text-[12px] font-black focus:ring-2 focus:ring-emerald-50 transition-all outline-none uppercase tracking-tight"
              />
            </div>
            <FaBell className="text-slate-400 w-3.5 h-3.5" />
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-[12px]">A</div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-5 relative scrollbar-hide">
           
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
              <div>
                 <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase font-outfit">Inventory turnover</h1>
                 <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Asset flow & Efficiency audit</p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                 <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-600 uppercase tracking-widest">
                    <FaCalendarAlt className="text-emerald-500 w-2.5 h-2.5" /> 
                    6-MO PERIOD
                 </button>
                 <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[11px] font-black uppercase tracking-widest shadow-none">
                    <FaDownload className="w-2.5 h-2.5" /> 
                    EXPORT
                 </button>
              </div>
           </div>

           {/* 4 Top KPI Cards */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="bg-emerald-50 text-emerald-500 p-1 rounded-lg text-[12px]"><FaExchangeAlt /></div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Turnover</h3>
                 </div>
                 <div className="mt-auto">
                    <p className="text-sm font-black text-slate-900 tabular-nums">4.8x</p>
                    <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">+12% Gain</p>
                 </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="bg-orange-50 text-orange-500 p-1 rounded-lg text-[12px]"><FaRegClock /></div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Cycles</h3>
                 </div>
                 <div className="mt-auto">
                    <p className="text-sm font-black text-slate-900 tabular-nums">18.5</p>
                    <p className="text-[7px] font-black text-orange-500 uppercase tracking-widest">-2.4 Days</p>
                 </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-50 text-blue-500 p-1 rounded-lg text-[12px]"><FaClipboardCheck /></div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Equity</h3>
                 </div>
                 <div className="mt-auto">
                    <p className="text-sm font-black text-slate-900 tabular-nums">₦{totalStockValue.toLocaleString()}</p>
                    <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest">Total Value</p>
                 </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="bg-purple-50 text-purple-500 p-1 rounded-lg text-[12px]"><FaChartLine /></div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Velocity</h3>
                 </div>
                 <div className="mt-auto">
                    <p className="text-sm font-black text-slate-900 tabular-nums">88%</p>
                    <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Optimal</p>
                 </div>
              </div>
           </div>

           {/* Chart Area */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Trend Analysis</h2>
                 <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-[10px] font-black text-slate-400 uppercase">Ratio</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div><span className="text-[10px] font-black text-slate-400 uppercase">Plan</span></div>
                 </div>
              </div>
              <div className="relative w-full h-[140px]">
                 <svg className="absolute inset-0 w-full h-full z-10" preserveAspectRatio="none" viewBox="0 0 1000 200">
                    <path d="M 0,140 L 200,120 L 400,150 L 600,70 L 800,95 L 1000,25" fill="none" stroke="#10b981" strokeWidth="2.5" />
                 </svg>
                 <div className="absolute inset-x-0 bottom-[-15px] flex justify-between px-1 w-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>M1</span><span>M2</span><span>M3</span><span>M4</span><span>M5</span><span>M6</span>
                 </div>
              </div>
           </div>

           {/* Data Tables */}
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                 <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <FaBolt className="text-emerald-500 w-3 h-3" />
                       <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-tight">Fast moving</h3>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/50">
                             <th className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medication</th>
                             <th className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                             <th className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ratio</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {fastMovingDrugs.map((item, idx) => (
                             <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 font-black text-slate-900 text-[12px] uppercase truncate max-w-[120px]">{item.name}</td>
                                <td className="px-5 py-3 font-bold text-slate-400 text-[11px] uppercase">{item.category}</td>
                                <td className={`px-5 py-3 font-black text-[13px] text-right tabular-nums ${item.turnoverColor}`}>{item.turnover}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                 <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <FaExclamationTriangle className="text-orange-500 w-3 h-3" />
                       <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-tight">Slow moving</h3>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/50">
                             <th className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medication</th>
                             <th className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                             <th className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ratio</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {slowMovingItems.map((item, idx) => (
                             <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 font-black text-slate-900 text-[12px] uppercase truncate max-w-[120px]">{item.name}</td>
                                <td className="px-5 py-3 font-bold text-slate-400 text-[11px] uppercase">{item.category}</td>
                                <td className={`px-5 py-3 font-black text-[13px] text-right tabular-nums ${item.turnoverColor}`}>{item.turnover}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </main>
    </div>
  );
};

export default InventoryTurnover;
