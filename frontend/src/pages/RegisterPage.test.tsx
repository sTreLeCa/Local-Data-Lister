import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';
import { registerUser } from '../api/authService';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/authService');
vi.mock('../store/authStore');

const MockHomePage = () => <div>Welcome Home!</div>;

describe('<RegisterPage />', () => {
  const mockedRegisterUser = vi.mocked(registerUser);
  const mockedUseAuthStore = vi.mocked(useAuthStore);
  const mockLoginAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuthStore.mockReturnValue(mockLoginAction);
  });

  it('should call the register service and redirect on successful registration', async () => {
    mockedRegisterUser.mockResolvedValue({
      token: 'new-fake-jwt-token',
      message: 'User registered successfully!'
    });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<MockHomePage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'newuser@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockedRegisterUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'newpassword123',
      });
      expect(mockLoginAction).toHaveBeenCalledWith('new-fake-jwt-token');
      expect(screen.getByText('Welcome Home!')).toBeInTheDocument();
    });
  });

  it('should display an error message on failed registration', async () => {
    mockedRegisterUser.mockRejectedValue(new Error('Email already exists.'));

    render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });
});