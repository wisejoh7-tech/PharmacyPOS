import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TabProvider } from './context/TabContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import api from './services/api';
import { APP_VERSION } from './config';

// Import Pages
import AdminLogin from './pages/AdminLogin';
import StaffManagement from './pages/StaffManagement';
import AddNewStaff from './pages/AddNewStaff';
import SalesReport from './pages/SalesReport';
import InventoryTurnover from './pages/InventoryTurnover';
import StaffAttendanceReport from './pages/StaffAttendanceReport';
import PharmacyDashboard from './pages/PharmacyDashboard';
import UploadPrescription from './pages/UploadPrescription';
import DetailPrescriptionReview from './pages/DetailPrescriptionReview';
import InventoryManagement from './pages/InventoryManagement';
import CategoryManagement from './pages/CategoryManagement';
import AddNewDrugs from './pages/AddNewDrugs';
import CustomerManagement from './pages/CustomerManagement';
import AddCustomer from './pages/AddCustomer';
import PointOfSales from './pages/PointOfSales';
import StaffSalesDashboard from './pages/StaffSalesDashboard';
import SaleReturn from './pages/SaleReturn';
import StaffRegistration from './pages/StaffRegistration';
import SupermarketDashboard from './pages/SupermarketDashboard';
import SupermarketInventory from './pages/SupermarketInventory';
import AddNewProduct from './pages/AddNewProduct';
import PatientPage from './pages/PatientPage';
import Prescription from './pages/Prescription';
import PrescriptionManagement from './pages/PrescriptionManagement';
import SupermarketPOS from './pages/SupermarketPOS';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import NotificationSettings from './pages/NotificationSettings';
import StaffPerformanceReport from './pages/StaffPerfomanceReport';
import ExpenseManagement from './pages/ExpenseManagement';
import Financials from './pages/Financials';
import ClinicalAssistant from './pages/ClinicalAssistant';
import StaffEducation from './pages/StaffEducation';
import './App.css';

