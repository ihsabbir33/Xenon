// src/pages/auth/auth.ts
import { api } from '../../lib/api';

export const logout = () => {
  // Clear the authentication token
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // Clear axios defaults
  delete api.defaults.headers.common['Authorization'];

  // Clear location data
  localStorage.removeItem('userLat');
  localStorage.removeItem('userLng');
  localStorage.removeItem('locationEnabled');

  // Redirect to login page (handled by caller)
};

export const setAuthToken = (token: string) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

// Initialize auth token on app load
const token = getAuthToken();
if (token) {
  setAuthToken(token);
}