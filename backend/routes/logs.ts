import express from 'express';
import { getDb } from '../database';

const router = express.Router();

router.get('/', async (req, res) => {
    const siteId = req.query.siteId ? parseInt(req.query.siteId as string) : undefined;
    try {
        const db = getDb();
        const logs = await db.monitoringLog.findMany({
            where: siteId ? { siteId } : {},
            orderBy: { timestamp: 'desc' },
            take: 100
        });
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

router.post('/', async (req, res) => {
    const { siteId, status, responseTime } = req.body;
    try {
        const db = getDb();
        await db.monitoringLog.create({
            data: {
                siteId: parseInt(siteId),
                status: parseInt(status),
                responseTime: parseInt(responseTime)
            }
        });
        res.json({ message: 'Log added' });
    } catch (error) {
        console.error('Error adding log:', error);
        res.status(500).json({ error: 'Failed to add log' });
    }
});

export default router;
