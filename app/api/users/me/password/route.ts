import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { authenticate } from '@/lib/auth-server';
import bcrypt from 'bcryptjs';
import { AuditService } from '@/lib/backend/services/auditService';

export async function PUT(req: Request) {
    try {
        const userPayload = authenticate(req);
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
        }

        const db = getDb();
        const user = await db.user.findUnique({
            where: { id: userPayload.id } // id is now string from Firestore
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.password) {
            return NextResponse.json({ error: 'User does not have a password set' }, { status: 400 });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid current password' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        await AuditService.logAction(user.id, user.username, 'UPDATE_PASSWORD', 'USERS', user.id, 'Usuário atualizou sua senha', req);

        return NextResponse.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }
}
