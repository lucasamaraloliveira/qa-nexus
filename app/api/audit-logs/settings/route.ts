import { NextResponse } from 'next/server';
import { getDb } from '@/lib/backend/database';
import { initializeFirebase } from '@/lib/backend/firebase';
import { authenticate } from '@/lib/auth-server';
import { AuditService } from '@/lib/backend/services/auditService';

export async function GET(req: Request) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload || userPayload.username !== 'root') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const settings = await AuditService.getSettings();
        const globalEnabled = await AuditService.getGlobalStatus();
        return NextResponse.json({ ...settings, globalEnabled });
    } catch (error) {
        console.error('Error fetching audit settings:', error);
        return NextResponse.json({ error: 'Failed to fetch audit settings' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        initializeFirebase();
        const userPayload = authenticate(req);
        if (!userPayload || userPayload.username !== 'root') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const settings = await req.json();
        
        if (settings.globalEnabled !== undefined) {
            await AuditService.toggleGlobalLogging(settings.globalEnabled);
        }

        // Clean up internal keys before saving to config document
        const { globalEnabled, ...moduleSettings } = settings;
        await AuditService.updateConfig(moduleSettings);

        return NextResponse.json({ message: 'Audit settings updated successfuly' });
    } catch (error: any) {
        console.error('Error updating audit settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
