import express from 'express';
import { getDb } from '../database';

const router = express.Router();

router.get('/', async (req, res) => {
    const { siteId } = req.query;
    try {
        const db = getDb();
        let query = 'SELECT * FROM logs';
        const params: any[] = [];

        if (siteId) {
            query += ' WHERE site_id = ?';
            params.push(siteId);
        }

        query += ' ORDER BY timestamp DESC LIMIT 100';

        const logs = await db.all(query, params);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

router.post('/', async (req, res) => {
    const { siteId, status, responseTime } = req.body;
    try {
        const db = getDb();
        await db.run(
            'INSERT INTO logs (site_id, status, response_time) VALUES (?, ?, ?)',
            [siteId, status, responseTime]
        );
        res.json({ message: 'Log added' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add log' });
    }
});

export default router;
