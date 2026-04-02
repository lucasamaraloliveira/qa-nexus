import { NextResponse } from 'next/server';
import { getStorage, initializeFirebase } from '@/lib/backend/firebase';

export async function POST(req: Request) {
    try {
        initializeFirebase();
        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bucket = getStorage()!.bucket();
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `scripts/${uniqueSuffix}-${file.name}`;
        const fileRef = bucket.file(filename);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await fileRef.save(buffer, {
            metadata: { contentType: file.type || 'text/plain' }
        });

        // Get file content (text)
        const content = buffer.toString('utf-8');

        // Construct Firebase Storage Public URL (media viewer)
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`;

        return NextResponse.json({
            path: url,
            filename: filename,
            originalName: file.name,
            content: content
        });
    } catch (error: any) {
        console.error('Error uploading script:', error);
        return NextResponse.json({ error: error.message || 'Failed to process uploaded file' }, { status: 500 });
    }
}
