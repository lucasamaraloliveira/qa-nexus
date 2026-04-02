import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { authenticate } from '@/lib/auth-server';

export async function GET(req: Request) {
    try {
        const userPayload = authenticate(req);
        
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();
        const user = await db.user.findUnique({
            where: { id: userPayload.id },
            select: { id: true, username: true, profilePicture: true, role: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
