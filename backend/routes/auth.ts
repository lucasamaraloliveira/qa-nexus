import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database';
import { AuditService } from '../services/auditService';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'qa-nexus-secret-key-change-me';

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const db = getDb();
        const existingUser = await db.get('SELECT * FROM users WHERE username = ?', username);

        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );

        // Log Registration (using 0 or null for userId as it's new, or fetch it. For now let's just log the username)
        // We don't have the new ID easily without another query or using the result of insert. 
        // Let's just log with userId null.
        await AuditService.logAction(null, username, 'REGISTER', 'AUTH', '', 'Novo usuário registrado', req);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const db = getDb();
        const user = await db.get('SELECT * FROM users WHERE username = ?', username);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });

        // Log Login
        await AuditService.logAction(user.id, user.username, 'LOGIN', 'AUTH', '', 'Usuário realizou login', req);

        res.json({ token, username: user.username, role: user.role, id: user.id });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

export default router;
