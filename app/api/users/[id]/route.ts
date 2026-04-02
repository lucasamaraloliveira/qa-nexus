import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload || userPayload.username !== 'root') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const { username, password, role } = await req.json();

        const db = getDb();
        const updateData: any = {};
        if (username) updateData.username = username;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (role) updateData.role = role;

        await db.user.update({
            where: { id: id }, // Firestore id is string
            data: updateData
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'UPDATE_USER', 'USERS', id, `Admin atualizou usuário ${id}`, req);

        return NextResponse.json({ message: 'User updated successfully' });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload || userPayload.role !== 'Root') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const db = getDb();
        
        // Don't allow deleting root by ID (additional check)
        const userToDelete = await db.user.findUnique({ where: { id } });
        if (userToDelete?.username === 'root') {
             return NextResponse.json({ error: 'Cannot delete root user' }, { status: 403 });
        }

        await db.user.delete({
            where: { id }
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'DELETE_USER', 'USERS', id, 'Admin excluiu usuário', req);

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
