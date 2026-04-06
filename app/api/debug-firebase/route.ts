import { NextResponse } from 'next/server';
import { getFirebaseAdmin, initializeFirebase, getFirestore } from '@/lib/backend/firebase';

export async function GET() {
    try {
        initializeFirebase();
        const admin = getFirebaseAdmin();
        const db = getFirestore();
        
        if (!db) {
            return NextResponse.json({ 
                status: 'error', 
                message: 'Firestore not initialized',
                appsCount: admin.apps.length
            });
        }

        // Try a simple list collections or similar to verify credentials
        // Usually, getCollections() verifies if we can actually connect
        const collections = await db.listCollections();
        
        return NextResponse.json({ 
            status: 'success', 
            message: 'Firebase Admin Connected',
            appsCount: admin.apps.length,
            collections: collections.map(c => c.id),
            projectId: process.env.FIREBASE_PROJECT_ID
        });
    } catch (error: any) {
        return NextResponse.json({ 
            status: 'error', 
            message: error.message,
            stack: error.stack,
            projectId: process.env.FIREBASE_PROJECT_ID,
            email: process.env.FIREBASE_CLIENT_EMAIL
        });
    }
}
