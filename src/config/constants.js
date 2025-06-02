export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const TOKEN_EXPIRY_DAYS = parseInt(import.meta.env.VITE_TOKEN_EXPIRY_DAYS || '30');
export const SESSION_MIN_MINUTES = parseInt(import.meta.env.VITE_SESSION_MIN_MINUTES || '45');

// Storage keys
export const STORAGE_KEYS = {
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  TOKEN_EXPIRY_KEY: 'tokenExpiry',
  TOKEN_CHECK_KEY: 'lastTokenCheck'
};