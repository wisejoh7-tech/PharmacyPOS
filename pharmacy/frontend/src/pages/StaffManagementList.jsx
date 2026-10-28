import React from 'react';
import { FaArrowLeft, FaBell, FaEllipsisV, FaSearch, FaPen, FaEye, FaUserPlus, FaThLarge, FaGraduationCap, FaUserFriends, FaCog, FaCircle } from 'react-icons/fa';

const StaffManagementList = () => {
  const staffData = [
    {
      id: 1,
      name: 'Dr. Aris Thorne',
      role: 'Professor',
      department: 'Computer Science',
      status: 'ACTIVE',
      statusColor: 'bg-emerald-100 text-emerald-800',
      dotColor: 'text-emerald-500',
      staffId: 'EP-2024-001',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      id: 2,
      name: 'Prof. Elena Vance',
      role: 'Head',
      department: 'Linguistics Dept.',
      status: 'ON LEAVE',
      statusColor: 'bg-amber-100 text-amber-800',
      dotColor: 'text-amber-500',
      staffId: 'EP-2024-042',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      id: 3,
      name: 'Marcus Sterling',
      role: 'Senior Registrar',
      department: 'Admissions',
      status: 'ACTIVE',
      statusColor: 'bg-emerald-100 text-emerald-800',
      dotColor: 'text-emerald-500',
      staffId: 'EP-2024-118',
      avatar: 'https://randomuser.me/api/portraits/men/46.jpg'
    },
    {
      id: 4,
      name: 'Dr. Sarah Jenkins',
      role: 'Dean',
      department: 'School of Arts',
      status: 'ACTIVE',
      statusColor: 'bg-emerald-100 text-emerald-800',
      dotColor: 'text-emerald-500',
      staffId: 'EP-2024-005',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      
      {/* Header */}
      <header className="bg-gray-50 px-4 pt-8 pb-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <FaArrowLeft className="text-[#1e1b4b] w-5 h-5 cursor-pointer" />
            <h2 className="text-2xl font-bold text-[#1e1b4b]">Staff lists</h2>
          </div>
          <div className="flex items-center gap-4 text-[#1e1b4b]">
            <FaBell className="w-5 h-5 cursor-pointer" />
            <FaEllipsisV className="w-5 h-5 cursor-pointer" />
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400 w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder="Search staff by name or ID" 
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#1e1b4b] transition-colors shadow-sm placeholder-gray-400"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select className="flex-1 bg-[#e0e7ff] text-[#3730a3] border border-[#c7d2fe] rounded-xl px-3 py-2.5 text-sm font-semibold appearance-none cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]">
             <option>Role: All ▼</option>
          </select>
          <select className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 appearance-none cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]">
             <option>Department ▼</option>
          </select>
           <select className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 appearance-none cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-[#1e1b4b]">
             <option>Campus ▼</option>
          </select>
        </div>
      </header>

      {/* Staff List */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 mt-2">
        <div className="space-y-4">
          {staffData.map((staff) => (
            <div key={staff.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <img src={staff.avatar} alt={staff.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                  <FaCircle className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${staff.dotColor} bg-white`} />
                </div>
                
                {/* Info */}
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{staff.name}</h3>
                  <p className="text-gray-500 text-sm mb-2 font-medium">{staff.role} • {staff.department}</p>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${staff.statusColor}`}>
                      {staff.status}
                    </span>
                    <span className="text-gray-400 text-xs font-medium">ID: {staff.staffId}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-[#1e1b4b] hover:bg-gray-50 transition-colors shadow-sm">
                  <FaPen className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-[#5c6bc0] hover:bg-gray-50 transition-colors shadow-sm">
                  <FaEye className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      </main>

      {/* Floating Action Button */}
      <button className="absolute bottom-24 right-4 w-14 h-14 bg-[#1e1b4b] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#312e81] transition-colors z-20">
        <FaUserPlus className="w-6 h-6" />
      </button>

    </div>
  );
};

export default StaffManagementList;
