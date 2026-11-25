import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const TabContext = createContext();

const STORAGE_KEY = 'pharmacy_workspace_tabs_v1';

// Default home tab configuration
const DEFAULT_HOME_TAB = {
  id: '/',
  title: 'Dashboard',
  path: '/',
  closable: false
};

// Route title mapping helper
export const getRouteTabInfo = (pathname) => {
  if (pathname === '/') return { title: 'Dashboard', closable: false };
  if (pathname === '/pos') return { title: 'POS Terminal', closable: true };
  if (pathname === '/supermarket/pos') return { title: 'Retail POS', closable: true };
  if (pathname === '/supermarket') return { title: 'Supermarket Hub', closable: true };
  if (pathname === '/supermarket/inventory') return { title: 'Retail Inventory', closable: true };
  if (pathname === '/supermarket/inventory/new') return { title: 'New Retail Product', closable: true };
  if (pathname.startsWith('/supermarket/inventory/edit')) return { title: 'Edit Retail Product', closable: true };
  if (pathname === '/inventory') return { title: 'Pharmacy Stock', closable: true };
  if (pathname === '/inventory/new') return { title: 'Add New Drug', closable: true };
  if (pathname.startsWith('/inventory/edit')) return { title: 'Edit Drug', closable: true };
  if (pathname === '/categories') return { title: 'Categories', closable: true };
  if (pathname === '/customers') return { title: 'Patients & Clients', closable: true };
  if (pathname === '/customers/new') return { title: 'New Customer', closable: true };
  if (pathname.startsWith('/customers/detail')) return { title: 'Customer Profile', closable: true };
  if (pathname === '/prescriptions/review') return { title: 'Prescriptions', closable: true };
  if (pathname === '/prescriptions/upload') return { title: 'Upload Prescription', closable: true };
  if (pathname === '/prescriptions/new') return { title: 'New Prescription', closable: true };
  if (pathname === '/prescriptions/manage') return { title: 'Manage Prescriptions', closable: true };
  if (pathname === '/clinical-assistant') return { title: 'Clinical Research', closable: true };
  if (pathname === '/staff') return { title: 'Staff List', closable: true };
  if (pathname === '/staff/new') return { title: 'Staff Registration', closable: true };
  if (pathname.startsWith('/staff/edit')) return { title: 'Edit Staff', closable: true };
  if (pathname === '/staff/dashboards') return { title: 'Staff Dashboards', closable: true };
  if (pathname === '/staff/education') return { title: 'Staff Rotation', closable: true };
  if (pathname === '/reports/sales') return { title: 'Sales Reports', closable: true };
  if (pathname === '/reports/inventory') return { title: 'Stock Turnover', closable: true };
  if (pathname === '/reports/attendance') return { title: 'Staff Attendance', closable: true };
  if (pathname === '/reports/performance') return { title: 'Staff Performance', closable: true };
  if (pathname === '/expenses') return { title: 'Expense Tracker', closable: true };
  if (pathname === '/financials') return { title: 'Financial Overview', closable: true };
  if (pathname === '/settings') return { title: 'Settings', closable: true };
  if (pathname === '/settings/notifications') return { title: 'Notifications', closable: true };
  if (pathname === '/sales/return') return { title: 'Sale Return', closable: true };

  return { title: 'Page', closable: true };
};

