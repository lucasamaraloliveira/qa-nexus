import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

export async function GET(req: Request) {
    try {
        initializeFirebase();
        const db = getDb();
        const testPlans = await db.testPlan.findMany();
        
        // Buscar casos de teste para cada plano para evitar quebra no frontend
        const fullPlans = await Promise.all(testPlans.map(async (plan: any) => {
            const testCases = await db.testCase.findMany({
                where: { testPlanId: plan.id }
            });
            return { ...plan, testCases: testCases || [] };
        }));

        return NextResponse.json(fullPlans);
    } catch (error) {
        console.error('Error fetching test plans:', error);
        return NextResponse.json({ error: 'Failed to fetch test plans' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description, progress, testCases } = await req.json();
        const db = getDb();
        
        const newPlan = await db.testPlan.create({
            data: { name, description, progress: progress || 0 }
        });

        if (testCases && Array.isArray(testCases)) {
            for (const tc of testCases) {
                await db.testCase.create({
                    data: { ...tc, testPlanId: newPlan.id }
                });
            }
        }

        await AuditService.logAction(userPayload.id, userPayload.username, 'CREATE', 'TEST_PLANS', newPlan.id, `Plano de teste criado ${name}`, req);

        return NextResponse.json(newPlan);
    } catch (error: any) {
        console.error('Error creating test plan:', error);
        return NextResponse.json({ error: error.message || 'Failed to create test plan' }, { status: 500 });
    }
}
