import type { ICalendarEvent } from './ICalendarEvent';
import type { IMessage } from './IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { ISubscription } from './ISubscription';

export interface INotificationItemPush {
	type: 'push';
	data: {
		payload: {
			sender: {
				_id: string;
				username: string;
				name?: string;
			};
			type: string;
		};
		roomName: string;
		username: string;
		message: string;
		badge: number;
		category: string;
	};
}

export interface INotificationItemEmail {
	type: 'email';
	data: {
		to: string;
		subject: string;
		html: string;
		data: {
			room_path: string;
		};
		from: string;
	};
}

export type NotificationItem = INotificationItemPush | INotificationItemEmail;

export interface INotification extends IRocketChatRecord {
	uid: string;
	rid: string;
	mid: string;
	ts: Date;
	schedule?: Date;
	sending?: Date;
	error?: string;
	items: NotificationItem[];
}

export interface INotificationDesktop {
	title: string;
	text: string;
	icon?: string;
	duration?: number;
	// Force the notification to stay until the user interacts with it, regardless of the recipient's
	// `desktopNotificationRequireInteraction` preference.
	requireInteraction?: boolean;
	// Optional action buttons rendered on the notification (desktop app only; ignored elsewhere).
	actions?: {
		action: string;
		title: string;
	}[];
	payload: {
		_id: IMessage['_id'];
		rid: IMessage['rid'];
		tmid?: IMessage['tmid'];
		sender: IMessage['u'];
		// Omitted by notifications that aren't about a room the recipient can open — a conference ring, for
		// one. Without a name the click doesn't navigate anywhere, which is the point.
		type?: IRoom['t'];
		name?: IRoom['name'];
		// When set, the notification can offer a "Join" action that opens this conference directly.
		conferenceId?: string;
		message: {
			msg: IMessage['msg'];
			t?: IMessage['t'];
			content?: IMessage['content'];
		};
		audioNotificationValue: ISubscription['audioNotificationValue'];
	};
}

export interface ICalendarNotification {
	title: string;
	text: string;
	payload: {
		_id: ICalendarEvent['_id'];
		startTimeUtc?: string;
	};
}
