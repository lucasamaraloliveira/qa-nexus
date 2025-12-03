import sqlite3 from 'sqlite3';

const sql = sqlite3.verbose();
const db = new sql.Database('backend/database.sqlite', (err) => {
    if (err) console.error(err.message);
});

db.all("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5", [], (err, logs) => {
    if (err) console.error(err);
    else console.log('Last 5 logs:', logs);
    db.close();
});
