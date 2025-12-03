import express from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const versions = await db.all('SELECT * FROM versions');

        for (const version of versions) {
            const scripts = await db.all('SELECT * FROM scripts WHERE version_id = ?', version.id);
            version.scripts = scripts;
        }

        res.json(versions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch versions' });
    }
});

router.post('/', authenticateToken, async (req: any, res) => {
    const { versionNumber, releaseDate, status, description, scripts } = req.body;
    try {
        const db = getDb();
        const result = await db.run(
            'INSERT INTO versions (versionNumber, releaseDate, status, description) VALUES (?, ?, ?, ?)',
            [versionNumber, releaseDate, status, description]
        );
        const versionId = result.lastID;

        if (scripts && Array.isArray(scripts)) {
            for (const script of scripts) {
                await db.run(
                    'INSERT INTO scripts (version_id, name, type, content) VALUES (?, ?, ?, ?)',
                    [versionId, script.name, script.type, script.content]
                );
            }
        }

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'VERSIONS', versionId?.toString() || '', `Versão criada ${versionNumber}`, req);

        res.json({ id: versionId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create version' });
    }
});

router.put('/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const { versionNumber, releaseDate, status, description, scripts } = req.body;
    try {
        const db = getDb();
        await db.run(
            'UPDATE versions SET versionNumber = ?, releaseDate = ?, status = ?, description = ? WHERE id = ?',
            [versionNumber, releaseDate, status, description, id]
        );

        // Update scripts: simple approach - delete all and recreate
        // In a real app, you might want to diff and update
        await db.run('DELETE FROM scripts WHERE version_id = ?', id);

        if (scripts && Array.isArray(scripts)) {
            for (const script of scripts) {
                await db.run(
                    'INSERT INTO scripts (version_id, name, type, content) VALUES (?, ?, ?, ?)',
                    [id, script.name, script.type, script.content]
                );
            }
        }

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'VERSIONS', id, `Versão atualizada ${versionNumber}`, req);

        res.json({ message: 'Version updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update version' });
    }
});

router.delete('/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    try {
        const db = getDb();
        await db.run('DELETE FROM versions WHERE id = ?', id); // Cascade delete handles scripts

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'VERSIONS', id, 'Versão excluída', req);

        res.json({ message: 'Version deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete version' });
    }
});

export default router;
