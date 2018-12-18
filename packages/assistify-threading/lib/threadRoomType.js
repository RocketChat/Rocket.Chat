import { Meteor } from 'meteor/meteor';
import { RocketChat, RoomTypeConfig } from 'meteor/rocketchat:lib';

export class ThreadRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'thread',
			order: 25,
			label: 'Threads',
		});

		// we need a custom template in order to have a custom query showing the subscriptions to threads
		this.customTemplate = 'ThreadList';
	}

	condition() {
		return RocketChat.getUserPreference(Meteor.userId(), 'sidebarGroupByType');
	}
}

RocketChat.roomTypes.add(new ThreadRoomType());
