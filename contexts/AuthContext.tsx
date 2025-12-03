import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

import { User } from '../types';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    profilePicture: string | null;
    token: string | null;
    login: (token: string, username: string, role: string, id: number) => void;
    logout: () => void;
    updateUser: (username: string, profilePicture: string | null) => void;
    isSessionExpired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [isSessionExpired, setIsSessionExpired] = useState(false);

    useEffect(() => {
        const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (isAuthenticated && !isSessionExpired) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    setIsSessionExpired(true);
                }, INACTIVITY_TIMEOUT);
            }
        };

        const handleActivity = () => {
            resetTimer();
        };

        if (isAuthenticated && !isSessionExpired) {
            window.addEventListener('mousemove', handleActivity);
            window.addEventListener('keydown', handleActivity);
            window.addEventListener('click', handleActivity);
            window.addEventListener('scroll', handleActivity);
            resetTimer(); // Start timer immediately
        }

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [isAuthenticated, isSessionExpired]);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');

        if (storedToken) {
            setToken(storedToken);

            // Fetch user details to get ID and profile picture
            fetch('/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Failed to fetch user');
                })
                .then(data => {
                    setUser({ id: data.id, username: data.username, role: data.role });
                    if (data.profilePicture) {
                        setProfilePicture(data.profilePicture);
                    }
                    setIsAuthenticated(true);
                })
                .catch(err => {
                    console.error('Failed to fetch user details', err);
                    // If fetching user fails (e.g. invalid token), logout
                    logout();
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (newToken: string, newUsername: string, role: string, id: number) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setIsSessionExpired(false); // Reset expiry on login

        // Set user with role
        setUser({
            id,
            username: newUsername,
            role: role as any
        });
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setProfilePicture(null);
        setIsAuthenticated(false);
        setIsSessionExpired(false);
    };

    const updateUser = (newUsername: string, newProfilePicture: string | null) => {
        if (user) {
            setUser({ ...user, username: newUsername });
        }
        setProfilePicture(newProfilePicture);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, profilePicture, token, login, logout, updateUser, isSessionExpired }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
