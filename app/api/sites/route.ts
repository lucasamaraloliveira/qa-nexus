import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';

export async function GET(req: Request) {
    try {
        initializeFirebase();
        const db = getDb();
        const sites = await db.site.findMany();
        return NextResponse.json(sites);
    } catch (error) {
        console.error('Error fetching sites:', error);
        return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        initializeFirebase();
        const { name, url } = await req.json();
        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }
        const db = getDb();
        const newSite = await db.site.create({
            data: { name, url, status: 'PENDING' }
        });
        return NextResponse.json(newSite);
    } catch (error) {
        console.error('Error adding site:', error);
        return NextResponse.json({ error: 'Failed to add site' }, { status: 500 });
    }
}
