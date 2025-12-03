import React, { useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

interface ActivityTrackerProps {
    currentTab: string;
}

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({ currentTab }) => {
    const { emitRouteChange, emitStatusChange, emitUpdateActivity } = useSocket();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInactiveRef = useRef(false);

    // Track route changes
    useEffect(() => {
        emitRouteChange(currentTab);
    }, [currentTab, emitRouteChange]);

    // Track activity
    useEffect(() => {
        const handleActivity = () => {
            if (isInactiveRef.current) {
                isInactiveRef.current = false;
                emitStatusChange('Active');
            }
            emitUpdateActivity();

            // Reset inactivity timer
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                isInactiveRef.current = true;
                emitStatusChange('Inactive');
            }, 5 * 60 * 1000); // 5 minutes
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        // Initial timer
        handleActivity();

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [emitStatusChange, emitUpdateActivity]);

    return null; // This component doesn't render anything visible
};
