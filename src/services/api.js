import axios from 'axios';
import { API_URL, TOKEN_EXPIRY_DAYS, SESSION_MIN_MINUTES, STORAGE_KEYS } from '../config/constants';

// Constants
const { TOKEN_KEY, USER_KEY, TOKEN_EXPIRY_KEY, TOKEN_CHECK_KEY} = STORAGE_KEYS;

// Helper function to clear storage
export const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(TOKEN_CHECK_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  sessionStorage.removeItem(TOKEN_CHECK_KEY);
};

// Helper function to get token from either storage
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

// Create a single axios instance for all API calls
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true // Required for cookies if using sanctum with cookies
});

// Check and update token validity function
export const checkAndUpdateTokenValidity = () => {
  const now = new Date().getTime();
  const lastCheck = parseInt(localStorage.getItem(TOKEN_CHECK_KEY) || sessionStorage.getItem(TOKEN_CHECK_KEY) || '0');
  
  // Only check once per minute to avoid excessive checks
  if (now - lastCheck < 60000) {
    return true;
  }
  
  // Update last check time
  if (localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_CHECK_KEY, now.toString());
  } else if (sessionStorage.getItem(TOKEN_KEY)) {
    sessionStorage.setItem(TOKEN_CHECK_KEY, now.toString());
  }
  
  // Check if token exists but is expired
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY) || sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return false;
  
  const expiryTime = parseInt(expiry);
  const isExpired = now > expiryTime;
  
  if (isExpired) {
    console.log("Token expired during validity check");
    clearAuthStorage();
    return false;
  }
  
  // If token is about to expire in less than 5 minutes but we're still using it, extend it
  // This is especially important for sessionStorage tokens
  const sessionToken = sessionStorage.getItem(TOKEN_KEY);
  if (sessionToken && (expiryTime - now < 5 * 60 * 1000) && (expiryTime > now)) {
    console.log("Extending session token validity");
    // Add 30 more minutes to session token
    const newExpiry = now + 30 * 60 * 1000;
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, newExpiry.toString());
    return true;
  }
  
  return !isExpired;
};

