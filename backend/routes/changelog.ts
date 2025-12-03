import express from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

// Get all systems
router.get('/systems', async (req, res) => {
    try {
        const db = getDb();
        const systems = await db.all('SELECT * FROM changelog_systems');
        res.json(systems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch systems' });
    }
});

// Create a system
router.post('/systems', authenticateToken, async (req: any, res) => {
    const { name, description } = req.body;
    try {
        const db = getDb();
        const result = await db.run(
            'INSERT INTO changelog_systems (name, description) VALUES (?, ?)',
            [name, description]
        );

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'CHANGELOG', result.lastID?.toString() || '', `Sistema criado ${name}`, req);

        res.json({ id: result.lastID, name, description });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create system' });
    }
});

// Get entries for a system
router.get('/systems/:id/entries', async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDb();
        const entries = await db.all('SELECT * FROM changelog_entries WHERE system_id = ? ORDER BY id DESC', id);

        for (const entry of entries) {
            const items = await db.all('SELECT * FROM changelog_items WHERE entry_id = ?', entry.id);
            entry.items = items;
        }

        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// Create a changelog entry
router.post('/entries', authenticateToken, async (req: any, res) => {
    const { systemId, version, date, type, items } = req.body;
    try {
        const db = getDb();
        const result = await db.run(
            'INSERT INTO changelog_entries (system_id, version, date, type) VALUES (?, ?, ?, ?)',
            [systemId, version, date, type]
        );
        const entryId = result.lastID;

        if (items && Array.isArray(items)) {
            for (const item of items) {
                await db.run(
                    'INSERT INTO changelog_items (entry_id, title, description, type, category, image) VALUES (?, ?, ?, ?, ?, ?)',
                    [entryId, item.title, item.description, item.type, item.category, item.image]
                );
            }
        }

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'CHANGELOG', entryId?.toString() || '', `Entrada criada ${version} para o sistema ${systemId}`, req);

        res.json({ id: entryId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create entry' });
    }
});

// Update System
router.put('/systems/:id', authenticateToken, async (req: any, res) => {
    const { name, description } = req.body;
    try {
        const db = getDb();
        await db.run(
            'UPDATE changelog_systems SET name = ?, description = ? WHERE id = ?',
            [name, description, req.params.id]
        );

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'CHANGELOG', req.params.id, `Sistema atualizado ${name}`, req);

        res.json({ id: req.params.id, name, description });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update system' });
    }
});

// Update Entry
router.put('/entries/:id', authenticateToken, async (req: any, res) => {
    const { version, date, type, items } = req.body;
    try {
        const db = getDb();
        await db.run(
            'UPDATE changelog_entries SET version = ?, date = ?, type = ? WHERE id = ?',
            [version, date, type, req.params.id]
        );

        // Replace items
        await db.run('DELETE FROM changelog_items WHERE entry_id = ?', [req.params.id]);

        if (items && Array.isArray(items)) {
            for (const item of items) {
                await db.run(
                    'INSERT INTO changelog_items (entry_id, title, description, type, category, image) VALUES (?, ?, ?, ?, ?, ?)',
                    [req.params.id, item.title, item.description, item.type, item.category, item.image]
                );
            }
        }

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'CHANGELOG', req.params.id, `Entrada atualizada ${version}`, req);

        res.json({ id: req.params.id, ...req.body });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

// Delete System
router.delete('/systems/:id', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        await db.run('DELETE FROM changelog_systems WHERE id = ?', [req.params.id]);

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'CHANGELOG', req.params.id, 'Sistema excluído', req);

        res.json({ message: 'System deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete system' });
    }
});

// Delete Entry
router.delete('/entries/:id', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        // Delete items first (foreign key constraint might handle this if set to CASCADE, but explicit is safer)
        await db.run('DELETE FROM changelog_items WHERE entry_id = ?', [req.params.id]);
        await db.run('DELETE FROM changelog_entries WHERE id = ?', [req.params.id]);

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'CHANGELOG', req.params.id, 'Entrada excluída', req);

        res.json({ message: 'Entry deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

export default router;
