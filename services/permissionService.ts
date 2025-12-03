import { Role } from '../types';

export interface ModulePermission {
    id: string;
    allowedRoles: Role[];
}

export const MODULES = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'versions', label: 'Versões & Scripts' },
    { id: 'builds', label: 'Docs de Build' },
    { id: 'useful-docs', label: 'Docs Úteis' },
    { id: 'manuals', label: 'Manuais' },
    { id: 'tests', label: 'Gestão de Testes' },
    { id: 'changelog-manager', label: 'Changelog' },
    { id: 'audit-logs', label: 'Audit Logs' },
];

const DEFAULT_PERMISSIONS: ModulePermission[] = [
    { id: 'dashboard', allowedRoles: ['Root', 'Admin', 'Tester', 'Viewer', 'Support'] },
    { id: 'versions', allowedRoles: ['Root', 'Admin', 'Tester', 'Viewer', 'Support'] },
    { id: 'builds', allowedRoles: ['Root', 'Admin', 'Tester', 'Viewer', 'Support'] },
    { id: 'useful-docs', allowedRoles: ['Root', 'Admin', 'Tester', 'Viewer', 'Support'] },
    { id: 'manuals', allowedRoles: ['Root', 'Admin', 'Tester', 'Viewer', 'Support'] },
    { id: 'tests', allowedRoles: ['Root', 'Admin', 'Tester', 'Viewer', 'Support'] },
    { id: 'changelog-manager', allowedRoles: ['Root', 'Admin'] },
    { id: 'audit-logs', allowedRoles: ['Root'] },
];

const STORAGE_KEY = 'module_permissions';

export const permissionService = {
    getPermissions: (): ModulePermission[] => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsedPermissions: ModulePermission[] = JSON.parse(stored);
            // Merge with defaults to ensure new modules are present
            return DEFAULT_PERMISSIONS.map(defaultPerm => {
                const storedPerm = parsedPermissions.find(p => p.id === defaultPerm.id);
                return storedPerm || defaultPerm;
            });
        }
        return DEFAULT_PERMISSIONS;
    },

    savePermissions: (permissions: ModulePermission[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
    },

    canAccessModule: (moduleId: string, role: Role): boolean => {
        if (role === 'Root') return true;
        const permissions = permissionService.getPermissions();
        const modulePerm = permissions.find(p => p.id === moduleId);
        return modulePerm ? modulePerm.allowedRoles.includes(role) : false;
    }
};
