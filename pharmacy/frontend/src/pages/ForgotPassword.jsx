import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import PharmacyLogo from '../components/PharmacyLogo';
import toast from 'react-hot-toast';
import api from '../services/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const cleanIdentifier = identifier.trim().toLowerCase();
            await api.post('reset-password/', { username: cleanIdentifier });
            setLoading(false);
            setIsSubmitted(true);
            toast.success(`Password for ${identifier} has been reset to admin123`);
        } catch (err) {
            setLoading(false);
            const errorMsg = err.response?.data?.error || 'Recovery failed. Please consult system logs.';
            toast.error(errorMsg);
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-3 text-xs">
            <div className="w-full max-w-[360px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="h-2 bg-sky-600 w-full" />

                <div className="p-5 pb-2 text-center flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-3">
                        <PharmacyLogo className="w-9 h-9 object-contain" />
                        <div className="text-left leading-tight">
                            <span className="text-sm font-extrabold text-sky-700 block">New Light</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">Medicine & Store</span>
                        </div>
                    </div>
                    <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Reset Password</h2>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Enter your account ID or email</p>
                </div>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="p-5 pt-3 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Username or Email</label>
                            <input 
                                type="text" 
                                placeholder=""
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-600 transition-all"
                                required 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:bg-sky-700 transition-all active:scale-95"
                        >
                            {loading ? 'Processing...' : 'Reset Password'}
                        </button>

                        <button 
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:text-sky-600 transition-colors pt-1"
                        >
                            <FaArrowLeft className="text-[9px]" /> Return to Login
                        </button>
                    </form>
                ) : (
                    <div className="p-5 text-center space-y-4">
                        <div className="bg-sky-50 p-4 rounded-xl border border-sky-200 text-left">
                            <p className="text-xs font-bold text-sky-900 uppercase">
                                Password Reset Successfully!
                            </p>
                            <p className="text-[10px] font-semibold text-sky-700 mt-1.5">
                                Account password for <strong className="text-slate-900">{identifier}</strong> has been reset to: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-300 text-sky-900 font-bold">admin123</span>
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-sky-700 transition-all"
                        >
                            Log In Now
                        </button>
                    </div>
                )}

                <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                    <p className="text-[9px] font-semibold text-slate-400">
                        New Light Medicine and Store • Security Portal
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
