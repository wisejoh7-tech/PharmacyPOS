import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEyeSlash, FaUser, FaLock } from 'react-icons/fa';
import PharmacyLogo from '../components/PharmacyLogo';
import api from '../services/api';
import './AdminLogin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shopName, setShopName] = useState('New Light Medicine and Store');

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await api.get('settings/');
        if (res.data && res.data.length > 0 && res.data[0].shop_name) {
          setShopName(res.data[0].shop_name);
        }
      } catch {
        console.error("Branding load failed");
      }
    };
    fetchBranding();
  }, []);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="pharmacist-portal-container">
      {/* Main Login Card */}
      <div className="pharmacist-card-wrapper">
        <div className="pharmacist-card-header-bar"></div>
        <div className="pharmacist-card-content">

          {/* Logo Branding Header */}
          <div className="pharmacist-logo-container">
            <div className="mortar-logo-icon">
              <PharmacyLogo className="w-10 h-10 object-contain" />
            </div>
            <div className="brand-text-block">
              <span className="brand-title-primary">New Light</span>
              <span className="brand-title-secondary">Medicine and Store</span>
            </div>
          </div>

          <div className="login-title-section">
            <h2 className="login-card-title">Login Portal</h2>
          </div>

          {/* Form */}
          <form className="pharmacist-login-form" onSubmit={handleSubmit}>
            <div className="form-field-group">
              <label className="field-label">Username</label>
              <div className="input-with-icon">
                <FaUser className="field-icon-left" />
                <input
                  type="text"
                  placeholder=""
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="portal-input"
                  required
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-label">Password</label>
              <div className="input-with-icon">
                <FaLock className="field-icon-left" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="portal-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  tabIndex="-1"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-meta-row">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-label">Remember Me</span>
              </label>
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Log In'}
            </button>
          </form>

          {/* Card Footer */}
          <div className="card-footer-info">
            <p className="account-help-text">
              Need an account? <Link to="/staff/new" className="contact-admin-link">Contact Administrator</Link>
            </p>
            <p className="copyright-text">
              © {new Date().getFullYear()} {shopName}. All Rights Reserved.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
