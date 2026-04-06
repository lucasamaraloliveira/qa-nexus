import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase() {
    // If already initialized, we return early
    if (admin.apps.length > 0) {
        firebaseApp = admin.app();
        return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyRaw) {
        const errorMsg = `CRITICAL: Firebase Admin credentials missing. \n` +
                        `ID: ${projectId ? 'OK' : 'MISSING'}\n` +
                        `Email: ${clientEmail ? 'OK' : 'MISSING'}\n` +
                        `Key: ${privateKeyRaw ? 'OK' : 'MISSING'}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    try {
        // Robust cleaning of the private key for Vercel multiline issues
        const privateKey = privateKeyRaw
            .replace(/\\n/g, '\n')
            .replace(/"/g, '')
            .replace(/'/g, '')
            .trim();

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: projectId,
                clientEmail: clientEmail,
                privateKey: privateKey,
            }),
            databaseURL: `https://${projectId}.firebaseio.com`,
            storageBucket: `${projectId}.firebasestorage.app`
        });
        
        console.log(`Firebase Admin: App initialized successfully for project ${projectId}`);
    } catch (error: any) {
        console.error('Firebase Admin: Initialization failure!', error.message);
        throw new Error('Falha crítica na inicialização do Firebase Admin: ' + error.message);
    }
}

export function getFirebaseAdmin() {
    return admin;
}

export function getFirestore() {
    if (!firebaseApp) initializeFirebase();
    return firebaseApp ? firebaseApp.firestore() : null;
}

export function getStorage() {
    if (!firebaseApp) initializeFirebase();
    return firebaseApp ? firebaseApp.storage() : null;
}

export { firebaseApp };
