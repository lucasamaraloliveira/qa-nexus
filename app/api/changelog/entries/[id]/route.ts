import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

export async function PUT(req: Request, { params }: { params: any }) {
    try {
        const id = (await params).id;
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const db = getDb();
        const updated = await db.changelogEntry.update({
            where: { id },
            data
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'UPDATE', 'CHANGELOG', id, `Entrada atualizada: ${id}`, req);
        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: any }) {
    try {
        const id = (await params).id;
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const db = getDb();
        await db.changelogEntry.delete({ where: { id } });

        await AuditService.logAction(userPayload.id, userPayload.username, 'DELETE', 'CHANGELOG', id, `Entrada removida: ${id}`, req);
        return NextResponse.json({ message: 'Entry deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
