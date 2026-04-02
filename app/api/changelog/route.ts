import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';

export async function GET(req: Request) {
    try {
        initializeFirebase();
        const db = getDb();
        const items = await db.changelogSystem.findMany();
        return NextResponse.json(items);
    } catch (error) {
        console.error('Error fetching changelogs:', error);
        return NextResponse.json({ error: 'Failed to fetch changelogs' }, { status: 500 });
    }
}
