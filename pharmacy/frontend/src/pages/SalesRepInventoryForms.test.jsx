import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AddNewDrugs from './AddNewDrugs';
import AddNewProduct from './AddNewProduct';
import { AuthContext } from '../context/AuthContext';

vi.mock('../services/categoryService', () => ({
  default: {
    getCategories: vi.fn().mockResolvedValue({ data: [] }),
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

vi.mock('../services/drugService', () => ({
  default: {
    getDrug: vi.fn(),
    addDrug: vi.fn(),
    updateDrug: vi.fn(),
  },
}));

vi.mock('../services/productService', () => ({
  default: {
    getProduct: vi.fn(),
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const salesRep = {
  username: 'sales-rep-01',
  fullName: 'Sales Rep One',
  role: 'Sales Rep',
  isAdmin: false,
};

const renderForSalesRep = (ui) => render(
  <AuthContext.Provider value={{ user: salesRep }}>
    <MemoryRouter>{ui}</MemoryRouter>
  </AuthContext.Provider>,
);

describe('Sales Rep inventory form permissions', () => {
  it('keeps pharmacy inventory entry available but hides price input', async () => {
    const { container } = renderForSalesRep(<AddNewDrugs />);

    await waitFor(() => {
      expect(container.querySelector('[name="name"]')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /authorize/i })).toBeInTheDocument();
      expect(document.querySelector('[name="unit_price"]')).not.toBeInTheDocument();
      expect(screen.queryByText(/price \(₦\)/i)).not.toBeInTheDocument();
    });
  });

  it('keeps supermarket inventory entry available but hides price input', async () => {
    const { container } = renderForSalesRep(<AddNewProduct />);

    await waitFor(() => {
      expect(container.querySelector('[name="name"]')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /provision product/i })).toBeInTheDocument();
      expect(document.querySelector('[name="unit_price"]')).not.toBeInTheDocument();
      expect(screen.queryByText(/unit price \(₦\)/i)).not.toBeInTheDocument();
    });
  });
});
