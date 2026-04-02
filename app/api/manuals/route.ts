import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';
import { getStorage } from '@/lib/backend/firebase';

export async function GET(req: Request) {
    try {
        initializeFirebase();
        const { searchParams } = new URL(req.url);
        const parentId = searchParams.get('parentId') || null;
        const db = getDb();
        const manuals = await db.manual.findMany({
            where: { parentId: parentId }
        } as any);
        return NextResponse.json(manuals);
    } catch (error) {
        console.error('Error fetching manuals:', error);
        return NextResponse.json({ error: 'Failed to fetch manuals' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const parentId = formData.get('parentId') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const storage = getStorage();
        if (!storage) throw new Error('Firebase Storage not initialized');
        const bucket = storage.bucket(`${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`);
        const filename = `manuals/${Date.now()}-${file.name}`;
        const fileRef = bucket.file(filename);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await fileRef.save(buffer, {
            metadata: { contentType: file.type }
        });

        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`;

        const db = getDb();
        const newManual = await db.manual.create({
            data: { 
                name: file.name, 
                url, 
                parentId, 
                type: 'file',
                size: file.size,
                uploadedAt: new Date().toISOString()
            }
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'UPLOAD_MANUAL', 'MANUALS', newManual.id, `Manual enviado ${file.name}`, req);

        return NextResponse.json(newManual);
    } catch (error: any) {
        console.error('Error uploading manual:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
