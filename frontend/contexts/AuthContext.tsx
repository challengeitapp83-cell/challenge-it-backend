import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { api } from './api';

export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  level: number;
  points: number;
  streak: number;
  reputation: number;
  badges: string[];
  joined_challenges: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  checkAuth: async () => {},
  setUser: () => {},
  setToken: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.includes('session_id=')) {
        setIsLoading(false);
        return;
      }
    }

    try {
      const token = await AsyncStorage.getItem('session_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const userData = await api.get('/api/auth/me');
      setUser(userData);
    } catch (error) {
      await AsyncStorage.removeItem('session_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setToken = async (token: string) => {
    await AsyncStorage.setItem('session_token', token);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {}
    await AsyncStorage.removeItem('session_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await api.get('/api/auth/me');
      setUser(userData);
    } catch {}
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        checkAuth,
        setUser,
        setToken,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
