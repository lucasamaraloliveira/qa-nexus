import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

export async function GET(req: Request) {
    try {
        initializeFirebase();
        const db = getDb();
        const docs = await db.buildDoc.findMany();
        return NextResponse.json(docs);
    } catch (error) {
        console.error('Error fetching build docs:', error);
        return NextResponse.json({ error: 'Failed to fetch build docs' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const db = getDb();
        const newDoc = await db.buildDoc.create({ data });

        await AuditService.logAction(userPayload.id, userPayload.username, 'CREATE', 'DOCS', newDoc.id, `Documento criado ${data.title}`, req);

        return NextResponse.json(newDoc);
    } catch (error: any) {
        console.error('Error creating doc:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
