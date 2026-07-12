import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export type CalendarEventSource = 'legacy' | 'enterprise-calendar';
export type CalendarEventProvider = 'microsoft-graph' | 'exchange-ews';
export type CalendarEventAvailability = 'free' | 'workingElsewhere' | 'tentative' | 'busy' | 'outOfOffice' | 'unknown';

export interface ICalendarEvent extends IRocketChatRecord {
	startTime: Date;
	endTime?: Date;

	uid: IUser['_id'];
	subject: string;
	description: string;
	notificationSent: boolean;

	externalId?: string | null;
	meetingUrl?: string | null;

	reminderMinutesBeforeStart?: number;
	reminderTime?: Date;

	busy?: boolean;

	/** Provider-owned, content-free presence projection metadata. */
	source?: CalendarEventSource;
	provider?: CalendarEventProvider;
	mailboxHash?: string;
	availability?: CalendarEventAvailability;
	isAllDay?: boolean;
	isPrivate?: boolean;
	lastModifiedAt?: Date;
	calendarPresenceEnabled?: boolean;
}
