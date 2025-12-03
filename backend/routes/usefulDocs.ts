import express from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const docs = await db.all('SELECT * FROM useful_docs');
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch useful docs' });
    }
});

router.post('/', authenticateToken, async (req: any, res) => {
    const { title, content, lastUpdated } = req.body;
    try {
        const db = getDb();
        const result = await db.run(
            'INSERT INTO useful_docs (title, content, lastUpdated) VALUES (?, ?, ?)',
            [title, content, lastUpdated]
        );
        const docId = result.lastID;

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'USEFUL_DOCS', docId?.toString() || '', `Documento útil criado ${title}`, req);

        res.json({ id: docId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create useful doc' });
    }
});

router.put('/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const { title, content, lastUpdated } = req.body;
    try {
        const db = getDb();
        await db.run(
            'UPDATE useful_docs SET title = ?, content = ?, lastUpdated = ? WHERE id = ?',
            [title, content, lastUpdated, id]
        );

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'USEFUL_DOCS', id, `Documento útil atualizado ${title}`, req);

        res.json({ message: 'Useful doc updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update useful doc' });
    }
});

router.delete('/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    try {
        const db = getDb();
        await db.run('DELETE FROM useful_docs WHERE id = ?', id);

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'USEFUL_DOCS', id, 'Documento útil excluído', req);

        res.json({ message: 'Useful doc deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete useful doc' });
    }
});

export default router;
