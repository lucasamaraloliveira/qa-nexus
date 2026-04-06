import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase() {
    if (!process.env.FIREBASE_PROJECT_ID) {
        console.warn('Firebase: FIREBASE_PROJECT_ID not set. Skipping Firebase initialization.');
        return;
    }

    try {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey) {
            // Clean the private key of any possible corruption from environment parsing
            privateKey = privateKey
                .replace(/\\n/g, '\n') // Restore real newlines
                .replace(/"/g, '')     // Remove all double quotes
                .replace(/'/g, '')     // Remove all single quotes
                .trim();               // Final trim
            
            // Ensure the key starts and ends with the correct delimiters if they were stripped
            if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
                privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}`;
            }
            if (!privateKey.includes('-----END PRIVATE KEY-----')) {
                privateKey = `${privateKey}\n-----END PRIVATE KEY-----`;
            }
        } else {
            console.warn('Firebase: FIREBASE_PRIVATE_KEY not set.');
        }

        const serviceAccount: admin.ServiceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        };

        if (admin.apps.length === 0) {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
                storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
            });
            console.log('Firebase Admin: App initialized successfully (Project:', process.env.FIREBASE_PROJECT_ID + ')');
        } else {
            firebaseApp = admin.app();
        }
    } catch (error) {
        console.error('Firebase Admin: Initialization failure:', error);
        throw error;
    }
}

export function getFirebaseAdmin() {
    return admin;
}

export function getFirestore() {
    return firebaseApp ? firebaseApp.firestore() : null;
}

export function getStorage() {
    return firebaseApp ? firebaseApp.storage() : null;
}

export { firebaseApp };
