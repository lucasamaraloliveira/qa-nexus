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
        const users = await db.user.findMany({
            select: { id: true, username: true, role: true }
        });
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
        const user = await db.user.findUnique({
            where: { id: parseInt(req.user.id) },
            select: { id: true, username: true, profilePicture: true, role: true }
        });

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
        const user = await db.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.password) {
            return res.status(400).json({ error: 'User does not have a password set' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password!);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

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

        await db.user.update({
            where: { id: req.user.id },
            data: { profilePicture: profilePictureUrl }
        });

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
        const user = await db.user.findUnique({
            where: { id: req.user.id },
            select: { profilePicture: true }
        });

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

        await db.user.update({
            where: { id: req.user.id },
            data: { profilePicture: null }
        });

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
        const userIdToDelete = parseInt(req.params.id);
        await db.user.delete({
            where: { id: userIdToDelete }
        });

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
    const userId = parseInt(req.params.id);

    try {
        const db = getDb();

        const updateData: any = {};
        if (username) updateData.username = username;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (req.body.role) updateData.role = req.body.role;

        await db.user.update({
            where: { id: userId },
            data: updateData
        });

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE_USER', 'USERS', userId.toString(), `Admin atualizou usuário ${userId} (usuário: ${username || 'inalterado'}, função: ${req.body.role || 'inalterado'})`, req);

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

export default router;
