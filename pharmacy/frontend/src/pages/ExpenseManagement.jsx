import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaPlus, FaTrash, FaMoneyBillAlt, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ExpenseManagement = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        category: 'Rent',
        amount: '',
        description: ''
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const response = await api.get('expenses/');
            const data = response.data?.results || response.data;
            setExpenses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching expenses:", error);
            if (navigator.onLine) {
                toast.error("Failed to load expenses");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.category) return toast.error("Please fill all fields");
        
        try {
            await api.post('expenses/', {
                ...formData,
                staff: user?.id
            });
            toast.success("Expense recorded");
            setFormData({ category: 'Rent', amount: '', description: '' });
            fetchExpenses();
        } catch (error) {
            console.error("Error adding expense:", error);
            toast.error("Failed to record expense");
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Delete this expense?")) return;
        try {
            await api.delete(`expenses/${id}/`);
            toast.success("Expense deleted");
            fetchExpenses();
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast.error("Failed to delete expense");
        }
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500 py-8 px-4 md:px-6 lg:px-8 text-sm">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <FaArrowLeft className="text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Expense Tracking</h1>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Manage business costs</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
                    <h3 className="text-sm font-black text-slate-900 uppercase mb-4 flex items-center gap-2">
                        <FaPlus className="text-emerald-500" /> New Expense
                    </h3>
                    <form onSubmit={handleAddExpense} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">Category</label>
                            <select 
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
                            >
                                <option>Rent</option>
                                <option>Electricity</option>
                                <option>Water</option>
                                <option>Salaries</option>
                                <option>Maintenance</option>
                                <option>Supplies</option>
                                <option>Tax</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">Amount (₦)</label>
                            <input 
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">Description</label>
                            <textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none min-h-[80px]"
                                placeholder="Details..."
                            />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white p-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                            Record Expense
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-black text-slate-900 uppercase">Recent Expenses</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/30 border-b border-slate-100">
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase">Date</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase">Category</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase">Description</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Amount</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="5" className="py-10 text-center text-slate-400">Loading...</td></tr>
                                ) : expenses.length === 0 ? (
                                    <tr><td colSpan="5" className="py-10 text-center text-slate-400">No expenses recorded yet</td></tr>
                                ) : expenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3 text-[11px] font-bold text-slate-600 tabular-nums">{exp.date}</td>
                                        <td className="px-5 py-3">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase">{exp.category}</span>
                                        </td>
                                        <td className="px-5 py-3 text-[11px] text-slate-700 font-bold">{exp.description}</td>
                                        <td className="px-5 py-3 text-right text-[12px] font-black text-slate-900 tabular-nums">₦{exp.amount}</td>
                                        <td className="px-5 py-3 text-center">
                                            <button onClick={() => handleDeleteExpense(exp.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                <FaTrash className="text-xs" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseManagement;
