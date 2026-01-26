import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

export async function initializeDatabase() {
    try {
        // Test connectivity
        await prisma.$connect();
        console.log('Connected to database via Prisma');

        // Seed default audit settings if not exists
        const auditConfig = await prisma.systemSetting.findUnique({
            where: { key: 'audit_config' }
        });

        if (!auditConfig) {
            const defaultConfig = {
                AUTH: true,
                VERSIONS: true,
                DOCS: true,
                USEFUL_DOCS: true,
                MANUALS: true,
                TEST_PLANS: true,
                CHANGELOG: true,
                USERS: true,
                SITES: true
            };
            await prisma.systemSetting.create({
                data: {
                    key: 'audit_config',
                    value: JSON.stringify(defaultConfig)
                }
            });
            console.log('Default audit config seeded');
        }

        // Ensure root user exists
        const rootUser = await prisma.user.findUnique({
            where: { username: 'root' }
        });

        if (!rootUser) {
            const hashedPassword = await bcrypt.hash('root', 10);
            await prisma.user.create({
                data: {
                    username: 'root',
                    password: hashedPassword,
                    role: 'Root'
                }
            });
            console.log('Root user created');
        } else if (rootUser.role !== 'Root') {
            await prisma.user.update({
                where: { username: 'root' },
                data: { role: 'Root' }
            });
            console.log('Root user role updated to Root');
        }

        console.log('Database initialized with QA Nexus schema via Prisma');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

export function getDb() {
    return prisma;
}

export { prisma };
