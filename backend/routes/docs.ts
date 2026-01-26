import express from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const docs = await db.buildDoc.findMany();
        res.json(docs);
    } catch (error) {
        console.error('Error fetching docs:', error);
        res.status(500).json({ error: 'Failed to fetch docs' });
    }
});

router.post('/', authenticateToken, async (req: any, res) => {
    const { title, system, content, lastUpdated } = req.body;
    try {
        const db = getDb();
        const newDoc = await db.buildDoc.create({
            data: { title, system, content, lastUpdated }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'DOCS', newDoc.id.toString(), `Documento criado ${title}`, req);

        res.json(newDoc);
    } catch (error) {
        console.error('Error creating doc:', error);
        res.status(500).json({ error: 'Failed to create doc' });
    }
});

router.put('/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const { title, system, content, lastUpdated } = req.body;
    try {
        const db = getDb();
        await db.buildDoc.update({
            where: { id },
            data: { title, system, content, lastUpdated }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'DOCS', id.toString(), `Documento atualizado ${title}`, req);

        res.json({ message: 'Doc updated' });
    } catch (error) {
        console.error('Error updating doc:', error);
        res.status(500).json({ error: 'Failed to update doc' });
    }
});

router.delete('/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    try {
        const db = getDb();
        await db.buildDoc.delete({
            where: { id }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'DOCS', id.toString(), 'Documento excluído', req);

        res.json({ message: 'Doc deleted' });
    } catch (error) {
        console.error('Error deleting doc:', error);
        res.status(500).json({ error: 'Failed to delete doc' });
    }
});

export default router;