export const TabProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);
  const role = (user?.role || '').toLowerCase();
  const isAdmin = Boolean(user?.isAdmin || role.includes('admin') || role.includes('manager'));

  // Load initial tabs from localStorage or default
  const [tabs, setTabs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure Home tab exists
          if (!parsed.some(t => t.id === '/')) {
            return [DEFAULT_HOME_TAB, ...parsed];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to restore workspace tabs", e);
    }
    return [DEFAULT_HOME_TAB];
  });

  const [activeTabId, setActiveTabId] = useState(location.pathname || '/');

  // Persist tabs to localStorage
  useEffect(() => {
    try {
      const tabsToPersist = !loading && !isAdmin
        ? tabs.filter((tab) => tab.id !== '/' && tab.path !== '/')
        : tabs;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabsToPersist));
    } catch (e) {
      console.error("Failed to persist workspace tabs", e);
    }
  }, [tabs, loading, isAdmin]);

  // Sync current route with workspace tabs
  useEffect(() => {
    const currentPath = location.pathname;
    // Don't create tabs for login or auth pages
    if (currentPath === '/login' || currentPath === '/forgot-password') return;
    if (currentPath === '/' && !isAdmin) return;

    const { title, closable } = getRouteTabInfo(currentPath);

    setTabs((prevTabs) => {
      const existingIndex = prevTabs.findIndex((t) => t.id === currentPath || t.path === currentPath);
      if (existingIndex >= 0) {
        // Tab exists, update title if needed
        const updated = [...prevTabs];
        updated[existingIndex] = { ...updated[existingIndex], title };
        return updated;
      } else {
        // Add new tab
        return [...prevTabs, { id: currentPath, title, path: currentPath, closable }];
      }
    });

    setActiveTabId(currentPath);
  }, [location.pathname, isAdmin]);

  const openTab = useCallback((tabData) => {
    const id = tabData.id || tabData.path;
    setTabs((prevTabs) => {
      if (prevTabs.some((t) => t.id === id)) return prevTabs;
      return [...prevTabs, { ...tabData, id }];
    });
    setActiveTabId(id);
    navigate(tabData.path);
  }, [navigate]);

  const switchTab = useCallback((tabId) => {
    const target = tabs.find((t) => t.id === tabId);
    if (target) {
      setActiveTabId(tabId);
      navigate(target.path);
    }
  }, [tabs, navigate]);

  const closeTab = useCallback((tabId, e) => {
    if (e) e.stopPropagation();

    setTabs((prevTabs) => {
      const targetTab = prevTabs.find((t) => t.id === tabId);
      if (!targetTab || targetTab.closable === false) return prevTabs;

      const remainingTabs = prevTabs.filter((t) => t.id !== tabId);
      const filtered = isAdmin
        ? remainingTabs
        : remainingTabs.filter((t) => t.id !== '/' && t.path !== '/');

      // If we are closing the currently active tab, navigate to an adjacent tab
      if (activeTabId === tabId) {
        const closedIndex = prevTabs.findIndex((t) => t.id === tabId);
        const nextActive = filtered[Math.max(0, closedIndex - 1)] || (isAdmin ? DEFAULT_HOME_TAB : null);
        if (nextActive) {
          setActiveTabId(nextActive.id);
          navigate(nextActive.path);
        } else {
          setActiveTabId('/inventory');
          navigate('/inventory');
        }
      }

      return filtered.length > 0 ? filtered : (isAdmin ? [DEFAULT_HOME_TAB] : []);
    });
  }, [activeTabId, navigate, isAdmin]);

  const closeOtherTabs = useCallback((tabId) => {
    setTabs((prevTabs) => {
      const filtered = prevTabs.filter((t) => (isAdmin && t.closable === false) || t.id === tabId);
      return filtered;
    });
    switchTab(tabId);
  }, [switchTab, isAdmin]);

  const closeAllTabs = useCallback(() => {
    setTabs(isAdmin ? [DEFAULT_HOME_TAB] : []);
    const landingPath = isAdmin ? '/' : '/inventory';
    setActiveTabId(landingPath);
    navigate(landingPath);
  }, [navigate, isAdmin]);

  const visibleTabs = !loading && !isAdmin
    ? tabs.filter((tab) => tab.id !== '/' && tab.path !== '/')
    : tabs;

  return (
    <TabContext.Provider
      value={{
        tabs: visibleTabs,
        activeTabId,
        openTab,
        switchTab,
        closeTab,
        closeOtherTabs,
        closeAllTabs,
      }}
    >
      {children}
    </TabContext.Provider>
  );
};

export const useTabs = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabProvider');
  }
  return context;
};

export default TabContext;
