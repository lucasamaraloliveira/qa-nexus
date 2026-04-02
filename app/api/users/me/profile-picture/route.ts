import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { authenticate } from '@/lib/auth-server';
import { getStorage, initializeFirebase } from '@/lib/backend/firebase';
import { AuditService } from '@/lib/backend/services/auditService';

export async function PUT(req: Request) {
    try {
        console.log('--- Starting Profile Picture Upload ---');
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) {
            console.error('Upload failed: Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`Uploading picture for user: ${userPayload.username} (${userPayload.id})`);

        const formData = await req.formData();
        const file = formData.get('profilePicture') as File;
        if (!file) {
            console.error('Upload failed: No file found in FormData');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

        const storage = getStorage();
        if (!storage) {
             throw new Error('Firebase Storage not initialized');
        }

        const bucket = storage.bucket(`${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`);
        const filename = `profiles/${userPayload.id}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const fileRef = bucket.file(filename);

        console.log(`Saving to bucket: ${bucket.name} as ${filename}`);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await fileRef.save(buffer, {
            metadata: { contentType: file.type }
        });

        console.log('File successfully saved to Firebase Storage');

        // Construct Firebase Storage Public URL (media viewer)
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`;

        const db = getDb();
        await db.user.update({
            where: { id: userPayload.id },
            data: { profilePicture: url }
        });

        console.log('User document updated with new profile picture URL');

        await AuditService.logAction(userPayload.id, userPayload.username, 'UPDATE_PROFILE_PICTURE', 'USERS', userPayload.id, 'Usuário atualizou foto de perfil', req);

        return NextResponse.json({ message: 'Profile picture updated', profilePicture: url });
    } catch (error: any) {
        console.error('Critical internal error during photo upload:', error);
        return NextResponse.json({ 
            error: 'Failed to update profile picture',
            details: error.message 
        }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb();
        await db.user.update({
            where: { id: userPayload.id },
            data: { profilePicture: null }
        });

        // Note: In a production app, we would also delete the file from Storage.
        // For simplicity in this migration, we are just clearing the database reference.

        await AuditService.logAction(userPayload.id, userPayload.username, 'DELETE_PROFILE_PICTURE', 'USERS', userPayload.id, 'Usuário removeu foto de perfil', req);

        return NextResponse.json({ message: 'Profile picture removed' });
    } catch (error: any) {
        console.error('Error removing profile picture:', error);
        return NextResponse.json({ error: error.message || 'Failed to remove profile picture' }, { status: 500 });
    }
}
