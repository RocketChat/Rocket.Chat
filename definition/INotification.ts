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

export interface INotification {
	_id: string;
	uid: string;
	rid: string;
	mid: string;
	ts: Date;
	schedule?: Date;
	sending?: Date;
	items: NotificationItem[];
}
