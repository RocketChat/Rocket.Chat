import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';

export function generateCronJobId(eventId: ICalendarEvent['_id'], uid: IUser['_id'], eventType: 'status' | 'reminder'): string {
	if (!eventId || !uid || !eventType || (eventType !== 'status' && eventType !== 'reminder')) {
		throw new Error('Missing required parameters. Please provide eventId, uid and eventType (status or reminder)');
	}

	if (eventType === 'status') {
		return `calendar-presence-status-${eventId}-${uid}`;
	}

	return `calendar-reminder-${eventId}-${uid}`;
}
