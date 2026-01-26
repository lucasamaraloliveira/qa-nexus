import express from 'express';
import { getDb } from '../database';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const sites = await db.site.findMany();
        res.json(sites);
    } catch (error) {
        console.error('Error fetching sites:', error);
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
        const newSite = await db.site.create({
            data: { name, url, status: 'PENDING' }
        });
        res.json(newSite);
    } catch (error) {
        console.error('Error adding site:', error);
        res.status(500).json({ error: 'Failed to add site' });
    }
});

router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, url } = req.body;
    try {
        const db = getDb();
        await db.site.update({
            where: { id },
            data: { name, url }
        });
        res.json({ message: 'Site updated' });
    } catch (error) {
        console.error('Error updating site:', error);
        res.status(500).json({ error: 'Failed to update site' });
    }
});

router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const db = getDb();
        await db.site.delete({
            where: { id }
        });
        res.json({ message: 'Site deleted' });
    } catch (error) {
        console.error('Error deleting site:', error);
        res.status(500).json({ error: 'Failed to delete site' });
    }
});

export default router;
