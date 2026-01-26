import express from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const versions = await db.version.findMany({
            include: { scripts: true }
        });

        res.json(versions);
    } catch (error) {
        console.error('Error fetching versions:', error);
        res.status(500).json({ error: 'Failed to fetch versions' });
    }
});

router.post('/', authenticateToken, async (req: any, res) => {
    const { versionNumber, releaseDate, status, description, scripts } = req.body;
    try {
        const db = getDb();
        const newVersion = await db.version.create({
            data: {
                versionNumber,
                releaseDate,
                status,
                description,
                scripts: {
                    create: scripts?.map((script: any) => ({
                        name: script.name,
                        type: script.type,
                        content: script.content,
                        folder: script.folder
                    })) || []
                }
            },
            include: { scripts: true }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'VERSIONS', newVersion.id.toString(), `Versão criada ${versionNumber}`, req);

        res.json(newVersion);
    } catch (error) {
        console.error('Error creating version:', error);
        res.status(500).json({ error: 'Failed to create version' });
    }
});

router.put('/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const { versionNumber, releaseDate, status, description, scripts } = req.body;
    try {
        const db = getDb();

        await db.$transaction(async (tx: any) => {
            await tx.version.update({
                where: { id },
                data: { versionNumber, releaseDate, status, description }
            });

            await tx.script.deleteMany({
                where: { versionId: id }
            });

            if (scripts && Array.isArray(scripts)) {
                await tx.script.createMany({
                    data: scripts.map((script: any) => ({
                        versionId: id,
                        name: script.name,
                        type: script.type,
                        content: script.content,
                        folder: script.folder
                    }))
                });
            }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'VERSIONS', id.toString(), `Versão atualizada ${versionNumber}`, req);

        res.json({ message: 'Version updated' });
    } catch (error) {
        console.error('Error updating version:', error);
        res.status(500).json({ error: 'Failed to update version' });
    }
});

router.delete('/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    try {
        const db = getDb();
        await db.version.delete({
            where: { id }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'VERSIONS', id.toString(), 'Versão excluída', req);

        res.json({ message: 'Version deleted' });
    } catch (error) {
        console.error('Error deleting version:', error);
        res.status(500).json({ error: 'Failed to delete version' });
    }
});

export default router;
