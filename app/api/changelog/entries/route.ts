import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

export async function POST(req: Request) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const db = getDb();
        const newEntry = await db.changelogEntry.create({ data });

        await AuditService.logAction(userPayload.id, userPayload.username, 'CREATE_ENTRY', 'CHANGELOG', newEntry.id, `Entrada de changelog criada no sistema ${data.systemId}`, req);

        return NextResponse.json(newEntry);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
