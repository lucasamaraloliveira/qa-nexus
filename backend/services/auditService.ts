import { getDb } from '../database';
import fs from 'fs';

export class AuditService {
    private static configCache: Record<string, boolean> | null = null;
    private static globalEnabled: boolean = true;
    private static lastFetch: number = 0;
    private static CACHE_TTL = 60000; // 1 minute

    private static async getConfig(): Promise<Record<string, boolean>> {
        const now = Date.now();
        if (this.configCache && (now - this.lastFetch < this.CACHE_TTL)) {
            return this.configCache;
        }

        try {
            const db = getDb();
            const configResult = await db.get('SELECT value FROM system_settings WHERE key = ?', 'audit_config');
            const globalResult = await db.get('SELECT value FROM system_settings WHERE key = ?', 'audit_global_enabled');

            if (configResult && configResult.value) {
                this.configCache = JSON.parse(configResult.value);
            } else {
                // Default fallback
                this.configCache = {
                    AUTH: true, VERSIONS: true, DOCS: true, USEFUL_DOCS: true,
                    MANUALS: true, TEST_PLANS: true, CHANGELOG: true, USERS: true
                };
            }

            if (globalResult && globalResult.value !== undefined) {
                this.globalEnabled = globalResult.value === 'true';
            }

            this.lastFetch = now;
            return this.configCache!;
        } catch (error) {
            console.error('Failed to fetch audit config:', error);
            return {};
        }
    }

    static async shouldLog(module: string): Promise<boolean> {
        const config = await this.getConfig();
        if (!this.globalEnabled) return false;
        return config[module] !== false; // Default to true if undefined
    }

    static async updateConfig(newConfig: Record<string, boolean>) {
        const db = getDb();
        await db.run('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)', ['audit_config', JSON.stringify(newConfig)]);
        this.configCache = newConfig;
        this.lastFetch = Date.now();
    }

    static async logAction(
        userId: number | null,
        username: string,
        action: string,
        module: string,
        resourceId: string = '',
        details: string = '',
        req?: any
    ) {
        try {
            if (!(await this.shouldLog(module))) {
                return;
            }

            const db = getDb();
            const timestamp = new Date().toISOString();
            let ipAddress = '';

            if (req) {
                ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
            }

            await db.run(
                `INSERT INTO audit_logs (userId, username, action, module, resourceId, details, timestamp, ipAddress)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, username, action, module, resourceId, details, timestamp, ipAddress]
            );
        } catch (error) {
            console.error('Failed to log audit action:', error);
            // Don't throw, we don't want to break the main flow if logging fails
        }
    }

    static async getLogs(filters: {
        page?: number;
        limit?: number;
        module?: string;
        action?: string;
        username?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const db = getDb();
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params: any[] = [];

        if (filters.module) {
            query += ' AND module = ?';
            params.push(filters.module);
        }

        if (filters.action) {
            query += ' AND action = ?';
            params.push(filters.action);
        }

        if (filters.username) {
            query += ' AND username LIKE ?';
            params.push(`%${filters.username}%`);
        }

        if (filters.startDate) {
            query += ' AND timestamp >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND timestamp <= ?';
            params.push(filters.endDate);
        }

        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const totalResult = await db.get(countQuery, params);
        const total = totalResult.total;

        query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const logs = await db.all(query, params);

        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    static async getSettings() {
        return this.getConfig();
    }

    static async clearLogs() {
        const db = getDb();
        await db.run('DELETE FROM audit_logs');
    }

    static async toggleGlobalLogging(enabled: boolean) {
        try {
            fs.appendFileSync('debug.log', `toggleGlobalLogging called with: ${enabled}\n`);
            const db = getDb();
            fs.appendFileSync('debug.log', `DB keys: ${Object.keys(db).join(',')}\n`);
            await db.run('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)', ['audit_global_enabled', String(enabled)]);
            fs.appendFileSync('debug.log', 'DB run successful\n');
            this.globalEnabled = enabled;
        } catch (error) {
            fs.appendFileSync('debug.log', `Error in toggleGlobalLogging: ${error}\n`);
            console.error('Error in toggleGlobalLogging:', error);
            throw error;
        }
    }

    static async getGlobalStatus() {
        await this.getConfig(); // Ensure fresh
        return this.globalEnabled;
    }

    static clearConfigCache() {
        this.configCache = null;
        this.lastFetch = 0;
    }
}
