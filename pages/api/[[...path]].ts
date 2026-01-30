import { NextApiRequest, NextApiResponse } from 'next';
import app from '../../backend/server';
import { initializeDatabase } from '../../backend/database';

let dbInitialized = false;

export const config = {
    api: {
        externalResolver: true,
        bodyParser: false, // Express handles its own body parsing
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!dbInitialized) {
        try {
            await initializeDatabase();
            dbInitialized = true;
        } catch (error) {
            console.error('Failed to initialize database in API route:', error);
        }
    }

    // Express app handles everything including body parsing and routing
    // @ts-ignore
    return app(req, res);
}
