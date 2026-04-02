"use client";
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';
import { Lock, User, ArrowRight } from 'lucide-react';
import { apiService } from '../services/apiService';

interface LoginProps {
    onRegisterClick: () => void;
}

export const Login: React.FC<LoginProps> = ({ onRegisterClick }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleLogin } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await apiService.login(username, password);
            login(data.token, data.username, data.role, data.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-4">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Bem-vindo de volta</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Entre para acessar o QA Nexus</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Usuário</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                required
                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                placeholder="Seu nome de usuário"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                placeholder="Sua senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full justify-center" isLoading={loading}>
                        Entrar <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </form>

                <div className="mt-6 relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">Ou entre com</span>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={async () => {
                            try {
                                setError('');
                                setLoading(true);
                                await googleLogin();
                            } catch (err: any) {
                                setError(err.message || 'Falha ao autenticar com Google');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-medium disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Não tem uma conta?{' '}
                        <button
                            onClick={onRegisterClick}
                            className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                        >
                            Criar conta
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
