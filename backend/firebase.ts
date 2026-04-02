import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase() {
    if (!process.env.FIREBASE_PROJECT_ID) {
        console.warn('Firebase: FIREBASE_PROJECT_ID not set. Skipping Firebase initialization.');
        return;
    }

    try {
        const serviceAccount: admin.ServiceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        if (admin.apps.length === 0) {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
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

export { firebaseApp };
