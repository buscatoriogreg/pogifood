import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function registerPushToken(authToken: string) {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'd20ed2d5-e529-49a3-b0a1-f777205aed7d',
    });

    await api.put('/auth/push-token', { push_token: tokenData.data }, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
  } catch {
    // Non-critical — push notifications optional
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('user'),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          registerPushToken(storedToken);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (userData: User, tokenData: string) => {
    await Promise.all([
      AsyncStorage.setItem('token', tokenData),
      AsyncStorage.setItem('user', JSON.stringify(userData)),
    ]);
    setUser(userData);
    setToken(tokenData);
    registerPushToken(tokenData);
  };

  const logout = async () => {
    await Promise.all([AsyncStorage.removeItem('token'), AsyncStorage.removeItem('user')]);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
