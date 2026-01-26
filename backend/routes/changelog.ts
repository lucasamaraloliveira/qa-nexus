import express from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

// Get all systems
router.get('/systems', async (req, res) => {
    try {
        const db = getDb();
        const systems = await db.changelogSystem.findMany();
        res.json(systems);
    } catch (error) {
        console.error('Error fetching systems:', error);
        res.status(500).json({ error: 'Failed to fetch systems' });
    }
});

// Create a system
router.post('/systems', authenticateToken, async (req: any, res) => {
    const { name, description } = req.body;
    try {
        const db = getDb();
        const newSystem = await db.changelogSystem.create({
            data: { name, description }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'CHANGELOG', newSystem.id.toString(), `Sistema criado ${name}`, req);

        res.json(newSystem);
    } catch (error) {
        console.error('Error creating system:', error);
        res.status(500).json({ error: 'Failed to create system' });
    }
});

// Get entries for a system
router.get('/systems/:id/entries', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const db = getDb();
        const entries = await db.changelogEntry.findMany({
            where: { systemId: id },
            include: { items: true },
            orderBy: { id: 'desc' }
        });

        res.json(entries);
    } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// Create a changelog entry
router.post('/entries', authenticateToken, async (req: any, res) => {
    const { systemId, version, date, type, items } = req.body;
    try {
        const db = getDb();
        const newEntry = await db.changelogEntry.create({
            data: {
                systemId: parseInt(systemId),
                version,
                date,
                type,
                items: {
                    create: items?.map((item: any) => ({
                        title: item.title,
                        description: item.description,
                        type: item.type,
                        category: item.category,
                        image: item.image
                    })) || []
                }
            },
            include: { items: true }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'CHANGELOG', newEntry.id.toString(), `Entrada criada ${version} para o sistema ${systemId}`, req);

        res.json(newEntry);
    } catch (error) {
        console.error('Error creating entry:', error);
        res.status(500).json({ error: 'Failed to create entry' });
    }
});

// Update System
router.put('/systems/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;
    try {
        const db = getDb();
        await db.changelogSystem.update({
            where: { id },
            data: { name, description }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'CHANGELOG', id.toString(), `Sistema atualizado ${name}`, req);

        res.json({ id, name, description });
    } catch (error) {
        console.error('Error updating system:', error);
        res.status(500).json({ error: 'Failed to update system' });
    }
});

// Update Entry
router.put('/entries/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const { version, date, type, items } = req.body;
    try {
        const db = getDb();

        await db.$transaction(async (tx: any) => {
            await tx.changelogEntry.update({
                where: { id },
                data: { version, date, type }
            });

            await tx.changelogItem.deleteMany({
                where: { entryId: id }
            });

            if (items && Array.isArray(items)) {
                await tx.changelogItem.createMany({
                    data: items.map((item: any) => ({
                        entryId: id,
                        title: item.title,
                        description: item.description,
                        type: item.type,
                        category: item.category,
                        image: item.image
                    }))
                });
            }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'CHANGELOG', id.toString(), `Entrada atualizada ${version}`, req);

        res.json({ id, ...req.body });
    } catch (error) {
        console.error('Error updating entry:', error);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

// Delete System
router.delete('/systems/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    try {
        const db = getDb();
        await db.changelogSystem.delete({
            where: { id }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'CHANGELOG', id.toString(), 'Sistema excluído', req);

        res.json({ message: 'System deleted' });
    } catch (error) {
        console.error('Error deleting system:', error);
        res.status(500).json({ error: 'Failed to delete system' });
    }
});

// Delete Entry
router.delete('/entries/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    try {
        const db = getDb();
        await db.changelogEntry.delete({
            where: { id }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'CHANGELOG', id.toString(), 'Entrada excluída', req);

        res.json({ message: 'Entry deleted' });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

export default router;
