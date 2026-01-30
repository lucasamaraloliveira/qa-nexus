import { app } from '../../backend/server';
import { initializeDatabase } from '../../backend/database';

let isDbInitialized = false;

export default async function handler(req: any, res: any) {
    if (!isDbInitialized) {
        try {
            await initializeDatabase();
            isDbInitialized = true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            // We still try to let express handle it, or we could bail
        }
    }

    // Express as a Next.js API route catch-all
    return app(req, res);
}

export const config = {
    api: {
        externalResolver: true,
        bodyParser: false, // Let express handle parsing
    },
};
