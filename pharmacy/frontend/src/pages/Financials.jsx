import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaMoneyBill, FaChartLine, FaArrowDown, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Financials = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
        balance: 0
    });

    const fetchStats = async () => {
        try {
            const response = await api.get('expenses/financial-summary/');
            const data = response.data || {};
            setStats({
                total_revenue: data.total_revenue ?? data.revenue ?? 0,
                total_expenses: data.total_expenses ?? data.expenses ?? 0,
                net_profit: data.net_profit ?? data.profit ?? 0,
                balance: data.balance ?? data.profit ?? 0
            });
        } catch (error) {
            console.error("Error fetching financial stats:", error);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchStats();
    }, []);

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500 py-8 px-4 md:px-6 lg:px-8 text-sm">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <FaArrowLeft className="text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Financial Overview</h1>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Revenue, Expenses & Profit</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</span>
                        <FaChartLine className="text-emerald-500 opacity-20" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 tabular-nums">₦{(stats.total_revenue || 0).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">Total Sales</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Expenses</span>
                        <FaArrowDown className="text-red-500 opacity-20" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 tabular-nums">₦{(stats.total_expenses || 0).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-red-500 uppercase mt-1">Outgoings</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Profit</span>
                        <FaMoneyBill className="text-blue-500 opacity-20" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 tabular-nums">₦{(stats.net_profit || 0).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-blue-500 uppercase mt-1 text-xs">Revenue - Expenses</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</span>
                        <FaCalendarAlt className="text-indigo-500 opacity-20" />
                    </div>
                    <p className="text-2xl font-black text-slate-900 tabular-nums">₦{(stats.balance || 0).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1">Cash on Hand</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center py-20 opacity-40">
                <FaChartLine size={48} className="mx-auto mb-4 text-slate-200" />
                <h3 className="text-lg font-black text-slate-400 uppercase italic">Advanced analytics coming soon...</h3>
            </div>
        </div>
    );
};

export default Financials;
