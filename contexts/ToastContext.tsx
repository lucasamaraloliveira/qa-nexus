import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, Undo2, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
    message: string;
    type?: ToastType;
    duration?: number;
    onUndo?: () => void;
    onCommit?: () => void;
}

interface Toast extends ToastOptions {
    id: string;
    startTime: number;
}

interface ToastContextType {
    showToast: (options: ToastOptions) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timers = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const removeToast = useCallback((id: string, executeCommit = true) => {
        setToasts((prev) => {
            const toast = prev.find((t) => t.id === id);
            if (toast && executeCommit && toast.onCommit) {
                toast.onCommit();
            }
            return prev.filter((t) => t.id !== id);
        });

        if (timers.current[id]) {
            clearTimeout(timers.current[id]);
            delete timers.current[id];
        }
    }, []);

    const showToast = useCallback(({ message, type = 'info', duration = 5000, onUndo, onCommit }: ToastOptions) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = {
            id,
            message,
            type,
            duration,
            onUndo,
            onCommit,
            startTime: Date.now(),
        };

        setToasts((prev) => [...prev, newToast]);

        if (duration > 0) {
            timers.current[id] = setTimeout(() => {
                removeToast(id, true); // Auto-dismiss commits the action
            }, duration);
        }
    }, [removeToast]);

    const handleUndo = (id: string, onUndo: () => void) => {
        onUndo();
        removeToast(id, false); // Remove without committing
    };

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 animate-in slide-in-from-right-full
                            ${toast.type === 'success' ? 'bg-white dark:bg-slate-900 border-green-500/50 text-slate-800 dark:text-slate-100' : ''}
                            ${toast.type === 'error' ? 'bg-white dark:bg-slate-900 border-red-500/50 text-slate-800 dark:text-slate-100' : ''}
                            ${toast.type === 'warning' ? 'bg-white dark:bg-slate-900 border-yellow-500/50 text-slate-800 dark:text-slate-100' : ''}
                            ${toast.type === 'info' ? 'bg-white dark:bg-slate-900 border-blue-500/50 text-slate-800 dark:text-slate-100' : ''}
                        `}
                    >
                        <div className={`
                            p-1 rounded-full 
                            ${toast.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : ''}
                            ${toast.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : ''}
                            ${toast.type === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                            ${toast.type === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                        `}>
                            {toast.type === 'success' && <CheckCircle2 size={18} />}
                            {toast.type === 'error' && <AlertCircle size={18} />}
                            {toast.type === 'warning' && <AlertTriangle size={18} />}
                            {toast.type === 'info' && <Info size={18} />}
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <p className="text-sm font-medium">{toast.message}</p>
                        </div>

                        {toast.onUndo && (
                            <button
                                onClick={() => handleUndo(toast.id, toast.onUndo!)}
                                className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            >
                                <Undo2 size={14} />
                                Desfazer
                            </button>
                        )}

                        <button
                            onClick={() => removeToast(toast.id, true)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
