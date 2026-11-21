import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerSelector from './CustomerSelector';
import customerService from '../services/customerService';
import toast from 'react-hot-toast';

vi.mock('../services/customerService', () => ({
  default: {
    getCustomers: vi.fn(),
    createCustomer: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('CustomerSelector quick registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    customerService.getCustomers.mockResolvedValue({ data: [] });
  });

  it('registers a customer, attaches it to the sale, and closes the form', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    customerService.createCustomer.mockResolvedValue({
      data: { id: 42, first_name: 'Ada', last_name: 'Lovelace', phone_number: '08012345678' },
    });

    render(<CustomerSelector value="" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /new customer/i }));
    await user.type(screen.getByPlaceholderText('First name'), 'Ada');
    await user.type(screen.getByPlaceholderText('Last name'), 'Lovelace');
    await user.type(screen.getByPlaceholderText('Phone number'), '08012345678');
    await user.click(screen.getByRole('button', { name: /register customer/i }));

    await waitFor(() => expect(customerService.createCustomer).toHaveBeenCalledWith(expect.objectContaining({
      first_name: 'Ada',
      last_name: 'Lovelace',
      phone_number: '08012345678',
      date_of_birth: null,
      email: null,
    })));
    expect(onChange).toHaveBeenCalledWith('42');
    expect(screen.queryByRole('heading', { name: /register customer/i })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Ada Lovelace.*08012345678/ })).toBeInTheDocument();
  });

  it('does not submit when required customer fields are empty', async () => {
    const user = userEvent.setup();
    render(<CustomerSelector value="" onChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /new customer/i }));
    fireEvent.submit(screen.getByRole('button', { name: /register customer/i }).closest('form'));

    expect(customerService.createCustomer).not.toHaveBeenCalled();
  });

  it('shows the API error and keeps the form open when registration fails', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    customerService.createCustomer.mockRejectedValue({
      response: { data: { detail: 'A customer with this phone already exists.' } },
    });

    render(<CustomerSelector value="" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /new customer/i }));
    await user.type(screen.getByPlaceholderText('First name'), 'Ada');
    await user.type(screen.getByPlaceholderText('Last name'), 'Lovelace');
    await user.type(screen.getByPlaceholderText('Phone number'), '08012345678');
    await user.click(screen.getByRole('button', { name: /register customer/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('A customer with this phone already exists.'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /register customer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register customer/i })).toBeEnabled();
  });

  it('rejects a successful response without a customer ID', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    customerService.createCustomer.mockResolvedValue({ data: { first_name: 'Ada' } });

    render(<CustomerSelector value="" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /new customer/i }));
    await user.type(screen.getByPlaceholderText('First name'), 'Ada');
    await user.type(screen.getByPlaceholderText('Last name'), 'Lovelace');
    await user.type(screen.getByPlaceholderText('Phone number'), '08012345678');
    await user.click(screen.getByRole('button', { name: /register customer/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Customer registration returned no customer ID.'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /register customer/i })).toBeInTheDocument();
  });
});
