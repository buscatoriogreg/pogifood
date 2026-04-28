import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export type ToastType = 'success' | 'error' | 'cart' | 'order' | 'info';

export interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

const CONFIG: Record<ToastType, { icon: string; color: string; bg: string }> = {
  success: { icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
  error:   { icon: '❌', color: '#dc2626', bg: '#fef2f2' },
  cart:    { icon: '🛒', color: '#F97316', bg: '#fff7ed' },
  order:   { icon: '🎉', color: '#7c3aed', bg: '#f5f3ff' },
  info:    { icon: 'ℹ️',  color: '#2563eb', bg: '#eff6ff' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const [visible, setVisible] = useState(false);
  const [opts, setOpts] = useState<ToastOptions>({ title: '' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (options: ToastOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setOpts(options);
    setVisible(true);

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 14,
      stiffness: 120,
    }).start();

    timerRef.current = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, 2800);
  };

  const c = CONFIG[opts.type ?? 'success'];

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View style={[styles.wrapper, { transform: [{ translateY }] }]}>
          <View style={[styles.toast, { backgroundColor: c.bg, borderLeftColor: c.color }]}>
            <Text style={styles.icon}>{c.icon}</Text>
            <View style={styles.textBlock}>
              <Text style={[styles.title, { color: c.color }]}>{opts.title}</Text>
              {opts.message ? <Text style={styles.message} numberOfLines={2}>{opts.message}</Text> : null}
            </View>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 10,
  },
  icon: { fontSize: 24 },
  textBlock: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700' },
  message: { fontSize: 13, color: '#6B7280', marginTop: 3 },
});
