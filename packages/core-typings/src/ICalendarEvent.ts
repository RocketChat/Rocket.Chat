import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

/** The integration that owns the event. Absent on a local one and on anything the legacy desktop import wrote. */
export type CalendarEventSource = 'outlook';

export interface ICalendarEvent extends IRocketChatRecord {
	startTime: Date;
	endTime?: Date;

	uid: IUser['_id'];
	subject: string;
	description: string;
	notificationSent: boolean;

	externalId?: string | null;
	source?: CalendarEventSource;
	seriesMasterId?: string;
	meetingUrl?: string | null;

	reminderMinutesBeforeStart?: number;
	reminderTime?: Date;

	busy?: boolean;
}
