import { Meteor } from 'meteor/meteor';
import { getUserPreference } from 'meteor/rocketchat:utils';
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
		return getUserPreference(Meteor.userId(), 'sidebarShowUnread');
	}
}
