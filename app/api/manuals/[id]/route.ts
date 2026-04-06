import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase, getStorage } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

// DELETE - Excluir manual (arquivo ou pasta)
export async function DELETE(req: Request, { params }: { params: any }) {
    try {
        const id = (await params).id;
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const db = getDb();
        
        // Verificar se existe
        const manual = await db.manual.findUnique({ where: { id } });
        if (!manual) return NextResponse.json({ error: 'Manual não encontrado' }, { status: 404 });

        // Se for um arquivo, opcionalmente deletar do Storage
        if (manual.type === 'file' && manual.url) {
            try {
                const storage = getStorage();
                if (storage) {
                    const bucket = storage.bucket();
                    // Extrair o nome do arquivo da URL (simplificado)
                    const urlParts = manual.url.split('/o/');
                    if (urlParts.length > 1) {
                        const filePath = decodeURIComponent(urlParts[1].split('?')[0]);
                        await bucket.file(filePath).delete();
                    }
                }
            } catch (storageError) {
                console.warn('Could not delete file from storage, but continuing DB deletion:', storageError);
            }
        }

        // Se for pasta, verificar se tem filhos? 
        // No Firestore shim, delete() é direto. 
        // Se quisermos recursivo, deveríamos buscar filhos.
        if (manual.type === 'folder') {
            const children = await db.manual.findMany({ where: { parentId: id } });
            if (children.length > 0) {
                 return NextResponse.json({ error: 'Não é possível excluir uma pasta que contenha arquivos.' }, { status: 400 });
            }
        }

        await db.manual.delete({ where: { id } });

        await AuditService.logAction(userPayload.id, userPayload.username, 'DELETE_MANUAL', 'MANUALS', id, `Manual excluído: ${manual.name || id}`, req);

        return NextResponse.json({ message: 'Manual excluído com sucesso' });
    } catch (error: any) {
        console.error('Error deleting manual:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
