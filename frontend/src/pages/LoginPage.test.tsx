// frontend/src/pages/LoginPage.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { loginUser } from '../api/authService';
import { useAuthStore } from '../store/authStore';

// --- Mocks ---
// Mock the entire authService module
vi.mock('../api/authService');

// Mock the entire authStore module
vi.mock('../store/authStore');

// A simple component to act as the destination for redirection tests
const MockHomePage = () => <div>Welcome to the Home Page</div>;

describe('<LoginPage />', () => {

  // Before each test, reset the mocks to ensure tests are isolated
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call the login service and redirect on successful login', async () => {
    // --- Test Setup ---
    // 1. Define the mock function for the store's login action
    const mockLoginAction = vi.fn();
    
    // 2. Mock the implementation of the hook to return our mock function
    vi.mocked(useAuthStore).mockReturnValue(mockLoginAction);
    
    // 3. Mock the API call to resolve successfully
    vi.mocked(loginUser).mockResolvedValue({
      token: 'fake-jwt-token',
      message: 'Login successful'
    });
    
    // --- Render ---
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<MockHomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // --- Action ---
    // Simulate user typing into the form
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });

    // Simulate clicking the login button
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // --- Assertions ---
    // Use `waitFor` to handle the asynchronous nature of the form submission
    await waitFor(() => {
      // Assert that our API service was called with the correct credentials
      expect(loginUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      // Assert that our Zustand store's login action was called with the token
      expect(mockLoginAction).toHaveBeenCalledWith('fake-jwt-token');

      // Assert that the user was successfully redirected to the home page
      expect(screen.getByText('Welcome to the Home Page')).toBeInTheDocument();
    });
  });

  it('should display an error message on failed login', async () => {
    // --- Test Setup ---
    // Mock the API call to reject with a specific error message
    vi.mocked(loginUser).mockRejectedValue(new Error('Incorrect email or password.'));

    // --- Render ---
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    // --- Action ---
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // --- Assertions ---
    // Wait for the error message to appear in the document and assert its presence
    await waitFor(() => {
        expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument();
    });
  });
});