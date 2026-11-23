import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PointOfSales from './PointOfSales';
import SupermarketPOS from './SupermarketPOS';
import { AuthContext } from '../context/AuthContext';

vi.mock('../services/drugService', () => ({
  default: { getDrugs: vi.fn().mockResolvedValue({ data: [] }) },
}));
vi.mock('../services/productService', () => ({
  default: { getProducts: vi.fn().mockResolvedValue({ data: [] }) },
}));
vi.mock('../services/categoryService', () => ({
  default: { getCategories: vi.fn().mockResolvedValue({ data: [] }) },
}));
vi.mock('../services/staffService', () => ({
  default: { getStaff: vi.fn().mockResolvedValue({ data: [] }) },
}));
vi.mock('../services/customerService', () => ({
  default: { getCustomers: vi.fn().mockResolvedValue({ data: [] }), createCustomer: vi.fn() },
}));
vi.mock('../services/settingsService', () => ({
  default: { getSettings: vi.fn().mockResolvedValue({ data: [{ shop_name: 'Test Pharmacy', address: '1 Test Street' }] }) },
}));
vi.mock('../services/barcodeService', () => ({
  default: {},
}));
vi.mock('../services/posService', () => ({
  default: {},
}));
vi.mock('../services/supermarketSaleService', () => ({
  default: {},
}));
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const renderWithAuth = (ui) => render(
  <AuthContext.Provider value={{ user: { username: 'attendant01', fullName: 'Attendant One' } }}>
    <MemoryRouter>{ui}</MemoryRouter>
  </AuthContext.Provider>,
);

describe('POS switching', () => {
  it('offers a link from Pharmacy POS to Supermarket POS', async () => {
    renderWithAuth(<PointOfSales />);

    const switchLink = await screen.findByRole('link', { name: /switch to supermarket pos/i });
    expect(switchLink).toHaveAttribute('href', '/supermarket/pos');
  });

  it('offers a link from Supermarket POS to Pharmacy POS', async () => {
    renderWithAuth(<SupermarketPOS />);

    const switchLink = await screen.findByRole('link', { name: /switch to pharmacy pos/i });
    expect(switchLink).toHaveAttribute('href', '/pos');
  });
});
