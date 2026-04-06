import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

export async function GET(req: Request, { params }: { params: any }) {
    try {
        const id = (await params).id;
        initializeFirebase();
        const db = getDb();
        const doc = await db.buildDoc.findUnique({ where: { id } });
        if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
        return NextResponse.json(doc);
    } catch (error) {
        console.error('Error fetching doc:', error);
        return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: any }) {
    try {
        const id = (await params).id;
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const db = getDb();
        const updated = await db.buildDoc.update({
            where: { id },
            data
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'UPDATE', 'DOCS', id, `Documento atualizado: ${data.title || id}`, req);
        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error updating doc:', error);
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
        const doc = await db.buildDoc.findUnique({ where: { id } });
        if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });

        await db.buildDoc.delete({ where: { id } });

        await AuditService.logAction(userPayload.id, userPayload.username, 'DELETE', 'DOCS', id, `Documento excluído: ${doc.title || id}`, req);
        return NextResponse.json({ message: 'Documento excluído' });
    } catch (error: any) {
        console.error('Error deleting doc:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
