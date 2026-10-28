import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import settingsService from '../services/settingsService';
import PharmacyLogo from './PharmacyLogo';
import {
  FaThLarge, FaCashRegister, FaBox,
  FaBriefcaseMedical, FaHospital,
  FaChartLine, FaUsers, FaCog,
  FaShoppingCart, FaSignOutAlt, FaTimes,
  FaUserPlus, FaArrowLeft, FaMoneyBill,
  FaFlask, FaGraduationCap, FaFolder
} from 'react-icons/fa';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [shopName, setShopName] = useState('pharmacylogo');

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await settingsService.getSettings();
        if (res.data && res.data.length > 0) {
          setShopName(res.data[0].shop_name);
        }
      } catch {
        console.error("Branding load failed");
      }
    };
    fetchBranding();
  }, []);

  const role = (user?.role || 'Admin').toLowerCase();
  const isAdmin = user?.isAdmin || role.includes('admin') || role.includes('manager');
  const isPharmacist = role.includes('pharmacist') || role.includes('doctor');
  const isCashier = role.includes('cashier') || role.includes('sales');

  const navCategories = [
    {
      title: 'CORE',
      items: [
        { name: 'Dashboard', icon: <FaThLarge />, path: '/', roles: ['all'] },
      ]
    },
    {
      title: 'POS & SALES',
      items: [
        { name: 'POS Terminal', icon: <FaCashRegister />, path: '/pos', badge: 'Pharmacy Rx ', roles: ['admin', 'pharmacist', 'cashier', 'all'] },
        { name: 'Retail POS', icon: <FaShoppingCart />, path: '/supermarket/pos', badge: 'Supermarket', roles: ['admin', 'cashier', 'all'] },
      ]
    },
    {
      title: 'INVENTORY & RX',
      items: [
        { name: 'Pharmacy Stock', icon: <FaBox />, path: '/inventory', roles: ['admin', 'pharmacist', 'cashier', 'all'] },
        { name: 'Supermarket Hub', icon: <FaShoppingCart />, path: '/supermarket', roles: ['admin', 'cashier', 'all'] },
        { name: 'Categories', icon: <FaFolder />, path: '/categories', roles: ['admin', 'pharmacist', 'cashier', 'all'] },
        { name: 'Prescriptions', icon: <FaBriefcaseMedical />, path: '/prescriptions/review', roles: ['admin', 'pharmacist', 'all'] },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Patients & Clients', icon: <FaUsers />, path: '/customers', roles: ['admin', 'pharmacist', 'cashier', 'all'] },
        { name: 'Staff List', icon: <FaUsers />, path: '/staff', roles: ['admin'] },
        { name: 'Staff Registration', icon: <FaUserPlus />, path: '/staff/new', roles: ['admin'] },
        { name: 'Staff Dashboards', icon: <FaChartLine />, path: '/staff/dashboards', roles: ['admin', 'pharmacist'] },
      ]
    },
    {
      title: 'FINANCIALS & AUDIT',
      items: [
        { name: 'Sales Reports', icon: <FaChartLine />, path: '/reports/sales', roles: ['admin', 'pharmacist'] },
        { name: 'Expenses', icon: <FaMoneyBill />, path: '/expenses', roles: ['admin'] },
        { name: 'Financial Overview', icon: <FaChartLine />, path: '/financials', roles: ['admin'] },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Settings', icon: <FaCog />, path: '/settings', roles: ['admin'] },
      ]
    }
  ];

  const filterItem = (item) => {
    if (isAdmin) return true;
    if (isPharmacist && (item.roles.includes('pharmacist') || item.roles.includes('all'))) return true;
    if (isCashier && (item.roles.includes('cashier') || item.roles.includes('all'))) return true;
    return item.roles.includes('all');
  };

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col h-screen max-h-screen shrink-0 shadow-2xl z-40 transition-transform duration-300 ease-in-out border-r border-slate-800 overflow-hidden
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-5 flex items-center justify-between border-b border-slate-800 bg-slate-950/50 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center justify-center text-sm border border-slate-800"
            title="Go Back"
          >
            <FaArrowLeft />
          </button>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-lg shadow-sky-500/20 shrink-0 border border-sky-100">
            <PharmacyLogo className="w-8 h-8 object-contain" />
          </div>
          <div className="leading-tight">
            <span className="text-base font-black font-outfit tracking-tight block text-white truncate max-w-[120px]">
              {shopName}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Rx Production</span>
          </div>
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
        >
          <FaTimes className="text-lg" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 sidebar-scroll">
        {navCategories.map((cat, idx) => {
          const visibleItems = cat.items.filter(filterItem);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                {cat.title}
              </span>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all ${isActive
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 font-black'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="p-4 shrink-0 space-y-3 border-t border-slate-800 bg-slate-950/40">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-bold text-white/90 hover:bg-white/10 hover:text-white transition-all bg-emerald-700/50"
        >
          <FaSignOutAlt className="text-base" />
          <span>Logout</span>
        </button>

        <div className="bg-white/10 rounded-xl p-4 border border-white/5 space-y-1">
          <span className="block text-[10px] font-black uppercase tracking-widest text-white/60">Active Profile</span>
          <p className="text-xs font-black truncate">{user?.fullName || user?.username || 'User'}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-white uppercase tracking-wider">
              {user?.role || 'Staff'}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[10px] font-bold">Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
