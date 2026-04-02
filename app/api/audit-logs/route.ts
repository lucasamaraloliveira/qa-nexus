import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { AuditService } from '@/lib/backend/services/auditService';

export async function GET(req: Request) {
    try {
        initializeFirebase();
        const { searchParams } = new URL(req.url);
        
        const filters = {
            page: parseInt(searchParams.get('page') || '1'),
            limit: parseInt(searchParams.get('limit') || '50'),
            module: searchParams.get('module') || undefined,
            action: searchParams.get('action') || undefined,
            username: searchParams.get('username') || undefined,
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
        };

        const result = await AuditService.getLogs(filters);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        initializeFirebase();
        // Here you might want to add auth check for admin
        await AuditService.clearLogs();
        return NextResponse.json({ message: 'Audit logs cleared' });
    } catch (error) {
        console.error('Error clearing audit logs:', error);
        return NextResponse.json({ error: 'Failed to clear audit logs' }, { status: 500 });
    }
}
