import { getFirestore, initializeFirebase } from './firebase';

// Ensure Firebase is ready
initializeFirebase();
const firestore = getFirestore()!;

/**
 * A more generalized Firestore shim for Prisma to handle various collections
 */
function getCollectionShim(collectionName: string) {
    return {
        findMany: async (args: any = {}) => {
            let query: any = firestore.collection(collectionName);

            // Basic filtering if where is provided
            if (args.where) {
                Object.keys(args.where).forEach(key => {
                    if (args.where[key] !== undefined) {
                        query = query.where(key, '==', args.where[key]);
                    }
                });
            }

            // Ordering
            if (args.orderBy) {
                // If its an array or single object like {timestamp: 'desc'}
                const orderKey = Array.isArray(args.orderBy) ? Object.keys(args.orderBy[0])[0] : Object.keys(args.orderBy)[0];
                const orderDir = Array.isArray(args.orderBy) ? Object.values(args.orderBy[0])[0] : Object.values(args.orderBy)[0];
                query = query.orderBy(orderKey, orderDir);
            }

            if (args.take) query = query.limit(args.take);

            const snapshot = await query.get();
            return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        },
        findUnique: async (args: any) => {
            const where = args.where;
            const select = args.select;

            let result: any = null;
            const id = where.id;
            if (id && typeof id === 'string') {
                const doc = await firestore.collection(collectionName).doc(id).get();
                result = doc.exists ? { id: doc.id, ...doc.data() } : null;
            } else {
                // Support other unique keys by querying
                let query: any = firestore.collection(collectionName);
                Object.keys(where).forEach(key => {
                    query = query.where(key, '==', where[key]);
                });
                const snapshot = await query.limit(1).get();
                result = snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
            }

            // Filter fields if select is provided
            if (result && select) {
                const filtered: any = {};
                Object.keys(select).forEach(key => {
                    if (select[key] && result[key] !== undefined) {
                        filtered[key] = result[key];
                    }
                });
                // Always include id
                filtered.id = result.id;
                return filtered;
            }

            return result;
        },
        create: async ({ data }: any) => {
            const res = await firestore.collection(collectionName).add({
                ...data,
                createdAt: new Date().toISOString()
            });
            return { id: res.id, ...data };
        },
        update: async ({ where, data }: any) => {
            let id = where.id;
            if (!id || typeof id !== 'string') {
                // Find id if not provided directly
                const q = firestore.collection(collectionName);
                let firstKey = Object.keys(where)[0];
                let firstVal = Object.values(where)[0];
                const existing = await q.where(firstKey, '==', firstVal).limit(1).get();
                if (existing.empty) throw new Error('Document not found for update');
                id = existing.docs[0].id;
            }
            const ref = firestore.collection(collectionName).doc(id);
            // Use set with merge: true for robustness
            await ref.set(data, { merge: true });
            const updated = await ref.get();
            return { id: updated.id, ...updated.data() };
        },
        upsert: async ({ where, update, create }: any) => {
            const id = where.key || where.id;
            if (id) {
                const ref = firestore.collection(collectionName).doc(String(id));
                const doc = await ref.get();
                if (doc.exists) {
                    await ref.update(update);
                } else {
                    await ref.set(create);
                }
            }
        },
        delete: async ({ where }: any) => {
            const id = where.id;
            if (id) await firestore.collection(collectionName).doc(String(id)).delete();
        },
        deleteMany: async (args: any = {}) => {
            let query: any = firestore.collection(collectionName);
            if (args.where) {
                Object.keys(args.where).forEach(key => {
                    if (args.where[key] !== undefined) {
                        query = query.where(key, '==', args.where[key]);
                    }
                });
            }
            const snapshot = await query.get();
            const batch = firestore.batch();
            snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
            await batch.commit();
        },
        count: async ({ where }: any = {}) => {
            const snapshot = await firestore.collection(collectionName).get();
            return snapshot.size;
        }
    };
}

const dbShim = {
    user: getCollectionShim('users'),
    auditLog: getCollectionShim('auditLogs'),
    systemSetting: getCollectionShim('systemSettings'),
    version: getCollectionShim('versions'),
    site: getCollectionShim('sites'),
    manual: getCollectionShim('manuals'),
    testPlan: getCollectionShim('testPlans'),
    testCase: getCollectionShim('testCases'),
    script: getCollectionShim('scripts'),
    buildDoc: getCollectionShim('buildDocs'),
    usefulDoc: getCollectionShim('usefulDocs'),
    changelogSystem: getCollectionShim('changelogSystems'),
    changelogEntry: getCollectionShim('changelogEntries'),
    changelogItem: getCollectionShim('changelogItems'),
    monitoringLog: getCollectionShim('monitoringLogs')
};

export async function initializeDatabase() {
    console.log('Firebase Firestore initialized as the primary database.');
    
    // Seed root user if it doesn't exist in Firestore
    try {
        const rootDoc = await firestore.collection('users').where('username', '==', 'root').limit(1).get();
        if (rootDoc.empty) {
            import('bcryptjs').then(async (bcrypt) => {
                const hashedPassword = await bcrypt.default.hash('root', 10);
                await firestore.collection('users').doc('root').set({
                    username: 'root',
                    password: hashedPassword,
                    role: 'Root',
                    createdAt: new Date().toISOString()
                });
                console.log('Root user seeded to Firestore.');
            });
        }
    } catch (e) {
        console.error('Failed to seed root user:', e);
    }
    
    return Promise.resolve();
}

export function getDb() {
    return dbShim;
}

export const prisma = dbShim;
export default dbShim;
