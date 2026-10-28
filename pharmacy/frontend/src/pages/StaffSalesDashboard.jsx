import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import axios from 'axios';
import { 
  FaMoneyBill, FaUsers, FaShoppingCart, 
  FaChartLine 
} from 'react-icons/fa';

const StaffSalesDashboard = () => {
    const { id } = useParams();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(id || '');

    useEffect(() => {
        const controller = new AbortController();
        fetchStaffList(controller.signal);
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        if (selectedStaff) {
            fetchStats(selectedStaff, controller.signal);
        }
        return () => controller.abort();
    }, [selectedStaff]);

    const fetchStaffList = async (signal) => {
        try {
            const response = await api.get('staff/', { signal });
            const data = response.data.results || response.data;
            setStaffList(data);
            if (!selectedStaff && data.length > 0) {
                setSelectedStaff(data[0].id);
            }
        } catch (err) {
            if (axios.isCancel(err)) return;
            console.error("Failed to fetch staff list", err);
        }
    };

    const fetchStats = async (staffId, signal) => {
        try {
            setLoading(true);
            const response = await api.get(`sales/${staffId}/sales-stats/`, { signal });
            setStats(response.data);
        } catch (err) {
            if (axios.isCancel(err)) return;
            console.error("Failed to fetch staff stats", err);
        } finally {
            if (!(signal && signal.aborted)) {
                setLoading(false);
            }
        }
    };

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50 min-h-screen text-xs">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 h-16">
                <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-0.5">
                        <FaChartLine className="w-2.5 h-2.5" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Performance Audit</span>
                    </div>
                    <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase font-outfit">Staff Dashboard</h1>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Specialist:</label>
                        <select 
                            value={selectedStaff}
                            onChange={(e) => setSelectedStaff(e.target.value)}
                            className="bg-transparent text-[10px] font-black text-slate-900 focus:outline-none uppercase"
                        >
                            <option value="">Select Profile</option>
                            {staffList.map(s => (
                                <option key={s.id} value={s.id}>{s.full_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-5 max-w-5xl mx-auto w-full">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-48">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Metrics...</p>
                    </div>
                ) : stats ? (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Revenue */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-200 transition-all">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                                    <FaMoneyBill className="text-emerald-500 w-4 h-4" />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Revenue</p>
                                <p className="text-xl font-black text-slate-900 tracking-tight tabular-nums">₦{parseFloat(stats.total_revenue).toLocaleString()}</p>
                            </div>

                            {/* Customers */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-200 transition-all">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                                    <FaUsers className="text-blue-500 w-4 h-4" />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Recipients Served</p>
                                <p className="text-xl font-black text-slate-900 tracking-tight tabular-nums">{stats.customer_count}</p>
                            </div>

                            {/* Transactions */}
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-purple-200 transition-all">
                                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                                    <FaShoppingCart className="text-purple-500 w-4 h-4" />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Sale Logs</p>
                                <p className="text-xl font-black text-slate-900 tracking-tight tabular-nums">{stats.transaction_count}</p>
                            </div>
                        </div>

                        {/* Summary Section */}
                        <div className="bg-emerald-500 rounded-3xl p-8 border border-emerald-600 flex flex-col items-center text-center shadow-lg shadow-emerald-100">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-4">
                                <FaChartLine className="text-emerald-500 w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-black text-white mb-2 uppercase tracking-tight">System Report for {stats.staff_name.split(' ')[0]}</h2>
                            <p className="text-emerald-50 font-bold text-[10px] uppercase tracking-widest max-w-sm">
                                Clinical performance is within optimal range. Continue provided excellent pharmacy services.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">No active audit data found</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StaffSalesDashboard;
