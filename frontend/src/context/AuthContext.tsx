import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import axios from 'axios';
import type { User, UserRole, AuthContextType } from '../types';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const USER_STORAGE_KEY = 'business_nexus_user';
export const TOKEN_KEY        = 'business_nexus_token';

// Axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ||'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on page load
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const token      = localStorage.getItem(TOKEN_KEY);
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  const login = async (email: string, password: string, role: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await api.post('/login', { email, password, role });
      const { user: loggedInUser, access_token } = response.data;

      if (loggedInUser.role !== role) {
        throw new Error(`This account is registered as an ${loggedInUser.role}.`);
      }

      setUser(loggedInUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
      localStorage.setItem(TOKEN_KEY, access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      toast.success(`Welcome back, ${loggedInUser.name}!`);
      return loggedInUser as User;
    } catch (error: any) {
      // ✅ Re-throw the original axios error so callers can read error.response.data.errors
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw error; // ← throw original, not new Error(message)
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
const register = async (
  name: string,
  email: string,
  password: string,
  role: UserRole,
  profileData: any = {} // 🟢 Default to empty object
): Promise<User> => { // 🟢 Fixed return type syntax
  setIsLoading(true);
  try {
    const response = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation: password,
      role,
      ...profileData, // 🟢 SPREAD the bio, location, industry, etc. into the request
    });
    
    const { user: newUser, access_token } = response.data;

    setUser(newUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(TOKEN_KEY, access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    toast.success('Account created successfully!');
    return newUser as User;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Registration failed';
    toast.error(message);
    throw error; 
  } finally {
    setIsLoading(false);
  }
};

  // ─────────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────────
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await api.post('/forgot-password', { email });
      toast.success('Reset link sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send link');
    }
  };

  // ─────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────
  const resetPassword = async (token: string, password: string): Promise<void> => {
    try {
      await api.post('/reset-password', {
        token,
        password,
        password_confirmation: password,
      });
      toast.success('Password updated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Reset failed');
    }
  };

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
    toast.success('Logged out');
  };

  const value = useMemo(() => ({
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user,
    isLoading,
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value as any}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
