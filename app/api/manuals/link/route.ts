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

        const { name, url, parentId } = await req.json();
        const db = getDb();
        
        const newLink = await db.manual.create({
            data: { 
                name, 
                url, 
                parentId, 
                type: 'link', 
                isFolder: false, 
                size: 0,
                uploadDate: new Date().toISOString()
            }
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'CREATE_LINK', 'MANUALS', newLink.id, `Link criado ${name} (${url})`, req);

        return NextResponse.json(newLink);
    } catch (error: any) {
        console.error('Error creating manual link:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
