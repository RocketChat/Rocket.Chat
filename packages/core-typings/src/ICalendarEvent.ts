import type { CalendarSyncProviderType } from './ICalendarSyncState';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface ICalendarEvent extends IRocketChatRecord {
	startTime: Date;
	endTime?: Date;

	uid: IUser['_id'];
	subject: string;
	description: string;
	notificationSent: boolean;

	externalId?: string | null;
	meetingUrl?: string | null;

	/** Which server-side sync provider imported this event; undefined for client-pushed (legacy) events */
	provider?: CalendarSyncProviderType;
	iCalUId?: string;

	reminderMinutesBeforeStart?: number;
	reminderTime?: Date;

	busy?: boolean;
}
