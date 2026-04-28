import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const API_BASE = 'https://mit107.revosysinc.com';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setSocket(prev => { prev?.disconnect(); return null; });
      return;
    }

    const s = io(API_BASE, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
