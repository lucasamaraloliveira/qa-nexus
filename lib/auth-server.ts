import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'qa-nexus-secret-key-change-me';

export function authenticate(req: Request) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return null;

    try {
        const user = jwt.verify(token, SECRET_KEY);
        return user as any;
    } catch (err) {
        return null;
    }
}
