import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const data = await req.json();
        const db = getDb();
        
        await db.usefulDoc.update({
            where: { id },
            data: { ...data, lastUpdated: new Date().toLocaleDateString('pt-BR') }
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'UPDATE_DOC', 'DOCS', id, `Doc atualizado ${data.title}`, req);

        return NextResponse.json({ message: 'Document updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const db = getDb();
        
        await db.usefulDoc.delete({
            where: { id }
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'DELETE_DOC', 'DOCS', id, 'Doc removido', req);

        return NextResponse.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
