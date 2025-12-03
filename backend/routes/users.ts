import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'qa-nexus-secret-key-change-me';

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/profiles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Get all users (for dropdowns)
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        const users = await db.all('SELECT id, username, role FROM users');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get current user details
router.get('/me', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        const user = await db.get('SELECT id, username, profilePicture, role FROM users WHERE id = ?', req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// Update password
router.put('/me/password', authenticateToken, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }

    try {
        const db = getDb();
        const user = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE_PASSWORD', 'USERS', req.user.id.toString(), 'Usuário atualizou sua senha', req);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Upload profile picture
router.put('/me/profile-picture', authenticateToken, upload.single('profilePicture'), async (req: any, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const db = getDb();
        const profilePictureUrl = `/api/uploads/profiles/${req.file.filename}`;

        await db.run('UPDATE users SET profilePicture = ? WHERE id = ?', [profilePictureUrl, req.user.id]);

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE_PROFILE_PICTURE', 'USERS', req.user.id.toString(), 'Usuário atualizou foto de perfil', req);

        res.json({ message: 'Profile picture updated', profilePicture: profilePictureUrl });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({ error: 'Failed to update profile picture' });
    }
});

// Delete profile picture
router.delete('/me/profile-picture', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        const user = await db.get('SELECT profilePicture FROM users WHERE id = ?', req.user.id);

        if (user && user.profilePicture) {
            // Construct absolute path to the file
            // profilePicture is like /api/uploads/profiles/filename.ext
            const relativePath = user.profilePicture.replace('/api/uploads/profiles/', '');
            const filePath = path.join(__dirname, '../uploads/profiles', relativePath);

            // Delete file if it exists
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await db.run('UPDATE users SET profilePicture = NULL WHERE id = ?', req.user.id);

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE_PROFILE_PICTURE', 'USERS', req.user.id.toString(), 'Usuário removeu foto de perfil', req);

        res.json({ message: 'Profile picture removed' });
    } catch (error) {
        console.error('Error removing profile picture:', error);
        res.status(500).json({ error: 'Failed to remove profile picture' });
    }
});

// Admin: Delete user
router.delete('/:id', authenticateToken, async (req: any, res) => {
    // Only allow if current user is root
    if (req.user.username !== 'root') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const db = getDb();
        await db.run('DELETE FROM users WHERE id = ?', req.params.id);

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE_USER', 'USERS', req.params.id, 'Admin excluiu usuário', req);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Admin: Update user (password/username)
router.put('/:id', authenticateToken, async (req: any, res) => {
    // Only allow if current user is root
    if (req.user.username !== 'root') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { username, password } = req.body;
    const userId = req.params.id;

    try {
        const db = getDb();

        if (username) {
            await db.run('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
        }

        if (req.body.role) {
            await db.run('UPDATE users SET role = ? WHERE id = ?', [req.body.role, userId]);
        }

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE_USER', 'USERS', userId, `Admin atualizou usuário ${userId} (usuário: ${username || 'inalterado'}, função: ${req.body.role || 'inalterado'})`, req);

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

export default router;
