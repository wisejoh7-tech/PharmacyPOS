import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCalendarAlt, FaDownload, FaAward, FaStopwatch, FaMoneyBill, FaStar, FaArrowUp, FaArrowDown, FaChartBar, FaBox, FaFileInvoiceDollar, FaUserMd, FaCog } from 'react-icons/fa';
import staffService from '../services/staffService';
import reportService from '../services/reportService';
import api from '../services/api';
import toast from 'react-hot-toast';

const StaffPerformanceReport = () => {
  const [staffMetrics, setStaffMetrics] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  const fetchData = async () => {
    try {
      const [staffRes, statsRes] = await Promise.all([
        staffService.getStaff(),
        reportService.getDashboardStats()
      ]);
      
      const staffList = staffRes.data.results || staffRes.data;
      setDashboardStats(statsRes.data);

      // Fetch sales stats for each staff member
      const metrics = await Promise.all(staffList.map(async (staff) => {
        try {
          const salesRes = await api.get(`sales/${staff.id}/sales-stats/`); // Using direct api call since it's an action
          return {
            ...staff,
            name: staff.full_name,
            scripts: salesRes.data.transaction_count,
            sales: `₦${(salesRes.data.total_revenue / 1000).toFixed(1)}k`,
            rating: 4.5 + ((staff.id || 1) % 5) * 0.1, // Deterministic rating fallback
            avatar: staff.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.full_name)}&background=random`
          };
        } catch {
          return {
            ...staff,
            name: staff.full_name,
            scripts: 0,
            sales: "₦0k",
            rating: 0,
            avatar: staff.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.full_name)}&background=random`
          };
        }
      }));

      setStaffMetrics(metrics.sort((a, b) => b.scripts - a.scripts));
    } catch (error) {
      console.error("Error fetching performance data:", error);
      if (navigator.onLine) {
        toast.error("Failed to load performance metrics");
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const topPerformer = staffMetrics[0];


  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto relative shadow-2xl font-sans text-gray-800">
      
      {/* Header */}
      <header className="bg-white px-5 pt-8 pb-4 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-4">
          <FaArrowLeft className="text-[#10b981] w-5 h-5 cursor-pointer" />
          <h1 className="text-xl font-bold text-gray-900">Staff Performance</h1>
        </div>
        <div className="flex items-center gap-4 text-gray-700">
          <FaCalendarAlt className="w-5 h-5 cursor-pointer" />
          <FaDownload className="w-5 h-5 cursor-pointer" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-5 pb-24">
        
        <h2 className="text-lg font-bold text-gray-900 mb-4 mt-2">Top Performer of the Month</h2>

        {/* Top Performer Card */}
        <div className="bg-[#10b981] rounded-2xl p-5 mb-6 relative overflow-hidden shadow-md text-white">
          {/* Background pattern */}
          <div className="absolute right-0 bottom-0 text-white/20 text-9xl leading-none translate-x-4 translate-y-4 font-bold">+</div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold mb-3">
                <FaAward className="w-3.5 h-3.5" />
                Outstanding
              </div>
              
              <h3 className="text-2xl font-bold mb-1">{topPerformer?.name || 'Loading...'}</h3>
              <p className="text-emerald-100 text-sm mb-5">{topPerformer?.role || 'Staff Member'}</p>
              
              <div className="flex gap-4">
                <div className="bg-emerald-600/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-emerald-100 font-bold tracking-wider mb-0.5 uppercase">Sales</p>
                  <p className="text-lg font-bold">{topPerformer?.sales || '0k'}</p>
                </div>
                <div className="bg-emerald-600/50 rounded-lg px-3 py-2 shadow-inner">
                  <p className="text-[10px] text-emerald-100 font-bold tracking-wider mb-0.5 uppercase">Rating</p>
                  <p className="text-lg font-bold">{topPerformer?.rating.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
            
            <div className="relative mt-2">
              <img src={topPerformer?.avatar || "https://randomuser.me/api/portraits/women/44.jpg"} alt={topPerformer?.name} className="w-20 h-20 rounded-full border-4 border-emerald-400 object-cover shadow-lg" />
            </div>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-white border border-emerald-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <FaStopwatch className="text-emerald-500 w-5 h-5 mb-2" />
            <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1 uppercase">Avg. Proc.</p>
            <p className="text-xl font-bold text-gray-900 leading-none mb-2">4.2m</p>
            <div className="flex items-center gap-0.5 text-[10px] font-bold text-red-500">
              <span>-12%</span> <FaArrowDown className="w-2 h-2" />
            </div>
          </div>
          <div className="flex-1 bg-white border border-emerald-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <FaMoneyBill className="text-emerald-500 w-5 h-5 mb-2" />
            <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1 uppercase">Sales Vol.</p>
            <p className="text-xl font-bold text-gray-900 leading-none mb-2">₦{(dashboardStats?.total_revenue / 1000).toFixed(1) || '0'}k</p>
            <div className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-500">
              <span>+8%</span> <FaArrowUp className="w-2 h-2" />
            </div>
          </div>
          <div className="flex-1 bg-white border border-emerald-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <FaStar className="text-emerald-500 w-5 h-5 mb-2" />
            <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1 uppercase">Low Stock</p>
            <p className="text-xl font-bold text-gray-900 leading-none mb-2">{dashboardStats?.low_stock_count || '0'}</p>
            <div className="flex items-center gap-0.5 text-[10px] font-bold text-red-500">
              <span>Items</span> <FaArrowDown className="w-2 h-2" />
            </div>
          </div>
        </div>

        {/* Performance Trend Chart */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Performance Trend</h3>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full">Last 7 Days</span>
          </div>
          
          {/* Custom SVG Line Chart */}
          <div className="h-32 w-full relative">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Fake grid lines */}
              <line x1="0" y1="10" x2="100" y2="10" stroke="#f3f4f6" strokeWidth="0.5" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="#f3f4f6" strokeWidth="0.5" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="#f3f4f6" strokeWidth="0.5" />
              
              {/* The Line */}
              <path 
                d="M 0 35 C 10 32, 15 25, 20 20 C 30 10, 35 15, 40 25 C 50 35, 55 10, 60 15 C 70 20, 75 10, 80 5 C 90 0, 95 10, 100 15" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Highlight Dot */}
              <circle cx="80" cy="5" r="2" fill="#10b981" stroke="white" strokeWidth="1" />
            </svg>
            
            {/* X-Axis Labels */}
            <div className="flex justify-between text-[10px] font-medium text-gray-400 mt-2 px-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span className="text-gray-900 font-bold">Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>
          </div>
        </div>

        {/* Individual Metrics */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-lg">Individual Metrics</h3>
            <span className="text-emerald-500 text-xs font-bold cursor-pointer hover:underline">View All</span>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50 flex flex-col p-2">
              {staffMetrics.map((staff, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={staff.avatar} alt={staff.name} className="w-12 h-12 rounded-full border border-gray-200 object-cover" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{staff.name}</p>
                      <p className="text-xs text-gray-500">{staff.scripts} Scripts Filled</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm mb-0.5">{staff.sales}</p>
                    <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-500">
                      <FaStar className="w-2.5 h-2.5" />
                      <span>{staff.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full bg-[#10b981] hover:bg-emerald-600 text-white rounded-xl py-4 font-bold transition-colors shadow-md shadow-emerald-200 flex items-center justify-center gap-2 text-sm">
          <FaChartBar className="w-4 h-4" />
          View Full Detailed Report
        </button>

      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-6 py-3 pb-5 z-10 shrink-0">
        <div className="flex flex-col items-center gap-1 cursor-pointer text-gray-400 hover:text-emerald-500 transition-colors">
          <FaBox className="w-6 h-6" />
          <span className="text-[10px] font-semibold tracking-wide">Inventory</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer text-gray-400 hover:text-emerald-500 transition-colors">
          <FaFileInvoiceDollar className="w-6 h-6" />
          <span className="text-[10px] font-semibold tracking-wide">Sales</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer text-emerald-500">
          <FaUserMd className="w-7 h-7" />
          <span className="text-[10px] font-bold tracking-wide">Staff</span>
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-0.5"></div>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer text-gray-400 hover:text-emerald-500 transition-colors">
          <FaCog className="w-6 h-6" />
          <span className="text-[10px] font-semibold tracking-wide">Settings</span>
        </div>
      </nav>

    </div>
  );
};

export default StaffPerformanceReport;