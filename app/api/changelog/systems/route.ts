import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

export async function GET(req: Request) {
    try {
        initializeFirebase();
        const db = getDb();
        const systems = await db.changelogSystem.findMany();
        return NextResponse.json(systems);
    } catch (error) {
        console.error('Error fetching changelog systems:', error);
        return NextResponse.json({ error: 'Failed to fetch systems' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const db = getDb();
        const newSystem = await db.changelogSystem.create({ data });

        await AuditService.logAction(userPayload.id, userPayload.username, 'CREATE_SYSTEM', 'CHANGELOG', newSystem.id, `Sistema de changelog criado ${data.name}`, req);

        return NextResponse.json(newSystem);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
