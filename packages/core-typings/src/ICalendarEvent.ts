import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface ICalendarEvent extends IRocketChatRecord {
	startTime: Date;
	uid: IUser['_id'];
	subject: string;
	description: string;

	externalId?: string;
	notificationSent?: boolean;
	meetingUrl?: string;

	reminderMinutesBeforeStart?: number;
	reminderDueBy?: Date;
}
