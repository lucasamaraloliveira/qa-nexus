import React from 'react';
import { Users, Monitor, X } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

interface MobileOnlineUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileOnlineUsersModal: React.FC<MobileOnlineUsersModalProps> = ({ isOpen, onClose }) => {
    const { onlineUsers } = useSocket();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Usuários Online</h2>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                            {onlineUsers.length}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    {onlineUsers.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Nenhum usuário online.</p>
                        </div>
                    ) : (
                        onlineUsers.map((user) => (
                            <div
                                key={user.socketId}
                                className="group flex items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all duration-200"
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 shadow-sm">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span
                                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${user.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'
                                            }`}
                                    ></span>
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                            {user.username}
                                        </h3>
                                    </div>
                                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                        <Monitor className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                        <span className="truncate">
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
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        Atualizado em tempo real
                    </span>
                </div>
            </div>
        </div>
    );
};
