import express from 'express';
import { getDb } from '../database';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const sites = await db.all('SELECT * FROM sites');
        res.json(sites);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sites' });
    }
});

router.post('/', async (req, res) => {
    const { name, url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    try {
        const db = getDb();
        const result = await db.run(
            'INSERT INTO sites (name, url, status, last_checked) VALUES (?, ?, ?, ?)',
            [name, url, 'PENDING', null]
        );
        res.json({ id: result.lastID, name, url, status: 'PENDING' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add site' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, url } = req.body;
    try {
        const db = getDb();
        await db.run(
            'UPDATE sites SET name = ?, url = ? WHERE id = ?',
            [name, url, id]
        );
        res.json({ message: 'Site updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update site' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDb();
        await db.run('DELETE FROM sites WHERE id = ?', id);
        res.json({ message: 'Site deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete site' });
    }
});

export default router;
