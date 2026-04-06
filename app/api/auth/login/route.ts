import { NextResponse } from 'next/server';
import { getDb, initializeDatabase } from '@/lib/backend/database';
import { AuditService } from '@/lib/backend/services/auditService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'qa-nexus-secret-key-change-me';

export async function POST(req: Request) {
    try {
        await initializeDatabase();
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 });
        }

        const db = getDb();

        // Find user by username
        const user = await db.user.findUnique({
            where: { username }
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 });
        }

        // Check if user has a password (Google users may not)
        if (!user.password) {
            return NextResponse.json({ error: 'Esta conta usa login via Google. Use o botão Google para entrar.' }, { status: 401 });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        await AuditService.logAction(user.id, user.username, 'LOGIN', 'AUTH', '', 'Usuário realizou login', req);

        return NextResponse.json({
            token,
            username: user.username,
            role: user.role,
            id: user.id,
            profilePicture: user.profilePicture || null
        });

    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
