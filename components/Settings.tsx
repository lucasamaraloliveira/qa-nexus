import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Camera, Save, Loader2, Users, Trash2, Edit2, X, ChevronDown } from 'lucide-react';
import { apiService } from '../services/apiService';
import { ConfirmModal } from './ConfirmModal';
import { permissionService, MODULES } from '../services/permissionService';
import { Role } from '../types';

export const Settings: React.FC = () => {
    const { user, profilePicture, token, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'users' | 'permissions'>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile Picture State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(profilePicture ? `http://localhost:3001${profilePicture}` : null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // User Management State (Admin)
    const [users, setUsers] = useState<{ id: number, username: string, role: string }[]>([]);
    const [editingUser, setEditingUser] = useState<{ id: number, username: string, role: string } | null>(null);
    const [editUsername, setEditUsername] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRole, setEditRole] = useState('Tester');

    // Permissions State
    const [permissions, setPermissions] = useState(permissionService.getPermissions());

    const togglePermission = (moduleId: string, role: Role) => {
        const newPermissions = permissions.map(p => {
            if (p.id === moduleId) {
                const hasRole = p.allowedRoles.includes(role);
                return {
                    ...p,
                    allowedRoles: hasRole
                        ? p.allowedRoles.filter(r => r !== role)
                        : [...p.allowedRoles, role]
                };
            }
            return p;
        });
        setPermissions(newPermissions);
        permissionService.savePermissions(newPermissions);
        setMessage({ type: 'success', text: 'Permissões atualizadas.' });
    };

    // Audit Settings State
    const [auditSettings, setAuditSettings] = useState<Record<string, boolean>>({});

    React.useEffect(() => {
        if (user?.username === 'root' && activeTab === 'users') {
            fetchUsers();
        }
        if (user?.username === 'root' && activeTab === 'audit') {
            fetchAuditSettings();
        }
    }, [user, activeTab]);

    const fetchAuditSettings = async () => {
        try {
            const settings = await apiService.getAuditSettings();
            setAuditSettings(settings);
        } catch (error) {
            console.error('Failed to fetch audit settings', error);
            setMessage({ type: 'error', text: 'Erro ao carregar configurações de auditoria.' });
        }
    };

    const toggleAuditSetting = async (moduleId: string) => {
        const newSettings = { ...auditSettings, [moduleId]: !auditSettings[moduleId] };
        setAuditSettings(newSettings);
        try {
            await apiService.updateAuditSettings(newSettings);
            setMessage({ type: 'success', text: 'Configurações de auditoria atualizadas.' });
        } catch (error) {
            console.error('Failed to update audit settings', error);
            setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
            // Revert state on error
            setAuditSettings(auditSettings);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await apiService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleDeleteUser = async (id: number, username: string) => {
        if (username === 'root') {
            setMessage({ type: 'error', text: 'Não é possível excluir o usuário root.' });
            return;
        }
        if (!window.confirm(`Tem certeza que deseja excluir o usuário "${username}"?`)) return;

        try {
            await apiService.deleteUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
            setMessage({ type: 'success', text: 'Usuário excluído com sucesso.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao excluir usuário.' });
        }
    };

    const handleEditUser = (user: { id: number, username: string, role: string }) => {
        setEditingUser(user);
        setEditUsername(user.username);
        setEditRole(user.role || 'Tester');
        setEditPassword('');
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;

        try {
            await apiService.updateUserAdmin(editingUser.id, {
                username: editUsername,
                password: editPassword || undefined,
                role: editRole
            });
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, username: editUsername, role: editRole } : u));
            setEditingUser(null);
            setMessage({ type: 'success', text: 'Usuário atualizado com sucesso.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao atualizar usuário.' });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadProfilePicture = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('profilePicture', selectedFile);

        try {
            const response = await fetch('http://localhost:3001/api/users/me/profile-picture', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                updateUser(user!.username, data.profilePicture);
                setMessage({ type: 'success', text: 'Foto de perfil atualizada com sucesso!' });
            } else {
                setMessage({ type: 'error', text: 'Erro ao atualizar foto de perfil.' });
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveProfilePicture = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmRemoveProfilePicture = async () => {
        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch('http://localhost:3001/api/users/me/profile-picture', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                updateUser(user!.username, null);
                setPreviewUrl(null);
                setSelectedFile(null);
                setMessage({ type: 'success', text: 'Foto de perfil removida com sucesso!' });
            } else {
                setMessage({ type: 'error', text: 'Erro ao remover foto de perfil.' });
            }
        } catch (error) {
            console.error('Error removing profile picture:', error);
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor.' });
        } finally {
            setIsLoading(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch('http://localhost:3001/api/users/me/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao atualizar senha.' });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            setMessage({ type: 'error', text: 'Erro ao conectar com o servidor.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Configurações</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Gerencie suas preferências e segurança da conta.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center px-3 py-2 md:px-6 md:py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'profile'
                            ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        <User className="w-4 h-4 mr-2" />
                        Perfil
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex items-center px-3 py-2 md:px-6 md:py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'security'
                            ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        <Lock className="w-4 h-4 mr-2" />
                        Segurança
                    </button>
                    {user?.username === 'root' && (
                        <>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`flex items-center px-3 py-2 md:px-6 md:py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'users'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Gerenciar Usuários
                            </button>
                            <button
                                onClick={() => setActiveTab('permissions')}
                                className={`flex items-center px-3 py-2 md:px-6 md:py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'permissions'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                Permissões
                            </button>
                            <button
                                onClick={() => setActiveTab('audit')}
                                className={`flex items-center px-3 py-2 md:px-6 md:py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'audit'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                Auditoria
                            </button>
                        </>
                    )}
                </div>

                <div className="p-4 md:p-8">
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'success'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                                <div className="relative group">
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 ring-4 ring-white dark:ring-slate-900 shadow-lg">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <User className="w-12 h-12" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                                        <Camera className="w-4 h-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                                    </label>
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Nome de Usuário
                                        </label>
                                        <input
                                            type="text"
                                            value={user?.username || ''}
                                            disabled
                                            className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">O nome de usuário não pode ser alterado.</p>
                                    </div>

                                    {selectedFile && (
                                        <button
                                            onClick={handleUploadProfilePicture}
                                            disabled={isLoading}
                                            className="flex items-center justify-center w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                            Salvar Foto
                                        </button>
                                    )}

                                    {!selectedFile && profilePicture && (
                                        <button
                                            onClick={handleRemoveProfilePicture}
                                            disabled={isLoading}
                                            className="flex items-center justify-center w-full md:w-auto px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                            Remover Foto
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handleChangePassword} className="max-w-md space-y-6 mx-auto md:mx-0">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Senha Atual
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nova Senha
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Confirmar Nova Senha
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center justify-center w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Atualizar Senha
                            </button>
                        </form>
                    )}

                    {activeTab === 'users' && user?.username === 'root' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Usuários Cadastrados</h2>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                {/* Desktop Table */}
                                <table className="w-full text-left text-sm hidden md:table">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">ID</th>
                                            <th className="px-6 py-3 font-medium">Usuário</th>
                                            <th className="px-6 py-3 font-medium">Função</th>
                                            <th className="px-6 py-3 font-medium text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-3 text-slate-500 dark:text-slate-400">#{u.id}</td>
                                                <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">{u.username}</td>
                                                <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                        u.role === 'Viewer' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                                                            u.role === 'Root' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                u.role === 'Support' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        }`}>
                                                        {u.role || 'Tester'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleEditUser(u)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {u.username !== 'root' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id, u.username)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                    {users.map((u) => (
                                        <div key={u.id} className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{u.username}</span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">#{u.id}</span>
                                                    </div>
                                                    <div className="mt-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                            u.role === 'Viewer' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                                                                u.role === 'Root' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                    u.role === 'Support' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                            }`}>
                                                            {u.role || 'Tester'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleEditUser(u)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {u.username !== 'root' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id, u.username)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Edit User Modal */}
                            {editingUser && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Editar Usuário</h3>
                                            <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome de Usuário</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                                    value={editUsername}
                                                    onChange={(e) => setEditUsername(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Função</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 appearance-none pr-10"
                                                        value={editRole}
                                                        onChange={(e) => setEditRole(e.target.value)}
                                                        disabled={editingUser.username === 'root'}
                                                    >
                                                        <option value="Root">Root</option>
                                                        <option value="Admin">Admin</option>
                                                        <option value="Tester">Tester</option>
                                                        <option value="Viewer">Viewer</option>
                                                        <option value="Support">Support</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nova Senha (opcional)</label>
                                                <input
                                                    type="password"
                                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                                    placeholder="Deixe em branco para manter"
                                                    value={editPassword}
                                                    onChange={(e) => setEditPassword(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 mt-4">
                                                <button
                                                    onClick={() => setEditingUser(null)}
                                                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleUpdateUser}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                                                >
                                                    Salvar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'permissions' && user?.username === 'root' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Gerenciar Permissões de Acesso</h2>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                {/* Desktop Table */}
                                <table className="w-full text-left text-sm hidden md:table">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Módulo</th>
                                            <th className="px-6 py-3 font-medium text-center">Admin</th>
                                            <th className="px-6 py-3 font-medium text-center">Tester</th>
                                            <th className="px-6 py-3 font-medium text-center">Viewer</th>
                                            <th className="px-6 py-3 font-medium text-center">Support</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {MODULES.map((module) => {
                                            const perm = permissions.find(p => p.id === module.id) || { allowedRoles: [] };
                                            return (
                                                <tr key={module.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{module.label}</td>
                                                    {(['Admin', 'Tester', 'Viewer', 'Support'] as Role[]).map(role => (
                                                        <td key={role} className="px-6 py-4 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={perm.allowedRoles.includes(role)}
                                                                onChange={() => togglePermission(module.id, role)}
                                                                className="w-4 h-4 text-indigo-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-white dark:focus:ring-offset-slate-900 accent-indigo-600"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                    {MODULES.map((module) => {
                                        const perm = permissions.find(p => p.id === module.id) || { allowedRoles: [] };
                                        return (
                                            <div key={module.id} className="p-4">
                                                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">{module.label}</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {(['Admin', 'Tester', 'Viewer', 'Support'] as Role[]).map(role => (
                                                        <label key={role} className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                                                            <input
                                                                type="checkbox"
                                                                checked={perm.allowedRoles.includes(role)}
                                                                onChange={() => togglePermission(module.id, role)}
                                                                className="w-4 h-4 text-indigo-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-white dark:focus:ring-offset-slate-900 accent-indigo-600"
                                                            />
                                                            <span>{role}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'audit' && user?.username === 'root' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Configuração de Auditoria</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Ative ou desative o log de auditoria para cada módulo.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                {/* Desktop Table */}
                                <table className="w-full text-left text-sm hidden md:table">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Módulo</th>
                                            <th className="px-6 py-3 font-medium text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {MODULES.map((module) => {
                                            const isEnabled = auditSettings[module.id] !== false; // Default true
                                            return (
                                                <tr key={module.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{module.label}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => toggleAuditSetting(module.id)}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                                                }`}
                                                        >
                                                            <span
                                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                                                    }`}
                                                            />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                    {MODULES.map((module) => {
                                        const isEnabled = auditSettings[module.id] !== false; // Default true
                                        return (
                                            <div key={module.id} className="p-4 flex justify-between items-center">
                                                <span className="font-medium text-slate-900 dark:text-slate-100">{module.label}</span>
                                                <button
                                                    onClick={() => toggleAuditSetting(module.id)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                                        }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmRemoveProfilePicture}
                title="Remover Foto de Perfil"
                message="Tem certeza que deseja remover sua foto de perfil? Esta ação não pode ser desfeita."
                confirmText="Remover"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};
