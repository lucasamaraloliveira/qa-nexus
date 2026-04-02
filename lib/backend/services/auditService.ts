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
            const configResult = await db.systemSetting.findUnique({
                where: { key: 'audit_config' }
            });
            const globalResult = await db.systemSetting.findUnique({
                where: { key: 'audit_global_enabled' }
            });

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
        await db.systemSetting.upsert({
            where: { key: 'audit_config' },
            update: { value: JSON.stringify(newConfig) },
            create: { key: 'audit_config', value: JSON.stringify(newConfig) }
        });
        this.configCache = newConfig;
        this.lastFetch = Date.now();
    }

    static async logAction(
        userId: any,
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
                 // Support both Express req and Next.js Request
                 if (typeof req.headers?.get === 'function') {
                    // Next.js Request
                    ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || '';
                 } else if (req.headers) {
                    // Express req
                    const xForwardedFor = req.headers['x-forwarded-for'];
                    if (xForwardedFor) {
                        ipAddress = (Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor.split(',')[0]).trim();
                    } else {
                        ipAddress = req.socket?.remoteAddress || '';
                    }
                 }

                // Clean up IP address
                if (ipAddress.startsWith('::ffff:')) {
                    ipAddress = ipAddress.substring(7);
                }
                if (ipAddress === '::1') {
                    ipAddress = '127.0.0.1';
                }
            }

            await db.auditLog.create({
                data: {
                    userId: userId,
                    username,
                    action,
                    module,
                    resourceId,
                    details,
                    timestamp,
                    ipAddress
                }
            });
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
        const skip = (page - 1) * limit;

        const where: any = {};
        if (filters.module) where.module = filters.module;
        if (filters.action) where.action = filters.action;
        if (filters.username) {
            where.username = { contains: filters.username };
        }
        if (filters.startDate || filters.endDate) {
            where.timestamp = {};
            if (filters.startDate) where.timestamp.gte = filters.startDate;
            if (filters.endDate) where.timestamp.lte = filters.endDate;
        }

        const [logs, total] = await Promise.all([
            db.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: limit,
                skip
            }),
            db.auditLog.count({ where })
        ]);

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
        await db.auditLog.deleteMany();
    }

    static async toggleGlobalLogging(enabled: boolean) {
        try {
            const db = getDb();
            await db.systemSetting.upsert({
                where: { key: 'audit_global_enabled' },
                update: { value: String(enabled) },
                create: { key: 'audit_global_enabled', value: String(enabled) }
            });
            this.globalEnabled = enabled;
        } catch (error) {
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
