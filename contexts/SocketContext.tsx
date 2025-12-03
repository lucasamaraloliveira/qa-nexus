import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface UserSession {
    socketId: string;
    userId: number;
    username: string;
    currentPath: string;
    lastActivity: number;
    status: 'Active' | 'Inactive';
}

interface SocketContextType {
    socket: Socket | null;
    onlineUsers: UserSession[];
    emitRouteChange: (path: string) => void;
    emitStatusChange: (status: 'Active' | 'Inactive') => void;
    emitUpdateActivity: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<UserSession[]>([]);

    useEffect(() => {
        if (isAuthenticated && user) {
            // Connect to the same host/port as the API (handled by proxy in dev, or relative path in prod)
            // Since we set up proxy for /api, we might need to be careful with socket.io path.
            // Socket.io client usually connects to window.location.host by default.
            // We need to ensure it goes through the proxy or connects to the right port.
            // In dev: frontend 3000 -> proxy -> backend 3001.
            // Socket.io defaults to /socket.io path. We need to configure vite proxy for that too or just point to 3001 directly if possible (but CORS).
            // Actually, if we use relative path, it goes to 3000/socket.io, so we need to proxy /socket.io as well.

            // Let's assume we will update vite.config.ts to proxy /socket.io as well.
            const newSocket = io({
                path: '/socket.io', // Default
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('Connected to WebSocket');
                newSocket.emit('join', { userId: user.id, username: user.username });
            });

            newSocket.on('users_update', (users: UserSession[]) => {
                setOnlineUsers(users);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [isAuthenticated, user]);

    const emitRouteChange = (path: string) => {
        if (socket) {
            socket.emit('route_change', path);
        }
    };

    const emitStatusChange = (status: 'Active' | 'Inactive') => {
        if (socket) {
            socket.emit('status_change', status);
        }
    };

    const emitUpdateActivity = () => {
        if (socket) {
            socket.emit('update_activity');
        }
    };

    return (
        <SocketContext.Provider value={{ socket, onlineUsers, emitRouteChange, emitStatusChange, emitUpdateActivity }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
