import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

// GET - Obter um plano de teste único com seus casos de teste
export async function GET(req: Request, { params }: { params: any }) {
    try {
        const id = (await params).id;
        initializeFirebase();
        const db = getDb();
        
        const testPlan = await db.testPlan.findUnique({
            where: { id }
        });

        if (!testPlan) return NextResponse.json({ error: 'Plano de teste não encontrado' }, { status: 404 });

        // Buscar também os casos de teste associados
        const testCases = await db.testCase.findMany({
            where: { testPlanId: id }
        });

        return NextResponse.json({ ...testPlan, testCases });
    } catch (error) {
        console.error('Error fetching test plan:', error);
        return NextResponse.json({ error: 'Failed to fetch test plan' }, { status: 500 });
    }
}

// PUT - Atualizar um plano de teste
export async function PUT(req: Request, { params }: { params: any }) {
    try {
        const id = (await params).id;
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();
        const { name, description, progress, testCases } = data;
        const db = getDb();
        
        const updatedPlan = await db.testPlan.update({
            where: { id },
            data: { 
                name, 
                description, 
                progress: progress !== undefined ? progress : undefined 
            }
        });

        // Sincronizar casos de teste se fornecidos
        if (testCases && Array.isArray(testCases)) {
            // Opção simplificada: deletar antigos e criar novos (ou atualizar se tivermos IDs)
            // Para robustez no shim, vamos apenas atualizar os que têm ID e criar os novos
            for (const tc of testCases) {
                if (tc.id) {
                    await db.testCase.update({
                        where: { id: tc.id },
                        data: { ...tc, testPlanId: id }
                    });
                } else {
                    await db.testCase.create({
                        data: { ...tc, testPlanId: id }
                    });
                }
            }
        }

        await AuditService.logAction(userPayload.id, userPayload.username, 'UPDATE', 'TEST_PLANS', id, `Plano de teste atualizado: ${name || id}`, req);

        return NextResponse.json(updatedPlan);
    } catch (error: any) {
        console.error('Error updating test plan:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Excluir um plano de teste e seus casos
export async function DELETE(req: Request, { params }: { params: any }) {
    try {
        const id = (await params).id;
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const db = getDb();
        
        const plan = await db.testPlan.findUnique({ where: { id } });
        if (!plan) return NextResponse.json({ error: 'Plano de teste não encontrado' }, { status: 404 });

        // Excluir casos de teste associados primeiro
        await db.testCase.deleteMany({
            where: { testPlanId: id }
        });

        // Excluir o plano
        await db.testPlan.delete({
            where: { id }
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'DELETE', 'TEST_PLANS', id, `Plano de teste excluído: ${plan.name || id}`, req);

        return NextResponse.json({ message: 'Plano de teste excluído com sucesso' });
    } catch (error: any) {
        console.error('Error deleting test plan:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
