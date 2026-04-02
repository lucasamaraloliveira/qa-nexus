import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

export async function GET(req: Request) {
    try {
        initializeFirebase();
        const db = getDb();
        const docs = await db.usefulDoc.findMany();
        return NextResponse.json(docs);
    } catch (error) {
        console.error('Error fetching useful docs:', error);
        return NextResponse.json({ error: 'Failed to fetch useful docs' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const db = getDb();
        const newDoc = await db.usefulDoc.create({
            data: { ...data, lastUpdated: new Date().toLocaleDateString('pt-BR') }
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'CREATE_DOC', 'DOCS', newDoc.id, `Doc criado ${data.title}`, req);

        return NextResponse.json(newDoc);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
