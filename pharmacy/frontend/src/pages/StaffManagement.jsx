import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import staffService from '../services/staffService';
import {
  FaPlus, FaSearch, FaEye, FaPen, FaTrash, FaCalendarAlt, FaCheckCircle, FaUserShield, FaTimes
} from 'react-icons/fa';

const StaffManagement = () => {
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchStaff(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchStaff = async (signal) => {
    try {
      const response = await staffService.getStaff({ signal });
      setStaffData(Array.isArray(response.data) ? response.data : (response.data?.results || []));
    } catch (error) {
       if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
         console.error("Error fetching staff:", error);
       }
    } finally {
       setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role?.toUpperCase()) {
      case 'PHARMACIST': return 'bg-emerald-50 text-emerald-600';
      case 'TECHNICIAN': return 'bg-blue-50 text-blue-600';
      case 'ADMIN': return 'bg-indigo-50 text-indigo-600';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const handleDelete = async (staffMember) => {
    const staffName = staffMember.full_name || staffMember.name || 'this staff member';
    if (window.confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone.`)) {
      try {
        await staffService.deleteStaff(staffMember.id);
        toast.success(`Staff member "${staffName}" deleted successfully.`);
        setStaffData(prev => prev.filter(s => s.id !== staffMember.id));
      } catch (error) {
        console.error("Failed to delete staff:", error);
        toast.error("Failed to delete staff member.");
      }
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-sm">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase font-outfit">Staff Directory</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Clinical access management</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-[500px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input 
                type="text" 
                placeholder="Search staff members..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none"
              />
            </div>
            
            <button 
              onClick={() => navigate('/staff/new')}
              className="btn-pharmacy px-4 py-2 w-full sm:w-auto text-xs whitespace-nowrap border shadow-none"
            >
              <FaPlus /> New Registry
            </button>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
               <FaCheckCircle />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Active</p>
              <p className="text-sm font-black text-slate-900">{staffData.length}</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-sm">
               <FaCalendarAlt />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Attendance</p>
              <p className="text-sm font-black text-slate-900">8</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
               <FaUserShield />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Clinicians</p>
              <p className="text-sm font-black text-slate-900">12</p>
            </div>
          </div>
        </section>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Medical Professional</th>
                  <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Dept</th>
                  <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   <tr><td colSpan="5" className="px-5 py-10 text-center text-slate-400 font-bold text-[12px]">Scanning credentials...</td></tr>
                ) : (
                  staffData.filter(s => (s.name || s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img src={staff.photo || 'https://via.placeholder.com/150'} alt="" className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-100" />
                          <div>
                            <p className="text-[12px] font-black text-slate-900 group-hover:text-emerald-600 uppercase tracking-tight">{staff.full_name || staff.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 lowercase">{staff.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${getRoleBadge(staff.role)}`}>
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-[12px] font-bold text-slate-600 uppercase">
                        {staff.department || 'Clinical'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">
                           <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                           <span className="text-[10px] font-black uppercase">Verified</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5 text-slate-400">
                          <button
                            onClick={() => setSelectedStaff(staff)}
                            title="View Staff Details"
                            className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all"
                          >
                            <FaEye className="text-sm" />
                          </button>
                          <button
                            onClick={() => navigate(`/staff/edit/${staff.id}`)}
                            title="Edit Personal Info"
                            className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all"
                          >
                            <FaPen className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleDelete(staff)}
                            title="Delete Staff Member"
                            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
           </div>
        </div>

        {/* View Staff Modal */}
        {selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4 relative">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-wider">Staff Details</h3>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex flex-col items-center gap-3 py-2">
                <img
                  src={selectedStaff.photo || 'https://via.placeholder.com/150'}
                  alt={selectedStaff.full_name || selectedStaff.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
                />
                <div className="text-center">
                  <h4 className="font-black text-slate-900 text-base">{selectedStaff.full_name || selectedStaff.name}</h4>
                  <p className="text-xs font-bold text-slate-400">{selectedStaff.email}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Employee ID</span>
                  <span className="font-black text-slate-800 font-mono">{selectedStaff.employee_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Role</span>
                  <span className="font-black text-slate-800">{selectedStaff.role || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Department</span>
                  <span className="font-black text-slate-800">{selectedStaff.department || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Phone</span>
                  <span className="font-black text-slate-800">{selectedStaff.phone_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Status</span>
                  <span className="font-black text-emerald-600 uppercase">{selectedStaff.status || 'Active'}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    const id = selectedStaff.id;
                    setSelectedStaff(null);
                    navigate(`/staff/edit/${id}`);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Edit Info
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default StaffManagement;
