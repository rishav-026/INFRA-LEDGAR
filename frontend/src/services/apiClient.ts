import axios from 'axios';
import { API_BASE_URL } from '../constants';

// We do not have a dedicated authHelper file yet, so we get the token directly
// In the current frontend, token is stored in memory via AuthContext,
// but for the Axios instance to access it, we will provide a way to inject it or read it.
// For V1, we'll store it in a module-level variable accessible by the interceptor.

let currentToken: string | null = null;

export const setGlobalAuthToken = (token: string | null) => {
  currentToken = token;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth
apiClient.interceptors.request.use((config) => {
  if (currentToken && config.headers) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

// Response Interceptor: Global Error Trapping
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401, we could trigger a logout event here
    if (error.response?.status === 401) {
      console.warn('Unauthorized access - token may be expired');
      // A full implementation would dispatch an event to AuthContext to clear state
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);
