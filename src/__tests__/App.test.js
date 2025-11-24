import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { get } from 'firebase/database';
import App from '../App';

// Mock Firebase completely
jest.mock('firebase/app', () => ({}));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn().mockResolvedValue(),
  getAuth: jest.fn(() => ({})),
}));
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  push: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  auth: {
    signOut: jest.fn().mockResolvedValue(),
  },
  db: {},
}));

// Mock components to avoid complex renders
jest.mock('../Pages/login', () => () => <div>Login Page</div>);
jest.mock('../Pages/Register', () => () => <div>Register Page</div>);
jest.mock('../Pages/LoadingSpinner', () => () => <div>Loading...</div>);
jest.mock('../Pages/Dashboard', () => ({ appUser }) => <div>Dashboard for {appUser?.name}</div>);
jest.mock('../Pages/ProfilePage', () => ({ appUser }) => <div>Profile for {appUser?.name}</div>);
jest.mock('../Pages/LeaveForm', () => ({ appUser }) => <div>Leave Form for {appUser?.name}</div>);
jest.mock('../Pages/AdminPage', () => ({ appUser }) => <div>Admin Page for {appUser?.name}</div>);
jest.mock('../Pages/PaySlipPage', () => ({ appUser }) => <div>Pay Slip for {appUser?.name}</div>);
jest.mock('../layouts/DashboardLayout', () => ({ children, onLogout }) => (
  <div>
    <button onClick={onLogout}>Logout</button>
    {children}
  </div>
));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading spinner initially', () => {
    const { onAuthStateChanged } = require('firebase/auth');
    onAuthStateChanged.mockImplementation((auth, callback) => {
      // Simulate no user initially
      setTimeout(() => callback(null), 0);
      return jest.fn();
    });

    render(<App />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders login page when no user', async () => {
    const { onAuthStateChanged } = require('firebase/auth');
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn();
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  test('renders dashboard for Manager user', async () => {
    const { onAuthStateChanged } = require('firebase/auth');
    const mockUser = { uid: '123', email: 'test@example.com' };
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    // Mock get and role
    get.mockResolvedValueOnce({ exists: () => true, val: () => 'Manager' });
    get.mockResolvedValueOnce({ exists: () => true, val: () => ({ name: 'Test User' }) });

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Dashboard for Test User')).toBeInTheDocument();
    });
  });

  test('logout functionality', async () => {
    const { onAuthStateChanged } = require('firebase/auth');
    const { auth } = require('../config/firebase');
    const mockUser = { uid: '123', email: 'test@example.com' };
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    get.mockResolvedValueOnce({ exists: () => true, val: () => 'Manager' });
    get.mockResolvedValueOnce({ exists: () => true, val: () => ({ name: 'Test User' }) });

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Logout'));
    await waitFor(() => {
      expect(auth.signOut).toHaveBeenCalled();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});