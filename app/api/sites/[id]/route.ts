import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        initializeFirebase();
        const { id } = params;
        const { name, url } = await req.json();
        const db = getDb();
        await db.site.update({
            where: { id },
            data: { name, url }
        });
        return NextResponse.json({ message: 'Site updated' });
    } catch (error) {
        console.error('Error updating site:', error);
        return NextResponse.json({ error: 'Failed to update site' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        initializeFirebase();
        const { id } = params;
        const db = getDb();
        await db.site.delete({
            where: { id }
        });
        return NextResponse.json({ message: 'Site deleted' });
    } catch (error) {
        console.error('Error deleting site:', error);
        return NextResponse.json({ error: 'Failed to delete site' }, { status: 500 });
    }
}
