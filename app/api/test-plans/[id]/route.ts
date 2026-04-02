import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const { name, description, progress, testCases } = await req.json();
        const db = getDb();
        
        await db.testPlan.update({
            where: { id },
            data: { name, description, progress: progress || 0 }
        });

        // Replace test cases (delete old ones and create new ones since our shim is simple)
        await db.testCase.deleteMany({
            where: { testPlanId: id }
        });

        if (testCases && Array.isArray(testCases)) {
            for (const tc of testCases) {
                // Ensure id is not passed to create
                const { id: tcId, ...tcData } = tc;
                await db.testCase.create({
                    data: { ...tcData, testPlanId: id }
                });
            }
        }

        await AuditService.logAction(userPayload.id, userPayload.username, 'UPDATE', 'TEST_PLANS', id, `Plano de teste atualizado ${name}`, req);

        return NextResponse.json({ message: 'Test plan updated successfully' });
    } catch (error: any) {
        console.error('Error updating test plan:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const db = getDb();
        
        await db.testPlan.delete({
            where: { id }
        });

        await AuditService.logAction(userPayload.id, userPayload.username, 'DELETE', 'TEST_PLANS', id, 'Plano de teste removido', req);

        return NextResponse.json({ message: 'Test plan deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting test plan:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
