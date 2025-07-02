'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  subscriptionType: 'free' | 'pro';
  subscriptionActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface UsageInfo {
  type: 'free' | 'pro';
  used: number;
  limit: number;
  remaining: number;
  resetDate: string;
  period: 'daily' | 'monthly';
}

interface AuthContextType {
  user: User | null;
  usage: UsageInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: { token: string; user: User }) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  telegramLogin: (authData: any) => Promise<boolean>;
  webAppLogin: (initData: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  const login = (userData: { token: string; user: User }) => {
    Cookies.set('auth_token', userData.token, { 
      expires: 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    setUser(userData.user);
    setIsLoading(false);
  };

  const logout = () => {
    Cookies.remove('auth_token');
    setUser(null);
    setUsage(null);
    router.push('/');
    toast.success('Вы вышли из аккаунта');
  };

  const refreshUser = async () => {
    try {
      const token = Cookies.get('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setUsage(data.usage);
      } else {
        // Token is invalid
        logout();
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const telegramLogin = async (authData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData),
      });

      if (response.ok) {
        const data = await response.json();
        login(data);
        toast.success(`Добро пожаловать, ${data.user.firstName || data.user.username}!`);
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка авторизации');
        return false;
      }
    } catch (error) {
      console.error('Telegram login error:', error);
      toast.error('Не удалось войти через Telegram');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const webAppLogin = async (initData: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/webapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      });

      if (response.ok) {
        const data = await response.json();
        login(data);
        toast.success(`Добро пожаловать в WebApp!`);
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка авторизации WebApp');
        return false;
      }
    } catch (error) {
      console.error('WebApp login error:', error);
      toast.error('Не удалось войти через WebApp');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing token on mount
  useEffect(() => {
    refreshUser();
  }, []);

  // Handle Telegram WebApp initialization
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Expand the WebApp to full height
      tg.expand();
      
      // Enable closing confirmation
      tg.enableClosingConfirmation();
      
      // Set header color
      tg.setHeaderColor('#3b82f6');
      
      // Auto-login if WebApp data is available
      if (tg.initData && !user) {
        webAppLogin(tg.initData);
      }
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    usage,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    telegramLogin,
    webAppLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: any;
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: any;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: any;
        MainButton: any;
        HapticFeedback: any;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        ready: () => void;
        sendData: (data: string) => void;
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
      };
      Login?: {
        auth: (options: any, callback: (user: any) => void) => void;
      };
    };
  }
}