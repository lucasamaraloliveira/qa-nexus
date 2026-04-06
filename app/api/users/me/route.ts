import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { authenticate } from '@/lib/auth-server';

export async function GET(req: Request) {
    try {
        const userPayload = authenticate(req);
        
        if (!userPayload) {
            console.warn('[API/ME] No valid token found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[API/ME] Fetching data for user ID:', userPayload.id);
        const db = getDb();
        const user = await db.user.findUnique({
            where: { id: String(userPayload.id) },
            select: { id: true, username: true, profilePicture: true, role: true }
        });

        if (!user) {
            console.warn('[API/ME] User not found in database for ID:', userPayload.id);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('[API/ME] Critical error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
