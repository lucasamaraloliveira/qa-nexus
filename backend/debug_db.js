const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function debugDb() {
    try {
        const db = await open({
            filename: path.join(__dirname, 'database.sqlite'),
            driver: sqlite3.Database
        });

        console.log('Checking table info...');
        const tableInfo = await db.all("PRAGMA table_info(system_settings)");
        console.log('Table Info:', tableInfo);

        console.log('Attempting Insert or Replace...');
        await db.run('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)', ['audit_global_enabled', 'false']);
        console.log('Insert successful.');

        const row = await db.get('SELECT * FROM system_settings WHERE key = ?', 'audit_global_enabled');
        console.log('Row:', row);

    } catch (error) {
        console.error('DB Error:', error);
    }
}

debugDb();
