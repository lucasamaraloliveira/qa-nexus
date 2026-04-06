import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

// GET - Obter uma versão única
export async function GET(req: Request, { params }: { params: any }) {
    try {
        const id = (await params).id;
        initializeFirebase();
        const db = getDb();
        const version = await db.version.findUnique({
            where: { id }
        });

        if (!version) return NextResponse.json({ error: 'Versão não encontrada' }, { status: 404 });
        return NextResponse.json(version);
    } catch (error) {
        console.error('Error fetching version:', error);
        return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 });
    }
}

// PUT - Atualizar uma versão
export async function PUT(req: Request, { params }: { params: any }) {
    try {
        const id = (await params).id;
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const db = getDb();
        
        const updatedVersion = await db.version.update({
            where: { id },
            data
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'UPDATE_VERSION', 'VERSIONS', id, `Versão atualizada: ${data.versionNumber || id}`, req);

        return NextResponse.json(updatedVersion);
    } catch (error: any) {
        console.error('Error updating version:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Excluir uma versão permanentemente
export async function DELETE(req: Request, { params }: { params: any }) {
    try {
        const id = (await params).id;
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const db = getDb();
        
        // Primeiro verificamos se a versão existe
        const version = await db.version.findUnique({ where: { id } });
        if (!version) return NextResponse.json({ error: 'Versão não encontrada' }, { status: 404 });

        await db.version.delete({
            where: { id }
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'DELETE_VERSION', 'VERSIONS', id, `Versão excluída: ${version.versionNumber || id}`, req);

        return NextResponse.json({ message: 'Versão excluída permanentemente' });
    } catch (error: any) {
        console.error('Error deleting version:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
