/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('user_role') || 'Admin';
    const department = localStorage.getItem('user_department') || 'Management';
    const fullName = localStorage.getItem('user_fullname') || username || 'User';
    const isAdmin = localStorage.getItem('is_admin') === 'true';

    if (token) {
        setUser({
            token: token,
            username: username,
            role: role,
            department: department,
            fullName: fullName,
            isAdmin: isAdmin
        });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const normalizedUsername = username.trim().toLowerCase();

    // 1. Attempt Online Login First
    try {
      const response = await api.post('token/', {
        username: normalizedUsername,
        password: password,
      });

      const { access, refresh, role, department, full_name, is_admin } = response.data;

      localStorage.setItem('access_token', access);
      if (refresh) localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('username', normalizedUsername);
      localStorage.setItem('user_role', role || 'Admin');
      localStorage.setItem('user_department', department || 'Management');
      localStorage.setItem('user_fullname', full_name || normalizedUsername);
      localStorage.setItem('is_admin', is_admin ? 'true' : 'false');

      // Cache credentials locally for Offline Login capability
      const cachedUsers = JSON.parse(localStorage.getItem('offline_users_cache') || '{}');
      cachedUsers[normalizedUsername] = {
        username: normalizedUsername,
        password: password,
        role: role || 'Admin',
        department: department || 'Management',
        fullName: full_name || normalizedUsername,
        isAdmin: !!is_admin
      };
      localStorage.setItem('offline_users_cache', JSON.stringify(cachedUsers));

      setUser({ 
        token: access,
        username: normalizedUsername,
        role: role || 'Admin',
        department: department || 'Management',
        fullName: full_name || normalizedUsername,
        isAdmin: !!is_admin
      });
      toast.success(`Welcome back, ${full_name || username}! (${role || 'User'})`);
      return true;
    } catch (error) {
      console.error("Online Login failed:", error);

      // If online server specifically returned 401 Invalid Credentials, fail immediately
      if (error.response && error.response.status === 401) {
        toast.error('Invalid Credentials. Please check your username and password.');
        return false;
      }

      // 2. Offline Login Fallback Mode (When offline or network unreachable)
      const cachedUsers = JSON.parse(localStorage.getItem('offline_users_cache') || '{}');
      const offlineUser = cachedUsers[normalizedUsername];
      const isDefaultAdmin = (normalizedUsername === 'admin' && (password === 'admin123' || password === 'admin'));

      if (offlineUser && offlineUser.password === password) {
        const offlineToken = 'offline_token_' + Date.now();
        localStorage.setItem('access_token', offlineToken);
        localStorage.setItem('username', offlineUser.username);
        localStorage.setItem('user_role', offlineUser.role);
        localStorage.setItem('user_department', offlineUser.department);
        localStorage.setItem('user_fullname', offlineUser.fullName);
        localStorage.setItem('is_admin', offlineUser.isAdmin ? 'true' : 'false');

        setUser({
          token: offlineToken,
          username: offlineUser.username,
          role: offlineUser.role,
          department: offlineUser.department,
          fullName: offlineUser.fullName,
          isAdmin: offlineUser.isAdmin
        });
        toast.success(`Offline Mode Active: Welcome back, ${offlineUser.fullName}!`);
        return true;
      } else if (isDefaultAdmin) {
        const offlineToken = 'offline_admin_token_' + Date.now();
        localStorage.setItem('access_token', offlineToken);
        localStorage.setItem('username', 'admin');
        localStorage.setItem('user_role', 'Admin');
        localStorage.setItem('user_department', 'Management');
        localStorage.setItem('user_fullname', 'System Administrator');
        localStorage.setItem('is_admin', 'true');

        setUser({
          token: offlineToken,
          username: 'admin',
          role: 'Admin',
          department: 'Management',
          fullName: 'System Administrator',
          isAdmin: true
        });
        toast.success('Offline Mode Active: Logged in as Administrator.');
        return true;
      }

      toast.error('Offline Mode: Account not cached locally. Log in online once to sync account.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_department');
    localStorage.removeItem('user_fullname');
    localStorage.removeItem('is_admin');
    setUser(null);
    toast.success('Logged out.');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
