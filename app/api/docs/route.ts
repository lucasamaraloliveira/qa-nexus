import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';

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
