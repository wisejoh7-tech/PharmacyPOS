import React from 'react';
import { 
  FaSearch, FaBell, FaPlusSquare, FaArrowUp, FaArrowDown, 
  FaUserPlus, FaCheckCircle, FaExclamationTriangle, FaExclamationCircle,
  FaFileInvoiceDollar, FaThLarge, FaCashRegister, FaBox, FaChartBar
} from 'react-icons/fa';
import { MdOutlineLocalPharmacy, MdMedicalServices, MdHealthAndSafety } from 'react-icons/md';

const PharmacyOverview = () => {
  return (
    <div className="flex flex-col flex-1">
      {/* Main Content Area (Scrollable) */}
      <main className="py-2">
         
         {/* 2. Top KPI Cards Grid */}
         <div className="grid grid-cols-2 gap-4 mb-8">
            
            {/* Total Sales Card */}
            <div className="bg-[#ecfdf5] border border-[#d1fae5] rounded-2xl p-4 shadow-sm">
               <span className="block text-[11px] font-bold text-[#475569] tracking-widest uppercase mb-2">TOTAL SALES</span>
               <p className="text-[22px] font-black text-[#0f172a] mb-2">₦1,240.50</p>
               <div className="flex items-center gap-1.5 text-[#10b981] text-[12px] font-extrabold">
                  <span className="text-[14px]">↗</span> +12.5%
               </div>
            </div>

            {/* Orders Card */}
            <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-2xl p-4 shadow-sm">
               <span className="block text-[11px] font-bold text-[#475569] tracking-widest uppercase mb-2">ORDERS</span>
               <p className="text-[22px] font-black text-[#0f172a] mb-2">42</p>
               <div className="flex items-center gap-1.5 text-[#ef4444] text-[12px] font-extrabold">
                  <span className="text-[14px]">↘</span> -5%
               </div>
            </div>

            {/* Customers Card */}
            <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-2xl p-4 shadow-sm">
               <span className="block text-[11px] font-bold text-[#475569] tracking-widest uppercase mb-2">CUSTOMERS</span>
               <p className="text-[22px] font-black text-[#0f172a] mb-2">18</p>
               <div className="flex items-center gap-1.5 text-[#10b981] text-[12px] font-extrabold">
                  <FaUserPlus className="w-3.5 h-3.5" /> New
               </div>
            </div>

            {/* Prescriptions Card */}
            <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-2xl p-4 shadow-sm">
               <span className="block text-[11px] font-bold text-[#475569] tracking-widest uppercase mb-2">PRESCRIPTIONS</span>
               <p className="text-[22px] font-black text-[#0f172a] mb-2">29</p>
               <div className="flex items-center gap-1.5 text-[#10b981] text-[12px] font-extrabold">
                  <FaCheckCircle className="w-3.5 h-3.5" /> Active
               </div>
            </div>

         </div>

         {/* 3. Low Stock Alerts Section */}
         <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-[18px] font-black tracking-tight text-[#0f172a]">Low Stock Alerts</h3>
               <span className="bg-[#fee2e2] text-[#ef4444] px-2.5 py-1 text-[11px] font-bold rounded-md">Action Required</span>
            </div>
            
            <div className="space-y-3">
               
               {/* Alert Item 1 */}
               <div className="bg-white border border-[#f1f5f9] rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#fee2e2] rounded-xl flex items-center justify-center shrink-0">
                        <FaExclamationTriangle className="text-[#ef4444] w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-black text-[#0f172a] text-[14px] leading-tight mb-1">Paracetamol 500mg</h4>
                        <p className="text-[13px] text-[#64748b] font-medium leading-none">Only 5 units left in stock</p>
                     </div>
                  </div>
                  <button className="bg-[#10b981] text-white text-[13px] font-bold px-4 py-2 rounded-lg ml-2 shrink-0 shadow-sm hover:bg-[#059669] transition-colors">
                     Restock
                  </button>
               </div>

               {/* Alert Item 2 */}
               <div className="bg-white border border-[#f1f5f9] rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#ffedd5] rounded-xl flex items-center justify-center shrink-0">
                        <FaExclamationCircle className="text-[#f97316] w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-black text-[#0f172a] text-[14px] leading-tight mb-1">Amoxicillin 250mg</h4>
                        <p className="text-[13px] text-[#64748b] font-medium leading-none">Only 8 units left in stock</p>
                     </div>
                  </div>
                  <button className="bg-[#10b981] text-white text-[13px] font-bold px-4 py-2 rounded-lg ml-2 shrink-0 shadow-sm hover:bg-[#059669] transition-colors">
                     Restock
                  </button>
               </div>

            </div>
         </div>

         {/* 4. Top Categories Horizontal Scroll Section */}
         <div className="mb-8">
            <h3 className="text-[18px] font-black tracking-tight text-[#0f172a] mb-4">Top Categories</h3>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
               
               {/* Category 1 */}
               <div className="bg-white border border-[#f1f5f9] rounded-2xl p-5 min-w-[140px] shadow-sm shrink-0 flex flex-col items-start text-left">
                  <div className="w-10 h-10 bg-[#eff6ff] rounded-full flex items-center justify-center mb-4">
                     <MdOutlineLocalPharmacy className="text-[#3b82f6] w-5 h-5" />
                  </div>
                  <h4 className="font-black text-[#0f172a] text-[14px] mb-1">Pain Relief</h4>
                  <p className="text-[12px] font-medium text-[#64748b]">45% of sales</p>
               </div>

               {/* Category 2 */}
               <div className="bg-white border border-[#f1f5f9] rounded-2xl p-5 min-w-[140px] shadow-sm shrink-0 flex flex-col items-start text-left">
                  <div className="w-10 h-10 bg-[#faf5ff] rounded-full flex items-center justify-center mb-4 relative overflow-hidden">
                     {/* The text zooming into the background from the mockup */}
                     <span className="absolute -right-4 -top-2 text-[32px] font-bold text-[#f59e0b] opacity-80 z-0 select-none hidden">ZOOM_EN</span>
                     <MdMedicalServices className="text-[#a855f7] w-5 h-5 relative z-10" />
                  </div>
                  <h4 className="font-black text-[#0f172a] text-[14px] mb-1">Antibiotics</h4>
                  <p className="text-[12px] font-medium text-[#64748b]">32% of sales</p>
               </div>

               {/* Category 3 */}
               <div className="bg-white border border-[#f1f5f9] rounded-2xl p-5 min-w-[140px] shadow-sm shrink-0 flex flex-col items-start text-left">
                  <div className="w-10 h-10 bg-[#fefce8] rounded-full flex items-center justify-center mb-4">
                     <MdHealthAndSafety className="text-[#eab308] w-5 h-5" />
                  </div>
                  <h4 className="font-black text-[#0f172a] text-[14px] mb-1">Vitamins</h4>
                  <p className="text-[12px] font-medium text-[#64748b]">18% of sales</p>
               </div>
               
            </div>
         </div>

         {/* 5. Recent Transactions Section */}
         <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-[18px] font-black tracking-tight text-[#0f172a]">Recent Transactions</h3>
               <button className="text-[13px] font-bold text-[#10b981] hover:text-[#059669] transition-colors">View All</button>
            </div>
            
            <div className="space-y-4">
               
               {/* Transaction 1 */}
               <div className="bg-white border border-[#f1f5f9] rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#f8fafc] rounded-full flex items-center justify-center shrink-0 text-[#64748b]">
                        <FaFileInvoiceDollar className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-extrabold text-[#0f172a] text-[14px] leading-tight mb-1">TXN-9042</h4>
                        <p className="text-[12px] text-[#64748b] font-medium leading-none">2 mins ago • Card Payment</p>
                     </div>
                  </div>
                  <span className="font-black text-[#0f172a] text-[16px]">₦45.00</span>
               </div>

               {/* Transaction 2 */}
               <div className="bg-white border border-[#f1f5f9] rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#f8fafc] rounded-full flex items-center justify-center shrink-0 text-[#475569]">
                        <FaFileInvoiceDollar className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-extrabold text-[#0f172a] text-[14px] leading-tight mb-1">TXN-9041</h4>
                        <p className="text-[12px] text-[#64748b] font-medium leading-none">15 mins ago • Cash</p>
                     </div>
                  </div>
                  <span className="font-black text-[#0f172a] text-[16px]">₦12.50</span>
               </div>

               {/* Transaction 3 */}
               <div className="bg-white border border-[#f1f5f9] rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#f8fafc] rounded-full flex items-center justify-center shrink-0 text-[#475569]">
                        <FaFileInvoiceDollar className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-extrabold text-[#0f172a] text-[14px] leading-tight mb-1">TXN-9040</h4>
                        <p className="text-[12px] text-[#64748b] font-medium leading-none">1 hour ago • Card Payment</p>
                     </div>
                  </div>
                  <span className="font-black text-[#0f172a] text-[16px]">₦128.90</span>
               </div>

            </div>
         </div>

      </main>
    </div>
  );
};

export default PharmacyOverview;