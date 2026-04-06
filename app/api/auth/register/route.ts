import { NextResponse } from 'next/server';
import { getDb, initializeDatabase } from '@/lib/backend/database';
import { AuditService } from '@/lib/backend/services/auditService';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        await initializeDatabase();
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 });
        }

        if (password.length < 4) {
            return NextResponse.json({ error: 'A senha deve ter pelo menos 4 caracteres' }, { status: 400 });
        }

        const db = getDb();

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { username }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Este nome de usuário já está em uso' }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await db.user.create({
            data: {
                username,
                password: hashedPassword,
                role: 'Tester' // Default role for new users
            }
        });

        await AuditService.logAction(user.id, username, 'REGISTER', 'AUTH', user.id, 'Novo usuário registrado', req);

        return NextResponse.json({ message: 'Conta criada com sucesso' }, { status: 201 });

    } catch (error: any) {
        console.error('Register Error:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
