import { RoomTypeConfig } from '../RoomTypeConfig';

export class UnreadRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'unread',
			order: 10,
			label: 'Unread'
		});

		this.unread = true;
	}

	condition() {
		const user = Meteor.user();
		return RocketChat.getUserPreference(user, 'sidebarShowUnread');
	}
}
