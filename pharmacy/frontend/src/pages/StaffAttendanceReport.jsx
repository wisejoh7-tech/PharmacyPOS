import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { FaCalendarAlt, FaUsers, FaUserShield } from 'react-icons/fa';

const normalizeRole = (role) => String(role || '').toLowerCase().replace(/[_-]+/g, ' ');
const hasAnyRoleMarker = (role, markers) => markers.some((marker) => normalizeRole(role).includes(marker));

const StaffAttendanceReport = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchStaff = async () => {
      try {
        const response = await api.get('staff/', { signal: controller.signal });
        const records = Array.isArray(response.data) ? response.data : (response.data?.results || []);
        setStaff(records);
      } catch (error) {
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
          console.error('Error fetching registered staff:', error);
          setLoadError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchStaff();
    return () => controller.abort();
  }, []);

  const attendanceStaff = useMemo(
    () => staff.filter((member) => hasAnyRoleMarker(member.role, ['attendance', 'attendant'])),
    [staff],
  );
  const clinicianCount = useMemo(
    () => staff.filter((member) => hasAnyRoleMarker(member.role, ['clinician', 'pharmacist', 'doctor', 'nurse'])).length,
    [staff],
  );

  return (
    <div className="space-y-5 p-4 text-sm">
      <header>
        <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Registered Attendance Staff</h1>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Counts are based on registered staff roles. They do not indicate who is present today or record clock-in times.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <FaCalendarAlt className="text-lg text-orange-500" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Attendance / Attendant Roles</p>
            <p className="text-xl font-black tabular-nums text-slate-900">{loading ? '—' : loadError ? '—' : attendanceStaff.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <FaUserShield className="text-lg text-indigo-500" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registered Clinicians</p>
            <p className="text-xl font-black tabular-nums text-slate-900">{loading ? '—' : loadError ? '—' : clinicianCount}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <FaUsers className="text-emerald-600" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Registered Attendance / Attendant Staff</h2>
        </div>
        {loadError ? (
          <p className="p-6 text-center text-sm font-semibold text-rose-600">Could not load registered staff. Please try again later.</p>
        ) : loading ? (
          <p className="p-6 text-center text-sm font-semibold text-slate-500">Loading registered staff…</p>
        ) : attendanceStaff.length === 0 ? (
          <p className="p-6 text-center text-sm font-semibold text-slate-500">No staff are registered with an Attendance or Attendant role.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Name</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Role</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Department</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Registration Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceStaff.map((member) => (
                  <tr key={member.id}>
                    <td className="px-5 py-3 font-bold text-slate-900">{member.full_name || member.name || 'Unnamed staff'}</td>
                    <td className="px-5 py-3 text-slate-600">{member.role || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{member.department || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{member.status || 'Registered'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default StaffAttendanceReport;