function App() {
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const res = await api.get('health-check/');
        if (res.data && res.data.version && res.data.version !== APP_VERSION) {
          toast((t) => (
            <div className="flex flex-col gap-2">
              <span className="font-bold">New Update Available!</span>
              <p className="text-xs text-gray-600">A new version of the app is available. Your data will be preserved.</p>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  window.location.reload();
                }}
                className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
              >
                Reload to update
              </button>
            </div>
          ), {
            duration: Infinity,
            position: 'bottom-right',
            icon: '🚀'
          });
        }
      } catch (err) {
        console.error("Update check failed", err);
      }
    };

    // Check on mount
    checkUpdate();
    
    // Check every 5 minutes
    const interval = setInterval(checkUpdate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <TabProvider>
          <Toaster position="top-right" />
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <PharmacyDashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/categories" element={
            <PrivateRoute allowedRoles={['sales_rep']}>
              <Layout>
                <CategoryManagement />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/clinical-assistant" element={
            <PrivateRoute adminOnly={true}>
              <Layout>
                <ClinicalAssistant />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/staff/education" element={
            <PrivateRoute adminOnly={true}>
              <Layout>
                <StaffEducation />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/staff/new" element={
            <PrivateRoute adminOnly={true}>
              <Layout>
                <StaffRegistration />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/staff/edit/:id" element={
            <PrivateRoute adminOnly={true}>
              <Layout>
                <StaffRegistration />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/staff" element={
            <PrivateRoute adminOnly={true}>
              <Layout>
                <StaffManagement />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/staff/dashboards" element={
            <PrivateRoute adminOnly={true}>
              <Layout>
                <StaffSalesDashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/reports/sales" element={
            <PrivateRoute allowedRoles={['sales_rep']}>
              <Layout>
                <SalesReport />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/reports/inventory" element={
            <PrivateRoute allowedRoles={['sales_rep']}>
              <Layout>
                <InventoryTurnover />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/reports/attendance" element={
            <PrivateRoute adminOnly={true}>
              <Layout>
                <StaffAttendanceReport />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/reports/performance" element={
            <PrivateRoute adminOnly={true}>
              <Layout>
                <StaffPerformanceReport />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/expenses" element={
            <PrivateRoute adminOnly={true}>
              <Layout>
                <ExpenseManagement />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/financials" element={
            <PrivateRoute adminOnly={true}>
              <Layout>
                <Financials />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/pos" element={
            <PrivateRoute allowedRoles={['sales_attendant', 'sales_rep']}>
              <Layout>
                <PointOfSales />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/sales/return" element={
            <PrivateRoute allowedRoles={['sales_attendant', 'sales_rep']}>
              <Layout>
                <SaleReturn />
              </Layout>
            </PrivateRoute>
          } />
           <Route path="/prescriptions/upload" element={
             <PrivateRoute allowedRoles={['pharmacist']}>
               <Layout>
                 <UploadPrescription />
               </Layout>
             </PrivateRoute>
           } />
           <Route path="/prescriptions/review" element={
             <PrivateRoute allowedRoles={['pharmacist', 'nurse']}>
               <Layout>
                 <DetailPrescriptionReview />
               </Layout>
             </PrivateRoute>
           } />
            <Route path="/prescriptions/new" element={
               <PrivateRoute allowedRoles={['pharmacist']}>
                 <Layout>
                   <Prescription />
                 </Layout>
               </PrivateRoute>
             } />
           <Route path="/prescriptions/manage" element={
              <PrivateRoute allowedRoles={['pharmacist', 'nurse']}>
                <Layout>
                  <PrescriptionManagement />
                </Layout>
              </PrivateRoute>
            } />
          <Route path="/inventory" element={
            <PrivateRoute allowedRoles={['sales_rep']}>
              <Layout>
                <InventoryManagement />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/inventory/new" element={
            <PrivateRoute allowedRoles={['sales_rep']}>
              <Layout>
                <AddNewDrugs />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/inventory/edit/:id" element={
            <PrivateRoute allowedRoles={['sales_rep']}>
              <Layout>
                <AddNewDrugs />
              </Layout>
            </PrivateRoute>
          } />
           <Route path="/customers" element={
             <PrivateRoute allowedRoles={['pharmacist', 'nurse']}>
               <Layout>
                 <CustomerManagement />
               </Layout>
             </PrivateRoute>
           } />
           <Route path="/customers/new" element={
             <PrivateRoute allowedRoles={['pharmacist']}>
               <Layout>
                 <AddCustomer />
               </Layout>
             </PrivateRoute>
           } />
           <Route path="/customers/detail/:id" element={
              <PrivateRoute allowedRoles={['pharmacist', 'nurse']}>
                <Layout>
                  <PatientPage />
                </Layout>
              </PrivateRoute>
            } />

           {/* Supermarket Routes */}
           <Route path="/supermarket" element={
              <PrivateRoute allowedRoles={['sales_rep']}>
                <Layout>
                  <SupermarketDashboard />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/supermarket/inventory" element={
              <PrivateRoute allowedRoles={['sales_rep']}>
                <Layout>
                  <SupermarketInventory />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/supermarket/inventory/new" element={
              <PrivateRoute allowedRoles={['sales_rep']}>
                <Layout>
                  <AddNewProduct />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/supermarket/inventory/edit/:id" element={
              <PrivateRoute allowedRoles={['sales_rep']}>
                <Layout>
                  <AddNewProduct />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/supermarket/pos" element={
              <PrivateRoute allowedRoles={['sales_attendant', 'sales_rep']}>
                <Layout>
                  <SupermarketPOS />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute adminOnly={true}>
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/settings/notifications" element={
              <PrivateRoute adminOnly={true}>
                <Layout>
                  <NotificationSettings />
                </Layout>
              </PrivateRoute>
            } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </TabProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
