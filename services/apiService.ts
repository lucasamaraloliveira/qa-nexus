import { Version, BuildDoc, TestPlan, UsefulDoc, Manual, ChangelogSystem, ChangelogEntry, AuditLog } from '../types';

const API_URL = '/api';

const getHeaders = (contentType: string = 'application/json') => {
    const token = localStorage.getItem('token');
    const headers: any = {
        'Content-Type': contentType,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const apiService = {
    // Versions
    async getVersions(): Promise<Version[]> {
        const response = await fetch(`${API_URL}/versions`);
        if (!response.ok) throw new Error('Failed to fetch versions');
        return response.json();
    },

    async createVersion(version: Omit<Version, 'id'>): Promise<Version> {
        const response = await fetch(`${API_URL}/versions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(version),
        });
        if (!response.ok) throw new Error('Failed to create version');
        return response.json();
    },

    async updateVersion(version: Version): Promise<void> {
        const response = await fetch(`${API_URL}/versions/${version.id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(version),
        });
        if (!response.ok) throw new Error('Failed to update version');
    },

    async deleteVersion(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/versions/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete version');
    },

    async uploadScript(file: File): Promise<{ path: string, content: string, originalName: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/upload/script`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload script');
        return response.json();
    },

    // Docs
    async getDocs(): Promise<BuildDoc[]> {
        const response = await fetch(`${API_URL}/docs`);
        if (!response.ok) throw new Error('Failed to fetch docs');
        return response.json();
    },

    async createDoc(doc: Omit<BuildDoc, 'id'>): Promise<BuildDoc> {
        const response = await fetch(`${API_URL}/docs`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(doc),
        });
        if (!response.ok) throw new Error('Failed to create doc');
        return response.json();
    },

    async updateDoc(doc: BuildDoc): Promise<void> {
        const response = await fetch(`${API_URL}/docs/${doc.id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(doc),
        });
        if (!response.ok) throw new Error('Failed to update doc');
    },

    async deleteDoc(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/docs/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete doc');
    },

    // Useful Docs
    async getUsefulDocs(): Promise<UsefulDoc[]> {
        const response = await fetch(`${API_URL}/useful-docs`);
        if (!response.ok) throw new Error('Failed to fetch useful docs');
        return response.json();
    },

    async createUsefulDoc(doc: Omit<UsefulDoc, 'id'>): Promise<UsefulDoc> {
        const response = await fetch(`${API_URL}/useful-docs`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(doc),
        });
        if (!response.ok) throw new Error('Failed to create useful doc');
        return response.json();
    },

    async updateUsefulDoc(doc: UsefulDoc): Promise<void> {
        const response = await fetch(`${API_URL}/useful-docs/${doc.id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(doc),
        });
        if (!response.ok) throw new Error('Failed to update useful doc');
    },

    async deleteUsefulDoc(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/useful-docs/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete useful doc');
    },

    // Manuals
    async getManuals(parentId: string | null = null): Promise<Manual[]> {
        const query = parentId ? `?parentId=${parentId}` : '';
        const response = await fetch(`${API_URL}/manuals${query}`);
        if (!response.ok) throw new Error('Failed to fetch manuals');
        return response.json();
    },

    async createFolder(name: string, parentId: string | null = null): Promise<Manual> {
        const response = await fetch(`${API_URL}/manuals/folder`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, parentId }),
        });
        if (!response.ok) throw new Error('Failed to create folder');
        return response.json();
    },

    async uploadManual(file: File, parentId: string | null = null): Promise<Manual> {
        const formData = new FormData();
        formData.append('file', file);
        if (parentId) {
            formData.append('parentId', parentId);
        }
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/manuals`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to upload manual');
        }
        return response.json();
    },

    async deleteManual(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/manuals/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete manual');
    },

    // Test Plans
    async getTestPlans(): Promise<TestPlan[]> {
        const response = await fetch(`${API_URL}/test-plans`);
        if (!response.ok) throw new Error('Failed to fetch test plans');
        return response.json();
    },

    async createTestPlan(plan: Omit<TestPlan, 'id'>): Promise<TestPlan> {
        const response = await fetch(`${API_URL}/test-plans`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(plan),
        });
        if (!response.ok) throw new Error('Failed to create test plan');
        return response.json();
    },

    async updateTestPlan(plan: TestPlan): Promise<void> {
        const response = await fetch(`${API_URL}/test-plans/${plan.id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(plan),
        });
        if (!response.ok) throw new Error('Failed to update test plan');
    },

    async deleteTestPlan(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/test-plans/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete test plan');
    },

    async resetTestPlanStatus(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/test-plans/${id}/reset-status`, {
            method: 'PUT',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to reset test plan status');
    },

    async duplicateTestPlan(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/test-plans/${id}/duplicate`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to duplicate test plan');
    },

    async replicateTestCases(targetId: string, sourceId: string): Promise<void> {
        const response = await fetch(`${API_URL}/test-plans/${targetId}/replicate-cases`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ sourcePlanId: sourceId }),
        });
        if (!response.ok) throw new Error('Failed to replicate test cases');
    },

    // Users
    async getUsers(): Promise<{ id: number, username: string, role: string }[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    // Admin
    async deleteUser(id: number): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete user');
    },

    async updateUserAdmin(id: number, data: { username?: string, password?: string, role?: string }): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update user');
    },

    // Auth
    async login(username: string, password: string): Promise<{ token: string, username: string, role: string, id: number }> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to login');
        return data;
    },

    async register(username: string, password: string): Promise<void> {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to register');
    },

    // Changelog
    async getChangelogSystems(): Promise<ChangelogSystem[]> {
        const response = await fetch(`${API_URL}/changelog/systems`);
        if (!response.ok) throw new Error('Failed to fetch changelog systems');
        return response.json();
    },

    async createChangelogSystem(system: Omit<ChangelogSystem, 'id'>): Promise<ChangelogSystem> {
        const response = await fetch(`${API_URL}/changelog/systems`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(system),
        });
        if (!response.ok) throw new Error('Failed to create changelog system');
        return response.json();
    },

    async getChangelogEntries(systemId: string): Promise<ChangelogEntry[]> {
        const response = await fetch(`${API_URL}/changelog/systems/${systemId}/entries`);
        if (!response.ok) throw new Error('Failed to fetch changelog entries');
        return response.json();
    },

    async createChangelogEntry(entry: Omit<ChangelogEntry, 'id'>): Promise<ChangelogEntry> {
        const response = await fetch(`${API_URL}/changelog/entries`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(entry),
        });
        if (!response.ok) throw new Error('Failed to create entry');
        return response.json();
    },

    async updateChangelogEntry(id: string, entry: Omit<ChangelogEntry, 'id'>): Promise<ChangelogEntry> {
        const response = await fetch(`${API_URL}/changelog/entries/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(entry),
        });
        if (!response.ok) throw new Error('Failed to update entry');
        return response.json();
    },

    async deleteChangelogEntry(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/changelog/entries/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete entry');
    },

    async updateChangelogSystem(id: string, data: Partial<ChangelogSystem>): Promise<ChangelogSystem> {
        const response = await fetch(`${API_URL}/changelog/systems/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update system');
        return response.json();
    },

    async deleteChangelogSystem(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/changelog/systems/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete system');
    },

    async uploadImage(file: File): Promise<{ url: string, filename: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/upload/image`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload image');
        return response.json();
    },

    // Audit Logs
    async getAuditLogs(filters: any = {}): Promise<{ logs: AuditLog[], total: number, page: number, totalPages: number }> {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                queryParams.append(key, filters[key]);
            }
        });

        const response = await fetch(`${API_URL}/audit-logs?${queryParams.toString()}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch audit logs');
        return response.json();
    },

    async getAuditSettings(): Promise<Record<string, boolean>> {
        const response = await fetch(`${API_URL}/audit-logs/settings`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch audit settings');
        return response.json();
    },

    async updateAuditSettings(settings: Record<string, boolean>): Promise<void> {
        const response = await fetch(`${API_URL}/audit-logs/settings`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(settings),
        });
        if (!response.ok) throw new Error('Failed to update audit settings');
        return response.json();
    },

    async clearAuditLogs(): Promise<void> {
        const response = await fetch(`${API_URL}/audit-logs`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to clear audit logs');
        return response.json();
    },

    async clearAuditCache(): Promise<void> {
        const response = await fetch(`${API_URL}/audit-logs/cache/clear`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to clear audit cache');
        return response.json();
    },

    async getAuditGlobalStatus(): Promise<{ enabled: boolean }> {
        const response = await fetch(`${API_URL}/audit-logs/status`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch audit global status');
        return response.json();
    },

    async toggleAuditGlobalStatus(enabled: boolean): Promise<void> {
        const response = await fetch(`${API_URL}/audit-logs/status`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ enabled }),
        });
        if (!response.ok) throw new Error('Failed to toggle audit global status');
        return response.json();
    }
};
