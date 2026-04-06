import { NextResponse } from 'next/server';
import { getFirebaseAdmin, initializeFirebase } from '@/lib/backend/firebase';
import { getDb } from '@/lib/backend/database';
import { AuditService } from '@/lib/backend/services/auditService';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'qa-nexus-secret-key-change-me';

export async function POST(req: Request) {
    try {
        // Ensure Firebase is initialized
        initializeFirebase();

        const { idToken } = await req.json();

        if (!idToken) {
            return NextResponse.json({ error: 'ID Token is required' }, { status: 400 });
        }

        const admin = getFirebaseAdmin();
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, name, picture } = decodedToken;

        const db = getDb();
        
        // Find or create user
        let user = await db.user.findUnique({
            where: { username: email } // Use email as username for Google users
        });

        if (!user) {
            user = await db.user.create({
                data: {
                    username: email!,
                    profilePicture: picture,
                    role: 'Tester' // Default role
                }
            });
            await AuditService.logAction(user.id, email!, 'REGISTER_GOOGLE', 'AUTH', user.id.toString(), 'Novo usuário registrado via Google', req);
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        await AuditService.logAction(user.id, user.username!, 'LOGIN_GOOGLE', 'AUTH', '', 'Usuário realizou login via Google', req);

        return NextResponse.json({
            token,
            username: user.username,
            role: user.role,
            id: user.id,
            profilePicture: user.profilePicture
        });

    } catch (error: any) {
        console.error('[AUTH/GOOGLE] Critical Authentication Error:', error);
        return NextResponse.json({ 
            error: error.message || 'Invalid ID Token',
            details: error.stack
        }, { status: 401 });
    }
}
