import { useEffect, useRef, useState } from 'react';
import { useMedsenseQueue } from './useMedsenseQueue';

// Store session start time - persists across remounts but clears on page refresh
const SESSION_START_KEY = 'medsense_session_start';
const NOTIFIED_IDS_KEY = 'medsense_notified_ids';

const getSessionStart = (): number => {
    const stored = sessionStorage.getItem(SESSION_START_KEY);
    if (stored) {
        return parseInt(stored, 10);
    }
    // First time - set session start to NOW
    const now = Date.now();
    sessionStorage.setItem(SESSION_START_KEY, now.toString());
    return now;
};

const getNotifiedIds = (): Set<string> => {
    try {
        const stored = sessionStorage.getItem(NOTIFIED_IDS_KEY);
        if (stored) {
            return new Set(JSON.parse(stored));
        }
    } catch (e) {
        // ignore
    }
    return new Set();
};

const addNotifiedId = (id: string) => {
    const current = getNotifiedIds();
    current.add(id);
    sessionStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify([...current]));
};

export const useMedsenseQueueDelta = () => {
    const { requests, canViewQueue, loading } = useMedsenseQueue();
    const sessionStart = useRef(getSessionStart());
    const [hasNewRequests, setHasNewRequests] = useState(false);
    const [newRequestsCount, setNewRequestsCount] = useState(0);

    useEffect(() => {
        if (!canViewQueue || loading) {
            setHasNewRequests(false);
            setNewRequestsCount(0);
            return;
        }

        // Find requests created AFTER session started that we haven't notified about
        const notifiedIds = getNotifiedIds();
        const newRequests = requests.filter(req => {
            const createdAt = new Date(req.createdAt).getTime();
            const isAfterSession = createdAt > sessionStart.current;
            const notYetNotified = !notifiedIds.has(req._id);
            return isAfterSession && notYetNotified;
        });

        console.log('[Delta] Session start:', new Date(sessionStart.current).toISOString());
        console.log('[Delta] Requests:', requests.length, 'New (after session):', newRequests.length);

        if (newRequests.length > 0) {
            console.log('[Delta] NEW REQUESTS DETECTED!', newRequests.map(r => r._id));
            // Mark these as notified so we don't notify again
            newRequests.forEach(req => addNotifiedId(req._id));
            setHasNewRequests(true);
            setNewRequestsCount(newRequests.length);
        } else {
            setHasNewRequests(false);
            setNewRequestsCount(0);
        }
    }, [requests, canViewQueue, loading]);

    return { hasNewRequests, newRequestsCount };
};
