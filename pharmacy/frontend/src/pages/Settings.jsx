import React, { useState, useEffect } from 'react';
import settingsService from '../services/settingsService';
import syncService from '../services/syncService';
import { getBaseURL, setApiBaseURL } from '../services/api';
import toast from 'react-hot-toast';
import { FaSave, FaUserShield, FaStore, FaPlus, FaTrash, FaEdit, FaTimes, FaBell, FaDatabase, FaSyncAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const [settings, setSettings] = useState({ id: null, shop_name: '', location: '' });
    const [adminData, setAdminData] = useState({ username: '', password: '' });
    const [users, setUsers] = useState([]);
    const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [apiUrl, setApiUrl] = useState(getBaseURL());
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSettings();
        fetchUsers();
        checkPendingSync();
    }, []);

    const checkPendingSync = async () => {
        const count = await syncService.getPendingSyncCount();
        setPendingSyncCount(count);
    };

    const handleSaveApiUrl = (e) => {
        e.preventDefault();
        setApiBaseURL(apiUrl);
        toast.success("Backend API URL updated successfully!");
        setTimeout(() => window.location.reload(), 800);
    };

    const handleManualSync = async () => {
        try {
            setLoading(true);
            const res = await syncService.sync();
            if (res.success) {
                toast.success(`Sync completed! Synced ${res.syncedCount || 0} items.`);
            } else {
                toast.error(`Sync skipped: ${res.reason}`);
            }
            checkPendingSync();
        } catch (err) {
            toast.error("Sync failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await settingsService.getSettings();
            if (response.data && response.data.length > 0) {
                setSettings(response.data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await settingsService.getUsers();
            setUsers(response.data.results || response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const handleSettingsSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await settingsService.updateSettings(settings.id, settings);
            toast.success("System branding updated!");
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update branding.");
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await settingsService.updateProfile(adminData);
            toast.success("Admin credentials updated!");
            setAdminData({ username: '', password: '' });
        } catch (error) {
            console.error(error);
            toast.error("Failed to update credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        if (!newAdmin.username || !newAdmin.password) return toast.error("Please fill all fields");
        const payload = { ...newAdmin, username: newAdmin.username.toLowerCase() };
        try {
            setLoading(true);
            if (editingUser) {
                await settingsService.updateUser(editingUser.id, payload);
                toast.success("Administrator updated!");
                setEditingUser(null);
            } else {
                await settingsService.addUser(payload);
                toast.success("New administrator added!");
            }
            setNewAdmin({ username: '', password: '' });
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error(editingUser ? "Failed to update administrator." : "Failed to add administrator.");
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setNewAdmin({ username: user.username, password: '' }); // Don't pre-fill password for security
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to remove this administrator?")) return;
        try {
            await settingsService.deleteUser(id);
            toast.success("Administrator removed");
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove user.");
        }
    };

    return (
        <div className="p-4 max-w-6xl mx-auto space-y-4 text-xs animate-in fade-in duration-500">
            <header className="flex flex-col gap-0.5">
                <h1 className="text-base font-black text-slate-900 uppercase tracking-tight font-outfit">Administration Settings</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Branding Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit lg:col-span-12 xl:col-span-6">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
                        <FaStore className="text-emerald-500 text-xs" />
                        <h2 className="text-[10px] font-black uppercase tracking-widest">System Branding & Info</h2>
                    </div>
                    <form onSubmit={handleSettingsSave} className="p-4 space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Shop Name</label>
                                <input 
                                    value={settings.shop_name}
                                    onChange={(e) => setSettings({...settings, shop_name: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-[11px] outline-none focus:ring-2 focus:ring-emerald-50"
                                    style={{ fontSize: '11px' }}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Location / Branch</label>
                                <input 
                                    value={settings.location}
                                    onChange={(e) => setSettings({...settings, location: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-[11px] outline-none focus:ring-2 focus:ring-emerald-50"
                                    style={{ fontSize: '11px' }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Phone Number</label>
                                    <input 
                                        value={settings.phone_number || ''}
                                        onChange={(e) => setSettings({...settings, phone_number: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-[11px] outline-none focus:ring-2 focus:ring-emerald-50"
                                        style={{ fontSize: '11px' }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Email Address</label>
                                    <input 
                                        type="email"
                                        value={settings.email || ''}
                                        onChange={(e) => setSettings({...settings, email: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-[11px] outline-none focus:ring-2 focus:ring-emerald-50"
                                        style={{ fontSize: '11px' }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Address</label>
                                <textarea 
                                    value={settings.address || ''}
                                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                                    rows="2"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-[11px] outline-none focus:ring-2 focus:ring-emerald-50 resize-none"
                                    style={{ fontSize: '11px' }}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Currency</label>
                                    <input 
                                        value={settings.currency || 'NGN'}
                                        onChange={(e) => setSettings({...settings, currency: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-[11px] outline-none focus:ring-2 focus:ring-emerald-50"
                                        style={{ fontSize: '11px' }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tax %</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={settings.tax_rate || 0}
                                        onChange={(e) => setSettings({...settings, tax_rate: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-[11px] outline-none focus:ring-2 focus:ring-emerald-50"
                                        style={{ fontSize: '11px' }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Low Stock</label>
                                    <input 
                                        type="number"
                                        value={settings.low_stock_threshold || 10}
                                        onChange={(e) => setSettings({...settings, low_stock_threshold: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-[11px] outline-none focus:ring-2 focus:ring-emerald-50"
                                        style={{ fontSize: '11px' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <button disabled={loading} className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 text-white rounded-lg py-2 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100" style={{ fontSize: '10px' }}>
                            <FaSave /> Save Changes
                        </button>
                    </form>
                </div>

                {/* Security Section (Profile Update) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit lg:col-span-6 xl:col-span-3">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                        <FaUserShield className="text-blue-500" />
                        <h2 className="text-[12px] font-black uppercase tracking-widest">Update Your Profile</h2>
                    </div>
                    <form onSubmit={handleProfileSave} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Change Username</label>
                            <input 
                                value={adminData.username}
                                onChange={(e) => setAdminData({...adminData, username: e.target.value})}
                                placeholder="Leave blank to keep current"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 font-black text-[13px] outline-none focus:ring-2 focus:ring-blue-50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Change Password</label>
                            <input 
                                type="password"
                                value={adminData.password}
                                onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 font-black text-[13px] outline-none focus:ring-2 focus:ring-blue-50"
                            />
                        </div>
                        <button disabled={loading} className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-[12px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                            <FaSave /> Update Profile
                        </button>
                    </form>
                </div>

                {/* Admin Management Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit lg:col-span-6 xl:col-span-3">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FaUserShield className="text-amber-500" />
                            <h2 className="text-[12px] font-black uppercase tracking-widest">{editingUser ? 'Edit Administrator' : 'Register New Admin'}</h2>
                        </div>
                        {editingUser && (
                            <button onClick={() => { setEditingUser(null); setNewAdmin({ username: '', password: '' }); }} className="text-slate-400 hover:text-red-500 transition-colors">
                                <FaTimes />
                            </button>
                        )}
                    </div>
                    <div className="p-6 space-y-6">
                        <form onSubmit={handleAddAdmin} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Admin Username</label>
                                <input 
                                    required
                                    value={newAdmin.username}
                                    onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                                    placeholder="Enter username"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 font-black text-[13px] outline-none focus:ring-2 focus:ring-amber-50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{editingUser ? 'New Password (Optional)' : ' Password'}</label>
                                <input 
                                    required={!editingUser}
                                    type="password"
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 font-black text-[13px] outline-none focus:ring-2 focus:ring-amber-50"
                                />
                            </div>
                            <button disabled={loading} className={`w-full ${editingUser ? 'bg-blue-600' : 'bg-amber-500'} text-white rounded-xl py-2.5 text-[12px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-100`}>
                                {editingUser ? <FaSave /> : <FaPlus />} {editingUser ? 'Update Admin' : 'Add Admin'}
                            </button>
                        </form>

                        <div className="pt-4 border-t border-slate-50">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Current Administrators</label>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {users.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[12px] font-black text-slate-400 uppercase">
                                                {u.username[0]}
                                            </div>
                                            <span className="text-[12px] font-black text-slate-700 uppercase">{u.username}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => handleEditClick(u)}
                                                className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <FaEdit className="w-2.5 h-2.5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <FaTrash className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Database & Synchronization Settings */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FaDatabase className="text-indigo-500" />
                        <h2 className="text-[12px] font-black uppercase tracking-widest">Database Host & Synchronization</h2>
                    </div>
                    <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        Pending Sync Items: {pendingSyncCount}
                    </span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form onSubmit={handleSaveApiUrl} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Active Backend Server URL</label>
                            <input
                                value={apiUrl}
                                onChange={(e) => setApiUrl(e.target.value)}
                                placeholder="https://pharmacy-api-exn3.onrender.com/api/"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 font-black text-[13px] outline-none focus:ring-2 focus:ring-indigo-50"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setApiUrl('https://pharmacy-api-exn3.onrender.com/api/')}
                                className="text-[11px] font-black px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                                Render Cloud DB
                            </button>
                            <button
                                type="button"
                                onClick={() => setApiUrl('http://localhost:8000/api/')}
                                className="text-[11px] font-black px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Local SQLite Server
                            </button>
                        </div>
                        <button disabled={loading} className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-[12px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                            <FaSave /> Apply Server Endpoint
                        </button>
                    </form>

                    <div className="flex flex-col justify-between bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                        <div>
                            <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-800">Local-First Offline Synchronization</h3>
                            <p className="text-[11px] text-slate-500 mt-1">
                                Stores local sales, inventory, and records on your device and syncs with the central database when connected.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleManualSync}
                            disabled={loading}
                            className="w-full bg-emerald-500 text-white rounded-xl py-2.5 text-[12px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                        >
                            <FaSyncAlt className={loading ? 'animate-spin' : ''} /> Synchronize Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Additional Settings Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div 
                    onClick={() => navigate('/settings/notifications')}
                    className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <FaBell className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Notification Preferences</h3>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Configure alerts & methods</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
               <p className="text-amber-800 font-bold">Important Notice:</p>
               <p className="text-amber-600">Changing the Shop Name will update the login screen and all receipt headers across the system. Newly provisioned admin accounts will have full clinical and financial oversight.</p>
            </div>
        </div>
    );
};

export default Settings;
