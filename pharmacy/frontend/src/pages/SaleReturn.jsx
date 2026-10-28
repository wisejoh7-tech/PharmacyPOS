import React, { useState, useEffect } from 'react';
import posService from '../services/posService';
import toast from 'react-hot-toast';
import { 
  FaArrowLeft, FaSearch, FaBox, FaUndo, FaChevronDown,
  FaFileInvoiceDollar, FaUser, FaCalendarDay, FaCheck
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SaleReturn = () => {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState(null);
    const [returnData, setReturnData] = useState({
        drug: '',
        quantity: 1,
        reason: 'Expired',
        refund_amount: 0,
        item_id: null
    });

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const response = await posService.getSales();
                setSales(response.data);
            } catch (err) {
                console.error("Error fetching sales", err);
            }
        };
        fetchSales();
    }, []);

    const handleSelectItem = (item) => {
        setReturnData({
            ...returnData, 
            drug: item.drug, 
            item_id: item.id,
            unit_price: item.unit_price,
            refund_amount: (item.unit_price * returnData.quantity).toFixed(2)
        });
    };

    const handleProcessReturn = async () => {
        if (!selectedSale || !returnData.drug) {
            return toast.error("Please select a medication from the table below");
        }

        try {
            setLoading(true);
            const payload = {
                sale: selectedSale.id,
                drug: returnData.drug,
                quantity: returnData.quantity,
                reason: returnData.reason,
                refund_amount: returnData.refund_amount
            };
            await posService.createReturn(payload);
            toast.success("Return processed successfully!");
            navigate('/reports/sales');
        } catch (err) {
            console.error("Return failed", err);
            toast.error("Failed to process return");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col xl:flex-row h-full gap-4 animate-in fade-in duration-500 text-xs">
            
            {/* Left: Transaction Search Table */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                <header className="p-5 border-b border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all shadow-none">
                            <FaArrowLeft />
                        </button>
                        <div>
                            <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase font-outfit text-red-500 leading-none">Return Module</h1>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transaction Refund Audit</p>
                        </div>
                    </div>

                    <div className="relative w-full max-w-[600px]">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input 
                            type="text"
                            placeholder="Search by Transaction ID or Staff..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-50 focus:border-emerald-500 transition-all outline-none"
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50/50 sticky top-0 z-10">
                          <tr>
                             <th className="px-5 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Tx ID</th>
                             <th className="px-5 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Staff</th>
                             <th className="px-5 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Date</th>
                             <th className="px-5 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">Value</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {sales.filter(s => s.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())).map(sale => (
                             <tr 
                                key={sale.id}
                                onClick={() => setSelectedSale(sale)}
                                className={`hover:bg-slate-50/80 transition-all cursor-pointer group ${selectedSale?.id === sale.id ? 'bg-emerald-50/50' : ''}`}
                             >
                                <td className="px-5 py-3">
                                   <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{sale.transaction_id}</span>
                                </td>
                                <td className="px-5 py-3">
                                   <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{sale.staff_name || 'System'}</span>
                                </td>
                                <td className="px-5 py-3 font-black text-slate-400 tabular-nums">
                                   <span className="text-[9px] font-black text-slate-400 tabular-nums">{new Date(sale.created_at).toLocaleString()}</span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                   <span className="text-[11px] font-black text-emerald-600 tabular-nums">₦{sale.total_amount}</span>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                </div>
            </div>

            {/* Right: Return Details Sidebar */}
            <aside className="w-full xl:w-[320px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500 text-xs">
                <div className="p-5 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-xl shadow-sm">
                            <FaUndo />
                        </div>
                        <div>
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">Adjustment Protocol</h2>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Dispensation Correction</p>
                        </div>
                    </div>

                    {selectedSale ? (
                        <div className="flex-1 flex flex-col space-y-4">
                            
                            {/* Drug Selection Table */}
                            <div className="space-y-2">
                               <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Transaction Items</label>
                               <div className="border border-slate-50 rounded-xl overflow-hidden">
                                  <table className="w-full text-left">
                                     <thead className="bg-slate-50">
                                        <tr>
                                           <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase">Medication</th>
                                           <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase text-center">Qty</th>
                                           <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase text-right">Unit</th>
                                        </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-50">
                                        {selectedSale.items?.map((item) => (
                                           <tr 
                                              key={item.id} 
                                              onClick={() => handleSelectItem(item)}
                                              className={`cursor-pointer transition-all ${returnData.item_id === item.id ? 'bg-emerald-500 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                                           >
                                              <td className="px-3 py-2 text-[9px] font-black uppercase tracking-tight">{item.drug_name}</td>
                                              <td className="px-3 py-2 text-[9px] font-bold text-center tabular-nums">{item.quantity}</td>
                                              <td className="px-3 py-2 text-[9px] font-black text-right tabular-nums">₦{item.unit_price}</td>
                                           </tr>
                                        ))}
                                     </tbody>
                                  </table>
                               </div>
                               {returnData.item_id && (
                                  <div className="flex items-center gap-1 text-emerald-600">
                                     <FaCheck className="text-[8px]" />
                                     <span className="text-[8px] font-black uppercase tracking-widest">Item Selected</span>
                                  </div>
                               )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Return Qty</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[11px] font-black outline-none"
                                        value={returnData.quantity}
                                        max={selectedSale.items.find(i => i.id === returnData.item_id)?.quantity || 1}
                                        min="1"
                                        onChange={(e) => {
                                            const qty = parseInt(e.target.value) || 1;
                                            setReturnData({
                                                ...returnData, 
                                                quantity: qty,
                                                refund_amount: (returnData.unit_price * qty).toFixed(2)
                                            });
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Credit</label>
                                    <div className="w-full bg-red-50 rounded-lg px-3 py-2 text-[11px] font-black text-red-600 tabular-nums">
                                        ₦{returnData.refund_amount}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Justification</label>
                                <select 
                                    value={returnData.reason}
                                    onChange={(e) => setReturnData({...returnData, reason: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-black outline-none appearance-none"
                                >
                                    <option value="Expired">Expiration</option>
                                    <option value="Damaged Packaging">Packaging Comprised</option>
                                    <option value="Wrong Medication">Dispensing Error</option>
                                    <option value="Customer Request">Patient Voluntary</option>
                                    <option value="Adverse Reaction">Adverse Incident</option>
                                    <option value="Other">Clinical Adjustment</option>
                                </select>
                            </div>

                            <div className="pt-6 mt-auto border-t border-slate-50">
                               <button 
                                   onClick={handleProcessReturn}
                                   disabled={loading || !returnData.drug}
                                   className={`w-full py-3 rounded-xl text-[11px] font-black tracking-widest transition-all bg-red-500 text-white shadow-none ${!returnData.drug ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:bg-red-600'}`}
                               >
                                   {loading ? 'AUDITING...' : 'AUTHORIZE REFUND'}
                               </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-20">
                            <FaFileInvoiceDollar size={48} className="mb-4" />
                            <p className="text-[11px] font-black uppercase tracking-tight">Select Sale</p>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
};

export default SaleReturn;
