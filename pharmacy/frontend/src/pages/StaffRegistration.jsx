import React, { useState, useRef, useEffect } from 'react';
import {
  FaBell, FaCog, FaCamera, FaUser, FaTimes, FaShieldAlt, FaArrowLeft
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { addToSyncQueue } from '../services/db';

const StaffRegistration = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone_number: '',
    role: '',
    department: '',
    password: '',
    employee_id: 'EP-' + Math.floor(Math.random() * 100000)
  });
  const [autoGenerate, setAutoGenerate] = useState(!isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isEditMode) {
      const fetchStaffMember = async () => {
        try {
          setLoading(true);
          const response = await api.get(`staff/${id}/`);
          const data = response.data;
          setFormData({
            full_name: data.full_name || '',
            email: data.email || '',
            phone_number: data.phone_number || '',
            role: data.role || '',
            department: data.department || '',
            employee_id: data.employee_id || ''
          });
          if (data.photo) {
            setCapturedImage(data.photo);
          }
          setAutoGenerate(false);
        } catch (error) {
          console.error("Failed to load staff member data", error);
          toast.error("Failed to load staff details.");
          navigate('/staff');
        } finally {
          setLoading(false);
        }
      };
      fetchStaffMember();
    }
  }, [id, isEditMode, navigate]);

  const [cameraStream, setCameraStream] = useState(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      setCameraStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error("Camera access denied. Please allow camera permissions in site settings.");
      } else {
        toast.error("Camera device not found. You can upload an image file instead.");
      }
    }
  };

  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.error("Play error:", e));
    }
  }, [isCameraOpen, cameraStream]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
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
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if(!formData.full_name || !formData.role) {
      return toast.error("Required: Name & Role");
    }

    const loginName = (formData.username || formData.employee_id || '').trim();
    const loginPass = formData.password || 'admin123';
    const normalizedUser = loginName.toLowerCase();

    // Cache user credentials locally for immediate offline login capability
    const cacheCandidateCredentials = () => {
      try {
        const cachedUsers = JSON.parse(localStorage.getItem('offline_users_cache') || '{}');
        cachedUsers[normalizedUser] = {
          username: normalizedUser,
          password: loginPass,
          role: formData.role || 'Staff',
          department: formData.department || 'General',
          fullName: formData.full_name,
          isAdmin: Boolean(formData.role && formData.role.toLowerCase().includes('admin'))
        };
        localStorage.setItem('offline_users_cache', JSON.stringify(cachedUsers));
      } catch (e) {
        console.warn("Failed to cache offline user credentials:", e);
      }
    };

    try {
      setIsSaving(true);
      const payload = { ...formData, photo: capturedImage };

      if (isEditMode) {
        await api.put(`staff/${id}/`, payload);
        toast.success(`Staff updated. Login: ${loginName}`);
      } else {
        await api.post('staff/', payload);
        toast.success(`Staff registered! Login Username: ${loginName} | Password: ${loginPass}`, { duration: 6000 });
      }

      cacheCandidateCredentials();
      navigate('/staff');
    } catch (err) {
      console.warn("Online registration failed, attempting offline save...", err);

      // Offline fallback: cache candidate locally & queue for sync
      try {
        cacheCandidateCredentials();
        await addToSyncQueue(isEditMode ? 'PUT' : 'POST', 'staff', { ...formData, photo: capturedImage });
        toast.success(`Offline Registration Saved! Username: ${loginName} | Password: ${loginPass}`, { duration: 6000 });
        navigate('/staff');
      } catch (offlineErr) {
        console.error("Offline registration error:", offlineErr);
        toast.error("Registration failed offline. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-slate-50">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading staff profile...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden text-xs">
        {/* Header */}
        <header className="bg-white px-5 py-3 border-b border-slate-100 flex justify-between items-center z-10 w-full h-14">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
             <button onClick={() => navigate('/staff')} className="hover:text-blue-800 flex items-center gap-1"><FaArrowLeft className="text-xs" /> Staff</button>
             <span className="text-slate-300">/</span>
             <span className="text-blue-800">{isEditMode ? 'Edit Staff Profile' : 'Registration Portal'}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <FaBell className="w-3.5 h-3.5 hover:text-blue-800 cursor-pointer" />
            <FaCog className="w-3.5 h-3.5 hover:text-blue-800 cursor-pointer" />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8 bg-slate-50">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Pharmacist Portal Top Header Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between border border-blue-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 text-white">
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                    <path d="M12 28 C12 28, 14 48, 32 48 C50 48, 52 28, 52 28 Z" fill="#60a5fa" />
                    <path d="M10 26 H54 V29 H10 Z" fill="#3b82f6" />
                    <path d="M26 48 L22 56 H42 L38 48 Z" fill="#1d4ed8" />
                    <path d="M38 12 L48 24 L42 28 L32 16 Z" fill="#93c5fd" />
                    <path d="M29 33 H35 V39 H29 Z" fill="white" />
                    <path d="M30 31 H34 V41 H30 Z" fill="white" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100/10 text-blue-100 text-[20px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-blue-400/30">
                      {isEditMode ? 'Staff Modification Portal' : 'Staff Registration Portal'}
                    </span>
                  </div>

                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <FaShieldAlt className="text-blue-300 text-sm" />

              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">

                {/* Photo Column */}
                <div className="md:w-[35%] p-8 flex flex-col items-center bg-slate-50/50">
                  <div className="relative w-32 h-32 bg-white rounded-2xl flex items-center justify-center mb-6 overflow-hidden border border-slate-200 shadow-inner">
                    {isCameraOpen ? (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    ) : capturedImage ? (
                      <img src={capturedImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FaUser className="w-10 h-10 text-slate-300" />
                    )}
                    
                    {!isCameraOpen && (
                      <button onClick={startCamera} className="absolute bottom-2 right-2 bg-blue-800 text-white p-2 rounded-lg shadow-lg hover:bg-blue-900 transition-colors">
                        <FaCamera className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  {isCameraOpen && (
                    <div className="flex gap-2 mb-4 w-full">
                      <button onClick={capturePhoto} className="flex-1 py-1.5 bg-blue-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Capture</button>
                      <button onClick={stopCamera} className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[9px]"><FaTimes /></button>
                    </div>
                  )}

                  <canvas ref={canvasRef} className="hidden" />

                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.3">Capture Face</h3>
                  <p className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-tighter mb-6">Biometric Capturing</p>
                  
                  <div className="w-full flex flex-col gap-2">
                    <label className="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest text-center cursor-pointer hover:bg-slate-50 transition-all">
                      Upload Image
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setCapturedImage(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
                </div>

                {/* Details Column */}
                <div className="md:w-[65%] p-8 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                      <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Enter Full Name..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-black text-slate-900 outline-none focus:border-blue-800" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Login Username</label>
                      <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="e.g. john_doe or cashier1" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-black text-slate-900 outline-none focus:border-blue-800" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-black text-slate-900 outline-none focus:border-blue-800" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Phone</label>
                      <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-black text-slate-900 outline-none focus:border-blue-800" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
                      <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-black text-slate-900 outline-none focus:border-blue-800">
                        <option value="">Select Role</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="tech">Technician</option>
                        <option value="nurse">Nurse</option>
                        <option value="sales-rep">Sales Rep</option>
                        <option value="sales-attendant">Sales Attendant</option>
                        <option value="admin">Desk Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Department</label>
                      <select name="department" value={formData.department} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-black text-slate-900 outline-none focus:border-blue-800">
                        <option value="">Select Dept</option>
                        <option value="clinical">Clinical</option>
                        <option value="ops">Inventory</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Account Password</label>
                      <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditMode ? "Leave blank to keep current password" : "Set account password (default: admin123)"} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-black text-slate-900 outline-none focus:border-blue-800" />
                    </div>

                    <div className="md:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-[10px] font-black text-slate-900 uppercase">System ID</span>
                         <button onClick={() => setAutoGenerate(!autoGenerate)} className={`w-8 h-4 rounded-full transition-all relative ${autoGenerate ? 'bg-blue-800' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoGenerate ? 'left-4.5' : 'left-0.5'}`} />
                         </button>
                      </div>
                      <input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} disabled={autoGenerate} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-[10px] font-black text-slate-600 uppercase" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => navigate('/staff')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 hover:text-slate-600">Cancel</button>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="bg-blue-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-xl border border-blue-900 shadow-md hover:bg-blue-950 transition-all min-w-[140px]"
                >
                  {isSaving ? "Saving..." : (isEditMode ? "Update Personnel" : "Authorize ")}
                </button>
              </div>
            </div>
          </div>
        </main>
    </div>
  );
};

export default StaffRegistration;
