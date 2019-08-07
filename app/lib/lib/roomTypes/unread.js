import { Meteor } from 'meteor/meteor';

import { getUserPreference, RoomTypeConfig } from '../../../utils';

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
