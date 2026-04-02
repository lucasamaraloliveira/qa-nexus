import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';

export async function GET() {
    try {
        initializeFirebase();
        const db = getDb();
        const logs = await db.monitoringLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100
        });
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching monitoring logs:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
