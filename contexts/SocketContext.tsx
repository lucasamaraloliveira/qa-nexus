"use client";
import React, { createContext, useContext, useState } from 'react';

interface UserSession {
    socketId: string;
    userId: string;
    username: string;
    currentPath: string;
    lastActivity: number;
    status: 'Active' | 'Inactive';
}

interface SocketContextType {
    socket: any | null;
    onlineUsers: UserSession[];
    emitRouteChange: (path: string) => void;
    emitStatusChange: (status: 'Active' | 'Inactive') => void;
    emitUpdateActivity: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Legacy socket feature disabled as we move to a purely Firebase Next.js architecture
    const [onlineUsers] = useState<UserSession[]>([]);

    const emitRouteChange = (path: string) => {
        // No-op
    };

    const emitStatusChange = (status: 'Active' | 'Inactive') => {
        // No-op
    };

    const emitUpdateActivity = () => {
        // No-op
    };

    return (
        <SocketContext.Provider value={{ socket: null, onlineUsers, emitRouteChange, emitStatusChange, emitUpdateActivity }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        // Fallback for safety across the app
        return {
            socket: null,
            onlineUsers: [],
            emitRouteChange: () => {},
            emitStatusChange: () => {},
            emitUpdateActivity: () => {}
        } as SocketContextType;
    }
    return context;
};
