import { createHmac } from 'node:crypto';

import type { CalendarProjection, NormalizedCalendarEvent } from './types';

const digest = (key: Buffer, namespace: string, value: string): string =>
	createHmac('sha256', key).update(namespace).update('\0').update(value).digest('base64url');

export class CalendarProjectionFactory {
	constructor(private readonly hmacKey: Buffer) {
		if (hmacKey.length < 32) throw new Error('calendar-projection-hmac-key-too-short');
	}

	fromEvent(userId: string, event: NormalizedCalendarEvent): CalendarProjection | null {
		if (event.isCancelled || event.availability === 'free' || event.start >= event.end) return null;
		return {
			userId,
			provider: event.mailbox.provider,
			mailboxHash: digest(this.hmacKey, 'mailbox', event.mailbox.address.toLocaleLowerCase('en-US')),
			eventHash: digest(this.hmacKey, 'event', event.externalId),
			start: event.start,
			end: event.end,
			availability: event.availability,
			isAllDay: event.isAllDay,
			isPrivate: event.isPrivate,
			...(event.lastModifiedAt && { lastModifiedAt: event.lastModifiedAt }),
		};
	}

	eventHash(externalId: string): string {
		return digest(this.hmacKey, 'event', externalId);
	}
}
