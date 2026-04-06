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

        const { name, parentId } = await req.json();
        const db = getDb();
        const newFolder = await db.manual.create({
            data: { 
                name, 
                parentId, 
                type: 'folder', 
                isFolder: true,
                size: 0,
                uploadDate: new Date().toISOString()
            }
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'CREATE_FOLDER', 'MANUALS', newFolder.id, `Pasta criada ${name}`, req);

        return NextResponse.json(newFolder);
    } catch (error: any) {
        console.error('Error creating folder:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
