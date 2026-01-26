import express from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const docs = await db.usefulDoc.findMany();
        res.json(docs);
    } catch (error) {
        console.error('Error fetching useful docs:', error);
        res.status(500).json({ error: 'Failed to fetch useful docs' });
    }
});

router.post('/', authenticateToken, async (req: any, res) => {
    const { title, content, lastUpdated } = req.body;
    try {
        const db = getDb();
        const newDoc = await db.usefulDoc.create({
            data: { title, content, lastUpdated }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'USEFUL_DOCS', newDoc.id.toString(), `Documento útil criado ${title}`, req);

        res.json(newDoc);
    } catch (error) {
        console.error('Error creating useful doc:', error);
        res.status(500).json({ error: 'Failed to create useful doc' });
    }
});

router.put('/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const { title, content, lastUpdated } = req.body;
    try {
        const db = getDb();
        await db.usefulDoc.update({
            where: { id },
            data: { title, content, lastUpdated }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'USEFUL_DOCS', id.toString(), `Documento útil atualizado ${title}`, req);

        res.json({ message: 'Useful doc updated' });
    } catch (error) {
        console.error('Error updating useful doc:', error);
        res.status(500).json({ error: 'Failed to update useful doc' });
    }
});

router.delete('/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    try {
        const db = getDb();
        await db.usefulDoc.delete({
            where: { id }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'USEFUL_DOCS', id.toString(), 'Documento útil excluído', req);

        res.json({ message: 'Useful doc deleted' });
    } catch (error) {
        console.error('Error deleting useful doc:', error);
        res.status(500).json({ error: 'Failed to delete useful doc' });
    }
});

export default router;
