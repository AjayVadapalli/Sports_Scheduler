import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.getCurrentUser();
      setUser(response.user);
    } catch (error) {
      console.error('Error checking auth status:', error);
      localStorage.removeItem('token');
      apiClient.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'admin' | 'player' = 'player') => {
    const response = await apiClient.signUp(email, password, name, role);
    setUser(response.user);
    return response;
  };

  const signIn = async (email: string, password: string) => {
    const response = await apiClient.signIn(email, password);
    setUser(response.user);
    return response;
  };

  const signOut = async () => {
    apiClient.signOut();
    setUser(null);
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut
  };
}