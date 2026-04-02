import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';

export async function GET(req: Request) {
    try {
        initializeFirebase();
        const db = getDb();
        const users = await db.user.findMany({
            select: { id: true, username: true, role: true, profilePicture: true }
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
