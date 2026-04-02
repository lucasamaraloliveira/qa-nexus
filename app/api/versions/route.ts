import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

export async function GET(req: Request) {
    try {
        initializeFirebase();
        const db = getDb();
        const versions = await db.version.findMany();
        return NextResponse.json(versions);
    } catch (error) {
        console.error('Error fetching versions:', error);
        return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const db = getDb();
        const newVersion = await db.version.create({ data });

        await AuditService.logAction(userPayload.id, userPayload.username, 'CREATE_VERSION', 'VERSIONS', newVersion.id, `Versão criada ${data.versionNumber}`, req);

        return NextResponse.json(newVersion);
    } catch (error: any) {
        console.error('Error creating version:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
