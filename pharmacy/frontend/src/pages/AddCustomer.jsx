import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import customerService from '../services/customerService';
import toast from 'react-hot-toast';
import { FaUserPlus, FaTimes, FaUser, FaHistory, FaPlus, FaCamera } from 'react-icons/fa';
import { useRef } from 'react';

const AddCustomer = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const isEditing = Boolean(customerId);
  const [loading, setLoading] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(Boolean(customerId));
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone_number: '',
    email: '',
    address: '',
    allergies: '',
    chronic_conditions: '',
    medications: '',
    gender: 'Male',
    photo: null,
  });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;

    customerService.getCustomer(customerId)
      .then(({ data }) => {
        if (!data) throw new Error('Customer record was not found.');
        if (!cancelled) {
          setFormData(previous => ({
            ...previous,
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            date_of_birth: data.date_of_birth || '',
            phone_number: data.phone_number || '',
            email: data.email || '',
            address: data.address || '',
            allergies: data.allergies || '',
            chronic_conditions: data.chronic_conditions || '',
            medications: data.medications || '',
            photo: data.photo || null,
          }));
        }
      })
      .catch(error => {
        console.error('Error loading customer:', error);
        toast.error('Could not load customer record.');
        navigate('/customers');
      })
      .finally(() => {
        if (!cancelled) setLoadingCustomer(false);
      });

    return () => { cancelled = true; };
  }, [customerId, navigate]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Camera access failed.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setFormData(prev => ({ ...prev, photo: dataUrl }));
      stopCamera();
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      if (!formData.first_name || !formData.last_name || !formData.date_of_birth) {
        toast.error("Name and Date of Birth are mandatory.");
        return;
      }
      setLoading(true);
      const payload = {
        ...formData,
        ...(!isEditing && { customer_id: `CUST-${Math.floor(Math.random() * 10000)}` }),
        date_of_birth: formData.date_of_birth || null,
        email: formData.email || null,
        phone_number: formData.phone_number || "N/A"
      };

      if (isEditing) {
        await customerService.updateCustomer(customerId, payload);
      } else {
        await customerService.createCustomer(payload);
      }

      toast.success(isEditing ? 'Customer details updated.' : 'Patient registry updated.');
      navigate('/customers');
    } catch (error) {
      console.error(error);
      toast.error('Registry failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden text-sm bg-slate-50/30">
        <header className="bg-white px-5 py-3 border-b border-slate-100 flex justify-between items-center h-14">
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase font-outfit leading-none">{isEditing ? 'Edit Customer Profile' : 'Add Patient Profile'}</h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry of medical clinical history</p>
          </div>
          <div className="flex gap-3">
            <button className="text-[12px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 hover:bg-slate-50 rounded-lg" onClick={() => navigate('/customers')}>Discard</button>
            <button className="bg-emerald-500 text-white text-[12px] font-black uppercase tracking-widest px-6 py-2 rounded-lg border border-emerald-500 shadow-none hover:bg-emerald-600 transition-all min-w-[140px]" onClick={handleSave} disabled={loading || loadingCustomer}>
              {loading ? "SAVING..." : isEditing ? "SAVE CHANGES" : "AUTHORIZE PROFILE"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 md:p-8">
           <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
              
              {/* Left Column */}
              <div className="space-y-6">
                 <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-3">
                       <FaUser className="text-emerald-500 text-xs" />
                       <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Personal Identification</span>
                    </div>
                    
                    <div className="flex flex-col items-center mb-8">
                       <div className="relative w-32 h-32 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 overflow-hidden border border-slate-200 shadow-inner">
                          {isCameraOpen ? (
                             <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                          ) : formData.photo ? (
                             <img src={formData.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                             <FaUser className="w-10 h-10 text-slate-300" />
                          )}
                          
                          {!isCameraOpen && (
                             <button onClick={startCamera} className="absolute bottom-2 right-2 bg-emerald-500 text-white p-2 rounded-lg shadow-lg">
                                <FaCamera className="w-3 h-3" />
                             </button>
                          )}
                       </div>
                       
                       {isCameraOpen && (
                          <div className="flex gap-2 mb-4 w-full max-w-[200px]">
                             <button onClick={capturePhoto} className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Capture</button>
                             <button onClick={stopCamera} className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[9px]"><FaTimes /></button>
                          </div>
                       )}

                       <canvas ref={canvasRef} className="hidden" />
                       
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-emerald-500 transition-colors">
                          Load Passport
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result }));
                                reader.readAsDataURL(file);
                             }
                          }} />
                       </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">First Name</label>
                          <input 
                            type="text" 
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[13px] font-black text-slate-900 outline-none uppercase"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                          <input 
                            type="text" 
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[13px] font-black text-slate-900 outline-none uppercase"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">DOB</label>
                          <input 
                            type="date" 
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[13px] font-black text-slate-900 outline-none"
                          />
                       </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                           <select 
                             name="gender" 
                             value={formData.gender}
                             onChange={handleChange}
                             className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[12px] font-black text-slate-900 outline-none appearance-none"
                           >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                           </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                          <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[13px] font-black text-slate-900 outline-none"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                          <input 
                            type="tel" 
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[13px] font-black text-slate-900 outline-none tabular-nums"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Customer Address</label>
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Street, area, city"
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[13px] font-bold text-slate-900 outline-none resize-y"
                          />
                       </div>
                    </div>
                 </section>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                 <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-3">
                       <FaHistory className="text-blue-500 text-xs" />
                       <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Clinical Matrix</span>
                    </div>

                    <div className="space-y-4">
                       <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Allergies</label>
                          <textarea
                             name="allergies"
                             value={formData.allergies}
                             onChange={handleChange}
                             rows="2"
                             placeholder="List allergies"
                             className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[13px] font-bold text-slate-900 outline-none resize-y"
                          />
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Chronic Conditions</label>
                          <textarea 
                            name="chronic_conditions"
                            value={formData.chronic_conditions}
                            onChange={handleChange}
                            rows="2" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[13px] font-bold text-slate-900 outline-none resize-none"
                          ></textarea>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">current medications</label>
                          <textarea 
                            name="medications"
                            value={formData.medications}
                            onChange={handleChange}
                            rows="2" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[13px] font-bold text-slate-900 outline-none resize-none"
                          ></textarea>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer group">
                             <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-500" />
                             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600">Diabetic</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                             <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-500" />
                             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600">Hypertension</span>
                          </label>
                       </div>
                    </div>
                 </section>
              </div>
           </div>
        </div>
    </div>
  );
};

export default AddCustomer;
