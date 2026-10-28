import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import customerService from '../services/customerService';
import api from '../services/api';
import { 
  FaArrowLeft, FaUserCircle, FaBriefcaseMedical, 
  FaHistory, FaNotesMedical, FaCalendarPlus, FaPlus, FaTrash, FaCapsules,
  FaFilePrescription, FaClipboardList, FaStethoscope, FaMicroscope,
  FaHeartbeat, FaExchangeAlt, FaDoorOpen
} from 'react-icons/fa';
import drugService from '../services/drugService';
import prescriptionService from '../services/prescriptionService';
import toast from 'react-hot-toast';

const PatientPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [drugs, setDrugs] = useState([]);
    const [prescriptionItems, setPrescriptionItems] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [sales, setSales] = useState([]);
    const [isPrescribing, setIsPrescribing] = useState(false);

    useEffect(() => {
        fetchPatientData();
        fetchDrugs();
        fetchPrescriptions();
        fetchSales();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchSales = async () => {
        try {
            const response = await api.get('sales/');
            const allSales = response.data.results || response.data;
            // Filter sales for this specific patient
            const patientSales = Array.isArray(allSales) 
                ? allSales.filter(s => s.customer === parseInt(id))
                : [];
            setSales(patientSales);
        } catch (error) {
            console.error("Failed to fetch sales history", error);
        }
    };

    const fetchPrescriptions = async () => {
        try {
            const response = await prescriptionService.getPrescriptions();
            // Filter prescriptions for this specific patient
            const allPrescriptions = response.data.results || response.data;
            const patientPrescriptions = Array.isArray(allPrescriptions) 
                ? allPrescriptions.filter(p => p.customer === parseInt(id))
                : [];
            setPrescriptions(patientPrescriptions);
        } catch (error) {
            console.error("Failed to fetch prescriptions", error);
        }
    };

    const fetchDrugs = async () => {
        try {
            const response = await drugService.getDrugs();
            setDrugs(response.data.results || response.data);
        } catch (error) {
            console.error("Failed to fetch drugs", error);
        }
    };

    const fetchPatientData = async () => {
        try {
            setLoading(true);
            const response = await customerService.getCustomer(id);
            setPatient(response.data);
        } catch (error) {
            console.error("Failed to fetch patient data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

     if (!patient) return <div className="p-10 text-center uppercase font-black text-slate-400 tracking-widest text-[12px]">Patient Profile Not Found</div>;
 
     const addPrescriptionItem = () => {
         setPrescriptionItems([...prescriptionItems, { drug: '', quantity: 1, directions: '' }]);
     };
 
     const removePrescriptionItem = (index) => {
         setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
     };
 
     const handleItemChange = (index, field, value) => {
         const newItems = [...prescriptionItems];
         newItems[index][field] = value;
         setPrescriptionItems(newItems);
     };
 
     const handlePrescribe = async () => {
         if (prescriptionItems.length === 0) return toast.error("Add at least one drug");
         if (prescriptionItems.some(item => !item.drug)) return toast.error("Select a drug for all items");
 
         try {
             setLoading(true);
             const payload = {
                 customer: patient.id,
                 prescribing_doctor: 'Clinic Personnel',
                 items: prescriptionItems.map(item => ({
                     drug: item.drug,
                     quantity: parseInt(item.quantity),
                     directions: item.directions
                 })),
                 prescription_id: "RX-" + Date.now().toString().slice(-6)
             };
 
             await prescriptionService.createPrescription(payload);
             toast.success("Prescription issued successfully!");
             setPrescriptionItems([]);
             setIsPrescribing(false);
         } catch (error) {
             console.error("Prescription failed", error);
             toast.error("Failed to issue prescription");
         } finally {
             setLoading(false);
         }
     };

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50 min-h-screen text-sm">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all shadow-sm"
                    >
                        <FaArrowLeft className="w-3 h-3" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-0.5">
                            <FaUserCircle className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Clinical Profile</span>
                        </div>
                        <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase font-outfit">{patient.first_name} {patient.last_name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                     <button 
                         onClick={() => setIsPrescribing(!isPrescribing)}
                         className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-tight flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                     >
                         <FaCalendarPlus className="w-3 h-3" />
                         {isPrescribing ? 'Close Form' : 'Prescribe Now'}
                     </button>
                </div>
            </header>

            <main className="flex-1 p-5 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Side Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl font-black mb-4 ring-4 ring-white shadow-xl shadow-emerald-50">
                                {patient.first_name[0]}{patient.last_name[0]}
                            </div>
                            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">{patient.first_name} {patient.last_name}</h2>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: RX-{patient.id.toString().padStart(4, '0')}</p>
                            
                            <div className="mt-6 w-full space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">{patient.status || 'Active'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">DOB</span>
                                    <span className="text-[12px] font-black text-slate-900 tabular-nums">{patient.date_of_birth || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Phone</span>
                                    <span className="text-[12px] font-black text-slate-900 tabular-nums">{patient.phone_number || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                            <FaBriefcaseMedical className="text-red-500" />
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Medical Alerts</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical Allergies</p>
                                <p className="text-[12px] font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{patient.allergies || 'No allergies recorded'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chronic Status</p>
                                <p className="text-[12px] font-bold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">{patient.chronic_conditions || 'None known'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                 {/* Main Content Area */}
                 <div className="lg:col-span-2 space-y-6">
                     {isPrescribing && (
                         <div className="bg-white rounded-2xl border border-emerald-200 shadow-xl shadow-emerald-50 overflow-hidden animate-in slide-in-from-top duration-300">
                             <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                                 <div className="flex items-center gap-2 text-emerald-700">
                                     <FaCapsules />
                                     <h3 className="text-[12px] font-black uppercase tracking-widest">New Prescription Entry</h3>
                                 </div>
                                 <button onClick={addPrescriptionItem} className="text-[11px] font-black text-emerald-600 border border-emerald-200 bg-white px-3 py-1 rounded-lg hover:bg-emerald-100 transition-all flex items-center gap-1">
                                     <FaPlus className="w-2 h-2" /> Add Drug
                                 </button>
                             </div>
                             
                             <div className="p-6 space-y-4">
                                 {prescriptionItems.length === 0 ? (
                                     <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                                         <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">No drugs added to list</p>
                                         <button onClick={addPrescriptionItem} className="mt-2 text-emerald-500 font-bold hover:underline">Click to start adding</button>
                                     </div>
                                 ) : (
                                     <div className="space-y-3">
                                         {prescriptionItems.map((item, idx) => (
                                             <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded-xl border border-slate-100 ring-1 ring-white">
                                                 <div className="col-span-12 md:col-span-5 space-y-1">
                                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Medication</label>
                                                     <select 
                                                         value={item.drug}
                                                         onChange={(e) => handleItemChange(idx, 'drug', e.target.value)}
                                                         className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-black outline-none"
                                                     >
                                                         <option value="">-- Choose --</option>
                                                         {drugs.map(d => (
                                                             <option key={d.id} value={d.id}>{d.name} ({d.dosage})</option>
                                                         ))}
                                                     </select>
                                                 </div>
                                                 <div className="col-span-4 md:col-span-2 space-y-1">
                                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</label>
                                                     <input 
                                                         type="number" 
                                                         value={item.quantity}
                                                         onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                                         className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-black outline-none" 
                                                     />
                                                 </div>
                                                 <div className="col-span-6 md:col-span-4 space-y-1">
                                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Directions</label>
                                                     <input 
                                                         type="text" 
                                                         value={item.directions}
                                                         onChange={(e) => handleItemChange(idx, 'directions', e.target.value)}
                                                         placeholder="1x3 Daily..."
                                                         className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-black outline-none" 
                                                     />
                                                 </div>
                                                 <div className="col-span-2 md:col-span-1 flex justify-center pb-2">
                                                     <button onClick={() => removePrescriptionItem(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                                                         <FaTrash className="w-3 h-3" />
                                                     </button>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                                 
                                 <div className="pt-4 flex justify-end">
                                     <button 
                                         onClick={handlePrescribe}
                                         disabled={loading || prescriptionItems.length === 0}
                                         className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-tight hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                                     >
                                         Authorize Prescription
                                     </button>
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* Prescription Entry Point Card */}
                     {!isPrescribing && (
                         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 flex items-center justify-between group hover:border-emerald-200 transition-all cursor-pointer" onClick={() => setIsPrescribing(true)}>
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                     <FaFilePrescription />
                                 </div>
                                 <div>
                                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Prescription Operations</h3>
                                     <p className="text-[12px] font-bold text-slate-400 mt-0.5">Issue new clinical medication authorizations for this patient.</p>
                                 </div>
                             </div>
                             <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-tight text-[12px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                                 Issue New Rx
                             </button>
                         </div>
                     )}

                     {/* Clinical Quick Actions */}
                     <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
                         <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-50">
                             <FaStethoscope className="text-emerald-500" />
                             <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Clinical Quick Actions</h3>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                             {[
                                 { label: 'Clinical Notes', icon: <FaNotesMedical />, color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-500' },
                                 { label: 'Physician Orders', icon: <FaClipboardList />, color: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-500' },
                                 { label: 'Investigations', icon: <FaMicroscope />, color: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-500' },
                                 { label: 'Prescriptions', icon: <FaFilePrescription />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500', action: () => setIsPrescribing(true) },
                                 { label: 'Patient Vitals', icon: <FaHeartbeat />, color: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-500' },
                                 { label: 'Transfer Patient', icon: <FaExchangeAlt />, color: 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-500' },
                                 { label: 'Discharge Patient', icon: <FaDoorOpen />, color: 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-500' },
                             ].map((btn, idx) => (
                                 <button 
                                     key={idx}
                                     onClick={btn.action || (() => toast.success(`${btn.label} module coming soon!`))}
                                     className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${btn.color.split(' hover:')[0]} hover:text-white ${btn.color.split(' ')[4]} transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg active:scale-95`}
                                 >
                                     <div className="text-xl mb-2 group-hover:scale-110 transition-transform">
                                         {btn.icon}
                                     </div>
                                     <span className="text-[10px] font-black uppercase tracking-tight text-center leading-tight">
                                         {btn.label.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
                                     </span>
                                 </button>
                             ))}
                         </div>
                     </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FaHistory className="text-blue-500" />
                                <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Clinical History</h3>
                            </div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Last Modified: Just Now</span>
                        </div>
                        
                         <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                 <div className="flex items-center gap-2">
                                     <FaNotesMedical className="text-slate-400" />
                                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Medication History</p>
                                 </div>
                                 
                                 <div className="space-y-3">
                                     {prescriptions.length === 0 ? (
                                         <p className="text-[11px] font-bold text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                                             No past prescriptions recorded for this patient.
                                         </p>
                                     ) : (
                                         prescriptions.map((rx) => (
                                             <div key={rx.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                                 <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                                                     <span className="text-[12px] font-black text-slate-900">{rx.prescription_id}</span>
                                                     <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(rx.created_at).toLocaleDateString()}</span>
                                                 </div>
                                                 <div className="space-y-1.5">
                                                     {rx.items && rx.items.map((item, idx) => (
                                                         <div key={idx} className="flex justify-between items-center text-[12px]">
                                                             <div className="flex flex-col">
                                                                 <span className="font-black text-slate-700 uppercase">{item.drug_name}</span>
                                                                 <span className="text-[10px] text-slate-400">{item.directions}</span>
                                                             </div>
                                                             <span className="font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">x{item.quantity}</span>
                                                         </div>
                                                     ))}
                                                 </div>
                                             </div>
                                         ))
                                     )}
                                 </div>
                            </div>

                            <div className="space-y-4">
                                 <div className="flex items-center gap-2">
                                     <FaHistory className="text-slate-400" />
                                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Dispensary & Purchase History</p>
                                 </div>
                                 
                                 <div className="space-y-3">
                                     {sales.length === 0 ? (
                                         <p className="text-[11px] font-bold text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                                             No purchase records found for this patient.
                                         </p>
                                     ) : (
                                         sales.map((sale) => (
                                             <div key={sale.id} className="bg-white p-4 rounded-xl border border-slate-100 space-y-2 shadow-sm hover:border-emerald-200 transition-all">
                                                 <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                                                     <div className="flex items-center gap-2">
                                                        <span className="text-[12px] font-black text-slate-900">#{sale.id}</span>
                                                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase">SALE</span>
                                                     </div>
                                                     <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(sale.created_at).toLocaleDateString()}</span>
                                                 </div>
                                                 <div className="flex justify-between items-end">
                                                     <div className="space-y-1">
                                                         <p className="text-[10px] font-extrabold text-slate-400 uppercase">Total Amount</p>
                                                         <p className="text-[14px] font-black text-emerald-600 tabular-nums">₦{sale.total_amount}</p>
                                                     </div>
                                                     <div className="text-right">
                                                         <p className="text-[10px] font-extrabold text-slate-400 uppercase">Staff</p>
                                                         <p className="text-[11px] font-bold text-slate-600">{sale.staff_name || 'System'}</p>
                                                     </div>
                                                 </div>
                                             </div>
                                         ))
                                     )}
                                 </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-slate-100">
                                 <div className="flex items-center gap-2">
                                     <FaNotesMedical className="text-slate-400" />
                                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Clinical Observations</p>
                                 </div>
                                 <p className="text-[11px] font-bold leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-slate-500">
                                     {patient.notes || "No clinical observations have been logged."}
                                 </p>
                            </div>

                           <div className="grid grid-cols-2 gap-4">
                               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient Activity</p>
                                   <div className="flex justify-between items-center">
                                       <div className="text-center">
                                           <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight">{prescriptions.length}</p>
                                           <p className="text-[8px] font-black text-slate-400 uppercase">Rx</p>
                                       </div>
                                       <div className="w-px h-6 bg-slate-200"></div>
                                       <div className="text-center">
                                           <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight">{sales.length}</p>
                                           <p className="text-[8px] font-black text-slate-400 uppercase">Sales</p>
                                       </div>
                                   </div>
                               </div>
                               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Address Information</p>
                                   <p className="text-[12px] font-bold text-slate-500 leading-tight">
                                       {patient.address || 'No residential data available'}
                                   </p>
                               </div>
                           </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PatientPage;
