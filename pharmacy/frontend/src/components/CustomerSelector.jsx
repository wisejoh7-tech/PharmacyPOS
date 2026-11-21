import React, { useEffect, useState } from 'react';
import customerService from '../services/customerService';
import toast from 'react-hot-toast';
import { FaUserPlus } from 'react-icons/fa';

const CustomerSelector = ({ value, onChange, tone = 'emerald' }) => {
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '' });

  const loadCustomers = async () => {
    try {
      const response = await customerService.getCustomers();
      const list = response.data?.results || response.data || [];
      setCustomers(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Unable to load customers.');
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  const registerCustomer = async (event) => {
    event.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.phone_number.trim()) {
      toast.error('Customer name and phone number are required.');
      return;
    }
    setSaving(true);
    try {
      const response = await customerService.createCustomer({
        ...form,
        customer_id: `CUST-${Date.now()}`,
        date_of_birth: null,
        email: null,
      });
      const customer = response.data;
      setCustomers((current) => [...current, customer]);
      onChange(String(customer.id));
      setForm({ first_name: '', last_name: '', phone_number: '' });
      setOpen(false);
      toast.success('Customer registered and attached to this sale.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Customer registration failed.');
    } finally {
      setSaving(false);
    }
  };

  const accentClass = tone === 'blue' ? 'text-blue-600' : 'text-emerald-600';
  const buttonClass = tone === 'blue' ? 'bg-blue-500' : 'bg-emerald-500';
  return (
    <div className="p-4 border-b border-slate-50">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Customer for receipt</label>
        <button type="button" onClick={() => setOpen(true)} className={`${accentClass} text-[10px] font-black uppercase tracking-wider flex items-center gap-1`}>
          <FaUserPlus /> New customer
        </button>
      </div>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-bold outline-none">
        <option value="">Walk-in Customer</option>
        {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.first_name} {customer.last_name} · {customer.phone_number}</option>)}
      </select>
      {open && (
        <div className="fixed inset-0 z-[120] bg-slate-900/50 flex items-center justify-center p-4">
          <form onSubmit={registerCustomer} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
            <div><h3 className="text-base font-black text-slate-900">Register customer</h3><p className="text-[11px] text-slate-400 mt-1">The name and phone number will appear on the receipt.</p></div>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              <input required placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <input required type="tel" placeholder="Phone number" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            <div className="flex gap-2 justify-end"><button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500">Cancel</button><button disabled={saving} className={`px-4 py-2 rounded-lg ${buttonClass} text-white text-sm font-black`}>{saving ? 'Saving…' : 'Register customer'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
};
export default CustomerSelector;
