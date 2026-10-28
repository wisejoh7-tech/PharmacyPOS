import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FaGraduationCap, FaPlus, FaTrash, FaEdit, FaSearch,
  FaUserGraduate, FaFileDownload, FaTimes
} from 'react-icons/fa';

const STORAGE_KEY = 'staff_rotation_records';

const StaffEducation = () => {
  const [rotations, setRotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    traineeName: '',
    roleCategory: 'Resident',
    department: 'Pharmacy Practice',
    rotationModule: '',
    startDate: '',
    endDate: '',
    score: '',
    status: 'In Progress'
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setRotations(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse stored staff rotations", err);
      }
    } else {
      const defaultRotations = [
        {
          id: 1,
          traineeName: 'Clinical Trainee A',
          roleCategory: 'Resident',
          department: 'Clinical Pharmacy & Research',
          rotationModule: 'Clinical Rotation Module 1',
          startDate: '2026-01-01',
          endDate: '2026-06-30',
          score: '4.8',
          status: 'In Progress'
        }
      ];
      setRotations(defaultRotations);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRotations));
    }
  }, []);

  const saveToStorage = (updated) => {
    setRotations(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.traineeName || !formData.rotationModule) {
      toast.error('Please enter trainee name and rotation module.');
      return;
    }

    if (editingId) {
      const updated = rotations.map(r =>
        r.id === editingId ? { ...r, ...formData, id: editingId } : r
      );
      saveToStorage(updated);
      toast.success('Staff rotation record updated!');
    } else {
      const newRecord = {
        ...formData,
        id: Date.now()
      };
      saveToStorage([newRecord, ...rotations]);
      toast.success('Onboarded trainee rotation successfully!');
    }

    setFormData({
      traineeName: '',
      roleCategory: 'Resident',
      department: 'Pharmacy Practice',
      rotationModule: '',
      startDate: '',
      endDate: '',
      score: '',
      status: 'In Progress'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (record) => {
    setFormData({
      traineeName: record.traineeName || '',
      roleCategory: record.roleCategory || 'Resident',
      department: record.department || 'Pharmacy Practice',
      rotationModule: record.rotationModule || '',
      startDate: record.startDate || '',
      endDate: record.endDate || '',
      score: record.score || '',
      status: record.status || 'In Progress'
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this staff rotation record?')) {
      const updated = rotations.filter(r => r.id !== id);
      saveToStorage(updated);
      toast.success('Staff rotation record deleted.');
    }
  };

  const handleExport = () => {
    const headers = ['Trainee Name', 'Role Category', 'Department', 'Rotation Module', 'Start Date', 'End Date', 'Score', 'Status'];
    const rows = rotations.map(r => [
      `"${r.traineeName || ''}"`,
      `"${r.roleCategory || ''}"`,
      `"${r.department || ''}"`,
      `"${r.rotationModule || ''}"`,
      `"${r.startDate || ''}"`,
      `"${r.endDate || ''}"`,
      `"${r.score || ''}"`,
      `"${r.status || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'staff_rotations_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Staff rotations exported to CSV.');
  };

  const filteredRotations = rotations.filter(r => {
    const matchesSearch =
      r.traineeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rotationModule?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterCategory === 'ALL') return matchesSearch;
    return matchesSearch && r.roleCategory?.toUpperCase() === filterCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 overflow-x-hidden text-sm pb-10">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden border border-purple-900/50">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-purple-500/30 font-black">
              <FaGraduationCap />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/30">
                  Admin Exclusive Portal
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black font-outfit text-white tracking-tight mt-1">
                Staff Education & Development
              </h1>
              <p className="text-xs text-slate-300 max-w-xl mt-0.5">
                Admin-controlled management for staff clinical rotations, trainee onboarding, and development evaluations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center gap-2 text-xs"
            >
              <FaFileDownload />
              <span>Export Rotations</span>
            </button>
            <button
              onClick={() => {
                if (showForm) {
                  setShowForm(false);
                  setEditingId(null);
                } else {
                  setFormData({
                    traineeName: '',
                    roleCategory: 'Resident',
                    department: 'Pharmacy Practice',
                    rotationModule: '',
                    startDate: '',
                    endDate: '',
                    score: '',
                    status: 'In Progress'
                  });
                  setShowForm(true);
                }
              }}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 text-xs"
            >
              {showForm ? <FaTimes /> : <FaPlus />}
              <span>{showForm ? 'Close Form' : 'Onboard Trainee'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Onboard / Edit Rotation Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <FaUserGraduate className="text-purple-600" />
              {editingId ? 'Edit Rotation Details' : 'Onboard Trainee / Schedule Staff Rotation'}
            </h2>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded uppercase">
              Admin Control Only
            </span>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Staff Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="traineeName"
                  value={formData.traineeName}
                  onChange={handleInputChange}
                  placeholder="Enter staff member or trainee name"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role Category</label>
                <select
                  name="roleCategory"
                  value={formData.roleCategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="Staff">Staff</option>
                  <option value="Sales Rep">Sales Rep</option>
                  <option value="Medical Student">Pharmacist</option>
                  <option value="Fellow">Nurse</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department / Specialty</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g. Clinical Care, Pharmacy, Oncology"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Rotation Module / Block <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="rotationModule"
                  value={formData.rotationModule}
                  onChange={handleInputChange}
                  placeholder="e.g. Inpatient Pharmacotherapy"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Evaluation Score (/5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  name="score"
                  value={formData.score}
                  onChange={handleInputChange}
                  placeholder="e.g. 4.8"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending Review">Pending Review</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-purple-600/20"
              >
                {editingId ? 'Save Rotation Changes' : 'Confirm Rotation Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs & Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Staff Rotation & Development Table ({filteredRotations.length})
              </h3>
              <p className="text-[11px] font-bold text-slate-400">
                Track staff development modules, active rotations, and performance scores
              </p>
            </div>

            <div className="relative w-full md:w-64">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search staff, department, or module..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs font-bold">
            {['ALL', 'RESIDENT', 'INTERN', 'MEDICAL STUDENT', 'FELLOW'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl uppercase transition-all ${
                  filterCategory === cat
                    ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">Staff / Trainee</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5">Rotation Module</th>
                <th className="py-3 px-5">Duration</th>
                <th className="py-3 px-5">Score</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {filteredRotations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <FaGraduationCap className="text-3xl mx-auto mb-2 text-slate-300" />
                    <p className="font-bold">No rotation records found.</p>
                    <p className="text-[11px]">Click "Onboard Trainee" to schedule staff rotations.</p>
                  </td>
                </tr>
              ) : (
                filteredRotations.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-black text-slate-900">{r.traineeName}</td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded text-[10px] uppercase">
                        {r.roleCategory}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">{r.department}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{r.rotationModule}</td>
                    <td className="py-3.5 px-5 text-slate-500 font-bold">
                      {r.startDate || 'N/A'} {r.endDate ? `→ ${r.endDate}` : ''}
                    </td>
                    <td className="py-3.5 px-5 font-black text-slate-900">
                      {r.score ? `${r.score} / 5.0` : '-'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        r.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'In Progress' ? 'bg-purple-100 text-purple-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(r)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Rotation"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <FaTrash />
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

    </div>
  );
};

export default StaffEducation;