// Add request interceptor to attach token and handle expiration
api.interceptors.request.use(
  (config) => {
    // First check and potentially extend token validity
    if (!checkAndUpdateTokenValidity()) {
      // Only redirect if not already logging in or out
      if (!config.url.includes('/login') && !config.url.includes('/logout')) {
        window.location.href = '/login?expired=true';
        return Promise.reject(new Error('Token expired'));
      }
    }
    
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Error handling interceptor
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized errors globally
    if (error.response && error.response.status === 401) {
      clearAuthStorage();
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username, password, rememberMe = false) => {
    try {
      const response = await api.post('/login', { username, password });
      
      if (response.data.token) {
        const storage = rememberMe ? localStorage : sessionStorage;
        
        // Store token and user data
        storage.setItem(TOKEN_KEY, response.data.token);
        storage.setItem(USER_KEY, JSON.stringify(response.data.user));
        
        console.log("Token stored in:", rememberMe ? "localStorage" : "sessionStorage");
        
        // Get expiry directly from response or use fallback
        let expiryTime;
        if (response.data.expires_at) {
          expiryTime = response.data.expires_at;
        } else {
          // Use longer minimum session time for sessionStorage
          expiryTime = new Date().getTime() + (rememberMe ? 
            30 * 24 * 60 * 60 * 1000 : // 30 days for local storage 
            Math.max(2 * 60 * 60 * 1000, 45 * 60 * 1000)); // At least 45 min for session
        }
        
        console.log("Token expires at:", new Date(expiryTime).toLocaleString());
        storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        
        // Set last check time
        storage.setItem(TOKEN_CHECK_KEY, new Date().getTime().toString());
        
        // Return success with user data
        return {
          success: true,
          user: response.data.user
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Login failed'
      };
    } catch (error) {
      console.error("API error during login:", error);
      return {
        success: false, 
        message: error.response?.data?.message || "Network error during login"
      };
    }
  },
  
  logout: async () => {
    try {
      // Try to notify the server (may fail if token is already invalid)
      const token = getToken();
      if (token) {
        await api.post('/logout').catch(() => {});
      }
    } finally {
      // Clear both storage types to be safe
      clearAuthStorage();
    }
  },
  
  getCurrentUser: () => {
    // Try to get user from either localStorage or sessionStorage
    const localUser = localStorage.getItem(USER_KEY);
    const sessionUser = sessionStorage.getItem(USER_KEY);
    
    return JSON.parse(localUser || sessionUser || 'null');
  },
  
  isTokenExpired: () => {
    checkAndUpdateTokenValidity(); // This may extend session token if needed
    
    const localExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    const sessionExpiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    const expiry = localExpiry || sessionExpiry;
    
    if (!expiry) {
      console.log("No token expiry found");
      return true;
    }
    
    const now = new Date().getTime();
    const expiryTime = parseInt(expiry);
    const isExpired = now > expiryTime;
    
    // Reduce logging frequency
    if (isExpired || Math.random() < 0.01) {
      console.log("Token expiry check:", {
        now: new Date(now).toLocaleString(),
        expiryTime: new Date(expiryTime).toLocaleString(),
        isExpired,
        minutesLeft: isExpired ? 0 : Math.round((expiryTime - now) / 60000)
      });
    }
    
    return isExpired;
  },
  
  getTokenExpiryTime: () => {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY) || sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry) : null;
  },
  
  refreshToken: async () => {
    try {
      if (!getToken()) return false;
      
      const response = await api.post('/refresh-token');
      
      if (response.data.token) {
        // Determine which storage contains the current token
        const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
        
        // Update token and expiry
        storage.setItem(TOKEN_KEY, response.data.token);
        
        const expiryTime = response.data.expires_at || 
          (new Date().getTime() + (storage === localStorage ? 
            30 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000));
        
        storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        storage.setItem(TOKEN_CHECK_KEY, new Date().getTime().toString());
        
        console.log("Token refreshed successfully, expires:", new Date(expiryTime).toLocaleString());
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return false;
    }
  },
};

// User services
export const userService = {
  getAll: async () => {
    return await api.get('/users');
  },
  
  get: async (id) => {
    return await api.get(`/users/${id}`);
  },
  
  create: async (userData) => {
    return await api.post('/users', userData);
  },
  
  update: async (id, userData) => {
    return await api.put(`/users/${id}`, userData);
  },
  
  delete: async (id) => {
    return await api.delete(`/users/${id}`);
  }
};

// Category services
export const categoryService = {
  getAll: async () => {
    return await api.get('/categories');
  },
  
  create: async (data) => {
    return await api.post('/categories', data);
  },
  
  update: async (id, data) => {
    return await api.put(`/categories/${id}`, data);
  },
  
  delete: async (id) => {
    return await api.delete(`/categories/${id}`);
  }
};

// Item services
export const itemService = {
  getAll: async (page = 1, perPage = 10) => {
    return await api.get('/items', {
      params: { page, per_page: perPage }
    });
  },
  
  get: async (id) => {
    return await api.get(`/items/${id}`);
  },
  
  create: async (data) => {
    return await api.post('/items', data);
  },
  
  update: async (id, data) => {
    return await api.put(`/items/${id}`, data);
  },
  
  delete: async (id) => {
    return await api.delete(`/items/${id}`);
  },
  
  search: async (term, page = 1, perPage = 10) => {
    return await api.get('/items/search', { 
      params: { term, page, per_page: perPage } 
    });
  },
  
  getLowStock: async (page = 1, perPage = 10) => {
    // Make sure the URL matches exactly
    return await api.get('/items/low-stock', {
      params: { page, per_page: perPage }
    });
  },
  
  getExpiringSoon: async (page = 1, perPage = 10) => {
    return await api.get('/items/expiring-soon', {
      params: { page, per_page: perPage }
    });
  },
  
  getByCategory: async (categoryId, page = 1, perPage = 10) => {
    return await api.get(`/items/category/${categoryId}`, {
      params: { page, per_page: perPage }
    });
  },
  
  getTrashed: async (page = 1, perPage = 10) => {
    return await api.get('/items/trashed', {
      params: { page, per_page: perPage }
    });
  },
  
  restore: async (id) => {
    return await api.post(`/items/${id}/restore`);
  }
};

// Request services
export const requestService = {
  getAll: async () => {
    return await api.get('/requests');
  },
  
  getMyRequests: async () => {
    return await api.get('/my-requests');
  },
  
  create: async (data) => {
    return await api.post('/requests', data);
  },
  
  updateStatus: async (id, status) => {
    return await api.put(`/requests/${id}/status`, { status });
  }
};

// Log services
export const logService = {
  getAll: async () => {
    return await api.get('/logs');
  },
  
  create: async (data) => {
    return await api.post('/logs', data);
  }
};

// Export base API instance for other direct calls
export default api;