import express from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const plans = await db.testPlan.findMany({
            include: { testCases: true }
        });

        res.json(plans);
    } catch (error) {
        console.error('Error fetching test plans:', error);
        res.status(500).json({ error: 'Failed to fetch test plans' });
    }
});

router.post('/', authenticateToken, async (req: any, res) => {
    const { name, description, progress, testCases } = req.body;
    try {
        const db = getDb();
        const newPlan = await db.testPlan.create({
            data: {
                name,
                description,
                progress,
                testCases: {
                    create: testCases?.map((tc: any) => ({
                        title: tc.title,
                        preconditions: tc.preconditions,
                        steps: tc.steps,
                        expectedResult: tc.expectedResult,
                        status: tc.status,
                        estimatedTime: tc.estimatedTime,
                        priority: tc.priority,
                        assignedTo: tc.assignedTo
                    })) || []
                }
            },
            include: { testCases: true }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'TEST_PLANS', newPlan.id.toString(), `Plano de teste criado ${name}`, req);

        res.json(newPlan);
    } catch (error) {
        console.error('Error creating test plan:', error);
        res.status(500).json({ error: 'Failed to create test plan' });
    }
});

router.put('/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const { name, description, progress, testCases } = req.body;
    try {
        const db = getDb();

        await db.$transaction(async (tx: any) => {
            await tx.testPlan.update({
                where: { id },
                data: { name, description, progress }
            });

            await tx.testCase.deleteMany({
                where: { testPlanId: id }
            });

            if (testCases && Array.isArray(testCases)) {
                await tx.testCase.createMany({
                    data: testCases.map((tc: any) => ({
                        testPlanId: id,
                        title: tc.title,
                        preconditions: tc.preconditions,
                        steps: tc.steps,
                        expectedResult: tc.expectedResult,
                        status: tc.status,
                        estimatedTime: tc.estimatedTime,
                        priority: tc.priority,
                        assignedTo: tc.assignedTo
                    }))
                });
            }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'TEST_PLANS', id.toString(), `Plano de teste atualizado ${name}`, req);

        res.json({ message: 'Test plan updated' });
    } catch (error) {
        console.error('Error updating test plan:', error);
        res.status(500).json({ error: 'Failed to update test plan' });
    }
});

router.delete('/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    try {
        const db = getDb();
        await db.testPlan.delete({
            where: { id }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'TEST_PLANS', id.toString(), 'Plano de teste excluído', req);

        res.json({ message: 'Test plan deleted' });
    } catch (error) {
        console.error('Error deleting test plan:', error);
        res.status(500).json({ error: 'Failed to delete test plan' });
    }
});

// Reset all test cases status in a plan
router.put('/:id/reset-status', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    try {
        const db = getDb();

        await db.$transaction([
            db.testCase.updateMany({
                where: { testPlanId: id },
                data: { status: 'Not Started' }
            }),
            db.testPlan.update({
                where: { id },
                data: { progress: 0 }
            })
        ]);

        await AuditService.logAction(req.user.id, req.user.username, 'RESET', 'TEST_PLANS', id.toString(), 'Status do plano de teste redefinido', req);

        res.json({ message: 'Test plan status reset successfully' });
    } catch (error) {
        console.error('Error resetting test plan status:', error);
        res.status(500).json({ error: 'Failed to reset test plan status' });
    }
});

// Duplicate a test plan
router.post('/:id/duplicate', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    try {
        const db = getDb();

        const originalPlan = await db.testPlan.findUnique({
            where: { id },
            include: { testCases: true }
        });

        if (!originalPlan) {
            return res.status(404).json({ error: 'Original plan not found' });
        }

        const newPlan = await db.testPlan.create({
            data: {
                name: `${originalPlan.name} (Copy)`,
                description: originalPlan.description,
                progress: 0,
                testCases: {
                    create: originalPlan.testCases.map((tc: any) => ({
                        title: tc.title,
                        preconditions: tc.preconditions,
                        steps: tc.steps,
                        expectedResult: tc.expectedResult,
                        status: 'Not Started',
                        estimatedTime: tc.estimatedTime,
                        priority: tc.priority,
                        assignedTo: tc.assignedTo
                    }))
                }
            }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'DUPLICATE', 'TEST_PLANS', newPlan.id.toString(), `Plano de teste duplicado ${originalPlan.name}`, req);

        res.json({ message: 'Test plan duplicated successfully', newPlanId: newPlan.id });
    } catch (error) {
        console.error('Error duplicating test plan:', error);
        res.status(500).json({ error: 'Failed to duplicate test plan' });
    }
});

// Replicate test cases from another plan
router.post('/:id/replicate-cases', authenticateToken, async (req: any, res) => {
    const targetPlanId = parseInt(req.params.id);
    const sourcePlanId = parseInt(req.body.sourcePlanId);

    if (isNaN(sourcePlanId)) {
        return res.status(400).json({ error: 'Source plan ID is required' });
    }

    try {
        const db = getDb();

        const sourceTestCases = await db.testCase.findMany({
            where: { testPlanId: sourcePlanId }
        });

        if (sourceTestCases.length === 0) {
            return res.status(404).json({ error: 'No test cases found in source plan to replicate' });
        }

        await db.testCase.createMany({
            data: sourceTestCases.map((tc: any) => ({
                testPlanId: targetPlanId,
                title: tc.title,
                preconditions: tc.preconditions,
                steps: tc.steps,
                expectedResult: tc.expectedResult,
                status: 'Pendente',
                estimatedTime: tc.estimatedTime,
                priority: tc.priority,
                assignedTo: tc.assignedTo
            }))
        });

        await AuditService.logAction(req.user.id, req.user.username, 'REPLICATE', 'TEST_PLANS', targetPlanId.toString(), `Replicados ${sourceTestCases.length} casos do plano ${sourcePlanId}`, req);

        res.json({ message: `Replicated ${sourceTestCases.length} test cases successfully` });
    } catch (error) {
        console.error('Error replicating test cases:', error);
        res.status(500).json({ error: 'Failed to replicate test cases' });
    }
});

export default router;
