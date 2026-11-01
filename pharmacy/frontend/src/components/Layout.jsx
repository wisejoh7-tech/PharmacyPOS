import React, { useState, useEffect, useContext } from 'react';
import Sidebar from './Sidebar';
import TabBar from './TabBar';
import MobileBottomNav from './MobileBottomNav';
import { FaBars, FaArrowLeft, FaMobileAlt, FaDesktop, FaGlobe } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';

import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { getPlatformLabel, getPlatformType } from '../services/platform';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiConnected, setApiConnected] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const platformType = getPlatformType();
  const platformLabel = getPlatformLabel();

  // Check API Connection status on mount and periodically
  useEffect(() => {
    let isMounted = true;
    const checkApi = async () => {
      try {
        await api.get('health-check/', { timeout: 4000 });
        if (isMounted) setApiConnected(true);
      } catch {
        if (isMounted) setApiConnected(false);
      }
    };

    checkApi();
    const interval = setInterval(checkApi, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Global Back arrow key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Map route to friendly title
  const getPageTitle = (path) => {
    if (path === '/') return 'Newlight Health Medicine and Dashboard';
    if (path.startsWith('/pos')) return 'POS Terminal';
    if (path.startsWith('/supermarket/pos')) return 'Retail POS';
    if (path.startsWith('/supermarket')) return 'Supermarket Hub';
    if (path.startsWith('/inventory')) return 'Inventory Management';
    if (path.startsWith('/customers')) return 'Patients & Customers';
    if (path.startsWith('/reports')) return 'Sales & Audit Reports';
    if (path.startsWith('/staff')) return 'Staff Administration';
    if (path.startsWith('/expenses')) return 'Expense Tracker';
    if (path.startsWith('/financials')) return 'Financial Overview';
    if (path.startsWith('/settings')) return 'System Settings';
    if (path.startsWith('/prescriptions')) return 'Prescription Center';
    return 'Pharmacy Management System';
  };

  const renderPlatformIcon = () => {
    if (platformType === 'desktop') return <FaDesktop className="text-xs" />;
    if (platformType === 'mobile_native' || platformType === 'mobile_web') return <FaMobileAlt className="text-xs" />;
    return <FaGlobe className="text-xs" />;
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-base font-sans">
      {/* Sidebar with mobile state */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main
        className="flex-1 flex flex-col min-w-0 bg-slate-50 bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage: "linear-gradient(180deg, rgba(248, 250, 252, 0.93), rgba(241, 245, 249, 0.95)), url('https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1920&q=80')"
        }}
      >
        {/* Production Topbar Header */}
        <header className="bg-white border-b border-slate-200 px-4 py-2.5 md:px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-700 transition-colors"
            >
              <FaBars className="text-lg" />
            </button>
            <button
              onClick={() => navigate(-1)}
              className="hidden sm:flex p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors text-sm border border-slate-200"
              title="Go Back"
            >
              <FaArrowLeft />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-black font-outfit text-slate-900 tracking-tight leading-none">
                  {getPageTitle(location.pathname)}
                </h1>
                {/* Platform Badge */}
                <span className="hidden sm:inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {renderPlatformIcon()}
                  <span>{platformLabel}</span>
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                {location.pathname}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time System API Health Badge */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black border transition-all ${
              apiConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline uppercase tracking-wider">{apiConnected ? 'Online' : 'Connecting...'}</span>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 bg-slate-100/80 px-3 py-1 rounded-xl border border-slate-200/80">
              <div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-xs">
                {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
              </div>
              <div className="hidden md:block leading-tight text-left">
                <p className="text-[12px] font-black text-slate-900 truncate max-w-[110px]">
                  {user?.fullName || user?.username || 'User'}
                </p>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                  {user?.role || 'Staff'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace TabBar */}
        <TabBar />

        {/* Workspace Content View */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-16 lg:pb-0">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav onToggleSidebar={() => setIsSidebarOpen(true)} />
      </main>
    </div>
  );
};

export default Layout;
