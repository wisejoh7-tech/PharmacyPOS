import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import MobileBottomNav from './MobileBottomNav';
import PrivateRoute from './PrivateRoute';
import { AuthContext } from '../context/AuthContext';

const renderNavigation = (user) => render(
  <AuthContext.Provider value={{ user, loading: false }}>
    <MemoryRouter>
      <MobileBottomNav onToggleSidebar={() => {}} />
    </MemoryRouter>
  </AuthContext.Provider>,
);

describe('admin-only Dashboard navigation', () => {
  it('shows Dashboard in mobile navigation for admins', () => {
    renderNavigation({ username: 'admin', role: 'Admin', isAdmin: true });
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/');
  });

  it('does not show Dashboard in mobile navigation for staff', () => {
    renderNavigation({ username: 'cashier', role: 'Sales Attendant', isAdmin: false });
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'POS' })).toHaveAttribute('href', '/pos');
  });

  it('redirects non-admin users who open the Dashboard route to POS', () => {
    render(
      <AuthContext.Provider value={{ user: { username: 'rep', role: 'Sales Rep', isAdmin: false }, loading: false }}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<PrivateRoute adminOnly><div>Admin Dashboard</div></PrivateRoute>} />
            <Route path="/pos" element={<div>POS Workspace</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText('POS Workspace')).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });
});
