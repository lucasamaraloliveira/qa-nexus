import sqlite3 from 'sqlite3';

const sql = sqlite3.verbose();
const db = new sql.Database('backend/database.sqlite', (err) => {
    if (err) console.error('Error opening database:', err.message);
});

const newConfig = {
    AUTH: true,
    VERSIONS: true,
    DOCS: true,
    USEFUL_DOCS: true,
    MANUALS: true,
    TEST_PLANS: true,
    CHANGELOG: true,
    USERS: true
};

db.run("INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)", ['audit_config', JSON.stringify(newConfig)], (err) => {
    if (err) {
        console.error('Error updating config:', err.message);
    } else {
        console.log('Audit config updated to enable all modules.');
    }
    db.close();
});
