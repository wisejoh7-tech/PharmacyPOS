import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PointOfSales from './PointOfSales';
import SupermarketPOS from './SupermarketPOS';
import { AuthContext } from '../context/AuthContext';

const staff = [{ id: 1, employee_id: 'rep-01', email: 'rep@example.com', full_name: 'Ada Attendant' }];
const customer = {
  id: 7,
  first_name: 'Grace',
  last_name: 'Hopper',
  phone_number: '08012345678',
  address: '12 Marina Road, Lagos',
};
const settings = [{ shop_name: 'New Light Pharmacy', address: '99 Health Avenue, Lagos' }];

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
  default: { getStaff: vi.fn().mockResolvedValue({ data: [{ id: 1, employee_id: 'rep-01', email: 'rep@example.com', full_name: 'Ada Attendant' }] }) },
}));
vi.mock('../services/customerService', () => ({
  default: {
    getCustomers: vi.fn().mockResolvedValue({ data: [{ id: 7, first_name: 'Grace', last_name: 'Hopper', phone_number: '08012345678', address: '12 Marina Road, Lagos' }] }),
    getCustomer: vi.fn().mockResolvedValue({ data: { id: 7, first_name: 'Grace', last_name: 'Hopper', phone_number: '08012345678', address: '12 Marina Road, Lagos' } }),
    getCachedCustomer: vi.fn().mockResolvedValue({ data: { id: 7, first_name: 'Grace', last_name: 'Hopper', phone_number: '08012345678', address: '12 Marina Road, Lagos' } }),
    createCustomer: vi.fn(),
  },
}));
vi.mock('../services/settingsService', () => ({
  default: { getSettings: vi.fn().mockResolvedValue({ data: [{ shop_name: 'New Light Pharmacy', address: '99 Health Avenue, Lagos' }] }) },
}));
vi.mock('../services/posService', () => ({
  default: { createSale: vi.fn().mockResolvedValue({ data: { id: 101 } }) },
}));
vi.mock('../services/supermarketSaleService', () => ({
  default: { processSale: vi.fn().mockResolvedValue({ data: { id: 202 } }) },
}));
vi.mock('../services/barcodeService', () => ({ default: {} }));
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const renderForStaff = (ui) => render(
  <AuthContext.Provider value={{ user: { username: 'rep-01', fullName: 'Ada Attendant', role: 'Sales Rep' } }}>
    <MemoryRouter>{ui}</MemoryRouter>
  </AuthContext.Provider>,
);

const attachCustomer = async () => {
  const customerOption = await screen.findByRole('option', { name: /Grace Hopper.*08012345678/ });
  fireEvent.change(customerOption.parentElement, { target: { value: String(customer.id) } });
};

describe('printable receipt fields', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prints the business address but not the customer address on pharmacy receipts', async () => {
    localStorage.setItem('pharmacy_cart', JSON.stringify([
      { id: 11, name: 'Paracetamol', unitPrice: 100, quantity: 2, stock: 10, barcode: 'PH-11' },
    ]));
    renderForStaff(<PointOfSales />);
    await attachCustomer();
    await userEvent.setup().click(screen.getByRole('button', { name: /finalize sale/i }));

    await waitFor(() => {
      expect(document.body).toHaveTextContent('New Light Pharmacy');
      expect(document.body).toHaveTextContent('99 Health Avenue, Lagos');
      expect(document.body).toHaveTextContent('Ada Attendant');
      expect(document.body).toHaveTextContent('Grace Hopper');
      expect(document.body).toHaveTextContent('08012345678');
      expect(document.body).not.toHaveTextContent('12 Marina Road, Lagos');
      expect(document.body).toHaveTextContent('Paracetamol x2');
      expect(document.body).toHaveTextContent('₦210.00');
    });
  });

  it('prints the business address but not the customer address on supermarket receipts', async () => {
    localStorage.setItem('supermarket_cart', JSON.stringify([
      { id: 22, name: 'Bottled Water', unitPrice: 50, quantity: 3, stock: 20, barcode: 'SM-22' },
    ]));
    renderForStaff(<SupermarketPOS />);
    await attachCustomer();
    await userEvent.setup().click(screen.getByRole('button', { name: /finalize retail sale/i }));

    await waitFor(() => {
      expect(document.body).toHaveTextContent('New Light Pharmacy');
      expect(document.body).toHaveTextContent('99 Health Avenue, Lagos');
      expect(document.body).toHaveTextContent('Ada Attendant');
      expect(document.body).toHaveTextContent('Grace Hopper');
      expect(document.body).toHaveTextContent('08012345678');
      expect(document.body).not.toHaveTextContent('12 Marina Road, Lagos');
      expect(document.body).toHaveTextContent('Bottled Water x3');
      expect(document.body).toHaveTextContent('₦161.25');
    });
  });
});
