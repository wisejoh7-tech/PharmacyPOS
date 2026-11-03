import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaThLarge, FaCashRegister, FaBox, FaBriefcaseMedical, FaBars, FaUsers, FaShoppingCart } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const MobileBottomNav = ({ onToggleSidebar }) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const role = (user?.role || 'Admin').toLowerCase();
  const isAdmin = user?.isAdmin || role.includes('admin') || role.includes('manager');
  const isSalesAttendant = role.includes('cashier') || role.includes('attendant') || (role.includes('sales') && !role.includes('rep'));
  const isSalesRep = role.includes('rep');
  const isPharmacist = role.includes('pharmacist') || role.includes('doctor');
  const isNurse = role.includes('nurse');

  let navItems = [{ name: 'Home', path: '/', icon: <FaThLarge /> }];

  if (isAdmin) {
    navItems = [
      { name: 'Home', path: '/', icon: <FaThLarge /> },
      { name: 'POS', path: '/pos', icon: <FaCashRegister /> },
      { name: 'Stock', path: '/inventory', icon: <FaBox /> },
      { name: 'Rx', path: '/prescriptions/review', icon: <FaBriefcaseMedical /> },
    ];
  } else if (isSalesAttendant) {
    navItems = [
      { name: 'Home', path: '/', icon: <FaThLarge /> },
      { name: 'POS', path: '/pos', icon: <FaCashRegister /> },
      { name: 'Retail POS', path: '/supermarket/pos', icon: <FaShoppingCart /> },
    ];
  } else if (isSalesRep) {
    navItems = [
      { name: 'Home', path: '/', icon: <FaThLarge /> },
      { name: 'Stock', path: '/inventory', icon: <FaBox /> },
      { name: 'POS', path: '/pos', icon: <FaCashRegister /> },
      { name: 'Retail POS', path: '/supermarket/pos', icon: <FaShoppingCart /> },
    ];
  } else if (isPharmacist) {
    navItems = [
      { name: 'Home', path: '/', icon: <FaThLarge /> },
      { name: 'Patients', path: '/customers', icon: <FaUsers /> },
      { name: 'Rx', path: '/prescriptions/review', icon: <FaBriefcaseMedical /> },
    ];
  } else if (isNurse) {
    navItems = [
      { name: 'Home', path: '/', icon: <FaThLarge /> },
      { name: 'Patients', path: '/customers', icon: <FaUsers /> },
      { name: 'Rx Care', path: '/prescriptions/review', icon: <FaBriefcaseMedical /> },
    ];
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40 px-2 py-1.5 shadow-2xl backdrop-blur-md bg-slate-900/95 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-400 font-black scale-105 bg-slate-800/80'
                  : 'text-slate-400 hover:text-slate-200 font-semibold'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
            </NavLink>
          );
        })}

        {/* Sidebar Menu Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all font-semibold"
        >
          <span className="text-lg"><FaBars /></span>
          <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
