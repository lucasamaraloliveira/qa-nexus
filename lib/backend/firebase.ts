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
            // Remove literal outer quotes if present
            privateKey = privateKey.trim();
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.substring(1, privateKey.length - 1);
            }
            if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
                privateKey = privateKey.substring(1, privateKey.length - 1);
            }
            // Replace escaped \n with actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n');
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
            console.log('Connected to Firebase via Firebase Admin');
        } else {
            firebaseApp = admin.app();
        }
    } catch (error) {
        console.error('Error initializing Firebase:', error);
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
