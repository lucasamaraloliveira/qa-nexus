import express from 'express';
import { AuditService } from '../services/auditService';
import { authenticateToken } from '../middleware/auth';
import { getDb } from '../database';

const router = express.Router();

// Get audit logs (Root/Admin only)
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        const user = await db.get('SELECT role FROM users WHERE id = ?', req.user.id);
        const role = user ? user.role : req.user.role;

        // Check permissions - only Root and Admin can view logs
        if (role !== 'Root' && role !== 'Admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const filters = {
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
            module: req.query.module as string,
            action: req.query.action as string,
            username: req.query.username as string,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string
        };

        const result = await AuditService.getLogs(filters);
        res.json(result);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Erro ao buscar logs de auditoria' });
    }
});

// Get audit settings (Root/Admin only)
router.get('/settings', authenticateToken, async (req: any, res) => {
    try {
        if (req.user.role !== 'Root' && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const settings = await AuditService.getSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching audit settings:', error);
        res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
});

// Update audit settings (Root only)
router.put('/settings', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        const user = await db.get('SELECT role FROM users WHERE id = ?', req.user.id);
        const role = user ? user.role : req.user.role;

        if (role !== 'Root') {
            return res.status(403).json({ error: 'Apenas Root pode alterar configurações de auditoria' });
        }
        await AuditService.updateConfig(req.body);
        res.json({ message: 'Configurações atualizadas com sucesso' });
    } catch (error) {
        console.error('Error updating audit settings:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
});

// Clear audit logs (Root only)
router.delete('/', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        const user = await db.get('SELECT role FROM users WHERE id = ?', req.user.id);
        const role = user ? user.role : req.user.role;

        if (role !== 'Root') {
            return res.status(403).json({ error: 'Apenas Root pode limpar os logs de auditoria' });
        }
        await AuditService.clearLogs();

        // Log the clear action itself (it will be the first new log)
        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'AUDIT', 'ALL', 'Limpou todos os logs de auditoria', req);

        res.json({ message: 'Logs de auditoria limpos com sucesso' });
    } catch (error) {
        console.error('Error clearing audit logs:', error);
        res.status(500).json({ error: 'Erro ao limpar logs de auditoria' });
    }
});

// Clear config cache (Root only)
router.post('/cache/clear', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        const user = await db.get('SELECT role FROM users WHERE id = ?', req.user.id);
        const role = user ? user.role : req.user.role;

        if (role !== 'Root') {
            return res.status(403).json({ error: 'Apenas Root pode limpar o cache de configuração' });
        }
        AuditService.clearConfigCache();
        res.json({ message: 'Cache de configuração limpo com sucesso' });
    } catch (error) {
        console.error('Error clearing config cache:', error);
        res.status(500).json({ error: 'Erro ao limpar cache' });
    }
});

// Get global status (Root/Admin only)
router.get('/status', authenticateToken, async (req: any, res) => {
    try {
        if (req.user.role !== 'Root' && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const enabled = await AuditService.getGlobalStatus();
        res.json({ enabled });
    } catch (error) {
        console.error('Error fetching global status:', error);
        res.status(500).json({ error: 'Erro ao buscar status global' });
    }
});

// Toggle global logging (Root only)
router.post('/status', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        const user = await db.get('SELECT role FROM users WHERE id = ?', req.user.id);
        const role = user ? user.role : req.user.role;

        if (role !== 'Root') {
            return res.status(403).json({ error: 'Apenas Root pode alterar o status global' });
        }
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'Status inválido' });
        }
        await AuditService.toggleGlobalLogging(enabled);

        const action = enabled ? 'Iniciou' : 'Parou';
        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'AUDIT', 'GLOBAL', `${action} o serviço de auditoria`, req);

        res.json({ message: `Serviço de auditoria ${enabled ? 'iniciado' : 'parado'} com sucesso` });
    } catch (error) {
        console.error('Error toggling global status:', error);
        res.status(500).json({ error: 'Erro ao alterar status global' });
    }
});

export default router;


