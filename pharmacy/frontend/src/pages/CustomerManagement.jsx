import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import customerService from '../services/customerService';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FaSearch, FaPlus, FaUsers, FaUserCheck, FaIdCard, FaFilter, FaDownload, FaChevronRight,
  FaEdit, FaTrash
} from 'react-icons/fa';

const CustomerManagement = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const role = (user?.role || '').toLowerCase();
  const isAdmin = Boolean(user?.isAdmin || ['admin', 'administrator', 'manager', 'director'].some(marker => role.includes(marker)));
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (customer) => {
    const fullName = `${customer.first_name} ${customer.last_name}`.trim();
    if (!window.confirm(`Delete ${fullName}'s customer record? This cannot be undone.`)) return;

    try {
      await customerService.deleteCustomer(customer.id);
      setCustomers(current => current.filter(item => item.id !== customer.id));
      toast.success('Customer record deleted.');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error(error.response?.status === 403 ? 'Only administrators can delete customers.' : 'Could not delete customer.');
    }
  };

  useEffect(() => {
    let active = true;
    const loadCustomers = async () => {
      try {
        const response = await customerService.getCustomers();
        if (active) setCustomers(response.data.results || response.data || []);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadCustomers();
    return () => { active = false; };
  }, []);

  const getInitials = (firstName, lastName) => {
      const first = firstName ? firstName.charAt(0).toUpperCase() : '';
      const last = lastName ? lastName.charAt(0).toUpperCase() : '';
      return `${first}${last}` || '?';
  };

  const exportCustomersCSV = () => {
    if (customers.length === 0) return;
    const headers = ["ID", "Name", "Phone", "DOB", "Address"];
    const rows = customers.map(c => [
        c.id,
        `${c.first_name} ${c.last_name}`,
        c.phone_number,
        c.date_of_birth,
        c.address || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'patient_registry.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 text-sm py-8 px-4 md:px-6 lg:px-8">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase font-outfit">Patient Registry</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Digital Health Records</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-0 w-full sm:w-[400px] bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-50 focus-within:border-emerald-500 transition-all shadow-sm">
              <input 
                type="text" 
                placeholder="Search patient registry..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 pl-4 pr-3 py-2 text-xs font-bold outline-none border-none bg-transparent"
              />
              <button className="w-5 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-emerald-500 border-l border-slate-100 transition-colors shrink-0">
                <FaSearch className="text-sm" />
              </button>
            </div>
            
            <Link to="/customers/new" className="btn-pharmacy px-4 py-2 w-full sm:w-auto text-xs whitespace-nowrap shadow-none border">
               <FaPlus /> New Patient
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-3">
           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                 <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                    <FaUsers />
                 </div>
                 <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>
              </div>
              <div className="mt-2 relative z-10">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Registry</p>
                 <p className="text-sm font-black text-slate-900 tabular-nums">{customers.length}</p>
              </div>
           </div>

           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                    <FaUserCheck />
                 </div>
                 <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Verified</span>
              </div>
              <div className="mt-2 relative z-10">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Recurring</p>
                 <p className="text-sm font-black text-slate-900 tabular-nums">482</p>
              </div>
           </div>

           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                 <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-sm">
                    <FaIdCard />
                 </div>
                 <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-widest">+12% Gain</span>
              </div>
              <div className="mt-2 relative z-10">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">New This Wk</p>
                 <p className="text-sm font-black text-slate-900 tabular-nums">15</p>
              </div>
           </div>
        </section>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
           <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">Access Registry</h2>
              <div className="flex items-center gap-2">
                 <button className="btn-pharmacy text-[10px] px-3 py-1 border shadow-none"><FaFilter /> Refine</button>
                 <button onClick={exportCustomersCSV} className="btn-pharmacy text-[10px] px-3 py-1 border shadow-none hover:bg-emerald-500 hover:text-white transition-all"><FaDownload /> Log</button>
              </div>
           </div>
           
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Patient Name</th>
                  <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Control ID</th>
                  <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Contact Information</th>
                  <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Alerts</th>
                  <th className="px-5 py-3 text-[11px] font-black text-slate-900 uppercase tracking-widest">Date of Birth</th>
                  <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   <tr><td colSpan="6" className="px-5 py-10 text-center text-slate-400 font-bold italic text-[12px]">Decoding...</td></tr>
                ) : (
                  customers.filter(c => (c.first_name + ' ' + c.last_name).toLowerCase().includes(searchTerm.toLowerCase())).map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => navigate(`/customers/detail/${cust.id}`)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-extrabold text-[11px] ring-1 ring-white">
                             {getInitials(cust.first_name, cust.last_name)}
                           </div>
                           <span className="text-[13px] font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{cust.first_name} {cust.last_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-slate-400 text-[11px] tracking-widest">RX-{cust.id.toString().padStart(4, '0')}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[12px] font-bold text-slate-600 tabular-nums">{cust.phone_number}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${cust.address ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-400'}`}>
                          {cust.address ? "ALERT" : "CLEAR"}
                        </span>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-[12px] font-bold text-slate-500">
                        {cust.date_of_birth || "00-00-0000"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/prescriptions/new?patientId=${cust.id}`);
                            }}
                            className="text-[10px] py-1 px-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            PRESCRIBE
                          </button>
                          <button 
                            className="btn-pharmacy text-[10px] py-1 px-2 border shadow-none hover:bg-slate-800 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/customers/detail/${cust.id}`);
                            }}
                          >
                            VIEW <FaChevronRight className="ml-1" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                className="text-[10px] py-1 px-2 border border-blue-100 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white"
                                aria-label={`Edit ${cust.first_name} ${cust.last_name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/customers/${cust.id}/edit`);
                                }}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="text-[10px] py-1 px-2 border border-red-100 rounded-lg text-red-700 bg-red-50 hover:bg-red-600 hover:text-white"
                                aria-label={`Delete ${cust.first_name} ${cust.last_name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(cust);
                                }}
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
           </div>

           <div className="px-5 py-3 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Showing {customers.length} total clinical profiles
              </span>
              <div className="flex items-center gap-1.5">
                 <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all disabled:opacity-30" disabled>‹</button>
                 <button className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-[11px] shadow-lg shadow-emerald-100">1</button>
                 <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all">2</button>
                 <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all">›</button>
              </div>
           </div>
        </div>
    </div>
  );
};

export default CustomerManagement;
