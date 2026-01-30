import app from '../backend/server';
import { initializeDatabase } from '../backend/database';

// Cache da inicialização para evitar múltiplas conexões em cold starts
let isDbInitialized = false;

export default async (req: any, res: any) => {
    if (!isDbInitialized) {
        try {
            await initializeDatabase();
            isDbInitialized = true;
        } catch (error) {
            console.error('Erro na inicialização do banco Serverless:', error);
        }
    }
    return app(req, res);
};
