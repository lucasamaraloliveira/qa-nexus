import React, { useEffect, useRef } from 'react';
import { Users, Monitor, X } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

interface OnlineUsersTrayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const OnlineUsersTray: React.FC<OnlineUsersTrayProps> = ({ isOpen, onClose }) => {
    const { onlineUsers } = useSocket();
    const trayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (trayRef.current && !trayRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={trayRef}
            className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Usuários Online</h2>
                    </div>
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {onlineUsers.length}
                </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {onlineUsers.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">Nenhum usuário online.</p>
                    </div>
                ) : (
                    onlineUsers.map((user) => (
                        <div
                            key={user.socketId}
                            className="group flex items-center p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all duration-200"
                        >
                            <div className="relative flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <span
                                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${user.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'
                                        }`}
                                ></span>
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                        {user.username}
                                    </h3>
                                </div>
                                <div className="flex items-center text-[10px] text-slate-500 dark:text-slate-400">
                                    <Monitor className="w-3 h-3 mr-1 opacity-70" />
                                    <span className="truncate max-w-[140px]">
                                        {user.currentPath === '/' || user.currentPath === 'dashboard' ? 'Dashboard' :
                                            user.currentPath === 'versions' ? 'Versões & Scripts' :
                                                user.currentPath === 'builds' ? 'Docs de Build' :
                                                    user.currentPath === 'useful-docs' ? 'Docs Úteis' :
                                                        user.currentPath === 'manuals' ? 'Manuais' :
                                                            user.currentPath === 'tests' ? 'Gestão de Testes' :
                                                                user.currentPath === 'settings' ? 'Configurações' : user.currentPath}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                    Tempo real
                </span>
            </div>
        </div>
    );
};
