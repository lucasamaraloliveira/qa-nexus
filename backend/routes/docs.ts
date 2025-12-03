import express from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const docs = await db.all('SELECT * FROM build_docs');
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch docs' });
    }
});

router.post('/', authenticateToken, async (req: any, res) => {
    const { title, system, content, lastUpdated } = req.body;
    try {
        const db = getDb();
        const result = await db.run(
            'INSERT INTO build_docs (title, system, content, lastUpdated) VALUES (?, ?, ?, ?)',
            [title, system, content, lastUpdated]
        );
        const docId = result.lastID;

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'DOCS', docId?.toString() || '', `Documento criado ${title}`, req);

        res.json({ id: docId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create doc' });
    }
});

router.put('/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const { title, system, content, lastUpdated } = req.body;
    try {
        const db = getDb();
        await db.run(
            'UPDATE build_docs SET title = ?, system = ?, content = ?, lastUpdated = ? WHERE id = ?',
            [title, system, content, lastUpdated, id]
        );

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'DOCS', id, `Documento atualizado ${title}`, req);

        res.json({ message: 'Doc updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update doc' });
    }
});

router.delete('/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    try {
        const db = getDb();
        await db.run('DELETE FROM build_docs WHERE id = ?', id);

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'DOCS', id, 'Documento excluído', req);

        res.json({ message: 'Doc deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete doc' });
    }
});

export default router;
