import { Meteor } from 'meteor/meteor';
import { RoomTypeConfig } from '../RoomTypeConfig';

export class UnreadRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'unread',
			order: 10,
			label: 'Unread',
		});

		this.unread = true;
	}

	condition() {
		return RocketChat.getUserPreference(Meteor.userId(), 'sidebarShowUnread');
	}
}
