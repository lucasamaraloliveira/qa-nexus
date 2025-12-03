import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import bcrypt from 'bcryptjs';

let db: Database;

export async function initializeDatabase() {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            versionNumber TEXT NOT NULL,
            releaseDate TEXT,
            status TEXT,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS scripts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version_id INTEGER,
            name TEXT,
            type TEXT,
            content TEXT,
            FOREIGN KEY(version_id) REFERENCES versions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS build_docs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            system TEXT,
            content TEXT,
            lastUpdated TEXT
        );

        CREATE TABLE IF NOT EXISTS useful_docs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT,
            lastUpdated TEXT
        );

        CREATE TABLE IF NOT EXISTS manuals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            originalName TEXT,
            path TEXT,
            type TEXT,
            size INTEGER,
            uploadDate TEXT,
            parentId TEXT,
            isFolder BOOLEAN DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS test_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            progress INTEGER
        );

        CREATE TABLE IF NOT EXISTS test_cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_plan_id INTEGER,
            title TEXT,
            preconditions TEXT,
            steps TEXT,
            expectedResult TEXT,
            status TEXT,
            estimatedTime TEXT,
            FOREIGN KEY(test_plan_id) REFERENCES test_plans(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            profilePicture TEXT,
            role TEXT DEFAULT 'Tester' -- 'Root', 'Admin', 'Tester', 'Viewer'
        );

        CREATE TABLE IF NOT EXISTS changelog_systems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS changelog_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            system_id INTEGER,
            version TEXT NOT NULL,
            date TEXT,
            type TEXT, -- 'major', 'minor', 'patch'
            FOREIGN KEY(system_id) REFERENCES changelog_systems(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS changelog_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER,
            title TEXT,
            description TEXT,
            type TEXT, -- 'feature', 'fix', 'improvement'
            category TEXT, -- optional
            image TEXT, -- URL to uploaded image
            FOREIGN KEY(entry_id) REFERENCES changelog_entries(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            username TEXT,
            action TEXT, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
            module TEXT, -- 'AUTH', 'VERSIONS', 'DOCS', etc.
            resourceId TEXT,
            details TEXT,
            timestamp TEXT,
            ipAddress TEXT
        );

        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);

    // Seed default audit settings if not exists
    try {
        const auditConfig = await db.get('SELECT value FROM system_settings WHERE key = ?', 'audit_config');
        if (!auditConfig) {
            const defaultConfig = {
                AUTH: true,
                VERSIONS: true,
                DOCS: true,
                USEFUL_DOCS: true,
                MANUALS: true,
                TEST_PLANS: true,
                CHANGELOG: true,
                USERS: true
            };
            await db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['audit_config', JSON.stringify(defaultConfig)]);
        }
    } catch (e) {
        console.error('Error seeding audit config:', e);
    }

    // Migration to add role column if it doesn't exist (for existing databases)
    try {
        await db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'Tester'");
    } catch (e) {
        // Column likely exists, ignore error
    }

    // Ensure root user is Root
    try {
        await db.run("UPDATE users SET role = 'Root' WHERE username = 'root'");
    } catch (e) {
        console.error('Error ensuring root is Root:', e);
    }

    // Migration for existing tables
    try {
        await db.exec(`ALTER TABLE manuals ADD COLUMN parentId TEXT;`);
    } catch (e) { }
    try {
        await db.exec(`ALTER TABLE manuals ADD COLUMN isFolder BOOLEAN DEFAULT 0;`);
    } catch (e) { }
    try {
        await db.exec(`ALTER TABLE test_cases ADD COLUMN estimatedTime TEXT;`);
    } catch (e) { }
    try {
        await db.exec(`ALTER TABLE test_cases ADD COLUMN priority TEXT;`);
    } catch (e) { }
    try {
        await db.exec(`ALTER TABLE test_cases ADD COLUMN assignedTo TEXT;`);
    } catch (e) { }
    try {
        await db.exec(`ALTER TABLE users ADD COLUMN profilePicture TEXT;`);
    } catch (e) { }
    try {
        await db.exec(`ALTER TABLE changelog_items ADD COLUMN image TEXT;`);
    } catch (e) { }

    // Seed root user
    try {
        const rootUser = await db.get('SELECT * FROM users WHERE username = ?', 'root');
        if (!rootUser) {
            const hashedPassword = await bcrypt.hash('root', 10);
            await db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['root', hashedPassword]);
            console.log('Root user created');
        }
    } catch (error) {
        console.error('Error seeding root user:', error);
    }

    console.log('Database initialized with QA Nexus schema');
}

export function getDb() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}
