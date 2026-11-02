import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false, allowedRoles = null }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10b981]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || '').toLowerCase();
  const isAdmin = user.isAdmin || role.includes('admin') || role.includes('manager');

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && Array.isArray(allowedRoles) && !isAdmin) {
    const isSalesAttendant = role.includes('cashier') || role.includes('attendant') || (role.includes('sales') && !role.includes('rep'));
    const isSalesRep = role.includes('rep');
    const isPharmacist = role.includes('pharmacist') || role.includes('doctor');
    const isNurse = role.includes('nurse');

    const matches = allowedRoles.some((allowed) => {
      const target = allowed.toLowerCase();
      if (target === 'all') return true;
      if (target === 'sales_attendant' || target === 'cashier') return isSalesAttendant;
      if (target === 'sales_rep') return isSalesRep;
      if (target === 'pharmacist' || target === 'doctor') return isPharmacist;
      if (target === 'nurse') return isNurse;
      return role.includes(target);
    });

    if (!matches) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PrivateRoute;
