import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { AuditLog } from '../types';
import { Search, Filter, Calendar, ChevronLeft, ChevronRight, RefreshCw, Shield, GitBranch, FileText, BookOpen, FolderOpen, FlaskConical, FileClock, Users, LayoutTemplate, Settings, Trash2, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuditLogs: React.FC = () => {

    const { user } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    // Filters
    const [moduleFilter, setModuleFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [usernameFilter, setUsernameFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Settings & Clear State
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showCacheClearedModal, setShowCacheClearedModal] = useState(false);
    const [auditSettings, setAuditSettings] = useState<Record<string, boolean>>({});
    const [globalEnabled, setGlobalEnabled] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const filters = {
                page,
                limit: 20,
                module: moduleFilter,
                action: actionFilter,
                username: usernameFilter,
                startDate,
                endDate
            };
            const data = await apiService.getAuditLogs(filters);
            setLogs(data.logs);
            setTotalPages(data.totalPages);
            setTotalLogs(data.total);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        if (user?.role === 'Root') {
            fetchSettings();
        }
    }, [page, moduleFilter, actionFilter, usernameFilter, startDate, endDate, user]);

    const fetchSettings = async () => {
        try {
            const settings = await apiService.getAuditSettings();
            setAuditSettings(settings);
            const status = await apiService.getAuditGlobalStatus();
            setGlobalEnabled(status.enabled);
        } catch (error) {
            console.error('Failed to fetch audit settings:', error);
        }
    };

    const toggleAuditSetting = async (moduleId: string) => {
        const newSettings = { ...auditSettings, [moduleId]: !auditSettings[moduleId] };
        setAuditSettings(newSettings);
        try {
            await apiService.updateAuditSettings(newSettings);
        } catch (error) {
            console.error('Failed to update audit settings', error);
            setAuditSettings(auditSettings); // Revert
        }
    };

    const handleClearLogs = async () => {
        try {
            await apiService.clearAuditLogs();
            setShowClearConfirm(false);
            fetchLogs();
        } catch (error) {
            console.error('Failed to clear logs:', error);
        }
    };

    const handleClearCache = async () => {
        try {
            await apiService.clearAuditCache();
            setShowCacheClearedModal(true);
        } catch (error) {
            console.error('Failed to clear cache:', error);
            alert('Erro ao limpar cache.');
        }
    };

    const toggleGlobalStatus = async () => {
        try {
            await apiService.toggleAuditGlobalStatus(!globalEnabled);
            setGlobalEnabled(!globalEnabled);
        } catch (error) {
            console.error('Failed to toggle global status:', error);
        }
    };

    const handleResetFilters = () => {
        setModuleFilter('');
        setActionFilter('');
        setUsernameFilter('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    const modules = [
        { id: 'AUTH', label: 'Autenticação', icon: Shield, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
        { id: 'VERSIONS', label: 'Versões', icon: GitBranch, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
        { id: 'DOCS', label: 'Docs Build', icon: FileText, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
        { id: 'USEFUL_DOCS', label: 'Docs Úteis', icon: BookOpen, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
        { id: 'MANUALS', label: 'Manuais', icon: FolderOpen, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' },
        { id: 'TEST_PLANS', label: 'Testes', icon: FlaskConical, color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400' },
        { id: 'CHANGELOG', label: 'Changelog', icon: FileClock, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400' },
        { id: 'USERS', label: 'Usuários', icon: Users, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400' },
    ];

    return (
        <div className="p-6 w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Logs de Auditoria</h1>
                <div className="flex gap-2">
                    {user?.role === 'Root' && (
                        <>
                            <button
                                onClick={() => setShowSettingsModal(true)}
                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 transition-colors"
                                title="Configurações"
                            >
                                <Settings size={20} />
                            </button>
                            <button
                                onClick={() => setShowClearConfirm(true)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                                title="Limpar Logs"
                            >
                                <Trash2 size={20} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={fetchLogs}
                        className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 transition-colors"
                        title="Atualizar"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Module Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
                <button
                    onClick={() => { setModuleFilter(''); setPage(1); }}
                    className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2
                        ${moduleFilter === ''
                            ? 'bg-white dark:bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md transform scale-105'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm'
                        }`}
                >
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        <LayoutTemplate size={20} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Todos</span>
                </button>

                {modules.filter(mod => auditSettings[mod.id] !== false).map((mod) => (
                    <button
                        key={mod.id}
                        onClick={() => { setModuleFilter(mod.id); setPage(1); }}
                        className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2
                            ${moduleFilter === mod.id
                                ? 'bg-white dark:bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md transform scale-105'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm'
                            }`}
                    >
                        <div className={`p-2 rounded-lg ${mod.color}`}>
                            <mod.icon size={20} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{mod.label}</span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por usuário..."
                            value={usernameFilter}
                            onChange={(e) => { setUsernameFilter(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={moduleFilter}
                            onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none"
                        >
                            <option value="">Todos os Módulos</option>
                            <option value="AUTH">Autenticação</option>
                            <option value="VERSIONS">Versões</option>
                            <option value="DOCS">Documentação</option>
                            <option value="USEFUL_DOCS">Docs Úteis</option>
                            <option value="MANUALS">Manuais</option>
                            <option value="TEST_PLANS">Planos de Teste</option>
                            <option value="CHANGELOG">Changelog</option>
                            <option value="USERS">Usuários</option>
                        </select>
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none"
                        >
                            <option value="">Todas as Ações</option>
                            <option value="CREATE">Criar</option>
                            <option value="UPDATE">Atualizar</option>
                            <option value="DELETE">Excluir</option>
                            <option value="LOGIN">Login</option>
                            <option value="REGISTER">Registrar</option>
                            <option value="UPLOAD">Upload</option>
                            <option value="RESET">Resetar</option>
                            <option value="DUPLICATE">Duplicar</option>
                            <option value="REPLICATE">Replicar</option>
                            <option value="UPDATE_PASSWORD">Atualizar Senha</option>
                            <option value="UPDATE_PROFILE_PICTURE">Atualizar Perfil</option>
                            <option value="DELETE_PROFILE_PICTURE">Excluir Perfil</option>
                            <option value="DELETE_USER">Excluir Usuário</option>
                            <option value="UPDATE_USER">Atualizar Usuário</option>
                        </select>
                    </div>

                    <div className="col-span-1 md:col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1 md:hidden">Data Início</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    placeholder="Data Início"
                                    value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                    className="w-[80%] md:w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1 md:hidden">Data Fim</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    placeholder="Data Fim"
                                    value={endDate}
                                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                    className="w-[80%] md:w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {(moduleFilter || actionFilter || usernameFilter || startDate || endDate) && (
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleResetFilters}
                            className="text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 underline"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 mb-6">
                {loading ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        Carregando logs...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        Nenhum log encontrado.
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                            {/* Header: User & Action */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Users size={16} />
                                    </div>
                                    <span className="font-semibold text-slate-800 dark:text-white text-sm">
                                        {log.username}
                                    </span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                    ${log.action === 'CREATE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            log.action === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}
                                `}>
                                    {log.action}
                                </span>
                            </div>

                            {/* Meta: Module & Date */}
                            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                                <div className="flex items-center gap-1.5">
                                    <LayoutTemplate size={14} />
                                    <span>{log.module}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <FileClock size={14} />
                                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                                {log.details}
                            </div>

                            {/* Footer: IP */}
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right font-mono mt-1">
                                IP: {log.ipAddress}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Table */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Data</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Usuário</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Ação</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Módulo</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Detalhes</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Endereço IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        Carregando logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        Nenhum log encontrado com os critérios selecionados.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-slate-800 dark:text-white font-medium">
                                            {log.username}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                                                ${log.action === 'CREATE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        log.action === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}
                                            `}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">
                                            {log.module}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.details}>
                                            {log.details}
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                                            {log.ipAddress}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Mostrando {logs.length} de {totalLogs} logs
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="flex items-center px-4 text-slate-600 dark:text-slate-300">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>


            {/* Settings Modal */}
            {
                showSettingsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Configuração de Auditoria</h3>
                                <button onClick={() => setShowSettingsModal(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Controle de Sistema</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${globalEnabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    <Shield size={18} />
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-700 dark:text-slate-200 block">Serviço de Auditoria</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">{globalEnabled ? 'Ativo' : 'Parado'}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={toggleGlobalStatus}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${globalEnabled ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${globalEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                                    <RefreshCw size={18} />
                                                </div>
                                                <span className="font-medium text-slate-700 dark:text-slate-200">Limpar Cache</span>
                                            </div>
                                            <button
                                                onClick={handleClearCache}
                                                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                                            >
                                                Limpar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Módulos</h4>
                                <div className="space-y-4">
                                    {modules.map((module) => {
                                        const isEnabled = auditSettings[module.id] !== false;
                                        return (
                                            <div key={module.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${module.color}`}>
                                                        <module.icon size={18} />
                                                    </div>
                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{module.label}</span>
                                                </div>
                                                <button
                                                    onClick={() => toggleAuditSetting(module.id)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Clear Confirmation Modal */}
            {
                showClearConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Limpar Logs de Auditoria?</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Tem certeza que deseja excluir todos os logs de auditoria? Esta ação não pode ser desfeita.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowClearConfirm(false)}
                                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleClearLogs}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Sim, Limpar Tudo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Cache Cleared Success Modal */}
            {
                showCacheClearedModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Sucesso!</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    O cache de configuração foi limpo com sucesso.
                                </p>
                                <button
                                    onClick={() => setShowCacheClearedModal(false)}
                                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AuditLogs;
