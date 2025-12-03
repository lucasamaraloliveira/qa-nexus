import express from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const plans = await db.all('SELECT * FROM test_plans');

        for (const plan of plans) {
            const testCases = await db.all('SELECT * FROM test_cases WHERE test_plan_id = ?', plan.id);
            plan.testCases = testCases;
        }

        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch test plans' });
    }
});

router.post('/', authenticateToken, async (req: any, res) => {
    const { name, description, progress, testCases } = req.body;
    try {
        const db = getDb();
        const result = await db.run(
            'INSERT INTO test_plans (name, description, progress) VALUES (?, ?, ?)',
            [name, description, progress]
        );
        const planId = result.lastID;

        if (testCases && Array.isArray(testCases)) {
            for (const tc of testCases) {
                await db.run(
                    'INSERT INTO test_cases (test_plan_id, title, preconditions, steps, expectedResult, status, estimatedTime, priority, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [planId, tc.title, tc.preconditions, tc.steps, tc.expectedResult, tc.status, tc.estimatedTime, tc.priority, tc.assignedTo]
                );
            }
        }

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'TEST_PLANS', planId?.toString() || '', `Plano de teste criado ${name}`, req);

        res.json({ id: planId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create test plan' });
    }
});

router.put('/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const { name, description, progress, testCases } = req.body;
    try {
        const db = getDb();
        await db.run(
            'UPDATE test_plans SET name = ?, description = ?, progress = ? WHERE id = ?',
            [name, description, progress, id]
        );

        await db.run('DELETE FROM test_cases WHERE test_plan_id = ?', id);

        if (testCases && Array.isArray(testCases)) {
            for (const tc of testCases) {
                await db.run(
                    'INSERT INTO test_cases (test_plan_id, title, preconditions, steps, expectedResult, status, estimatedTime, priority, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [id, tc.title, tc.preconditions, tc.steps, tc.expectedResult, tc.status, tc.estimatedTime, tc.priority, tc.assignedTo]
                );
            }
        }

        await AuditService.logAction(req.user.id, req.user.username, 'UPDATE', 'TEST_PLANS', id, `Plano de teste atualizado ${name}`, req);

        res.json({ message: 'Test plan updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update test plan' });
    }
});

router.delete('/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    try {
        const db = getDb();
        await db.run('DELETE FROM test_plans WHERE id = ?', id);

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'TEST_PLANS', id, 'Plano de teste excluído', req);

        res.json({ message: 'Test plan deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete test plan' });
    }
});

// Reset all test cases status in a plan
router.put('/:id/reset-status', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    try {
        const db = getDb();
        await db.run(
            'UPDATE test_cases SET status = ? WHERE test_plan_id = ?',
            ['Not Started', id]
        );

        // Update plan progress to 0
        await db.run(
            'UPDATE test_plans SET progress = 0 WHERE id = ?',
            [id]
        );

        await AuditService.logAction(req.user.id, req.user.username, 'RESET', 'TEST_PLANS', id, 'Status do plano de teste redefinido', req);

        res.json({ message: 'Test plan status reset successfully' });
    } catch (error) {
        console.error('Error resetting test plan status:', error);
        res.status(500).json({ error: 'Failed to reset test plan status' });
    }
});

// Duplicate a test plan
router.post('/:id/duplicate', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    try {
        const db = getDb();

        // Get original plan
        const originalPlan = await db.get('SELECT * FROM test_plans WHERE id = ?', id);
        if (!originalPlan) {
            return res.status(404).json({ error: 'Original plan not found' });
        }

        // Create new plan
        const result = await db.run(
            'INSERT INTO test_plans (name, description, progress) VALUES (?, ?, ?)',
            [`${originalPlan.name} (Copy)`, originalPlan.description, 0]
        );
        const newPlanId = result.lastID;

        // Get original test cases
        const testCases = await db.all('SELECT * FROM test_cases WHERE test_plan_id = ?', id);

        // Copy test cases
        for (const tc of testCases) {
            await db.run(
                'INSERT INTO test_cases (test_plan_id, title, preconditions, steps, expectedResult, status, estimatedTime, priority, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [newPlanId, tc.title, tc.preconditions, tc.steps, tc.expectedResult, 'Not Started', tc.estimatedTime, tc.priority, tc.assignedTo]
            );
        }

        await AuditService.logAction(req.user.id, req.user.username, 'DUPLICATE', 'TEST_PLANS', newPlanId?.toString() || '', `Plano de teste duplicado ${originalPlan.name}`, req);

        res.json({ message: 'Test plan duplicated successfully', newPlanId });
    } catch (error) {
        console.error('Error duplicating test plan:', error);
        res.status(500).json({ error: 'Failed to duplicate test plan' });
    }
});

// Replicate test cases from another plan
router.post('/:id/replicate-cases', authenticateToken, async (req: any, res) => {
    const { id } = req.params; // Target plan ID
    const { sourcePlanId } = req.body;

    if (!sourcePlanId) {
        return res.status(400).json({ error: 'Source plan ID is required' });
    }

    try {
        const db = getDb();

        // Ensure IDs are numbers for SQLite
        const targetIdNum = Number(id);
        const sourceIdNum = Number(sourcePlanId);

        console.log(`Replicating cases from plan ${sourceIdNum} to ${targetIdNum}`);

        if (isNaN(targetIdNum) || isNaN(sourceIdNum)) {
            return res.status(400).json({ error: 'Invalid plan IDs' });
        }

        // Get source test cases
        const sourceTestCases = await db.all('SELECT * FROM test_cases WHERE test_plan_id = ?', sourceIdNum);

        if (sourceTestCases.length === 0) {
            console.log('No test cases found in source plan');
            return res.status(404).json({ error: 'No test cases found in source plan to replicate' });
        }

        console.log(`Found ${sourceTestCases.length} cases to replicate`);

        // Begin transaction
        await db.run('BEGIN TRANSACTION');

        try {
            // Insert into target plan
            for (const tc of sourceTestCases) {
                await db.run(
                    'INSERT INTO test_cases (test_plan_id, title, preconditions, steps, expectedResult, status, estimatedTime, priority, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        targetIdNum,
                        tc.title,
                        tc.preconditions,
                        tc.steps,
                        tc.expectedResult,
                        'Pendente', // Fixed: Use valid status
                        tc.estimatedTime || null,
                        tc.priority || null,
                        tc.assignedTo || null
                    ]
                );
            }

            await db.run('COMMIT');

            await AuditService.logAction(req.user.id, req.user.username, 'REPLICATE', 'TEST_PLANS', id, `Replicados ${sourceTestCases.length} casos do plano ${sourcePlanId}`, req);

            console.log('Replication committed successfully');
            res.json({ message: `Replicated ${sourceTestCases.length} test cases successfully` });
        } catch (insertError) {
            await db.run('ROLLBACK');
            console.error('Error during insertion, rolled back:', insertError);
            throw insertError;
        }
    } catch (error) {
        console.error('Error replicating test cases:', error);
        res.status(500).json({ error: 'Failed to replicate test cases' });
    }
});

export default router;
