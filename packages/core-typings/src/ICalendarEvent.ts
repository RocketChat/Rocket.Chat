import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface ICalendarEvent extends IRocketChatRecord {
	startTime: Date;
	uid: IUser['_id'];
	subject: string;
	description: string;
	notificationSent: boolean;

	externalId?: string;
	meetingUrl?: string;

	reminderMinutesBeforeStart?: number;
	reminderTime?: Date;
}
