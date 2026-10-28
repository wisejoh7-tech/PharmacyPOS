import React from 'react';
import { 
  FaArrowLeft, FaPen, FaPhoneAlt, FaExclamationTriangle, 
  FaBriefcaseMedical, FaFilePrescription, FaShoppingCart, FaHistory 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CustomerDetail = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 max-w-xl mx-auto relative font-outfit text-slate-900 shadow-2xl overflow-y-auto animate-in fade-in duration-500 pb-24 text-sm">
      
      {/* 1. Header */}
      <header className="px-5 py-4 flex items-center justify-between bg-white border-b border-slate-100 z-10 sticky top-0 shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 bg-slate-50 text-slate-400 hover:text-emerald-500 rounded-lg flex items-center justify-center transition-all">
          <FaArrowLeft />
        </button>
        <h1 className="text-sm font-black uppercase tracking-tight">Patient Dossier</h1>
        <button className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
          <FaPen />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-6 space-y-8">
         
         {/* 2. Profile Section */}
         <div className="flex flex-col items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-lg">
              <span className="text-2xl font-black tracking-tighter">JD</span>
            </div>
            
            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">John Doe</h2>
            
            <div className="flex items-center gap-1.5 text-slate-400 font-bold mt-2">
               <FaPhoneAlt className="w-2.5 h-2.5" />
               <span className="text-[12px]">+1 555-0123</span>
            </div>
            
            <div className="mt-4 bg-slate-100 text-slate-500 font-black text-[10px] px-3 py-1.5 rounded-full tracking-widest uppercase border border-slate-200">
               ID: PHARM-8821
            </div>
         </div>

         {/* 3. Clinical Alerts Section */}
         <div className="space-y-3">
           <h3 className="text-[10px] font-black tracking-[0.2em] text-emerald-500 uppercase">Clinical Admonitions</h3>
           <div className="grid grid-cols-2 gap-3">
             
             {/* Alert 1 */}
             <div className="bg-white p-3 rounded-2xl border border-red-50 flex gap-3 items-center shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <FaExclamationTriangle className="text-sm" />
                </div>
                <div>
                  <h4 className="font-black text-red-600 text-[12px] uppercase tracking-tight leading-none">Penicillin</h4>
                  <p className="text-[7px] font-bold text-red-400 uppercase tracking-widest mt-1">Critical</p>
                </div>
             </div>

             {/* Alert 2 */}
             <div className="bg-white p-3 rounded-2xl border border-blue-50 flex gap-3 items-center shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <FaBriefcaseMedical className="text-sm" />
                </div>
                <div>
                  <h4 className="font-black text-blue-600 text-[12px] uppercase tracking-tight leading-none">Diabetes</h4>
                  <p className="text-[7px] font-bold text-blue-400 uppercase tracking-widest mt-1">Ongoing</p>
                </div>
             </div>
           </div>
         </div>

         {/* 4. Purchase History - TABLE VIEW */}
         <div className="space-y-3">
            <div className="flex justify-between items-center">
               <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Dispensary History</h3>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                     <tr>
                        <th className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Invoice</th>
                        <th className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Medications</th>
                        <th className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">Value</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     <tr className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-5 py-4">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Oct 24, 2023</p>
                           <p className="text-[12px] font-black text-slate-900 group-hover:text-emerald-600">ORD-7742</p>
                        </td>
                        <td className="px-5 py-4">
                           <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-bold text-slate-700 uppercase">Amoxicillin 500mg</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase italic">Syringes (x10)</span>
                           </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <span className="text-[13px] font-black text-emerald-600 tabular-nums">₦42.50</span>
                        </td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </div>

      </main>

      {/* 5. Bottom Actions Navbar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white/90 backdrop-blur-sm border-t border-slate-100 p-4 flex gap-3 z-20">
         <button className="flex-1 py-3 rounded-xl border border-emerald-100 text-emerald-500 text-[12px] font-black tracking-widest uppercase hover:bg-emerald-50 transition-all">
            E-Scripts
         </button>
         <button onClick={() => navigate('/pos')} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-[12px] font-black tracking-widest uppercase shadow-none border border-emerald-500">
            New Sale
         </button>
      </div>

    </div>
  );
};

export default CustomerDetail;
